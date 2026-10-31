// The map's pieces (spec § 5, moment 1): the South-West in paper, from real coordinates [lat, lon] placed by a
// projection (geo.js): the ocean and its waves, the land with the Gironde's estuary and the Arcachon basin, the rivers,
// the Landes' pines, the Pyrenees in paper peaks with the Ossau's two horns, the trip's stops and names, its dotted line
// and the arrival's pin. All of it reaches far past the stage (x −1000 to 1600), the camera follows the car south. Paper
// only: the map never becomes the poster. Pure: markup only, the same for the same arguments.
import { cutPiece } from "./decor.js";
import { blob, curve, edgeAt, n, path, poly, random, topEdge } from "./geom.js";
import { OSSAU } from "./props.js";

const C = {
  sea: "#8fb6cd",
  wave: "#c6dde8",
  land: "#eee3c4",
  fields: ["#e7ddb8", "#e3e1ba", "#ebdeb9"],
  forest: "#e1dcb2",
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
  [[45.03, -0.555], [44.97, -0.4], [44.92, -0.24], [44.87, 0.1], [44.85, 0.48], [44.82, 1.0], [44.9, 1.6], [45.0, 2.4], [45.3, 3.4]], // the Dordogne
  [[43.53, -1.52], [43.49, -1.42], [43.6, -1.2], [43.71, -1.05], [43.76, -0.57], [43.7, -0.26], [43.45, 0.0], [43.23, 0.07], [43.0, 0.15], [42.8, 0.15]], // the Adour
  [[43.64, -1.15], [43.49, -0.77], [43.31, -0.45], [43.295, -0.37], [43.2, -0.2], [43.09, -0.05], [42.9, -0.02], [42.72, -0.01]], // the Gave de Pau, from the Adour to Gavarnie
];
// the Landes' forest, and the Médoc's: [lat, lon]
const FOREST = [[45.4, -1.1], [45.3, -0.92], [45.05, -0.9], [44.9, -0.72], [44.6, -0.5], [44.3, -0.36], [44.0, -0.2], [43.78, -0.28], [43.72, -0.7], [43.72, -1.05], [43.68, -1.38], [44.0, -1.3], [44.42, -1.22], [44.75, -1.08], [45.0, -1.16]];
// the crest of the Pyrenees, and on west the Basque and Cantabrian mountains behind the Spanish coast
const CREST = [[43.0, -6.6], [43.15, -4.8], [43.05, -3.5], [43.05, -2.4], [43.31, -1.635], [43.1, -1.3], [42.99, -0.99], [42.95, -0.72], [42.84, -0.44], [42.84, -0.29], [42.77, -0.15], [42.85, 0.12], [42.63, 0.66], [42.67, 1.41], [42.52, 2.46], [42.45, 3.15], [42.4, 4.4]];
const OSSAU_AT = [42.835, -0.3]; // a little east of its true place (42.84, −0.44), clear of the lakes' pin

const pts = (project, list) => list.map((p) => project(p)).map(({ x, y }) => [x, y]);
/** Is [x, y] inside the polygon? */
function inside(list, [x, y]) {
  let odd = false;
  for (let i = 0, j = list.length - 1; i < list.length; j = i++) {
    const [[xi, yi], [xj, yj]] = [list[i], list[j]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
  }
  return odd;
}
/** The land's outline: the coast, closed far to the south, east and north. */
const landOf = (project) => [...pts(project, COAST), [-1000, 1600], [1600, 1600], [1600, -700], [-200, -700]];
/** How far [x, y] is from a line of points. */
function distance(line, [x, y]) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [[ax, ay], [bx, by]] = [line[i - 1], line[i]];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)));
  }
  return best;
}

/** The ocean: the sea under everything, waves where the land does not cover it. */
export function ocean(project) {
  const land = landOf(project);
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
 *  inland (east of `road`, its points [x, y]) and its rivers. */
export function land(project, { road = [] } = {}) {
  const outline = landOf(project);
  const forest = blob(pts(project, FOREST));
  const rivers = RIVERS.map((river) => curve(pts(project, river))).join("");
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

/** stops({ trajet, lieu }, project): where names are written, [{ name, x, y, kind, side, box }]: the start
 *  (trajet.depart, its first point), each stage (trajet.etapes, at the point of index trajet.etapesAt[k], the nearest
 *  to its town) and the arrival (lieu, its last point); each name on the side the road does not take. A stage without
 *  its point throws, naming it. */
export function stops({ trajet, lieu }, project) {
  const road = pts(project, trajet.points);
  const last = road.length - 1;
  const etapes = trajet.etapes.map((name, k) => {
    const at = trajet.etapesAt?.[k];
    if (!Number.isInteger(at) || !road[at]) throw new Error(`trajet: no point for the stage « ${name} » (etapesAt[${k}] = ${at})`);
    return { name, at, kind: "etape" };
  });
  const list = [{ name: trajet.depart, at: 0, kind: "start" }, ...etapes, { name: lieu, at: last, kind: "end" }];
  return list.map(({ name, at, kind }) => {
    const [x, y] = road[at];
    const near = [road[at - 1], road[at + 1]].filter(Boolean);
    const side = near.reduce((sum, [nx]) => sum + nx, 0) / near.length > x ? "left" : "right";
    const gap = kind === "etape" ? 10 : 34; // the car stands on the start and near the arrival
    const wide = name.length * 8.4;
    const x0 = side === "left" ? x - gap - wide : x + gap;
    return { name, x, y, kind, side, gap, box: { x0: x0 - 4, x1: x0 + wide + 4, y0: y - 16, y1: y + 9 } };
  });
}

/** The stops: a ring at the start, a dot at each stage (the pin marks the arrival), and their names. */
export function names(list) {
  return list
    .map(({ name, x, y, kind, side, gap }) => {
      const mark = kind === "start" ? `<circle cx="${n(x)}" cy="${n(y)}" r="5.6" fill="${C.ink}"/><circle cx="${n(x)}" cy="${n(y)}" r="2.8" fill="${C.cream}"/>` : kind === "etape" ? `<circle cx="${n(x)}" cy="${n(y)}" r="3.8" fill="${C.ink}"/><circle cx="${n(x)}" cy="${n(y)}" r="1.6" fill="${C.cream}"/>` : "";
      const tx = side === "left" ? x - gap : x + gap;
      return `${mark}<text class="st-name" x="${n(tx)}" y="${n(y + 5)}" text-anchor="${side === "left" ? "end" : "start"}">${escape(name)}</text>`;
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
