// The provisional intro, for an outing without its own scenario (spec of the portal, § 5, its title sign only): the
// sign, the passport's leather and paper, drops on its cords and swings; Cycy and Kevin hop in on each side; confetti of
// the outing's ink. A scenario like the outings' own (intros/index.js): the screen (intro.js) plays its 4.5 s timeline.
import { content } from "../../content.js";
import { sfx } from "../../audio.js";
import { h, svg } from "../../dom.js";
import { confetti, clearEffects } from "../../effects.js";
import { AVENTURES } from "../data.js";
import { formatRange, passportPages } from "../logic.js";
import * as art from "../art.js";

const gsap = window.gsap;
const LENGTH = 4.5; // s, the whole intro
const BUDDIES = ["wink", "kevin-joy"]; // the provisional chibis: Cycy on the left, Kevin on the right
const FALLBACK = "#7A1F35"; // an ink that is not #rrggbb
// their hops once landed (s): in turn, then a last one together; a hop takes 0.68 s
const HOPS = [
  [1.95, 2.65, 3.75],
  [2.3, 3, 3.75],
];
let instances = 0;

const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
/** Between two #rrggbb colours: t = 0 → a, 1 → b. */
function mix(a, b, t) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, k) => Math.round(v + (y[k] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** The band's gold stitching (shadow, thread, highlight), in px: the dashes keep their length at any width. */
function stitch(p) {
  const rect = (attrs) => `<rect width="100%" height="100%" rx="5" fill="none" ${attrs}/>`;
  return `<svg class="in-stitch" aria-hidden="true">
    ${rect(`stroke="rgba(18,0,6,.55)" stroke-width="2.6" stroke-dasharray="6.5 4.5" transform="translate(.7 1)"`)}
    ${rect(`stroke="url(#${p}-thread)" stroke-width="1.7" stroke-dasharray="6.5 4.5" stroke-linecap="round"`)}
    ${rect(`stroke="rgba(255,246,220,.55)" stroke-width=".6" stroke-dasharray="4.5 6.5" stroke-dashoffset="-1" transform="translate(-.3 -.4)"`)}
  </svg>`;
}

// the two cords, from the hook above the screen to the eyelets (11% and 89% of the sign)
const CORDS = `<svg class="in-cords" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <path class="in-cord-shade" d="M50 0L11 100M50 0L89 100"/><path class="in-cord" d="M50 0L11 100M50 0L89 100"/>
  <path class="in-cord-hi" d="M50 0L11 100M50 0L89 100"/></svg>`;

/** One hop of a buddy at `at` s: up, down, squashed on landing, its shadow shrinking while it is in the air. */
function hop(tl, { hop: body, shadow }, at, height, tilt) {
  tl.to(body, { y: -height, rotation: tilt, scaleX: 0.96, scaleY: 1.05, duration: 0.22, ease: "power2.out" }, at)
    .to(body, { y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 0.24, ease: "power2.in" }, at + 0.22)
    .to(body, { keyframes: { scaleX: [1.12, 1], scaleY: [0.86, 1] }, duration: 0.22, ease: "power1.out" }, at + 0.46)
    .to(shadow, { scaleX: 0.55, opacity: 0.45, duration: 0.22, ease: "power2.out" }, at)
    .to(shadow, { scaleX: 1, opacity: 1, duration: 0.24, ease: "power2.in" }, at + 0.22);
}

/** mount(host, { aventure, ink }): the sign and the buddies in `host` (on screen), and their paused timeline. */
export function mount(host, { aventure, ink }) {
  const p = `in${++instances}`;
  const base = /^#[0-9a-f]{6}$/i.test(ink) ? ink : FALLBACK;
  const tones = {
    "--in-ink": base,
    "--in-light": mix(base, "#f6e7c8", 0.34),
    "--in-deep": mix(base, "#12060a", 0.52),
    "--in-text": mix(base, "#2b1a1e", 0.22), // its name on the paper, a shade darker
  };
  const [name, place] = aventure.name.split(" · "); // « Premier canoë · Dordogne »: the place below, in italics
  const n = passportPages(AVENTURES)
    .flatMap((page) => page.ids || [])
    .indexOf(aventure.id);
  const i = (cls) => h("i", { class: cls, "aria-hidden": "true" });

  const foil = h("p", { class: "in-running pp-foil" }, content.aventures.title);
  const sign = h(
    "div",
    { class: "in-sign" },
    h("div", { class: "in-band pp-leather" }, svg(stitch(p)), foil),
    h(
      "div",
      { class: "in-card pp-paper" },
      i("pp-sec"),
      h("span", { class: "in-no" }, `Nº ${String(n + 1).padStart(2, "0")}`),
      h("h1", { class: "in-name" }, name, place && h("em", {}, place)),
      h("p", { class: "in-rule", "aria-hidden": "true" }, h("span", {}, "✦")),
      h("p", { class: "in-dates" }, formatRange(aventure.from, aventure.to)),
    ),
  );
  const hang = h("div", { class: "in-hang" }, sign, svg(CORDS), i("in-eyelet in-eyelet--l"), i("in-eyelet in-eyelet--r"));
  const glow = i("in-glow");
  const buddies = BUDDIES.map((face, k) => {
    const hop = h("div", { class: "in-hop" }, h("img", { class: "in-img", src: `assets/cyrielle/${face}.webp`, alt: "", draggable: "false" }));
    const shadow = i("in-shadow");
    return { el: h("div", { class: `in-buddy in-buddy--${k ? "r" : "l"}`, "aria-hidden": "true" }, shadow, hop), hop, shadow };
  });
  for (const [key, value] of Object.entries(tones)) host.style.setProperty(key, value);
  host.append(svg(art.defs(p)), i("in-map"), i("pp-rays"), glow, hang, ...buddies.map((b) => b.el));

  const land = 0.8; // s: the cords go taut
  const offside = (k) => (k ? 1 : -1) * (innerWidth / 2 + 40); // a buddy off its side of the screen
  gsap.set(hang, { yPercent: -100, rotation: -4 });
  gsap.set(glow, { opacity: 0, scale: 0.7 });
  buddies.forEach((b, k) => gsap.set(b.el, { x: offside(k) }));
  const timeline = gsap
    .timeline({ paused: true })
    .call(() => sfx("whoosh"), null, 0.15)
    // it drops, swinging a little, and the cords catch it: a rebound, then the swing dies down
    .to(hang, { yPercent: 0, rotation: 5, duration: land - 0.15, ease: "power2.in" }, 0.15)
    .to(hang, { y: 9, duration: 0.08, ease: "power1.out" }, land)
    .to(hang, { y: 0, duration: 0.6, ease: "elastic.out(1, 0.35)" }, land + 0.08)
    .to(hang, { keyframes: { rotation: [-4.2, 3, -2, 1.2, -0.5, 0], easeEach: "sine.inOut" }, duration: 2.7, ease: "none" }, land)
    .call(
      () => {
        sfx("ding"); // no vibration: a reload plays it before any touch
        confetti([base, tones["--in-light"], mix(base, "#ffffff", 0.55), "#D9BF8C", "#FFFDF9", "#F2B134"]);
      },
      null,
      land,
    )
    .to(glow, { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out" }, land)
    // the foil's glint sweeps the title once, as on the cover
    .fromTo(foil, { backgroundPosition: "28% 0%" }, { backgroundPosition: "-12% 0%", duration: 0.84, ease: "sine.inOut" }, land + 0.5)
    .set(foil, { backgroundPosition: "96% 0%" }, land + 1.34)
    .to(foil, { backgroundPosition: "28% 0%", duration: 1.26, ease: "sine.inOut" }, land + 1.34);
  // Cycy and Kevin jump in from their side, land squashed, then hop in turn
  buddies.forEach((b, k) => {
    const at = land + 0.1 + k * 0.12;
    const size = b.el.offsetWidth;
    timeline
      .to(b.el, { x: 0, duration: 0.62, ease: "power1.out" }, at)
      .to(b.hop, { keyframes: [{ y: -size * 0.75, duration: 0.31, ease: "power2.out" }, { y: 0, duration: 0.31, ease: "power2.in" }] }, at)
      .to(b.hop, { keyframes: { scaleX: [1.16, 1], scaleY: [0.8, 1] }, duration: 0.4, ease: "power1.out" }, at + 0.62);
    HOPS[k].forEach((when, j) => hop(timeline, b, when, size * (j === 2 ? 0.42 : 0.28), (k ? -1 : 1) * (j % 2 ? -5 : 5)));
  });
  timeline.set({}, {}, LENGTH); // its last hop lands at 4.43 s: it lasts 4.5 s

  return {
    timeline,
    ready: Promise.resolve(),
    dispose() {
      timeline.kill();
      clearEffects(); // its confetti go with it
    },
  };
}
