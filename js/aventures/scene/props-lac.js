// The night at the Ayous lake (spec § 5, moment 4): the tent unfolding from the meadow like a pop-up book, and the sky
// turning (sunset → night → sunrise) by skies fading over the evening's: the night's, navy with its moon, its stars
// lighting up, and the dawn's, pink and gold, its sun rising behind the Ossau's shoulder and a morning bird. The skies
// are markup for paper layers (pure); the tent, the stars, the sun and the bird are elements in their layer, with their
// moves on a timeline. Reads `window` only in its functions.
import { cutPiece } from "./decor.js";
import { dot, path, random } from "./geom.js";
import { cloud, sheetOf, tent } from "./props.js";
import { W } from "./stage.js";

const L = -605; // a 1600-wide layer's edges
const SKY_FOOT = 440; // where the meadows cover the sky (props.js)
const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles
const STRIPS = [112, 186, 244, 300]; // the sky's strips, as the evening's (props.js)

/** A sky in strips of paper, `tones` from the top down (5), its edges gently waving. */
function strips(tones, seed) {
  const edges = STRIPS.map((y, k) => {
    const r = random(seed + k);
    return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 9]);
  });
  return `<rect x="${L}" y="-30" width="1600" height="${SKY_FOOT + 30}" fill="${tones[0]}"/>${edges.map((edge, k) => sheetOf("paper", edge, tones[k + 1], "", SKY_FOOT)).join("")}`;
}

/** The night sky: navy strips lighter down to the ridges, faint stars, the crescent moon high on the left. */
export function nightSky() {
  const r = random(71);
  const specks = Array.from({ length: 70 }, () => dot(L + r() * 1600, 8 + r() ** 1.4 * 290, 0.5 + r() * 0.8)).join("");
  const [mx, my] = [92, 138]; // in sight on a phone held sideways too, on the second strip (its shade cuts the crescent)
  return [
    strips(["#1f2a4d", "#25325a", "#2d3b66", "#3a4673", "#4d5582"], 61),
    `<path d="${specks}" fill="#fff6dc" fill-opacity=".75"/>`,
    `<circle cx="${mx}" cy="${my}" r="30" fill="#fff1c2" fill-opacity=".1"/>`,
    cutPiece({ silhouette: dot(mx, my, 15), markup: path(dot(mx, my, 15), "#fff1c2") + path(dot(mx + 7, my - 4, 13), "#25325a"), lift: 0.5 }),
  ].join("");
}

/** The dawn sky: blue high up, lilac, then peach and gold over the ridges, two clouds lit pink. */
export function dawnSky() {
  return [strips(["#93b3d8", "#b4c3dc", "#dcc4cf", "#f2cbb2", "#f8dba8"], 81), cloud(-300, 150, 90, "paper"), cloud(30, 120, 76, "paper"), cloud(520, 160, 96, "paper")].join("");
}

const at = (layer, x) => `${x + (parseFloat(layer.style.width) - W) / 2}px`; // a stage x in a layer (its x 0 is the stage's)
const box = (cls) => Object.assign(document.createElement("span"), { className: cls });

// the stars that light up, over the sky but never over the Ossau: [x, y, size]
const STARS = [
  [34, 104, 1.1], [150, 92, 0.8], [312, 100, 1.2], [356, 168, 0.8], [58, 214, 0.9], [176, 178, 0.7], [-150, 118, 1.1], [-380, 100, 0.9],
  [-470, 206, 0.8], [520, 130, 1.1], [760, 104, 0.9], [880, 186, 0.8], [244, 52, 0.7], [-260, 168, 0.7], [640, 210, 0.8],
];
const SPARKLE = "M0-7L1.6-1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6-1.6Z";

/** stars({ layer }): the stars that light up one by one (light()), twinkling. Stars = { el, light }. */
export function stars({ layer }) {
  const el = box("st-stars");
  const list = STARS.map(([x, y, size]) => {
    const star = box("st-star");
    star.innerHTML = `<svg viewBox="-8 -8 16 16" width="${16 * size}" height="${16 * size}"><path d="${SPARKLE}" fill="#fff4c8"/><circle r="1.6" fill="#fff"/></svg>`;
    Object.assign(star.style, { left: at(layer, x - 8 * size), top: `${y - 8 * size}px`, transform: "scale(0)" }); // unlit
    el.append(star);
    return star;
  });
  layer.append(el);
  return {
    el,
    /** From `at` s, the stars light up one after another, then twinkle. */
    light(tl, when) {
      list.forEach((star, k) => {
        const t = when + k * 0.035;
        tl.fromTo(star, { scale: 0 }, { scale: 1, duration: 0.22, ease: "back.out(3)", immediateRender: false }, t).to(star, { scale: 0.6, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 1 }, t + 0.3 + (k % 3) * 0.08);
      });
    },
  };
}

/** dawnSun({ layer, x, y }): the morning sun, three paper discs (rise()). DawnSun = { el, rise }. */
export function dawnSun({ layer, x, y }) {
  const el = box("st-dawn-sun");
  el.innerHTML = `<svg viewBox="-46 -46 92 92" width="92" height="92"><circle r="44" fill="#ffe0a0" fill-opacity=".35"/>${[
    [30, "#ffd98c"],
    [22, "#ffe8b4"],
    [14, "#fff6de"],
  ]
    .map(([r, fill]) => cutPiece({ silhouette: dot(0, 0, r), markup: path(dot(0, 0, r), fill), lift: 0.5 }))
    .join("")}</svg>`;
  Object.assign(el.style, HIDDEN, { left: at(layer, x - 46), top: `${y - 46}px` });
  layer.append(el);
  return {
    el,
    /** Rises from behind the mountains in `duration` s, from `at`. */
    rise(tl, when, duration = 0.6) {
      tl.fromTo(el, { autoAlpha: 1, y: 70 }, { y: 0, duration, ease: "power2.out", immediateRender: false }, when);
    },
  };
}

/** bird({ layer, x, y }): a little bird of the morning, flapping (fly()). Bird = { el, fly }. */
export function bird({ layer, x, y }) {
  const el = box("st-bird");
  el.innerHTML = `<svg viewBox="-10 -6 20 10" width="26" height="13"><path d="M-8 0q4-5 8 0q4-5 8 0" fill="none" stroke="#3f4458" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  Object.assign(el.style, HIDDEN, { left: at(layer, x - 13), top: `${y - 6}px` });
  layer.append(el);
  return {
    el,
    /** Flies dx, dy (stage units) in `duration` s from `at`, flapping. */
    fly(tl, when, { dx, dy, duration }) {
      tl.fromTo(el, { autoAlpha: 1, x: 0, y: 0 }, { x: dx, y: dy, duration, ease: "sine.inOut", immediateRender: false }, when);
      tl.fromTo(el, { scaleY: 1 }, { scaleY: -0.6, duration: 0.11, ease: "sine.inOut", yoyo: true, repeat: Math.round(duration / 0.11) | 1, immediateRender: false }, when);
      tl.to(el, { autoAlpha: 0, duration: 0.2 }, when + duration - 0.2);
    },
  };
}

// the tent's sheet (props.js tent()): its box in stage units, and its base's middle, where it unfolds from
const TENT = { x: 40, y: 508, w: 150, h: 100, base: [114, 590] };

/** tentUnfold({ layer }): the beige tent of the lake (props.js tent(), paper), flat on the meadow until it unfolds
 *  (unfold()) like a pop-up book. TentUnfold = { el, unfold }. */
export function tentUnfold({ layer }) {
  const el = box("st-tent");
  el.innerHTML = `<svg viewBox="${TENT.x} ${TENT.y} ${TENT.w} ${TENT.h}" width="${TENT.w}" height="${TENT.h}">${tent("paper")}</svg>`;
  Object.assign(el.style, HIDDEN, { left: at(layer, TENT.x), top: `${TENT.y}px`, transformOrigin: `${TENT.base[0] - TENT.x}px ${TENT.base[1] - TENT.y}px` });
  layer.append(el);
  return {
    el,
    /** Rises from the ground at `at` s: flat, then up past upright, then settled. → when it stands. */
    unfold(tl, when) {
      tl.fromTo(el, { autoAlpha: 1, scaleY: 0.04, scaleX: 0.8, skewX: -18 }, { scaleY: 1, scaleX: 1, skewX: 0, duration: 0.42, ease: "back.out(2.2)", immediateRender: false }, when);
      return when + 0.42;
    },
  };
}
