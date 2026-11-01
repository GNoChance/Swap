// The map's pieces (spec § 5, moment 1): the South-West in paper, from real coordinates [lat, lon] placed by a
// projection (geo.js): the ocean and its waves, the land with the Gironde's estuary and the Arcachon basin, the rivers,
// the Landes' pines, the Pyrenees in paper peaks with the Ossau's two horns, the trip's stops and names, its dotted line
// and the arrival's pin; up north (the Île de Ré's spec, § 4), the Pertuis charentais: the coast round La Rochelle, the
// islands of Ré and Oléron, Ré's bridge and lighthouse, the Charente. All of it reaches far past the stage (x −1000 to
// 1600), the camera follows the car. Paper only: the map never becomes the poster. Pure: markup only, the same for the
// same arguments.
import { cutPiece } from "./decor.js";
import { blob, curve, edgeAt, n, path, poly, random, topEdge, xy } from "./geom.js";
import { OSSAU, roundTrees } from "./props.js";

const C = {
  sea: "#8fb6cd",
  wave: "#c6dde8",
  land: "#eee3c4",
  fields: ["#e7ddb8", "#e3e1ba", "#ebdeb9"],
  forest: "#e1dcb2",
  marsh: "#dde3b6",
  marshTree: "#6f8f55",
  marshTreeLit: "#88a768",
  canal: "#9fc2d2",
  river: "#86afc8",
  pine: "#4d6a3d",
  pineLit: "#6e8a50",
  trunk: "#6b5236",
  hill: "#d6cfa4",
  foothill: "#c4c393",
  hillLit: "#e6dfb9",
  peak: "#a19db6",
  peakFar: "#b8b3c7",
  peakLit: "#c9c4d6",
  snow: "#fbf6ee",
  rock: "#5d5f75",
  rockLit: "#8d889a",
  ink: "#3b2a18",
  cream: "#fbf3df",
  route: "#b5543a",
  pin: "#d9573b",
  pinShade: "#a83f2a",
};

// the Arcachon basin, from inside Cap Ferret round to the Pyla
const BASIN = [[44.7, -1.215], [44.765, -1.16], [44.76, -1.07], [44.69, -0.99], [44.645, -1.03], [44.655, -1.15], [44.6, -1.22]];
// the coast, north to south, then the Spanish coast west: [lat, lon]
const COAST = [
  [47.5, -2.2], [46.6, -1.3], [46.2, -1.2], [45.69, -1.24], [45.62, -1.03], // to Royan
  [45.48, -0.8], [45.13, -0.66], [45.03, -0.555], [45.0, -0.62], [45.2, -0.75], [45.43, -0.87], [45.57, -1.06], // the Gironde
  [45.51, -1.13], [45.38, -1.16], [45.2, -1.17], [45.0, -1.2], [44.62, -1.255], // the Médoc, Cap Ferret
  ...BASIN, // the Arcachon basin
  [44.44, -1.25], [44.2, -1.3], [44.09, -1.32], [43.79, -1.4], [43.64, -1.45], [43.53, -1.52], [43.48, -1.56], [43.39, -1.67], [43.37, -1.78], // to Hendaye
  [43.32, -1.98], [43.29, -2.17], [43.36, -2.5], [43.42, -2.72], [43.35, -3.01], [43.38, -3.22], [43.44, -3.46], [43.47, -3.8], [43.39, -4.29], [43.42, -4.75], [43.46, -5.06], [43.54, -5.66], [43.55, -6.6],
];
const RIVERS = [
  [[45.03, -0.555], [44.837, -0.56], [44.7, -0.42], [44.553, -0.24], [44.42, -0.05], [44.2, 0.62], [43.95, 1.15], [43.6, 1.44], [43.3, 1.0], [43.0, 0.75], [42.7, 0.8]], // the Garonne, from Spain
  [[45.03, -0.555], [44.97, -0.4], [44.92, -0.24], [44.87, 0.1], [44.85, 0.48], [44.82, 1.0], [44.9, 1.6], [45.0, 2.4], [45.3, 3.4]], // the Dordogne (DORDOGNE)
  [[43.53, -1.52], [43.49, -1.42], [43.6, -1.2], [43.71, -1.05], [43.76, -0.57], [43.7, -0.26], [43.45, 0.0], [43.23, 0.07], [43.0, 0.15], [42.8, 0.15]], // the Adour
  [[43.64, -1.15], [43.49, -0.77], [43.31, -0.45], [43.295, -0.37], [43.2, -0.2], [43.09, -0.05], [42.9, -0.02], [42.72, -0.01]], // the Gave de Pau, from the Adour to Gavarnie
];
const DORDOGNE = 1; // its index in RIVERS
// the Landes' forest, and the Médoc's: [lat, lon]
const FOREST = [[45.4, -1.1], [45.3, -0.92], [45.05, -0.9], [44.9, -0.72], [44.6, -0.5], [44.3, -0.36], [44.0, -0.2], [43.78, -0.28], [43.72, -0.7], [43.72, -1.05], [43.68, -1.38], [44.0, -1.3], [44.42, -1.22], [44.75, -1.08], [45.0, -1.16]];
// the crest of the Pyrenees, and on west the Basque and Cantabrian mountains behind the Spanish coast
const CREST = [[43.0, -6.6], [43.15, -4.8], [43.05, -3.5], [43.05, -2.4], [43.31, -1.635], [43.1, -1.3], [42.99, -0.99], [42.95, -0.72], [42.84, -0.44], [42.84, -0.29], [42.77, -0.15], [42.85, 0.12], [42.63, 0.66], [42.67, 1.41], [42.52, 2.46], [42.45, 3.15], [42.4, 4.4]];
const OSSAU_AT = [42.835, -0.3]; // a little east of its true place (42.84, −0.44), clear of the lakes' pin

// the Pertuis charentais, drawn finely for a map up there (`pertuis`): the coast from the Loire's mouth (COAST[0]) to
// Pointe de la Coubre (COAST[3]): the Vendée, Pointe d'Arçay and the Anse de l'Aiguillon, the bridge's head at La
// Pallice, La Rochelle's bay down to Châtelaillon and Fouras, the Charente's mouth, the Brouage marshes, the Seudre
const PERTUIS = [
  [47.15, -2.15], [46.95, -2.12], [46.8, -2.05], [46.69, -1.94], [46.56, -1.84], [46.49, -1.79], [46.43, -1.65], [46.4, -1.55], [46.35, -1.45],
  [46.33, -1.38], [46.29, -1.31], [46.275, -1.28], [46.31, -1.25], [46.315, -1.2], [46.3, -1.155], [46.27, -1.125], [46.25, -1.12], [46.23, -1.145],
  [46.205, -1.18], [46.185, -1.205], [46.172, -1.236], [46.158, -1.24], [46.15, -1.2], [46.148, -1.17], [46.12, -1.13], [46.09, -1.115],
  [46.065, -1.088], [46.035, -1.075], [46.0, -1.105], [45.985, -1.08], [45.97, -1.07], [45.958, -1.085], [45.93, -1.1], [45.89, -1.105],
  [45.855, -1.145], [45.82, -1.135], [45.8, -1.16], [45.78, -1.18], [45.75, -1.215],
];
// the islands, each round its coast: Ré from its east tip (Sablanceaux, by Rivedoux) along the north (La Flotte,
// Saint-Martin, Loix, the Fier d'Ars, Les Portes) to the Pointe des Baleines, back along the south (Ars, La Couarde, Le
// Bois-Plage, Sainte-Marie); Oléron from Chassiron down to Gatseau and back; Aix
const RE = [
  [46.166, -1.265], [46.178, -1.29], [46.188, -1.32], [46.198, -1.345], [46.207, -1.365], [46.215, -1.395], [46.228, -1.42], [46.233, -1.44],
  [46.222, -1.46], [46.235, -1.48], [46.248, -1.5], [46.258, -1.53], [46.252, -1.56], [46.24, -1.565], [46.228, -1.548], [46.212, -1.525],
  [46.196, -1.49], [46.183, -1.45], [46.17, -1.41], [46.158, -1.37], [46.148, -1.33], [46.15, -1.3], [46.157, -1.275],
];
const OLERON = [
  [46.047, -1.411], [46.035, -1.37], [46.01, -1.33], [45.985, -1.29], [45.97, -1.245], [45.94, -1.22], [45.895, -1.195], [45.855, -1.19],
  [45.82, -1.205], [45.795, -1.23], [45.805, -1.25], [45.84, -1.265], [45.88, -1.29], [45.92, -1.33], [45.96, -1.365], [46.0, -1.39], [46.03, -1.415],
];
const AIX = [[46.018, -1.176], [46.012, -1.165], [46.004, -1.172], [46.01, -1.18]];
const BRIDGE = [[46.172, -1.236], [46.158, -1.272]]; // Ré's bridge, from its head at La Pallice to Rivedoux
const BALEINES = [46.245, -1.556]; // the Phare des Baleines, on Ré's west tip
// the marshes: the Marais poitevin behind the Anse de l'Aiguillon, the Brouage marshes by Marennes
const MARAIS = [
  [[46.33, -1.27], [46.4, -1.2], [46.43, -0.95], [46.38, -0.7], [46.31, -0.66], [46.27, -0.9], [46.255, -1.1], [46.3, -1.14], [46.325, -1.2]],
  [[45.96, -1.09], [45.95, -0.99], [45.86, -1.02], [45.84, -1.12], [45.9, -1.11]],
];
/** Up north, the vineyards and the woods (props-perigord.js: vignes(), bois()): [lat, lon] of their middle, their reach
 *  (units), how many parcels or trees. */
export const CHARENTES = {
  vineyards: [
    [45.69, -0.33, 30, 14], // Cognac's Grande Champagne
    [45.83, -0.5, 22, 8], // the Fins Bois
    [45.55, -0.3, 22, 8], // the Petite Champagne
    [45.2, -0.5, 14, 6], // the Côtes de Bourg and Blaye
    [44.9, -0.17, 30, 14], // Saint-Émilion and Pomerol
    [44.75, -0.2, 26, 10], // the Entre-deux-Mers
  ],
  woods: [
    [46.62, -1.35, 40, 14], // the Vendée's bocage
    [46.6, -0.9, 50, 16],
    [46.5, -0.5, 50, 14],
    [46.12, -0.75, 34, 10], // the Aunis and the Saintonge
    [45.92, -0.45, 30, 9],
    [45.55, -0.85, 22, 7],
    [45.4, -0.45, 30, 9],
    [46.2, -1.0, 20, 6],
    [45.73, -1.16, 8, 5], // La Coubre's forest
    [45.9, -0.1, 40, 10], // the Charente and the Limousin, east, for a wide screen
    [46.2, 0.3, 50, 12],
    [46.6, 0.35, 50, 12],
    [46.0, 0.9, 50, 14],
    [45.55, 0.2, 50, 14],
    [45.75, 0.9, 50, 14],
    [45.2, 0.3, 44, 12],
    [45.05, 0.88, 44, 12],
  ],
};
// the Charente, from Angoulême by Cognac, Saintes and Rochefort to its mouth by Fouras
const CHARENTE = [[45.65, 0.16], [45.68, -0.06], [45.68, -0.17], [45.695, -0.33], [45.74, -0.47], [45.746, -0.633], [45.81, -0.67], [45.87, -0.72], [45.9, -0.82], [45.94, -0.96], [45.96, -1.02], [45.97, -1.07]];

/** Real points [lat, lon] on the stage, [x, y]. */
export const pts = (project, list) => list.map((p) => project(p)).map(({ x, y }) => [x, y]);
/** Is [x, y] inside the polygon? */
function inside(list, [x, y]) {
  let odd = false;
  for (let i = 0, j = list.length - 1; i < list.length; j = i++) {
    const [[xi, yi], [xj, yj]] = [list[i], list[j]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
  }
  return odd;
}
/** The land's outline: the coast (finer along the Pertuis charentais with `pertuis`), closed far to the south, east and
 *  north. */
const landOf = (project, pertuis = false) => [...pts(project, pertuis ? [COAST[0], ...PERTUIS, ...COAST.slice(3)] : COAST), [-1000, 1600], [1600, 1600], [1600, -700], [-200, -700]];
/** How far [x, y] is from a line of points. */
export function distance(line, [x, y]) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [[ax, ay], [bx, by]] = [line[i - 1], line[i]];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)));
  }
  return best;
}

/** The ocean: the sea under everything, waves where the land (its coast as land() draws it: `pertuis`) does not cover
 *  it. */
export function ocean(project, { pertuis = false } = {}) {
  const land = landOf(project, pertuis);
  const r = random(61);
  let waves = "";
  for (let i = 0; i < 230; i++) {
    const [x, y] = i < 150 ? [-900 + r() * 1100, -260 + r() * 1100] : [-150 + r() * 260, -60 + r() * 600]; // more near the coast, a phone's strip of sea
    if (inside(land, [x, y]) || inside(land, [x + 14, y])) continue;
    const s = 2.4 + r() * 1.4;
    waves += `M${n(x)} ${n(y)}q${n(s)} ${n(-s)} ${n(2 * s)} 0q${n(s)} ${n(-s)} ${n(2 * s)} 0`;
  }
  return `<rect x="-1000" y="-700" width="2600" height="2300" fill="${C.sea}"/><path d="${waves}" fill="none" stroke="${C.wave}" stroke-width="1.5" stroke-linecap="round"/>`;
}

/** The land, a sheet of paper over the sea (its shadow on the water, its coast lit), with its forests, its fields
 *  inland (east of `road`, its points [x, y]) and its rivers; dordogne: false leaves the Dordogne to a map that draws
 *  it its own way (props-perigord.js); pertuis: its coast drawn finely round La Rochelle (a map up there). */
export function land(project, { road = [], dordogne = true, pertuis = false } = {}) {
  const outline = landOf(project, pertuis);
  const forest = blob(pts(project, FOREST));
  const rivers = RIVERS.filter((_, k) => dordogne || k !== DORDOGNE).map((river) => curve(pts(project, river))).join("");
  const r = random(65);
  const fields = ["", "", ""];
  for (let i = 0; i < 90; i++) {
    const [x, y] = [250 + r() * 760, -60 + r() * 640];
    const w = 24 + r() * 34;
    if (distance(road, [x, y]) < w * 0.7 + 14) continue;
    const [h, tilt] = [w * (0.5 + r() * 0.3), (r() - 0.5) * 0.5];
    fields[i % 3] += poly([[x, y], [x + w, y + w * tilt], [x + w - h * tilt, y + w * tilt + h], [x - h * tilt, y + h]]); // a parcel
  }
  const markup = [
    path(poly(outline), C.land),
    ...fields.map((d, k) => path(d, C.fields[k])),
    path(forest, C.forest),
    path(poly(pts(project, [[44.62, -1.255], ...BASIN])), C.sea), // the basin's water over the forest's tint
    `<path d="${rivers}" fill="none" stroke="${C.river}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="${rivers}" fill="none" stroke="${C.wave}" stroke-width=".8" stroke-linecap="round"/>`,
  ].join("");
  return cutPiece({ silhouette: poly(outline), markup, edge: topEdge(outline) });
}

/** The Landes' pines, small umbrella pines on the forest, none on the road (`road`: its points [x, y]) nor where a
 *  name is written (`clear`: boxes { x0, x1, y0, y1 }). */
export function landes(project, { road = [], clear = [] } = {}) {
  const forest = pts(project, FOREST);
  const basin = pts(project, [[44.62, -1.255], ...BASIN]);
  const [x0, x1] = [Math.min(...forest.map(([x]) => x)), Math.max(...forest.map(([x]) => x))];
  const [y0, y1] = [Math.min(...forest.map(([, y]) => y)), Math.max(...forest.map(([, y]) => y))];
  const r = random(71);
  const spots = [];
  for (let i = 0; i < 420 && spots.length < 190; i++) {
    const at = [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)];
    if (!inside(forest, at) || inside(basin, at) || distance(road, at) < 11 || clear.some((b) => at[0] > b.x0 && at[0] < b.x1 && at[1] > b.y0 && at[1] < b.y1)) continue;
    if (spots.some(([x, y]) => Math.abs(x - at[0]) < 8 && Math.abs(y - at[1]) < 6)) continue;
    spots.push([...at, 0.8 + r() * 0.45]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  let trunks = "";
  let crowns = "";
  let lit = "";
  for (const [x, y, s] of spots) {
    trunks += poly([[x - 0.6 * s, y], [x - 0.6 * s, y - 5 * s], [x + 0.6 * s, y - 5 * s], [x + 0.6 * s, y]]);
    crowns += poly([[x - 5 * s, y - 5.4 * s], [x - 3 * s, y - 8 * s], [x + 1 * s, y - 8.8 * s], [x + 4.6 * s, y - 7.4 * s], [x + 5.2 * s, y - 5.2 * s], [x, y - 4.4 * s]]);
    lit += poly([[x - 4.2 * s, y - 6 * s], [x - 2.6 * s, y - 7.8 * s], [x + 0.8 * s, y - 8.4 * s], [x - 0.6 * s, y - 6.6 * s]]);
  }
  return cutPiece({ silhouette: crowns, markup: path(trunks, C.trunk) + path(crowns, C.pine) + path(lit, C.pineLit), lift: 0.4 });
}

/** The islands of the Pertuis charentais, paper pieces on the sea like the land: Ré (its salt marshes round the Fier
 *  d'Ars, the Phare des Baleines on its west tip), Oléron (its forest in the south-west), Aix; and Ré's bridge from La
 *  Pallice to Rivedoux, a pale strip over the water (the trip's dots run along it). */
export function iles(project) {
  const islands = [RE, OLERON, AIX].map((list) => pts(project, list));
  const outlines = islands.map(poly).join("");
  let pans = ""; // the salt pans between Loix and Ars
  for (const lat of [46.2, 46.211])
    for (const lon of [-1.47, -1.455, -1.44, -1.425]) {
      const { x, y } = project([lat, lon]);
      pans += poly([[x, y], [x + 2.2, y + 0.2], [x + 2.1, y + 1.7], [x - 0.1, y + 1.5]]);
    }
  const forest = poly(pts(project, [[45.86, -1.255], [45.9, -1.3], [45.94, -1.335], [45.9, -1.27], [45.84, -1.24]]));
  const [[ax, ay], [bx, by]] = pts(project, BRIDGE);
  const deck = `M${n(ax)} ${n(ay)}Q${n((ax + bx) / 2 + (by - ay) * 0.3)} ${n((ay + by) / 2 - (bx - ax) * 0.3)} ${n(bx)} ${n(by)}`; // gently curved
  const { x: lx, y: ly } = project(BALEINES);
  const tower = poly([[lx - 1.7, ly], [lx - 1.1, ly - 9], [lx + 1.1, ly - 9], [lx + 1.7, ly]]);
  const lantern = poly([[lx - 1.3, ly - 9], [lx - 1.3, ly - 11], [lx, ly - 12.4], [lx + 1.3, ly - 11], [lx + 1.3, ly - 9]]);
  return [
    cutPiece({ silhouette: outlines, markup: path(outlines, C.land) + path(pans, C.wave) + path(forest, C.forest), edge: islands.map((list) => topEdge(list)).join(""), lift: 0.7 }),
    cutPiece({ silhouette: deck, markup: `<path d="${deck}" fill="none" stroke="${C.ink}" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/><path d="${deck}" fill="none" stroke="${C.cream}" stroke-width="2" stroke-linecap="round"/>`, stroke: 3.4, lift: 0.5 }),
    cutPiece({ silhouette: tower + lantern, markup: path(tower, "#bdb6a6") + path(poly([[lx, ly], [lx - 0.4, ly - 9], [lx + 1.1, ly - 9], [lx + 1.7, ly]]), "#a29b8b") + path(lantern, C.rock) + path(poly([[lx - 0.8, ly - 9.4], [lx + 0.8, ly - 9.4], [lx + 0.8, ly - 10.6], [lx - 0.8, ly - 10.6]]), "#f6d77a"), lift: 0.4 }),
  ].join("");
}

/** The marshes up north, the Marais poitevin and Brouage's: pale wet meadows criss-crossed by their canals, a row of
 *  trees along some, none on the road (`road`: its points [x, y]) nor on a name (`clear`: boxes). */
export function marais(project, { road = [], clear = [] } = {}) {
  const r = random(103);
  const free = ([x, y]) => distance(road, [x, y]) > 6 && !clear.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
  let meadows = "";
  let canals = "";
  const trees = [];
  for (const shape of MARAIS.map((list) => pts(project, list))) {
    meadows += poly(shape);
    const [x0, x1] = [Math.min(...shape.map(([x]) => x)), Math.max(...shape.map(([x]) => x))];
    const [y0, y1] = [Math.min(...shape.map(([, y]) => y)), Math.max(...shape.map(([, y]) => y))];
    // a grid of nodes a little askew; a canal between two neighbours inside the marsh
    const nodes = [];
    for (let y = y0 + 3; y < y1; y += 5.5) nodes.push(Array.from({ length: Math.ceil((x1 - x0) / 8) }, (_, k) => [x0 + 3 + k * 8 + (r() - 0.5) * 2, y + (k % 2) * 0.8 + (r() - 0.5)]));
    const ok = (p) => p && inside(shape, p) && free(p);
    nodes.forEach((row, j) =>
      row.forEach((p, k) => {
        if (!ok(p)) return;
        if (ok(row[k + 1])) canals += `M${xy(p)}L${xy(row[k + 1])}`;
        if (k % 2 === 0 && ok(nodes[j + 1]?.[k])) canals += `M${xy(p)}L${xy(nodes[j + 1][k])}`;
        if (r() < 0.12 && ok(row[k + 1])) for (let t = 0.2; t < 1; t += 0.3) trees.push([p[0] + t * 8, p[1] - 0.6, 1.3 + r() * 0.5]);
      }),
    );
  }
  return [
    cutPiece({ silhouette: meadows, markup: path(meadows, C.marsh), lift: 0.15 }),
    `<path d="${canals}" fill="none" stroke="${C.canal}" stroke-width=".7" stroke-linecap="round"/>`,
    roundTrees(trees, { tint: { crown: C.marshTree, lit: C.marshTreeLit, trunk: C.trunk }, lift: 0.3, smooth: false }),
  ].join("");
}

/** The Charente, from Angoulême by Cognac, Saintes and Rochefort to the sea by Fouras, over the land's fields and vines. */
export function charente(project) {
  const d = curve(pts(project, CHARENTE));
  return `<path d="${d}" fill="none" stroke="${C.river}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${C.wave}" stroke-width=".8" stroke-linecap="round"/>`;
}

/** One row of paper peaks along the crest (`dy` from it), from `size[0]` to `size[1]` high (now and then a broad
 *  massif with a second summit), about `step` apart; snow on those over `snow` units; `round`: low domes (foothills). */
function peaks(crest, { dy, size: [s0, s1], step, seed, tone, lit: light = C.peakLit, snow = Infinity, round = false }) {
  const r = random(seed);
  let body = "";
  let lit = "";
  let caps = "";
  for (let x = crest[0][0]; x < crest.at(-1)[0]; x += step * (0.6 + r() * 0.8)) {
    const h = s0 + r() ** 1.4 * (s1 - s0); // most of them small, a few tall
    const w = h * (round ? 2.6 + r() : 1.15 + r() * 0.7);
    const foot = edgeAt(crest, x) + dy + (r() - 0.5) * 14;
    const apex = [x + (r() - 0.5) * w * 0.3, foot - h];
    const [left, right] = [[x - w / 2, foot], [x + w / 2, foot]];
    if (round) {
      body += poly([left, [x - w * 0.3, foot - h * 0.75], [apex[0], apex[1]], [x + w * 0.3, foot - h * 0.7], right]);
      lit += poly([left, [x - w * 0.3, foot - h * 0.75], [apex[0], apex[1]], [apex[0] - w * 0.05, foot]]);
      continue;
    }
    const twin = r() < 0.25; // a massif: a lower second summit on its east shoulder
    const second = [apex[0] + w * 0.24, apex[1] + h * 0.28];
    body += poly(twin ? [left, apex, [apex[0] + w * 0.12, apex[1] + h * 0.42], second, right] : [left, apex, right]);
    lit += poly([left, apex, [apex[0] - w * 0.05, foot]]);
    if (h > snow) caps += poly([apex, [apex[0] + w * 0.17, apex[1] + h * 0.3], [apex[0] + w * 0.04, apex[1] + h * 0.22], [apex[0] - w * 0.06, apex[1] + h * 0.34], [apex[0] - w * 0.16, apex[1] + h * 0.28]]);
  }
  return cutPiece({ silhouette: body, markup: path(body, tone) + path(lit, light) + (caps ? path(caps, C.snow) : ""), lift: 0.6 });
}

/** The Pyrenees, a chain rising towards the south: green foothills, rows of paper peaks higher and higher up to the
 *  snowy crest, lower again on the Spanish side; and the Pic du Midi d'Ossau, dark, its two horns, by the Ayous lakes. */
export function pyrenees(project) {
  const crest = pts(project, CREST).sort((a, b) => a[0] - b[0]);
  const hills = [...crest.map(([x, y], k) => [x, y - 44 - (k % 2) * 8]), [crest.at(-1)[0], 1600], [crest[0][0], 1600]];
  const [ox, oy] = (({ x, y }) => [x, y])(project(OSSAU_AT));
  const k = 0.17; // the lake view's Ossau, made small: its foot at x 318, y 372
  const ossau = [...OSSAU, [540, 400], [96, 400]].map(([x, y]) => [ox + (x - 318) * k, oy + (y - 400) * k]);
  const horns = OSSAU.filter(([x]) => x < 300).map(([x, y]) => [ox + (x - 318) * k, oy + (y - 400) * k]);
  const lit = [...horns, [ox - 9, oy]];
  return [
    cutPiece({ silhouette: poly(hills), markup: path(poly(hills), C.hill), edge: curve(hills.slice(0, -2)), lift: 0.5 }),
    peaks(crest, { dy: -40, size: [6, 11], step: 26, seed: 80, tone: C.foothill, lit: C.hillLit, round: true }),
    peaks(crest, { dy: -24, size: [10, 18], step: 22, seed: 81, tone: C.peakFar }),
    peaks(crest, { dy: -6, size: [16, 28], step: 26, seed: 82, tone: C.peakFar, snow: 22 }),
    peaks(crest, { dy: 16, size: [24, 42], step: 30, seed: 83, tone: C.peak, snow: 20 }), // the crest
    peaks(crest, { dy: 42, size: [18, 30], step: 28, seed: 84, tone: C.peakFar, snow: 26 }),
    peaks(crest, { dy: 70, size: [10, 18], step: 26, seed: 85, tone: C.peakFar }), // the Spanish side, lower
    peaks(crest, { dy: 104, size: [6, 12], step: 24, seed: 86, tone: C.foothill, lit: C.hillLit, round: true }), // and its outer sierras
    peaks(crest, { dy: 140, size: [5, 10], step: 30, seed: 87, tone: C.foothill, lit: C.hillLit, round: true }),
    cutPiece({ silhouette: poly(ossau), markup: path(poly(ossau), C.rock) + path(poly(lit), C.rockLit), edge: topEdge(ossau), lift: 0.7 }),
  ].join("");
}

const escape = (text) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** stops({ trajet, lieu }, project): where names are written, [{ name, x, y, kind, side, gap, tx, ty, anchor, box }]:
 *  the start (trajet.depart, its first point), each stage (trajet.etapes, at the point of index trajet.etapesAt[k], the
 *  nearest to its town) and the arrival (trajet.arrivee, else lieu; its last point). On a trip going south, each name on
 *  the side the road does not take; on a trip going east (further across than down), under the road where the car
 *  never covers them, the start's beginning by its point (past the car on the start), each stage's centred on its
 *  point, and the arrival's over its pin, ending by it (in the stage). On a trip going north, the start's as going
 *  south, each stage's away from the road's two ways out of its point (a little up or down too), and the arrival's under
 *  its pin, on the side its last stretch does not come from. The text at tx, ty, anchored there. A stage without its
 *  point throws, naming it. */
export function stops({ trajet, lieu }, project) {
  const road = pts(project, trajet.points);
  const last = road.length - 1;
  const sideways = Math.abs(road[last][0] - road[0][0]) > Math.abs(road[last][1] - road[0][1]);
  const north = !sideways && road[last][1] < road[0][1];
  const etapes = trajet.etapes.map((name, k) => {
    const at = trajet.etapesAt?.[k];
    if (!Number.isInteger(at) || !road[at]) throw new Error(`trajet: no point for the stage « ${name} » (etapesAt[${k}] = ${at})`);
    return { name, at, kind: "etape" };
  });
  const list = [{ name: trajet.depart, at: 0, kind: "start" }, ...etapes, { name: trajet.arrivee ?? lieu, at: last, kind: "end" }];
  return list.map(({ name, at, kind }) => {
    const [x, y] = road[at];
    const near = [road[at - 1], road[at + 1]].filter(Boolean);
    const side = near.reduce((sum, [nx]) => sum + nx, 0) / near.length > x ? "left" : "right";
    const gap = kind === "etape" ? 10 : 34; // the car stands on the start and near the arrival
    const wide = name.length * 8.4;
    // away from the road: the ways out of the point (unit vectors), summed and turned round
    const ways = near.map(([nx, ny]) => [nx - x, ny - y].map((v) => v / Math.hypot(nx - x, ny - y)));
    const back = [0, 1].map((k) => -ways.reduce((sum, way) => sum + way[k], 0));
    const away = back.map((v) => v / (Math.hypot(...back) || 1));
    const [tx, ty, anchor] =
      north && kind === "etape"
        ? [away[0] < 0 ? x - gap : x + gap, y + 5 + away[1] * 12, away[0] < 0 ? "end" : "start"]
        : north && kind === "end"
          ? [side === "left" ? x - 25 : x + 25, y + 21, "middle"]
          : !sideways
            ? [side === "left" ? x - gap : x + gap, y + 5, side === "left" ? "end" : "start"]
            : kind === "start"
              ? [x + 16, y + 24, "start"]
              : kind === "end"
                ? [x + 14, y - 46, "end"]
                : [x, y + 24, "middle"];
    const x0 = anchor === "end" ? tx - wide : anchor === "middle" ? tx - wide / 2 : tx;
    return { name, x, y, kind, side, gap, tx, ty, anchor, box: { x0: x0 - 4, x1: x0 + wide + 4, y0: ty - 21, y1: ty + 4 } };
  });
}

/** The stops: a ring at the start, a dot at each stage (the pin marks the arrival), and their names. */
export function names(list) {
  return list
    .map(({ name, x, y, kind, tx, ty, anchor }) => {
      const mark = kind === "start" ? `<circle cx="${n(x)}" cy="${n(y)}" r="5.6" fill="${C.ink}"/><circle cx="${n(x)}" cy="${n(y)}" r="2.8" fill="${C.cream}"/>` : kind === "etape" ? `<circle cx="${n(x)}" cy="${n(y)}" r="3.8" fill="${C.ink}"/><circle cx="${n(x)}" cy="${n(y)}" r="1.6" fill="${C.cream}"/>` : "";
      return `${mark}<text class="st-name" x="${n(tx)}" y="${n(ty)}" text-anchor="${anchor}">${escape(name)}</text>`;
    })
    .join("");
}

/** The trip's road along `d` (path data), unseen: .st-route-path, the line to measure; .st-route-dots, where its dots
 *  go (routeDots()). */
export const routeLine = (d) => `<path class="st-route-path" d="${d}" fill="none"/><g class="st-route-dots"></g>`;

/** The road's dots at these points ([{ x, y }]), each with its shadow, all hidden: revealed one by one behind the car. */
export const routeDots = (list) =>
  list.map(({ x, y }) => `<g visibility="hidden"><circle cx="${n(x)}" cy="${n(y + 1.4)}" r="1.8" fill="${C.ink}" fill-opacity=".2"/><circle cx="${n(x)}" cy="${n(y)}" r="1.8" fill="${C.route}"/></g>`).join("");

/** The arrival's pin, its tip at (0, 0) of its 28 × 42 box (x −14, y −38): red paper, a cream eye, its shadow. */
export const PIN = `<svg class="st-pin__svg" viewBox="-14 -38 28 42" width="28" height="42"><path d="M0 0C-3-8-11-13-11-22a11 11 0 1 1 22 0c0 9-8 14-11 22z" transform="translate(1.6 2.6)" fill="${C.ink}" fill-opacity=".26"/><path d="M0 0C-3-8-11-13-11-22a11 11 0 1 1 22 0c0 9-8 14-11 22z" fill="${C.pin}"/><path d="M0 0c3-8 11-13 11-22a11 11 0 0 0-4-8.5c2 8-2 18-7 30.5z" fill="${C.pinShade}"/><circle cx="0" cy="-22" r="4.4" fill="${C.cream}"/><path d="M-8.6-27a10 10 0 0 1 6-5.6" fill="none" stroke="#fff7e6" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/></svg>`;
