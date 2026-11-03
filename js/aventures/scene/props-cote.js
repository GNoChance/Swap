// The coast road home (the Île de Ré's spec, § 2, moment 9, and § 4), in paper, by day: the summer sky and its clouds
// (the river's: props-riviere.js), its sun ringed by its rays (on a sheet of its own: ile-de-re.js turns it); the sea,
// the far coast and the sailboats out at sea are the bridge's (props-pont.js); the beach, its wet sand along the water
// and its dry sand, the tide's line, its striped parasols and its towels, the little waves lapping on it (on a sheet of
// their own: ile-de-re.js moves them); the road along the sea behind its low wall, its white lines, its verge of grass
// and its wooden posts. Paper only, its layers wider than 1600 units: the decor glides by as the C3 drives home. Pure:
// markup only, the same for the same arguments.
import { cutPiece } from "./decor.js";
import { blob, dot, lens, n, path, poly, random, speck, tuft } from "./geom.js";
import { piece, sheetOf } from "./props.js";
import { edges, HORIZON, voilier } from "./props-pont.js";
import { cloud } from "./props-riviere.js";

const L = -605; // a 1600-wide layer's left edge
/** Where the sea laps on the sand, the top of the road's wall, the road's far and near edges, and the C3's lane (its
 *  wheels on it). */
export const SHORE = { sea: 556, wall: 594, road: 604, verge: 654, lane: 646 };

// ── The sky and its sun ─────────────────────────────────────

// the summer sky's strips, top to bottom, bluest high up; its clouds: [x, y, w]
const SKY = ["#7fb4e0", "#94c2e6", "#aed1ec", "#c8e0f0", "#e1eef4"];
const STRIPS = [150, 240, 320, 392].map((y, k) => {
  const r = random(701 + k);
  return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 10]);
});
const CLOUDS = [[-500, 150, 120], [-250, 214, 84], [-30, 140, 100], [140, 330, 70], [430, 190, 116], [700, 128, 96], [880, 250, 74]];

/** The summer sky by day: its blue strips paler down to the sea, its white clouds with their blue-grey bellies (the
 *  river's: props-riviere.js). */
export function ciel() {
  return [
    `<rect x="${L}" y="-30" width="1600" height="${HORIZON + 40}" fill="${SKY[0]}"/>`,
    ...STRIPS.map((edge, k) => sheetOf("paper", edge, SKY[k + 1], "", HORIZON + 10)),
    ...CLOUDS.map(([x, y, w]) => cloud(x, y, w, "paper")),
  ].join("");
}

/** The sun's place (its middle, units) and its size with its rays. */
export const SOLEIL = { x: 300, y: 236, size: 96 };

/** The summer sun (an <svg> `size` units wide, its middle in its middle): a warm paper disc, its lit crescent, ringed by
 *  twelve rays, every other one longer. */
export function soleil(size) {
  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6;
    const [r0, r1, half] = [31, k % 2 ? 41 : 47, 0.13];
    return poly([[r0 * Math.cos(a - half), r0 * Math.sin(a - half)], [r1 * Math.cos(a), r1 * Math.sin(a)], [r0 * Math.cos(a + half), r0 * Math.sin(a + half)]]);
  }).join("");
  const markup = path(rays, "#ffc94a") + path(dot(0, 0, 27), "#ffd862") + path(blob([[-20, 6], [-18, -10], [-6, -20], [6, -21], [-6, -14], [-14, -4]]), "#ffe9a3");
  return `<svg viewBox="-48 -48 96 96" width="${n(size)}" height="${n(size)}"><g>${cutPiece({ silhouette: rays + dot(0, 0, 27), markup, lift: 0.5 })}</g></svg>`;
}

// ── The sea's sailboats ─────────────────────────────────────

// the sailboats out at sea: [x, waterline, height, hull]
const SAILS = [[-420, 486, 34, "#f0ece2"], [-150, 474, 26, "#24456b"], [110, 494, 40, "#b5433a"], [330, 478, 28, "#f0ece2"], [620, 488, 36, "#24456b"], [880, 476, 28, "#b5433a"]];

/** The sailboats out at sea, far off, their sails up (the bridge's: props-pont.js). */
export const voiles = () => SAILS.map(([x, y, h, hull]) => `<g transform="translate(${n(x - 0.4 * h)} ${n(y - 1.02 * h)})">${voilier(h, hull)}</g>`).join("");

// ── The beach ───────────────────────────────────────────────

// the parasols' stripes, two colours each
const PARASOLS = [["#e2574c", "#fbf6ec"], ["#2f7f86", "#fbf6ec"], ["#f2b632", "#fbf6ec"], ["#3f68a8", "#f4d79a"]];
const TOWELS = ["#e98a6f", "#5aa3a7", "#f2cf5b", "#8e6fb5"];

/** A parasol stuck in the sand (paper), its pole's foot at x, y, `s` its size, leaning `lean`: its canopy in stripes of
 *  `tones`, its pole and its tip; a towel spread beside it (`towel`). → { silhouette, markup } */
function parasol(x, y, s, lean, tones, towel) {
  const top = [x + lean * 30 * s, y - 34 * s];
  const apex = [top[0], top[1] - 10 * s];
  // its rim, seen a little from above: curving down towards us
  const rim = Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI + (k * Math.PI) / 6;
    return [top[0] + 21 * s * Math.cos(a), top[1] + 2 * s - 4 * s * Math.sin(a)];
  });
  const dome = [apex, ...rim];
  const stripes = rim.slice(0, -1).map((p, k) => [poly([apex, p, rim[k + 1]]), tones[k % 2]]);
  const pole = poly([[x - 0.9 * s, y], [x + 0.9 * s, y], [top[0] + 0.9 * s, top[1]], [top[0] - 0.9 * s, top[1]]]);
  const [tx, ty] = [x + 8 * s, y + 3 * s];
  const cloth = poly([[tx, ty], [tx + 30 * s, ty], [tx + 34 * s, ty - 6 * s], [tx + 5 * s, ty - 6 * s]]);
  const band = poly([[tx + 10 * s, ty], [tx + 14 * s, ty], [tx + 18 * s, ty - 6 * s], [tx + 14 * s, ty - 6 * s]]);
  return {
    silhouette: poly(dome) + pole + cloth,
    markup: path(cloth, towel) + path(band, "#fbf6ec") + path(pole, "#efeae0") + stripes.map(([d, fill]) => path(d, fill)).join("") + path(dot(apex[0], apex[1], 1.4 * s), "#5a4a3a"),
  };
}

/** The beach along the sea (paper), across a layer `width` units wide: its wet sand along the water, its dry sand up to
 *  the road's wall, the tide's line of seaweed and shells, pebbles; its parasols now and then, each with a towel. */
export function plage(width) {
  const [l, r] = edges(width);
  const rand = random(711);
  const top = [];
  for (let x = l; x < r + 60; x += 60) top.push([x, SHORE.sea - 2 + (rand() - 0.5) * 2]);
  const wet = poly([...top, ...[...top].reverse().map(([x, y]) => [x, y + 9])]);
  let tide = "";
  let shells = "";
  for (let x = l + rand() * 30; x < r; x += 16 + rand() * 40) tide += lens(x, SHORE.sea + 13 + (rand() - 0.5) * 3, 10 + rand() * 22, 0.9);
  for (let i = 0; i < width / 9; i++) shells += speck(l + rand() * width, SHORE.sea + 12 + rand() * 30, 0.6 + rand() * 0.8);
  const spots = [];
  for (let x = l + 60 + rand() * 80; x < r - 40; x += 120 + rand() * 140) spots.push(parasol(x, SHORE.wall - 3 + rand() * 4, 0.9 + rand() * 0.3, (rand() - 0.5) * 0.5, PARASOLS[Math.floor(rand() * PARASOLS.length)], TOWELS[Math.floor(rand() * TOWELS.length)]));
  return [
    sheetOf("paper", top, "#efe1bb", path(wet, "#d8c79e") + path(tide, "#a99a74") + path(shells, "#fbf6ec"), 800),
    cutPiece({ silhouette: spots.map((p) => p.silhouette).join(""), markup: spots.map((p) => p.markup).join(""), lift: 0.6 }),
  ].join("");
}

/** The little waves lapping on the sand (an <svg> as wide as a layer `width` units wide, its bottom 4 units under the
 *  water's edge): a sheen of water thinning up the sand, and three rows of broken white foam, the nearest the thickest. */
export function vaguelettes(width) {
  const [l] = edges(width);
  const r = random(721);
  let foam = "";
  for (const [y, h] of [[SHORE.sea - 9, 0.9], [SHORE.sea - 4.5, 1.3], [SHORE.sea, 1.8]])
    for (let x = l + r() * 20; x < l + width; x += 34 + r() * 46) foam += lens(x, y, 26 + r() * 54, h);
  const sheen = poly([[l, SHORE.sea - 1], [l + width, SHORE.sea - 1], [l + width, SHORE.sea + 3], [l, SHORE.sea + 3]]);
  return `<svg viewBox="${l} ${SHORE.sea - 14} ${width} 18" width="${width}" height="18"><path d="${sheen}" fill="#e7f1ee" fill-opacity=".7"/>${path(foam, "#fbfdff")}</svg>`;
}

// ── The road ────────────────────────────────────────────────

/** The road along the sea (paper), across a layer `width` units wide: the low wall on the beach's side, its stones and
 *  its pale coping; the road, its far edge line, its dashed middle line and its near edge line; the verge in front, its
 *  tufts and wild flowers, its wooden posts with their white bands. */
export function route(width) {
  const [l, r] = edges(width);
  const rand = random(731);
  const strip = (y0, y1) => poly([[l, y0], [r, y0], [r, y1], [l, y1]]);
  let stones = "";
  for (let x = l + rand() * 10; x < r; x += 14 + rand() * 12) stones += lens(x, SHORE.wall + 6 + rand() * 3, 10 + rand() * 6, 2);
  let dashes = "";
  for (let x = l + 6; x < r; x += 40) dashes += poly([[x, 627.6], [x + 22, 627.6], [x + 22, 629.8], [x, 629.8]]);
  let tufts = "";
  const flowers = ["", ""];
  for (let k = 0; k < width / 7; k++) {
    const [x, y] = [l + rand() * width, SHORE.verge + 6 + rand() ** 0.8 * 140];
    if (k % 4) tufts += tuft(x, y, 2.4 + ((y - SHORE.verge) / 140) * 4);
    else flowers[k % 8 ? 0 : 1] += speck(x, y, 1.2 + ((y - SHORE.verge) / 140) * 1.2);
  }
  let posts = "";
  let bands = "";
  for (let x = l + 40 + rand() * 60; x < r; x += 150 + rand() * 40) {
    posts += poly([[x - 2.6, 684], [x + 2.6, 684], [x + 2.6, 660], [x, 657.5], [x - 2.6, 660]]);
    bands += poly([[x - 2.6, 664], [x + 2.6, 664], [x + 2.6, 667.5], [x - 2.6, 667.5]]);
  }
  return [
    sheetOf("paper", [[l, SHORE.wall], [r, SHORE.wall]], "#cbc1ad", path(stones, "#bdb29c") + path(strip(SHORE.wall, SHORE.wall + 3), "#e4ddcd"), 800),
    piece("paper", strip(SHORE.road, 800), path(strip(SHORE.road, 800), "#97999c") + path(strip(SHORE.road, SHORE.road + 2.5), "#a9abad") + path(strip(607, 608.4) + strip(649.6, 651.2) + dashes, "#f6f4ee"), "", 0.5),
    sheetOf("paper", [[l, SHORE.verge], [r, SHORE.verge]], "#9dbb6c", path(tufts, "#7c9c4b") + path(flowers[0], "#fbf6ee") + path(flowers[1], "#f2cf5b"), 800),
    piece("paper", posts, path(posts, "#8c6a45") + path(bands, "#f4f1ea"), "", 0.5),
  ].join("");
}
