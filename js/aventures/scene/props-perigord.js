// The Périgord's pieces (the canoe's spec, § 2, moment 1, and § 4): on the South-West's map (props-carte.js), the
// Dordogne winding from the Gironde past Libourne and Bergerac towards Sarlat, the rows of vines round Saint-Émilion and
// Bergerac, the Périgord's round woods and the P of Port d'Enveaux; then the valley's own illustrated map, after the
// rental's plan from Carsac to Port d'Enveaux (drawn, not projected: its places in their order), without any roadworks
// sign; and the little paper bus that drives up it. Paper only: the maps never become the poster. Pure: markup only,
// the same for the same arguments.
import { cutPiece } from "./decor.js";
import { curve, dot, lens, n, path, poly, random, topEdge } from "./geom.js";
import { distance, names, pts } from "./props-carte.js";

const C = {
  river: "#86afc8",
  wave: "#c6dde8",
  vine: "#dfe2ae",
  vineLit: "#e9ebc2",
  vineRow: "#7f9550",
  wood: "#5e7b45",
  woodLit: "#7f9c58",
  trunk: "#6b5236",
  ink: "#3b2a18",
  sign: "#2f5d8a",
};

// ── On the South-West's map ─────────────────────────────────

// the Dordogne, [lat, lon], from the Bec d'Ambès upstream: Libourne, Castillon, Sainte-Foy, Bergerac, Lalinde, the
// Trémolat loop, Limeuil, Le Buisson, Siorac, Saint-Cyprien, Port d'Enveaux, Beynac, Domme, Carsac, Souillac, on east
const DORDOGNE = [
  [45.03, -0.555], [44.99, -0.46], [44.955, -0.37], [44.915, -0.245], [44.885, -0.17], [44.86, -0.1], [44.851, -0.04], [44.845, 0.06], [44.84, 0.22],
  [44.835, 0.33], [44.848, 0.48], [44.856, 0.6], [44.836, 0.74], [44.874, 0.8], [44.884, 0.9], [44.84, 0.93], [44.82, 0.985], [44.85, 1.04],
  [44.835, 1.11], [44.818, 1.2], [44.85, 1.3], [44.89, 1.48], [44.92, 1.6], [44.95, 1.78], [45.02, 2.05], [45.12, 2.35], [45.3, 3.0],
];
// its tributaries: the Isle (Libourne up to Périgueux), the Vézère (Limeuil up to Montignac)
const TRIBUTARIES = [
  [[44.915, -0.245], [44.98, -0.17], [45.03, -0.05], [45.06, 0.12], [45.1, 0.38], [45.14, 0.55], [45.185, 0.72], [45.22, 0.95]],
  [[44.884, 0.9], [44.92, 0.95], [44.94, 1.01], [44.99, 1.06], [45.06, 1.12], [45.1, 1.17], [45.2, 1.3]],
];
// the vineyards: [lat, lon] of their middle, their reach (units), how many parcels
const VINEYARDS = [
  [44.9, -0.17, 34, 20], // Saint-Émilion and Pomerol
  [44.96, -0.32, 18, 8], // Fronsac
  [44.75, -0.2, 30, 14], // the Entre-deux-Mers
  [44.8, 0.46, 20, 10], // Bergerac and Monbazillac
  [45.12, -0.62, 18, 8], // the Côtes de Bourg
  [45.12, -0.82, 22, 9], // the Médoc
  [45.69, -0.33, 34, 14], // Cognac
  [44.5, 0.2, 26, 10], // the Côtes de Duras
];
// the Périgord's woods: [lat, lon] of their middle, their reach (units), how many trees
const WOODS = [
  [45.08, 0.3, 40, 16], // the Double
  [44.98, 0.55, 30, 11],
  [45.03, 0.88, 36, 14],
  [44.94, 1.2, 34, 16], // the Périgord noir, round Sarlat
  [44.76, 0.98, 30, 12], // the Bessède
  [44.74, 1.3, 34, 13],
  [45.25, 0.75, 40, 13], // the Périgord vert
  [45.12, 1.5, 44, 14],
  [44.68, 0.65, 34, 10],
  [44.95, 1.75, 50, 16],
  [45.55, 0.2, 50, 14], // Charente and Limousin
  [45.75, 0.9, 50, 14],
  [45.5, 1.4, 50, 14],
  [45.9, -0.1, 40, 10],
  [44.5, 1.2, 44, 13], // the Quercy
  [44.42, 0.6, 40, 10],
  [44.25, 0.15, 44, 11], // the Agenais
  [44.1, 0.85, 50, 12],
  [43.85, 0.45, 44, 10],
  [43.9, 1.35, 50, 11],
];

/** The Dordogne winding to the Gironde, wider than the other rivers, its tributaries the Isle and the Vézère. */
export function dordogne(project) {
  const main = curve(pts(project, DORDOGNE));
  const side = TRIBUTARIES.map((river) => curve(pts(project, river))).join("");
  return [
    `<path d="${side}" fill="none" stroke="${C.river}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${side}" fill="none" stroke="${C.wave}" stroke-width=".7" stroke-linecap="round"/>`,
    cutPiece({ silhouette: main, markup: `<path d="${main}" fill="none" stroke="${C.river}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${main}" fill="none" stroke="${C.wave}" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="7 9"/>`, stroke: 4.6, lift: 0.3 }),
  ].join("");
}

/** Is [x, y] clear of the road, of the Dordogne and of every box (a name's: { x0, x1, y0, y1 }), by `gap`? */
const clearOf = ({ road, river, clear }, [x, y], gap) => distance(road, [x, y]) > gap && distance(river, [x, y]) > gap - 2 && !clear.some((b) => x > b.x0 - gap && x < b.x1 + gap && y > b.y0 - gap && y < b.y1 + gap);

/** The vineyards round Saint-Émilion, in the Entre-deux-Mers and round Bergerac: paper parcels, each with its rows of
 *  vines, none on the road (`road`: its points [x, y]) nor on a name (`clear`: boxes). */
export function vignes(project, { road = [], clear = [] } = {}) {
  const river = pts(project, DORDOGNE);
  const r = random(131);
  let parcels = "";
  let lit = "";
  let rows = "";
  for (const [lat, lon, reach, count] of VINEYARDS) {
    const { x: cx, y: cy } = project([lat, lon]);
    for (let i = 0, made = 0; i < count * 4 && made < count; i++) {
      const [x, y] = [cx + (r() - 0.5) * 2 * reach, cy + (r() - 0.5) * 1.4 * reach];
      const [w, h, tilt] = [9 + r() * 7, 6 + r() * 5, (r() - 0.5) * 0.5];
      if (!clearOf({ road, river, clear }, [x + w / 2, y + h / 2], 8 + w / 2)) continue;
      made++;
      const corner = ([dx, dy]) => [x + dx + dy * tilt, y + dy - dx * tilt * 0.3];
      const quad = [[0, 0], [w, 0], [w, h], [0, h]].map(corner);
      parcels += poly(quad);
      lit += poly([[0, 0], [w, 0], [w, 1.2], [0, 1.2]].map(corner));
      for (let k = 1.6; k < h - 0.6; k += 1.9) rows += `M${corner([1.2, k]).map(n).join(" ")}L${corner([w - 1.2, k]).map(n).join(" ")}`;
    }
  }
  return cutPiece({ silhouette: parcels, markup: path(parcels, C.vine) + path(lit, C.vineLit) + `<path d="${rows}" stroke="${C.vineRow}" stroke-width=".9" stroke-linecap="round" stroke-dasharray="1.4 1"/>`, lift: 0.25 });
}

/** Round trees at once ([[x, y, r]]: the foot, the crown's radius), cut together: a dark crown, its west half lit, a
 *  short trunk. Small polygons: as round as curves at their size, and far lighter to draw (a map has hundreds). */
function grove(list, { lift = 0.4, tint = {} } = {}) {
  const c = { crown: C.wood, lit: C.woodLit, trunk: C.trunk, ...tint };
  let crowns = "";
  let lit = "";
  let trunks = "";
  for (const [x, y, s] of [...list].sort((a, b) => a[1] - b[1])) {
    const cy = y - s * 1.25;
    crowns += poly([[x - s, cy + s * 0.2], [x - s * 0.8, cy - s * 0.55], [x - s * 0.25, cy - s], [x + s * 0.45, cy - s * 0.88], [x + s, cy - s * 0.2], [x + s * 0.7, cy + s * 0.65], [x - s * 0.3, cy + s * 0.8]]);
    lit += poly([[x - s * 0.82, cy + s * 0.05], [x - s * 0.62, cy - s * 0.5], [x - s * 0.18, cy - s * 0.84], [x - s * 0.24, cy - s * 0.24]]);
    trunks += poly([[x - s * 0.13, y], [x - s * 0.13, cy + s * 0.5], [x + s * 0.13, cy + s * 0.5], [x + s * 0.13, y]]);
  }
  return cutPiece({ silhouette: crowns, markup: path(trunks, c.trunk) + path(crowns, c.crown) + path(lit, c.lit), lift });
}

/** The Périgord's round woods, clumps of small trees, none on the road nor the river nor a name. */
export function bois(project, { road = [], clear = [] } = {}) {
  const river = pts(project, DORDOGNE);
  const r = random(137);
  const trees = [];
  for (const [lat, lon, reach, count] of WOODS) {
    const { x: cx, y: cy } = project([lat, lon]);
    for (let i = 0, made = 0; i < count * 4 && made < count; i++) {
      const [a, d] = [r() * Math.PI * 2, reach * Math.sqrt(r())];
      const at = [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7];
      if (!clearOf({ road, river, clear }, at, 9) || trees.some(([x, y]) => Math.abs(x - at[0]) < 6 && Math.abs(y - at[1]) < 5)) continue;
      made++;
      trees.push([...at, 2.6 + r() * 1.4]);
    }
  }
  return grove(trees, { lift: 0.35 });
}

/** The P of a parking, its post's foot at x, y: a blue paper sign, a white P (.st-parking). */
export function parking(x, y) {
  const sign = poly([[x - 7, y - 23], [x + 7, y - 23], [x + 7, y - 9], [x - 7, y - 9]]);
  const post = poly([[x - 0.9, y - 9], [x + 0.9, y - 9], [x + 0.9, y], [x - 0.9, y]]);
  const markup = path(post, "#6f6a62") + `<path d="${sign}" fill="${C.sign}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>` + `<text x="${n(x)}" y="${n(y - 11.6)}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#fff">P</text>`;
  return `<g class="st-parking">${cutPiece({ silhouette: sign + post, markup, edge: `M${n(x - 6.4)} ${n(y - 22.4)}H${n(x + 6.4)}`, lift: 0.6 })}</g>`;
}

// ── The valley's illustrated map ─────────────────────────────

const V = {
  ground: "#e9e1bd",
  plateau: "#c8d398",
  plateauLit: "#d8e0ad",
  water: "#7fb1cd",
  waterDeep: "#6d9fbe",
  ripple: "#d2e7f1",
  bank: "#efe6c9",
  cliff: "#efe6cf",
  ledge: "#cdbf9e",
  stone: "#e2cd9c",
  stoneShade: "#c4aa76",
  ochre: "#d49a5f",
  ochreShade: "#b07a45",
  roof: "#9a4f34",
  slate: "#545a6c",
  window: "#5a4634",
  road: "#f7efd9",
  roadEdge: "#c9b78f",
  walnut: "#5f7d45",
  orchard: "#dfe6b4",
  maize: "#e4d27a",
  maizeRow: "#c3ad4c",
  meadow: "#b8cf7f",
  sunflower: "#f0c63e",
  canoe: ["#d9573b", "#b5d33d", "#f2c14e"],
};

// the river's middle, west to east: Port d'Enveaux, the bend under Beynac, the one round Castelnaud facing it, the long
// reach under La Roque-Gageac, the deep loop under Domme, up past Vitrac to Carsac, on east by Montfort
const RIVER = [
  [-660, 600], [-480, 590], [-320, 600], [-170, 588], [-60, 578], [20, 566], [58, 548], [84, 516], [98, 476], [110, 446], [128, 430], [148, 436],
  [158, 466], [160, 512], [166, 556], [182, 584], [202, 590], [218, 568], [222, 524], [222, 482], [228, 448], [244, 432], [270, 428], [290, 436],
  [298, 464], [298, 512], [302, 566], [316, 612], [334, 628], [352, 618], [360, 584], [358, 540], [354, 500], [360, 470], [380, 452], [420, 442],
  [460, 454], [500, 476], [540, 450], [600, 426], [700, 432], [820, 416], [1040, 424],
];
/** The bus's way (stage units): from Port d'Enveaux's landing up behind Beynac's castle, along the north bank over La
 *  Roque-Gageac, past Vitrac, down to Carsac. */
export const VALLEY_ROUTE = [[52, 530], [62, 500], [76, 464], [90, 426], [104, 392], [128, 368], [162, 362], [200, 368], [236, 376], [268, 378], [298, 382], [320, 396], [334, 418], [340, 440]];
const SARLAT_ROAD = [[180, 364], [176, 320], [188, 280], [206, 244], [214, 222]];
// where each of the data's names is written: [x, y, anchor] (the rental's plan: its places in their order)
const PLACES = {
  "Port d'Enveaux": [28, 628, "start"],
  Beynac: [118, 340, "middle"],
  Castelnaud: [196, 672, "middle"],
  "La Roque-Gageac": [254, 352, "middle"],
  Domme: [300, 666, "end"],
  Sarlat: [214, 172, "middle"],
  Carsac: [324, 422, "end"],
};
const COMPASS = [44, 726];

/** Is [x, y] clear of the river (by `river`), the roads (by `road`) and the names' boxes (by `pad`)? */
const free = ([x, y], { river = 0, road = 0, boxes = [], pad = 4 }) =>
  distance(RIVER, [x, y]) > river && distance(VALLEY_ROUTE, [x, y]) > road && distance(SARLAT_ROAD, [x, y]) > road && !boxes.some((b) => x > b.x0 - pad && x < b.x1 + pad && y > b.y0 - pad && y < b.y1 + pad);

/** The land: the valley's floor, the plateaus over it on either side, their edges lit. */
function valleyLand() {
  const wave = (y0, seed) => {
    const r = random(seed);
    return Array.from({ length: 23 }, (_, i) => [-660 + i * 80, y0 + Math.sin(i * 1.3) * 12 + (r() - 0.5) * 14]);
  };
  const north = wave(304, 151);
  const south = wave(692, 153);
  const top = [...north, [1100, -20], [-660, -20]];
  const bottom = [...south, [1100, 790], [-660, 790]];
  const rim = (edge, dy) => poly([...edge, ...[...edge].reverse().map(([x, y]) => [x, y + dy])]);
  return [
    `<rect x="-660" y="-20" width="1760" height="810" fill="${V.ground}"/>`, // past the widest screen, no further: a smaller layer to draw
    cutPiece({ silhouette: poly(top), markup: path(poly(top), V.plateau) + path(rim(north, -8), V.plateauLit), lift: 0.6 }),
    cutPiece({ silhouette: poly(bottom), markup: path(poly(bottom), V.plateau) + path(rim(south, 8), V.plateauLit), edge: curve(south), lift: 0.6 }),
  ].join("");
}

/** The fields in the bends' lobes and along the plain: walnut orchards in rows, maize, meadows, sunflowers, none on
 *  the river, a road or a name. */
function fields(boxes) {
  const r = random(157);
  const lobes = [
    [96, 150, 452, 560],
    [170, 214, 440, 570],
    [232, 290, 452, 600],
    [308, 350, 474, 604],
    [-360, 110, 606, 660],
    [-360, 40, 520, 560],
    [380, 700, 470, 520],
    [400, 900, 360, 410],
  ];
  const quads = { walnut: "", maize: "", meadow: "", sunflower: "" };
  let rows = "";
  const trees = [];
  const taken = [];
  for (const [x0, x1, y0, y1] of lobes)
    for (let i = 0; i < 70; i++) {
      const [w, h] = [12 + r() * 16, 9 + r() * 9];
      const [x, y] = [x0 + r() * (x1 - x0 - w), y0 + r() * (y1 - y0 - h)];
      const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x + w / 2, y + h / 2]];
      if (!corners.every((c) => free(c, { river: 12, road: 6, boxes }))) continue;
      if (taken.some((t) => x < t[2] + 2 && x + w > t[0] - 2 && y < t[3] + 2 && y + h > t[1] - 2)) continue;
      taken.push([x, y, x + w, y + h]);
      const quad = poly([[x, y], [x + w, y + 0.6], [x + w - 0.6, y + h], [x + 0.4, y + h - 0.4]]);
      const kind = ["walnut", "maize", "meadow", "walnut", "sunflower", "meadow"][Math.floor(r() * 6)];
      quads[kind] += quad;
      if (kind === "walnut") for (let gy = y + 4.2; gy < y + h; gy += 4.4) for (let gx = x + 2.6; gx < x + w - 1.5; gx += 4.6) trees.push([gx, gy, 1.5]);
      if (kind === "maize") for (let gy = y + 2; gy < y + h - 1; gy += 2.2) rows += `M${n(x + 1.5)} ${n(gy)}H${n(x + w - 1.5)}`;
    }
  const all = Object.values(quads).join("");
  const walnuts = trees.map(([x, y, s]) => poly([[x - s, y], [x - s * 0.5, y - s], [x + s * 0.5, y - s], [x + s, y], [x, y + s * 0.8]])).join("");
  return cutPiece({ silhouette: all, markup: path(quads.meadow, V.meadow) + path(quads.walnut, V.orchard) + path(quads.maize, V.maize) + path(quads.sunflower, V.sunflower) + `<path d="${rows}" stroke="${V.maizeRow}" stroke-width=".8"/>` + path(walnuts, V.walnut), lift: 0.2 });
}

/** The river: a ribbon of blue paper on its pale banks, deeper in its middle, a few ripples. */
function river() {
  const d = curve(RIVER);
  const r = random(163);
  const ripples = Array.from({ length: 26 }, () => {
    const k = Math.floor(r() * (RIVER.length - 1));
    const [[ax, ay], [bx, by]] = [RIVER[k], RIVER[k + 1]];
    const f = r();
    return lens(ax + (bx - ax) * f - 3, ay + (by - ay) * f + (r() - 0.5) * 4, 5 + r() * 4, 0.6);
  }).join("");
  const markup = [
    `<path d="${d}" fill="none" stroke="${V.bank}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${d}" fill="none" stroke="${V.water}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${d}" fill="none" stroke="${V.waterDeep}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".5"/>`,
    path(ripples, V.ripple),
  ].join("");
  return cutPiece({ silhouette: d, markup, stroke: 20, lift: 0.35 });
}

/** A limestone cliff along a bank: its top edge through `edge` (west to east), its face `h` high under it, pale with
 *  ledges, its top lit, round trees on it but where `bare` ([[x0, x1]]) keeps it clear (a castle, a village). */
function cliff(edge, h, bare = []) {
  const face = [...edge, ...[...edge].reverse().map(([x, y], k) => [x, y + h * (0.8 + (k % 2) * 0.2)])];
  const ledges = edge.slice(1, -1).map(([x, y], k) => `M${n(x - 6)} ${n(y + h * (0.35 + (k % 3) * 0.15))}h${n(9 + (k % 2) * 5)}`).join("");
  const trees = [];
  for (let k = 0; k < edge.length - 1; k++) {
    const [[ax, ay], [bx, by]] = [edge[k], edge[k + 1]];
    for (let f = 0; f < 1; f += 0.5) {
      const x = ax + (bx - ax) * f;
      if (!bare.some(([x0, x1]) => x > x0 && x < x1)) trees.push([x, ay + (by - ay) * f + 1.5, 3.4 + ((k + f * 2) % 3) * 0.6]);
    }
  }
  return cutPiece({ silhouette: poly(face), markup: path(poly(face), V.cliff) + `<path d="${ledges}" stroke="${V.ledge}" stroke-width="1.3" stroke-linecap="round"/>`, edge: topEdge(face), lift: 0.6 }) + grove(trees, { lift: 0.35 });
}

/** A house at x, y (its foot), `w` wide: stone walls, the shaded side, a roof (`roof`), a window. */
const house = (x, y, w, roof = V.roof) => {
  const h = w * 0.7;
  const top = [[x - 1, y - h], [x + w * 0.5, y - h - w * 0.55], [x + w + 1, y - h]];
  return {
    outline: poly([[x, y], [x, y - h], ...top, [x + w, y - h], [x + w, y]]),
    markup: path(poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]), V.stone) + path(poly([[x + w * 0.62, y], [x + w * 0.62, y - h], [x + w, y - h], [x + w, y]]), V.stoneShade) + path(poly(top), roof) + path(poly([[x + w * 0.2, y - h * 0.62], [x + w * 0.4, y - h * 0.62], [x + w * 0.4, y - h * 0.34], [x + w * 0.2, y - h * 0.34]]), V.window),
  };
};
/** A tower at x, y (its foot), `w` wide, `h` high: crenellated, or with a pointed roof. */
const tower = (x, y, w, h, { roof = null, stone = V.stone, shade = V.stoneShade } = {}) => {
  const body = poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]);
  const crenels = roof ? "" : Array.from({ length: 3 }, (_, k) => poly([[x + k * w * 0.4, y - h], [x + k * w * 0.4, y - h - w * 0.22], [x + k * w * 0.4 + w * 0.2, y - h - w * 0.22], [x + k * w * 0.4 + w * 0.2, y - h]])).join("");
  const cone = roof ? poly([[x - w * 0.14, y - h], [x + w * 0.5, y - h - w * 1.1], [x + w * 1.14, y - h]]) : "";
  return {
    outline: body + crenels + cone,
    markup: path(body + crenels, stone) + path(poly([[x + w * 0.6, y], [x + w * 0.6, y - h], [x + w, y - h], [x + w, y]]), shade) + (cone ? path(cone, roof) : "") + path(poly([[x + w * 0.3, y - h * 0.7], [x + w * 0.44, y - h * 0.7], [x + w * 0.44, y - h * 0.5], [x + w * 0.3, y - h * 0.5]]), V.window),
  };
};
/** Buildings at once ({ outline, markup }), cut together. */
const built = (list, lift = 0.5) => cutPiece({ silhouette: list.map((b) => b.outline).join(""), markup: list.map((b) => b.markup).join(""), lift });
const OCHRE = { stone: V.ochre, shade: V.ochreShade };

/** The castles and villages, small, after the rental's plan: Beynac on its cliff over its village, Castelnaud on its
 *  hill facing it, the Milandes and Fayrac, Marqueyssac's gardens on their cliff, La Roque-Gageac under its own, Domme's
 *  ramparts on its cliff over the deep loop, Vitrac and its bridge, Montfort on its rock, Carsac's steeple, and Sarlat
 *  up north with its cathedral. */
function places() {
  const mound = (x, y, w) => {
    const hill = [[x - w / 2, y], [x - w * 0.34, y - w * 0.16], [x - w * 0.1, y - w * 0.24], [x + w * 0.16, y - w * 0.22], [x + w * 0.38, y - w * 0.12], [x + w / 2, y]];
    return cutPiece({ silhouette: poly(hill), markup: path(poly(hill), V.plateau), edge: topEdge(hill), lift: 0.4 });
  };
  const gardens = grove([[214, 404, 2.4], [221, 406, 2.2], [228, 403, 2.4], [217, 412, 2], [225, 413, 2]], { lift: 0.25, tint: { crown: "#4f7a3c", lit: "#6f9a52" } });
  const bridge = poly([[340, 478], [374, 470], [375, 476], [341, 484]]);
  const arches = `<path d="M346 482a3 3 0 0 1 6-1.4M356 479.6a3 3 0 0 1 6-1.4M366 477.2a3 3 0 0 1 6-1.4" fill="none" stroke="#9c8a66" stroke-width="1.2"/>`;
  return [
    cliff([[98, 420], [108, 404], [124, 396], [142, 398], [158, 410], [164, 424]], 16, [[110, 150]]), // Beynac's
    built([tower(114, 398, 10, 20), tower(124, 400, 13, 16), house(137, 400, 10, V.slate), tower(108, 400, 6, 12, { roof: V.slate })]),
    built([house(118, 432, 6), house(125, 434, 6), house(132, 433, 6), house(139, 434, 6)], 0.35), // its village by the water
    mound(196, 640, 70), // Castelnaud's hill
    built([tower(182, 626, 8, 16, { roof: V.slate, ...OCHRE }), tower(191, 628, 13, 15, OCHRE), tower(205, 626, 7, 12, { roof: V.slate, ...OCHRE })]),
    built([tower(-34, 646, 7, 11, { roof: V.slate }), house(-26, 646, 14, V.slate), tower(-11, 646, 7, 11, { roof: V.slate })]), // the Milandes
    built([tower(134, 650, 6, 10, { roof: V.slate }), house(141, 650, 9, V.slate)]), // Fayrac
    cliff([[204, 420], [214, 404], [232, 394], [258, 390], [282, 394], [296, 408]], 18, [[210, 290]]), // Marqueyssac's and La Roque's
    gardens,
    built([house(208, 416, 8, V.slate)]), // Marqueyssac
    built([house(234, 424, 7), house(242, 422, 7), house(250, 425, 7), tower(258, 424, 5, 13, { roof: V.slate }), house(264, 424, 7)], 0.35), // La Roque-Gageac, at the cliff's foot
    cliff([[304, 652], [316, 648], [334, 646], [352, 648], [366, 654]], 12, [[306, 364]]), // Domme's
    built([tower(306, 652, 6, 11), house(313, 650, 7), house(321, 648, 8), tower(330, 650, 6, 11), house(337, 648, 7), house(345, 650, 7), tower(353, 652, 6, 11)]),
    cutPiece({ silhouette: bridge, markup: path(bridge, "#d8c8a4") + arches, lift: 0.4 }), // Vitrac's bridge
    built([house(372, 466, 7), house(380, 468, 7)], 0.35), // Vitrac
    cliff([[392, 424], [404, 414], [420, 412], [432, 420]], 14, [[400, 430]]), // Montfort's rock
    built([tower(404, 414, 8, 14, { roof: V.slate }), house(413, 414, 10, V.slate)]),
    built([house(344, 400, 7), tower(352, 400, 5, 13, { roof: V.slate }), house(358, 402, 7)], 0.35), // Carsac
    built([house(188, 212, 9), house(198, 208, 9), tower(208, 212, 7, 24, { roof: V.slate }), house(216, 206, 10), house(227, 210, 9), house(236, 212, 8), house(193, 222, 8), house(222, 222, 9)]), // Sarlat
  ].join("");
}

/** The roads: along the north bank from Port d'Enveaux to Carsac (the bus's), up to Sarlat, and on either side. */
function roads() {
  const d = curve(VALLEY_ROUTE) + curve(SARLAT_ROAD) + curve([[-660, 548], [-300, 556], [-80, 548], [30, 540], [52, 530]]) + curve([[340, 440], [362, 430], [420, 404], [560, 396], [800, 380], [1040, 372]]);
  return `<path d="${d}" fill="none" stroke="${V.roadEdge}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${V.road}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** The woods: clumps of round trees on the plateaus, none on a road, a place or a name. */
function woods(boxes) {
  const r = random(167);
  // those in sight on a phone first, then others out to the widest screens
  const clumps = [[60, 300, 34], [300, 300, 34], [130, 260, 30], [290, 230, 32], [60, 200, 34], [340, 150, 30], [110, 120, 30], [40, 60, 30], [170, 60, 28], [300, 60, 30], [250, 120, 26], [150, 740, 30], [260, 760, 30], [80, 770, 24]];
  for (let i = 0; i < 70; i++) clumps.push([-560 + r() * 1460, r() < 0.62 ? 20 + r() * 300 : 690 + r() * 110, 16 + r() * 28]);
  const keep = [...boxes, { x0: 176, x1: 250, y0: 180, y1: 230 }, { x0: COMPASS[0] - 22, x1: COMPASS[0] + 22, y0: COMPASS[1] - 34, y1: COMPASS[1] + 22 }];
  const trees = [];
  for (const [cx, cy, reach] of clumps)
    for (let k = 0; k < reach / 1.6 && trees.length < 420; k++) {
      const [a, d] = [r() * Math.PI * 2, reach * Math.sqrt(r())];
      const at = [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7];
      if (!free(at, { river: 24, road: 9, boxes: keep, pad: 6 }) || (at[1] > 330 && at[1] < 680)) continue;
      if (trees.some(([x, y]) => Math.abs(x - at[0]) < 7.5 && Math.abs(y - at[1]) < 6)) continue;
      trees.push([...at, 4 + r() * 2.4]);
    }
  return grove(trees, { lift: 0.4 });
}

/** The tiny canoes going down the river (west), and the compass. */
function details() {
  const canoes = [[88, 502, 0, 0.9], [222, 500, 1, 1.4], [-120, 590, 2, 0], [300, 540, 0, 1.5], [620, 425, 1, 0]]
    .map(([x, y, k, tilt]) => {
      const at = ([dx, dy]) => [x + dx - dy * tilt * 0.3, y + dy + dx * tilt * 0.3];
      const hull = poly([[-7, 0], [-4, -2], [4, -2], [7, 0], [4, 1.8], [-4, 1.8]].map(at));
      const heads = [[-2.5, -2.4], [2.5, -2.4]].map(at).map(([hx, hy]) => dot(hx, hy, 1.3)).join("");
      return cutPiece({ silhouette: hull, markup: path(hull, V.canoe[k]) + path(heads, C.ink), lift: 0.3 });
    })
    .join("");
  const [x, y] = COMPASS;
  const star = poly([[x, y - 18], [x + 4, y - 4], [x + 18, y], [x + 4, y + 4], [x, y + 18], [x - 4, y + 4], [x - 18, y], [x - 4, y - 4]]);
  const north = poly([[x, y - 18], [x + 4, y - 4], [x, y], [x - 4, y - 4]]);
  const compass = cutPiece({ silhouette: dot(x, y, 13) + star, markup: path(dot(x, y, 13), "#f3ead1") + path(star, "#b8a57d") + path(north, "#b5543a") + `<text x="${x}" y="${y - 22}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-weight="700" font-size="10" fill="${C.ink}">N</text>`, lift: 0.5 });
  return canoes + compass;
}

/** valleyMap({ depart, arrivee, noms }): the valley's illustrated map from Port d'Enveaux to Carsac (its places in
 *  their order, not at their real coordinates), its names written where its places are: the relay's start and arrival
 *  and the names seen on the way (the data's: trajet.arrivee, relais.arrivee and relais.noms). A name it does not know
 *  throws, naming it. */
export function valleyMap({ depart, arrivee, noms }) {
  const list = [depart, ...noms, arrivee].map((name) => {
    const place = PLACES[name];
    if (!place) throw new Error(`valleyMap: no place for « ${name} »`);
    const [tx, ty, anchor] = place;
    const wide = name.length * 7.4;
    const x0 = anchor === "end" ? tx - wide : anchor === "middle" ? tx - wide / 2 : tx;
    return { name, kind: "lieu", tx, ty, anchor, box: { x0, x1: x0 + wide, y0: ty - 14, y1: ty + 4 } };
  });
  const boxes = list.map((s) => s.box);
  return [valleyLand(), fields(boxes), river(), roads(), woods(boxes), places(), details(), names(list)].join("");
}

// ── The bus ─────────────────────────────────────────────────

/** The little bus of the canoe rental, facing left like the stickers: a teal minibus towing a trailer of canoes, with
 *  the stickers' white edge (an <svg> of its own, 300 × 130). */
export const BUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 130"><g stroke="#fff" stroke-width="10" stroke-linejoin="round"><path d="M160 96h52" stroke-width="14"/><path d="M178 58l100-2c8 0 12 4 12 10v8H170z"/><path d="M192 74h96v22h-96z"/><path d="M14 98V60c0-14 6-26 22-30l12-6c8-4 16-4 24-4h80c10 0 16 6 16 16v62z"/><circle cx="54" cy="100" r="17"/><circle cx="140" cy="100" r="17"/><circle cx="242" cy="102" r="15"/></g>
<path d="M160 96h52" stroke="#5a5f6e" stroke-width="5" stroke-linecap="round"/>
<path d="M192 74h96v22h-96z" fill="#8b6a48"/><path d="M182 68l98-1c6 0 9 3 9 7H180z" fill="#d9573b"/><path d="M180 60l98-2c6 0 9 3 9 7l-99 1z" fill="#b5d33d"/><path d="M186 52l92-2c6 0 9 3 9 6l-97 2z" fill="#f2c14e"/>
<path d="M14 98V60c0-14 6-26 22-30l12-6c8-4 16-4 24-4h80c10 0 16 6 16 16v62z" fill="#2f8a8f"/><path d="M14 80h154v18H14z" fill="#256f74"/><path d="M36 30l12-6c8-4 16-4 24-4h80c10 0 16 6 16 16v4H30c0-4 2-8 6-10z" fill="#f4ead2"/>
<path d="M24 62c0-10 4-16 12-18h20v20H24zM62 44h28v20H62zM96 44h28v20H96zM130 44h28v20h-28z" fill="#bfe0ec"/><path d="M28 50h10M66 48h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
<path d="M16 86h8" stroke="#f6c453" stroke-width="5" stroke-linecap="round"/>
<circle cx="54" cy="100" r="13" fill="#3a3f4c"/><circle cx="54" cy="100" r="5" fill="#b9bcc6"/><circle cx="140" cy="100" r="13" fill="#3a3f4c"/><circle cx="140" cy="100" r="5" fill="#b9bcc6"/><circle cx="242" cy="102" r="11" fill="#3a3f4c"/><circle cx="242" cy="102" r="4" fill="#b9bcc6"/></svg>`;
