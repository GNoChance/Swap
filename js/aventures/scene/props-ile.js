// The island's pieces (the Île de Ré's spec, § 2 and § 4): for now the Phare des Baleines on the island's west tip, by
// day: its tall grey stone tower, octagonal and tapering, its corbelled gallery, its black lantern and dome; the keepers'
// white houses at its foot, their green shutters; the land of the tip, its scrub and its pines; the reef in the sea
// before it (its sea is the bridge's: props-pont.js); the dune in front, its marram grass and its chestnut fence. Each
// takes its skin, "paper" or "poster" (props.js): the lighthouse is the poster's scene. Its layers are 1600 units wide
// (x −605 to 995). Pure: markup only, the same for the same arguments.
import { AFFICHE as A } from "./decor.js";
import { blob, edgeAt, lens, path, poly, random } from "./geom.js";
import { paper, piece, roundTrees, sheetOf } from "./props.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** The lighthouse's foot (the middle of its plinth on the ground), and the stage units it spans. */
export const PHARE = { x: 282, y: 604 };

// ── The sea's reef ──────────────────────────────────────────

/** The reef of the Baleines in the sea before the tip, uncovered at low tide: dark rocks, their wet tops lit, the foam
 *  round them. */
export function recifs(skin) {
  const p = paper(skin);
  const c = p ? { rock: "#66707a", lit: "#8b949b", foam: "#f4f9fb" } : { rock: A.navy, lit: "#2f5d7a", foam: A.cream };
  const r = random(431);
  let rocks = "";
  let lit = "";
  let foam = "";
  for (const [x0, y0, count] of [[-420, 548, 6], [-200, 566, 5], [-40, 556, 7], [500, 560, 4], [760, 552, 6]])
    for (let i = 0; i < count; i++) {
      const [x, y, w] = [x0 + i * (16 + r() * 18), y0 + (r() - 0.5) * 16, 10 + r() * 22];
      const h = w * (0.35 + r() * 0.25);
      rocks += blob([[x, y], [x + w * 0.15, y - h * 0.8], [x + w * 0.55, y - h], [x + w * 0.9, y - h * 0.5], [x + w, y]]);
      lit += blob([[x + w * 0.18, y - h * 0.7], [x + w * 0.5, y - h * 0.95], [x + w * 0.7, y - h * 0.8], [x + w * 0.4, y - h * 0.62]]);
      foam += lens(x - 6, y + 1, w + 12, 1.4);
    }
  return piece(skin, rocks, path(foam, c.foam) + path(rocks, c.rock) + path(lit, c.lit), "", 0.4);
}

// ── The tip: its land, the lighthouse, the keepers' houses ──

const LAND = [[L, 648], [-420, 640], [-240, 628], [-90, 620], [40, 610], [140, 598], [240, 592], [400, 590], [560, 594], [760, 588], [R, 592]];

/** The half width of the tower at y: tapering from its plinth to its cornice. */
const half = (y) => 21 + ((y - 236) / (566 - 236)) * 8;

/** The Phare des Baleines at PHARE (x, its foot y): its plinth and its door, its shaft of three faces (lit, half lit,
 *  shaded: an octagon from the side) in courses of stone, a window up the middle face now and then, its corbelled
 *  cornice and gallery with its railing, the lantern (its glazing in a black frame) and its dome, the finial. */
function tower(skin) {
  const p = paper(skin);
  const c = p
    ? { lit: "#e2ddd2", mid: "#cdc7ba", shade: "#aca598", course: "#b9b2a4", plinth: "#d6d0c2", plinthShade: "#b2ab9c", cornice: "#a39c8f", iron: "#30353d", glass: "#f6e6a2", gleam: "#fff7d2", dome: "#353b44", domeLit: "#525a66", window: "#4a4640" }
    : { lit: A.cream, mid: "#ead6ae", shade: "#d6bd8e", course: "#e3cfa6", plinth: "#ead6ae", plinthShade: "#d6bd8e", cornice: A.navy, iron: A.navy, glass: A.sun, gleam: A.cream, dome: A.orange, domeLit: "#f19c66", window: A.navy };
  const { x } = PHARE;
  // the faces: [from, to] across the half width (−1 → 1), its colour
  const faces = [[-1, -0.38, c.lit], [-0.38, 0.38, c.mid], [0.38, 1, c.shade]];
  const face = (a, b, y0, y1, w0, w1) => poly([[x + a * w0, y0], [x + b * w0, y0], [x + b * w1, y1], [x + a * w1, y1]]);
  const shaft = faces.map(([a, b, fill]) => path(face(a, b, 566, 236, half(566), half(236)), fill)).join("");
  let courses = "";
  for (let y = 556; y > 240; y -= 11) courses += poly([[x - half(y), y], [x + half(y), y], [x + half(y), y + 0.8], [x - half(y), y + 0.8]]);
  const windows = [520, 450, 380, 310].map((y) => poly([[x - 2.6, y], [x + 2.6, y], [x + 2.6, y - 10], [x - 2.6, y - 10]])).join("");
  const plinth = poly([[x - 37, PHARE.y], [x + 37, PHARE.y], [x + 33, 566], [x - 33, 566]]);
  const plinthShade = poly([[x + 14, PHARE.y], [x + 37, PHARE.y], [x + 33, 566], [x + 12.5, 566]]);
  const door = `M${x - 6} ${PHARE.y}V${PHARE.y - 15}a6 6 0 0 1 12 0V${PHARE.y}Z`;
  const cornice = poly([[x - 21, 236], [x + 21, 236], [x + 27, 226], [x + 30, 226], [x + 30, 221], [x - 30, 221], [x - 30, 226], [x - 27, 226]]);
  let bars = "";
  for (let k = -28; k <= 28; k += 4) bars += poly([[x + k - 0.5, 221], [x + k + 0.5, 221], [x + k + 0.5, 208], [x + k - 0.5, 208]]);
  const railing = bars + poly([[x - 29, 207], [x + 29, 207], [x + 29, 209.5], [x - 29, 209.5]]);
  const lanternBase = poly([[x - 16, 221], [x + 16, 221], [x + 16, 204], [x - 16, 204]]);
  const glass = poly([[x - 13, 204], [x + 13, 204], [x + 13, 174], [x - 13, 174]]);
  let mullions = "";
  for (const k of [-13, -6.5, 0, 6.5, 13]) mullions += poly([[x + k - 0.8, 204], [x + k + 0.8, 204], [x + k + 0.8, 174], [x + k - 0.8, 174]]);
  const frame = mullions + poly([[x - 15, 176], [x + 15, 176], [x + 15, 172], [x - 15, 172]]);
  const dome = `M${x - 16} 172C${x - 16} 160 ${x - 9} 154 ${x} 154C${x + 9} 154 ${x + 16} 160 ${x + 16} 172Z`;
  const domeLit = `M${x - 13} 170C${x - 13} 162 ${x - 8} 157 ${x - 2} 156C${x - 7} 160 ${x - 9} 165 ${x - 9} 170Z`;
  const finial = poly([[x - 1, 154], [x + 1, 154], [x + 0.5, 140], [x - 0.5, 140]]) + `M${x - 2.4} 144a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0`;
  const outline = poly([[x - 37, PHARE.y], [x + 37, PHARE.y], [x + 33, 566], [x + 29, 566], [x + 21, 236], [x + 30, 226], [x + 30, 207], [x + 16, 207], [x + 16, 172], [x - 16, 172], [x - 16, 207], [x - 30, 207], [x - 30, 226], [x - 21, 236], [x - 29, 566], [x - 33, 566]]) + dome + finial;
  const markup = [
    shaft,
    p ? path(courses, c.course) : "",
    path(windows, c.window),
    path(plinth, c.plinth),
    path(plinthShade, c.plinthShade),
    path(door, c.window),
    path(cornice, c.cornice),
    path(lanternBase, c.iron),
    path(glass, c.glass),
    p ? path(poly([[x - 10, 202], [x - 7, 202], [x - 7, 176], [x - 10, 176]]), c.gleam) : "",
    path(frame + railing + finial, c.iron),
    path(dome, c.dome),
    path(domeLit, c.domeLit),
  ].join("");
  return piece(skin, outline, markup, `M${x - 29.4} 221.6H${x + 29.4}`, 1.2);
}

/** A low white house of the island at x (its left end), its foot at y, `w` wide: its walls, its roof of tiles seen from
 *  the long side (paper: slate grey; poster: orange), its windows with green shutters, its door. */
function maison(skin, x, y, w, h = 46) {
  const p = paper(skin);
  const c = p ? { wall: "#f4f1ea", shade: "#dcd7cc", roof: "#8a8f96", roofLit: "#a3a8ae", window: "#4a4640", shutter: "#4f7d55" } : { wall: A.cream, shade: "#ead6ae", roof: A.orange, roofLit: "#f19c66", window: A.navy, shutter: A.green };
  const wall = poly([[x, y], [x + w, y], [x + w, y - h], [x, y - h]]);
  const roof = poly([[x - 4, y - h], [x + w + 4, y - h], [x + w - 10, y - h - 22], [x + 10, y - h - 22]]);
  const roofLit = poly([[x + 10, y - h - 22], [x + w - 10, y - h - 22], [x + w - 7, y - h - 17], [x + 13, y - h - 17]]);
  let openings = "";
  let shutters = "";
  for (let k = 18; k < w - 14; k += 34) {
    openings += poly([[x + k, y - h + 12], [x + k + 9, y - h + 12], [x + k + 9, y - h + 26], [x + k, y - h + 26]]);
    shutters += poly([[x + k - 5, y - h + 12], [x + k - 0.5, y - h + 12], [x + k - 0.5, y - h + 26], [x + k - 5, y - h + 26]]) + poly([[x + k + 9.5, y - h + 12], [x + k + 14, y - h + 12], [x + k + 14, y - h + 26], [x + k + 9.5, y - h + 26]]);
  }
  const door = poly([[x + w - 26, y], [x + w - 15, y], [x + w - 15, y - 22], [x + w - 26, y - 22]]);
  const markup = path(wall, c.wall) + path(poly([[x, y], [x + 8, y], [x + 8, y - h], [x, y - h]]), c.shade) + path(roof, c.roof) + path(roofLit, c.roofLit) + path(openings + door, c.window) + path(shutters, c.shutter);
  return piece(skin, wall + roof, markup, `M${x + 10.6} ${y - h - 21.4}H${x + w - 10.6}`, 0.8);
}

/** The island's tip behind the dune: its land (scrub green, sand where it goes down to the water on the left), the
 *  lighthouse on it with the keepers' houses at its foot, the scrub and the low pines along it. */
export function pointe(skin) {
  const p = paper(skin);
  const c = p ? { land: "#a9b77a", sand: "#e8d9b4", scrub: "#7f9a58" } : { land: A.grass, sand: "#e3cfa6", scrub: A.green };
  const r = random(441);
  // the beach along the water on the left, a band of sand narrowing away under the scrub
  const edge = Array.from({ length: 39 }, (_, k) => [L + k * 20, edgeAt(LAND, L + k * 20)]);
  const shore = poly([...edge, ...edge.slice().reverse().map(([x, y]) => [x, y + 0.5 + 15 * Math.sqrt(1 - (x - L) / 760)])]);
  const bushes = [];
  for (let x = -560; x < 960; x += 30 + r() * 40) if (x < 150 || x > 470) bushes.push([x, edgeAt(LAND, x) + 4, 8 + r() * 9]);
  const pines = [[-330, 640, 18], [-250, 632, 22], [520, 596, 20], [600, 598, 24], [690, 594, 19], [860, 592, 23]];
  return [
    sheetOf(skin, LAND, c.land, path(shore, c.sand)),
    roundTrees(bushes, { skin, tint: { crown: c.scrub } }),
    roundTrees(pines, { skin, tint: p ? { crown: "#3f6234", lit: "#58794a" } : {} }),
    maison(skin, 196, 604, 62, 34),
    maison(skin, 318, 602, 150),
    tower(skin),
  ].join("");
}

// ── The dune in front ───────────────────────────────────────

const DUNE = [[L, 690], [-400, 676], [-200, 684], [0, 672], [120, 668], [260, 676], [400, 666], [600, 678], [R, 670]];

/** The dune in front, where they stand: pale sand in waves, the marram grass in tufts of long blades, a chestnut
 *  fence (ganivelles) along it on either side, its slats on their wires. */
export function dune(skin) {
  const p = paper(skin);
  const c = p ? { sand: "#efe1bd", ridge: "#f8eed4", grass: "#93a45f", grassLit: "#b3c27b", slat: "#a8885b", wire: "#7a6446" } : { sand: "#e3cfa6", ridge: A.cream, grass: A.grass, grassLit: "#9cc072", slat: "#c8b28a", wire: A.navy };
  const r = random(451);
  let ridges = "";
  for (let i = 0; i < 26; i++) ridges += lens(L + r() * 1600, 690 + r() * 70, 30 + r() * 70, 1.4);
  let blades = "";
  let lit = "";
  const tuft = (x, y, s) => {
    for (let k = 0; k < 7; k++) {
      const lean = (k - 3) * 2.2 * s + (r() - 0.5) * 3;
      const h = (16 + r() * 14) * s;
      const blade = poly([[x + (k - 3) * 1.4 * s, y], [x + (k - 3) * 1.4 * s + 1.6 * s, y], [x + lean + 0.4, y - h]]);
      if (k % 3 === 0) lit += blade;
      else blades += blade;
    }
  };
  for (let x = -590; x < 980; x += 36 + r() * 50) if (x < 40 || x > 300) tuft(x, edgeAt(DUNE, x) + 6 + r() * 30, 0.8 + r() * 0.6);
  // the fence: its slats on two wires, either side of where they stand
  let slats = "";
  let wires = "";
  for (const [x0, x1] of [[L, 40], [320, R]]) {
    for (let x = x0; x < x1; x += 7) slats += poly([[x, 686], [x + 3.4, 686], [x + 3.4, 662 + ((x * 7) % 5)], [x + 1.7, 659 + ((x * 7) % 5)], [x, 662 + ((x * 7) % 5)]]);
    wires += poly([[x0, 667], [x1, 667], [x1, 668.2], [x0, 668.2]]) + poly([[x0, 680], [x1, 680], [x1, 681.2], [x0, 681.2]]);
  }
  return [
    piece(skin, slats, path(slats, c.slat) + path(wires, c.wire), "", 0.5),
    sheetOf(skin, DUNE, c.sand, path(ridges, c.ridge)),
    piece(skin, blades + lit, path(blades, c.grass) + path(lit, c.grassLit), "", 0.4),
  ].join("");
}

