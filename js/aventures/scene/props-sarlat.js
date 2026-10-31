// Sarlat on an evening (the canoe's spec, § 2, moment 8), after Kevin's photo of the street of the garlands: the paved
// street going away between its houses of blond stone (their shop fronts lit, awnings, balconies, shutters, lanterns),
// under strings of paper flowers hung across it from side to side, the evening sky glowing at its end; the lanterns'
// light, the knight's lantern's halo and the paper sparkles round him. The street is drawn in one-point perspective
// (FOND, where it goes out of sight) and cut by distance in slices (TRANCHES), a layer each: the camera glides down it
// (canoe.js). Paper only. Pure: markup only, the same for the same arguments.
import { cutPiece } from "./decor.js";
import { blob, dot, lens, n, path, poly, random, speck } from "./geom.js";
import { piece, sheetOf } from "./props.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** Where the street goes out of sight: the camera glides towards it. */
export const FOND = { x: 195, y: 392 };
const F = 330; // units a metre at a metre away (the eye's focal length)
const EYE = 1.7; // m: the eye over the paving
const HALF = 4; // m: half the street's width, wall to wall
const FAR = 96; // m: the street's end, the evening's light there

/** A point of the street on the stage: X across (m, left < 0), Y up from the paving, Z away from the eye. */
const at = (X, Y, Z) => [FOND.x + (F * X) / Z, FOND.y + (F * (EYE - Y)) / Z];
// a polygon is clipped to the layer (and a little over the stage's top and bottom): its sheet stays a sheet's size
const BOX = [[1, -40, 1], [1, 800, -1], [0, L - 10, 1], [0, R + 10, -1]];
function clip(list) {
  for (const [k, v, s] of BOX) {
    const out = [];
    list.forEach((p, i) => {
      const q = list[(i + 1) % list.length];
      const [inP, inQ] = [s * (p[k] - v) >= 0, s * (q[k] - v) >= 0];
      if (inP) out.push(p);
      if (inP !== inQ) {
        const t = (v - p[k]) / (q[k] - p[k]);
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    });
    list = out;
    if (list.length < 3) return [];
  }
  return list;
}
/** Points of the street (as at()) → path data of their polygon on the stage, clipped ("" if out of it). */
const shape = (list) => {
  const cut = clip(list.map(([X, Y, Z]) => at(X, Y, Z)));
  return cut.length ? poly(cut) : "";
};
/** On a wall (`side` −1 the left one, 1 the right), `out` m in front of it: from Z0 to Z1, from Y0 up to Y1. */
const onWall = (side, Z0, Z1, Y0, Y1, out = 0) => {
  const X = side * (HALF - out);
  return shape([[X, Y0, Z0], [X, Y0, Z1], [X, Y1, Z1], [X, Y1, Z0]]);
};
/** Flat at height Y, from `out0` to `out1` m in front of a wall, from Z0 to Z1 (a balcony's floor, under an eave). */
const flat = (side, Z0, Z1, Y, out0, out1) => shape([[side * (HALF - out0), Y, Z0], [side * (HALF - out0), Y, Z1], [side * (HALF - out1), Y, Z1], [side * (HALF - out1), Y, Z0]]);
/** Sloping from the wall at Y0 down to Y1, `out` m in front of it (an awning). */
const sloped = (side, Z0, Z1, Y0, Y1, out) => shape([[side * HALF, Y0, Z0], [side * HALF, Y0, Z1], [side * (HALF - out), Y1, Z1], [side * (HALF - out), Y1, Z0]]);
/** Across the street at Z, facing the eye, from X0 to X1 and Y0 to Y1 (a balcony's or an awning's end). */
const across = (Z, X0, X1, Y0, Y1) => shape([[X0, Y0, Z], [X1, Y0, Z], [X1, Y1, Z], [X0, Y1, Z]]);
/** The paving from X0 to X1 and Z0 to Z1. */
const ground = (X0, X1, Z0, Z1) => shape([[X0, 0, Z0], [X1, 0, Z0], [X1, 0, Z1], [X0, 0, Z1]]);

/** `a` towards `b` (#rrggbb) by t (0 → 1). */
function mix(a, b, t) {
  const c = (hex, k) => parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16);
  return `#${[0, 1, 2].map((k) => Math.round(c(a, k) + (c(b, k) - c(a, k)) * t).toString(16).padStart(2, "0")).join("")}`;
}
const GOLD = "#f4d08f"; // the evening's light, warmer far off down the street
const haze = (colour, Z) => mix(colour, GOLD, Math.min(0.6, Math.max(0, (Z - 9) / 70)));

// ── The houses ──────────────────────────────────────────────

const STONES = ["#e3c487", "#d9b779", "#e9cd95", "#d4b073", "#dfbf83", "#e6c78c"];
const SHUTTERS = ["#7c91a4", "#8c6b4c", "#6f8a6c", "#9b8a71", "#687d8f", "#a0705a"];
const AWNINGS = ["#8f3330", "#3f5d48", "#3b4866", "#a1523a", "#6d2f45"];
const FLOOR = 3.1; // m a storey
const SHOP = 3.4; // m: the ground floor, its shop

/** The houses along a side (−1 left, 1 right), the same each time: [{ Z0, Z1, top, stone, shutters, awning, balcony,
 *  lantern }], from the eye to the street's end. */
function facades(side) {
  const r = random(side < 0 ? 401 : 409);
  const list = [];
  for (let Z = side < 0 ? 1.1 : 1.6; Z < FAR; ) {
    const len = 5.2 + r() * 3.6;
    list.push({
      Z0: Z,
      Z1: Z + len,
      top: SHOP + FLOOR * (3 + Math.floor(r() * 2)) + 0.4,
      stone: STONES[Math.floor(r() * STONES.length)],
      shutters: SHUTTERS[Math.floor(r() * SHUTTERS.length)],
      awning: r() < 0.6 ? AWNINGS[Math.floor(r() * AWNINGS.length)] : null,
      balcony: r() < 0.55,
      lantern: r() < 0.8,
    });
    Z += len;
  }
  return list;
}
const HOUSES = [-1, 1].flatMap((k) => facades(k).map((h) => ({ ...h, side: k })));

/** The street in slices by distance (m), a layer each (canoe.js), nearest last: [name, the Z it draws from, the Z its
 *  own pieces start (the garlands', the lanterns'), the Z it ends]. A slice also draws a little nearer than its own:
 *  as the camera glides, the slice in front of it grows faster and would open a gap. */
export const TRANCHES = [
  ["fond", 11, 16, 400],
  ["rue", 4, 6.5, 16],
  ["devant", 1, 1, 6.5],
];

const LANTERN = 0.5; // m: a lantern's height
const LANTERN_Y = 4.15; // m: its middle, over the shop
const lanternAt = (h) => ({ side: h.side, Z: h.Z0 + 0.45, out: 0.62 });

/** The lanterns on the houses, each lit by canoe.js: [{ slice, x, y, size }] (its middle on the stage, `size` its
 *  height in units). */
export const LANTERNES = HOUSES.filter((h) => h.lantern && h.Z0 > 2.5 && h.Z0 < 48).map((h) => {
  const { side, Z, out } = lanternAt(h);
  const [x, y] = at(side * (HALF - out), LANTERN_Y, Z);
  return { slice: TRANCHES.find(([, , own, end]) => Z >= own && Z < end)[0], x: n(x), y: n(y), size: n((F * LANTERN) / Z) };
});

/** Openings `w` m wide, as many as fit, spread evenly between Z0 and Z1, a margin at each end. → their starts. */
function bays(Z0, Z1, w, margin = 0.7) {
  const room = Z1 - Z0 - 2 * margin;
  const count = Math.max(1, Math.floor(room / (w + 1.2)));
  const gap = (room - count * w) / (count + 1);
  return Array.from({ length: count }, (_, k) => Z0 + margin + gap + k * (w + gap));
}

/** A house's pieces (path data by colour): its walls, what lies flat on them, and what stands out of them (awning,
 *  balcony, lantern, cornice: drawn after every wall, by distance). → { wall: [d, colour], parts: [[d, colour]], out:
 *  [[Z, d, colour, alpha]] } */
function house(h) {
  const { side, Z0, Z1, top } = h;
  const mid = (Z0 + Z1) / 2;
  const shade = side < 0 ? 0.9 : 1; // the left side in the evening's shade
  const tone = (colour) => haze(mix("#5a4632", colour, shade), mid);
  const fine = mid < 34; // far off, only the windows' rows
  const parts = [];
  const add = (d, colour) => d && parts.push([d, colour]);
  const out = [];
  const stick = (d, colour, Z = mid, alpha = 1) => d && out.push([Z, d, colour, alpha]);

  // the shop on the ground floor: its lit window, its door, its sign board over it, the light it spills on the paving
  const shopEnd = Z1 - 1.5;
  add(onWall(side, Z0 + 0.5, shopEnd, 0.35, 2.75), "#4a3427");
  add(onWall(side, Z0 + 0.62, shopEnd - 0.12, 0.45, 2.65), mid < 40 ? "#f4cf82" : "#f2d79a");
  if (fine) {
    for (let z = Z0 + 1.7; z < shopEnd - 0.6; z += 1.2) add(onWall(side, z, z + 0.08, 0.45, 2.65), "#4a3427"); // mullions
    add(onWall(side, Z0 + 0.62, shopEnd - 0.12, 1.9, 2.65), "#ffe4a6");
  }
  add(onWall(side, shopEnd + 0.35, Z1 - 0.45, 0, 2.4), "#3e2f26"); // the door
  add(onWall(side, Z0 + 0.4, shopEnd + 0.1, 2.85, 3.25), h.awning ? "#4b3a2e" : "#2f4a3c");
  if (mid < 20) stick(ground(side * HALF, side * (HALF - 1.3), Z0 + 0.6, shopEnd - 0.2), "#f4cf86", Z1 + 40, 0.4); // its glow on the paving, under all else

  // the storeys' windows, their open shutters and stone frames
  const floors = Math.round((top - SHOP - 0.4) / FLOOR);
  for (let k = 0; k < floors; k++) {
    const y0 = SHOP + k * FLOOR + 0.75;
    const y1 = y0 + (k === floors - 1 ? 1.35 : 1.8);
    for (const z of bays(Z0, Z1, 1.05)) {
      add(onWall(side, z - 0.1, z + 1.15, y0 - 0.12, y1 + 0.14), mix(tone(h.stone), "#fff4dc", 0.45)); // the frame
      add(onWall(side, z, z + 1.05, y0, y1), fine ? "#3c3330" : "#5a4a3c");
      if (!fine) continue;
      add(onWall(side, z + 0.48, z + 0.56, y0, y1), "#efe2c4"); // the casement
      add(onWall(side, z - 0.62, z - 0.12, y0, y1), h.shutters);
      add(onWall(side, z + 1.17, z + 1.67, y0, y1), h.shutters);
      if (mid < 18) add(onWall(side, z + 0.12, z + 0.4, y0 + 0.2, y1 - 0.5), "#6f6460"); // a glint on the glass
    }
  }
  // its balcony on the first floor: the floor slab seen from under it, its iron railing, flowers on it
  if (h.balcony && fine) {
    const [b0, b1] = [Z0 + 0.5, Z1 - 0.7];
    const y = SHOP + 0.62;
    stick(flat(side, b0, b1, y, 0, 0.66), "#a88a5a");
    stick(onWall(side, b0, b1, y, y + 0.14, 0.66), "#d8bd88");
    stick(onWall(side, b0, b1, y + 0.95, y + 1.04, 0.66), "#2e2723");
    for (let z = b0; z <= b1; z += mid < 12 ? 0.28 : 0.5) stick(onWall(side, z, z + 0.05, y + 0.14, y + 0.95, 0.66), "#2e2723");
    stick(onWall(side, b0, b1, y + 0.4, y + 0.46, 0.66), "#2e2723");
    for (const [y0, y1] of [[y + 0.95, y + 1.04], [y + 0.4, y + 0.46]]) stick(across(b0, side * HALF, side * (HALF - 0.66), y0, y1), "#2e2723", b0); // its end
    for (const k of [0.33, 0.66]) stick(across(b0, side * (HALF - k + 0.03), side * (HALF - k), y + 0.14, y + 1.04), "#2e2723", b0);
    if (mid < 20) {
      const r = random(Math.round(Z0 * 97));
      let blooms = "";
      let leaves = "";
      for (let z = b0 + 0.3; z < b1 - 0.2; z += 0.7 + r()) {
        const [x, yy] = at(side * (HALF - 0.4), y + 1.12, z);
        const s = (F * 0.16) / z;
        leaves += dot(x, yy + s * 0.4, s * 1.1);
        blooms += dot(x - s * 0.5, yy, s * 0.55) + dot(x + s * 0.4, yy - s * 0.3, s * 0.5);
      }
      stick(leaves, "#5c8a45");
      stick(blooms, r() < 0.5 ? "#d9484a" : "#e98aa0");
    }
  }
  // its awning over the shop, sloping out, its fringe along its edge
  if (h.awning && fine) {
    const [a0, a1] = [Z0 + 0.35, shopEnd + 0.15];
    stick(sloped(side, a0, a1, 3.3, 2.7, 1.15), h.awning);
    stick(onWall(side, a0, a1, 2.48, 2.7, 1.15), mix(h.awning, "#000000", 0.18));
    stick(across(a0, side * HALF, side * (HALF - 1.15), 2.7, 3.3), mix(h.awning, "#000000", 0.3), a0);
  }
  // the cornice under its roof, the eave's underside
  stick(flat(side, Z0, Z1, top, 0, 0.45), "#6a4b33", Z1);
  stick(onWall(side, Z0, Z1, top - 0.32, top, 0.45), "#efd9a8", Z1);
  // the lantern on its bracket, unlit (canoe.js lights it)
  if (h.lantern) {
    const { Z, out: o } = lanternAt(h);
    const [bx, by] = at(side * HALF, LANTERN_Y + 0.42, Z);
    const [lx, ly] = at(side * (HALF - o), LANTERN_Y, Z);
    const s = (F * LANTERN) / Z;
    const iron = `M${n(bx)} ${n(by)}L${n(lx)} ${n(ly - s * 0.75)}L${n(lx)} ${n(ly - s * 0.62)}L${n(bx)} ${n(by + s * 0.14)}Z` + lanternShape(lx, ly, s);
    stick(iron, "#2d2622", Z);
    stick(glass(lx, ly, s), "#6f6656", Z);
  }
  return { wall: [onWall(side, Z0, Z1, 0, top), tone(h.stone)], parts: parts.map(([d, c]) => [d, c === h.shutters || c === "#3e2f26" ? haze(c, mid) : c]), out };
}

/** A lantern's iron (its cap, frame and finial) `s` units tall, its middle at x, y, as path data. */
function lanternShape(x, y, s) {
  const w = s * 0.32;
  return poly([[x - w * 1.25, y - s * 0.38], [x, y - s * 0.62], [x + w * 1.25, y - s * 0.38]]) + poly([[x - w, y - s * 0.4], [x + w, y - s * 0.4], [x + w * 0.8, y + s * 0.32], [x - w * 0.8, y + s * 0.32]]) + poly([[x - w * 0.3, y + s * 0.32], [x + w * 0.3, y + s * 0.32], [x, y + s * 0.5]]);
}
/** Its glass, inside its frame. */
const glass = (x, y, s) => poly([[x - s * 0.24, y - s * 0.33], [x + s * 0.24, y - s * 0.33], [x + s * 0.19, y + s * 0.25], [x - s * 0.19, y + s * 0.25]]);

// ── The paving ──────────────────────────────────────────────

const FLAGS = ["#cdbfa6", "#c3b59c", "#d5c9b2", "#bdaf96", "#c9baa0"];

/** The paving from Z0 to Z1: limestone flags in staggered rows, their joints, the evening's light far off, a drain. */
function paving(Z0, Z1) {
  const r = random(Math.round(Z0 * 13 + 5));
  const tones = FLAGS.map(() => "");
  let joints = "";
  for (let z = Z0; z < Math.min(Z1, 34); z *= 1.16) {
    const z1 = Math.min(Z1, z * 1.16);
    const offset = (Math.round(Math.log(z) / Math.log(1.16)) % 2) * 0.4;
    for (let x = -HALF - offset; x < HALF; x += 0.8) {
      const [x0, x1] = [Math.max(-HALF, x + 0.03), Math.min(HALF, x + 0.77)];
      if (x1 <= x0) continue;
      const k = Math.floor(r() * FLAGS.length);
      tones[k] += ground(x0, x1, z * 1.004, z1 * 0.996);
    }
    if (z < 6) joints += lens(...at(-HALF + r() * 7, 0, z), (F * 0.6) / z, (F * 0.012) / z);
  }
  const base = ground(-HALF, HALF, Z0, Z1);
  return [
    path(base, "#a99b83"),
    ...tones.map((d, k) => path(d, FLAGS[k])),
    Z1 > 22 ? `<path d="${ground(-HALF, HALF, Math.max(Z0, 22), Z1)}" fill="#ecd29c" fill-opacity=".55"/>` : "", // the evening's light along the street's end
    path(joints, "#b7a98f"),
  ].join("");
}
/** A drain's grate in the paving (as in the photo), from X0 to X1 and Z0 to Z1. */
function grate(X0, X1, Z0, Z1) {
  let slots = "";
  for (let x = X0 + 0.08; x < X1 - 0.05; x += 0.16) slots += ground(x, x + 0.07, Z0 + 0.06, Z1 - 0.06);
  return path(ground(X0, X1, Z0, Z1), "#4b4239") + path(slots, "#2b2622");
}

// ── The garlands ────────────────────────────────────────────

const BLOSSOMS = ["#fffaf3", "#f6c6cf", "#fbe1cf", "#f1a9b9", "#fff1f2"];
// the wires across the street (m away), and their strings of paper flowers hanging in loops
const WIRES = [3.6, 5.4, 7.6, 10.2, 13.4, 17.5, 23, 30, 40, 54];

/** The garlands of a slice, from Z0 to Z1: on each wire across the street, loops of paper flowers side by side, deeper
 *  ones between them (as in the photo, crossing), the flowers white, pink and peach. */
function garlands(Z0, Z1) {
  const strings = [];
  const flowers = BLOSSOMS.map(() => "");
  for (const Z of WIRES.filter((z) => z >= Z0 && z < Z1).reverse()) {
    const r = random(Math.round(Z * 31));
    const wire = 8.6 + (r() - 0.5) * 0.4;
    const step = Z < 9 ? 0.3 : Z < 24 ? 0.46 : 0.75;
    const loops = [];
    for (let k = 0; k < 5; k++) loops.push([-HALF + k * 1.6, -HALF + (k + 1) * 1.6, 1.6 + r() * 0.6]);
    if (Z < 30) for (let k = 0; k < 4; k++) loops.push([-HALF + 0.8 + k * 1.6, -HALF + 0.8 + (k + 1) * 1.6, 2.5 + r() * 0.7]);
    for (const [xa, xb, sag] of loops) {
      const point = (t) => at(xa + (xb - xa) * t, wire - sag * 4 * t * (1 - t), Z);
      strings.push([Z, `M${Array.from({ length: 13 }, (_, k) => point(k / 12).map(n).join(" ")).join("L")}`]);
      const count = Math.round((xb - xa + 1.6 * sag) / step);
      for (let k = 1; k < count; k++) {
        const [x, y] = point(k / count);
        const s = (F * 0.12) / Z;
        if (y < -20 || x < L || x > R) continue; // out of the stage
        flowers[Math.floor(r() * BLOSSOMS.length)] += Z < 9 ? rosette(x, y, s) : Z < 26 ? dot(x, y, s) : speck(x, y, s * 1.2);
      }
    }
  }
  const all = flowers.join("");
  const lines = strings.map(([Z, d]) => `<path d="${d}" fill="none" stroke="#8d7f72" stroke-width="${n(Math.max(0.35, (F * 0.018) / Z))}"/>`).join("");
  if (!all) return "";
  // one shadow under them all (so many small pieces: lighter to draw than a cut piece's two)
  return `${lines}<path d="${all}" transform="translate(0 1.2)" fill="#3b2a18" fill-opacity=".22"/>${flowers.map((d, k) => path(d, BLOSSOMS[k])).join("")}`;
}
/** A paper flower `s` units wide at x, y: five round petals. */
function rosette(x, y, s) {
  const petals = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = k % 2 ? s * 0.8 : s;
    return [x + Math.cos(a) * rad, y + Math.sin(a) * rad];
  });
  return s > 6 ? blob(petals) : poly(petals); // round petals near, cheaper further
}

// ── The sky and the slices ──────────────────────────────────

/** The evening sky over the street: blue-lilac high up, rose, peach, then gold down to where the street ends, the
 *  light glowing there, thin pink clouds. */
export function ciel() {
  const r = random(421);
  const strips = [150, 236, 300, 352].map((y) => Array.from({ length: 11 }, (_, i) => [L + i * 160, y + (r() - 0.5) * 10]));
  const tones = ["#9fb0d3", "#b8b8d6", "#ddbfc8", "#f0c9a8", "#f8dba6"];
  const clouds = [[120, 120, 90], [210, 176, 70], [40, 210, 60], [300, 96, 80], [-200, 160, 120], [520, 140, 110]].map(([x, y, w]) => lens(x, y, w, 3.2)).join("");
  return [
    `<rect x="${L}" y="-30" width="1600" height="${FOND.y + 60}" fill="${tones[0]}"/>`,
    ...strips.map((edge, k) => sheetOf("paper", edge, tones[k + 1], "", FOND.y + 40)),
    path(clouds, "#f3c9c4"),
    `<path d="${dot(FOND.x, FOND.y - 4, 70)}" fill="#fff0c4" fill-opacity=".5"/>`,
    `<path d="${dot(FOND.x, FOND.y - 4, 34)}" fill="#fff8e2" fill-opacity=".8"/>`,
  ].join("");
}

/** A slice of the street (TRANCHES: its name): the paving and the walls from its start to its end, what lies on them,
 *  what stands out of them (nearest last), then its garlands; the nearest has a drain in the paving. */
export function tranche(name) {
  const [, from, own, to] = TRANCHES.find(([key]) => key === name);
  const mine = HOUSES.filter((h) => h.Z1 > from && h.Z0 < to).map(house);
  const walls = mine.map(({ wall: [d, colour] }) => path(d, colour)).join("");
  const outline = mine.map(({ wall: [d] }) => d).join("");
  const parts = mine.flatMap((h) => h.parts).map(([d, colour]) => path(d, colour)).join("");
  const out = mine
    .flatMap((h) => h.out)
    .sort((a, b) => b[0] - a[0])
    .map(([, d, colour, alpha]) => (alpha < 1 ? `<path d="${d}" fill="${colour}" fill-opacity="${alpha}"/>` : path(d, colour)))
    .join("");
  return [
    paving(from, to),
    name === "devant" ? grate(-0.9, 0.1, 2.05, 2.4) + grate(1.6, 2.4, 2.9, 3.3) : "",
    piece("paper", outline, walls + parts, "", 0.7),
    out,
    garlands(own, to),
  ].join("");
}

// ── The lights ──────────────────────────────────────────────

/** How far a lit lantern's halo reaches, by its size. */
export const GLOW = 1.7;
/** A lantern lit (canoe.js fades it in over the unlit one): its glass glowing and a paper halo round it, in a box of
 *  `size` × 2 GLOW units, its middle in its middle. */
export function lumiere(size) {
  const b = size * GLOW;
  return `<svg viewBox="${n(-b)} ${n(-b)} ${n(2 * b)} ${n(2 * b)}" width="${n(2 * b)}" height="${n(2 * b)}">${[
    [b, "#ffb444", 0.2],
    [b * 0.66, "#ffc455", 0.3],
    [b * 0.4, "#ffd779", 0.48],
  ]
    .map(([rad, fill, alpha]) => `<path d="${blob(Array.from({ length: 9 }, (_, k) => [Math.cos((k / 9) * Math.PI * 2) * rad * (0.94 + (k % 3) * 0.04), Math.sin((k / 9) * Math.PI * 2) * rad * (0.94 + ((k + 1) % 3) * 0.04)]))}" fill="${fill}" fill-opacity="${alpha}"/>`)
    .join("")}${path(glass(0, 0, size), "#ffd76a")}${path(glass(0, -size * 0.04, size * 0.6), "#fff4c9")}</svg>`;
}

/** The knight's lantern's halo (on his sticker, canoe.js), `r` units round: cut paper discs, deep gold out to pale. */
export function halo(r) {
  const rings = [
    [1, "#ffa832", 0.26],
    [0.72, "#ffbb48", 0.36],
    [0.46, "#ffd46e", 0.52],
    [0.24, "#fff0b8", 0.78],
  ];
  return `<svg viewBox="${-r} ${-r} ${2 * r} ${2 * r}" width="${2 * r}" height="${2 * r}">${rings
    .map(([k, fill, alpha], i) => `<path d="${blob(Array.from({ length: 10 }, (_, j) => [Math.cos((j / 10) * Math.PI * 2 + i) * r * k * (0.93 + ((j + i) % 3) * 0.05), Math.sin((j / 10) * Math.PI * 2 + i) * r * k * (0.93 + ((j * 2 + i) % 3) * 0.05)]))}" fill="${fill}" fill-opacity="${alpha}"/>`)
    .join("")}</svg>`;
}

const SPARKLE = "M0-10C1-3 3-1 10 0C3 1 1 3 0 10C-1 3-3 1-10 0C-3-1-1-3 0-10Z";

/** A paper sparkle, `size` units across: a gold four-pointed star with its shadow, its pale heart. */
export function etincelle(size) {
  const k = size / 20;
  return `<svg viewBox="-12 -12 24 24" width="${n(24 * k)}" height="${n(24 * k)}">${cutPiece({ silhouette: SPARKLE, markup: path(SPARKLE, "#ffd14f") + `<path d="${SPARKLE}" transform="scale(.45)" fill="#fff6d2"/>`, lift: 0.5 })}</svg>`;
}
