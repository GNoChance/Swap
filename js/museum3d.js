// The gallery of our matches in real 3D (Three.js): a bright museum room, one painting per match, oldest first.
// The page scrolls natively, one snap stop per painting (as in the CSS gallery, js/museum.js, kept as the fallback);
// a spring follows the scroll and moves the camera along its rail (gallery3d/rail.js). The canvas only redraws while
// something moves. For the end-to-end tests the screen exposes its state: data-ready, data-stop, data-moving and
// data-frame (the painting on screen, « left,top,right,bottom » in CSS px).
import * as THREE from "./vendor/three.module.min.js";
import { Reflector } from "./vendor/Reflector.js";
import { content } from "./content.js";
import { nextMatchIndex, museumReaction, cartelText, fill } from "./logic.js";
import { ROOM, railPose, springStep } from "./gallery3d/rail.js";
import { loadFonts, paintingCanvas, cartelCanvas, parquetCanvas, plasterCanvas, haloCanvas } from "./gallery3d/textures.js";
import { buildRoom } from "./gallery3d/room.js";
import { addDecor } from "./gallery3d/decor.js";
import { createVisitors } from "./gallery3d/visitors.js";
import { souvenirPanel } from "./gallery3d/souvenirs.js";
import { createStore } from "./souvenirs/store.js";
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
        // she is leaving now, not once the screen has faded out: no applause, steps or frames in between
        left = true;
        timers.forEach(clearTimeout);
        clearInterval(stepTimer);
        panel?.dispose(); // the full screen, a playing video, the live channel
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
  const timers = new Set(); // sounds a moment after arriving: cleared on leaving
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
  let store = null; // shared souvenirs (null until configured)
  let counts = {}; // match date → photos and videos, once unlocked
  const drawn = {}; // match date → the photo now on its painting
  let busy = false; // opening or closing the souvenirs

  function layoutTrack() {
    stopH = innerHeight;
    track.style.height = `calc(${(stops - 1) * stopH}px + 100lvh)`;
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
    const { cam, visitors: pose } = railPose(spring.x, count, size.w / size.h, VFOV, zoom.v, ROOM, spring.v);
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
      if (reaction === "lose") later(() => lastStop === k && sfx("sadTrombone"), 350);
      else if (reaction === "win" || reaction === "final") {
        visitors.jump(clock());
        if (reaction === "final") {
          sfx("final");
          confetti(GOLD);
        } else later(() => lastStop === k && sfx("applause"), 300);
      }
      armNap(k);
    }
    showState();
  }

  function later(fn, ms) {
    const id = setTimeout(() => (timers.delete(id), fn()), ms);
    timers.add(id);
  }

  /** Standing still in front of painting k: after NAP, they sit down and doze off. */
  function armNap(k) {
    clearTimeout(nap);
    nap = setTimeout(() => {
      if (left || lastStop !== k || panel) return;
      visitors.set("sleep");
      showState();
      request();
    }, NAP);
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

  /** « En savoir plus · n » when the match has souvenirs (known once this phone is unlocked). */
  function labelMore(k) {
    const n = (k >= 1 && k <= count && counts[matches[k - 1].date]) || 0;
    moreButton.textContent = n ? fill(m.moreCount, { n }) : m.more;
    moreButton.dataset.count = String(n);
  }

  const loadPhoto = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // a texture from another origin must be CORS-clean
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  /** Each played match's photo on its painting, on a phone where the code was typed. Quiet on any failure: the
   *  painting stays as it is. Redraws only a painting whose photo changed. A newer refresh takes over: an older one
   *  still loading (a slow network) never puts back the photo she has just replaced. */
  let paintRun = 0;
  async function refreshPaintings() {
    if (!store || !room || left) return;
    const run = ++paintRun;
    const over = () => left || run !== paintRun;
    let photos;
    try {
      if (!(await store.isUnlocked())) return;
      photos = await store.paintingPhotos();
    } catch {
      return;
    }
    for (const [i, match] of matches.entries()) {
      if (over()) return;
      if (!match.score) continue; // a match to come keeps its drape
      const want = photos[match.date] || null;
      if ((want?.id ?? null) === (drawn[match.date] ?? null)) continue;
      const img = want && (await loadPhoto(want.url));
      if (want && !img) continue;
      const canvas = await paintingCanvas(match, { clubs, labels: m, venues: m.venues, upcoming: null }, img || null);
      if (over()) return;
      room.setPainting(i, canvas);
      drawn[match.date] = want?.id ?? null;
    }
    el.dataset.covers = Object.entries(drawn)
      .filter(([, id]) => id)
      .map(([date, id]) => `${date}:${id}`)
      .join(",");
    request();
  }

  /** Fresh counts, quietly: a locked phone or no network just shows no count. */
  async function refreshCounts() {
    if (!store || !(await store.isUnlocked().catch(() => false))) return;
    counts = await store.counts().catch(() => counts);
    if (!left) labelMore(settledAt);
  }

  /** « En savoir plus » under the cartel of the painting she stopped at. */
  function showMore(k) {
    if (panel || busy || k < 1 || k > count) return hideMore();
    labelMore(k);
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
    if (left) return;
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
    panel = souvenirPanel(match, { labels: m, title: text.teams || text.title, onClose: closeSouvenirs, store });
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
    if (left) return;
    await zoomTo(0, 0.6);
    busy = false;
    if (left) return;
    scrollTo(0, settledAt * stopH); // back where she stood, whatever the keyboard did to the page
    document.documentElement.classList.remove("is-locked");
    el.dataset.panel = "closed";
    showMore(settledAt);
    if (settledAt >= 1 && settledAt <= count) armNap(settledAt);
    refreshCounts();
    refreshPaintings();
  }

  /** Came to rest at stop k: they react, then the framing is refreshed. */
  function arrive(k) {
    stopWalking();
    react(k);
    refresh(k);
    if (k >= 1 && k <= count) refreshCounts();
  }

  /** A finger held between two paintings: they stop and look, no reaction, no button. */
  function pause() {
    stopWalking();
    visitors.set("look");
    showState();
    hideMore();
  }

  /** At rest at stop k: the spot, the state for the tests, « En savoir plus » (also after a resize, no reaction). */
  function refresh(k) {
    settledAt = k;
    room.aimSpot(k >= 1 && k <= count ? k - 1 : -1);
    renderer.render(room.scene, camera); // with the spot on it
    el.dataset.tris = String(renderer.info.render.triangles);
    el.dataset.programs = String(renderer.info.programs.length);
    el.dataset.stop = String(k);
    el.dataset.frame = frameRect(k);
    showMore(k);
  }

  function tick(now) {
    frame = 0;
    if (left) return;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    spring = springStep(spring, target, dt);
    const moving = Math.abs(spring.x - target) > 0.002 || Math.abs(spring.v) > 0.004;
    if (!moving) spring = { x: target, v: 0 };
    const animating = visitors.update(clock(), applyPose(), camera);
    renderer.render(room.scene, camera);
    el.dataset.moving = moving ? "1" : "0";
    if (wasMoving && !moving) {
      const k = Math.round(target);
      if (Math.abs(target - k) < 0.03) arrive(k);
      else pause();
    }
    wasMoving = moving;
    if (moving || animating) request();
  }

  function request() {
    if (frame || left || !renderer) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!visitors) return; // still loading: build() starts from the top
    if (panel || busy) return; // the panel's keyboard or a focused field scrolls the page: the visit stays put
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
      if (left || !visitors) return; // still loading: build() takes the size at the end
      const sameWidth = Math.abs(innerWidth - size.w) < 2;
      size = { w: innerWidth, h: innerHeight };
      renderer.setSize(size.w, size.h, false);
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
      // walking: the walk goes on and arrives by itself; at rest: reframe only, never a second reaction
      if (wasMoving) return request();
      renderNow();
      refresh(settledAt);
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
    renderer.setSize(size.w, size.h, false);
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
    store = await createStore().catch(() => null);
    visitors = await createVisitors(THREE, { faces: m.faces, room: ROOM });
    if (left) return visitors.dispose();
    room.scene.add(visitors.group);
    // she may have scrolled or turned the phone while it loaded: start at the entrance, at the current size
    size = { w: innerWidth, h: innerHeight };
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    layoutTrack();
    scrollTo(0, 0);
    target = 0;
    spring = { x: 0, v: 0 };
    wasMoving = false;
    document.documentElement.classList.remove("is-locked");
    renderer.compile(room.scene, camera); // every shader now, under the loader, rather than at the first painting
    renderNow();
    arrive(0);
    el.dataset.covers = "";
    refreshPaintings();
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
      document.documentElement.classList.add("is-locked"); // no scrolling under « La galerie ouvre ses portes… »
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
      timers.forEach(clearTimeout);
      panel?.dispose();
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
