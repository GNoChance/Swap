// The Dordogne's castles (the canoe's spec, § 4), in paper: for now Beynac, its keep high on its cliff over the river and
// its village stepping down to the water. Each takes its skin, "paper" or "poster" (props.js). Pure: markup only, the
// same for the same arguments.
import { AFFICHE as A } from "./decor.js";
import { blob, lens, path, poly, random } from "./geom.js";
import { paper, piece, roundTrees, slab } from "./props.js";

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
  let bands = "";
  let lit = "";
  let overhangs = "";
  let streaks = "";
  let tufts = "";
  for (let y = 312; y < FOOT - 6; y += 13 + r() * 9)
    for (let x = 196 + r() * 40; x < R; x += 70 + r() * 90) {
      if (y < topAt(x) + 8 || y < topAt(x + 60) + 8) continue;
      const w = 40 + r() * 80;
      bands += lens(x, y, w, 2.6 + r() * 2);
      if (r() < 0.45) overhangs += lens(x + 4, y + 4, w * 0.8, 1.6);
      else lit += lens(x + 6, y - 2.6, w * 0.6, 1);
      if (r() < 0.3) tufts += blob([[x + w * 0.3, y - 1], [x + w * 0.36, y - 5], [x + w * 0.44, y - 6], [x + w * 0.5, y - 2]]);
    }
  for (let x = 210; x < R; x += 22 + r() * 34) {
    const y = topAt(x) + 14 + r() * 20;
    const [w, h, lean] = [1.6 + r() * 2.4, 26 + r() * 70, (r() - 0.5) * 6];
    streaks += poly([[x, y], [x + w, y + 2], [x + w * 0.5 + lean, Math.min(FOOT, y + h)]]); // a trickle, tapering down
  }
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
