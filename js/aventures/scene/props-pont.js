// The bridge's pieces (the Île de Ré's spec, § 2, moment 2, and § 4): the open sea on a summer day (bands deeper blue
// nearer, ripples and whitecaps, the sun's glints; the lighthouse's sea too, so it takes its skin, "paper" or "poster":
// props.js), the far coast low on the horizon, Ré's long bridge seen from the side (its deck rising to its hump over
// the shipping channel, its many slender piers in the water with their reflections, its lamp posts and its rail), the
// sailboats and the gulls. The bridge's layers are wider than 1600 units: the camera follows the C3 over it. Pure:
// markup only, the same for the same arguments.
import { AFFICHE as A, cutPiece } from "./decor.js";
import { blob, curve, lens, n, path, poly, random } from "./geom.js";
import { paper, sheetOf } from "./props.js";
import { WATER_LINE } from "./props-riviere.js";

/** Where the sea meets the sky (props-riviere.js: its sky). */
export const HORIZON = WATER_LINE;
/** A layer `width` units wide, centred on the stage: its left and right x. */
const edges = (width) => [-(width - 390) / 2, (width + 390) / 2];

// ── The sea ─────────────────────────────────────────────────

/** The open sea from the horizon down, `width` units wide: bands deeper blue nearer, ripples and whitecaps bigger
 *  nearer, the glints of the sun (high on the left, x −30: the sky's) under it. */
export function mer(skin, width = 1600) {
  const p = paper(skin);
  const c = p
    ? { far: "#93bfdb", mid: "#84b5d5", near: "#73a9cb", ripple: "#dcedf5", dark: "#5f94bb", cap: "#fbfdff", glint: "#fff6da" }
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

/** Ré's bridge: its road on the deck at `base` (y), rising `rise` to its hump at x `hump` over `half` units each way;
 *  its deck `thick` units thick; its piers standing in the water at `foot` (y), `span` apart, the channel's span wider. */
export const DECK = { hump: 350, half: 520, rise: 60, base: 500, thick: 18, foot: 604, span: 94, channel: 150 };

/** The y of the road on the deck at x (stage units): flat far off, rising smoothly to the hump. */
export function deck(x) {
  const u = (x - DECK.hump) / DECK.half;
  return DECK.base - (Math.abs(u) < 1 ? (DECK.rise * (1 + Math.cos(Math.PI * u))) / 2 : 0);
}

/** The x of its piers in a layer `width` units wide: either side of the channel, then a span apart. */
function piers(width) {
  const [l, r] = edges(width);
  const list = [];
  for (let off = DECK.channel / 2; DECK.hump - off > l - 20 || DECK.hump + off < r + 20; off += DECK.span) list.push(DECK.hump - off, DECK.hump + off);
  return list.filter((x) => x > l - 20 && x < r + 20).sort((a, b) => a - b);
}

/** A line along the deck, `dy` under its road, every 8 units across the layer. */
function deckLine(width, dy) {
  const [l, r] = edges(width);
  return Array.from({ length: Math.ceil((r - l) / 8) + 1 }, (_, k) => [l + k * 8, deck(l + k * 8) + dy]);
}

/** The bridge across a layer `width` units wide, seen from the side (paper only): its slender piers on their footings
 *  in the water, each with its cap under the deck and its broken reflection; the deck, a pale girder curving up to the
 *  hump, its fascia shaded and its underside dark; the far parapet along the road, the lamp posts every other pier. The
 *  C3 drives on the road (deck()); the near rail goes in front of it (rail()). */
export function pont(width) {
  const xs = piers(width);
  const r = random(421);
  let columns = "";
  let lit = "";
  let caps = "";
  let footings = "";
  let reflections = "";
  let foam = "";
  for (const x of xs) {
    const top = deck(x) + DECK.thick;
    columns += poly([[x - 6, top], [x + 6, top], [x + 7.5, DECK.foot], [x - 7.5, DECK.foot]]);
    lit += poly([[x - 6, top], [x - 2, top], [x - 2.4, DECK.foot], [x - 7.5, DECK.foot]]);
    caps += poly([[x - 12, top - 1], [x + 12, top - 1], [x + 9, top + 6], [x - 9, top + 6]]);
    footings += poly([[x - 11, DECK.foot - 10], [x + 11, DECK.foot - 10], [x + 12, DECK.foot + 3], [x - 12, DECK.foot + 3]]);
    foam += lens(x - 16, DECK.foot + 2, 32, 1.2);
    for (let y = DECK.foot + 7; y < DECK.foot + 52; y += 7 + r() * 4) reflections += lens(x - 6 + (r() - 0.5) * 5, y, 12 + r() * 4, 1.1);
  }
  const road = deckLine(width, 0);
  const girder = poly([...road, ...deckLine(width, DECK.thick).reverse()]);
  const fascia = poly([...deckLine(width, DECK.thick * 0.5), ...deckLine(width, DECK.thick).reverse()]);
  const parapet = poly([...deckLine(width, -5), ...road.slice().reverse()]);
  const underside = poly([...deckLine(width, DECK.thick - 2.5), ...deckLine(width, DECK.thick).reverse()]);
  let lamps = "";
  xs.filter((_, k) => k % 2 === 0).forEach((x) => {
    const y = deck(x) - 5;
    lamps += poly([[x - 0.9, y], [x - 0.9, y - 46], [x + 0.9, y - 46], [x + 0.9, y]]) + poly([[x, y - 46], [x + 12, y - 48], [x + 12, y - 46], [x, y - 44]]) + poly([[x + 9, y - 47], [x + 16, y - 47], [x + 15, y - 44], [x + 10, y - 44]]);
  });
  return [
    path(reflections, "#5f94bb") + path(foam, "#eef6fa"),
    cutPiece({ silhouette: columns + footings, markup: path(columns, "#d6d0c3") + path(lit, "#e8e3d8") + path(footings, "#aba393"), lift: 0.8 }),
    path(caps, "#c4bdae"),
    cutPiece({ silhouette: girder + parapet, markup: path(girder, "#ebe7dd") + path(fascia, "#d5cfc2") + path(underside, "#aea696") + path(parapet, "#dcd7cb"), edge: curve(deckLine(width, -4.4)), lift: 1.4 }),
    cutPiece({ silhouette: lamps, markup: path(lamps, "#6f6c68"), lift: 0.5 }),
  ].join("");
}

/** The near rail along the road (paper only), over the C3's wheels: a thin bar on its posts. */
export function rail(width) {
  const top = deckLine(width, -7);
  let posts = "";
  for (const [x, y] of top.filter((_, k) => k % 2 === 0)) posts += poly([[x - 0.6, y], [x + 0.6, y], [x + 0.6, y + 7], [x - 0.6, y + 7]]);
  const bar = poly([...top, ...deckLine(width, -5.6).reverse()]);
  return cutPiece({ silhouette: bar + posts, markup: path(posts, "#bdb6a8") + path(bar, "#f4f1ea"), lift: 0.4 });
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
