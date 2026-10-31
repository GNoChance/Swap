// The river's pieces (the canoe's spec, § 4): the Dordogne on a summer day, after Kevin's photos (the river under the
// trees, the selfie in the canoe): the blue sky and its clouds, the far hills, the wooded south bank, the water in bands
// with the cliff's and the woods' reflections, the near banks, and the trees leaning over the water in front. Each takes
// its skin, "paper" or "poster" (props.js). Its layers are 1600 units wide (x −605 to 995), the stage's middle clear for
// the canoe. Pure: markup only, the same for the same arguments.
import { AFFICHE as A } from "./decor.js";
import { blob, curve, dot, lens, mirror, path, poly, random, topEdge, tuft } from "./geom.js";
import { paper, piece, roundTrees, row, sheetOf, slab } from "./props.js";

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
  const r = random(197);
  // the leaves: clumps (a puffed blob, its lit top a smaller one) and clusters hanging from the branches
  const clump = (cx, cy, w, h, count, s0 = 14) => Array.from({ length: count }, () => [cx + (r() - 0.5) * w, cy + (r() - 0.5) * h, s0 + r() * 14]);
  const puff = ([x, y, s]) => blob([[x - s, y], [x - s * 0.6, y - s * 0.7], [x, y - s * 0.9], [x + s * 0.7, y - s * 0.6], [x + s, y], [x + s * 0.5, y + s * 0.6], [x - s * 0.5, y + s * 0.6]]);
  const top = ([x, y, s]) => blob([[x - s * 0.8, y - s * 0.1], [x - s * 0.5, y - s * 0.66], [x + s * 0.1, y - s * 0.84], [x + s * 0.5, y - s * 0.5], [x, y - s * 0.3]]);
  const droop = ([x, y, s]) => blob([[x - s * 0.5, y], [x, y - s * 0.3], [x + s * 0.5, y], [x + s * 0.4, y + s * 1.2], [x, y + s * 2], [x - s * 0.4, y + s * 1.2]]);
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
