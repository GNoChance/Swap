// The island's pieces (the Île de Ré's spec, § 2 and § 4): the crossing from the bridge to Ars, by bike on a summer day
// (paper only, its layers wider than 1600 units: the decor glides by): the far island low on the horizon, a sliver of
// the sea over it; the fields behind the cycle path, then below it, as they go by: the vines in rows, the salt marshes
// and their salt heaps, the white houses with green shutters and their hollyhocks, a low garden wall, the church of Ars
// and its black and white steeple; the cycle path itself; the wooden km signs counting down to the lighthouse. Then the
// Phare des Baleines on the island's west tip, by day: its tall grey stone tower, octagonal and tapering, its corbelled
// gallery, its black lantern and dome; the keepers' white houses at its foot, their green shutters; the land of the tip,
// its scrub and its pines; the reef in the sea before it (its sea is the bridge's: props-pont.js); the dune in front, its
// marram grass and its chestnut fence. Each of these takes its skin, "paper" or "poster" (props.js): the lighthouse is
// the poster's scene, its layers 1600 units wide (x −605 to 995). Pure: markup only, the same for the same arguments.
import { AFFICHE as A, cutPiece } from "./decor.js";
import { blob, curve, dot, edgeAt, lens, n, path, poly, random, speck, topEdge, tuft } from "./geom.js";
import { paper, piece, roundTrees, sheetOf } from "./props.js";
import { edges } from "./props-pont.js";
import { panneau } from "./props-riviere.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** The lighthouse's foot (the middle of its plinth on the ground), and the stage units it spans. */
export const PHARE = { x: 282, y: 604 };

// ── The crossing: the island going by ───────────────────────

/** The cycle path across the island (y): the top of the grass behind it (it hides the km signs' feet), its far edge,
 *  where the two of them ride on it, its near edge. */
export const PISTE = { verge: 482, far: 492, ride: 500, near: 512 };
const FIELD = 452; // the fields' far edge, behind the path
const FIELDS = 556; // and the fields' near one, below the path's grass
const GRASS = { grass: "#86ab58", fields: "#a3bf74", tuft: "#6f9446", flowers: ["#fbf6ee", "#f2cf5b"] }; // the bridge's land's
const TILES = { roof: "#c8734f", roofLit: "#d98c66" }; // the island's round tiles (the rental's roof: props-pont.js)
const ROSES = ["#ec8fac", "#d0507a", "#f8f1ea", "#9f3456"]; // the hollyhocks: pink, deep pink, white, wine

/** A row of vines seen from the side from x0 to x1, its foot at y, `h` tall (paper): its leaves along the wires, the
 *  light on their top, a stake now and then; up close (20 units tall or more), its gnarled stocks under them and bunches
 *  of grapes. Scattered by `r`. */
function rang(x0, x1, y, h, r) {
  const close = h >= 20;
  // its leaves' outline through points evenly along it, a far row's further apart (as bumpy to the eye, far lighter to
  // draw); the light on their top and the shade under them between its ends
  const runs = Math.max(1, Math.round((x1 - x0) / Math.max(h * 0.5, 14)));
  const top = Array.from({ length: runs + 1 }, (_, k) => [x0 + ((x1 - x0) * k) / runs, y - h * (0.82 + r() * 0.18)]);
  const base = y - h * 0.34;
  const under = top.map(([x]) => [x, base + h * (r() - 0.3) * 0.12]).reverse(); // the leaves hanging under the wires
  const leaves = `${curve(top)}${curve(under).replace(/^M/, "L")}Z`;
  let lit = "";
  let shade = "";
  for (const [x, ty] of top.slice(1, -1)) if (r() < 0.5) lit += lens(x - h * 0.2, ty + h * 0.13, h * 0.5, h * 0.05);
  for (const [x, by] of under.slice(1, -1)) if (r() < 0.6) shade += lens(x - h * 0.3, by - h * 0.07, h * 0.6, h * 0.04);
  let stocks = "";
  let grapes = "";
  for (let x = x0 + h * 0.3; close && x < x1 - h * 0.2; x += h * (0.8 + r() * 0.3)) {
    stocks += poly([[x - h * 0.05, y], [x + h * 0.05, y], [x + h * 0.03, base], [x + h * 0.06, base - h * 0.04], [x - h * 0.04, base]]);
    if (r() < 0.45) for (const [dx, dy] of [[0.1, 0.03], [0.18, 0.03], [0.14, 0.1]]) grapes += dot(x + h * dx, base + h * dy, h * 0.05);
  }
  let stakes = "";
  for (let x = x0 + h * 0.6; x < x1; x += h * 3.4) stakes += poly([[x - h * 0.025, y], [x + h * 0.025, y], [x + h * 0.025, y - h * 1.06], [x - h * 0.025, y - h * 1.06]]);
  return [
    piece("paper", stakes, path(stakes, "#8d7a5e"), "", 0.3),
    cutPiece({ silhouette: leaves + stocks + grapes, markup: path(stocks, "#6b5038") + path(leaves, "#5d8a3a") + path(shade, "#4c7631") + path(lit, "#7fa856") + path(grapes, "#6a4a6e"), edge: curve(top.map(([x, ty]) => [x, ty + 0.65])), lift: Math.min(1, h / 40) }),
  ].join("");
}

/** Salt marshes seen from the side from x0 to x1 (paper): basins of still water down to `bottom`, the sky's glints on
 *  them (`k`: their size), and their clay dykes topped with grass (`dykes`: [y, thickness], far to near), the salt heaps
 *  piled on them, white cones their right side in shade, bigger on a nearer dyke; scattered by `r`. */
function salines(x0, x1, dykes, bottom, k, r) {
  const y0 = dykes[0][0];
  const water = poly([[x0 + 6 * k, y0], [x1 - 6 * k, y0], [x1, bottom], [x0, bottom]]);
  let glints = "";
  for (let i = 0; i < (x1 - x0) / (40 * k); i++) glints += lens(x0 + r() * (x1 - x0 - 30 * k), y0 + r() * (bottom - y0), (10 + r() * 30) * k, 0.9 * k);
  let banks = "";
  let tops = "";
  let heaps = "";
  let shades = "";
  for (const [y, t] of dykes) {
    banks += poly([[x0, y], [x1, y], [x1, y + t], [x0, y + t]]);
    tops += poly([[x0, y], [x1, y], [x1, y + t * 0.3], [x0, y + t * 0.3]]);
    for (let x = x0 + r() * 5 * t; x < x1 - 4 * t; x += t * (6 + r() * 9))
      for (let j = 0, count = 1 + Math.floor(r() * 3); j < count; j++) {
        const w = t * (2.2 + r() * 1.3);
        const [hx, foot, h] = [x + j * w * 0.85, y + t * 0.55, w * (0.5 + r() * 0.12)];
        heaps += `${curve([[hx, foot], [hx + w * 0.28, foot - h * 0.82], [hx + w * 0.5, foot - h], [hx + w * 0.72, foot - h * 0.82], [hx + w, foot]])}Z`;
        shades += poly([[hx + w * 0.5, foot - h], [hx + w * 0.7, foot - h * 0.84], [hx + w, foot], [hx + w * 0.56, foot]]);
      }
  }
  return [
    piece("paper", water, path(water, "#c3dce7") + path(glints, "#e9f3f7"), "", 0.3),
    piece("paper", banks, path(banks, "#b0a283") + path(tops, "#9cb46a"), "", 0.5),
    piece("paper", heaps, path(heaps, "#f9f7f1") + path(shades, "#dedad0"), "", 0.6),
  ].join("");
}

/** Hollyhocks (paper): a clump at each [x, y (its foot), h (its height)], two or three tall stems their blossoms up them
 *  (a colour of ROSES each clump: open lower down, buds at the top), big leaves at their feet; scattered by `r`. */
function roses(list, r) {
  let stems = "";
  let leaves = "";
  let hearts = "";
  const blooms = ROSES.map(() => "");
  for (const [x, y, h] of list) {
    const tint = Math.floor(r() * ROSES.length);
    const count = 2 + Math.floor(r() * 2);
    for (let s = 0; s < count; s++) {
      const sx = x + (s - (count - 1) / 2) * h * 0.11 + (r() - 0.5) * h * 0.04;
      const top = y - h * (0.72 + r() * 0.28);
      const w = Math.max(0.4, h * 0.012);
      stems += poly([[sx - w, y], [sx + w, y], [sx + w * 0.5, top], [sx - w * 0.5, top]]);
      const size = h * 0.045;
      for (let b = 0; b < 7; b++) {
        const [bx, by, rb] = [sx + (b % 2 ? 1 : -1) * size * 0.55, top + size + b * (y - top) * 0.075, size * (0.7 + b * 0.06)];
        blooms[tint] += dot(bx, by, rb);
        hearts += dot(bx, by, rb * 0.28);
      }
    }
    for (let j = -1; j <= 1; j++) {
      const lx = x + j * h * 0.1;
      leaves += blob([[lx - h * 0.08, y], [lx - h * 0.06, y - h * 0.1], [lx, y - h * 0.15], [lx + h * 0.07, y - h * 0.09], [lx + h * 0.08, y]]);
    }
  }
  const markup = path(stems, "#5e7f3c") + path(leaves, GRASS.tuft) + blooms.map((d, k) => path(d, ROSES[k])).join("") + path(hearts, "#f2dc8a");
  return piece("paper", stems + leaves + blooms.join(""), markup, "", 0.5);
}

// the church of Ars: its tower's half width (its cornice's), and how far right of its middle its nave reaches
const TOWER = 22;
const NAVE = 116;

/** The church of Ars (paper), its tower's middle at x, its foot at y: its square white tower at its west end, the
 *  louvres of its belfry, its cornice; its tall octagonal spire, white below and black above (a seamark), a cross on
 *  top; its long white nave on the right under its round tiles, its buttresses and its arched windows. */
function eglise(x, y) {
  const nave = poly([[x + 18, y], [x + 18, y - 42], [x + NAVE, y - 42], [x + NAVE, y]]);
  const naveRoof = [[x + 18, y - 41], [x + NAVE + 4, y - 41], [x + NAVE - 14, y - 64], [x + 18, y - 64]];
  const buttresses = [42, 70, 98].map((dx) => poly([[x + dx, y], [x + dx, y - 34], [x + dx + 3, y - 38], [x + dx + 6, y - 34], [x + dx + 6, y]])).join("");
  const windows = [27, 55, 83].map((dx) => `M${x + dx} ${y - 12}V${y - 28}a3.5 3.5 0 0 1 7 0V${y - 12}Z`).join("");
  const [foot, top] = [y, y - 120]; // the tower
  const faces = [[-19, -6, "#f6f2e9"], [-6, 8, "#e6e0d3"], [8, 19, "#cfc7b6"]];
  const tower = faces.map(([a, b, fill]) => path(poly([[x + a, foot], [x + b, foot], [x + b, top], [x + a, top]]), fill)).join("");
  let courses = "";
  for (let yy = foot - 12; yy > top + 8; yy -= 12) courses += poly([[x - 19, yy], [x + 19, yy], [x + 19, yy + 0.7], [x - 19, yy + 0.7]]);
  const louvres = [-11, 3].map((dx) => `M${x + dx} ${top + 32}V${top + 14}a4 4 0 0 1 8 0V${top + 32}Z`).join("");
  let slats = "";
  for (const dx of [-11, 3]) for (let yy = top + 17; yy < top + 31; yy += 3) slats += poly([[x + dx + 1, yy], [x + dx + 7, yy], [x + dx + 7, yy + 0.8], [x + dx + 1, yy + 0.8]]);
  const cornice = poly([[x - TOWER, top], [x + TOWER, top], [x + TOWER, top + 4], [x - TOWER, top + 4]]);
  // the spire: three faces seen of its eight, meeting at its tip; white up to `band`, black above it
  const [tip, half, band] = [top - 98, 17, top - 46];
  const at = (yy) => (half * (yy - tip)) / (top - tip); // its half width at yy
  const spire = (from, to, tones) =>
    [[-1, -0.38], [-0.38, 0.38], [0.38, 1]].map(([a, b], k) => path(poly([[x + a * at(from), from], [x + b * at(from), from], [x + b * at(to), to], [x + a * at(to), to]]), tones[k])).join("");
  const cross = poly([[x - 0.9, tip], [x + 0.9, tip], [x + 0.9, tip - 13], [x - 0.9, tip - 13]]) + poly([[x - 4.5, tip - 9.5], [x + 4.5, tip - 9.5], [x + 4.5, tip - 7.8], [x - 4.5, tip - 7.8]]);
  const outline = poly([[x - 19, foot], [x - 19, top + 4], [x - TOWER, top + 4], [x - TOWER, top], [x - half, top], [x, tip], [x + half, top], [x + TOWER, top], [x + TOWER, top + 4], [x + 19, top + 4], [x + 19, foot]]);
  return [
    piece("paper", nave + poly(naveRoof), path(nave, "#f2ede3") + path(buttresses, "#ddd6c8") + path(windows, "#4a4640") + path(poly(naveRoof), TILES.roof), topEdge(naveRoof), 0.8),
    `<g class="st-clocher">${piece("paper", outline + cross, tower + path(courses, "#ddd6c8") + path(louvres, "#4a4640") + path(slats, "#8d867a") + path(cornice, "#d8d1c2") + spire(top, band, ["#f7f3ea", "#e5dfd2", "#c9c1b0"]) + spire(band, tip, ["#4a4d55", "#34373e", "#24262b"]) + path(cross, "#30353d"), "", 1)}</g>`,
  ].join("");
}

/** A low white garden wall from x0 to x1 (paper), its foot at y, `h` tall: its rough stones, its coping of round
 *  tiles, a gap with a green wooden gate now and then; scattered by `r`. */
function muret(x0, x1, y, h, r) {
  let walls = "";
  let copings = "";
  let gates = "";
  let slats = "";
  let stones = "";
  for (let x = x0; x < x1; ) {
    const end = Math.min(x1, x + 180 + r() * 220);
    walls += poly([[x, y], [x, y - h], [end, y - h], [end, y]]);
    copings += poly([[x - 2, y - h + 1], [end + 2, y - h + 1], [end + 1, y - h - 5], [x - 1, y - h - 5]]);
    for (let k = 0; k < (end - x) / 22; k++) stones += lens(x + r() * (end - x - 24), y - h + 6 + r() * (h - 10), 12 + r() * 12, 1.4);
    if (end < x1) {
      gates += poly([[end + 5, y], [end + 5, y - h * 0.86], [end + 29, y - h * 0.86], [end + 29, y]]);
      for (let gx = end + 9; gx < end + 29; gx += 5) slats += poly([[gx, y - 2], [gx + 1, y - 2], [gx + 1, y - h * 0.84], [gx, y - h * 0.84]]);
    }
    x = end + 34;
  }
  return piece("paper", walls + copings + gates, path(walls, "#f2ede3") + path(stones, "#e4ddcf") + path(copings, TILES.roof) + path(gates, "#4f7d55") + path(slats, "#3f6a46"), "", 0.7);
}

/** The far island (paper), across a layer `width` units wide: a sliver of the sea on the horizon, the land low and flat,
 *  pale with the distance, its hedges and clumps of trees, white houses here and there. */
export function loin(width) {
  const [l, r] = edges(width);
  const rand = random(461);
  const top = [];
  for (let x = l; x < r + 40; x += 40) top.push([x, 440 + (rand() - 0.5) * 3]);
  let clumps = "";
  for (let x = l + rand() * 60; x < r; x += 40 + rand() * 110) {
    const [w, h, y] = [16 + rand() * 46, 4 + rand() * 6, edgeAt(top, x) + 1.5];
    clumps += blob([[x, y], [x + w * 0.1, y - h * 0.7], [x + w * 0.35, y - h], [x + w * 0.7, y - h * 0.8], [x + w * 0.95, y - h * 0.4], [x + w, y]]);
  }
  let walls = "";
  let roofs = "";
  for (let x = l + 60 + rand() * 120; x < r; x += 120 + rand() * 220)
    for (let k = 0, count = 1 + Math.floor(rand() * 3); k < count; k++) {
      const [hx, w, y] = [x + k * 10, 6 + rand() * 5, edgeAt(top, x) + 1];
      walls += poly([[hx, y], [hx, y - 3.8], [hx + w, y - 3.8], [hx + w, y]]);
      roofs += poly([[hx - 0.6, y - 3.8], [hx + w + 0.6, y - 3.8], [hx + w - 1.5, y - 5.8], [hx + 1.5, y - 5.8]]);
    }
  let glints = "";
  for (let i = 0; i < width / 60; i++) glints += lens(l + rand() * width, 431 + rand() * 7, 8 + rand() * 20, 0.5);
  return [
    `<rect x="${l}" y="428" width="${width}" height="40" fill="#a7c9de"/>${path(glints, "#d5e7f1")}`,
    sheetOf("paper", top, "#b8c9a2", "", 520),
    piece("paper", clumps, path(clumps, "#9db48c"), "", 0.25),
    piece("paper", walls + roofs, path(walls, "#eef0ea") + path(roofs, "#cfa58e"), "", 0.2),
  ].join("");
}

/** The fields behind the cycle path (paper), across a layer `width` units wide, as they go by from left to right: the
 *  vines in rows until x `marais`, the salt marshes until `maisons`, then the white houses with their green shutters
 *  and their hollyhocks, then the church of Ars, its tower's middle at `eglise`, and more houses past it. */
export function champs(width, { marais, maisons, eglise: church }) {
  const [l, r] = edges(width);
  const rand = random(471);
  const edge = [];
  for (let x = l; x < r + 60; x += 60) edge.push([x, FIELD + (rand() - 0.5) * 2]);
  const soil = poly([[l, FIELD + 1], [marais - 14, FIELD + 1], [marais - 6, 800], [l, 800]]);
  // the houses in a row from the marshes' end up to the church's tower, and on past its nave
  const houses = [];
  for (let x = maisons + 10; x < r; x += 8 + rand() * 30) {
    const w = 44 + rand() * 52;
    if (x + w > church - TOWER - 6 && x < church + NAVE + 8) x = church + NAVE + 8 - w; // no room before the church: on past it
    else houses.push([x, w, 34 + rand() * 8]);
    x += w;
  }
  const hollyhocks = houses.flatMap(([x, w]) => (rand() < 0.75 ? [[x + 12 + rand() * (w - 24), 486, 30 + rand() * 12]] : []));
  return [
    sheetOf("paper", edge, GRASS.fields, path(soil, "#d6c9a3"), 800),
    ...[[461, 6], [471, 8], [483, 10]].map(([y, h]) => rang(l, marais - 18, y, h, rand)),
    salines(marais, maisons, [[455, 2.2], [463, 2.6], [472, 3.2]], 490, 0.25, rand),
    ...houses.map(([x, w, h]) => `<g class="st-maison">${maison("paper", x, 486, w, h, TILES)}</g>`),
    eglise(church, 486),
    roses(hollyhocks, rand),
  ].join("");
}

/** The cycle path across the island (paper), across a layer `width` units wide: the grass behind it, the path of pale
 *  sand, the grass in front with its tufts and flowers; below it, as they go by: the vines in rows until x `marais`,
 *  the salt marshes and their salt heaps until `maisons`, then a low white garden wall, hollyhocks along it. */
export function piste(width, { marais, maisons }) {
  const [l, r] = edges(width);
  const rand = random(481);
  const top = [];
  for (let x = l; x < r + 50; x += 50) top.push([x, PISTE.verge + (rand() - 0.5) * 3]);
  const lane = poly([[l, PISTE.far], [r, PISTE.far], [r, PISTE.near], [l, PISTE.near]]);
  let gravel = "";
  for (let i = 0; i < width / 14; i++) gravel += speck(l + rand() * width, PISTE.far + 3 + rand() * 16, 0.5 + rand() * 0.6);
  let tufts = "";
  const flowers = ["", ""];
  for (let k = 0; k < width / 8; k++) {
    const x = l + rand() * width;
    const y = k % 3 ? PISTE.near + 5 + rand() ** 0.8 * (FIELDS - PISTE.near - 2) : PISTE.verge + 4 + rand() * 6; // in front, or behind
    if (k % 4) tufts += tuft(x, y, 2 + ((y - PISTE.verge) / 74) * 3);
    else flowers[k % 8 ? 0 : 1] += speck(x, y, 1.1 + ((y - PISTE.verge) / 74) * 0.8);
  }
  const soil = poly([[l, FIELDS], [marais - 24, FIELDS], [marais - 10, 800], [l, 800]]);
  const hollyhocks = [];
  for (let x = maisons + 30 + rand() * 40; x < r; x += 60 + rand() * 90) hollyhocks.push([x, 630 + rand() * 30, 96 + rand() * 18]);
  return [
    sheetOf("paper", top, GRASS.grass, "", 800),
    piece("paper", lane, path(lane, "#e2d8c1") + path(gravel, "#c9bea6") + path(poly([[l, PISTE.far], [r, PISTE.far], [r, PISTE.far + 1.4], [l, PISTE.far + 1.4]]), "#cdc2a9"), "", 0.4),
    path(tufts, GRASS.tuft) + path(flowers[0], GRASS.flowers[0]) + path(flowers[1], GRASS.flowers[1]),
    piece("paper", soil, path(soil, "#d9cca7"), "", 0.4),
    rang(l, marais - 40, 612, 48, rand),
    rang(l, marais - 40, 726, 86, rand),
    salines(marais, maisons, [[FIELDS, 12], [622, 16], [704, 22]], 800, 1, rand),
    muret(maisons, r, 604, 40, rand),
    roses(hollyhocks, rand),
  ].join("");
}

/** The grass in front of the two of them (paper), sparse across a layer `width` units wide: tall tufts along the
 *  bottom, and from x `maisons` on, big hollyhocks. */
export function devant(width, { maisons }) {
  const [l, r] = edges(width);
  const rand = random(491);
  let tufts = "";
  for (let x = l + rand() * 80; x < r; x += 70 + rand() * 130)
    for (let k = 0; k < 3; k++) tufts += tuft(x + k * 9 + rand() * 6, 774 + rand() * 12, 14 + rand() * 10);
  const hollyhocks = [];
  for (let x = maisons + 60 + rand() * 100; x < r; x += 180 + rand() * 220) hollyhocks.push([x, 800, 150 + rand() * 40]);
  return piece("paper", tufts, path(tufts, "#5f8a3c"), "", 0.6) + roses(hollyhocks, rand);
}

/** A wooden km sign's box (units, at its natural size): its plank's width, and its post's height to its plank's top. */
export const BORNE = { width: 124, height: 177 };

/** A wooden km sign by the cycle path (an <svg>, its post's foot at its bottom middle; `k` its size): the canoe's
 *  signpost (props-riviere.js, panneau()) on a post tall enough for its plank to show over the two of them's heads, its
 *  arrow pointing on to the lighthouse, `text` on it. */
export const borne = (text, k = 1) =>
  `<svg viewBox="${-BORNE.width / 2} ${-BORNE.height} ${BORNE.width} ${BORNE.height}" width="${n(BORNE.width * k)}" height="${n(BORNE.height * k)}">${panneau(0, 0, text, BORNE.height - 2)}</svg>`;

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
 *  cornice and gallery with its railing, the lantern (its glazing in a black frame) and its dome, the finial; all in a
 *  group of class st-phare. */
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
  return `<g class="st-phare">${piece(skin, outline, markup, `M${x - 29.4} 221.6H${x + 29.4}`, 1.2)}</g>`;
}

/** A low white house of the island at x (its left end), its foot at y, `w` wide: its walls, its roof of tiles seen from
 *  the long side (paper: slate grey, or `tint`'s; poster: orange), its windows with green shutters, its door. */
function maison(skin, x, y, w, h = 46, tint = {}) {
  const p = paper(skin);
  const c = p ? { wall: "#f4f1ea", shade: "#dcd7cc", roof: "#8a8f96", roofLit: "#a3a8ae", window: "#4a4640", shutter: "#4f7d55", ...tint } : { wall: A.cream, shade: "#ead6ae", roof: A.orange, roofLit: "#f19c66", window: A.navy, shutter: A.green };
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

