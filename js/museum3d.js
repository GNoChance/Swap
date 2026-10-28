// The gallery of our matches in real 3D (Three.js): a bright museum room, one painting per match, oldest first.
// The page scrolls natively, one snap stop per painting (as in the CSS gallery, js/museum.js, kept as the fallback);
// a spring follows the scroll and moves the camera along its rail (gallery3d/rail.js). The canvas only redraws while
// something moves. For the end-to-end tests the screen exposes its state: data-ready, data-stop, data-moving and
// data-frame (the painting on screen, « left,top,right,bottom » in CSS px).
import * as THREE from "./vendor/three.module.min.js";
import { Reflector } from "./vendor/Reflector.js";
import { content } from "./content.js";
import { nextMatchIndex } from "./logic.js";
import { ROOM, railPose, springStep } from "./gallery3d/rail.js";
import { loadFonts, paintingCanvas, cartelCanvas, parquetCanvas, plasterCanvas, haloCanvas } from "./gallery3d/textures.js";
import { buildRoom } from "./gallery3d/room.js";
import { addDecor } from "./gallery3d/decor.js";
import { sfx, unlockAudio } from "./audio.js";
import { h } from "./dom.js";

const gsap = window.gsap;
const VFOV = 55;

/** onFail: no WebGL after all, or the context is lost (iPhone in the background): the CSS gallery takes over. */
export function museum3dScreen({ onBack, onFail }) {
  const m = content.museum;
  const { matches, clubs } = m;
  const count = matches.length;
  const stops = count + 2; // the entrance, one stop per painting, the end
  const next = nextMatchIndex(matches);

  const view = h("div", { class: "g3d-view", "aria-hidden": "true" });
  const track = h("div", { class: "mu-track" });
  const intro = h(
    "div",
    { class: "mu-intro" },
    h("p", { class: "eyebrow" }, m.kicker),
    h("h1", { class: "mu-title" }, m.title),
    h("p", { class: "mu-subtitle" }, m.subtitle),
    h("p", { class: "mu-hint" }, m.hint, h("span", { "aria-hidden": "true" }, " ↓")),
  );
  const overlays = h("div", { class: "mu-overlays" }, intro);
  const loader = h("div", { class: "g3d-loader" }, h("p", {}, m.loading));
  const backButton = h(
    "button",
    {
      class: "mu-back",
      type: "button",
      onclick() {
        sfx("tap");
        onBack();
      },
    },
    m.back,
  );
  const el = h("section", { class: "screen screen-g3d" }, view, track, overlays, loader, backButton);

  let left = false;
  let renderer = null;
  let camera = null;
  let room = null;
  let decor = null;
  let stopH = innerHeight;
  let size = { w: innerWidth, h: innerHeight };
  let spring = { x: 0, v: 0 };
  let target = 0;
  let settledAt = 0; // the stop it last came to rest at
  let frame = 0;
  let last = 0;
  let wasMoving = false;

  function layoutTrack() {
    stopH = innerHeight;
    track.style.height = `${stops * stopH}px`;
    track.replaceChildren(
      ...Array.from({ length: stops }, (_, k) => {
        const stop = h("div", { class: "mu-stop", "aria-hidden": "true" });
        stop.style.top = `${k * stopH}px`;
        stop.style.height = `${stopH}px`;
        return stop;
      }),
    );
  }

  function applyPose() {
    const { cam } = railPose(spring.x, count, size.w / size.h, VFOV, 0, ROOM);
    camera.position.set(cam.x, cam.y, cam.z);
    camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
    intro.style.opacity = Math.max(0, 1 - spring.x * 2.4).toFixed(3);
    intro.style.visibility = spring.x > 0.45 ? "hidden" : "";
  }

  /** The painting at stop k, projected on screen (CSS px), for the tests. */
  function frameRect(k) {
    if (k < 1 || k > count) return "";
    const box = new THREE.Box3().setFromObject(room.frames[k - 1]);
    const xs = [];
    const ys = [];
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          xs.push(((p.x + 1) / 2) * size.w);
          ys.push(((1 - p.y) / 2) * size.h);
        }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(Math.round).join(",");
  }

  /** Came to rest at stop k. */
  function settle(k) {
    settledAt = k;
    room.aimSpot(k >= 1 && k <= count ? k - 1 : -1);
    renderer.render(room.scene, camera); // with the spot on it
    el.dataset.tris = String(renderer.info.render.triangles);
    el.dataset.stop = String(k);
    el.dataset.frame = frameRect(k);
  }

  function tick(now) {
    frame = 0;
    if (left) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    spring = springStep(spring, target, dt);
    const moving = Math.abs(spring.x - target) > 0.002 || Math.abs(spring.v) > 0.004;
    if (!moving) spring = { x: target, v: 0 };
    if (moving && !wasMoving) room.aimSpot(-1);
    applyPose();
    renderer.render(room.scene, camera);
    el.dataset.moving = moving ? "1" : "0";
    if (wasMoving && !moving) settle(Math.round(target));
    wasMoving = moving;
    if (moving) request();
  }

  function request() {
    if (frame || left || !renderer) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function onScroll() {
    target = Math.max(0, Math.min(stops - 1, scrollY / stopH));
    el.dataset.moving = "1";
    wasMoving = true;
    request();
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (left || !renderer) return;
      const sameWidth = Math.abs(innerWidth - size.w) < 2;
      size = { w: innerWidth, h: innerHeight };
      renderer.setSize(size.w, size.h);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      // Safari's bars coming and going only change the height a little: the stops stay where they are
      if (!sameWidth || Math.abs(innerHeight - stopH) > 150) {
        const k = settledAt;
        layoutTrack();
        scrollTo(0, k * stopH);
        target = k;
        spring = { x: k, v: 0 };
      }
      applyPose();
      settle(settledAt);
    }, 200);
  }

  function fail() {
    if (left) return;
    onFail();
  }

  async function build() {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return fail();
    }
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size.w, size.h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      fail();
    });
    view.append(renderer.domElement);
    camera = new THREE.PerspectiveCamera(VFOV, size.w / size.h, 0.05, 120);

    await loadFonts();
    if (left) return;
    const works = await Promise.all(
      matches.map(async (match, i) => {
        const ctx = { clubs, labels: m, venues: m.venues, upcoming: match.score ? null : i === next ? "next" : "soon" };
        return { painting: await paintingCanvas(match, ctx), cartel: cartelCanvas(match, ctx), final: Boolean(match.final) };
      }),
    );
    if (left) return;
    room = buildRoom(THREE, {
      count,
      room: ROOM,
      canvases: { parquet: parquetCanvas(), plaster: plasterCanvas(), halo: haloCanvas() },
      works,
      Reflector,
      anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
      mirrorSize: { w: Math.round((size.w * pixelRatio) / 2), h: Math.round((size.h * pixelRatio) / 2) },
    });
    decor = addDecor(THREE, room.scene, {
      count,
      room: ROOM,
      finalIndex: matches.findIndex((match) => match.final),
      title: m.title,
      subtitle: m.subtitle,
      end: m.end,
      endNote: m.endNote,
    });
    applyPose();
    renderer.render(room.scene, camera);
    settle(0);
    el.dataset.moving = "0";
    el.dataset.ready = "1";
    gsap.to(loader, { autoAlpha: 0, duration: 0.5, onComplete: () => loader.remove() });
  }

  return {
    el,
    noHome: true,
    enter() {
      document.documentElement.classList.add("is-museum");
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onResize);
      addEventListener("pointerdown", unlockAudio, { once: true });
      layoutTrack();
      scrollTo(0, 0);
      build().catch(fail);
    },
    leave() {
      left = true;
      document.documentElement.classList.remove("is-museum", "is-locked");
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      decor?.dispose();
      room?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss(); // free the GPU memory now (iPhone)
        renderer.domElement.remove();
      }
    },
  };
}
