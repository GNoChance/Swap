// The gallery of our matches in real 3D (Three.js): a bright museum room, one painting per match, oldest first.
// The page scrolls natively, one snap stop per painting (as in the CSS gallery, js/museum.js, kept as the fallback);
// a spring follows the scroll and moves the camera along its rail (gallery3d/rail.js). The canvas only redraws while
// something moves. For the end-to-end tests the screen exposes its state: data-ready, data-stop, data-moving and
// data-frame (the painting on screen, « left,top,right,bottom » in CSS px).
import * as THREE from "./vendor/three.module.min.js";
import { Reflector } from "./vendor/Reflector.js";
import { content } from "./content.js";
import { nextMatchIndex, museumReaction, cartelText } from "./logic.js";
import { ROOM, railPose, springStep } from "./gallery3d/rail.js";
import { loadFonts, paintingCanvas, cartelCanvas, parquetCanvas, plasterCanvas, haloCanvas } from "./gallery3d/textures.js";
import { buildRoom } from "./gallery3d/room.js";
import { addDecor } from "./gallery3d/decor.js";
import { createVisitors } from "./gallery3d/visitors.js";
import { souvenirPanel } from "./gallery3d/souvenirs.js";
import { sfx, unlockAudio } from "./audio.js";
import { confetti } from "./effects.js";
import { h } from "./dom.js";

const gsap = window.gsap;
const VFOV = 55;
const NAP = 25000; // standing still this long in front of a painting: they sit down and doze off
const GOLD = ["#c9a15b", "#e6cb8f", "#f3dfb0", "#7a1733", "#ffffff"];
const clock = () => performance.now() / 1000;

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
  const moreButton = h("button", { class: "g3d-more", type: "button", onclick: openSouvenirs }, m.more);
  const el = h("section", { class: "screen screen-g3d" }, view, track, overlays, moreButton, loader, backButton);
  el.dataset.panel = "closed";

  let left = false;
  let renderer = null;
  let camera = null;
  let room = null;
  let decor = null;
  let visitors = null;
  let lastStop = -1; // the stop they last reacted at
  let reactions = 0;
  let stepTimer = null;
  let nap = null;
  let stopH = innerHeight;
  let size = { w: innerWidth, h: innerHeight };
  let spring = { x: 0, v: 0 };
  let target = 0;
  let settledAt = 0; // the stop it last came to rest at
  let frame = 0;
  let last = 0;
  let wasMoving = false;
  const zoom = { v: 0 }; // « En savoir plus »: 0 in the corridor, 1 close to the painting
  let panel = null;
  let busy = false; // opening or closing the souvenirs

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

  /** Places the camera; returns the visitors' pose. */
  function applyPose() {
    const { cam, visitors: pose } = railPose(spring.x, count, size.w / size.h, VFOV, zoom.v, ROOM);
    camera.position.set(cam.x, cam.y, cam.z);
    camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
    camera.updateMatrixWorld();
    intro.style.opacity = Math.max(0, 1 - spring.x * 2.4).toFixed(3);
    intro.style.visibility = spring.x > 0.45 ? "hidden" : "";
    return pose;
  }

  function showState() {
    el.dataset.faces = visitors.faces();
    el.dataset.reactions = String(reactions);
    el.dataset.swapped = visitors.isSwapped() ? "1" : "0";
  }

  function startWalking() {
    hideMore();
    if (stepTimer) return;
    lastStop = -1;
    clearTimeout(nap);
    visitors.walking(true);
    visitors.swap(false);
    sfx("step");
    stepTimer = setInterval(() => sfx("step"), 340);
    showState();
  }

  function stopWalking() {
    clearInterval(stepTimer);
    stepTimer = null;
    visitors.walking(false);
  }

  /** Arrived at stop k: they look, cheer, sulk… once per stop, only where the camera comes to rest. */
  function react(k) {
    if (k === lastStop) return;
    lastStop = k;
    reactions++;
    clearTimeout(nap);
    if (k === 0) visitors.set("look");
    else if (k === stops - 1) {
      visitors.set("turn");
      visitors.swap(true);
      sfx("reveal");
    } else {
      const match = matches[k - 1];
      const reaction = museumReaction(match);
      visitors.set(reaction);
      sfx("ding");
      if (reaction === "lose") setTimeout(() => lastStop === k && sfx("sadTrombone"), 350);
      else if (reaction === "win" || reaction === "final") {
        visitors.jump(clock());
        if (reaction === "final") {
          sfx("final");
          confetti(GOLD);
        } else setTimeout(() => lastStop === k && sfx("applause"), 300);
      }
      nap = setTimeout(() => {
        if (left || lastStop !== k) return;
        visitors.set("sleep");
        showState();
        request();
      }, NAP);
    }
    showState();
  }

  /** An object of the scene, projected on screen: [left, top, right, bottom] in CSS px. */
  function screenRect(object) {
    const box = new THREE.Box3().setFromObject(object);
    const xs = [];
    const ys = [];
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          xs.push(((p.x + 1) / 2) * size.w);
          ys.push(((1 - p.y) / 2) * size.h);
        }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(Math.round);
  }

  /** The painting at stop k on screen, for the tests. */
  const frameRect = (k) => (k >= 1 && k <= count ? screenRect(room.frames[k - 1]).join(",") : "");

  /** « En savoir plus » under the cartel of the painting she stopped at. */
  function showMore(k) {
    if (panel || busy || k < 1 || k > count) return hideMore();
    const [l, , r, b] = screenRect(room.cartels[k - 1]);
    moreButton.style.left = `${(l + r) / 2}px`;
    moreButton.style.top = `${Math.min(b + 10, size.h - 120)}px`;
    gsap.fromTo(moreButton, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" });
  }

  function hideMore() {
    gsap.killTweensOf(moreButton);
    gsap.set(moreButton, { autoAlpha: 0 });
  }

  /** One frame, outside the spring's loop (the zoom). */
  function renderNow() {
    visitors.update(clock(), applyPose(), camera);
    renderer.render(room.scene, camera);
  }

  function zoomTo(v, duration) {
    return new Promise((resolve) => gsap.to(zoom, { v, duration, ease: "power2.inOut", onUpdate: renderNow, onComplete: resolve }));
  }

  async function openSouvenirs() {
    const k = settledAt;
    if (busy || panel || left || k < 1 || k > count || el.dataset.moving !== "0") return;
    busy = true;
    sfx("tap");
    hideMore();
    clearTimeout(nap);
    document.documentElement.classList.add("is-locked");
    el.dataset.panel = "opening";
    const match = matches[k - 1];
    const upcoming = match.score ? null : k - 1 === next ? "next" : "soon";
    const text = cartelText(match, { clubs, labels: m, venues: m.venues, upcoming });
    await zoomTo(1, 0.7);
    if (left) return;
    // the score, or « UBB – Bayonne » for a match still to come
    panel = souvenirPanel(match, { labels: m, title: text.teams || text.title, onClose: closeSouvenirs });
    el.append(panel.el);
    sfx("pop");
    await panel.open();
    busy = false;
    if (!left) el.dataset.panel = "open";
  }

  async function closeSouvenirs() {
    if (busy || !panel || left) return;
    busy = true;
    el.dataset.panel = "closing";
    await panel.close();
    panel.el.remove();
    panel = null;
    await zoomTo(0, 0.6);
    busy = false;
    if (left) return;
    document.documentElement.classList.remove("is-locked");
    el.dataset.panel = "closed";
    showMore(settledAt);
  }

  /** Came to rest at stop k. */
  function settle(k) {
    settledAt = k;
    stopWalking();
    react(k);
    room.aimSpot(k >= 1 && k <= count ? k - 1 : -1);
    renderer.render(room.scene, camera); // with the spot on it
    el.dataset.tris = String(renderer.info.render.triangles);
    el.dataset.stop = String(k);
    el.dataset.frame = frameRect(k);
    showMore(k);
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
    const animating = visitors.update(clock(), applyPose(), camera);
    renderer.render(room.scene, camera);
    el.dataset.moving = moving ? "1" : "0";
    if (wasMoving && !moving) settle(Math.round(target));
    wasMoving = moving;
    if (moving || animating) request();
  }

  function request() {
    if (frame || left || !renderer) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function onScroll() {
    target = Math.max(0, Math.min(stops - 1, scrollY / stopH));
    if (Math.abs(target - settledAt) > 0.01) startWalking();
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
      visitors.update(clock(), applyPose(), camera);
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
    visitors = await createVisitors(THREE, { faces: m.faces, room: ROOM });
    if (left) return visitors.dispose();
    room.scene.add(visitors.group);
    visitors.update(clock(), applyPose(), camera);
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
      clearTimeout(nap);
      clearInterval(stepTimer);
      gsap.killTweensOf([zoom, moreButton]);
      visitors?.dispose();
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
