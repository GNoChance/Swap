// The Île de Ré's intro (the Île de Ré's spec, § 2): the map going north (the C3 from Bordeaux by Saintes and Rochefort
// to La Rochelle, its dots over the bridge to the pin at Rivedoux); the camera dives onto the pin, and over the sea the
// C3 crosses Ré's long bridge from left to right, up over its hump, the camera following it, sailboats under it, gulls
// crying over it; then the Phare des Baleines by day, alone until the moments to come (tasks 4 to 6) are there; then the
// closing poster « ÎLE DE RÉ » on the lighthouse and the sea, the two of them side by side on their bikes in front. Its
// moments are the beats of intros/index.js; its stickers, ile-de-re.stickers.js. The lighthouse is the poster's decor.
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
import { SCENARIOS } from "./index.js";

export { stickers } from "./ile-de-re.stickers.js";

const gsap = window.gsap;
const beat = (name) => SCENARIOS["ile-de-re"].beats.find((b) => b.name === name).at;
const MAP = { at: { x: 260, y: 640 }, unitsPerDegree: 258 }; // Bordeaux (its first point) there, 258 units a degree
// the trip on the map: its pin plopped well before the dive; the C3 pulls up short of La Rochelle, its dot and its name
// clear of it
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

// the bridge's scene, back to front: [name, depth (its share of the camera's moves), width, its markup (none: a layer
// for props)]. The camera follows the C3 FOLLOW units to the right: each layer covers its share of that on the widest
// screens
const FOLLOW = 400;
const BRIDGE = [
  ["pont-ciel", 0.04, 1600, () => riviere.sky("paper")],
  ["pont-large", 0.12, 1600, pont.large],
  ["pont-mer", 0.55, 2000, () => pont.mer("paper", 2000)],
  ["pont-mouettes", 0.5, 2000],
  ["pont-voiliers", 0.6, 2000],
  ["pont-pont", 1, 2400, () => pont.pont(2400)],
  ["pont-route", 1, 2400],
  ["pont-rambarde", 1, 2400, () => pont.rail(2400)],
  ["pont-devant", 1.3, 2600],
];
// the C3 over the bridge: from x `from` to `to` on its deck (the hump half way), `width` units wide; the camera dives in
// close on its start
const CROSSING = { from: 50, to: 650, width: 96 };
const DIVE_TO = { x: 50, y: 470 };
// the gulls in the sky: [x, y (their bottom), width, glide (units)]; the sailboats: [layer, x, waterline, height, hull,
// glide]: far off behind the bridge, seen under it, and one near in front
const GULLS = [[70, 300, 58, 130], [215, 236, 44, 90], [330, 352, 52, 150], [-120, 270, 48, 110]];
const SAILS = [["pont-voiliers", 130, 576, 58, "#24456b", -50], ["pont-voiliers", 480, 586, 66, "#b5433a", -40], ["pont-voiliers", -190, 568, 50, "#f0ece2", -30], ["pont-devant", 640, 726, 150, "#b5433a", -90]];
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

  // 2. the bridge over the sea: the far coast, the gulls, the sailboats far off, the bridge and the C3 on its road under
  // the near rail, a sailboat near in front
  const bridgeScene = BRIDGE.map(([name, depth, width, markup]) => (markup ? paperLayer({ stage, name, depth, width, paper: markup() }).el : stage.layer(name, { depth, width })));
  const road = layerOf(bridgeScene, "pont-route");
  const c3 = vehicle({ layer: road, name: "c3", x: CROSSING.from, y: pont.deck(CROSSING.from), width: CROSSING.width, view: "roule" });
  c3.turn.classList.add("is-flipped"); // facing right, the way it crosses
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

  // 1. the map: the C3 from Bordeaux up to La Rochelle, its dots over the bridge to Rivedoux's pin
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car, trajet, lieu, project, ...TRIP });

  // 2. the bridge: the camera dives onto the pin and the bridge shows through, close on the C3 at its start, framed on
  // the action band; the C3 drives off over the hump, its engine purring till the moment's end, the camera following it
  // once settled; the gulls glide and flap, crying; the sailboats sail on
  const bridge = beat("Le pont");
  const selle = beat("En selle");
  const settled = recipes.plonge(timeline, bridge, { stage, from: { layers: map, x: end.x, y: end.y }, layers: bridgeScene, to: DIVE_TO });
  stage.frame(timeline, bridge, { whole: false, duration: 0.45 });
  const off = bridge + 0.1;
  const ride = recipes.along({ actor: c3, from: CROSSING.from, to: CROSSING.to, line: pont.deck });
  timeline.to(ride, { progress: 1, duration: selle - off, ease: "sine.in" }, off);
  c3.bounce(timeline, off, selle - off);
  stage.sound(timeline, off, "engine", selle);
  stage.pan(timeline, settled, { x: FOLLOW, duration: selle - settled, ease: "sine.in", only: bridgeScene });
  const flight = selle + 0.3 - bridge; // till the bridge is gone
  gulls.forEach(({ el, glide }, k) => {
    timeline.fromTo(el, { x: 0 }, { x: glide, duration: flight, ease: "none", immediateRender: false }, bridge);
    timeline.fromTo(el, { y: 0 }, { y: -7, duration: flight / 4, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, bridge);
    // two flurries of three flaps each, out of step; an even count of halves: the wings up again after each
    for (const at of [bridge + 0.2 + k * 0.23, bridge + 1.6 + k * 0.31])
      timeline.fromTo(el, { scaleY: 1 }, { scaleY: -0.45, duration: 0.13, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, at);
  });
  stage.sound(timeline, bridge + 0.45, "gulls");
  stage.sound(timeline, bridge + 2.1, "gulls");
  sails.forEach(({ el, glide }) => {
    timeline.fromTo(el, { x: 0 }, { x: glide, duration: flight, ease: "none", immediateRender: false }, bridge);
    timeline.fromTo(el, { rotation: -1.2 }, { rotation: 1.2, duration: flight / 4, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, bridge);
  });

  // 3. from « En selle » on, the lighthouse by day, under the bridge as it goes (framed so its lantern shows on a phone
  // held sideways), alone until the moments to come take their turn
  timeline.set(phareScene, { autoAlpha: 1 }, selle);
  timeline.to(bridgeScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, selle);
  stage.frame(timeline, selle, { whole: PHARE_FRAME, duration: 0.4 });

  // 10. the poster on the lighthouse and the sea: the two of them ride in side by side in front of it, pedalling
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  timeline.fromTo(duo.pose, { y: 0, rotation: 0 }, { y: -3, rotation: 0.8, duration: 0.25, ease: "sine.inOut", repeat: 3, yoyo: true, immediateRender: false }, poster);
  recipes.affiche(timeline, poster, { stage, layers: phareLayers, aventure, grain: texture, only: phareScene });

  const actors = [car, c3, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
