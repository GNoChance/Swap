// The valley's pieces (spec § 5, moment 2): the Ossau valley at Bious-Artigues on a May morning, in paper. The blue
// sky, the snowy peaks at the back of the V, its two great green and rocky slopes with their fir trees, the meadow at
// the bottom with the paved path and the parking's gravel, big firs and rocks in front. Paper only: the valley never
// becomes the poster. Pure: markup only, the same for the same arguments.
import { cutPiece } from "./decor.js";
import { blob, curve, edgeAt, n, path, poly, random, topEdge, tuft } from "./geom.js";
import { forest, piece, rock, sheetOf } from "./props.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
const SKIN = "paper";

/** The sky of May: blue paper strips paler down to the peaks, a high sun, a few white clouds. */
export function sky() {
  const strips = [150, 236, 300].map((y, k) => {
    const r = random(91 + k);
    return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 8]);
  });
  const tones = ["#76abd8", "#8dbbe0", "#a8cbe8", "#c5ddef"];
  const clouds = [
    [-430, 120, 120],
    [-120, 70, 90],
    [70, 178, 70],
    [250, 96, 104],
    [560, 150, 110],
    [820, 84, 90],
  ]
    .map(([x, y, w]) => {
      const k = w / 100;
      const at = ([px, py]) => [x + px * k, y + py * k];
      const body = blob([[6, 34], [0, 26], [10, 18], [26, 14], [36, 4], [56, 6], [66, 14], [84, 12], [96, 22], [92, 34]].map(at));
      const belly = blob([[12, 33], [40, 29], [70, 30], [90, 32], [60, 35.5]].map(at));
      return piece(SKIN, body, path(body, "#ffffff") + path(belly, "#dfe9f2"), "", 0.8);
    })
    .join("");
  const sun = [
    [30, "#fff3c8"],
    [21, "#fff9e4"],
  ]
    .map(([r, fill]) => piece(SKIN, `M${-80 - r} 70a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, `<circle cx="-80" cy="70" r="${r}" fill="${fill}"/>`, "", 0.5))
    .join("");
  return [`<rect x="${L}" y="-30" width="1600" height="560" fill="${tones[0]}"/>`, sun, ...strips.map((edge, k) => sheetOf(SKIN, edge, tones[k + 1], "", 530)), clouds].join("");
}

/** The snowy peaks at the back of the V, blue-grey with the distance, lit from the east (the morning), the dark
 *  forests at their feet. */
export function mountains() {
  const back = [[L, 330], [-300, 300], [-140, 262], [-40, 282], [60, 226], [110, 252], [196, 166], [262, 232], [300, 212], [360, 262], [480, 240], [620, 286], [800, 270], [R, 300], [R, 520], [L, 520]];
  const lit = [
    [[196, 166], [262, 232], [238, 340], [204, 340]],
    [[60, 226], [110, 252], [96, 330], [68, 330]],
    [[300, 212], [360, 262], [340, 340], [306, 340]],
    [[-140, 262], [-40, 282], [-60, 340], [-130, 340]],
    [[480, 240], [620, 286], [560, 340], [494, 340]],
  ];
  const snow = [
    [[196, 166], [224, 194], [208, 198], [196, 190], [178, 200], [170, 192]],
    [[60, 226], [80, 238], [66, 244], [52, 238], [44, 242]],
    [[300, 212], [322, 230], [306, 234], [294, 228], [282, 232]],
    [[-140, 262], [-118, 274], [-134, 280], [-154, 276]],
    [[480, 240], [508, 254], [490, 260], [470, 256], [458, 260]],
  ];
  const woods = [[L, 420], [-200, 400], [40, 392], [196, 372], [360, 392], [600, 404], [R, 420], [R, 520], [L, 520]];
  const snowD = snow.map(poly).join("");
  return [
    piece(SKIN, poly(back), path(poly(back), "#97a0b6") + path(lit.map(poly).join(""), "#bcc3d2"), topEdge(back), 0.7),
    piece(SKIN, snowD, path(snowD, "#fbf8f2"), "", 0.3),
    piece(SKIN, poly(woods), path(poly(woods), "#6c8592"), topEdge(woods), 0.5),
  ].join("");
}

// the V: its two great slopes, from high on the sides down to the bottom of the valley
const SLOPE_L = [[L, 40], [-420, 54], [-260, 76], [-120, 108], [-30, 146], [30, 192], [76, 250], [116, 318], [148, 390], [172, 446], [192, 486], [204, 500]];
const SLOPE_R = [[206, 500], [218, 486], [238, 446], [262, 390], [294, 318], [334, 250], [380, 192], [440, 146], [530, 108], [670, 76], [830, 54], [R, 40]];

/** Fir trees on a slope (its top `edge`) between x0 and x1, more of them low down, bigger as they come near. */
function firs(edge, x0, x1, count, seed) {
  const r = random(seed);
  const list = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const top = edgeAt(edge, x) + 16;
    const y = top + (500 - top) * r() ** 0.6;
    list.push([x, y, 13 + (y - 80) * 0.045 + r() * 5]);
  }
  return list.sort((a, b) => a[1] - b[1]);
}

/** The two great slopes of the V, the left one in the morning sun, both green with their rocky bands and screes,
 *  their fir trees. */
export function slopes() {
  const left = [...SLOPE_L, [204, 800], [L, 800]];
  const right = [...SLOPE_R, [R, 800], [206, 800]];
  const alpine = [[L, 40], [-420, 54], [-260, 76], [-120, 108], [-30, 146], [30, 192], [56, 226], [-20, 210], [-140, 160], [-300, 120], [L, 100]];
  const rocks = [
    [[-200, 120], [-130, 130], [-150, 170], [-220, 160]],
    [[10, 220], [44, 236], [34, 262], [0, 250]],
    [[90, 330], [112, 342], [102, 366], [82, 356]],
    [[300, 330], [324, 318], [326, 346], [304, 356]],
    [[420, 190], [480, 168], [486, 200], [430, 214]],
    [[620, 110], [700, 96], [696, 130], [630, 140]],
  ];
  const scree = [
    [[-46, 196], [-30, 198], [6, 300], [-42, 312], [-74, 302]], // a fan of stones under a rocky band
    [[372, 232], [386, 230], [414, 330], [380, 342], [350, 334]],
  ];
  return [
    cutPiece({ silhouette: poly(left), markup: path(poly(left), "#6f9d4f") + path(poly(alpine), "#8db167") + path(rocks.slice(0, 3).map(poly).join(""), "#a9a497") + path(poly(scree[0]), "#c3bcac"), edge: curve(SLOPE_L) }),
    forest([...firs(SLOPE_L, -260, 186, 34, 101), ...firs(SLOPE_L, L, -260, 8, 103)].sort((a, b) => a[1] - b[1]), SKIN),
    cutPiece({ silhouette: poly(right), markup: path(poly(right), "#57813f") + path(rocks.slice(3).map(poly).join(""), "#9c978b") + path(poly(scree[1]), "#b6af9f"), edge: curve(SLOPE_R) }),
    forest([...firs(SLOPE_R, 222, 660, 34, 102), ...firs(SLOPE_R, 660, R, 8, 104)].sort((a, b) => a[1] - b[1]), SKIN),
  ].join("");
}

const MEADOW = [[L, 520], [-400, 508], [-200, 496], [0, 484], [140, 476], [205, 472], [270, 476], [420, 486], [600, 500], [800, 512], [R, 522]];

/** The meadow at the bottom of the valley: the paved path climbing into the V from the parking's gravel. */
export function meadow() {
  const r = random(111);
  // the flagstones, from the gravel (wide and near) up into the V (small and far)
  let stones = "";
  let joints = "";
  for (let k = 0; k < 16; k++) {
    const f = k / 15;
    const y = 600 - f * 126;
    const w = 30 - f * 22;
    const x = 205 + Math.sin(f * 5.2) * (16 - f * 12);
    for (const dx of [-0.52, 0.02]) {
      const sx = x + dx * w + (r() - 0.5) * 2;
      const h = 6 - f * 4;
      const stone = [[sx, y], [sx + w * 0.48, y - 0.4], [sx + w * 0.46, y - h], [sx + 0.02 * w, y - h + 0.3]];
      stones += poly(stone);
      joints += `M${n(sx)} ${n(y + 0.6)}H${n(sx + w * 0.48)}`;
    }
  }
  const gravel = blob([[60, 640], [120, 606], [205, 596], [300, 604], [356, 640], [320, 700], [205, 714], [90, 700]]);
  const specks = Array.from({ length: 40 }, () => {
    const [x, y] = [96 + r() * 220, 610 + r() * 90];
    return `M${n(x)} ${n(y)}h1.6`;
  }).join("");
  let tufts = "";
  for (let i = 0; i < 46; i++) {
    const x = L + r() * 1600;
    const y = edgeAt(MEADOW, x) + 12 + r() * 260;
    if (x > 50 && x < 370 && y > 590 && y < 720) continue; // not on the gravel
    tufts += tuft(x, y, 3 + r() * 2.5);
  }
  return [
    sheetOf(SKIN, MEADOW, "#9cbf63", path(tufts, "#7ea44c")),
    piece(SKIN, gravel, path(gravel, "#ddd2b6") + `<path d="${specks}" stroke="#a89c80" stroke-width="1.2" stroke-linecap="round"/>`, "", 0.3),
    piece(SKIN, stones, path(stones, "#d4ccb8") + `<path d="${joints}" stroke="#a49a85" stroke-width=".8"/>`, "", 0.25),
  ].join("");
}

/** Big firs on both sides and rocks in front, framing the parking. */
export function foreground() {
  const near = [[L, 744], [-300, 736], [-60, 742], [120, 750], [300, 742], [520, 750], [760, 738], [R, 746]];
  return [
    sheetOf(SKIN, near, "#6f9a48", "", 790),
    forest([[-40, 770, 150], [-130, 760, 120], [8, 790, 112], [432, 776, 150], [516, 766, 124], [388, 794, 110]], SKIN),
    rock(-90, 774, 96, SKIN),
    rock(352, 780, 84, SKIN),
  ].join("");
}

