// The Île de Ré's intro (the Île de Ré's spec, § 2): the map going north (the C3 from Bordeaux by Saintes and Rochefort
// to La Rochelle, its dots on to the pin « Île de Ré » at the foot of the bridge, La Pallice); the camera dives onto the
// pin and comes down at the bridge's foot, by the bike rental: the two of them from the front on their rented bikes,
// « dring dring », then turned over side by side they ride off up the ramp; over the sea they cross Ré's bridge from
// left to right, up over its hump and down to Ré's end, pedalling calmly, the camera following them, sailboats under
// it, gulls crying over it; then the Phare des Baleines by day, alone until the moments to come (tasks 4b to 6) are
// there; then the closing poster « ÎLE DE RÉ » on the lighthouse and the sea, the two of them side by side on their
// bikes in front. Its moments are the beats of intros/index.js; its stickers, ile-de-re.stickers.js. The lighthouse is
// the poster's decor.
import { content } from "../../content.js";
import { createStage, ENTER, HIDDEN, layerX } from "../scene/stage.js";
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
// the trip on the map: its pin plopped well before the dive; the C3 pulls up short of La Rochelle, its dot and its name
// clear of it, the last dots running on to the pin
const TRIP = { duration: 4, short: 70 };
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

// the camera follows the two of them FOLLOW units to the right over the bridge; WIDEST: half what the widest screen
// shows (1920 × 1080: 1351 units across)
const FOLLOW = 640;
const WIDEST = 676;
/** A centred layer's width (units, by hundreds, 1600 at least) that covers the widest screen at the end of the follow,
 *  at `depth`. */
const across = (depth) => Math.max(1600, Math.ceil((WIDEST + depth * FOLLOW) / 50) * 100);
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
// the two of them on their rented bikes, on the road at the bridge's foot, just short of the ramp and clear of the
// rental's sign, then on it to Ré's end; each view `width` units wide (the board's stickers are all 600 px wide, cut
// at one scale: so the two of them keep theirs when it turns over)
const RIDE = { from: 205, to: 870, width: 116 };
const DIVE_TO = { x: 140, y: 450 }; // the dive comes close on the rental and on them
// the gulls in the sky: [x, y (their bottom), width, glide (units)]; the sailboats: [layer, x, waterline, height, hull,
// glide]: far off behind the bridge, seen under it, and one near in front
const GULLS = [[70, 300, 58, 130], [215, 236, 44, 90], [330, 352, 52, 150], [-120, 270, 48, 110], [480, 288, 50, 120], [640, 246, 42, 100]];
const SAILS = [["pont-voiliers", 130, 576, 58, "#24456b", -50], ["pont-voiliers", 480, 586, 66, "#b5433a", -40], ["pont-voiliers", -190, 568, 50, "#f0ece2", -30], ["pont-voiliers", 720, 580, 54, "#f0ece2", -45], ["pont-devant", 640, 726, 150, "#b5433a", -90]];
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

  // back to front: the lighthouse (the poster's), the bridge, the map (each hidden under the one before it, until it
  // leaves); a scene is the list of its layers' elements
  // 1. the lighthouse on the island's tip, the reef in the sea before it, the dune in front; the two of them on their
  // bikes for the poster
  const phareLayers = PHARE.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: markup("poster") }));
  const phareCrowd = stage.layer("phare-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: phareCrowd, who: "duo", looks: { cote: scene("cycy-et-kevin-a-velo", 1) }, look: "cote", ...ON_BIKES });
  const phareScene = [...phareLayers.map((layer) => layer.el), phareCrowd];

  // 2. the bridge over the sea between its two ends, the bike rental at its foot: the far coast, the gulls, the
  // sailboats far off, the bridge, its land, the two of them on its road under the near rail, a sailboat near in front
  const bridgeScene = BRIDGE.map(([name, depth, markup]) => {
    const width = across(depth);
    return markup ? paperLayer({ stage, name, depth, width, paper: markup(width) }).el : stage.layer(name, { depth, width });
  });
  const rider = sceneActor({
    layer: layerOf(bridgeScene, "pont-route"),
    who: "duo",
    looks: { face: scene("cycy-et-kevin-a-velo", 2), cote: scene("cycy-et-kevin-a-velo", 1) },
    look: "face",
    x: RIDE.from,
    y: pont.deck(RIDE.from),
    height: RIDE.width,
  });
  for (const img of rider.imgs) Object.assign(img.style, { width: `${RIDE.width}px`, height: "auto" }); // as wide: one scale
  const air = layerOf(bridgeScene, "pont-mouettes");
  const gulls = GULLS.map(([x, y, width, glide]) => ({ el: prop(air, "st-mouette", pont.mouette(width), [x, y], [width, (width * 13) / 42]), glide }));
  const sails = SAILS.map(([name, x, y, height, hull, glide]) => ({ el: prop(layerOf(bridgeScene, name), "st-voilier", pont.voilier(height, hull), [x, y + height * 0.02], [height * 0.8, height * 1.04]), glide }));

  // 3. the South-West's map, north to the Pertuis: the coast round La Rochelle, the islands and Ré's bridge, the
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

  hide([...phareScene, duo.el, ...bridgeScene]);
  stage.el.style.setProperty("--st-whole", "1"); // the map in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in

  // 1. the map: the C3 from Bordeaux up to La Rochelle, its dots on to the pin at the bridge's foot
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car, trajet, lieu, project, ...TRIP });

  // 2. « En selle »: the camera dives onto the pin and comes down at the bridge's foot, by the rental, framed on the
  // action band; the two of them from the front ring their bells, bouncing with each « dring »; turned over, side by
  // side, they set off
  const selle = beat("En selle");
  const bridge = beat("Le pont");
  const crossing = beat("La traversée");
  recipes.plonge(timeline, selle, { stage, from: { layers: map, x: end.x, y: end.y }, layers: bridgeScene, to: DIVE_TO });
  stage.frame(timeline, selle, { whole: false, duration: 0.45 });
  const ring = selle + 0.5;
  stage.sound(timeline, ring, "dring");
  timeline.fromTo(rider.pose, { scaleX: 1, scaleY: 1 }, { scaleX: 0.97, scaleY: 1.05, duration: 0.1, ease: "sine.out", yoyo: true, repeat: 3, immediateRender: false }, ring);
  rider.flip(timeline, selle + 1.1, "cote");
  const off = selle + 1.2;

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

  // 4. from « La traversée » on, the lighthouse by day, under the bridge as it goes (framed so its lantern shows on a
  // phone held sideways), alone until the moments to come take their turn
  timeline.set(phareScene, { autoAlpha: 1 }, crossing);
  timeline.to(bridgeScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, crossing);
  stage.frame(timeline, crossing, { whole: PHARE_FRAME, duration: 0.4 });

  // 10. the poster on the lighthouse and the sea: the two of them ride in side by side in front of it, pedalling
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  velo.pedale(timeline, poster, { actor: duo, duration: 1 });
  recipes.affiche(timeline, poster, { stage, layers: phareLayers, aventure, grain: texture, only: phareScene });

  const actors = [car, rider, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
