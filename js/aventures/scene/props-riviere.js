// The river's pieces (the canoe's spec, § 4): the Dordogne on a summer day, after Kevin's photos (the river under the
// trees, the selfie in the canoe): the blue sky and its clouds, the far hills, the wooded south bank, the water in bands
// with the cliff's and the woods' reflections, the near banks, and the trees leaning over the water in front (each takes
// its skin, "paper" or "poster": props.js); the launch at Carsac (its far bank, its pebble beach, its signpost), the
// eddies, dizzy spiral and paddle drops of a boat on the water, and the descent (the river going away to its bend
// between its wooded banks, the trees leaning over it, Vitrac's bridge), paper only. Its layers are 1600 units wide (x
// −605 to 995), the stage's middle clear for the canoe. Pure: markup only, the same for the same arguments.
import { AFFICHE as A } from "./decor.js";
import { blob, curve, dot, edgeAt, lens, mirror, path, poly, random, topEdge, tuft } from "./geom.js";
import { paper, piece, rock, roundTrees, row, sheetOf, slab, strata } from "./props.js";
import { house } from "./props-chateaux.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** Where the far water meets the banks and the cliff. */
export const WATER_LINE = 452;

// ── The sky ─────────────────────────────────────────────────

const STRIPS = [150, 250, 330].map((y, k) => {
  const r = random(171 + k);
  return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 10]);
});
const CLOUDS = [
  [-480, 120, 130],
  [-200, 190, 90],
  [40, 214, 74],
  [150, 150, 96],
  [470, 180, 120],
  [760, 112, 110],
];

/** A summer cloud `w` wide, its top left corner at x, y: puffed white paper, a blue-grey belly (the poster: cream). */
function cloud(x, y, w, skin) {
  const k = w / 100;
  const at = ([px, py]) => [x + px * k, y + py * k];
  const body = blob([[6, 34], [0, 26], [10, 18], [26, 14], [36, 4], [56, 6], [66, 14], [84, 12], [96, 22], [92, 34]].map(at));
  if (!paper(skin)) return path(body, A.cream);
  const belly = blob([[12, 33], [40, 29], [70, 30], [90, 32], [60, 35.5]].map(at));
  return piece(skin, body, path(body, "#fffdf8") + path(belly, "#dde9f2"), "", 0.8);
}

/** The summer sky: blue paper strips paler down to the hills, white clouds, the sun high on the left (the poster: its
 *  bands, navy at the top for the lettering, the sun striped). */
export function sky(skin) {
  const p = paper(skin);
  const tones = p ? ["#80b4de", "#97c3e5", "#b0d2ec", "#cbe2f1"] : [A.navy, "#2f5d7a", A.teal, "#6aa7a3"];
  const [sx, sy] = [-30, 150];
  const sun = p
    ? [[40, "#fff2c4"], [28, "#fff8e2"]].map(([r, fill]) => piece(skin, dot(sx, sy, r), path(dot(sx, sy, r), fill), "", 0.5)).join("")
    : `<clipPath id="st-sun-riviere"><path d="${dot(sx, sy, 36)}"/></clipPath>${path(dot(sx, sy, 36), A.sun)}<g clip-path="url(#st-sun-riviere)" fill="${A.cream}">${[[154, 3], [164, 4.5], [175, 6]].map(([y, h]) => `<rect x="${sx - 40}" y="${y}" width="80" height="${h}"/>`).join("")}</g>`;
  return [
    `<rect x="${L}" y="-30" width="1600" height="${WATER_LINE + 40}" fill="${tones[0]}"/>`,
    ...STRIPS.map((edge, k) => sheetOf(skin, edge, tones[k + 1], "", WATER_LINE + 10)),
    sun,
    ...CLOUDS.map(([x, y, w]) => cloud(x, y, w, skin)),
  ].join("");
}

// ── The hills and the south bank ────────────────────────────

const FAR = [[L, 392], [-460, 372], [-300, 386], [-160, 366], [-40, 380], [60, 370], [150, 388], [240, 376], [340, 392], [480, 370], [620, 384], [780, 366], [R, 380]];
const BANK = [[L, 404], [-440, 396], [-300, 410], [-180, 398], [-60, 414], [40, 404], [110, 420], [170, 440], [200, WATER_LINE + 4]];

/** The far hills along the river, pale with the distance, and the south bank on the left: a wooded slope down to the
 *  water, its trees in rows. */
export function hills(skin) {
  const p = paper(skin);
  const c = p ? { far: "#a5bdae", farLit: "#b9cdbd", bank: "#6a9150" } : { far: "#4f8a7a", farLit: "#5f9a88", bank: A.grass };
  const farLit = poly([...FAR, ...[...FAR].reverse().map(([x, y]) => [x, y + 8])]);
  return [
    sheetOf(skin, FAR, c.far, path(farLit, c.farLit), WATER_LINE + 10),
    roundTrees(row(FAR, L, R, 30, [7, 11], 6, 181), { skin, tint: p ? { crown: "#7d9b7a", lit: "#91ad8a", trunk: "#7d9b7a" } : { crown: "#3f7a66", lit: "#4f8a72", trunk: "#3f7a66" } }),
    sheetOf(skin, BANK, c.bank, "", WATER_LINE + 10),
    roundTrees([...row(BANK, L, 196, 22, [14, 22], 10, 183), ...row(BANK, L, 150, 26, [16, 26], 26, 185)], { skin }),
  ].join("");
}

// ── The water ───────────────────────────────────────────────

/** The river from the far banks down to the bottom: bands paler far off, a cliff's pale reflection (`cliff`, its top
 *  edge [[x, y]] from its foot on the left: props-chateaux.js) and the woods' dark one on the left, ripples breaking
 *  them, glints of the sun. */
export function water(skin, cliff = []) {
  const p = paper(skin);
  const c = p
    ? { far: "#b2d1e4", mid: "#8fbcd8", near: "#78a9ca", cliff: "#c9d9de", woods: "#5e8f86", ripple: "#d8eaf3", dark: "#6a9bbd", glint: "#fff6da" }
    : { far: "#5aa3a7", mid: A.teal, near: "#28707a", cliff: "#8fc1b8", woods: "#24442f", ripple: A.cream, dark: "#22344f", glint: A.sun };
  const shore = [[L, WATER_LINE], [-200, WATER_LINE + 1], [200, WATER_LINE - 1], [600, WATER_LINE + 1], [R, WATER_LINE]];
  const band = (y0, y1) => poly([[L, y0], [R, y0], [R, y1], [L, y1]]);
  const rock = cliff.length ? poly([...mirror(cliff, WATER_LINE, 0.55), [R, WATER_LINE], [cliff[0][0], WATER_LINE]]) : "";
  const woods = poly([...mirror(BANK, WATER_LINE, 0.8), [L, WATER_LINE]]);
  const r = random(191);
  const ripples = Array.from({ length: 70 }, () => lens(L + r() * 1600, WATER_LINE + 8 + r() ** 1.3 * 320, 14 + r() * 60, 0.9 + r() * 1.1)).join("");
  const dark = Array.from({ length: 40 }, () => lens(L + r() * 1600, WATER_LINE + 30 + r() * 300, 20 + r() * 50, 1 + r())).join("");
  const glints = Array.from({ length: 10 }, () => lens(-90 + r() * 200, WATER_LINE + 14 + r() * 70, 10 + r() * 24, 1.1)).join("");
  return sheetOf(skin, shore, c.far, [path(band(WATER_LINE + 40, WATER_LINE + 130), c.mid), path(band(WATER_LINE + 130, 800), c.near), path(rock, c.cliff), path(woods, c.woods), path(dark, c.dark), path(ripples, c.ripple), path(glints, c.glint)].join(""), 800);
}

// ── The near banks and the trees in front ───────────────────

/** The near banks at the sides: pebble beaches curving down into the water, grass behind them with its tufts, a few
 *  stones (on a phone, the river fills the bottom: they show on a wider screen). */
export function banks(skin) {
  const p = paper(skin);
  const c = p ? { pebbles: "#d9cfb6", pebble: "#c4b89c", lit: "#ece4d0", grass: "#86ab58", tuft: "#6f9446", stone: "#a49c8d" } : { pebbles: A.cream, pebble: "#e3cfa6", lit: A.cream, grass: A.grass, tuft: A.green, stone: "#2f4b6e" };
  // each bank by its edge along the water, from the far end down to the bottom, closed on the layer's side
  const shapes = [
    [[[-300, 540], [-200, 556], [-120, 588], [-70, 640], [-40, 712], [-30, 800]], L, c.pebbles],
    [[[-420, 600], [-250, 610], [-160, 650], [-110, 712], [-96, 800]], L, c.grass],
    [[[700, 530], [580, 552], [500, 594], [452, 660], [430, 800]], R, c.pebbles],
    [[[820, 590], [680, 606], [580, 646], [524, 716], [508, 800]], R, c.grass],
  ];
  const r = random(193);
  let pebbles = "";
  let tufts = "";
  const out = shapes.map(([edge, side, fill], k) => {
    const d = `${curve(edge)}L${side} 800L${side} ${edge[0][1]}Z`;
    for (let i = 0; i < 26; i++) {
      const f = r();
      const [ax, ay] = edge[Math.floor(f * (edge.length - 1))];
      const [x, y] = [ax + (side === L ? -1 : 1) * (6 + r() * 60), ay + r() * 40];
      if (k % 2 === 0) pebbles += lens(x, y, 3 + r() * 5, 1.2 + r());
      else tufts += tuft(x, y, 3 + r() * 3);
    }
    return piece(skin, d, path(d, fill), curve(edge), 0.6);
  });
  return [out[0], out[2], path(pebbles, c.pebble), out[1], out[3], path(tufts, c.tuft), ...[[-70, 676, 20], [-120, 630, 14], [468, 662, 22], [520, 600, 14]].map(([x, y, w]) => slab(skin, [[x, y], [x + w * 0.2, y - w * 0.4], [x + w * 0.7, y - w * 0.46], [x + w, y]], c.stone, 0.4))].join("");
}

/** A branch along `line` ([[x, y]], from its foot), `w0` wide there tapering to `w1`: a polygon. */
function limb(line, w0, w1) {
  const side = (sign) =>
    line.map(([x, y], k) => {
      const [ax, ay] = line[Math.max(0, k - 1)];
      const [bx, by] = line[Math.min(line.length - 1, k + 1)];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const half = ((w0 + (w1 - w0) * (k / (line.length - 1))) / 2) * sign;
      return [x - ((by - ay) / len) * half, y + ((bx - ax) / len) * half];
    });
  return [...side(1), ...side(-1).reverse()];
}

/** The leaves of a tree over the water, scattered by `r` (a random()): clumps of puffs ([x, y, size]) round a centre, a
 *  puff (a puffed blob), its lit top (a smaller one), a cluster hanging from a branch. */
function foliage(r) {
  return {
    clump: (cx, cy, w, h, count, s0 = 14) => Array.from({ length: count }, () => [cx + (r() - 0.5) * w, cy + (r() - 0.5) * h, s0 + r() * 14]),
    puff: ([x, y, s]) => blob([[x - s, y], [x - s * 0.6, y - s * 0.7], [x, y - s * 0.9], [x + s * 0.7, y - s * 0.6], [x + s, y], [x + s * 0.5, y + s * 0.6], [x - s * 0.5, y + s * 0.6]]),
    top: ([x, y, s]) => blob([[x - s * 0.8, y - s * 0.1], [x - s * 0.5, y - s * 0.66], [x + s * 0.1, y - s * 0.84], [x + s * 0.5, y - s * 0.5], [x, y - s * 0.3]]),
    droop: ([x, y, s]) => blob([[x - s * 0.5, y], [x, y - s * 0.3], [x + s * 0.5, y], [x + s * 0.4, y + s * 1.2], [x, y + s * 2], [x - s * 0.4, y + s * 1.2]]),
  };
}

/** The trees leaning over the water in front, framing the scene (after the photo of the river under the trees): on the
 *  left a trunk leaning in from the bank, its long branch reaching over the water, leaves in clumps and in clusters
 *  hanging from it; on the right, a leafy branch from the other bank (the poster: dark greens). The middle of the sky
 *  stays clear for the poster's lettering. */
export function trees(skin) {
  const p = paper(skin);
  const c = p ? { trunk: "#5b4430", bark: "#7d6246", leaves: "#3f6a35", lit: "#5f8c45", far: "#33582d" } : { trunk: A.navy, bark: "#2f4b6e", leaves: "#24442f", lit: A.green, far: "#1d3826" };
  const trunk = limb([[-250, 800], [-196, 660], [-138, 530], [-80, 420], [-24, 320], [24, 214], [64, 150]], 46, 14);
  const reach = limb([[-30, 330], [30, 292], [96, 270], [158, 262], [206, 270]], 16, 4);
  const rise = limb([[10, 236], [34, 170], [44, 100], [40, 40]], 12, 5);
  const right = limb([[1000, 120], [820, 96], [640, 84], [500, 92], [400, 112], [340, 136]], 26, 5);
  const bark = limb([[-240, 800], [-188, 660], [-130, 530], [-72, 420], [-16, 320], [28, 214], [64, 150]], 12, 4);
  // the leaves: clumps (a puffed blob, its lit top a smaller one) and clusters hanging from the branches
  const { clump, puff, top, droop } = foliage(random(197));
  const back = [...clump(-140, 40, 380, 180, 26), ...clump(70, 70, 120, 90, 8), ...clump(620, 40, 560, 90, 22), ...clump(400, 96, 120, 40, 6, 10)];
  const front = [...clump(-60, 130, 200, 110, 12), ...clump(150, 250, 120, 30, 6, 9), ...clump(80, 270, 100, 26, 4, 9), ...clump(470, 96, 160, 44, 8, 10)];
  const hanging = [[120, 272, 9], [168, 270, 8], [196, 276, 7], [60, 290, 9], [360, 140, 8], [420, 120, 9], [500, 106, 8], [-10, 230, 10]];
  const all = (list, shape) => list.map(shape).join("");
  const wood = [trunk, reach, rise, right].map(poly).join("");
  return [
    piece(skin, wood, path(wood, c.trunk) + path(poly(bark), c.bark), topEdge(limb([[-30, 330], [30, 292], [96, 270], [158, 262], [206, 270]], 16, 4)), 1),
    piece(skin, all(back, puff), path(all(back, puff), c.far) + path(all(back, top), c.leaves), "", 1),
    piece(skin, all(front, puff) + all(hanging, droop), path(all(front, puff) + all(hanging, droop), c.leaves) + path(all(front, top), c.lit), "", 0.8),
  ].join("");
}

// ── The launch at Carsac (paper only: it never becomes the poster) ──

/** The far bank's low cliff at Carsac, its top edge from its foot on the left to the layer's right edge: the river's
 *  reflection mirrors it (water()). */
export const RIVE = [[198, WATER_LINE], [204, 430], [214, 404], [230, 386], [258, 374], [300, 370], [360, 374], [430, 368], [520, 374], [640, 366], [780, 372], [R, 368]];
// the wooded hills behind it, pale with the distance
const HEIGHTS = [[L, 330], [-450, 312], [-300, 326], [-150, 306], [-20, 318], [80, 300], [180, 322], [280, 304], [400, 318], [520, 300], [680, 316], [840, 298], [R, 312]];

/** The far bank at Carsac: the wooded hills behind, the wooded slope coming down to the water on the left, the
 *  limestone cliff along the river on the right, thick with woods on top, and the village's houses on it. */
export function rive() {
  const r = random(301);
  const face = [...RIVE, [R, WATER_LINE + 6], [RIVE[0][0], WATER_LINE + 6]];
  const { bands, lit, overhangs, tufts, streaks } = strata({ edge: RIVE, x0: 204, x1: R, y0: 380, foot: WATER_LINE, r });
  const crest = [];
  for (const [sink, s0] of [[-8, 12], [6, 10]]) for (let x = 200; x < R; x += 14 + r() * 10) if (x < 444 || x > 566 || sink < 0) crest.push([x, edgeAt(RIVE, x) + sink, s0 + r() * 7]);
  const village = [[452, 370, 15], [470, 368, 13], [486, 371, 16], [506, 368, 14], [524, 372, 15], [544, 369, 12]].map(([x, y, w], k) =>
    house(x, y, w, { stone: "#dcc391", shade: "#bba06c", roof: k % 3 ? "#9a5236" : "#6c6a70", window: "#4c3b2c" }),
  );
  return [
    sheetOf("paper", HEIGHTS, "#9cb7a4", "", WATER_LINE + 10),
    roundTrees(row(HEIGHTS, L, R, 30, [10, 15], 8, 303), { tint: { crown: "#7d9b7a", lit: "#91ad8a", trunk: "#7d9b7a" }, smooth: false }),
    sheetOf("paper", FAR, "#86a585", "", WATER_LINE + 10),
    roundTrees(row(FAR, L, R, 26, [12, 17], 10, 309), { tint: { crown: "#5f8a55", lit: "#76a064", trunk: "#5b4430" }, smooth: false }),
    sheetOf("paper", BANK, "#6a9150", "", WATER_LINE + 10),
    roundTrees([...row(BANK, L, 196, 20, [13, 19], 10, 305), ...row(BANK, L, 150, 24, [15, 23], 26, 307)], { smooth: false }),
    piece("paper", poly(face), path(poly(face), "#e9dfc7") + path(bands, "#e1d4b8") + path(lit, "#f3ecda") + path(overhangs, "#cbbb98") + path(streaks, "#d2c7b0") + path(tufts, "#7f9c5c"), "", 0.7),
    roundTrees(crest, { smooth: false }),
    piece("paper", village.map((h) => h.outline).join(""), village.map((h) => h.markup).join(""), "", 0.5),
  ].join("");
}

// the beach's edge along the water, from the far left down to the bottom: the beach lies under it
const SHORE = [[L, 598], [-420, 592], [-300, 598], [-180, 604], [-60, 618], [40, 636], [150, 664], [228, 696], [280, 736], [318, 790]];
const PEBBLES = ["#9f978a", "#b5ab98", "#8a857d", "#c4b9a2", "#a6957b"];

/** A pebble at x, y, `s` across: a rounded stone, wider than high (curved if big, a polygon if small). */
const pebble = (x, y, s, round) => (round ? blob : poly)([[x - s, y], [x - s * 0.55, y - s * 0.55], [x + s * 0.45, y - s * 0.6], [x + s, y - s * 0.05], [x + s * 0.5, y + s * 0.45], [x - s * 0.55, y + s * 0.42]]);
/** A canoe upside down on the beach, `w` long from x, y (its gunwale on the pebbles). */
const hull = (x, y, w) => blob([[x, y], [x + w * 0.06, y - w * 0.12], [x + w * 0.5, y - w * 0.17], [x + w * 0.94, y - w * 0.12], [x + w, y], [x + w * 0.5, y + w * 0.02]]);

/** The pebble beach at Carsac where the canoes go in (after the photos): grey and beige pebbles bigger nearer, a wet
 *  band and foam along the water, a few big stones, and the rental's lime canoes upside down on the far left. */
export function plage() {
  const r = random(311);
  const beach = `${curve(SHORE)}L318 800L${L} 800Z`;
  const wet = poly([...SHORE, ...[...SHORE].reverse().map(([x, y]) => [x - 6, y + 14])]);
  const groups = PEBBLES.map(() => "");
  let lit = "";
  for (let k = 0; k < 260; k++) {
    const x = 316 - r() ** 1.5 * 910; // thicker towards the water's edge, in sight on a phone
    const y = 600 + r() ** 0.8 * 190;
    if (y < edgeAt(SHORE, x) + 5) continue;
    const s = 1.6 + ((y - 590) / 200) * 6.5 * (0.6 + r() * 0.6);
    groups[k % PEBBLES.length] += pebble(x, y, s, s > 5);
    if (s > 3.5) lit += lens(x - s * 0.45, y - s * 0.38, s * 0.6, s * 0.08);
  }
  const canoes = [hull(-330, 632, 120), hull(-210, 640, 112)].join("");
  const keels = [lens(-318, 618, 96, 2.2), lens(-199, 626, 90, 2.2)].join("");
  const paddle = poly([[-100, 646], [-96, 646], [-140, 590], [-143, 592]]) + blob([[-145, 592], [-150, 576], [-143, 566], [-136, 576], [-138, 590]]);
  return [
    piece("paper", beach, path(beach, "#d6cbb2") + path(wet, "#bbb19c"), curve(SHORE), 0.4),
    `<path d="${curve(SHORE.map(([x, y]) => [x + 2, y - 2]))}" fill="none" stroke="#f4fbff" stroke-width="2.2" stroke-dasharray="26 9 12 7" stroke-linecap="round"/>`,
    `<path d="${groups.join("")}" transform="translate(0 1.2)" fill="#3b2a18" fill-opacity=".24"/>`, // their shadow, once: there are many
    groups.map((d, k) => path(d, PEBBLES[k])).join("") + path(lit, "#e6dfcf"),
    ...[[-46, 772, 44], [150, 790, 56], [-190, 700, 34]].map(([x, y, w]) => rock(x, y, w, "paper")),
    piece("paper", canoes + paddle, path(canoes, "#a6d23a") + path(keels, "#79a520") + path(paddle, "#9cc63a"), "", 0.6),
  ].join("");
}

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** A wooden signpost at x, y (its post's foot), its arrow-shaped plank pointing right with `text` on it (ink on wood:
 *  css/intros.css, st-sign). */
export function panneau(x, y, text) {
  const plank = [[x - 54, y - 94], [x + 46, y - 94], [x + 58, y - 81], [x + 46, y - 68], [x - 54, y - 68]];
  const post = poly([[x - 4, y], [x - 4, y - 100], [x + 4, y - 100], [x + 4, y]]);
  const grain = [lens(x - 48, y - 90, 40, 0.5), lens(x + 6, y - 71, 34, 0.5), lens(x - 30, y - 70.5, 22, 0.4)].join("");
  return [
    piece("paper", post, path(post, "#6b4b2e") + path(poly([[x - 4, y], [x - 4, y - 100], [x - 1.5, y - 100], [x - 1.5, y]]), "#8a6643"), "", 0.6),
    piece("paper", poly(plank), path(poly(plank), "#c99a62") + path(grain, "#b5844f"), topEdge(plank), 0.8),
    `<text class="st-sign" x="${x - 2}" y="${y - 76.5}" text-anchor="middle">${escape(text)}</text>`,
  ].join("");
}

// ── On the water: the eddies, the dizzy spiral, the paddle's drops (recipes-eau.js) ──

/** The eddies of a boat spinning round, `r` units in radius round their middle (an <svg>, seen from above: its box lays
 *  it flat): three paper arms curling in, a darker swirl of deep water under them, flecks of foam round them. */
export function remous(r) {
  const arm = (phase) => {
    const out = [];
    const back = [];
    for (let k = 0; k <= 18; k++) {
      const f = k / 18;
      const a = phase + f * 4.4;
      const rad = r * (0.16 + 0.8 * f);
      const w = r * 0.08 * Math.sin(Math.PI * Math.min(1, f * 1.15)) + 0.5;
      out.push([Math.cos(a) * (rad + w), Math.sin(a) * (rad + w)]);
      back.push([Math.cos(a) * (rad - w), Math.sin(a) * (rad - w)]);
    }
    return poly([...out, ...back.reverse()]);
  };
  const arms = [0, 2.09, 4.19].map(arm).join("");
  const rnd = random(321);
  const foam = Array.from({ length: 14 }, (_, k) => {
    const a = (k / 14) * 6.28 + rnd();
    const at = r * (0.88 + rnd() * 0.1);
    return dot(Math.cos(a) * at, Math.sin(a) * at, 1.6 + rnd() * 2.2);
  }).join("");
  return `<svg viewBox="${-r} ${-r} ${2 * r} ${2 * r}" width="${2 * r}" height="${2 * r}">${path(dot(0, 0, r * 0.94), "#6c9fc2")}${path(dot(0, 0, r * 0.6), "#5b90b6")}${piece("paper", arms, path(arms, "#e8f4f9"), "", 1.4)}${path(foam, "#f6fbfd")}</svg>`;
}

/** The dizzy spiral over someone's head (an <svg> 52 × 44 round its middle): a curling paper strip, three little stars
 *  round it. */
export function tournis() {
  const turns = Array.from({ length: 42 }, (_, k) => [Math.cos(k * 0.42) * (1.5 + k * 0.38), Math.sin(k * 0.42) * (1.5 + k * 0.38) * 0.8]);
  const d = `M${turns.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
  const star = ([x, y]) => poly([[x, y - 5], [x + 1.4, y - 1.4], [x + 5, y], [x + 1.4, y + 1.4], [x, y + 5], [x - 1.4, y + 1.4], [x - 5, y], [x - 1.4, y - 1.4]]);
  const stars = [[21, -4], [-15, -12], [-12, 14]].map(star).join("");
  return `<svg viewBox="-26 -22 52 44" width="52" height="44"><path d="${d}" transform="translate(0 1.8)" fill="none" stroke="#3b2a18" stroke-opacity=".22" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fffaf0" stroke-width="3.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#7aa9cf" stroke-width="1.2" stroke-linecap="round"/><path d="${stars}" fill="#f6c453" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
}

/** A paddle's splash (an <svg> 28 × 22, its foot in its bottom middle): three drops fanning up, white-edged. */
export function gouttes() {
  const drop = (x, y, s, lean) => `M${x} ${y - s * 1.6}C${x + s * 0.4 + lean} ${y - s * 0.7} ${x + s} ${y - s * 0.2} ${x + s} ${y + s * 0.3}A${s} ${s} 0 0 1 ${x - s} ${y + s * 0.3}C${x - s} ${y - s * 0.2} ${x - s * 0.4 + lean} ${y - s * 0.7} ${x} ${y - s * 1.6}Z`;
  const drops = [drop(-8, -5, 2.6, -1), drop(0, -10, 3.2, 0), drop(8, -4, 2.4, 1)].join("");
  return `<svg viewBox="-14 -18 28 22" width="28" height="22"><path d="${drops}" fill="#bfe3f3" stroke="#fff" stroke-width="1.4"/><path d="${[dot(-8.8, -6, 0.7), dot(-0.8, -11, 0.9), dot(7.3, -5, 0.6)].join("")}" fill="#fff"/></svg>`;
}

// ── The descent from Carsac (paper only) ────────────────────

/** Where the river bends out of sight between Domme's cliff and Montfort's rock (props-chateaux.js): paddling down it,
 *  the decor glides towards it, and Vitrac's bridge comes from there. */
export const BEND = { x: 195, y: 440 };
// the banks' edges along the water, from the bend down to the bottom
const SHORE_L = [[172, 446], [150, 462], [118, 488], [76, 526], [30, 572], [-20, 630], [-62, 700], [-90, 790]];
const SHORE_R = [[218, 446], [240, 462], [272, 488], [314, 526], [360, 572], [410, 630], [452, 700], [480, 790]];

/** The far wooded hills where the river bends out of sight, pale with the distance. */
export function lointain() {
  const far = [[L, 380], [-300, 366], [0, 384], [120, 372], [200, 392], [280, 376], [420, 388], [700, 370], [R, 384]];
  return sheetOf("paper", far, "#a9c0b2", "", WATER_LINE + 10) + roundTrees(row(far, L, R, 26, [5, 8], 5, 331), { tint: { crown: "#86a385", lit: "#9ab597", trunk: "#86a385" }, smooth: false });
}

/** The river going away to its bend: bands paler far off, the woods' green reflections along the banks and the cliffs'
 *  pale ones by the bend, ripples wider nearer, light and dark, glints of the sun. */
export function fuyante() {
  const r = random(341);
  const top = [[L, 446], [-200, 444], [100, 440], [BEND.x, 438], [300, 440], [600, 444], [R, 446]];
  const band = (y, bulge) => `M${L} ${y}Q${BEND.x} ${y - bulge} ${R} ${y}V800H${L}Z`;
  // a reflection along a bank, wider nearer: from its edge out into the river
  const reflect = (shore, side, k) => poly([...shore, ...[...shore].reverse().map(([x, y]) => [x - side * (6 + (y - 440) * k), y])]);
  const woods = reflect(SHORE_L, -1, 0.34) + reflect(SHORE_R, 1, 0.34);
  const cliffs = poly([[96, 446], [178, 446], [188, 470], [124, 482]]) + poly([[212, 446], [304, 446], [282, 478], [204, 470]]);
  const ripple = (spread) => {
    const y = 448 + r() ** 1.5 * 340;
    return lens(BEND.x + (r() - 0.5) * (40 + (y - 440) * spread), y, 6 + (y - 440) * 0.3 * (0.5 + r()), 0.6 + (y - 440) * 0.006);
  };
  const light = Array.from({ length: 70 }, () => ripple(3.6)).join("");
  const dark = Array.from({ length: 36 }, () => ripple(2.6)).join("");
  const glints = Array.from({ length: 12 }, () => lens(BEND.x - 30 + r() * 50, 452 + r() * 70, 6 + r() * 14, 0.9)).join("");
  return sheetOf("paper", top, "#b9d6e5", [path(band(476, 14), "#9cc4dc"), path(band(560, 26), "#86b4d2"), path(band(680, 30), "#77a8c9"), path(woods, "#6e9c9a"), path(cliffs, "#d3dfdb"), path(dark, "#6c9ec0"), path(light, "#e2eff6"), path(glints, "#fbfdfe")].join(""), 800);
}

/** A point `f` (0 → 1) of the way along a line of points, by their indexes. */
function along(list, f) {
  const k = Math.min(list.length - 2, Math.floor(f * (list.length - 1)));
  const t = f * (list.length - 1) - k;
  return [list[k][0] + t * (list[k + 1][0] - list[k][0]), list[k][1] + t * (list[k + 1][1] - list[k][1])];
}

/** The banks going away to the bend: pebbles along the water, the grass with its tufts, and the woods lining each bank
 *  (as in the photo of the river under the trees): bushes by the water, tall trees behind them, small far off and big
 *  near. */
export function berges() {
  const r = random(351);
  const left = `${curve(SHORE_L)}L${L} 790L${L} 452Z`;
  const right = `${curve(SHORE_R)}L${R} 790L${R} 452Z`;
  const strip = (shore, side) => poly([...shore, ...[...shore].reverse().map(([x, y]) => [x + side * (4 + (y - 440) * 0.08), y + 2])]);
  const pebbles = strip(SHORE_L, -1) + strip(SHORE_R, 1);
  let tufts = "";
  const tall = [];
  const bushes = [];
  const woods = []; // further out, for the wide screens: polygons
  for (const [shore, side] of [[SHORE_L, -1], [SHORE_R, 1]]) {
    for (let k = 0; k < 30; k++) {
      const [x, y] = along(shore, 0.1 + r() * 0.9);
      tufts += tuft(x + side * (10 + r() * 30), y + r() * 6, 2 + (y - 440) * 0.012);
    }
    for (let f = 0.02; f < 1; f += 0.045 + r() * 0.02) {
      const [x, y] = along(shore, f);
      const s = 4 + (y - 440) * 0.16;
      tall.push([x + side * (s * 1.5 + 14), y - 2, s * (1 + r() * 0.35)], [x + side * (s * 3.1 + 30), y - 6, s * (1.1 + r() * 0.3)]);
      woods.push([x + side * (s * 5 + 52), y - 10, s * (1.2 + r() * 0.3)], [x + side * (s * 7.4 + 84), y - 14, s * (1.25 + r() * 0.3)]);
      bushes.push([x + side * (s * 0.55 + 6), y + 3, s * (0.45 + r() * 0.2)]);
    }
  }
  return [
    piece("paper", left + right, path(left + right, "#6a9447") + path(pebbles, "#d9cfb6") + path(tufts, "#5f8a3e"), curve(SHORE_L) + curve(SHORE_R), 0.6),
    roundTrees(woods, { tint: { crown: "#3c6533", lit: "#527f40" }, lift: 0.6, smooth: false }),
    roundTrees(tall, { tint: { crown: "#416d37", lit: "#5b8a45" }, lift: 0.6 }),
    roundTrees(bushes, { tint: { crown: "#5d8a42", lit: "#79a356" }, lift: 0.4 }),
  ].join("");
}

/** The trees leaning over the river on both banks in front, as in the photo of the river under the trees: their trunks
 *  leaning in, branches reaching over the water, leaves in clumps along the top and clusters hanging from them; the
 *  middle stays open on the river and the castles. */
export function penches() {
  const trunks = [
    limb([[-190, 800], [-140, 640], [-90, 500], [-46, 380], [-8, 270], [30, 170]], 42, 12),
    limb([[-14, 290], [50, 236], [110, 200], [160, 178]], 14, 4),
    limb([[580, 800], [530, 640], [480, 500], [436, 380], [398, 270], [360, 170]], 42, 12),
    limb([[404, 290], [340, 236], [280, 200], [230, 178]], 14, 4),
  ];
  const bark = [limb([[-180, 800], [-132, 640], [-82, 500], [-38, 380], [0, 270], [34, 172]], 11, 4), limb([[570, 800], [522, 640], [472, 500], [428, 380], [390, 270], [356, 172]], 11, 4)];
  const { clump, puff, top, droop } = foliage(random(361));
  // the canopy along the top, thick over the banks, thin over the middle; its far ends for the wide screens
  const back = [...clump(10, 50, 270, 170, 30), ...clump(380, 50, 270, 170, 30), ...clump(195, 6, 210, 50, 10, 10), ...clump(-300, 120, 300, 260, 16), ...clump(690, 120, 300, 260, 16)];
  const front = [...clump(36, 140, 170, 80, 12), ...clump(354, 140, 170, 80, 12), ...clump(140, 186, 70, 28, 5, 8), ...clump(250, 186, 70, 28, 5, 8)];
  const hanging = [[60, 186, 8], [96, 196, 8], [130, 184, 7], [166, 176, 6], [24, 204, 9], [-10, 214, 10], [224, 176, 6], [260, 184, 7], [294, 196, 8], [330, 186, 8], [366, 204, 9], [400, 214, 10], [180, 40, 7], [212, 46, 6]];
  const all = (list, shape) => list.map(shape).join("");
  const wood = trunks.map(poly).join("");
  return [
    piece("paper", wood, path(wood, "#5b4430") + path(bark.map(poly).join(""), "#7d6246"), "", 1),
    piece("paper", all(back, puff), path(all(back, puff), "#33582d") + path(all(back, top), "#3f6a35"), "", 1),
    piece("paper", all(front, puff) + all(hanging, droop), path(all(front, puff) + all(hanging, droop), "#3f6a35") + path(all(front, top), "#5f8c45"), "", 0.8),
  ].join("");
}

/** Vitrac's stone bridge across the river near its bend (round BEND, the river showing through its arches): five
 *  round arches on piers with cutwaters, the voussoirs round them, the shade of the vaults inside, the spandrel wall,
 *  the cornice and the parapet along the road. Its layer grows from the bend until it passes over the canoe. */
export function pont() {
  const { x: bx, y: by } = BEND;
  const at = (x, y) => [bx + x, by + y];
  const base = 60; // the water line, under the bend
  // its arches, from the middle out: [centre, radius, springing (where the round starts)]
  const arches = [[0, 52, -10], [-112, 40, 0], [112, 40, 0], [-196, 30, 10], [196, 30, 10]];
  const deck = (x) => -96 + (x / 300) ** 2 * 12; // the parapet's top, gently humped
  const road = (dy) => Array.from({ length: 13 }, (_, k) => at(-300 + k * 50, deck(-300 + k * 50) + dy));
  /** An arch's opening (`inset` units inside it: its vault's shade), from the wall's foot up round and down again:
   *  it cuts through the wall's foot. */
  const round = (cx, rad, spring, inset = 0) => {
    const list = [at(cx - rad + inset, base + 4), at(cx - rad + inset, spring)];
    for (let k = 1; k < 16; k++) list.push(at(cx - Math.cos((k / 16) * Math.PI) * (rad - inset), spring - Math.sin((k / 16) * Math.PI) * (rad - inset)));
    return [...list, at(cx + rad - inset, spring), at(cx + rad - inset, base + 4)];
  };
  const wall = poly([...road(14), at(300, base + 4), at(-300, base + 4)]);
  const openings = arches.map(([cx, rad, spring]) => poly(round(cx, rad, spring))).join("");
  const vaults = arches.map(([cx, rad, spring]) => poly(round(cx, rad, spring, 7))).join("");
  const parapet = [...road(0), ...road(14).reverse()];
  const cornice = poly([...road(14), ...road(18).reverse()]);
  const piers = [-70, 70, -166, 166];
  const cutwaters = piers.map((x) => poly([at(x - 9, base), at(x - 9, base - 34), at(x, base - 46), at(x + 9, base - 34), at(x + 9, base)])).join("");
  const shadeCut = piers.map((x) => poly([at(x, base), at(x, base - 46), at(x + 9, base - 34), at(x + 9, base)])).join("");
  const r = random(371);
  const open = (x, y) => arches.some(([cx, rad, spring]) => Math.abs(x - cx) < rad + 3 && (y > spring || Math.hypot(x - cx, y - spring) < rad + 3));
  let stones = "";
  for (let k = 0; k < 90; k++) {
    const [x, y, w] = [-290 + r() * 570, -78 + r() * 136, 8 + r() * 10];
    if (y > deck(x) + 22 && !open(x, y) && !open(x + w, y)) stones += lens(bx + x, by + y, w, 0.9);
  }
  const voussoirs = arches
    .flatMap(([cx, rad, spring]) =>
      Array.from({ length: 9 }, (_, k) => {
        const a = ((k + 0.5) / 9) * Math.PI;
        const [ox, oy] = [cx - Math.cos(a) * (rad + 5), spring - Math.sin(a) * (rad + 5)];
        return poly([at(ox - 1.3, oy - 1.3), at(ox + 1.3, oy - 1.3), at(ox + 1.3, oy + 1.3), at(ox - 1.3, oy + 1.3)]);
      }),
    )
    .join("");
  // the wall less its openings, its shadow too (even-odd, inherited); inside each opening, its vault's shade
  return [
    `<g fill-rule="evenodd">${piece("paper", wall + openings, path(wall + openings, "#d9c7a3"), "", 1.2)}${path(openings + vaults, "#a08a64")}</g>`,
    path(stones, "#c9b48e") + path(voussoirs, "#b9a37c"),
    piece("paper", cutwaters, path(cutwaters, "#e2d2b0") + path(shadeCut, "#b9a37c"), "", 0.6),
    piece("paper", poly(parapet) + cornice, path(poly(parapet), "#e6d7b6") + path(cornice, "#bda882"), topEdge(parapet), 0.8),
  ].join("");
}
