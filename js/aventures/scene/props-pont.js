// The bridge's pieces (the Île de Ré's spec, § 2, moments 2, 3 and 7, and § 4): the open sea on a summer day (bands
// deeper blue nearer, ripples and whitecaps, the sun's glints; golden in the evening; the lighthouse's sea too, so it
// takes its skin, "paper" or "poster": props.js), the far coast low on the horizon, Ré's bridge seen from the side (its
// deck rising to its hump over the shipping channel, its slender piers in the water with their reflections, its lamp
// posts and its rail; on the way back, flat and never ending), the land at both its ends (La Pallice's foot with the
// bike rental, Ré's end), the sailboats, the gulls and the snail of the way back. The bridge's layers are wider than
// 1600 units: the camera follows the two of them over it, and its decor glides by on the way back. Pure: markup only,
// the same for the same arguments.
import { AFFICHE as A, cutPiece } from "./decor.js";
import { blob, curve, dot, lens, n, path, poly, random, speck, topEdge, tuft, xy } from "./geom.js";
import { paper, rock, roundTrees, sheetOf } from "./props.js";
import { escape, WATER_LINE } from "./props-riviere.js";

/** Where the sea meets the sky (props-riviere.js: its sky). */
export const HORIZON = WATER_LINE;
/** A layer `width` units wide, centred on the stage: its left and right x (the island's too: props-ile.js). */
export const edges = (width) => [-(width - 390) / 2, (width + 390) / 2];

// ── The sea ─────────────────────────────────────────────────

/** The sea at sunset (paper, mer()'s `tint`), mirroring the golden sky: its far band a bright peach-gold, lighter than
 *  the sky's lowest band, the water under it golden, the near water a dusky blue; its ripples deep gold, its crests
 *  golden, the sun's glints all but white. */
export const SOIR = { far: "#fcd9a0", mid: "#f2c28c", near: "#8fa3cc", dark: "#7186b8", ripple: "#efa960", cap: "#ffe2a8", glint: "#fffbf0" };

/** The open sea from the horizon down, `width` units wide: bands deeper blue nearer, ripples and whitecaps bigger
 *  nearer, the glints of the sun (high on the left, x −30: the sky's) under it; on paper, `tint`'s colours over its own
 *  (SOIR: the evening's). */
export function mer(skin, width = 1600, tint = {}) {
  const p = paper(skin);
  const c = p
    ? { far: "#93bfdb", mid: "#84b5d5", near: "#73a9cb", ripple: "#dcedf5", dark: "#5f94bb", cap: "#fbfdff", glint: "#fff6da", ...tint }
    : { far: "#5aa3a7", mid: A.teal, near: "#28707a", ripple: A.cream, dark: A.navy, cap: A.cream, glint: A.sun };
  const [l, r] = edges(width);
  const band = (y0, y1) => poly([[l, y0], [r, y0], [r, y1], [l, y1]]);
  const rand = random(401);
  const count = Math.round(width / 14);
  let ripples = "";
  let dark = "";
  let caps = "";
  for (let i = 0; i < count; i++) {
    const f = rand() ** 1.5; // 0 on the horizon, 1 at the bottom: nearer, bigger
    ripples += lens(l + rand() * width, HORIZON + 5 + f * 330, 8 + f * 56, 0.5 + f * 1.4);
  }
  for (let i = 0; i < count / 2; i++) {
    const f = rand();
    dark += lens(l + rand() * width, HORIZON + 24 + f * 310, 12 + f * 46, 0.7 + f * 1.2);
  }
  for (let i = 0; i < count / 5; i++) {
    const f = 0.25 + rand() * 0.75;
    const [x, y, w] = [l + rand() * width, HORIZON + 20 + f * 300, 5 + f * 16];
    caps += blob([[x, y], [x + w * 0.4, y - 1.2 - f * 1.6], [x + w, y], [x + w * 0.5, y - 0.4]]); // a crest breaking white
  }
  const glints = Array.from({ length: 14 }, () => lens(-120 + rand() * 180, HORIZON + 6 + rand() ** 1.5 * 150, 8 + rand() * 28, 1.1)).join("");
  return sheetOf(skin, [[l, HORIZON], [r, HORIZON]], c.far, [path(band(HORIZON + 46, HORIZON + 140), c.mid), path(band(HORIZON + 140, 800), c.near), path(dark, c.dark), path(ripples, c.ripple), path(caps, c.cap), path(glints, c.glint)].join(""), 800);
}

/** The far coast low on the horizon (paper only), pale with the distance: Oléron's long low line and its woods on the
 *  right, Aix, and on the left La Pallice's port, its silos and cranes. */
export function large() {
  const r = random(411);
  const island = [];
  for (let x = -40; x <= 900; x += 30) island.push([x, HORIZON - 2 - r() * 4 - Math.sin(((x + 40) / 940) * Math.PI) * 5]);
  const land = `${curve(island)}L900 ${HORIZON + 2}L-40 ${HORIZON + 2}Z`;
  let woods = "";
  for (let x = 20; x < 860; x += 14 + r() * 26) woods += blob([[x, HORIZON - 4], [x + 3, HORIZON - 9 - r() * 4], [x + 9, HORIZON - 10 - r() * 3], [x + 13, HORIZON - 4]]);
  const aix = blob([[-150, HORIZON + 1], [-140, HORIZON - 4], [-122, HORIZON - 5], [-112, HORIZON + 1]]);
  // the port: its quay, silos (rounded tops), sheds and two cranes, their jibs over the water
  const quay = poly([[-560, HORIZON + 2], [-560, HORIZON - 5], [-250, HORIZON - 4], [-240, HORIZON + 2]]);
  const silos = [-520, -508, -496, -484].map((x) => `M${x} ${HORIZON - 4}V${HORIZON - 24}a6 3 0 0 1 12 0V${HORIZON - 4}Z`).join("");
  const sheds = poly([[-460, HORIZON - 4], [-460, HORIZON - 13], [-400, HORIZON - 16], [-400, HORIZON - 4]]) + poly([[-380, HORIZON - 4], [-380, HORIZON - 11], [-330, HORIZON - 11], [-330, HORIZON - 4]]);
  const crane = (x, h, reach) => `M${x} ${HORIZON - 4}V${HORIZON - h}M${x - 6} ${HORIZON - h + 6}L${x + reach} ${HORIZON - h + 2}M${x} ${HORIZON - h}L${x + reach * 0.6} ${HORIZON - h + 3}M${x + reach * 0.8} ${HORIZON - h + 2}V${HORIZON - h + 12}`;
  return [
    cutPiece({ silhouette: land, markup: path(land, "#a9c1d0") + path(woods, "#98b3c3") + path(aix, "#a9c1d0"), lift: 0.3 }),
    cutPiece({ silhouette: quay + silos + sheds, markup: path(quay, "#a3b8c7") + path(silos, "#b3c6d3") + path(sheds, "#a7bccb"), lift: 0.3 }),
    `<path d="${crane(-300, 40, 34)}${crane(-270, 34, 28)}" fill="none" stroke="#9fb4c3" stroke-width="1.6" stroke-linecap="round"/>`,
  ].join("");
}

// ── The bridge ──────────────────────────────────────────────

/** Ré's bridge: its road on the deck at `base` (y), rising `rise` to its hump at x `hump` over `half` units each way
 *  (the ramp starting on the land); over the water from its abutment on La Pallice's land at x `from` to Ré's at `to`;
 *  its deck `thick` units thick; its piers standing in the water at `foot` (y), `span` apart, the channel's span wider. */
export const DECK = { hump: 560, half: 350, rise: 44, base: 500, thick: 18, foot: 604, span: 72, channel: 120, from: 300, to: 820 };

/** The y of the road at x (stage units), on the bridge and on the land at its ends: flat far off, rising smoothly to the
 *  hump. */
export function deck(x) {
  const u = (x - DECK.hump) / DECK.half;
  return DECK.base - (Math.abs(u) < 1 ? (DECK.rise * (1 + Math.cos(Math.PI * u))) / 2 : 0);
}

/** The x of its piers in the water: either side of the channel, then a span apart, clear of the land's banks. */
function piers() {
  const list = [];
  for (let off = DECK.channel / 2; DECK.hump - off > DECK.from + 40 && DECK.hump + off < DECK.to - 40; off += DECK.span) list.push(DECK.hump - off, DECK.hump + off);
  return list.sort((a, b) => a - b);
}

/** The bridge drawn in a layer `width` units wide: the crossing, from La Pallice's abutment to Ré's over its hump (its
 *  girder's ends tucked under the land: rives()); or `endless`, its road flat and its piers a span apart all across
 *  the layer, no land at either end (the way back: Kevin was so slow that it never ends). → { road: its y at x (deck()
 *  on the crossing), girder: its girder's ends, ends: its parapet's and rail's, piers: their x } */
function stretch(width, endless) {
  if (!endless) return { road: deck, girder: [DECK.from - 20, DECK.to + 20], ends: [DECK.from, DECK.to], piers: piers() };
  const [l, r] = edges(width);
  return { road: () => DECK.base, girder: [l, r], ends: [l, r], piers: Array.from({ length: Math.floor(width / DECK.span) }, (_, k) => l + DECK.span * (k + 0.5)) };
}

/** A line along the deck, `dy` under its road (`road`, its y at x), every 8 units from x0 to x1. */
function deckLine(road, dy, [x0, x1]) {
  return Array.from({ length: Math.ceil((x1 - x0) / 8) + 1 }, (_, k) => Math.min(x1, x0 + k * 8)).map((x) => [x, road(x) + dy]);
}

/** The bridge seen from the side (paper only), in a layer `width` units wide (`endless`: stretch()): its slender piers
 *  on their footings in the water, each with its cap under the deck (each pier in a group of class st-pile), its broken
 *  reflection and a lamp post on the deck over it; the deck, a pale girder (curving up to the hump on the crossing), its
 *  fascia shaded and its underside dark; the far parapet along the road. The two of them ride on the road (deck() on
 *  the crossing); the near rail goes in front of them (rail()). */
export function pont(width, { endless = false } = {}) {
  const bridge = stretch(width, endless);
  const r = random(421);
  let pillars = "";
  let reflections = "";
  let foam = "";
  let lamps = "";
  for (const x of bridge.piers) {
    const top = bridge.road(x) + DECK.thick;
    const column = poly([[x - 6, top], [x + 6, top], [x + 7.5, DECK.foot], [x - 7.5, DECK.foot]]);
    const lit = poly([[x - 6, top], [x - 2, top], [x - 2.4, DECK.foot], [x - 7.5, DECK.foot]]);
    const cap = poly([[x - 12, top - 1], [x + 12, top - 1], [x + 9, top + 6], [x - 9, top + 6]]);
    const footing = poly([[x - 11, DECK.foot - 10], [x + 11, DECK.foot - 10], [x + 12, DECK.foot + 3], [x - 12, DECK.foot + 3]]);
    pillars += `<g class="st-pile">${cutPiece({ silhouette: column + footing, markup: path(column, "#d6d0c3") + path(lit, "#e8e3d8") + path(footing, "#aba393"), lift: 0.8 })}${path(cap, "#c4bdae")}</g>`;
    foam += lens(x - 16, DECK.foot + 2, 32, 1.2);
    for (let y = DECK.foot + 7; y < DECK.foot + 52; y += 7 + r() * 4) reflections += lens(x - 6 + (r() - 0.5) * 5, y, 12 + r() * 4, 1.1);
    const y = bridge.road(x) - 5;
    lamps += poly([[x - 0.9, y], [x - 0.9, y - 46], [x + 0.9, y - 46], [x + 0.9, y]]) + poly([[x, y - 46], [x + 12, y - 48], [x + 12, y - 46], [x, y - 44]]) + poly([[x + 9, y - 47], [x + 16, y - 47], [x + 15, y - 44], [x + 10, y - 44]]);
  }
  const line = (dy, along = bridge.girder) => deckLine(bridge.road, dy, along);
  const girder = poly([...line(0), ...line(DECK.thick).reverse()]);
  const fascia = poly([...line(DECK.thick * 0.5), ...line(DECK.thick).reverse()]);
  const underside = poly([...line(DECK.thick - 2.5), ...line(DECK.thick).reverse()]);
  const parapet = poly([...line(-5, bridge.ends), ...line(0, bridge.ends).reverse()]); // from abutment to abutment
  return [
    path(reflections, "#5f94bb") + path(foam, "#eef6fa"),
    pillars,
    cutPiece({ silhouette: girder + parapet, markup: path(girder, "#ebe7dd") + path(fascia, "#d5cfc2") + path(underside, "#aea696") + path(parapet, "#dcd7cb"), edge: curve(line(-4.4, bridge.ends)), lift: 1.4 }),
    cutPiece({ silhouette: lamps, markup: path(lamps, "#6f6c68"), lift: 0.5 }),
  ].join("");
}

/** The near rail along the road over the water (paper only), in a layer `width` units wide (`endless`: stretch()), in
 *  front of the two of them's wheels: a thin bar on its posts. */
export function rail(width, { endless = false } = {}) {
  const { road, ends } = stretch(width, endless);
  const top = deckLine(road, -7, ends);
  let posts = "";
  for (const [x, y] of top.filter((_, k) => k % 2 === 0)) posts += poly([[x - 0.6, y], [x + 0.6, y], [x + 0.6, y + 7], [x - 0.6, y + 7]]);
  const bar = poly([...top, ...deckLine(road, -5.6, ends).reverse()]);
  return cutPiece({ silhouette: bar + posts, markup: path(posts, "#bdb6a8") + path(bar, "#f4f1ea"), lift: 0.4 });
}

// ── Its ends: the land at La Pallice with the bike rental, the land on Ré ──

/** The land at an end of the bridge (paper), from the layer's edge `far` to its abutment at `at`, the water on its
 *  `water` side (1: on its right, at La Pallice; −1: on its left, on Ré): a strip of grass under the road (the road its
 *  top edge, a pale strip of cycle path along it, the ramp rising on it), its bank of rocks going down into the water
 *  under the bridge, and its near shore a sandy beach, the sea in front of it; foam along the water's edge; tufts,
 *  flowers and bushes in the grass. → { behind: the land going away behind the road (paler, its coast turning back
 *  before the bridge) and a few trees on it; land } */
function rive(far, at, water, r) {
  const away = (from, step, count) => Array.from({ length: count }, (_, k) => at - water * (from + k * step + r() * 60)).filter((x) => (x - far) * water > 30);
  // its coast behind the road: straight from the layer's edge, then curving down to the road through points about as far
  // apart (a smooth line through unevenly spaced points would loop)
  const turn = [[at - water * 210, 477], [at - water * 140, 479], [at - water * 75, 486], [at - water * 30, deck(at - water * 30) + 1]];
  const hinter = `M${far} 476L${curve(turn).slice(1)}`;
  const back = `${hinter}L${n(turn.at(-1)[0])} 512L${far} 512Z`;
  const top = [];
  for (let x = far; (at - x) * water > 0; x += water * 10) top.push([x, deck(x)]);
  top.push([at, deck(at)]);
  const bank = [[at + water * 12, deck(at) + 26], [at + water * 30, 578], [at + water * 44, DECK.foot + 2]];
  // the near shore, from the bank's foot back along the land to its far edge, a little wavy
  const shore = [];
  for (let k = 0; (at + water * (30 - k * 90) - far) * water > 0; k++) shore.push([at + water * (30 - k * 90), 628 + 24 * (1 - Math.exp(-k / 2)) + 5 * Math.sin(k * 1.7)]);
  shore.push([far, shore.at(-1)[1]]);
  const outline = [...top, ...bank, ...shore];
  const strip = poly([...top, ...[...top].reverse().map(([x, y]) => [x, y + 3.5])]);
  const beach = poly([...shore, ...[...shore].reverse().map(([x, y], k) => [x, y - (k === shore.length - 1 ? 0 : 13)])]);
  let tufts = "";
  let streaks = "";
  const flowers = ["", ""];
  for (let k = 0; k < 150; k++) {
    const x = far + water * r() * Math.abs(at - far);
    const y = deck(x) + 8 + r() ** 0.8 * 115;
    const w = 40 + r() * 70;
    const from = water > 0 ? Math.min(x, at - 20 - w) : Math.max(x - w, at + 20); // a streak's start: all of it on the land
    if (k % 5 === 0) streaks += lens(from, y, w, 1.6 + r() * 1.6);
    else if (k % 3) tufts += tuft(x, y, 2.4 + ((y - 500) / 130) * 2.6);
    else flowers[k % 2] += speck(x, y, 1.3 + ((y - 500) / 130) * 0.9);
  }
  // the riprap: rocks along the bank, half in the water, and where it meets the beach
  const rocks = [...bank, [at + water * 34, 618], [at + water * 22, 626]].flatMap(([x, y], k, all) => (k ? [[(x + all[k - 1][0]) / 2, (y + all[k - 1][1]) / 2], [x, y]] : [[x, y]]));
  const foam = `<path d="${curve([...bank.slice(1), ...shore].map(([x, y]) => [x + water * 2, y + 1.5]))}" fill="none" stroke="#f4fbff" stroke-width="2" stroke-dasharray="22 8 10 6" stroke-linecap="round"/>`;
  const bushes = away(260, 170, 7).map((x) => [x, 560 + r() * 50, 13 + r() * 8]);
  return {
    behind: cutPiece({ silhouette: back, markup: path(back, "#a3bf74"), edge: hinter, lift: 0.5 }) + roundTrees(away(330, 140, 9).map((x) => [x, 488, 14 + r() * 8])),
    land: [
      cutPiece({ silhouette: poly(outline), markup: path(poly(outline), "#86ab58") + path(streaks, "#93b766") + path(beach, "#e8dcbc") + path(strip, "#d9d1bf") + path(tufts, "#6f9446") + path(flowers[0], "#fbf6ee") + path(flowers[1], "#f2cf5b"), edge: curve(top), lift: 0.8 }),
      ...rocks.map(([x, y], k) => rock(x - 12 + water * 3, y + 4, 20 + (k % 3) * 5, "paper")),
      foam,
      roundTrees(bushes),
    ].join(""),
  };
}

/** A rental bike parked side on, facing right, its rear wheel on the ground at x, y, its frame `frame` (paper). */
function velo(x, y, frame) {
  const w = 9.5; // its wheels' radius
  const [rear, front, crank, seat, head] = [[x, y - w], [x + 30, y - w], [x + 13, y - w + 1], [x + 9, y - 29], [x + 25, y - 29]];
  const line = (...list) => `M${list.map(xy).join("L")}`;
  const ring = ([cx, cy]) => `M${n(cx - w)} ${n(cy)}a${w} ${w} 0 1 0 ${2 * w} 0a${w} ${w} 0 1 0 ${-2 * w} 0`;
  const wheels = ring(rear) + ring(front);
  const tubes = line(rear, crank, seat, rear) + line(seat, head) + line(crank, [head[0] + 1, head[1] + 5]) + line(head, front);
  const bits = line([seat[0] - 4, seat[1] - 2], [seat[0] + 4, seat[1] - 2]) + line(head, [head[0] - 1, head[1] - 5], [head[0] + 4, head[1] - 6]);
  const stroke = (d, colour, width) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return cutPiece({ silhouette: wheels + tubes + bits, stroke: 2.2, lift: 0.4, markup: stroke(wheels, "#3a3a3f", 2.2) + stroke(tubes, frame, 2.2) + stroke(bits, "#3a3a3f", 2) });
}

// the bike rental behind the road at the bridge's foot: its cabin from x0 to x1, its base `foot` under the land's top
// edge, its eaves and its ridge, its sign on the roof (its board's top and bottom); its bikes parked in front of it:
// [x, frame]
const CABIN = { x0: 30, x1: 142, foot: 506, eave: 440, ridge: 421, sign: { y0: 394, y1: 415 } };
const PARKED = [[40, "#2f8f9d"], [62, "#e3b23c"], [84, "#d0573f"]];

/** The bike rental (paper), behind the road: a white wooden cabin, its planks, its green door and shuttered window, its
 *  tiled roof; on the roof its sign, a cream board on two posts with `text` in ink (css/intros.css, st-sign; the board
 *  and its words in a group of class st-enseigne); three rental bikes parked in a row in front of it. */
function rental(text) {
  const { x0, x1, foot, eave, ridge, sign } = CABIN;
  const walls = poly([[x0, foot], [x0, eave], [x1, eave], [x1, foot]]);
  let planks = "";
  for (let y = eave + 6; y < foot; y += 6) planks += `M${x0} ${y}H${x1}`;
  const roof = [[x0 - 7, eave + 1], [x0 + 5, ridge], [x1 - 5, ridge], [x1 + 7, eave + 1]];
  let tiles = "";
  for (let x = x0 - 2; x < x1 + 4; x += 6) tiles += `M${x} ${eave}L${x + 2.6} ${ridge + 1}`;
  const door = poly([[52, foot], [52, 458], [74, 458], [74, foot]]);
  const panes = poly([[57, 463], [69, 463], [69, 474], [57, 474]]) + poly([[102, 452], [122, 452], [122, 472], [102, 472]]);
  const shutters = poly([[94, 451], [102, 451], [102, 473], [94, 473]]) + poly([[122, 451], [130, 451], [130, 473], [122, 473]]);
  const board = poly([[x0 + 2, sign.y1], [x0 + 2, sign.y0], [x1 - 2, sign.y0], [x1 - 2, sign.y1]]);
  const posts = poly([[50, ridge + 1], [50, sign.y1], [53, sign.y1], [53, ridge + 1]]) + poly([[119, ridge + 1], [119, sign.y1], [122, sign.y1], [122, ridge + 1]]);
  return [
    cutPiece({ silhouette: walls, markup: path(walls, "#f4efe4") + `<path d="${planks}" stroke="#e0d9cb" stroke-width=".8"/>` + path(door + shutters, "#4f7f5a") + path(panes, "#9fb6c8"), lift: 0.8 }),
    cutPiece({ silhouette: poly(roof), markup: path(poly(roof), "#c8734f") + `<path d="${tiles}" stroke="#b05f3f" stroke-width=".9"/>`, edge: topEdge(roof), lift: 0.7 }),
    cutPiece({ silhouette: posts, markup: path(posts, "#6b4b2e"), lift: 0.4 }),
    `<g class="st-enseigne">${cutPiece({ silhouette: board, markup: `<path d="${board}" fill="#fbf6ea" stroke="#3b2a18" stroke-width="1.2" stroke-linejoin="round"/>`, lift: 0.6 })}<text class="st-sign" x="${(x0 + x1) / 2}" y="${sign.y1 - 6.5}" text-anchor="middle">${escape(text)}</text></g>`,
    ...PARKED.map(([x, frame]) => velo(x, foot - 2, frame)),
  ].join("");
}

/** The land at both ends of the bridge, across a layer `width` units wide (paper only): La Pallice's on the left with
 *  the bike rental behind its road (its sign saying `sign`), Ré's on the right; the trees and the rental behind the
 *  roads, under the land's edge. Each end's pieces in groups of class st-rive. */
export function rives(width, sign) {
  const [l, r] = edges(width);
  const rand = random(441);
  const ends = [rive(l, DECK.from, 1, rand), rive(r, DECK.to, -1, rand)];
  const bank = (markup) => `<g class="st-rive">${markup}</g>`;
  return ends.map((end) => bank(end.behind)).join("") + rental(sign) + ends.map((end) => bank(end.land)).join("");
}

// ── The sailboats and the gulls ─────────────────────────────

/** A sailboat facing left, `height` units from its waterline to its masthead (an <svg>, its waterline's middle at its
 *  bottom middle): its hull (`hull`, a white stripe), the mainsail and the jib (paper: lit and shaded), its mast and
 *  its red pennant, foam at its bow. */
export function voilier(height, hull = "#2c4a6e") {
  const k = height / 100;
  const markup = [
    cutPiece({
      silhouette: "M-31-11L27-11L23 0L-19 0Z M4-97L4-15L29-15Z M2-88L-27-14L2-14Z",
      markup: [
        path("M-31-11L27-11L23 0L-19 0Z", hull),
        path("M-29.5-8L26-8L25.2-6L-27.5-6Z", "#fbf6ec"),
        path("M4-97L4-15L29-15Z", "#fffdf7"),
        path("M4-97L4-15L12-15Z", "#e4e6e8"),
        path("M2-88L-27-14L2-14Z", "#f6f2ea"),
        path("M3.2-99L4.8-99L4.8-11L3.2-11Z", "#4a4a4f"),
        path("M4.8-99L13-96.5L4.8-94Z", "#d24a3a"),
      ].join(""),
      lift: 0.6,
    }),
    path(lens(-36, -1, 14, 1.4) + lens(20, 0, 12, 1.1), "#f4f9fb"),
  ].join("");
  return `<svg viewBox="-40 -102 80 104" width="${n(80 * k)}" height="${n(104 * k)}"><g>${markup}</g></svg>`;
}

/** A gull gliding, `width` units across its wings (an <svg>, its body in its middle): white wings arched up in an « M »,
 *  grey on top, black tips, a white body and a yellow beak. */
export function mouette(width) {
  const wing = "M0 1C-4-2-9-6-14-5C-17-4.4-19-3-20-2C-15-3-10-2-6 1C-4 2-2 2.4 0 2.6Z";
  const back = "M-6 0C-9-3.4-12-4.8-14-4.8C-11-3.6-8.6-2-6.4 0.6Z";
  const tip = "M-14-5C-17-4.4-19-3-20-2C-18.4-2.6-17-2.8-15.4-2.8Z";
  /** A shape and its mirror (the other wing). */
  const pair = (d) => `<path d="${d}"/><path d="${d}" transform="scale(-1 1)"/>`;
  return `<svg viewBox="-21 -8 42 13" width="${n(width)}" height="${n((width * 13) / 42)}"><g transform="translate(.8 1.6)" fill="#3b2a18" fill-opacity=".14">${pair(wing)}</g><g fill="#fdfdfb" stroke="#9aa4ad" stroke-width=".5" stroke-linejoin="round">${pair(wing)}</g><g fill="#c3cad0">${pair(back)}</g><g fill="#2e3035">${pair(tip)}</g><path d="M-4 1.8C-2 .4 2.4.2 4.6 1.4C3 2.8-1.6 3.2-4 1.8Z" fill="#fdfdfb" stroke="#9aa4ad" stroke-width=".4"/><path d="M4.4 1.2L6.6 1.6L4.6 2Z" fill="#f2b632"/></svg>`;
}

// ── The snail of the way back ───────────────────────────────

/** A paper snail crawling left on the deck, `width` units long (an <svg>, its foot's middle at its bottom middle): its
 *  soft body stretched out, its two stalks and their eyes up in front, its shell a caramel spiral lit on top, a silvery
 *  trail behind it. */
export function escargot(width) {
  const k = width / 44;
  const [cx, cy, rs] = [1.5, -11.6, 9.4]; // its shell's middle and radius
  const body = "M-21 0C-21.6-4.2-19.4-8.6-15.6-9C-12.6-9.3-10.8-7.2-10-4.6C-3-3.8 5-3.4 12-2.6C16-2.2 19.4-1.2 21 0Z";
  const stalks = "M-17.4-8.6Q-18.8-12.4-20.4-16.4M-14.4-8.9Q-14.8-13-15.6-17.2";
  const eyes = dot(-20.5, -16.8, 1.5) + dot(-15.7, -17.5, 1.5);
  const shell = dot(cx, cy, rs);
  const lit = blob([[cx - 7.4, cy - 2.6], [cx - 4.4, cy - 7.4], [cx + 1.6, cy - 8.8], [cx - 1.8, cy - 6.4], [cx - 5.4, cy - 2]]);
  // its spiral, winding out from the shell's middle
  const turns = Array.from({ length: 22 }, (_, i) => [cx + (1 + (i / 21) * (rs - 2.6)) * Math.cos(2.2 + (i / 21) * 2.6 * Math.PI), cy + (1 + (i / 21) * (rs - 2.6)) * Math.sin(2.2 + (i / 21) * 2.6 * Math.PI)]);
  const markup = [
    path(lens(13, 0.2, 9, 0.7), "#f2f5f6"),
    cutPiece({ silhouette: stalks, stroke: 1.4, lift: 0.3, markup: `<path d="${stalks}" fill="none" stroke="#a8977a" stroke-width="1.4" stroke-linecap="round"/>` }),
    path(eyes, "#3b2a18"),
    cutPiece({ silhouette: body + shell, markup: path(body, "#d6c7a8") + path(lens(-19, -0.9, 36, 0.8), "#a8977a") + path(shell, "#c27a3a") + path(lit, "#e0a463") + `<path d="${curve(turns)}" fill="none" stroke="#6f4220" stroke-width="1.4" stroke-linecap="round"/>`, lift: 0.4 }),
  ].join("");
  return `<svg viewBox="-22 -22 44 23" width="${n(44 * k)}" height="${n(23 * k)}"><g>${markup}</g></svg>`;
}
