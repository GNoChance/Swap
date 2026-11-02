// The Île de Ré's intro (the Île de Ré's spec, § 2): the map going north (the C3 from Bordeaux by Saintes and Rochefort
// to La Rochelle, its dots on to the pin « Île de Ré » at the foot of the bridge, La Pallice); the camera dives onto the
// pin and comes down at the bridge's foot, by the bike rental: the two of them from the front on their rented bikes,
// « dring dring », then turned over side by side they ride off up the ramp; over the sea they cross Ré's bridge from
// left to right, up over its hump and down to Ré's end, pedalling calmly, the camera following them, sailboats under
// it, gulls crying over it; then across the island the decor glides by faster and faster, the vines, the salt marshes
// and their salt heaps, the white houses and their hollyhocks, the wooden km signs counting down to the lighthouse, the
// two of them flat out with their speed lines, Cycy in front then Kevin, until they stop out of breath over their
// handlebars at Ars, under its black and white steeple; then the Phare des Baleines by day, alone until the moments to
// come (tasks 5 and 6) are there; then the closing poster « ÎLE DE RÉ » on the lighthouse and the sea, the two of them
// side by side on their bikes in front. Its moments are the beats of intros/index.js; its stickers,
// ile-de-re.stickers.js. The lighthouse is the poster's decor.
import { content } from "../../content.js";
import { createStage, ENTER, HIDDEN, layerX, SAFE } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { preload, sceneActor, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import { sceneLook } from "../scene/urls.js";
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

/** An ease from a pace already reached (`from`, a share of the top pace) up to the top pace over the first share `rise`
 *  of the time, steady, then down to a stop over its last share `fall` (each change half a sine wave). → { ease, mean:
 *  its mean pace, a share of the top one } */
function sprint({ from, rise, fall }) {
  const up = (p) => from * p + ((1 - from) / 2) * (p - (rise / Math.PI) * Math.sin((Math.PI * p) / rise)); // the way gone
  const down = (q) => q / 2 + (fall / (2 * Math.PI)) * Math.sin((Math.PI * q) / fall); // q into the slowing down
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
// then the white houses; at the end, the church of Ars where they stop, its tower ARS units across the screen (its
// steeple on their left)
const ALONG = { marais: 1.5, maisons: 2.8 };
const ARS = 112;
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
// out of breath over their handlebars as they stop. The flat-out views are drawn riding left on their board: mirrored
const RIDES = [[0, "cote", 1], [0.6, "fond-cycy", 1.8, true], [2.5, "fond-kevin", 1.8, true], [4.1, "souffle"]];
const MIRRORED = ["fond-cycy", "fond-kevin"];
const BREATH = 0.35; // s each way of a breath, out of breath
// the km signs (content.js), by when each pops up on the right of the safe zone (s into the crossing), at their depth
// (a little farther than the path: `scale` their size), their planks over the two of them's heads; each folds down
// before the left of the safe zone, the last stays as they stop
const KM = { at: [0.7, 2.1, 4], depth: 0.6, scale: 0.85 };
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
  const themes = (depth) => ({ marais: landed.x + depth * camera(ALONG.marais), maisons: landed.x + depth * camera(ALONG.maisons), eglise: ARS + (depth * distance) / 2 });

  // back to front: the lighthouse (the poster's), the island, the bridge, the two of them across the island and the
  // grass in front, the map (each hidden under the one before it, until it leaves); a scene is the list of its layers'
  // elements
  // 1. the lighthouse on the island's tip, the reef in the sea before it, the dune in front; the two of them on their
  // bikes for the poster
  const phareLayers = PHARE.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: markup("poster") }));
  const phareCrowd = stage.layer("phare-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: phareCrowd, who: "duo", looks: { cote: scene("cycy-et-kevin-a-velo", 1) }, look: "cote", ...ON_BIKES });
  const phareScene = [...phareLayers.map((layer) => layer.el), phareCrowd];

  // 2. the island from the bridge's end to Ars: the sky, the far island, the fields behind the path (the vines, the salt
  // marshes, the white houses, the church of Ars), the km signs, the cycle path and the fields below it
  const islandScene = layersOf(ISLAND, distance / 2, themes);

  // 3. the bridge over the sea between its two ends, the bike rental at its foot: the far coast, the gulls, the
  // sailboats far off, the bridge, its land, the two of them on its road under the near rail, a sailboat near in front
  const bridgeScene = layersOf(BRIDGE, FOLLOW);
  const rider = sceneActor({
    layer: layerOf(bridgeScene, "pont-route"),
    who: "duo",
    looks: { face: scene("cycy-et-kevin-a-velo", 2), cote: scene("cycy-et-kevin-a-velo", 1) },
    look: "face",
    x: RIDE.from,
    y: pont.deck(RIDE.from),
    height: RIDE.width,
    wide: true, // its size a width: every view as wide, the two of them at one scale
  });
  const air = layerOf(bridgeScene, "pont-mouettes");
  const gulls = GULLS.map(([x, y, width, glide]) => ({ el: prop(air, "st-mouette", pont.mouette(width), [x, y], [width, (width * 13) / 42]), glide }));
  const sails = SAILS.map(([name, x, y, height, hull, glide]) => ({ el: prop(layerOf(bridgeScene, name), "st-voilier", pont.voilier(height, hull), [x, y + height * 0.02], [height * 0.8, height * 1.04]), glide }));

  // 4. across the island, in front of the bridge as it goes: the two of them on their bikes where it left them on
  // screen, each view as wide (the board's stickers are cut at one scale), the flat-out ones mirrored; the grass in front
  const islandFront = layersOf(ISLAND_FRONT, distance / 2, themes);
  const bike = (k) => scene("cycy-et-kevin-a-velo", k);
  const cyclists = sceneActor({ layer: islandFront[0], who: "duo", looks: { cote: bike(1), "fond-cycy": bike(5), "fond-kevin": bike(6), souffle: bike(8) }, look: "cote", ...landed, height: RIDE.width, wide: true });
  MIRRORED.forEach((key) => cyclists.look(key).classList.add("is-flipped"));
  // the km signs along the way, their feet behind the path's grass: each there at its stage x (sign k: on the right of
  // the safe zone, whole, when it pops up)
  const kmBox = [ile.BORNE.width * KM.scale, ile.BORNE.height * KM.scale];
  const kmX = (k) => SAFE.x1 - kmBox[0] / 2 + KM.depth * camera(KM.at[k]);
  const kmSigns = content.aventures.intros.ileDeRe.bornes.map((text, k) => prop(layerOf(islandScene, "traversee-bornes"), "st-borne", ile.borne(text, KM.scale), [kmX(k), ile.PISTE.verge + 4], kmBox));

  // 5. the South-West's map, north to the Pertuis: the coast round La Rochelle, the islands and Ré's bridge, the
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

  hide([...phareScene, duo.el, ...islandScene, ...bridgeScene, ...islandFront, ...kmSigns]);
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
  gulls.forEach(({ el, glide }, k) => {
    timeline.fromTo(el, { x: 0 }, { x: glide, duration: flight, ease: "none", immediateRender: false }, selle);
    timeline.fromTo(el, { y: 0 }, { y: -7, duration: flight / 6, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, selle);
    // three flurries of three flaps each, out of step; an even count of halves: the wings up again after each
    for (const at of [selle + 0.2 + k * 0.23, selle + 1.9 + k * 0.31, selle + 3.6 + k * 0.15])
      timeline.fromTo(el, { scaleY: 1 }, { scaleY: -0.45, duration: 0.13, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, at);
  });
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
    if (k) cyclists.flip(timeline, at, view);
    if (speed) velo.pedale(timeline, at, { actor: cyclists, duration: crossing + RIDES[k + 1][0] - at, speed, lines });
  });
  const winded = crossing + RIDES.at(-1)[0] + 0.18; // turned over, out of breath: their breaths heave them till the end
  const breaths = Math.max(1, Math.round((phare - winded) / (2 * BREATH)));
  timeline.fromTo(cyclists.pose, { scaleY: 1 }, { scaleY: 1.03, duration: (phare - winded) / (2 * breaths), ease: "sine.inOut", yoyo: true, repeat: 2 * breaths - 1, immediateRender: false }, winded);
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

  // 5. from « Le phare » on, the lighthouse by day, under the island as it goes (framed so its lantern shows on a phone
  // held sideways), alone until the moments to come take their turn
  timeline.set(phareScene, { autoAlpha: 1 }, phare);
  timeline.fromTo([...islandScene, ...islandFront], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power1.in", immediateRender: false }, phare);
  stage.frame(timeline, phare, { whole: PHARE_FRAME, duration: 0.4 });

  // 10. the poster on the lighthouse and the sea: the two of them ride in side by side in front of it, pedalling
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  velo.pedale(timeline, poster, { actor: duo, duration: 1 });
  recipes.affiche(timeline, poster, { stage, layers: phareLayers, aventure, grain: texture, only: phareScene });

  const actors = [car, rider, cyclists, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
