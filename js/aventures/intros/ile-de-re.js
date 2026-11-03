// The Île de Ré's intro (the Île de Ré's spec, § 2): the map going north (the C3 from Bordeaux by Saintes and Rochefort
// to La Rochelle, its dots on to the pin « Île de Ré » at the foot of the bridge, La Pallice); the camera dives onto the
// pin and comes down at the bridge's foot, by the bike rental: the two of them from the front on their rented bikes,
// « dring dring », then turned over side by side they ride off up the ramp; over the sea they cross Ré's bridge from
// left to right, up over its hump and down to Ré's end, pedalling calmly, the camera following them, sailboats under
// it, gulls crying over it; then across the island the decor glides by faster and faster, the vines, the salt marshes
// and their salt heaps, the white houses and their hollyhocks, the wooden km signs counting down to the lighthouse, the
// two of them flat out with their speed lines, Cycy in front then Kevin, until they stop out of breath over their
// handlebars at Ars, under its black and white steeple; then the Phare des Baleines by day: the two of them pop up in
// front of it, arms in the air, then turned over, their ice creams; then in the evening, in the golden light, the way
// back over Ré's bridge, which never ends (Kevin was « super lent »): its deck and its piers glide by on and on, no land
// in sight, as they pedal on the spot, Cycy in front and Kevin lagging, then out of breath over their handlebars, and a
// snail overtakes them on the deck; then the lighthouse again until La Rochelle and the coast (task 6) are there; then
// the closing poster « ÎLE DE RÉ » on the lighthouse and the sea, the two of them side by side on their bikes in front.
// Its moments are the beats of intros/index.js; its stickers, ile-de-re.stickers.js. The lighthouse is the poster's
// decor.
import { content } from "../../content.js";
import { createStage, ENTER, HIDDEN, layerX, SAFE } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { preload, sceneActor, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import { sceneLook } from "../scene/urls.js";
import { wave } from "../scene/geom.js";
import * as carte from "../scene/props-carte.js";
import * as perigord from "../scene/props-perigord.js";
import * as riviere from "../scene/props-riviere.js";
import * as pont from "../scene/props-pont.js";
import * as ile from "../scene/props-ile.js";
import * as recipes from "../scene/recipes.js";
import * as velo from "../scene/recipes-velo.js";
import { SCENARIOS } from "./index.js";

export { stickers } from "./ile-de-re.stickers.js";

const gsap = window.gsap;
const beat = (name) => SCENARIOS["ile-de-re"].beats.find((b) => b.name === name).at;
const MAP = { at: { x: 260, y: 640 }, unitsPerDegree: 258 }; // Bordeaux (its first point) there, 258 units a degree
// the trip on the map: its pin plopped well before the dive; the C3 drives on through La Rochelle and parks over its dot,
// its nose at the pin's tip at the bridge's foot (the names stand clear of it: props-carte.js, stops()), the last dots
// running on to the pin
const TRIP = { duration: 4, short: 37 };
const hide = (els) => els.forEach((el) => Object.assign(el.style, HIDDEN));
/** A scene sticker of the Île de Ré's boards (`board`, its number `k`), and its stand-in (spec § 3). */
const scene = (board, k, who, pose) => sceneLook("ile-de-re", board, k, who, pose);
/** The two of them with their bikes: sticker `k` of their board (correspondance: 01 side by side, 05 Cycy flat out…). */
const bike = (k) => scene("cycy-et-kevin-a-velo", k);
/** A prop drawn in paper (`markup`, an <svg> `width` × `height` units) in `layer`, of class `cls`, its bottom middle on
 *  the stage's x, y. → its element */
function prop(layer, cls, markup, [x, y], [width, height]) {
  const el = Object.assign(document.createElement("span"), { className: cls, innerHTML: markup });
  Object.assign(el.style, { left: `${layerX(layer, x) - width / 2}px`, top: `${y - height}px` });
  layer.append(el);
  return el;
}
/** An ease from a standstill to a steady pace: speeding up (as sine.in) for the first share `t` of the time, then on at
 *  the pace reached (sine.in ends at π/2 times its mean speed: that share of the way is behind by then). */
function setOff(t) {
  const share = (2 * t) / Math.PI / ((2 * t) / Math.PI + 1 - t);
  return (p) => (p < t ? share * (1 - Math.cos((Math.PI / 2) * (p / t))) : share + ((1 - share) * (p - t)) / (1 - t));
}

/** An ease from a pace already reached (`from`, a share of the top pace; the top one by default) up to the top pace
 *  over the first share `rise` of the time, steady, then down to `to` (a share of the top pace; a stop by default) over
 *  its last share `fall` (each change half a sine wave). → { ease, mean: its mean pace, a share of the top one } */
function sprint({ from = 1, rise = 0, fall, to = 0 }) {
  const up = (p) => from * p + (from < 1 ? ((1 - from) / 2) * (p - (rise / Math.PI) * Math.sin((Math.PI * p) / rise)) : 0); // the way gone
  const down = (q) => to * q + (1 - to) * (q / 2 + (fall / (2 * Math.PI)) * Math.sin((Math.PI * q) / fall)); // q into the slowing down
  const way = (p) => (p < rise ? up(p) : up(rise) + Math.min(p, 1 - fall) - rise + (p > 1 - fall ? down(p - 1 + fall) : 0));
  const mean = way(1);
  return { ease: (p) => way(p) / mean, mean };
}
/** When (a share of its time) an ease that only goes on reaches `share` of the way. */
function timeOf(ease, share) {
  let [lo, hi] = [0, 1];
  for (let k = 0; k < 30; k++) [lo, hi] = ease((lo + hi) / 2) < share ? [(lo + hi) / 2, hi] : [lo, (lo + hi) / 2];
  return (lo + hi) / 2;
}
/** `target` from `start` (GSAP vars) to `end` and back, over and over from `from` to `to` s, about `half` s each way (a
 *  whole count of times: as it was at the end); with `ease` each way out (its way back the same, reversed). */
function throb(tl, target, [from, to], half, start, end, ease = "sine.inOut") {
  const times = Math.max(1, Math.round((to - from) / (2 * half)));
  tl.fromTo(target, start, { ...end, duration: (to - from) / (2 * times), ease, yoyo: true, repeat: 2 * times - 1, immediateRender: false }, from);
}
/** The gulls ({ el, glide }) from `at` s for `duration` s (5 s at least): each gliding `glide` units and bobbing three
 *  times, flapping in three flurries of three flaps each, out of step (an even count of halves: the wings up again after
 *  each). */
function fly(tl, gulls, at, duration) {
  gulls.forEach(({ el, glide }, k) => {
    tl.fromTo(el, { x: 0 }, { x: glide, duration, ease: "none", immediateRender: false }, at);
    throb(tl, el, [at, at + duration], duration / 6, { y: 0 }, { y: -7 });
    for (const t of [at + 0.2 + k * 0.23, at + 1.9 + k * 0.31, at + 3.6 + k * 0.15])
      tl.fromTo(el, { scaleY: 1 }, { scaleY: -0.45, duration: 0.13, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, t);
  });
}

// the camera follows the two of them FOLLOW units to the right over the bridge; WIDEST: half what the widest screen
// shows (1920 × 1080: 1351 units across)
const FOLLOW = 640;
const WIDEST = 676;
/** A centred layer's width (units, by hundreds, 1600 at least) that covers the widest screen at the end of a course
 *  `reach` units from its place (the bridge's follow; half the island's glide), at `depth`. */
const across = (depth, reach = FOLLOW) => Math.max(1600, Math.ceil((WIDEST + depth * reach) / 50) * 100);
// the bridge's scene, back to front: [name, depth (its share of the camera's moves), its markup in a layer that wide
// (none: a layer for props)]: the sky, the far coast, the sea, the gulls over it, the sailboats far off, the bridge,
// the land at its ends (the rental at its foot), the road (the two of them), the near rail, a sailboat near in front
const BRIDGE = [
  ["pont-ciel", 0.04, () => riviere.sky("paper")],
  ["pont-large", 0.12, pont.large],
  ["pont-mer", 0.55, (width) => pont.mer("paper", width)],
  ["pont-mouettes", 0.58],
  ["pont-voiliers", 0.6],
  ["pont-pont", 1, pont.pont],
  ["pont-rives", 1, (width) => pont.rives(width, content.aventures.intros.ileDeRe.location)],
  ["pont-route", 1],
  ["pont-rambarde", 1, pont.rail],
  ["pont-devant", 1.3],
];
// the two of them on their rented bikes, on the road at the bridge's foot, on the flat just short of the ramp (level
// there, whichever way the timeline is sought) and clear of the rental's sign, then on it to Ré's end; each view `width`
// units wide (the board's stickers are all 600 px wide, cut at one scale: so the two of them keep theirs when it turns
// over)
const RIDE = { from: 205, to: 870, width: 116 };
const DIVE_TO = { x: 140, y: 450 }; // the dive comes close on the rental and on them
// the gulls in the sky: [x, y (their bottom), width, glide (units)]; the sailboats: [layer, x, waterline, height, hull,
// glide]: far off behind the bridge, seen under it, and one near in front. The far ones (depth 0.6) stay between the
// two banks (depth 1) all along the follow: from x 360 to 550, gliding left as the banks pass by faster
const GULLS = [[70, 300, 58, 130], [215, 236, 44, 90], [330, 352, 52, 150], [-120, 270, 48, 110], [480, 288, 50, 120], [640, 246, 42, 100]];
const SAILS = [["pont-voiliers", 395, 576, 58, "#24456b", -50], ["pont-voiliers", 460, 586, 66, "#b5433a", -40], ["pont-voiliers", 520, 580, 50, "#f0ece2", -40], ["pont-devant", 640, 726, 150, "#b5433a", -90]];
// across the island the decor glides by (velo.defile()) from « La traversée » for `until` s: from about the bridge's
// pace (`from`, a share of their full speed) up to full speed (`top` units a second at depth 1) over the first share
// `rise` of the time, steady, then down to a stop over the last share `fall` (sprint())
const SPRINT = { top: 520, from: 0.35, rise: 0.15, fall: 0.33, until: 4.6 };
// what goes by, by when it passes them (s into the crossing): the vines from the bridge's end, then the salt marshes,
// then the white houses; then the church of Ars, where they stop, its tower ARS units across the screen at the end (its
// steeple just left of them, the houses before it gone by)
const ALONG = { marais: 1.5, maisons: 2.3 };
const ARS = 140;
// the island, back to front: [name, depth, its markup in a layer that wide, given where the marshes, the houses and the
// church are in it (none: a layer for props)]: the sky, the far island and the sea, the fields behind the path, the km
// signs, the cycle path and the fields below it; then in front of the bridge as it goes (the two of them take over from
// its own at once), the two of them on their bikes, and the grass in front
const ISLAND = [
  ["traversee-ciel", 0.04, () => riviere.sky("paper")],
  ["traversee-loin", 0.15, ile.loin],
  ["traversee-champs", 0.45, ile.champs],
  ["traversee-bornes", 0.6],
  ["traversee-piste", 1, ile.piste],
];
const ISLAND_FRONT = [
  ["traversee-velos", 0],
  ["traversee-devant", 1.35, ile.devant],
];
// across the island, their views, each turned over into the next: [s into the crossing, view, pedalling speed (none:
// out of breath), speed lines]: side by side as they come off the bridge, flat out with Cycy in front, then Kevin, then
// out of breath over their handlebars as they stop. Each view pedals, or heaves out of breath, until the next one (the
// last: until the glide stops, or the end). The flat-out views are drawn riding left on their board: mirrored
const RIDES = [[0, "cote", 1], [0.6, "fond-cycy", 1.8, true], [2.5, "fond-kevin", 1.8, true], [4.1, "souffle"]];
const MIRRORED = ["fond-cycy", "fond-kevin"];
const BREATH = 0.35; // s each way of a breath, out of breath
// the km signs (their words: content.js, one each), by when each pops up on the right of the safe zone (s into the
// crossing): in the vines, in the salt marshes, at Ars; at their depth (a little farther than the path: `scale` their
// size), their planks over the two of them's heads; each folds down before the left of the safe zone, the last stays as
// they stop
const KM = { at: [0.7, 1.75, 4], depth: 0.6, scale: 0.85 };
// the lighthouse's scene, back to front, paper and poster
const PHARE = [
  ["phare-ciel", 0.04, riviere.sky],
  ["phare-mer", 0.3, (skin) => pont.mer(skin) + ile.recifs(skin)],
  ["phare-pointe", 0.45, ile.pointe],
  ["phare-dune", 0.7, ile.dune],
];
const PHARE_FRAME = 0.75; // on a phone held sideways: the lantern in sight, the layers' ends not
// the two of them side by side on their bikes on the poster, on the dune in front of the lighthouse
const ON_BIKES = { x: 172, y: 726, height: 236 };
// at the lighthouse, where they stand with their bikes on the dune, arms in the air then with their ice creams: each view
// `width` units wide, as wide as the poster's (its 01, 236 tall), the board's stickers cut at one scale. In « Le phare »
// (s into it) they pop up as the island has gone, then jump for joy between `jumps` s (`jump` units high, `hop` s each
// way: twice); in « La glace » they sway with their ice creams from `sway` s until the way back, `tilt` degrees each
// way, and the evening comes over them
const AT_PHARE = { x: 172, y: 726, width: 243 };
const CHEER = { jumps: [0.85, 1.45], jump: 9, hop: 0.15, sway: 0.3, tilt: 1.5 };
// the way back over the bridge in the evening, never ending, back to front: [name, depth, its markup in a layer that
// wide (none: a layer for props)]: the golden sky (the canoe's), the sea at sunset, the gulls over it, the bridge
// going on and on (no land at either end), the two of them on their bikes (on the spot), the snail on the deck, the
// near rail; the golden light over them all on a layer of its own (css/intros.css, st-veil--soir)
const RETOUR = [
  ["retour-ciel", 0.04, () => riviere.cielDore()],
  ["retour-mer", 0.55, (width) => pont.mer("paper", width, pont.SOIR)],
  ["retour-mouettes", 0.58],
  ["retour-pont", 1, (width) => pont.pont(width, { endless: true })],
  ["retour-velos", 0],
  ["retour-escargot", 1],
  ["retour-rambarde", 1, (width) => pont.rail(width, { endless: true })],
];
// on the way back the deck and its piers glide by to the right (velo.defile()) at `pace` units a second (depth 1); the
// two of them pop up on it, `x` on screen, once it has come in, then pedal slowly on the spot (`speed`), Cycy in front
// and Kevin lagging; from `breathless` s into it, turned over out of breath over their handlebars, they pedal slower
// still (`slower`) and the pace drops to `tired` of its own by the end (sprint())
const BACK = { pace: 110, speed: 0.8, breathless: 3.5, slower: 0.4, tired: 0.45, x: 215 };
// the snail on the deck, `width` units long: on screen at x `from` as the way back begins, behind them (on their
// right), and at `to` as it ends, in front of them (on their left); it crawls at a steady pace, faster than theirs,
// stretching out and back, `stretch` s each way
const SNAIL = { width: 46, from: 330, to: 60, stretch: 0.35 };
// the gulls over the way back: [x, y (their bottom), width, glide (units)], following them left, within the action
// band
const BACK_GULLS = [[150, 300, 54, -120], [300, 292, 44, -90], [420, 350, 50, -140], [40, 318, 46, -100], [560, 330, 48, -110]];
// the golden light of the evening: its veil at `from` as the way back comes in, then warming on to full as they go
const DUSK = { from: 0.7 };
const DISSOLVE = 0.4; // s the way back takes to come in over the lighthouse
const FADE = 0.3; // s it takes to go

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const layerOf = (list, name) => list.find((el) => el.dataset.layer === name);
  /** A scene's layers (`list`, as BRIDGE or ISLAND), each as wide as its course `reach` needs (across()), its markup
   *  given `themes(depth)` if any. */
  const layersOf = (list, reach, themes = () => undefined) =>
    list.map(([name, depth, markup]) => {
      const width = across(depth, reach);
      return markup ? paperLayer({ stage, name, depth, width, paper: markup(width, themes(depth)) }).el : stage.layer(name, { depth, width });
    });

  // across the island: how far the decor glides (units at depth 1), where its camera is `t` s into the crossing (from
  // −distance/2 to distance/2: velo.defile()), and where what passes the two of them then stands in a layer at `depth`
  // (they stay where the bridge left them on screen, level on the path)
  const cruise = sprint(SPRINT);
  const distance = SPRINT.top * SPRINT.until * cruise.mean;
  const camera = (t) => distance * (cruise.ease(Math.min(1, t / SPRINT.until)) - 0.5);
  const landed = { x: RIDE.to - FOLLOW, y: ile.PISTE.ride };
  const passing = (depth, t) => landed.x + depth * camera(t);
  // each layer's themes; a layer nearer than the path starts its village where the path's stands at the glide's end
  // (sliding further, it keeps right of it all along: its hollyhocks never stand in front of the path's salt pans)
  const themes = (depth) => ({
    marais: passing(depth, ALONG.marais),
    maisons: depth > 1 ? passing(1, ALONG.maisons) + ((depth - 1) * distance) / 2 : passing(depth, ALONG.maisons),
    eglise: ARS + (depth * distance) / 2,
  });

  // on the way back, from its moment until its scene has gone (it goes as La Rochelle's begins): how far the deck glides
  // (units at depth 1), steady, then slowing down as they are out of breath
  const retour = beat("Le retour");
  const rochelle = beat("La Rochelle");
  const backFor = rochelle + FADE - retour;
  const tiring = sprint({ fall: (backFor - BACK.breathless) / backFor, to: BACK.tired });
  const backDistance = BACK.pace * backFor * tiring.mean;

  /** The gulls of `list` ([x, y, width, glide]) in `layer`: [{ el, glide }]. */
  const gullsIn = (layer, list) => list.map(([x, y, width, glide]) => ({ el: prop(layer, "st-mouette", pont.mouette(width), [x, y], [width, (width * 13) / 42]), glide }));

  // back to front: the lighthouse (the poster's), the way back, the island, the bridge, the two of them across the island
  // and the grass in front, the map (each hidden under the one before it, until it leaves, but the way back: it comes in
  // over the lighthouse); a scene is the list of its layers' elements
  // 1. the lighthouse on the island's tip, the reef in the sea before it, the dune in front; the two of them in front of
  // it with their bikes, arms in the air, then their ice creams; the two of them on their bikes for the poster
  const phareLayers = PHARE.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: markup("poster") }));
  const phareCrowd = stage.layer("phare-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: phareCrowd, who: "duo", looks: { cote: bike(1) }, look: "cote", ...ON_BIKES });
  const arrived = sceneActor({ layer: phareCrowd, who: "duo", looks: { bras: bike(12), glaces: bike(11) }, look: "bras", x: AT_PHARE.x, y: AT_PHARE.y, height: AT_PHARE.width, wide: true });
  const phareScene = [...phareLayers.map((layer) => layer.el), phareCrowd];

  // 2. the way back over the bridge in the evening, never ending: the golden sky, the golden sea, the gulls, the bridge
  // going on and on, the two of them on their bikes on the deck (Cycy in front, then out of breath; each view as wide),
  // the snail behind them on it, the near rail; the golden light over them all (its layer, the camera never moves it:
  // GSAP fades it)
  const backScene = layersOf(RETOUR, backDistance / 2);
  const homeward = sceneActor({ layer: layerOf(backScene, "retour-velos"), who: "duo", looks: { "fond-cycy": bike(5), souffle: bike(8) }, look: "fond-cycy", x: BACK.x, y: pont.DECK.base, height: RIDE.width, wide: true });
  // the snail on the deck, `SNAIL.from` on screen as its layer starts the glide backDistance / 2 left of its place
  const snail = prop(layerOf(backScene, "retour-escargot"), "st-escargot", pont.escargot(SNAIL.width), [SNAIL.from + backDistance / 2, pont.DECK.base], [SNAIL.width, (SNAIL.width * 23) / 44]);
  const backGulls = gullsIn(layerOf(backScene, "retour-mouettes"), BACK_GULLS);
  const dusk = stage.layer("retour-soir", { depth: 0 });
  dusk.classList.add("st-veil", "st-veil--soir");

  // 3. the island from the bridge's end to Ars: the sky, the far island, the fields behind the path (the vines, the salt
  // marshes, the white houses, the church of Ars), the km signs, the cycle path and the fields below it
  const islandScene = layersOf(ISLAND, distance / 2, themes);

  // 4. the bridge over the sea between its two ends, the bike rental at its foot: the far coast, the gulls, the
  // sailboats far off, the bridge, its land, the two of them on its road under the near rail, a sailboat near in front
  const bridgeScene = layersOf(BRIDGE, FOLLOW);
  const rider = sceneActor({
    layer: layerOf(bridgeScene, "pont-route"),
    who: "duo",
    looks: { face: bike(2), cote: bike(1) },
    look: "face",
    x: RIDE.from,
    y: pont.deck(RIDE.from),
    height: RIDE.width,
    wide: true, // its size a width: every view as wide, the two of them at one scale
  });
  const gulls = gullsIn(layerOf(bridgeScene, "pont-mouettes"), GULLS);
  const sails = SAILS.map(([name, x, y, height, hull, glide]) => ({ el: prop(layerOf(bridgeScene, name), "st-voilier", pont.voilier(height, hull), [x, y + height * 0.02], [height * 0.8, height * 1.04]), glide }));

  // 5. across the island, in front of the bridge as it goes: the two of them on their bikes where it left them on
  // screen, each view as wide (the board's stickers are cut at one scale), the flat-out ones mirrored; the grass in front
  const islandFront = layersOf(ISLAND_FRONT, distance / 2, themes);
  const cyclists = sceneActor({ layer: islandFront[0], who: "duo", looks: { cote: bike(1), "fond-cycy": bike(5), "fond-kevin": bike(6), souffle: bike(8) }, look: "cote", ...landed, height: RIDE.width, wide: true });
  MIRRORED.forEach((key) => cyclists.look(key).classList.add("is-flipped"));
  // the km signs along the way, their feet behind the path's grass: each there at its stage x (sign k: on the right of
  // the safe zone, whole, when it pops up)
  const kmWords = content.aventures.intros.ileDeRe.bornes;
  if (kmWords.length !== KM.at.length) throw new Error(`ile-de-re: ${kmWords.length} km signs' words (content.js) for ${KM.at.length} times (KM.at)`);
  const kmBox = [ile.BORNE.width * KM.scale, ile.BORNE.height * KM.scale];
  const kmX = (k) => SAFE.x1 - kmBox[0] / 2 + KM.depth * camera(KM.at[k]);
  const kmSigns = kmWords.map((text, k) => prop(layerOf(islandScene, "traversee-bornes"), "st-borne", ile.borne(text, KM.scale), [kmX(k), ile.PISTE.verge + 4], kmBox));

  // 6. the South-West's map, north to the Pertuis: the coast round La Rochelle, the islands and Ré's bridge, the
  // marshes, the vines of Cognac and Bordeaux, the Charente, the woods, the Médoc's pines
  const way = trajet.points.map(project).map(({ x, y }) => [x, y]);
  const clear = carte.stops({ trajet, lieu }, project).map((s) => s.box);
  const regional = [
    carte.ocean(project, { pertuis: true }),
    carte.land(project, { road: way, pertuis: true }),
    carte.iles(project),
    carte.marais(project, { road: way, clear }),
    perigord.vignes(project, { road: way, clear, vineyards: carte.CHARENTES.vineyards }),
    carte.charente(project),
    perigord.bois(project, { road: way, clear, woods: carte.CHARENTES.woods }),
    carte.landes(project, { road: way, clear }),
  ].join("");
  const map = [paperLayer({ stage, name: "carte", paper: regional }).el, stage.layer("carte-trajet")];
  const start = project(trajet.points[0]);
  const end = project(trajet.points.at(-1));
  const car = vehicle({ layer: map[1], name: "c3", x: start.x, y: start.y, width: 60, view: "roule" });

  hide([...phareScene, duo.el, ...backScene, dusk, ...islandScene, ...bridgeScene, ...islandFront, ...kmSigns]);
  stage.el.style.setProperty("--st-whole", "1"); // the map in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in

  // 1. the map: the C3 from Bordeaux through La Rochelle to the pin at the bridge's foot, its dots on to the pin
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car, trajet, lieu, project, ...TRIP });

  // 2. « En selle »: the camera dives onto the pin and comes down at the bridge's foot, by the rental, framed on the
  // action band; the two of them from the front ring their bells, bouncing with each « dring »; once the dive has
  // settled, turned over, side by side, they set off
  const selle = beat("En selle");
  const bridge = beat("Le pont");
  const crossing = beat("La traversée");
  const settled = recipes.plonge(timeline, selle, { stage, from: { layers: map, x: end.x, y: end.y }, layers: bridgeScene, to: DIVE_TO });
  stage.frame(timeline, selle, { whole: false, duration: 0.45 });
  const ring = selle + 0.5;
  stage.sound(timeline, ring, "dring");
  timeline.fromTo(rider.pose, { scaleX: 1, scaleY: 1 }, { scaleX: 0.97, scaleY: 1.05, duration: 0.1, ease: "sine.out", yoyo: true, repeat: 3, immediateRender: false }, ring);
  rider.flip(timeline, settled, "cote");
  const off = settled + 0.1;

  // 3. « Le pont »: from the set-off they ride up the ramp (at its foot as the moment begins), over the hump and down
  // to Ré's end, pedalling, the camera following them on the same pace (they keep their place on screen); the gulls
  // glide and flap, crying; the sailboats sail on
  const pace = setOff((bridge - off) / (crossing - off));
  const ride = recipes.along({ actor: rider, from: RIDE.from, to: RIDE.to, line: pont.deck });
  timeline.fromTo(ride, { progress: 0 }, { progress: 1, duration: crossing - off, ease: pace, immediateRender: false }, off);
  stage.pan(timeline, off, { x: FOLLOW, duration: crossing - off, ease: pace, only: bridgeScene });
  velo.pedale(timeline, off, { actor: rider, duration: crossing - off });
  const flight = crossing + 0.3 - selle; // till the bridge is gone
  fly(timeline, gulls, selle, flight);
  stage.sound(timeline, selle + 1.9, "gulls");
  stage.sound(timeline, selle + 3.7, "gulls");
  sails.forEach(({ el, glide }) => {
    timeline.fromTo(el, { x: 0 }, { x: glide, duration: flight, ease: "none", immediateRender: false }, selle);
    timeline.fromTo(el, { rotation: -1.2 }, { rotation: 1.2, duration: flight / 6, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, selle);
  });

  // 4. « La traversée »: the island under the bridge as it goes, the grass in front fading in with it; the two of them
  // take over from the bridge's at once, in its view, where it left them, levelling off its ramp. The decor glides by,
  // faster and faster then slowing down to a stop; they pedal side by side, then turn over flat out, Cycy in front then
  // Kevin, their speed lines streaming, and over their handlebars out of breath as they stop at Ars
  const phare = beat("Le phare");
  const islandDecor = [...islandScene, islandFront[1]];
  timeline.set([...islandScene, islandFront[0]], { autoAlpha: 1 }, crossing);
  timeline.fromTo(islandFront[1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, crossing);
  timeline.set(rider.el, { autoAlpha: 0 }, crossing);
  timeline.to(bridgeScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, crossing);
  timeline.fromTo(cyclists.el, { rotation: recipes.slope(pont.deck, RIDE.to), y: pont.deck(RIDE.to) - landed.y }, { rotation: 0, y: 0, duration: 0.3, ease: "power1.out", immediateRender: false }, crossing);
  velo.defile(timeline, crossing, { stage, layers: islandDecor, distance, duration: SPRINT.until, ease: cruise.ease });
  RIDES.forEach(([t, view, speed, lines], k) => {
    const at = crossing + t;
    const next = RIDES[k + 1] ? crossing + RIDES[k + 1][0] : null;
    if (k) cyclists.flip(timeline, at, view);
    if (speed) velo.pedale(timeline, at, { actor: cyclists, duration: (next ?? crossing + SPRINT.until) - at, speed, lines });
    else throb(timeline, cyclists.pose, [at + 0.18, next ?? phare], BREATH, { scaleY: 1 }, { scaleY: 1.03 }); // out of breath: their breaths heave them
  });
  // the km signs pop up out of the grass, glide by, and fold down into it before the left of the safe zone (unless they
  // have stopped by then)
  kmSigns.forEach((sign, k) => {
    const at = crossing + KM.at[k];
    timeline.set(sign, { autoAlpha: 1 }, at).fromTo(sign, { scaleY: 0 }, { scaleY: 1, duration: 0.22, ease: "back.out(2)", immediateRender: false }, at);
    const share = (kmX(k) - SAFE.x0 - kmBox[0] / 2) / KM.depth / distance + 0.5; // of the glide, there
    if (share >= 1) return;
    const gone = crossing + SPRINT.until * timeOf(cruise.ease, share);
    timeline.fromTo(sign, { scaleY: 1 }, { scaleY: 0, duration: 0.14, ease: "power1.in", immediateRender: false }, gone - 0.14).set(sign, { autoAlpha: 0 }, gone);
  });

  // 5. « Le phare »: the lighthouse by day, under the island as it goes (framed so its lantern shows on a phone held
  // sideways); as it has gone, the two of them pop up in front of it, arms in the air (the island's riders, faded with
  // it, hand over to them at that instant), and jump for joy
  timeline.set(phareScene, { autoAlpha: 1 }, phare);
  timeline.fromTo([...islandScene, ...islandFront], { autoAlpha: 1 }, { autoAlpha: 0, duration: FADE, ease: "power1.in", immediateRender: false }, phare);
  stage.frame(timeline, phare, { whole: PHARE_FRAME, duration: 0.4 });
  arrived.pop(timeline, phare + FADE);
  throb(timeline, arrived.pose, CHEER.jumps.map((t) => phare + t), CHEER.hop, { y: 0 }, { y: -CHEER.jump }, "power2.out");

  // 6. « La glace »: at the lighthouse's foot, turned over, their ice creams; they sway happily
  const glace = beat("La glace");
  arrived.flip(timeline, glace, "glaces");
  timeline.fromTo(arrived.pose, { rotation: 0 }, { rotation: CHEER.tilt, duration: retour - glace - CHEER.sway, ease: wave(2), immediateRender: false }, glace + CHEER.sway);

  // 7. « Le retour »: in the evening, over Ré's bridge, which never ends; its scene comes in over the lighthouse and the
  // two of them with their ice creams, framed back on the action band, the golden light with it, warming on as they go;
  // once it is in, they hand over to the two of them on their bikes, who pop up on the deck. The deck and its piers
  // glide by to the right as they pedal on the spot, slowly, Cycy in front and Kevin lagging, then turned over out of
  // breath over their handlebars, slower still as the pace drops; the snail on the deck crawls on at its own pace and
  // overtakes them; the gulls glide and flap, crying
  const evening = retour + DISSOLVE;
  timeline.fromTo(backScene, { autoAlpha: 0 }, { autoAlpha: 1, duration: DISSOLVE, ease: "power1.out", immediateRender: false }, retour);
  timeline.fromTo(dusk, { autoAlpha: 0 }, { autoAlpha: DUSK.from, duration: DISSOLVE, ease: "power1.out", immediateRender: false }, retour);
  timeline.fromTo(dusk, { autoAlpha: DUSK.from }, { autoAlpha: 1, duration: rochelle - evening, ease: "sine.inOut", immediateRender: false }, evening);
  timeline.set([...phareScene, arrived.el], { autoAlpha: 0 }, evening);
  stage.frame(timeline, retour, { whole: false, duration: DISSOLVE });
  velo.defile(timeline, retour, { stage, layers: backScene, distance: -backDistance, duration: backFor, ease: tiring.ease });
  const riding = homeward.pop(timeline, evening);
  const breathless = retour + BACK.breathless;
  velo.pedale(timeline, riding, { actor: homeward, duration: breathless - riding, speed: BACK.speed });
  homeward.flip(timeline, breathless, "souffle");
  velo.pedale(timeline, breathless, { actor: homeward, duration: retour + backFor - breathless, speed: BACK.slower });
  timeline.fromTo(snail, { x: 0 }, { x: SNAIL.to - SNAIL.from - backDistance, duration: backFor, ease: "none", immediateRender: false }, retour);
  throb(timeline, snail, [retour, retour + backFor], SNAIL.stretch, { scaleX: 1 }, { scaleX: 1.08 });
  fly(timeline, backGulls, retour, backFor);
  stage.sound(timeline, retour + 1.2, "gulls");

  // 8. from « La Rochelle » on, until La Rochelle and the coast are there (task 6): the lighthouse again, under the way
  // back as it goes (framed so its lantern shows on a phone held sideways)
  timeline.set(phareScene, { autoAlpha: 1 }, rochelle);
  timeline.to([...backScene, dusk], { autoAlpha: 0, duration: FADE, ease: "power1.in" }, rochelle);
  stage.frame(timeline, rochelle, { whole: PHARE_FRAME, duration: 0.4 });

  // 10. the poster on the lighthouse and the sea: the two of them ride in side by side in front of it, pedalling
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  velo.pedale(timeline, poster, { actor: duo, duration: 1 });
  recipes.affiche(timeline, poster, { stage, layers: phareLayers, aventure, grain: texture, only: phareScene });

  const actors = [car, rider, cyclists, arrived, homeward, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
