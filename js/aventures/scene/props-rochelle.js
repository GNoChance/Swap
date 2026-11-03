// La Rochelle's Vieux-Port the morning after (the Île de Ré's spec, § 2, moment 8, and § 4), in paper: the clear, pale
// sky of the morning and its pale sun; the sea out beyond the harbour's mouth (the bridge's, in the morning's colours:
// props-pont.js) and the far coast; the town's white houses along the quays, their arcades and their slate roofs, and
// on the ramparts the Tour de la Lanterne and its spire; the two towers at the harbour's mouth, the Tour Saint-Nicolas
// (massive, its corner turret, its stair turret over its parapet) and the Tour de la Chaîne (round, its little turret
// and its pepper-pot roof), on their battered plinths in the water; the basin, calm, their pale reflections on it; the
// sailboats moored in it, their sails furled under their covers, their masts up; the quay in front, its limestone
// paving and its bollards. Paper only, its layers 1600 units wide (x −605 to 995). Pure: markup only, the same for the
// same arguments.
import { cutPiece } from "./decor.js";
import { blob, dot, edgeAt, lens, mirror, n, path, poly, random } from "./geom.js";
import { piece, sheetOf, slab } from "./props.js";
import { house } from "./props-chateaux.js";
import { HORIZON, large, mer } from "./props-pont.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** Where the far quays and the towers' plinths meet the basin. */
const QUAYS = 486;
/** Where the camera closes in as they walk along the quay: the harbour's mouth, between the towers (recipes.marche()). */
export const MOUTH = { x: 197, y: 470 };
// the limestone in the morning's light, lit on the left (the sun is low on that side), shaded on the right
const STONE = { lit: "#f1e9d7", mid: "#e2d7c0", shade: "#cdbfa2", deep: "#b8a888", course: "#d3c7ad", slot: "#857a68", opening: "#55514d" };
const SLATE = { roof: "#6f7b89", lit: "#8e99a6" };

// ── The sky ─────────────────────────────────────────────────

// the morning's strips, top to bottom: clear and pale, bluest high up, the palest along the horizon (cool: the towers'
// stone stands out on it); its sun, low and pale, over the harbour's mouth; long thin wisps
const SKY = ["#a3cbe6", "#b4d5ea", "#c5deed", "#d4e6ee", "#e0ecef"];
const STRIPS = [140, 230, 310, 384].map((y, k) => {
  const r = random(611 + k);
  return Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 10]);
});
const SUN = { x: 236, y: 244, r: 22 }; // its halo whole on a phone held sideways (ile-de-re.js, ROCHELLE_FRAME)
const WISPS = [[-470, 118, 150], [-210, 172, 110], [20, 96, 140], [300, 142, 100], [520, 108, 150], [780, 166, 120]];

/** The morning's sky: its pale strips, the sun in its pale halo, the wisps. */
export function ciel() {
  const { x, y, r } = SUN;
  const wisps = WISPS.map(([wx, wy, w]) => lens(wx, wy, w, 2.2) + lens(wx + w * 0.25, wy + 7, w * 0.55, 1.4)).join("");
  return [
    `<rect x="${L}" y="-30" width="1600" height="${HORIZON + 40}" fill="${SKY[0]}"/>`,
    ...STRIPS.map((edge, k) => sheetOf("paper", edge, SKY[k + 1], "", HORIZON + 10)),
    `<path d="${dot(x, y, r * 3.2)}" fill="#fffdf1" fill-opacity=".38"/><path d="${dot(x, y, r * 1.9)}" fill="#fffbe9" fill-opacity=".55"/>`,
    piece("paper", dot(x, y, r), path(dot(x, y, r), "#fff3c9") + path(dot(x - r * 0.12, y - r * 0.12, r * 0.68), "#fffaea"), "", 0.4),
    piece("paper", wisps, path(wisps, "#fbfcfb"), "", 0.3),
  ].join("");
}

// ── The sea beyond the mouth, the town ──────────────────────

/** The bridge's sea in the morning's light (props-pont.js, mer()'s `tint`): silvery blue, pale ripples. */
const MATIN = { far: "#c3dce7", mid: "#b2d2e0", near: "#a1c6d8", dark: "#8fb8cd", ripple: "#eef6f8", cap: "#fdfeff", glint: "#fffaf0" };

/** The sea out beyond the harbour's mouth, in the morning's colours, and the far coast low on the horizon (the
 *  bridge's: props-pont.js). */
export const pertuis = () => mer("paper", 1600, MATIN) + large();

/** A row of the town's tall houses along a quay from x0 to x1, their feet at y: white limestone each in its own tone,
 *  its own height and roof (slate, or round tiles), its windows in rows, its arcades on the ground floor, its shaded
 *  right side; scattered by `r`. */
function facades(x0, x1, y, r) {
  const tones = ["#f4efe4", "#efe7d6", "#f7f2e8", "#eae1cd"];
  const walls = tones.map(() => "");
  let outline = "";
  let shades = "";
  let slates = "";
  let tiles = "";
  let lit = "";
  let windows = "";
  let arcades = "";
  for (let x = x0; x < x1; ) {
    const [w, h, pitch] = [30 + r() * 26, 48 + r() * 34, 9 + r() * 8];
    const wall = poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]);
    const roof = poly([[x - 1, y - h], [x + w + 1, y - h], [x + w - 4, y - h - pitch], [x + 4, y - h - pitch]]);
    walls[Math.floor(r() * tones.length)] += wall;
    outline += wall + roof;
    shades += poly([[x + w * 0.74, y], [x + w * 0.74, y - h], [x + w, y - h], [x + w, y]]);
    if (r() < 0.65) slates += roof;
    else tiles += roof;
    lit += poly([[x + 4, y - h - pitch], [x + w - 4, y - h - pitch], [x + w - 3, y - h - pitch + 2.4], [x + 3, y - h - pitch + 2.4]]);
    const columns = Math.max(1, Math.floor((w - 6) / 10));
    const gap = (w - columns * 4.4) / (columns + 1);
    for (let wy = y - h + 8; wy < y - 24; wy += 13)
      for (let c = 0; c < columns; c++) {
        const wx = x + gap + c * (4.4 + gap);
        windows += poly([[wx, wy], [wx + 4.4, wy], [wx + 4.4, wy + 7], [wx, wy + 7]]);
      }
    const arches = Math.max(1, Math.round(w / 15));
    const span = w / arches;
    for (let a = 0; a < arches; a++) {
      const [ax, aw] = [x + a * span + 2, span - 4];
      arcades += `M${n(ax)} ${y}V${n(y - 9)}a${n(aw / 2)} ${n(aw / 2)} 0 0 1 ${n(aw)} 0V${y}Z`;
    }
    x += w + 0.5;
  }
  return piece("paper", outline, walls.map((d, k) => path(d, tones[k])).join("") + path(shades, "#d9d0be") + path(slates, SLATE.roof) + path(tiles, "#c98b6b") + path(lit, "#f4f1ea") + path(windows, "#5f6872") + path(arcades, "#8a8275"), "", 0.5);
}

/** The Tour de la Lanterne on the ramparts, its foot's middle at x, y: its round tower, lit on the left, its gallery,
 *  its tall octagonal spire (three faces seen) between its pinnacles, a cross on top. */
function lanterne(x, y) {
  const [neck, tip] = [y - 112, y - 236];
  const tower = [[-16, -6, STONE.lit], [-6, 6, STONE.mid], [6, 16, STONE.shade]].map(([a, b, fill]) => path(poly([[x + a, y], [x + b, y], [x + b, neck], [x + a, neck]]), fill)).join("");
  const gallery = poly([[x - 19, neck], [x + 19, neck], [x + 19, neck - 6], [x - 19, neck - 6]]);
  const at = (yy) => (13 * (yy - tip)) / (neck - 6 - tip);
  const spire = [[-1, -0.38, STONE.lit], [-0.38, 0.38, STONE.mid], [0.38, 1, STONE.deep]].map(([a, b, fill]) => path(poly([[x + a * 13, neck - 6], [x + b * 13, neck - 6], [x + b * at(tip), tip], [x + a * at(tip), tip]]), fill)).join("");
  const pinnacles = [-18, 18].map((dx) => poly([[x + dx - 2.4, neck - 6], [x + dx, neck - 22], [x + dx + 2.4, neck - 6]])).join("");
  const slits = [y - 30, y - 64, y - 96].map((sy) => poly([[x - 1, sy], [x + 1, sy], [x + 1, sy - 8], [x - 1, sy - 8]])).join("");
  const cross = poly([[x - 0.7, tip], [x + 0.7, tip], [x + 0.7, tip - 10], [x - 0.7, tip - 10]]) + poly([[x - 3.5, tip - 7], [x + 3.5, tip - 7], [x + 3.5, tip - 5.6], [x - 3.5, tip - 5.6]]);
  const outline = poly([[x - 16, y], [x - 16, neck], [x - 19, neck], [x - 19, neck - 6], [x - 13, neck - 6], [x, tip], [x + 13, neck - 6], [x + 19, neck - 6], [x + 19, neck], [x + 16, neck], [x + 16, y]]) + pinnacles + cross;
  return piece("paper", outline, tower + path(gallery, STONE.course) + spire + path(pinnacles, STONE.mid) + path(slits, STONE.opening) + path(cross, "#5c5a57"), "", 0.6);
}

/** The town along the quays, pale with the distance: on the left the tall houses of the quay going away from the Tour
 *  Saint-Nicolas; on the right the old town's roofs over the rampart (stone houses: props-chateaux.js) and the Tour de
 *  la Lanterne. */
export function ville() {
  const r = random(621);
  const roofs = [];
  for (let x = 352; x < R; x += 22 + r() * 18) roofs.push(house(x, 452, 26 + r() * 14, { stone: "#efe7d7", shade: "#d9cfbc", roof: r() < 0.6 ? SLATE.roof : "#c98b6b", window: "#6a717a", tall: 0.9 + r() * 0.5, pitch: 0.36 }));
  return [
    facades(L, 40, QUAYS - 2, r),
    piece("paper", roofs.map((h) => h.outline).join(""), roofs.map((h) => h.markup).join(""), "", 0.4),
    lanterne(640, 446),
  ].join("");
}

// ── The two towers at the harbour's mouth ───────────────────

/** A round tower's body from x − w to x + w, from its top y0 down to y1: its stone in vertical bands, lit on the left
 *  and shaded on the right (a cylinder), its courses of stone. → markup */
function rond(x, w, y0, y1) {
  const bands = [[-1, -0.55, STONE.lit], [-0.55, -0.05, STONE.mid], [-0.05, 0.5, STONE.shade], [0.5, 1, STONE.deep]];
  let courses = "";
  for (let y = y1 - 11; y > y0 + 4; y -= 11) courses += poly([[x - w, y], [x + w, y], [x + w, y + 0.7], [x - w, y + 0.7]]);
  return bands.map(([a, b, fill]) => path(poly([[x + a * w, y1], [x + b * w, y1], [x + b * w, y0], [x + a * w, y0]]), fill)).join("") + path(courses, STONE.course);
}

/** A tower's crown from x0 to x1 over its body's top y: its machicolations (a band on its corbels, the slots between
 *  them dark), its parapet (lit from x0 to `split`, shaded past it), its merlons. → { outline, markup } */
function crown(x0, x1, y, split) {
  const band = poly([[x0, y], [x1, y], [x1, y - 10], [x0, y - 10]]);
  let slots = "";
  for (let x = x0 + 3; x < x1 - 3; x += 6) slots += poly([[x, y - 1.5], [x + 2.4, y - 1.5], [x + 2.4, y - 6.5], [x, y - 6.5]]);
  const parapet = poly([[x0, y - 10], [x1, y - 10], [x1, y - 20], [x0, y - 20]]);
  const shaded = poly([[split, y - 10], [x1, y - 10], [x1, y - 20], [split, y - 20]]);
  let merlons = "";
  const count = Math.max(2, Math.round((x1 - x0) / 11));
  const step = (x1 - x0 - 7) / (count - 1);
  for (let k = 0; k < count; k++) merlons += poly([[x0 + k * step, y - 20], [x0 + k * step + 7, y - 20], [x0 + k * step + 7, y - 29], [x0 + k * step, y - 29]]);
  return {
    outline: poly([[x0, y], [x0, y - 20], [x1, y - 20], [x1, y]]) + merlons,
    markup: path(band, STONE.mid) + path(slots, STONE.slot) + path(parapet, STONE.lit) + path(shaded, STONE.shade) + path(merlons, STONE.mid),
  };
}

/** A pointed window `w` wide and `h` tall, its sill's middle at x, y (path data). */
const ogive = (x, y, w, h) => `M${n(x - w / 2)} ${n(y)}V${n(y - h + w * 0.7)}Q${n(x - w / 2)} ${n(y - h)} ${n(x)} ${n(y - h)}Q${n(x + w / 2)} ${n(y - h)} ${n(x + w / 2)} ${n(y - h + w * 0.7)}V${n(y)}Z`;
/** An arrow slit, its foot at x, y (path data). */
const slit = (x, y, h = 9) => poly([[x - 1, y], [x + 1, y], [x + 1, y - h], [x - 1, y - h]]);

// the Tour Saint-Nicolas, left of the mouth, and the Tour de la Chaîne, right of it: their middle and their body's top
const NICOLAS = { x: 90, top: 300 };
const CHAINE = { x: 300, top: 378 };
/** Their outlines, rough, for their reflections in the basin (bassin()). */
const SHAPES = [
  [[NICOLAS.x - 54, QUAYS], [NICOLAS.x - 50, 274], [NICOLAS.x + 12, 280], [NICOLAS.x + 13, 222], [NICOLAS.x + 40, 222], [NICOLAS.x + 46, 280], [NICOLAS.x + 54, QUAYS]],
  [[CHAINE.x - 48, QUAYS], [CHAINE.x - 41, 349], [CHAINE.x - 33, 336], [CHAINE.x - 24, 306], [CHAINE.x - 15, 336], [CHAINE.x + 41, 349], [CHAINE.x + 48, QUAYS]],
];

/** The Tour Saint-Nicolas: its battered plinth in the water, its massive square body (its front lit, its side shaded),
 *  its round turret on the left corner, its crown, its round stair turret rising over it on the right with a crown of
 *  its own; its pointed windows and its slits. */
function nicolas() {
  const { x, top } = NICOLAS;
  const plinth = poly([[x - 54, QUAYS + 4], [x - 46, 458], [x + 46, 458], [x + 54, QUAYS + 4]]);
  const plinthShade = poly([[x + 16, QUAYS + 4], [x + 16, 458], [x + 46, 458], [x + 54, QUAYS + 4]]);
  const front = poly([[x - 42, 458], [x - 40, top], [x + 16, top], [x + 16, 458]]);
  const side = poly([[x + 16, 458], [x + 16, top], [x + 40, top], [x + 42, 458]]);
  let courses = "";
  for (let y = 446; y > top + 4; y -= 12) courses += poly([[x - 41, y], [x + 41, y], [x + 41, y + 0.7], [x - 41, y + 0.7]]);
  const crowned = crown(x - 46, x + 46, top, x + 16);
  const stair = crown(x + 11, x + 41, 240, x + 26);
  const windows = ogive(x - 20, 428, 8, 18) + ogive(x - 4, 376, 7, 15) + ogive(x - 22, 336, 6, 12) + ogive(x + 28, 410, 5, 11);
  const slits = slit(x - 40, 404) + slit(x - 40, 350) + slit(x + 26, 280) + slit(x + 28, 268, 7);
  const outline = plinth + poly([[x - 51, 458], [x - 51, top - 14], [x - 29, top - 14], [x - 29, 458]]) + front + side + crowned.outline + poly([[x + 13, top], [x + 13, 240], [x + 39, 240], [x + 39, top]]) + stair.outline;
  const markup = [
    path(plinth, STONE.mid),
    path(plinthShade, STONE.shade),
    path(front, STONE.lit),
    path(side, STONE.shade),
    path(courses, STONE.course),
    rond(x - 40, 11, top - 14, 458),
    crowned.markup,
    rond(x + 26, 13, 240, top),
    stair.markup,
    path(windows + slits, STONE.opening),
  ].join("");
  return piece("paper", outline, markup, "", 1);
}

/** The Tour de la Chaîne: its battered plinth in the water, its round body (a cylinder of stone), its crown, its little
 *  round turret on the left and its pepper-pot roof of slate, a finial on top; its slits and its little window. */
function chaine() {
  const { x, top } = CHAINE;
  const plinth = poly([[x - 48, QUAYS + 4], [x - 41, 466], [x + 41, 466], [x + 48, QUAYS + 4]]);
  const plinthShade = poly([[x + 12, QUAYS + 4], [x + 10, 466], [x + 41, 466], [x + 48, QUAYS + 4]]);
  const crowned = crown(x - 41, x + 41, top, x + 8);
  const [tx, tw, eave, point] = [x - 24, 9, 336, 306];
  const cone = poly([[tx - tw - 2.5, eave], [tx, point], [tx + tw + 2.5, eave]]);
  const coneLit = poly([[tx - tw - 2.5, eave], [tx, point], [tx - 2, eave]]);
  const finial = poly([[tx - 0.6, point], [tx + 0.6, point], [tx + 0.6, point - 7], [tx - 0.6, point - 7]]) + dot(tx, point - 7.5, 1.6);
  const windows = slit(x - 14, 440) + slit(x + 12, 410) + slit(x - 20, 396, 7) + poly([[x - 3, 414], [x + 3, 414], [x + 3, 406], [x - 3, 406]]) + slit(tx, 358, 6);
  const outline = plinth + poly([[x - 38, 466], [x - 38, top], [x + 38, top], [x + 38, 466]]) + crowned.outline + poly([[tx - tw, top - 10], [tx - tw, eave], [tx + tw, eave], [tx + tw, top - 10]]) + cone + finial;
  const markup = [
    path(plinth, STONE.mid),
    path(plinthShade, STONE.shade),
    rond(x, 38, top, 466),
    crowned.markup,
    rond(tx, tw, eave, top - 10),
    path(cone, SLATE.roof),
    path(coneLit, SLATE.lit),
    path(finial, "#4a4f57"),
    path(windows, STONE.opening),
  ].join("");
  return piece("paper", outline, markup, "", 1);
}

/** The two towers at the harbour's mouth and the stone at their feet: the quay's wall going away on the left of the
 *  Tour Saint-Nicolas, the rampart on the right of the Tour de la Chaîne, its merlons along its top. */
export function tours() {
  const left = [[L, 474], [NICOLAS.x - 54, 472], [NICOLAS.x - 54, QUAYS + 4], [L, QUAYS + 4]];
  const right = [[CHAINE.x + 44, 444], [R, 438], [R, QUAYS + 4], [CHAINE.x + 44, QUAYS + 4]];
  let merlons = "";
  for (let x = CHAINE.x + 46; x < R - 6; x += 12) {
    const y = edgeAt([[CHAINE.x + 44, 444], [R, 438]], x);
    merlons += poly([[x, y], [x + 6.5, y], [x + 6.5, y - 7], [x, y - 7]]);
  }
  let joints = "";
  for (let x = CHAINE.x + 60; x < R; x += 34) joints += poly([[x, 452], [x + 0.7, 452], [x + 0.7, QUAYS], [x, QUAYS]]);
  return [
    slab("paper", left, "#dbcfb6", 0.6),
    piece("paper", poly(right) + merlons, path(poly(right), "#ddd2bb") + path(joints, STONE.course) + path(merlons, STONE.mid), "", 0.7),
    nicolas(),
    chaine(),
  ].join("");
}

// ── The basin ───────────────────────────────────────────────

/** The basin from the quays' feet down, calm in the morning: its water a little deeper nearer, the towers' pale
 *  reflections broken by its ripples, the sun's glints under it, the quays' dark line along its far edge. */
export function bassin() {
  const r = random(631);
  const band = (y0, y1) => poly([[L, y0], [R, y0], [R, y1], [L, y1]]);
  const reflections = SHAPES.map((shape) => poly(mirror(shape, QUAYS, 0.62))).join("");
  let ripples = "";
  let dark = "";
  for (let i = 0; i < 90; i++) {
    const f = r() ** 1.4;
    ripples += lens(L + r() * 1600, QUAYS + 4 + f * 300, 10 + f * 50, 0.6 + f * 1.2);
  }
  for (let i = 0; i < 40; i++) dark += lens(L + r() * 1600, QUAYS + 10 + r() * 280, 16 + r() * 40, 0.8 + r());
  const glints = Array.from({ length: 16 }, () => lens(SUN.x - 50 + r() * 90, QUAYS + 6 + r() ** 1.3 * 110, 8 + r() * 24, 1)).join("");
  return sheetOf(
    "paper",
    [[L, QUAYS], [R, QUAYS]],
    "#a9cdd7",
    [path(band(QUAYS, QUAYS + 3), "#8fb1bb"), path(band(QUAYS + 70, 800), "#9cc4d0"), path(band(QUAYS + 150, 800), "#8fbbca"), path(reflections, "#c8d8d6"), path(dark, "#88b3c4"), path(ripples, "#dcecf1"), path(glints, "#fff8e8")].join(""),
    800,
  );
}

// ── The sailboats moored in the basin ───────────────────────

const HULLS = ["#f7f5ef", "#f7f5ef", "#2d4a6b", "#b8473b", "#f7f5ef", "#3f6b55"];
const COVERS = ["#27406a", "#8e3b46", "#2f7f86", "#7a7f86"];
// the rows of sailboats, far to near: [waterline, size (a hull 100 units long at 1), step between them]; none in front
// of the mouth (from x MOUTH_CLEAR[0] to [1]): the towers show between them
const ROWS = [[530, 0.5, 46], [560, 0.7, 60], [594, 0.95, 82]];
const MOUTH_CLEAR = [150, 248];

/** A sailboat moored, side on, its waterline's middle at x, y, `s` its size, its bow on the left (or the right, with
 *  `flip`): its hull (`hull`), its boot stripe and its deck's edge, its cabin and its portholes, its mast and its
 *  rigging, its boom and its sail furled under its cover (`cover`), its pennant; its reflection under it. →
 *  { piece, reflection } (markup) */
function amarre(x, y, s, hull, cover, flip) {
  const f = flip ? -1 : 1;
  const at = (list) => list.map(([px, py]) => [x + f * px * s, y + py * s]);
  const mastTop = -164;
  const hullShape = poly(at([[-52, -12], [48, -12], [45, -3], [40, 0], [-36, 0], [-46, -5]]));
  const stripe = poly(at([[-48, -5], [45, -5], [44, -3], [-46, -3]]));
  const deck = poly(at([[-52, -12], [48, -12], [48, -10.6], [-51, -10.6]]));
  const cabin = poly(at([[-14, -12], [-10, -20], [17, -20], [21, -12]]));
  const ports = [-6, 3, 12].map((px) => lens(...at([[px, -16]])[0], 4 * s, 1.1 * s)).join("");
  const mast = poly(at([[-3.2, -20], [-1, -20], [-1.6, mastTop], [-2.6, mastTop]]));
  const boom = poly(at([[-2, -31], [42, -29], [42, -27.6], [-2, -29.4]]));
  const furled = blob(at([[0, -31], [16, -35], [38, -32], [40, -29.6], [18, -30.4]]));
  const pennant = poly(at([[-2, mastTop], [8, mastTop + 2.5], [-2, mastTop + 5]]));
  const [top] = at([[-2, mastTop]]);
  const stays = [[-52, -12], [48, -12]].map((p) => `M${n(top[0])} ${n(top[1])}L${at([p]).map(([px, py]) => `${n(px)} ${n(py)}`)[0]}`).join("");
  const silhouette = hullShape + cabin + mast + boom + furled;
  return {
    piece:
      `<path d="${stays}" fill="none" stroke="#8b9097" stroke-width="${n(0.6 * s)}"/>` +
      cutPiece({ silhouette, markup: path(hullShape, hull) + path(stripe, hull === "#f7f5ef" ? "#2d4a6b" : "#f4f1ea") + path(deck, "#fbfaf6") + path(cabin, "#fbfaf6") + path(ports, "#4a5560") + path(mast, "#c9ccd0") + path(boom, "#8f949a") + path(furled, cover) + path(pennant, "#d24a3a"), lift: 0.5 }),
    reflection: poly(at([[-48, 0.5], [44, 0.5], [36, 9], [-34, 9]])),
  };
}

/** The sailboats moored in the basin, in rows far to near, the mouth kept clear between the towers, each its hull, its
 *  cover and its facing; their dark reflections under them, broken by ripples. */
export function voiliers() {
  const r = random(641);
  const boats = [];
  for (const [y, size, step] of ROWS)
    for (let x = L + r() * step; x < R; x += step * (0.8 + r() * 0.5)) {
      const [hull, cover, flip, jitter] = [HULLS[Math.floor(r() * HULLS.length)], COVERS[Math.floor(r() * COVERS.length)], r() < 0.5, (r() - 0.5) * 5];
      if (x > MOUTH_CLEAR[0] && x < MOUTH_CLEAR[1]) continue;
      boats.push(amarre(x, y + jitter, size * (0.85 + r() * 0.3), hull, cover, flip));
    }
  let ripples = "";
  for (let i = 0; i < 50; i++) ripples += lens(L + r() * 1600, 532 + r() * 72, 10 + r() * 26, 0.7);
  return path(boats.map((b) => b.reflection).join(""), "#7fa8b9") + path(ripples, "#a9cdd7") + boats.map((b) => b.piece).join("");
}

// ── The quay ────────────────────────────────────────────────

// the quay's far edge along the water, from where they stand, slightly askew; its bollards along it
const EDGE = [[L, 618], [-200, 615], [200, 612], [600, 609], [R, 606]];
const BOLLARDS = [-470, -250, 18, 370, 590, 820];

/** A cast-iron bollard, its foot's middle at x, y, `k` its size: { body, cap, lit } (path data). */
function bollard(x, y, k) {
  return {
    body: poly([[x - 5 * k, y], [x - 4 * k, y - 14 * k], [x + 4 * k, y - 14 * k], [x + 5 * k, y]]),
    cap: dot(x, y - 15 * k, 6.5 * k),
    lit: lens(x - 5 * k, y - 17 * k, 7 * k, 1.3 * k) + poly([[x - 3.6 * k, y - 1], [x - 2.6 * k, y - 13 * k], [x - 1.6 * k, y - 13 * k], [x - 2.2 * k, y - 1]]),
  };
}
/** Bollards (bollard()) cut together: their shadow, their black-green iron, the light on their left. */
function bollards(list) {
  const all = list.map(([x, y, k]) => bollard(x, y, k));
  const bodies = all.map((b) => b.body + b.cap).join("");
  return piece("paper", bodies, path(bodies, "#2f3c37") + path(all.map((b) => b.lit).join(""), "#5f7068"), "", 0.6);
}

/** The quay in front, where they walk: its pale coping along the water, its limestone paving in rows wider nearer (two
 *  tones, their joints staggered), its bollards along the edge. */
export function quai() {
  const edge = (x) => edgeAt(EDGE, x);
  const r = random(651);
  const coping = poly([...EDGE, ...[...EDGE].reverse().map(([x, y]) => [x, y + 11])]);
  let copingJoints = "";
  for (let x = L + 20; x < R; x += 34 + r() * 12) copingJoints += poly([[x, edge(x)], [x + 0.8, edge(x)], [x + 0.8, edge(x) + 11], [x, edge(x) + 11]]);
  let slabs = "";
  let joints = "";
  for (let k = 0, y = 11, h = 9; y < 200; k++, y += h, h *= 1.22) {
    const line = (dy) => EDGE.map(([x, ey]) => [x, ey + y + dy]);
    if (k % 2) slabs += poly([...line(0), ...line(h).reverse()]);
    joints += poly([...line(0), ...line(0.9).reverse()]);
    for (let x = L + r() * h * 4; x < R; x += h * (3 + r() * 2)) {
      const ey = edge(x) + y;
      joints += poly([[x, ey], [x + 0.9, ey], [x + 0.9 + h * 0.12, ey + h], [x + h * 0.12, ey + h]]);
    }
  }
  return [
    sheetOf("paper", EDGE, "#ddd3c0", path(slabs, "#d4c9b4") + path(joints, "#bdb19a") + path(coping, "#ebe4d5") + path(copingJoints, "#cdc2ad"), 800),
    bollards(BOLLARDS.map((x) => [x, edge(x) + 8, 1])),
  ].join("");
}

/** The nearest bollards at the quay's front, big at the bottom, passing by on the sides as they walk. */
export const devant = () => bollards([[12, 792, 2.6], [378, 792, 2.6], [-330, 796, 2.8], [720, 796, 2.8]]);
