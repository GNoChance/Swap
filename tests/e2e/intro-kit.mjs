// The end-to-end kit of the outings' own intros (js/aventures/intros/), shared by their suites (intros.mjs for the
// Premier bivouac, intros-canoe.mjs for the Premier canoë): the screens, the scripts set before each page's first line,
// and what the page is asked (as expressions evaluated in it) or measured against. Nothing here knows an outing.
import { SCENARIOS } from "../../js/aventures/intros/index.js";

export const VIEWPORTS = [
  { name: "iPhone 393 × 852 (puis tourné en 852 × 393)", width: 393, height: 852, mobile: true, turned: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false, wide: true },
  { name: "PC 1920 × 1080", width: 1920, height: 1080, mobile: false, wide: true },
];
export const KEY = "swap-cyrielle:aventures";

/** Each moment of an outing's intro (intros/index.js): its start, and its middle (s). */
export const beatsOf = (id) => Object.fromEntries(SCENARIOS[id].beats.map(({ name, at }, k, all) => [name, { at, mid: (at + (all[k + 1]?.at ?? at + 2)) / 2 }]));

// ?graine=<save> (JSON) starts the page on that save, then drops itself from the address (as in aventures.mjs)
export const SEED = `{
  const seed = new URLSearchParams(location.search).get("graine");
  if (seed !== null) {
    localStorage.clear();
    if (seed) localStorage.setItem("${KEY}", seed);
    history.replaceState(null, "", location.pathname + location.hash);
  }
}`;
// ?decodage-rejete: decode() rejects on Cycy's front sticker in joy once it has arrived (as WebKit can, for another
// reason than a missing file); __rejected, how many times
export const REJECT = `if (location.search.includes("decodage-rejete")) {
  const decode = HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode = function () {
    return decode.call(this).then(() => {
      if (!this.src.includes("/cycy-face-joie.webp")) return;
      window.__rejected = (window.__rejected || 0) + 1;
      throw new DOMException("The source image cannot be decoded.", "EncodingError");
    });
  };
}`;
// __landedAt: when the passport's book first rests open, its arrival over (performance.now() ms)
export const LANDING = `new MutationObserver((_, watch) => {
  if (!document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]')) return;
  window.__landedAt = performance.now();
  watch.disconnect();
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["class", "data-open"] });`;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const length = `Number(document.querySelector(".screen-intro")?.dataset.length)`; // ms, as the intro says
export const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
/** The passport open on page `n`, landed, its screen fully in: a touch counts. */
export const settled = (n) => `document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"][data-page="${n}"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`;
/** « Passer ▸ » fully shown, or gone (hidden). */
export const skipIs = (state) => `(() => {
  const el = document.querySelector(".screen-intro .intro-skip");
  const style = el && getComputedStyle(el);
  return Boolean(style) && (${state === "shown" ? `style.visibility === "visible" && style.opacity === "1"` : `style.visibility === "hidden"`});
})()`;
// the intro mounted, each of its stickers loaded or failed (img.complete); its timeline may still wait for them to be
// decoded (playing)
export const loaded =`document.querySelector(".screen-intro .st-stage") && ${length} > 0 && [...document.querySelectorAll(".st-actor__img")].every((img) => img.complete)`;
// the intro's timeline (found by its length)
export const timeline = `(() => {
  const length = Number(document.querySelector(".screen-intro")?.dataset.length) / 1000;
  return gsap.globalTimeline.getChildren(false, false, true).find((child) => Math.abs(child.duration() - length) < 0.02);
})()`;
// its timeline playing: its stickers decoded (ready), not only arrived; a hold before that would be undone by its play()
export const playing = `${loaded} && ${timeline}?.paused() === false`;
// the intro's timeline, held still at exactly `t` s: what is on screen then can be measured
export const holdAt = (t) => `(() => {
  ${timeline}.pause().seek(${t});
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;
// GSAP's lag smoothing, by its effect: after a frame of 0.8 s, how far a tween went (s). GSAP's own (500, 33) drops
// that time (a few hundredths); turned off, it keeps it all
export const lagged = `(async () => {
  const frames = (n) => new Promise((resolve) => (function next(k) { k ? requestAnimationFrame(() => next(k - 1)) : resolve(); })(n));
  const probe = gsap.to({}, { duration: 60, ease: "none" });
  await frames(2);
  const t0 = probe.time();
  const until = performance.now() + 800;
  while (performance.now() < until);
  await frames(2);
  const went = probe.time() - t0;
  probe.kill();
  return went;
})()`;
// the boxes (px) of what shows (visible, and not see-through: opacity > 0 up its tree): the actors (the look each
// wears), the map's names and its pin, with the screen's size
export const sceneBoxes = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = (el) => {
    if (getComputedStyle(el).visibility !== "visible") return false;
    for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
    return true;
  };
  const actors = [...document.querySelectorAll(".st-actor")].filter(shows).map((el) => {
    const img = [...el.querySelectorAll(".st-actor__img")].find(shows);
    return img && box(img, el.dataset.who || el.dataset.vehicle);
  }).filter(Boolean);
  return {
    screen: { width: innerWidth, height: innerHeight },
    actors,
    names: [...document.querySelectorAll(".st-name")].map((el) => box(el, el.textContent)),
    pin: [...document.querySelectorAll(".st-pin")].map((el) => box(el, "épingle"))[0],
  };
})()`;
export const round = (b) => ({ ...b, left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) });
/** The boxes not entirely inside the screen (half a px of rounding allowed). */
export const outside = (screen, boxes) => boxes.filter((b) => !b || b.left < -0.5 || b.top < -0.5 || b.right > screen.width + 0.5 || b.bottom > screen.height + 0.5);

/** Every box entirely inside the screen (half a px of rounding allowed). */
export function inside({ screen, boxes }, where) {
  const out = outside(screen, boxes);
  if (!boxes.length) throw new Error(`${where} : pas de cadre ni de lettrage`);
  if (out.length) throw new Error(`${where} : hors de l'écran ${JSON.stringify(out.slice(0, 3).map(round))}`);
}
