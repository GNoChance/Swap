// The rubber stamp (spec § 4, « Tamponner »; docs/design/passeport/BRIEF.md, « Le tampon encreur »): a turned wooden
// handle, a brass ferrule, a rubber in the outing's ink. It comes down over the slot whose stamp waits and floats there,
// « Touche pour tamponner » under it; at a touch on it, its hint or the slot, once: it swings up, strikes the page
// (onPress at the contact), throws ink around the print, and flies off the screen. What hangs in the air lies over the
// book's right page, outside its leaves (they clip; style.css hides it while one turns); the ink lies on the page.
import { content } from "../content.js";
import { h, svg } from "../dom.js";

const gsap = window.gsap;
const WIDTH = 34; // u, the tool's width (its box: 120 × 150)
const CONTACT = 6; // u, from its hover down to the paper: its rubber onto its shadow
const DROPS = 12; // drops of ink thrown out at the contact
const FALLBACK = "#7A1F35"; // an ink that is not #rrggbb
let instances = 0;

/** The ink darkened `t` of the way to black (the rubber's shaded side). */
const deep = (hex, t) => `#${[1, 3, 5].map((k) => Math.round(parseInt(hex.slice(k, k + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("")}`;

/** The tool, from the maquette: knob, turned handle, brass ferrule, veined wooden block, rubber in `ink`. */
function art(p, ink) {
  const g = (id) => `url(#${p}-${id})`;
  return `<svg class="tool-art" viewBox="0 0 120 150" aria-hidden="true">
  <defs>
    <radialGradient id="${p}-tk" cx="66%" cy="30%" r="74%"><stop offset="0" stop-color="#F6D3A0"/><stop offset=".3" stop-color="#D49A5B"/><stop offset=".68" stop-color="#9A5A2A"/><stop offset="1" stop-color="#5A2E12"/></radialGradient>
    <linearGradient id="${p}-tn" x1="0" x2="1"><stop offset="0" stop-color="#5E3213"/><stop offset=".28" stop-color="#A9693A"/><stop offset=".6" stop-color="#E8B57C"/><stop offset=".82" stop-color="#B07038"/><stop offset="1" stop-color="#5E3213"/></linearGradient>
    <linearGradient id="${p}-tb" x1="0" x2="1"><stop offset="0" stop-color="#5C431C"/><stop offset=".16" stop-color="#A7854A"/><stop offset=".42" stop-color="#FFF1C8"/><stop offset=".55" stop-color="#D9BF8C"/><stop offset=".78" stop-color="#8E6E3C"/><stop offset=".9" stop-color="#C8A86C"/><stop offset="1" stop-color="#4E3815"/></linearGradient>
    <linearGradient id="${p}-tt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9BA82"/><stop offset="1" stop-color="#C98E52"/></linearGradient>
    <linearGradient id="${p}-tf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8773F"/><stop offset="1" stop-color="#7A4520"/></linearGradient>
    <linearGradient id="${p}-ts" x1="0" x2="1"><stop offset="0" stop-color="rgba(0,0,0,.28)"/><stop offset=".12" stop-color="rgba(0,0,0,0)"/><stop offset=".86" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.32)"/></linearGradient>
    <linearGradient id="${p}-tr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ink}" stop-opacity=".75"/><stop offset=".35" stop-color="${ink}"/><stop offset="1" stop-color="${deep(ink, 0.66)}"/></linearGradient>
  </defs>
  <path d="M19 127H101L99.5 136.2Q99 138.6 96.6 138.6H23.4Q21 138.6 20.5 136.2Z" fill="${g("tr")}"/>
  <path d="M23 131.2H97" stroke="rgba(255,255,255,.38)" stroke-width="1" stroke-linecap="round"/>
  <path d="M30 138.6Q30 141.6 31.6 141.6Q33.2 141.6 33.2 138.6Z M82 138.6Q82 140.4 83.2 140.4Q84.4 140.4 84.4 138.6Z" fill="${ink}"/>
  <path d="M13 103H107V124.6Q107 128 103.6 128H16.4Q13 128 13 124.6Z" fill="${g("tf")}"/>
  <path d="M13 103H107V124.6Q107 128 103.6 128H16.4Q13 128 13 124.6Z" fill="${g("ts")}"/>
  <path d="M15 108.6C38 106.4 66 110.6 105 107.4M15 114.4C44 116.8 70 111.6 105 115.6M15 120.6C36 118.6 82 123 105 119.8M48 104.5C56 106.8 62 105 70 107.2" fill="none" stroke="rgba(72,34,12,.34)" stroke-width=".75"/>
  <path d="M23.5 91.5H96.5L107 103H13Z" fill="${g("tt")}"/>
  <path d="M13.6 103H106.4" stroke="rgba(255,238,206,.75)" stroke-width="1"/>
  <path d="M28 94.6C46 93.4 70 95.6 92 94.2M20 99.4C46 98 74 100.6 100 99" fill="none" stroke="rgba(120,62,24,.22)" stroke-width=".7"/>
  <ellipse cx="60" cy="96.6" rx="18.5" ry="4.6" fill="rgba(70,34,12,.45)"/>
  <path d="M43.5 96C47 90.2 52.4 88.6 60 88.6S73 90.2 76.5 96C72 98.8 66.4 99.6 60 99.6S48 98.8 43.5 96Z" fill="${g("tn")}"/>
  <path d="M48.6 74.5H71.4V90.6C71.4 92.6 66.3 94 60 94S48.6 92.6 48.6 90.6Z" fill="${g("tb")}"/>
  <path d="M48.6 79.6C52 81.2 68 81.2 71.4 79.6M48.6 85.4C52 87 68 87 71.4 85.4" fill="none" stroke="rgba(70,48,14,.55)" stroke-width=".9"/>
  <path d="M48.6 80.6C52 82.2 68 82.2 71.4 80.6M48.6 86.4C52 88 68 88 71.4 86.4" fill="none" stroke="rgba(255,244,210,.55)" stroke-width=".6"/>
  <ellipse cx="60" cy="74.5" rx="11.4" ry="3.1" fill="#EAD39F"/>
  <ellipse cx="60" cy="74.5" rx="11.4" ry="3.1" fill="none" stroke="rgba(92,67,28,.6)" stroke-width=".6"/>
  <path d="M52.6 75.4C53.4 69 55.4 63.8 55.4 58.6C55.4 55 53 52 50.2 48.6H69.8C67 52 64.6 55 64.6 58.6C64.6 63.8 66.6 69 67.4 75.4C63 76.8 57 76.8 52.6 75.4Z" fill="${g("tn")}"/>
  <path d="M58.6 52C60 57 59.4 64 61 72" fill="none" stroke="rgba(255,236,200,.5)" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="60" cy="31" r="21.5" fill="${g("tk")}"/>
  <path d="M42.6 26.4C50 22 58 23.4 66 20.6M40.4 34C50 30.6 62 33.2 79 28.6M44 42C54 39 66 42.4 76.4 38.6" fill="none" stroke="rgba(86,42,14,.28)" stroke-width=".8" stroke-linecap="round"/>
  <ellipse cx="67.4" cy="22.6" rx="6.6" ry="4.2" transform="rotate(-28 67.4 22.6)" fill="rgba(255,248,232,.55)"/>
  <circle cx="70.4" cy="20.6" r="1.6" fill="rgba(255,255,255,.85)"/>
</svg>`;
}

// the hint's finger mark: a dot and two rings (GSAP sends the rings out); one line, so the hint's text is its words
const ring = (r, width, opacity) => `<circle class="hint-ring" cx="12" cy="12" r="${r}" fill="none" stroke="currentColor" stroke-width="${width}" opacity="${opacity}"/>`;
const TAP = `<svg class="hint-tap" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.4" fill="currentColor"/>${ring(7, 1.4, 0.55)}${ring(10.6, 1.1, 0.28)}</svg>`;

/** createStamper({ slot, ink, onPress }): { el (.pp-tool, data-state coming → waiting → struck), dispose() }.
 *  slot: the .pp-slot, on the page on show; onPress(): at the contact, once. After its flight it clears itself away;
 *  dispose() takes everything away at once (twice is harmless). */
export function createStamper({ slot, ink, onPress }) {
  const p = `tool${++instances}`;
  const color = /^#[0-9a-f]{6}$/i.test(ink) ? ink : FALLBACK;
  const page = slot.parentElement; // a face of a leaf
  const per = page.offsetWidth / 100 || 1; // px per u: the slot's box is kept in u, so it follows any resize
  const box = ["Left", "Top", "Width", "Height"].map((k, i) => `--s${"xywh"[i]}:${(slot[`offset${k}`] / per).toFixed(2)}`).join(";");

  const shadow = h("i", { class: "pp-tool-shadow", "aria-hidden": "true" });
  const el = h("div", { class: "pp-tool", "data-state": "coming", "aria-hidden": "true" }, svg(art(p, color)));
  const hint = h("div", { class: "pp-tool-hint" }, svg(TAP), h("span", {}, content.aventures.stampHint));
  const air = h("div", { class: "pp-air", style: box }, shadow, el, hint);
  const drops = Array.from({ length: DROPS }, () => h("i", {}));
  const spray = h("div", { class: "pp-ink", style: `${box};--drop:${color}`, "aria-hidden": "true" }, drops);
  slot.closest(".pp-book").append(air);
  page.append(spray);

  const unit = () => el.offsetWidth / WIDTH; // px per u, now
  /** The y that takes it off the top of the screen, from its place. */
  const above = () => -(el.getBoundingClientRect().bottom - gsap.getProperty(el, "y") + 40);
  let floats = [];
  let strike = null;
  let splash = null;
  let armed = false; // a touch began on it since it came
  let struck = false;
  let disposed = false;

  gsap.set(el, { transformOrigin: "50% 94%" }); // its rubber: it squashes onto the paper
  gsap.set(hint, { xPercent: -50, yPercent: -50 });
  // down from above the screen, righting itself; its shadow grows as it nears the paper; then it floats, and once its
  // hint is out it is waiting (a touch counts from the start, though)
  const descent = gsap
    .timeline({ onComplete: () => (el.dataset.state = "waiting") })
    .fromTo(el, { y: above, rotation: -9 }, { y: 0, duration: 0.8, ease: "power3.out" })
    .to(el, { rotation: 0, duration: 0.6, ease: "back.out(2.6)" }, 0.2)
    .fromTo(shadow, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.in" }, 0)
    .call(hover, null, 0.8)
    .fromTo(hint, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.65);

  /** It floats 6 px up and down, its shadow breathing; the hint's rings go out. */
  function hover() {
    const rings = hint.querySelectorAll(".hint-ring");
    floats = [
      gsap.to(el, { y: -6, duration: 1.3, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(shadow, { scale: 0.88, opacity: 0.75, duration: 1.3, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.fromTo(rings, { scale: 0.7, opacity: 0.7 }, { scale: 1.35, opacity: 0, transformOrigin: "50% 50%", duration: 1.5, ease: "sine.out", stagger: 0.4, repeat: -1 }),
    ];
  }

  // a touch that began before it came is not its own, though its pointerdown may reach it: the touch that landed the
  // book had it made at once (screen.js), within that very pointerdown's dispatch
  const born = performance.now();
  const arm = (e) => e.timeStamp >= born && (armed = true);
  const tap = () => armed && press();
  const targets = [el, hint, slot];
  for (const target of targets) {
    target.addEventListener("pointerdown", arm);
    target.addEventListener("click", tap);
  }
  function off() {
    for (const target of targets) {
      target.removeEventListener("pointerdown", arm);
      target.removeEventListener("click", tap);
    }
  }

  /** The touch: the swing (up 30 px), the strike (squashed onto the paper), the contact, then up and away (0.5 s). */
  function press() {
    if (struck || disposed) return;
    struck = true;
    off();
    el.dataset.state = "struck";
    descent.kill();
    floats.forEach((tween) => tween.kill());
    const u = unit();
    strike = gsap
      .timeline({ onComplete: () => air.remove() })
      .to(hint, { autoAlpha: 0, scale: 0.8, duration: 0.18, ease: "power2.in" }, 0)
      .to(el, { y: -30, rotation: -2, scaleX: 0.97, scaleY: 1.04, duration: 0.25, ease: "power2.out" }, 0)
      .to(shadow, { scale: 0.72, opacity: 0.5, duration: 0.25, ease: "power2.out" }, 0)
      .to(el, { y: CONTACT * u, rotation: 0, scaleX: 1.06, scaleY: 0.88, duration: 0.12, ease: "power4.in" }, 0.25)
      .to(shadow, { scale: 1.15, opacity: 1, duration: 0.12, ease: "power4.in" }, 0.25)
      .call(contact, null, 0.37)
      .to(el, { y: -14, scaleX: 0.97, scaleY: 1.05, duration: 0.14, ease: "power2.out" }, 0.45) // pressed a moment, then up
      .to(shadow, { scale: 0.75, opacity: 0.45, duration: 0.14, ease: "power2.out" }, 0.45)
      .to(el, { y: above, x: 10 * u, rotation: 18, scaleX: 1, scaleY: 1, duration: 0.36, ease: "power2.in" }, 0.59)
      .to(shadow, { scale: 0.3, opacity: 0, duration: 0.3, ease: "power1.in" }, 0.59);
  }

  function contact() {
    throwInk();
    onPress?.();
  }

  /** 12 drops around the print, round ones and streaks, thrown out from under its rim; they soak in by 0.8 s. */
  function throwInk() {
    const u = unit();
    splash = gsap.timeline({ onComplete: () => spray.remove() });
    drops.forEach((drop, k) => {
      const a = ((k + 0.25 + Math.random() * 0.5) / DROPS) * Math.PI * 2;
      const streak = k % 3 === 1;
      const w = streak ? 2.6 + Math.random() * 1.6 : 0.8 + Math.random() * 1.3;
      drop.style.setProperty("--w", w.toFixed(2));
      drop.style.setProperty("--h", (streak ? 0.7 + Math.random() * 0.3 : w * (0.8 + Math.random() * 0.25)).toFixed(2));
      const from = 22 + Math.random() * 3;
      const to = from + 4 + Math.random() * (streak ? 9 : 6);
      const [dx, dy] = [Math.cos(a) * u, Math.sin(a) * 0.86 * u]; // the slot is wider than tall
      splash
        .fromTo(
          drop,
          { xPercent: -50, yPercent: -50, x: dx * from, y: dy * from, rotation: (a * 180) / Math.PI, scale: 0.2, opacity: 0.95 },
          { x: dx * to, y: dy * to, scale: 1, duration: 0.2 + Math.random() * 0.12, ease: "expo.out" },
          Math.random() * 0.03,
        )
        .to(drop, { opacity: 0, scale: 0.85, duration: 0.32, ease: "power1.in" }, 0.4 + Math.random() * 0.06);
    });
  }

  return {
    el,
    dispose() {
      if (disposed) return;
      disposed = true;
      off();
      for (const anim of [descent, strike, splash, ...floats]) anim?.kill();
      air.remove();
      spray.remove();
    },
  };
}
