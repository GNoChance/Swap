// La Roque-Gageac by night (the canoe's spec, § 2, moment 9), after Kevin's photo: under the night sky of the bivouac
// (props-lac.js), the dark wooded hills upstream; the great cliff lit gold from below, its caves, the woods on its top,
// the village of houses at its foot with their warm windows and lamps; the river, navy, the lights' reflections on it
// (on sheets of their own, canoe.js makes them tremble); the gabare moored, its mast, its awning, its string of lights,
// its name on its hull; the quay of planks, its green railing, bollards and ropes, a lamp. Paper only. Pure: markup
// only, the same for the same arguments.
import { blob, curve, dot, edgeAt, lens, mirror, n, path, poly, random } from "./geom.js";
import { piece, roundTrees, row, sheetOf, slab, strata } from "./props.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
/** Where the river meets the village's embankment and the far bank. */
export const WATER = 470;
/** An ellipse round cx, cy (path data): a light flat on the ground. */
const ellipse = (cx, cy, rx, ry) => `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0`;
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ── The far hills ───────────────────────────────────────────

const HILLS = [[L, 352], [-480, 338], [-360, 350], [-240, 332], [-120, 344], [-20, 330], [60, 342], [130, 362], [190, 388], [250, 410]];
const BANK = [[L, 446], [-300, 442], [-100, 448], [100, 444], [250, 452]];
// the far bank's few lights, upstream: [x, y, size]
const FAR_LIGHTS = [[-430, 452, 1.4], [-330, 450, 1.1], [-150, 454, 1.6], [-60, 451, 1.2], [36, 455, 1.4], [112, 452, 1.1], [168, 456, 1.5]];

/** The hills upstream, dark against the night, their woods a little lighter on top, the far bank by the water with its
 *  few lights. */
export function collines() {
  const halos = FAR_LIGHTS.map(([x, y, s]) => dot(x, y, s * 3.6)).join("");
  const cores = FAR_LIGHTS.map(([x, y, s]) => dot(x, y, s)).join("");
  return [
    sheetOf("paper", HILLS, "#202b47", "", WATER + 10),
    roundTrees(row(HILLS, L, 240, 22, [8, 13], 6, 501), { tint: { crown: "#1c2740", lit: "#26334f", trunk: "#1c2740" }, smooth: false }),
    sheetOf("paper", BANK, "#171f36", "", WATER + 10),
    `<path d="${halos}" fill="#ffc35a" fill-opacity=".42"/>`,
    path(cores, "#fff0c4"),
  ].join("");
}

// ── The cliff and the village ───────────────────────────────

// the cliff's top edge from its foot on the left (by the village) to the layer's right edge
const CLIFF = [[212, WATER - 6], [218, 436], [219, 410], [227, 390], [228, 358], [236, 336], [237, 302], [246, 280], [248, 248], [259, 224], [262, 194], [275, 170], [290, 146], [308, 126], [336, 110], [380, 100], [440, 94], [520, 88], [620, 84], [740, 78], [860, 72], [R, 66]];
// its caves, the troglodytes' fort: [x, y, w, h]
const CAVES = [[292, 212, 44, 20], [350, 160, 30, 14], [330, 292, 30, 14], [262, 360, 22, 12], [420, 234, 56, 24], [484, 168, 34, 15], [520, 300, 40, 16], [580, 214, 30, 13], [640, 268, 52, 20], [700, 160, 36, 15], [760, 232, 44, 18], [830, 300, 36, 14], [870, 186, 40, 16], [940, 250, 46, 18], [400, 340, 24, 10], [600, 360, 30, 12]];

/** A house of the village at x, y (its foot), w wide and h tall, its stone lit by the lamps, its roof dark, its
 *  windows warm: { outline, walls, roofs, windows, lights } (lights: [x, y, w] of each window, for the reflections). */
function maison(x, y, w, h, r) {
  const roof = [[x - 1.5, y - h], [x + w * 0.5, y - h - w * 0.42], [x + w + 1.5, y - h]];
  const lights = [];
  let windows = "";
  for (let row = 0; row < Math.max(1, Math.floor(h / 15)); row++)
    for (let col = 0; col < Math.max(1, Math.floor(w / 11)); col++) {
      if (r() < 0.32) continue; // some windows dark
      const [wx, wy, ww, wh] = [x + 4 + col * 11 + r() * 2, y - h + 5 + row * 15, 4.6, 6.4];
      windows += poly([[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]]);
      lights.push([wx + ww / 2, wy + wh / 2, ww]);
    }
  return {
    outline: poly([[x, y], [x, y - h], ...roof, [x + w, y - h], [x + w, y]]),
    walls: poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]),
    shade: poly([[x + w * 0.68, y], [x + w * 0.68, y - h], [x + w, y - h], [x + w, y]]),
    roofs: poly(roof),
    windows,
    lights,
  };
}
// the village along the water and up the cliff's foot, the same each time
const VILLAGE = (() => {
  const r = random(511);
  const list = [];
  for (let x = 146; x < R; x += 24 + r() * 16) {
    const w = 24 + r() * 16;
    list.push(maison(x, WATER - 8, w, w * (1 + r() * 0.5), r));
    if (x > 236 && r() < 0.6) list.unshift(maison(x + 8, WATER - 36 - r() * 16, w * 0.85, w * 0.9, r)); // a second row up the slope, behind
  }
  return list;
})();
// the lamps along the embankment: [x]
const LAMPS = [176, 262, 348, 452, 560, 676, 790, 900];

/** The cliff over the village, lit gold from below (paler at its foot, darker up high): its limestone strata, its
 *  caves (dark, lit on their lips, one walled in), the woods on its top black against the night; at its foot the
 *  village, its embankment and its lamps. */
export function falaise() {
  const face = [...CLIFF, [R, WATER + 4], [CLIFF[0][0], WATER + 4]];
  const r = random(521);
  const { bands, lit, overhangs, streaks, tufts } = strata({ edge: CLIFF, x0: 230, x1: R, y0: 110, foot: WATER - 10, r });
  const holes = CAVES.map(([x, y, w, h]) => blob([[x, y], [x + w * 0.3, y - h * 0.5], [x + w * 0.7, y - h * 0.55], [x + w, y], [x + w * 0.6, y + h * 0.45], [x + w * 0.2, y + h * 0.4]])).join("");
  const depths = CAVES.map(([x, y, w, h]) => blob([[x + w * 0.18, y + h * 0.1], [x + w * 0.4, y - h * 0.32], [x + w * 0.75, y - h * 0.3], [x + w * 0.84, y + h * 0.15], [x + w * 0.5, y + h * 0.3]])).join("");
  const lips = CAVES.map(([x, y, w, h]) => lens(x + w * 0.1, y + h * 0.5, w * 0.8, 1.6)).join("");
  const [fx, fy, fw] = CAVES[2]; // a wall of the fort in the big cave, its window lit
  const fort = poly([[fx + 6, fy + 10], [fx + 8, fy - 6], [fx + fw - 10, fy - 7], [fx + fw - 6, fy + 10]]);
  const fortWindow = poly([[fx + 18, fy - 1], [fx + 23, fy - 1], [fx + 23, fy + 5], [fx + 18, fy + 5]]);
  // the light from below, in paper strips with waving edges: paler down to the foot, darker up high
  const edge = (y, seed) => {
    const w = random(seed);
    return curve(Array.from({ length: 11 }, (_, k) => [200 + k * 80, y + (w() - 0.5) * 30]));
  };
  const below = (y, seed) => `${edge(y, seed)}L${R} ${WATER + 10}L200 ${WATER + 10}Z`;
  const above = (y, seed) => `${edge(y, seed)}L${R} 0L200 0Z`;
  const glow = `<clipPath id="st-roque-face"><path d="${poly(face)}"/></clipPath><g clip-path="url(#st-roque-face)">${[
    [above(212, 561), "#7d6851"],
    [above(150, 562), "#5c4e41"],
    [below(318, 563), "#c9a465"],
    [below(392, 564), "#e0bc7b"],
  ]
    .map(([d, fill]) => path(d, fill))
    .join("")}</g>`;
  const top = CLIFF.slice(4);
  const woods = [];
  for (let x = 236; x < R; x += 13 + r() * 9) woods.push([x, edgeAt(top, x) + 6 + r() * 4, 10 + r() * 7]);
  const canopy = [...top.map(([x, y]) => [x, y + 8]), ...[...top].reverse().map(([x, y]) => [x, y - 18 - (x % 7)])];

  const outline = VILLAGE.map((h) => h.outline).join("");
  const lamps = LAMPS.map((x) => poly([[x - 1, WATER - 8], [x - 1, WATER - 34], [x + 1, WATER - 34], [x + 1, WATER - 8]])).join("");
  const lampHalos = LAMPS.map((x) => dot(x, WATER - 36, 14)).join("");
  const lampGlows = LAMPS.map((x) => dot(x, WATER - 36, 7)).join("");
  const lampCores = LAMPS.map((x) => dot(x, WATER - 36, 2.6)).join("");
  return [
    piece("paper", poly(face), path(poly(face), "#a08052") + glow + path(bands, "#8c6f48") + path(lit, "#e9cb8c") + path(overhangs, "#5c4a38") + path(streaks, "#7a6247") + path(tufts, "#2f3c29"), "", 0.8),
    path(holes, "#3a2d24") + path(depths, "#211a16") + path(lips, "#f0d597") + path(fort, "#b39360") + path(fortWindow, "#ffd27a"),
    piece("paper", poly(canopy), path(poly(canopy), "#18231f"), "", 0.6),
    roundTrees(woods, { tint: { crown: "#1b2622", lit: "#26352c", trunk: "#1b2622" }, smooth: false }),
    // the embankment along the water, lit
    slab("paper", [[140, WATER - 8], [R, WATER - 9], [R, WATER + 3], [140, WATER + 3]], "#8d7656", 0.5),
    piece("paper", outline, path(VILLAGE.map((h) => h.walls).join(""), "#a7835a") + path(VILLAGE.map((h) => h.shade).join(""), "#715a43") + path(VILLAGE.map((h) => h.roofs).join(""), "#2e292b") + path(VILLAGE.map((h) => h.windows).join(""), "#ffcf6b"), "", 0.6),
    path(lamps, "#2a2420"),
    `<path d="${lampHalos}" fill="#ffb347" fill-opacity=".26"/><path d="${lampGlows}" fill="#ffd27a" fill-opacity=".5"/>`,
    path(lampCores, "#fff2c8"),
  ].join("");
}

// ── The river ───────────────────────────────────────────────

// the gabare's hull (its gunwale, its water line), its mast, its string of lights under its awning
const HULL = { x0: -112, x1: 236, gunwale: 506, water: 542 };
const MAST = { x: 150, top: 232 };
const BULBS = Array.from({ length: 12 }, (_, k) => [-86 + k * 25, 478 + (k % 2) * 2]);

/** The river by night: navy, a little lighter nearer, the cliff's gold reflection dimmed and broken under the village,
 *  the hills' dark one, the gabare's black one under its hull, ripples catching the sky. */
export function eau() {
  const r = random(531);
  const band = (y0, y1) => poly([[L, y0], [R, y0], [R, y1], [L, y1]]);
  const cliff = poly([...mirror(CLIFF, WATER, 0.42), [R, WATER], [CLIFF[0][0], WATER]]);
  const hills = poly([...mirror(HILLS, WATER, 0.5), [250, WATER], [L, WATER]]);
  const { x0, x1, water } = HULL;
  const gabare = poly([[x0 + 6, water], [x1 - 22, water], [x1 - 30, water + 26], [x0 + 14, water + 30]]);
  const ripples = Array.from({ length: 60 }, () => lens(L + r() * 1600, WATER + 6 + r() ** 1.2 * 170, 12 + r() * 50, 0.8 + r())).join("");
  const breaks = Array.from({ length: 30 }, () => lens(220 + r() * 770, WATER + 6 + r() * 80, 20 + r() * 50, 1.2)).join("");
  return sheetOf(
    "paper",
    [[L, WATER], [0, WATER + 1], [400, WATER - 1], [R, WATER]],
    "#17213d",
    [path(band(WATER + 60, 800), "#1b2747"), path(band(WATER + 130, 800), "#1f2c50"), path(cliff, "#4a3f3a"), path(hills, "#121a2f"), path(gabare, "#0f1629"), path(breaks, "#1b2747"), path(ripples, "#2d3d68")].join(""),
    800,
  );
}

/** Every light over the water (each house's lit windows together, the village's lamps, the far bank's, the gabare's
 *  bulbs): [x, y, w]. */
const LIGHTS = [...VILLAGE.filter((h) => h.lights.length).map(({ lights }) => [lights.reduce((sum, [x]) => sum + x, 0) / lights.length, Math.max(...lights.map(([, y]) => y)), 4 + lights.length * 2]), ...LAMPS.map((x) => [x, WATER - 36, 5]), ...FAR_LIGHTS.map(([x, y, s]) => [x, y, s * 3]), ...BULBS.map(([x, y]) => [x, y, 4])];

/** The lights' reflections on the river, version k (0 or 1: canoe.js fades one into the other, they tremble): under
 *  each light a column of short warm dashes, longer for a higher light, the gabare's under its hull. */
export function reflets(k) {
  const r = random(541 + k * 17);
  let warm = "";
  let pale = "";
  for (const [x, y, w] of LIGHTS) {
    const foot = y > 470 ? HULL.water + 2 : WATER + 2; // the gabare's lights under its hull
    const reach = Math.min(150, (foot - y) * 0.9 + 18);
    for (let d = 2 + r() * 4; d < reach; d += 3.5 + r() * 5) {
      const ww = w * (0.6 + r() * 0.9) * (1 + d / 90);
      const [dx, dy] = [x - ww / 2 + (r() - 0.5) * 3, foot + d];
      const dash = poly([[dx, dy], [dx + ww / 2, dy - 0.9], [dx + ww, dy], [dx + ww / 2, dy + 0.8]]); // a short glint
      if (r() < 0.3) pale += dash;
      else warm += dash;
    }
  }
  return path(warm, "#ffc95f") + path(pale, "#fff0b8");
}

// ── The gabare ──────────────────────────────────────────────

/** The gabare moored along the quay (its name `name` on its black hull): its bow raised on the right, the wooden
 *  bulwark and its balusters, the awning on its poles with its string of lights, the mast and its rigging (its
 *  reflection is the river's: eau()). */
export function gabare(name) {
  const { x0, x1, gunwale, water } = HULL;
  const hull = [[x0, gunwale + 2], [x1 - 16, gunwale], [x1 - 4, gunwale - 10], [x1 + 4, gunwale - 14], [x1 - 6, water - 14], [x1 - 22, water], [x0 + 6, water]];
  const strake = poly([[x0, gunwale + 2], [x1 - 16, gunwale], [x1 - 4, gunwale - 10], [x1 + 4, gunwale - 14], [x1 + 2, gunwale - 8], [x1 - 14, gunwale + 6], [x0, gunwale + 8]]);
  // the bulwark's balusters and its rail
  let balusters = "";
  for (let x = x0 + 4; x < x1 - 30; x += 7) balusters += poly([[x, gunwale + 1], [x, gunwale - 16], [x + 2.2, gunwale - 16], [x + 2.2, gunwale + 1]]);
  const rail = poly([[x0, gunwale - 15], [x1 - 26, gunwale - 17], [x1 - 26, gunwale - 13], [x0, gunwale - 11]]);
  // the awning: its poles, its canvas gently arched, its scalloped edge
  const poles = [-96, -20, 60, 128, 196].map((x) => poly([[x, gunwale - 14], [x, 470], [x + 2, 470], [x + 2, gunwale - 14]])).join("");
  const arch = (y, k) => Array.from({ length: 9 }, (_, i) => [-104 + i * 38, y - Math.sin((i / 8) * Math.PI) * k]);
  const canvas = poly([...arch(458, 5), ...arch(472, 3).reverse()]);
  const under = poly([...arch(468, 3), ...arch(474, 2).reverse()]);
  let scallops = "";
  for (let x = -104; x < 200; x += 9.5) scallops += `M${n(x)} ${n(473)}a4.75 4 0 0 0 9.5 0Z`;
  const bulbs = BULBS.map(([x, y]) => dot(x, y, 1.8)).join("");
  const bulbHalos = BULBS.map(([x, y]) => dot(x, y, 6)).join("");
  // the mast, tapering, and its rigging down to the bow and the stern
  const mast = poly([[MAST.x - 3, gunwale - 14], [MAST.x - 1.6, MAST.top], [MAST.x + 1.6, MAST.top], [MAST.x + 3, gunwale - 14]]);
  const mastLit = poly([[MAST.x - 3, gunwale - 14], [MAST.x - 1.6, MAST.top], [MAST.x - 0.4, MAST.top], [MAST.x - 0.8, gunwale - 14]]);
  const rigging = [[x1 + 2, gunwale - 14], [x0 + 4, gunwale - 2], [MAST.x + 70, gunwale - 16], [MAST.x - 90, gunwale - 16]].map(([x, y]) => `M${MAST.x} ${MAST.top + 4}L${n(x)} ${n(y)}`).join("");
  return [
    `<path d="${rigging}" fill="none" stroke="#3a312c" stroke-width=".9"/>`,
    piece("paper", mast, path(mast, "#6f5236") + path(mastLit, "#9a7650") + path(dot(MAST.x, MAST.top, 2.6), "#5a422c"), "", 0.6),
    piece("paper", poles + canvas + rail + balusters, path(poles + balusters, "#5a3e2a") + path(rail, "#7d5739") + path(under, "#b5a68a") + path(canvas, "#ece2cc") + path(scallops, "#ddd0b4"), "", 0.7),
    `<path d="${bulbHalos}" fill="#ffb347" fill-opacity=".38"/>`,
    path(bulbs, "#fff0c0"),
    piece("paper", poly(hull), path(poly(hull), "#1d1a1e") + path(strake, "#7a5537") + path(lens(x0 + 10, gunwale + 14, 220, 0.9), "#3a3438"), "", 0.8),
    `<text class="st-sign st-sign--gabare" x="${n(x0 + 186)}" y="${n(water - 13)}" text-anchor="middle">${escape(name)}</text>`,
  ].join("");
}

// ── The quay ────────────────────────────────────────────────

// the quay's edge along the water, slightly askew (as in the photo, it goes away on the left)
const EDGE = [[L, 616], [-300, 612], [0, 607], [200, 604], [500, 600], [R, 596]];
const POSTS = Array.from({ length: 36 }, (_, k) => L + 20 + k * 46);
const BOLLARDS = [44, 318];

/** The quay of planks, nearer at the bottom: its edge along the water, its planks wider nearer, a lamp's light on
 *  them; its green bollards and the gabare's ropes; its green railing, posts and two rails sagging between them; a
 *  lamp on its post on the right. */
export function quai() {
  const edge = (x) => edgeAt(EDGE, x);
  const r = random(551);
  let planks = "";
  let joints = "";
  let y = 0;
  for (let k = 0, h = 6; y < 800; k++, h *= 1.24) {
    y = 606 + (6 * (1.24 ** k - 1)) / 0.24;
    const line = (dy) => EDGE.map(([x, ey]) => [x, ey + y - 606 + dy]);
    if (k % 2) planks += poly([...line(0), ...line(h).reverse()]);
    for (let x = L + r() * 200; x < R; x += 120 + r() * 220) joints += poly([[x, edge(x) + y - 606], [x + 1.2, edge(x) + y - 606], [x + 1.2 + h * 0.3, edge(x) + y - 606 + h], [x + h * 0.3, edge(x) + y - 606 + h]]);
  }
  const glowAt = [356, 702];
  const bollards = BOLLARDS.map((x) => {
    const foot = edge(x) + 8;
    return { body: poly([[x - 7, foot], [x - 6, foot - 16], [x + 6, foot - 16], [x + 7, foot]]), cap: dot(x, foot - 17, 8.5), lit: lens(x - 6, foot - 19, 9, 1.4) };
  });
  const ropes = [[[44, 606], [10, 590], [-40, 560], [-70, 540]], [[318, 600], [290, 584], [256, 556], [232, 532]]].map((list) => curve(list)).join("");
  // the railing: a post every 46 units on the edge, its two rails sagging between
  const posts = POSTS.map((x) => {
    const foot = edge(x) - 2;
    return poly([[x - 1.8, foot], [x - 1.8, foot - 50], [x + 1.8, foot - 50], [x + 1.8, foot]]);
  }).join("");
  const caps = POSTS.map((x) => dot(x, edge(x) - 53, 3)).join("");
  const rails = [18, 44]
    .map((up) =>
      POSTS.slice(1)
        .map((x, k) => {
          const [a, b] = [POSTS[k], x];
          const [ya, yb] = [edge(a) - 2 - up, edge(b) - 2 - up];
          return `M${n(a)} ${n(ya)}Q${n((a + b) / 2)} ${n((ya + yb) / 2 + 5)} ${n(b)} ${n(yb)}`;
        })
        .join(""),
    )
    .join("");
  // the lamp on the quay, right of them, its light on the planks
  const [lx, ly] = [360, 452];
  const lampPost = poly([[lx - 2.4, 700], [lx - 1.6, ly + 14], [lx + 1.6, ly + 14], [lx + 2.4, 700]]) + poly([[lx - 7, 700], [lx - 5, 690], [lx + 5, 690], [lx + 7, 700]]);
  const lantern = poly([[lx - 7, ly - 4], [lx, ly - 13], [lx + 7, ly - 4]]) + poly([[lx - 5.5, ly - 4], [lx + 5.5, ly - 4], [lx + 4.5, ly + 12], [lx - 4.5, ly + 12]]);
  return [
    sheetOf("paper", EDGE, "#766b5b", path(planks, "#837665") + path(joints, "#5a5145") + `<path d="${ellipse(glowAt[0], glowAt[1], 120, 40)}" fill="#e8a94e" fill-opacity=".2"/><path d="${ellipse(glowAt[0], glowAt[1], 64, 20)}" fill="#f5c26a" fill-opacity=".22"/>`, 800),
    `<path d="${ropes}" fill="none" stroke="#c9b892" stroke-width="2"/>`,
    piece("paper", bollards.map((b) => b.body + b.cap).join(""), path(bollards.map((b) => b.body).join(""), "#3f7458") + path(bollards.map((b) => b.cap).join(""), "#4f8a6a") + path(bollards.map((b) => b.lit).join(""), "#7fb595"), "", 0.6),
    `<path d="${rails}" fill="none" stroke="#2c4a3a" stroke-opacity=".5" stroke-width="3.4" transform="translate(0 2)"/><path d="${rails}" fill="none" stroke="#69a383" stroke-width="2.6"/>`,
    piece("paper", posts + caps, path(posts, "#5d9576") + path(caps, "#7cb594"), "", 0.6),
    piece("paper", lampPost + lantern, path(lampPost, "#2a2523") + path(lantern, "#2a2523") + path(poly([[lx - 4, ly - 2], [lx + 4, ly - 2], [lx + 3.2, ly + 10], [lx - 3.2, ly + 10]]), "#ffd877"), "", 0.6),
    `<path d="${dot(lx, ly + 4, 34)}" fill="#ffb347" fill-opacity=".24"/><path d="${dot(lx, ly + 4, 17)}" fill="#ffd27a" fill-opacity=".42"/>`,
  ].join("");
}
