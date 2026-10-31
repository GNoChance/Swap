// The intros' props (spec § 4), drawn in code: SVG markup in stage units (390 × 760; a layer 1600 wide spans x −605 to
// 995), after the style sketch's option A and Kevin's photos of the Ayous lakes. Each takes its skin: "paper" (the
// evening's colours, each piece cut with its shadow and light edge) or "poster" (the same shapes in the poster's flat
// colours). Pure: markup only, the same for the same arguments.
import { AFFICHE as A, cutPiece, cutSheet } from "./decor.js";
import { blob, curve, dot, edgeAt, lens, mirror, n, path, poly, random, sheet, speck, topEdge, tuft } from "./geom.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
const SKY_FOOT = 440; // the sky and the lake stop where the meadows cover them: less to blend on each frame
const LAKE_FOOT = 560;
export const paper = (skin) => skin === "paper";

// the paper pieces, shared with the other props files (props-carte.js, props-vallee.js, the canoe's props-*.js)
/** A piece of paper (paper: its shadow and light edge; poster: flat). */
export const piece = (skin, silhouette, markup, edge = "", lift = 1) => (paper(skin) ? cutPiece({ silhouette, markup, edge, lift }) : markup);
/** A sheet down to the bottom, its top edge through the points, `extra` drawn on it. */
export function sheetOf(skin, edge, fill, extra = "", bottom = 790) {
  const markup = path(sheet(edge, bottom), fill) + extra;
  return paper(skin) ? cutSheet({ edge: curve(edge), markup }) : markup;
}
/** A polygon cut out of paper, its top edges lit. */
export const slab = (skin, list, fill, lift = 1) => piece(skin, poly(list), path(poly(list), fill), topEdge(list), lift);

const ROUND = { paper: { crown: "#4f7a3e", lit: "#6e9a50", trunk: "#5b4430" }, poster: { crown: "#2f5a3c", lit: A.green, trunk: A.navy } };
/** Round leafy trees at once ([[x, y, r]]: the foot, the crown's radius), cut together: a crown, its west side lit, a
 *  short trunk (the canoe's banks and maps). smooth: curved crowns (a few big trees); else small polygons, as round at
 *  their size and far lighter to draw (a map has hundreds). */
export function roundTrees(list, { skin = "paper", tint = {}, lift = 0.45, smooth = true } = {}) {
  const c = { ...ROUND[skin], ...tint };
  const shape = smooth ? blob : poly;
  let crowns = "";
  let lit = "";
  let trunks = "";
  for (const [x, y, s] of [...list].sort((a, b) => a[1] - b[1])) {
    const cy = y - s * 1.2;
    crowns += shape([[x - s, cy + s * 0.2], [x - s * 0.8, cy - s * 0.55], [x - s * 0.25, cy - s], [x + s * 0.45, cy - s * 0.88], [x + s, cy - s * 0.15], [x + s * 0.7, cy + s * 0.65], [x - s * 0.35, cy + s * 0.8]]);
    lit += shape([[x - s * 0.82, cy + s * 0.08], [x - s * 0.64, cy - s * 0.5], [x - s * 0.18, cy - s * 0.84], [x - s * 0.24, cy - s * 0.24]]);
    trunks += poly([[x - s * 0.12, y], [x - s * 0.12, cy + s * 0.5], [x + s * 0.12, cy + s * 0.5], [x + s * 0.12, y]]);
  }
  return piece(skin, crowns, path(trunks, c.trunk) + path(crowns, c.crown) + path(lit, c.lit), "", lift);
}

// ── The sky ─────────────────────────────────────────────────

// its paper strips, top to bottom, each a gently waving edge (the poster's bands)
const STRIPS = [112, 186, 244, 300].map((y, k) => {
  const r = random(11 + k);
  return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 9]);
});
const HIGH = [
  [-470, 70, 170],
  [-160, 52, 130],
  [40, 78, 150],
  [250, 58, 120],
  [520, 84, 160],
  [800, 60, 140],
];
const WISPS = [
  [-520, 214, 150],
  [-300, 262, 120],
  [60, 222, 132],
  [150, 268, 90],
  [420, 210, 140],
  [640, 258, 120],
  [820, 226, 130],
];
const BIRDS = [
  [118, 214, 1],
  [134, 205, 0.8],
  [146, 222, 0.9],
  [596, 186, 1],
  [612, 196, 0.8],
];

/** The evening sky: paper strips from blue to gold, a few wisps and birds (the poster: its bands, navy at the top for
 *  the lettering). */
export function sky(skin) {
  const tones = paper(skin) ? ["#89b0d1", "#a3c0d6", "#c6d1d1", "#ebd4b6", "#f5c48f"] : [A.navy, "#2f5d7a", A.orange, "#f0a960", "#f4d79a"];
  const wisps = WISPS.map(([x, y, w]) => lens(x, y, w, 2.2)).join("");
  const high = HIGH.map(([x, y, w]) => lens(x, y, w, 1.6)).join("");
  return [
    `<rect x="${L}" y="-30" width="1600" height="${SKY_FOOT + 30}" fill="${tones[0]}"/>`,
    piece(skin, high, path(high, paper(skin) ? "#a9c4da" : A.navy), "", 0.35), // poster: navy on navy, nothing behind the lettering
    ...STRIPS.map((edge, k) => sheetOf(skin, edge, tones[k + 1], "", SKY_FOOT)),
    piece(skin, wisps, path(wisps, paper(skin) ? "#f7e2cf" : "#f4d79a"), "", 0.5),
    `<path d="${BIRDS.map(([x, y, k]) => `M${x} ${y}q${n(3 * k)} ${n(-3 * k)} ${n(6 * k)} 0q${n(3 * k)} ${n(-3 * k)} ${n(6 * k)} 0`).join("")}" fill="none" stroke="${paper(skin) ? "#4a4f5f" : A.navy}" stroke-width="1.1" stroke-linecap="round"/>`,
  ].join("");
}

const SUN = [68, 274];

/** The low sun on the left, behind the hills: three paper discs (the poster: one disc, striped). */
export function sun(skin) {
  const [cx, cy] = SUN;
  if (paper(skin))
    return [
      [46, "#f9d7a3"],
      [34, "#fce4bb"],
      [24, "#fff3da"],
    ]
      .map(([r, fill]) => piece(skin, dot(cx, cy, r), path(dot(cx, cy, r), fill), "", 0.6))
      .join("");
  const stripes = [
    [276, 3],
    [286, 4.5],
    [297, 6],
    [309, 7.5],
  ];
  return `<clipPath id="st-sun"><path d="${dot(cx, cy, 46)}"/></clipPath>${path(dot(cx, cy, 46), A.sun)}<g clip-path="url(#st-sun)" fill="${A.cream}">${stripes
    .map(([y, h]) => `<rect x="${cx - 50}" y="${y}" width="100" height="${h}"/>`)
    .join("")}</g>`;
}

const CLOUD = [[6, 36], [-1, 30], [8, 22], [12, 13], [28, 11], [38, 2], [56, 3], [62, 9], [76, 6], [84, 14], [96, 20], [98, 30], [92, 36]];

/** A cloud `w` wide, its top left corner at x, y: puffed paper with a pink belly in the evening (the poster: cream). */
export function cloud(x, y, w, skin) {
  const k = w / 100;
  const at = ([px, py]) => [x + px * k, y + py * k];
  const body = blob(CLOUD.map(at));
  if (!paper(skin)) return path(body, A.cream);
  const belly = blob([[10, 35], [30, 30.5], [54, 31.5], [76, 29.5], [94, 33], [90, 36.2], [40, 36.5]].map(at));
  return piece(skin, body, `${path(body, "#fffaf3")}${path(belly, "#f6d8c6")}`, "", 0.8);
}

/** The lake's clouds, spread for the widest screens (none behind the poster's lettering). */
export function clouds(skin) {
  const list = [
    [-470, 150, 110],
    [-232, 204, 74],
    [18, 152, 92],
    [286, 134, 78],
    [500, 170, 100],
    [742, 122, 88],
    [930, 198, 64],
  ];
  return list.map(([x, y, w]) => cloud(x, y, w, skin)).join("");
}

// ── The mountains ───────────────────────────────────────────

/** The far ridges, the slopes on the left, and the jagged massif on the right of the Ossau. */
export function ridge(skin) {
  const p = paper(skin);
  const far = random(3);
  const teeth = (y, amp, step, shift) => Array.from({ length: Math.ceil(1600 / step) + 1 }, (_, i) => [L + i * step + shift, y + (i % 2 ? -amp : 0) + (far() - 0.5) * amp]);
  const ridgeA = [...teeth(318, 22, 64, 0), [R + 40, 390], [L, 390]];
  const ridgeB = [...teeth(340, 18, 78, 30), [R + 40, 400], [L, 400]];
  const left = [[L, 296], [-560, 268], [-500, 252], [-430, 238], [-370, 246], [-300, 226], [-240, 236], [-180, 254], [-120, 262], [-60, 256], [0, 270], [50, 286], [100, 302], [150, 324], [190, 348], [220, 380]];
  const leftLit = [
    [[-430, 238], [-370, 246], [-392, 300], [-470, 300]],
    [[-300, 226], [-240, 236], [-262, 300], [-340, 300]],
    [[-60, 256], [0, 270], [-20, 320], [-96, 320]],
  ];
  const right = [[300, 400], [322, 330], [346, 300], [368, 276], [386, 262], [404, 250], [420, 236], [436, 226], [450, 214], [462, 222], [476, 212], [492, 204], [508, 214], [526, 226], [546, 240], [570, 234], [596, 226], [620, 240], [648, 250], [680, 244], [714, 262], [750, 256], [790, 270], [830, 264], [870, 280], [920, 272], [R + 20, 286], [R + 20, 400]];
  const rightLit = [
    [[450, 214], [462, 222], [454, 262], [442, 304], [418, 304], [436, 252]],
    [[492, 204], [508, 214], [498, 252], [486, 300], [464, 300], [480, 242]],
    [[596, 226], [620, 240], [606, 284], [586, 304], [576, 274]],
    [[750, 256], [790, 270], [772, 310], [742, 310]],
  ];
  const snow = [
    [[452, 222], [460, 228], [452, 246], [446, 240]],
    [[494, 212], [504, 218], [498, 236], [490, 232]],
    [[540, 242], [560, 238], [552, 252]],
    [[604, 234], [616, 244], [606, 256], [598, 248]],
    [[700, 256], [720, 262], [708, 272]],
    [[820, 270], [842, 274], [828, 284]],
    [[-310, 236], [-292, 232], [-286, 246], [-302, 252]],
    [[-448, 248], [-430, 244], [-424, 258]],
  ];
  const c = p
    ? { a: "#c7b6cf", b: "#ab9ec0", left: "#7f8c88", leftLit: "#98a392", right: "#656b80", rightLit: "#878394", snow: "#f7f1ea" }
    : { a: "#5a9a9c", b: A.teal, left: "#2f5d7a", leftLit: "#3d6f8a", right: "#2f4b6e", rightLit: "#3b5a80", snow: A.cream };
  const snowD = snow.map(poly).join("");
  return [
    slab(skin, ridgeA, c.a, 0.6),
    slab(skin, ridgeB, c.b, 0.7),
    sheetOf(skin, left, c.left, path(leftLit.map(poly).join(""), c.leftLit), 400),
    piece(skin, poly(right), `${path(poly(right), c.right)}${path(rightLit.map(poly).join(""), c.rightLit)}`, topEdge(right)),
    piece(skin, snowD, path(snowD, c.snow), "", 0.35),
  ].join("");
}

// the Pic du Midi d'Ossau as seen from Ayous: a massive pyramid crowned by two blunt horns (the higher on the left),
// the deep notch of the Fourche between them
export const OSSAU = [[96, 372], [118, 358], [136, 348], [150, 338], [162, 326], [172, 312], [180, 298], [186, 284], [192, 268], [196, 252], [200, 236], [204, 220], [208, 204], [211, 190], [214, 178], [217, 166], [220, 152], [223, 140], [226, 130], [229, 123], [233, 118], [237, 119], [241, 124], [243, 131], [245, 142], [247, 154], [249, 164], [251, 170], [253, 165], [255, 155], [257, 145], [260, 137], [263, 131], [267, 127], [271, 128], [274, 133], [277, 142], [280, 154], [283, 166], [287, 176], [293, 184], [300, 190], [308, 194], [316, 196], [322, 202], [329, 214], [337, 228], [346, 242], [356, 256], [367, 268], [380, 281], [394, 293], [412, 306], [434, 320], [460, 336], [494, 353], [540, 372]];
const OSSAU_LIT = [
  [[233, 118], [229, 123], [226, 130], [223, 140], [220, 152], [217, 166], [214, 178], [211, 190], [222, 196], [226, 176], [229, 156], [232, 138]], // the higher horn's west face
  [[267, 127], [263, 131], [260, 137], [257, 145], [255, 155], [253, 165], [251, 170], [256, 182], [261, 162], [265, 146], [268, 136]], // the lower horn's, over the notch
  [[96, 372], [118, 358], [136, 348], [150, 338], [162, 326], [172, 312], [180, 298], [186, 284], [192, 268], [196, 252], [200, 236], [204, 220], [208, 204], [211, 190], [222, 196], [216, 226], [208, 258], [198, 290], [188, 320], [178, 350], [170, 372]], // the west buttress
];
const OSSAU_MID = [
  [[222, 196], [226, 176], [229, 156], [232, 138], [237, 119], [241, 124], [243, 131], [245, 142], [247, 154], [249, 164], [251, 170], [250, 200], [246, 236], [240, 276], [232, 320], [224, 372], [170, 372], [178, 350], [188, 320], [198, 290], [208, 258], [216, 226]],
  [[308, 194], [316, 196], [322, 202], [318, 232], [310, 264], [302, 298], [294, 334], [288, 372], [272, 372], [280, 334], [292, 292], [302, 250], [306, 220]],
  [[367, 268], [380, 281], [372, 306], [362, 336], [354, 372], [338, 372], [348, 334], [358, 300]],
];
const OSSAU_GLOW = [
  [[233, 118], [237, 119], [234, 128], [230, 134], [229, 124]],
  [[267, 127], [271, 128], [268, 136], [264, 142], [263, 132]],
];
const OSSAU_SNOW = [
  [[250, 176], [253, 180], [252, 204], [249, 232], [245, 262], [242, 276], [241, 262], [244, 236], [247, 206]],
  [[227, 140], [231, 136], [232, 146], [228, 150]],
  [[262, 142], [265, 140], [265, 150], [261, 152]],
  [[222, 244], [229, 240], [227, 250], [220, 258]],
  [[176, 318], [188, 306], [196, 300], [192, 312], [182, 322], [172, 330]],
  [[272, 136], [276, 148], [280, 162], [276, 166], [273, 152]],
  [[300, 192], [309, 196], [318, 200], [324, 212], [314, 210], [304, 202]],
  [[332, 236], [344, 248], [354, 262], [346, 264], [336, 252]],
  [[372, 288], [390, 296], [408, 308], [396, 310], [380, 302]],
  [[426, 322], [452, 330], [474, 342], [458, 344], [438, 334]],
  [[128, 358], [146, 350], [162, 348], [156, 356], [138, 362]],
  [[254, 334], [268, 326], [282, 332], [274, 342], [258, 344]],
  [[302, 318], [318, 312], [332, 322], [320, 330]],
  [[206, 288], [214, 282], [212, 294], [204, 300]],
];

/** The Pic du Midi d'Ossau: its rock in the evening light (the west faces lit, the horns glowing), its spring snow
 *  (the poster: navy and cream). Its reflection is in lake(). */
export function ossau(skin) {
  const c = paper(skin)
    ? { rock: "#4c5165", lit: "#867a8a", mid: "#625f71", glow: "#a98e93", snow: "#fbf3ea" }
    : { rock: A.navy, lit: "#2f4b6e", mid: "#283d5c", glow: "#3d5f86", snow: A.cream };
  const outline = [...OSSAU, [540, 400], [96, 400]];
  const snow = OSSAU_SNOW.map(poly).join("");
  return [
    piece(skin, poly(outline), [path(poly(outline), c.rock), path(OSSAU_MID.map(poly).join(""), c.mid), path(OSSAU_LIT.map(poly).join(""), c.lit), path(OSSAU_GLOW.map(poly).join(""), c.glow)].join(""), topEdge(outline)),
    piece(skin, snow, path(snow, c.snow), "", 0.3),
  ].join("");
}

// ── The far shore ───────────────────────────────────────────

/** The parts of a pine (x: its middle, y: its foot, size: its height): three tiers, their west half lit. */
function pineParts(x, y, size) {
  const top = y - size;
  let dark = "";
  let lit = "";
  for (const [a, b, c] of [
    [0, 0.42, 0.17],
    [0.2, 0.66, 0.23],
    [0.4, 0.9, 0.29],
  ]) {
    const [apex, base, hw] = [top + a * size, top + b * size, c * size];
    const notch = base - 0.04 * size; // the tier's hem, lifted in the middle
    dark += poly([[x, apex], [x + hw, base], [x, notch], [x - hw, base]]);
    lit += poly([[x, apex], [x - hw, base], [x, notch]]);
  }
  const trunk = poly([[x - 0.035 * size, y - 0.12 * size], [x + 0.035 * size, y - 0.12 * size], [x + 0.035 * size, y], [x - 0.035 * size, y]]);
  return { dark, lit, trunk };
}
const PINE = { paper: { dark: "#2f4a30", lit: "#4a6941", trunk: "#4a3826" }, poster: { dark: "#24442f", lit: A.green, trunk: A.navy } };

/** A pine, its foot at x, y, `size` high. */
export function pine(x, y, size, skin) {
  return forest([[x, y, size]], skin);
}
/** Pines at once ([[x, y, size]]), cut together: their shadows fall on the slope. */
export function forest(list, skin, tint) {
  const parts = list.map(([x, y, size]) => pineParts(x, y, size));
  const c = { ...PINE[skin], ...tint };
  const all = (k) => parts.map((part) => part[k]).join("");
  const markup = ["trunk", "dark", "lit"].map((k) => path(all(k), c[k])).join("");
  return piece(skin, all("dark"), markup, "", 0.45);
}
/** A row of pines along an edge, from x0 to x1 about `step` apart, sunk `sink` under it. */
export function row(edge, x0, x1, step, [s0, s1], sink, seed) {
  const r = random(seed);
  const list = [];
  for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8)) list.push([x, edgeAt(edge, x) + sink + r() * sink, s0 + r() * (s1 - s0)]);
  return list;
}

const HILL_BACK = [[L, 290], [-480, 280], [-360, 292], [-240, 274], [-120, 286], [-20, 276], [60, 286], [120, 304], [170, 326], [210, 352], [240, 380]];
const HILL = [[L, 318], [-500, 306], [-400, 316], [-300, 300], [-200, 312], [-100, 298], [-20, 304], [40, 312], [90, 326], [130, 342], [160, 356], [185, 372]];
const SLOPE = [[300, 382], [330, 368], [362, 358], [400, 352], [450, 356], [510, 348], [580, 354], [650, 344], [730, 352], [810, 342], [890, 350], [R + 20, 344]];

/** The far shore: the hills on the left with their pines, a grey outcrop and a last patch of snow; the slope on the
 *  right. */
export function shores(skin) {
  const p = paper(skin);
  const c = p ? { back: "#566a4a", hill: "#6c7d53", slope: "#6f7f56", snow: "#f6f1e8", stone: "#9a958a" } : { back: "#345b40", hill: A.green, slope: A.green, snow: A.cream, stone: "#2f4b6e" };
  const snow = blob([[-210, 318], [-180, 312], [-150, 316], [-168, 322], [-200, 324]]) + blob([[-470, 324], [-446, 318], [-420, 322], [-440, 328]]);
  const stones = [
    [[-60, 318], [-50, 308], [-36, 306], [-28, 318]],
    [[-330, 316], [-320, 304], [-302, 302], [-292, 314]],
    [[520, 362], [530, 350], [546, 348], [556, 360]],
  ];
  return [
    sheetOf(skin, HILL_BACK, c.back, "", 400),
    forest(row(HILL_BACK, L + 6, 214, 25, [15, 24], 6, 21), skin, p ? { dark: "#2a432c", lit: "#3d5a3a" } : { lit: "#2f5a3c" }),
    sheetOf(skin, HILL, c.hill, "", 400),
    piece(skin, snow, path(snow, c.snow), "", 0.3),
    ...stones.map((stone) => slab(skin, stone, c.stone, 0.4)),
    sheetOf(skin, SLOPE, c.slope, "", 400),
    forest(row(HILL, L, 168, 29, [22, 36], 8, 22), skin),
    forest(row(SLOPE, 404, R, 37, [18, 30], 6, 23), skin),
  ].join("");
}

/** The Ayous refuge on its knoll, at x (its middle), y (its foot): stone walls, a slate roof (the poster: an orange
 *  roof). */
export function refuge(x, y, skin) {
  const c = paper(skin)
    ? { knoll: "#76875a", gable: "#f1e8d6", side: "#cfc2aa", roof: "#454c5e", ridge: "#6b7386", door: "#5d4a36", window: "#3d4352", chimney: "#6a6f7d" }
    : { knoll: A.green, gable: A.cream, side: "#e3c99a", roof: "#c4602f", ridge: A.orange, door: A.navy, window: A.navy, chimney: A.navy };
  const s = 1.3; // a hut 30 units wide
  const at = (dx, dy) => [x + dx * s, y + dy * s];
  const knoll = [[x - 44, y + 18], [x - 26, y + 6], [x - 6, y - 1], [x + 16, y], [x + 34, y + 6], [x + 50, y + 18]];
  const roof = [at(-5.5, -18), at(9, -18), at(15, -11), at(0, -11)];
  const outline = [at(-11, 0), at(-11, -11), at(-5.5, -18), at(9, -18), at(15, -11), at(14, 0)];
  const hut = [
    path(poly([at(-11, 0), at(-11, -11), at(-5.5, -18), at(0, -11), at(0, 0)]), c.gable),
    path(poly([at(0, -11), at(14, -11), at(14, 0), at(0, 0)]), c.side),
    path(poly([at(10, -22), at(12, -22), at(12, -15), at(10, -15)]), c.chimney),
    path(poly(roof), c.roof),
    path(poly([at(-5.5, -18), at(9, -18), at(9.6, -17.2), at(-4.9, -17.2)]), c.ridge),
    path(poly([at(-7, 0), at(-7, -6), at(-4, -6), at(-4, 0)]), c.door),
    path(poly([at(3, -8), at(5.5, -8), at(5.5, -5.5), at(3, -5.5)]) + poly([at(8.5, -8), at(11, -8), at(11, -5.5), at(8.5, -5.5)]), c.window),
  ].join("");
  return sheetOf(skin, knoll, c.knoll, "", y + 40) + piece(skin, poly(outline), hut, topEdge(roof), 0.5);
}

// ── The lake ────────────────────────────────────────────────

const WATER = 360; // the far shore's water line

// its colours, on paper (the sunset's warm streaks and glints drawn apart: lakeGlow()) and on the poster
const LAKE = {
  paper: { water: "#7aa3c1", far: "#6f98b8", massif: "#6c86a3", ossau: "#566e91", hills: "#587563", slope: "#5f7b67", breaks: "#7aa3c1", ripple: "#a7c7db", warm: "#dccbbd", glint: "#f8dfb2" },
  poster: { water: A.teal, far: A.teal, massif: "#2f5d7a", ossau: A.navy, hills: "#24442f", slope: "#2a4d37", breaks: A.teal, ripple: "#5aa3a7", warm: "#f0a960", glint: A.sun },
};

/** The lake's lenses of light, the same each time: the ripples breaking its reflections, the sunset's warm streaks,
 *  the sun's glints under it. */
function lakeLights() {
  const r = random(31);
  const breaks = Array.from({ length: 18 }, () => lens(-40 + r() * 600, 372 + r() * 118, 24 + r() * 70, 1)).join("");
  const ripples = Array.from({ length: 26 }, () => lens(L + r() * 1600, 384 + r() * 110, 30 + r() * 90, 1.3)).join("");
  const warm = Array.from({ length: 9 }, () => lens(L + r() * 700, 404 + r() * 70, 40 + r() * 80, 1.4)).join("");
  const [sx] = SUN;
  const glints = [
    [-16, 400, 34],
    [-24, 412, 48],
    [-10, 424, 26],
    [-28, 436, 54],
    [-12, 450, 30],
    [-20, 464, 40],
  ]
    .map(([dx, y, w]) => lens(sx + dx, y, w, 1.6))
    .join("");
  return { breaks, ripples, warm, glints };
}

/** The lake d'Ayous: the Ossau and the shores mirrored in it, ripples breaking them, the sun's glints. On paper, its
 *  golden light (the warm streaks and the glints) is lakeGlow(), apart: it goes with the night. */
export function lake(skin) {
  const p = paper(skin);
  const c = LAKE[p ? "paper" : "poster"];
  const shore = [[L, WATER], [-300, WATER - 1.2], [0, WATER + 0.8], [300, WATER - 1], [600, WATER + 1], [R + 20, WATER]];
  const k = 0.5;
  const ossau = mirror(OSSAU, WATER, k);
  const hills = mirror(HILL, WATER, k * 1.2);
  const slope = mirror(SLOPE, WATER, k * 1.4);
  const massif = mirror([[300, 330], [368, 276], [420, 236], [492, 204], [570, 234], [648, 250], [750, 256], [870, 280], [R, 286]], WATER, k * 0.8);
  const { breaks, ripples, warm, glints } = lakeLights();
  return sheetOf(
    skin,
    shore,
    c.water,
    [
      path(`M${L} ${WATER}H${R + 20}V${WATER + 26}H${L}Z`, c.far),
      path(poly([...massif, [R, WATER], [300, WATER]]), c.massif),
      path(poly([...ossau, [540, WATER], [96, WATER]]), c.ossau),
      path(poly([...hills, [185, WATER], [L, WATER]]), c.hills),
      path(poly([...slope, [R + 20, WATER], [300, WATER]]), c.slope),
      path(breaks, c.breaks),
      path(ripples, c.ripple),
      ...(p ? [] : [path(warm, c.warm), path(glints, c.glint)]),
    ].join(""),
    LAKE_FOOT,
  );
}

/** The paper lake's golden light, over it: the sunset's warm streaks and the sun's glints. */
export function lakeGlow() {
  const { warm, glints } = lakeLights();
  return path(warm, LAKE.paper.warm) + path(glints, LAKE.paper.glint);
}

// ── The meadows ─────────────────────────────────────────────

const MEADOW_FAR = [[L, 478], [-500, 466], [-400, 474], [-300, 458], [-200, 466], [-100, 452], [-20, 446], [40, 440], [100, 444], [160, 470], [220, 498], [270, 506], [320, 498], [370, 486], [420, 480], [500, 486], [600, 472], [700, 482], [800, 468], [900, 478], [R + 20, 470]];
const MEADOW_NEAR = [[L, 662], [-500, 650], [-400, 660], [-300, 646], [-200, 656], [-100, 642], [-20, 650], [60, 644], [140, 652], [220, 660], [300, 650], [380, 640], [460, 648], [560, 662], [660, 648], [760, 660], [860, 646], [R + 20, 654]];
const MEADOW = [[L, 586], [-520, 572], [-420, 584], [-320, 566], [-220, 578], [-120, 562], [-40, 568], [30, 560], [100, 552], [170, 560], [240, 566], [300, 558], [360, 548], [420, 552], [520, 566], [620, 552], [720, 566], [820, 550], [920, 562], [R + 20, 556]];

/** Grass tufts and flowers over a meadow, between its edge (sunk by `from`) and y1. */
function bloom(edge, from, y1, count, seed, skin, big = 1) {
  const r = random(seed);
  let tufts = "";
  const dots = { a: "", b: "", c: "" };
  for (let i = 0; i < count; i++) {
    const x = L + r() * 1600;
    const top = edgeAt(edge, x) + from;
    const y = top + r() * (y1 - top);
    if (r() < 0.55) tufts += tuft(x, y, (2.4 + r() * 2.6) * big);
    else dots["abc"[Math.floor(r() * 3)]] += speck(x, y, (1.5 + r()) * big);
  }
  const c = paper(skin) ? { a: "#fbf6ee", b: "#f2cf5b", c: "#9a8ccc" } : { a: A.cream, b: A.sun, c: A.cream };
  return { tufts, flowers: Object.entries(dots).map(([k, d]) => path(d, c[k])).join("") };
}
/** A grassy hummock on the meadow, `w` wide from x, y. */
const hummock = (x, y, w) => blob([[x, y], [x + w * 0.2, y - w * 0.14], [x + w * 0.55, y - w * 0.2], [x + w * 0.85, y - w * 0.1], [x + w, y], [x + w * 0.5, y + w * 0.04]]);

/** The meadows on the near shore, in three sheets, with their hummocks, tufts, flowers and rocks. */
export function meadow(skin) {
  const p = paper(skin);
  const c = p
    ? { far: "#a3b96d", farStreak: "#b7ca84", farTuft: "#8aa458", hump: "#94ad60", mid: "#8fac58", midStreak: "#9fba68", midTuft: "#728f45", near: "#7f9e4c", nearStreak: "#728f42", nearTuft: "#64833b" }
    : { far: A.grass, farStreak: "#8aab64", farTuft: "#6a9150", hump: "#6f9a52", mid: "#5f8a45", midStreak: "#6a9450", midTuft: A.green, near: "#4f7a43", nearStreak: "#476f3c", nearTuft: A.green };
  const far = bloom(MEADOW_FAR, 10, 560, 70, 41, skin);
  const r = random(43);
  const streaks = (edge, y0, y1, count) => Array.from({ length: count }, () => {
    const x = L + r() * 1560;
    const y = Math.max(edgeAt(edge, x) + 14, y0) + r() * (y1 - y0);
    return lens(x, y, 60 + r() * 120, 2 + r() * 2.5);
  }).join("");
  const mid = bloom(MEADOW, 12, 660, 70, 42, skin);
  const near = bloom(MEADOW_NEAR, 10, 760, 80, 44, skin);
  const humps = [
    [60, 512, 64],
    [-150, 520, 80],
    [330, 540, 56],
    [-420, 530, 70],
    [520, 530, 76],
    [760, 528, 64],
  ].map(([x, y, w]) => hummock(x, y, w));
  return [
    sheetOf(skin, MEADOW_FAR, c.far, path(streaks(MEADOW_FAR, 470, 540, 18), c.farStreak) + path(far.tufts, c.farTuft) + far.flowers),
    piece(skin, humps.join(""), path(humps.join(""), c.hump), "", 0.2),
    sheetOf(skin, MEADOW, c.mid, path(streaks(MEADOW, 580, 650, 14), c.midStreak) + path(mid.tufts, c.midTuft) + mid.flowers),
    sheetOf(skin, MEADOW_NEAR, c.near, path(streaks(MEADOW_NEAR, 668, 740, 14), c.nearStreak) + path(near.tufts, c.nearTuft) + near.flowers),
    rock(296, 676, 80, skin),
    rock(10, 726, 54, skin),
    rock(-320, 690, 70, skin),
    rock(612, 702, 76, skin),
    rock(850, 664, 60, skin),
  ].join("");
}

const STREAM = [[262, 498], [252, 518], [262, 540], [280, 556], [270, 578], [246, 596], [238, 620], [256, 646], [270, 672], [250, 700], [232, 728], [238, 760], [232, 800]];

/** The stream winding from the lake down through the meadows. */
export function stream(skin) {
  const d = curve(STREAM);
  if (!paper(skin)) return `<path d="${d}" fill="none" stroke="${A.cream}" stroke-width="6" stroke-linecap="round"/>`;
  const markup = `<path d="${d}" fill="none" stroke="#d4e7f1" stroke-width="8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#a9cde2" stroke-width="3" stroke-linecap="round"/><path d="${d}" transform="translate(-1.6 -.6)" fill="none" stroke="#f4fbff" stroke-width=".9" stroke-dasharray="10 14" stroke-linecap="round"/>`;
  return cutPiece({ silhouette: d, markup, stroke: 8, lift: 0.5 });
}

/** A patch of snow lying on the grass, `w` wide from x, y: lit on top, bluish below (the poster: cream). */
export function neve(x, y, w, skin) {
  const h = w * 0.2;
  const outline = blob([[x, y], [x + w * 0.22, y - h * 0.6], [x + w * 0.6, y - h * 0.75], [x + w, y - h * 0.2], [x + w * 0.86, y + h * 0.32], [x + w * 0.42, y + h * 0.42], [x + w * 0.1, y + h * 0.3]]);
  if (!paper(skin)) return path(outline, A.cream);
  const under = blob([[x + w * 0.12, y + h * 0.18], [x + w * 0.5, y + h * 0.08], [x + w * 0.84, y + h * 0.2], [x + w * 0.5, y + h * 0.4]]);
  return piece(skin, outline, `${path(outline, "#fbf6ee")}${path(under, "#dce4ea")}`, "", 0.4);
}

/** The névés on the near shore, spread for the widest screens. */
export function neves(skin) {
  const list = [
    [12, 470, 64],
    [300, 516, 66],
    [-360, 494, 80],
    [-170, 486, 56],
    [470, 508, 60],
    [700, 500, 90],
    [880, 494, 60],
  ];
  return list.map(([x, y, w]) => neve(x, y, w, skin)).join("");
}

/** A rock, its foot `w` wide from x, y: a lit facet on the west, a shaded one on the east, a little lichen. */
export function rock(x, y, w, skin) {
  const h = w * 0.55;
  const at = (fx, fy) => [x + w * fx, y - h * fy];
  const outline = [at(0, 0), at(0.08, 0.55), at(0.3, 0.92), at(0.62, 1), at(0.86, 0.62), at(1, 0)];
  const lit = poly([at(0.08, 0.55), at(0.3, 0.92), at(0.62, 1), at(0.5, 0.58), at(0.24, 0.4)]);
  const shade = poly([at(0.62, 1), at(0.86, 0.62), at(1, 0), at(0.7, 0), at(0.58, 0.5)]);
  if (!paper(skin)) return `${path(poly(outline), "#2f4b6e")}${path(shade, A.navy)}`;
  const lichen = [at(0.36, 0.7), at(0.2, 0.3), at(0.44, 0.5)].map(([lx, ly], k) => dot(lx, ly, w * (0.012 + k * 0.004))).join("");
  return piece(skin, poly(outline), `${path(poly(outline), "#918a7f")}${path(lit, "#b4ac9f")}${path(shade, "#6e685e")}${path(lichen, "#c7b86c")}`, topEdge(outline), Math.min(1, w / 80));
}

/** The beige tent, pitched on the meadow on the left: an A-frame, its door open, its guy lines and pegs. */
export function tent(skin) {
  const c = paper(skin)
    ? { front: "#e6c99b", side: "#c9a46f", seam: "#d2b07c", door: "#4f3d2b", flap: "#d9b886", ridge: "#f3ddb4", line: "#6f5a40" }
    : { front: A.orange, side: "#c4602f", seam: "#d9733c", door: A.navy, flap: "#f0a960", ridge: A.cream, line: A.navy };
  const front = [[68, 590], [112, 522], [150, 590]];
  const side = [[112, 522], [150, 590], [172, 584], [128, 520]];
  const outline = [[68, 590], [112, 522], [128, 520], [172, 584], [150, 590]];
  const markup = [
    path(poly(side), c.side),
    path(poly(front), c.front),
    `<path d="M112 522L88 590M112 522L136 590" fill="none" stroke="${c.seam}" stroke-width=".9"/>`,
    path(poly([[100, 590], [112, 548], [124, 590]]), c.door),
    path(poly([[112, 548], [124, 590], [133, 589], [117, 551]]), c.flap),
    `<path d="M112 522L128 520" stroke="${c.ridge}" stroke-width="1.6" stroke-linecap="round"/>`,
  ].join("");
  const lines = `<path d="M112 522L50 598M128 520L178 593M68 590L58 598M172 584L180 592" fill="none" stroke="${c.line}" stroke-width="1"/><path d="M49 594v6M177 589v6M57 595v5M179 589v5" stroke="${c.line}" stroke-width="1.6" stroke-linecap="round"/>`;
  return lines + piece(skin, poly(outline), markup, topEdge(outline));
}

const NEAR = [[L, 742], [-480, 734], [-360, 744], [-240, 732], [-120, 742], [-40, 736], [40, 744], [140, 738], [240, 746], [330, 738], [420, 742], [520, 732], [640, 744], [760, 734], [880, 744], [R + 20, 736]];

/** The foreground: a last strip of grass, big tufts and flowers, the rocks in the corners framing the scene. */
export function foreground(skin) {
  const p = paper(skin);
  const near = bloom(NEAR, -4, 770, 60, 51, skin, 1.5);
  return [
    sheetOf(skin, NEAR, p ? "#6a8a3e" : A.green, path(near.tufts, p ? "#557a34" : "#2f5a3c") + near.flowers),
    rock(-70, 772, 118, skin),
    rock(336, 776, 124, skin),
    rock(-380, 770, 96, skin),
    rock(700, 772, 110, skin),
  ].join("");
}
