// The Dordogne's castles (the canoe's spec, § 4), in paper: Beynac, its keep high on its cliff over the river and its
// village stepping down to the water (it takes its skin, "paper" or "poster": props.js); downstream from Carsac,
// Montfort on its rock and Domme high on its cliff (paper only). Pure: markup only, the same for the same arguments.
import { AFFICHE as A } from "./decor.js";
import { edgeAt, path, poly, random } from "./geom.js";
import { paper, piece, roundTrees, slab, strata } from "./props.js";

const R = 995; // a 1600-wide layer's right edge
const FOOT = 452; // the water line (props-riviere.js: WATER_LINE)

/** Beynac's cliff over the river, its top edge from the left (where the village comes down to the water) to the
 *  layer's right edge: the river's reflection mirrors it. */
export const CLIFF = [[184, FOOT], [194, 424], [206, 392], [222, 356], [236, 322], [254, 302], [290, 292], [340, 290], [400, 298], [470, 306], [560, 314], [680, 322], [820, 330], [R, 336]];

/** A stone house at x, y (its foot), `w` wide (Beynac's village, the valley's map): its walls (`stone`), the shaded
 *  side, a roof, a window; `tall` and `pitch`: its walls' and its roof's height over its width. → { outline, markup },
 *  to cut with its neighbours. */
export function house(x, y, w, { stone, shade, roof, window, tall = 0.62, pitch = 0.5 }) {
  const h = w * tall;
  const top = [[x - 1.5, y - h], [x + w * 0.5, y - h - w * pitch], [x + w + 1.5, y - h]];
  return {
    outline: poly([[x, y], [x, y - h], ...top, [x + w, y - h], [x + w, y]]),
    markup: path(poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]), stone) + path(poly([[x + w * 0.64, y], [x + w * 0.64, y - h], [x + w, y - h], [x + w, y]]), shade) + path(poly(top), roof) + path(poly([[x + w * 0.2, y - h * 0.66], [x + w * 0.38, y - h * 0.66], [x + w * 0.38, y - h * 0.36], [x + w * 0.2, y - h * 0.36]]), window),
  };
}

/** The cliff's top at x (by its edge's points). */
const topAt = (x) => {
  for (let k = 1; k < CLIFF.length; k++) if (CLIFF[k][0] >= x) return CLIFF[k - 1][1] + ((x - CLIFF[k - 1][0]) / (CLIFF[k][0] - CLIFF[k - 1][0])) * (CLIFF[k][1] - CLIFF[k - 1][1]);
  return CLIFF.at(-1)[1];
};

/** Beynac: its cliff (pale limestone in strata, the shade under its overhangs, grey streaks down it, tufts on its
 *  ledges, woods on top), the castle on it (its square crenellated keep, the steep roof of its lodgings, a round tower,
 *  the curtain wall along the edge), its village of stone houses stepping down on the left and along the water (the
 *  poster: a cream cliff, a navy castle, orange roofs). */
export function beynac(skin) {
  const p = paper(skin);
  const c = p
    ? { cliff: "#e9dfc7", band: "#e1d4b8", lit: "#f3ecda", overhang: "#cbbb98", streak: "#d2c7b0", tuft: "#7f9c5c", stone: "#dcc391", shade: "#bba06c", roof: "#6c6a70", tile: "#9a5236", window: "#4c3b2c", castle: "#d6bc87", castleShade: "#b39966", slope: "#7f9c5c" }
    : { cliff: A.cream, band: "#ecd9b2", lit: A.cream, overhang: "#e3cfa6", streak: "#d9c294", tuft: A.green, stone: A.navy, shade: "#1a2a40", roof: A.orange, tile: A.orange, window: A.cream, castle: A.navy, castleShade: "#1a2a40", slope: A.grass };
  const face = [...CLIFF, [R, FOOT + 6], [184, FOOT + 6]];
  const r = random(211);
  // the strata: long lenses across the face, a band of shade under some (an overhang), grey streaks running down
  const { bands, lit, overhangs, streaks, tufts } = strata({ edge: CLIFF, x0: 196, x1: R, y0: 312, foot: FOOT, r });
  const topWoods = [];
  for (let x = 196; x < R; x += 15 + r() * 10) if (x < 230 || x > 378) topWoods.push([x, topAt(x) + 7, 9 + r() * 6]);

  // the castle on the cliff's top, the edge there at y 290 to 300
  const base = 294;
  const keep = poly([[270, base], [270, base - 66], [302, base - 66], [302, base]]);
  const crenels = Array.from({ length: 5 }, (_, k) => poly([[270 + k * 7, base - 66], [270 + k * 7, base - 72], [274 + k * 7, base - 72], [274 + k * 7, base - 66]])).join("");
  const lodging = poly([[300, base], [300, base - 40], [350, base - 40], [350, base]]);
  const lodgingRoof = poly([[298, base - 40], [312, base - 64], [338, base - 64], [352, base - 40]]);
  const tower = poly([[250, base + 2], [250, base - 44], [264, base - 44], [264, base]]);
  const cone = poly([[247, base - 44], [257, base - 66], [267, base - 44]]);
  const edge = Array.from({ length: 18 }, (_, k) => [236 + k * 8, topAt(236 + k * 8) + 3]);
  const wall = poly([...edge, ...[...edge].reverse().map(([x, y]) => [x, Math.min(y, base) - 14])].reverse()); // wound as the towers: no hole where they meet
  const merlons = Array.from({ length: 9 }, (_, k) => {
    const x = 240 + k * 15;
    const y = Math.min(topAt(x) + 3, base) - 14;
    return poly([[x, y], [x, y - 4], [x + 6, y - 4], [x + 6, y]]);
  }).join("");
  const windows = [[278, base - 52], [290, base - 52], [284, base - 30], [310, base - 28], [326, base - 28], [340, base - 28], [255, base - 30]].map(([x, y]) => poly([[x, y], [x + 4, y], [x + 4, y + 7], [x, y + 7]])).join("");
  const castle = keep + crenels + lodging + tower + wall + merlons;
  const shade = poly([[290, base], [290, base - 66], [302, base - 66], [302, base]]) + poly([[336, base], [336, base - 40], [350, base - 40], [350, base]]);

  // the village: houses stepping down the left of the cliff to the water, and along its foot
  const village = [[150, 372, 16], [168, 384, 15], [140, 398, 17], [158, 410, 16], [176, 402, 14], [132, 426, 16], [150, 438, 18], [172, 428, 15], [192, 446, 16], [214, 450, 14], [234, 452, 16], [256, 452, 13], [280, 453, 15], [304, 452, 12], [420, 453, 14], [440, 453, 12]].map(([x, y, w], k) => house(x, y, w, { stone: c.stone, shade: c.shade, roof: k % 3 ? c.tile : c.roof, window: c.window }));
  const slope = [[110, FOOT + 6], [118, 420], [132, 386], [150, 360], [172, 352], [196, 360], [206, 392], [194, 424], [184, FOOT + 6]];
  return [
    piece(skin, poly(face), path(poly(face), c.cliff) + path(bands, c.band) + path(lit, c.lit) + path(overhangs, c.overhang) + path(streaks, c.streak) + path(tufts, c.tuft), "", 0.8),
    roundTrees(topWoods, { skin }),
    slab(skin, slope, c.slope, 0.6),
    piece(skin, castle + cone + lodgingRoof, path(castle, c.castle) + path(shade, c.castleShade) + path(lodgingRoof + cone, c.roof) + path(windows, c.window), "", 0.9),
    piece(skin, village.map((h) => h.outline).join(""), village.map((h) => h.markup).join(""), "", 0.5),
  ].join("");
}

// ── Downstream from Carsac: Montfort and Domme, round the river's bend (props-riviere.js, BEND; paper only) ──

const L = -605; // a 1600-wide layer's left edge
// the descent's paper: the limestone, the castles' stone and slate, the woods
const C = { cliff: "#e6dbc2", band: "#ddd0b2", lit: "#f2ead8", overhang: "#c9b995", streak: "#d0c5ad", tuft: "#7f9c5c", face: "#d3c4a3", stone: "#dcc391", shade: "#bba06c", slate: "#5f6674", slateLit: "#7a8291", tile: "#9a5236", window: "#4c3b2c" };

/** A limestone face under its top `edge` down to the water (its strata: props.js), cut as one piece. */
function face(edge, x0, y0, seed) {
  const r = random(seed);
  const outline = poly([...edge, [edge.at(-1)[0], FOOT + 6], [edge[0][0], FOOT + 6]]);
  const { bands, lit, overhangs, tufts, streaks } = strata({ edge, x0, x1: edge.at(-1)[0], y0, foot: FOOT, r });
  return { r, markup: piece("paper", outline, path(outline, C.cliff) + path(bands, C.band) + path(lit, C.lit) + path(overhangs, C.overhang) + path(streaks, C.streak) + path(tufts, C.tuft), "", 0.8) };
}

/** A rectangle from x0 to x1, from its foot y0 up to y1. */
const block = (x0, x1, y0, y1) => poly([[x0, y0], [x0, y1], [x1, y1], [x1, y0]]);
/** Merlons along a wall's top, from x0 to x1 at y. */
const battlements = (x0, x1, y, step = 8) => Array.from({ length: Math.floor((x1 - x0) / step) }, (_, k) => block(x0 + k * step, x0 + k * step + step / 2, y, y - 4)).join("");

// Domme's cliff on the left, from the layer's edge to its foot by the bend, the town on its top
const DOMME = [[L, 384], [-470, 370], [-340, 352], [-220, 336], [-120, 324], [-40, 318], [10, 316], [70, 316], [118, 318], [136, 328], [150, 354], [160, 392], [168, 428], [174, FOOT]];

/** Domme high on its cliff (the descent): the pale face over the river, its shaded east side above the bend, woods along
 *  its top, and the bastide at its edge: its rampart with the two round towers of its gate, its houses' brown roofs,
 *  the church and its bell tower. */
export function domme() {
  const { r, markup } = face(DOMME, -600, 322, 401);
  const east = poly([[118, 318], [136, 328], [150, 354], [160, 392], [168, 428], [174, FOOT], [150, FOOT], [142, 400], [130, 352]]);
  const woods = [];
  for (let x = -596; x < -16; x += 13 + r() * 9) woods.push([x, edgeAt(DOMME, x) + 6, 9 + r() * 6]);
  const houses = [[28, 306, 14], [42, 304, 15], [88, 305, 14], [102, 306, 13], [54, 308, 12]].map(([x, y, w], k) => house(x, y, w, { stone: C.stone, shade: C.shade, roof: k % 2 ? C.tile : "#b5653f", window: C.window }));
  const nave = block(62, 88, 308, 290);
  const naveRoof = poly([[60, 290], [75, 280], [90, 290]]);
  const belfry = block(64, 75, 308, 272);
  const spire = poly([[63, 272], [69.5, 264], [76, 272]]);
  const towers = block(-6, 8, 318, 290) + block(12, 26, 318, 290);
  const towersLit = block(-6, 0, 318, 290) + block(12, 18, 318, 290);
  const wall = block(-6, 124, 320, 308) + battlements(-6, 124, 308, 9) + battlements(-6, 8, 290, 4.6) + battlements(12, 26, 290, 4.6);
  const windows = [block(68, 71, 284, 279), block(32, 35, 300, 296), block(92, 95, 300, 296), block(-1, 2, 304, 299), block(17, 20, 304, 299)].join("");
  const church = nave + naveRoof + belfry + spire;
  return [
    markup,
    path(east, C.face),
    roundTrees(woods, { smooth: false }),
    piece("paper", houses.map((h) => h.outline).join(""), houses.map((h) => h.markup).join(""), "", 0.5),
    piece("paper", church, path(nave + belfry, C.stone) + path(block(80, 88, 308, 290), C.shade) + path(naveRoof + spire, C.tile), "", 0.6),
    piece("paper", wall + towers, path(wall + towers, C.stone) + path(towersLit, "#e8d4a6") + path(windows, C.window), "", 0.7),
  ].join("");
}

// Montfort's rock on the right, from its foot by the bend to the layer's edge, the castle on its top
const MONTFORT = [[224, FOOT], [230, 432], [238, 410], [250, 390], [266, 374], [292, 366], [336, 364], [366, 368], [388, 380], [410, 398], [446, 410], [520, 414], [640, 408], [780, 414], [R, 410]];

/** Montfort on its rock over the river (the descent): the pale rock with its strata, woods down its slopes, and the
 *  castle on top: its curtain wall, its lodging under a steep slate roof, its round tower and its turret under cones,
 *  its square keep. */
export function montfort() {
  const { r, markup } = face(MONTFORT, 228, 370, 411);
  const woods = [];
  for (let x = 396; x < R; x += 12 + r() * 9) woods.push([x, edgeAt(MONTFORT, x) + 7, 9 + r() * 6]);
  for (let x = 232; x < 262; x += 9) woods.push([x, edgeAt(MONTFORT, x) + 10, 6 + r() * 3]);
  const wall = poly([[268, 376], [268, 360], [392, 362], [392, 384]]);
  const lodging = block(298, 352, 366, 326);
  const lodgingRoof = poly([[294, 326], [306, 300], [344, 300], [356, 326]]);
  const tower = block(278, 296, 370, 318);
  const cone = poly([[275, 318], [287, 286], [299, 318]]);
  const keep = block(350, 366, 366, 312);
  const keepRoof = poly([[348, 312], [358, 294], [368, 312]]);
  const turret = block(370, 378, 374, 344);
  const turretCone = poly([[368, 344], [374, 330], [380, 344]]);
  const shade = block(288, 296, 370, 318) + block(340, 352, 366, 326) + block(360, 366, 366, 312) + block(375, 378, 374, 344);
  const roofsLit = poly([[294, 326], [306, 300], [318, 300], [310, 326]]) + poly([[275, 318], [287, 286], [285, 318]]);
  const windows = [block(306, 310, 350, 343), block(318, 322, 350, 343), block(330, 334, 350, 343), block(284, 287, 344, 338), block(355, 358, 340, 334), block(355, 358, 326, 320)].join("");
  const stone = wall + lodging + tower + keep + turret;
  const roofs = lodgingRoof + cone + keepRoof + turretCone;
  return [
    markup,
    roundTrees(woods, { smooth: false }),
    piece("paper", stone + roofs, path(stone, C.stone) + path(shade, C.shade) + path(roofs, C.slate) + path(roofsLit, C.slateLit) + path(windows, C.window), "", 0.8),
  ].join("");
}
