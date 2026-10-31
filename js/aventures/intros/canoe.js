// The Premier canoë's intro (the canoe's spec, § 2): the map in two steps (the C3 from Bordeaux along the Dordogne to
// the P of Port d'Enveaux; the camera dives onto it and the valley's illustrated map shows, the rental's little bus
// honks and drives up it to Carsac); the camera dives onto Carsac's beach, where the two of them stand with their
// paddles by the sign and Kevin helps Cycy in; the canoe paddles off and spins round and round, Cycy puzzled then
// cross and Kevin in tears in their bubbles, then it goes off straight; down the river under the leaning trees, Domme
// and Montfort far off, under Vitrac's bridge; the river on a summer day under Beynac's cliff, then the closing poster
// « LA DORDOGNE » on the river, the canoe in front of the cliff. Its moments are the beats of intros/index.js; its
// stickers, canoe.stickers.js. The river shows alone from the lunch to the poster: the day's scenes come in front of it.
import { content } from "../../content.js";
import { createStage, ENTER, HIDDEN } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { faceBubble, paperVehicle, preload, sceneActor, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import { fallbackUrl, sceneUrl } from "../scene/urls.js";
import * as carte from "../scene/props-carte.js";
import * as perigord from "../scene/props-perigord.js";
import * as riviere from "../scene/props-riviere.js";
import * as chateaux from "../scene/props-chateaux.js";
import * as recipes from "../scene/recipes.js";
import * as eau from "../scene/recipes-eau.js";
import { SCENARIOS } from "./index.js";

export { stickers } from "./canoe.stickers.js";

const gsap = window.gsap;
const beat = (name) => SCENARIOS.canoe.beats.find((b) => b.name === name).at;
const MAP = { at: { x: 50, y: 330 }, unitsPerDegree: 230 }; // Bordeaux (its first point) there, 230 units a degree
const RELAY = 2.9; // s: the C3 at Port d'Enveaux, the bus's turn
const hide = (els) => els.forEach((el) => Object.assign(el.style, HIDDEN));
/** A scene sticker of the canoe's boards (`board`, its number `k`), and its stand-in: its main person from the front in
 *  the nearest pose (spec § 3). */
const scene = (board, k, who = "cycy", pose = "joie") => ({ src: sceneUrl("canoe", board, k), fallback: fallbackUrl(who, "face", pose) });

// the river's layers, back to front: [name, depth (its share of the camera's moves), its markup in a skin]
const RIVER = [
  ["riviere-ciel", 0.04, riviere.sky],
  ["riviere-collines", 0.12, riviere.hills],
  ["riviere-falaise", 0.18, chateaux.beynac],
  ["riviere-eau", 0.3, (skin) => riviere.water(skin, chateaux.CLIFF)],
  ["riviere-rives", 0.6, riviere.banks],
  ["riviere-arbres", 1.15, riviere.trees], // the near ones pass by on the sides
];
// the launch at Carsac, back to front (paper only)
const LAUNCH = [
  ["depart-ciel", 0.04, riviere.sky],
  ["depart-rive", 0.12, riviere.rive],
  ["depart-eau", 0.3, () => riviere.water("paper", riviere.RIVE)],
  ["depart-plage", 0.6, () => riviere.plage() + riviere.panneau(74, 666, content.aventures.intros.canoe.depart)],
];
// the descent from Carsac, back to front, behind the canoe (paper only)
const DESCENT = [
  ["descente-ciel", 0.04, riviere.sky],
  ["descente-fond", 0.12, () => riviere.lointain() + chateaux.domme() + chateaux.montfort()],
  ["descente-eau", 0.35, riviere.fuyante],
  ["descente-rives", 0.6, riviere.berges],
];
const LAUNCH_SPOT = { x: 205, y: 664 }; // where the canoe spins round, on the water off the beach
const CANOE = 170; // units: the canoe's height there
// the two of them on the beach: [view, offset from that spot (units), scale]; the dive comes close on their feet
const ON_BEACH = [["pagaies", 20, 58, 1.15], ["monte", 45, 48, 1.1]];
const FEET = { x: 225, y: 640 };
// the heads in bubbles over the canoe from the front: Cycy's over its bow (on the left), Kevin's over its stern
const BUBBLES = [
  ["bulle-cycy", { x: 126, y: 428 }, { x: 173, y: 508 }],
  ["bulle-kevin", { x: 290, y: 424 }, { x: 241, y: 504 }],
];
const BRIDGE = { from: 0.5, to: 7 }; // the zoom of Vitrac's bridge, far off at the start of the descent, passing over at its end

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const { relais } = trajet;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const draw = (list, skins) => list.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: skins ? markup("poster") : undefined }));

  // back to front: the river, the launch, the descent, the valley's map, the South-West's map (each hidden under the one
  // before it, until it leaves); a scene is the list of its layers' elements
  // 1. the river, and the canoe in front of Beynac's cliff for the poster
  const riverLayers = draw(RIVER, true);
  const crowd = stage.layer("riviere-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: crowd, who: "duo", looks: { falaise: scene("cycy-et-kevin-en-canoe", 11) }, look: "falaise", x: 195, y: 716, height: 240 });
  const river = [...riverLayers.map((layer) => layer.el), crowd];

  // 2. the launch at Carsac: the beach and its sign; the two of them with their paddles, then getting in, then the canoe
  // on the water from the front and the back; their heads in bubbles over it
  const launchDecor = draw(LAUNCH).map((layer) => layer.el);
  const launchCrowd = stage.layer("depart-gens", { depth: 0.6 }); // settles with the beach, then stays
  const canoe = sceneActor({
    layer: launchCrowd,
    who: "duo",
    looks: { pagaies: scene("cycy-et-kevin-en-canoe", 10), monte: scene("cycy-et-kevin-en-canoe", 7), face: scene("cycy-et-kevin-en-canoe", 2), dos: scene("cycy-et-kevin-en-canoe", 5) },
    look: "pagaies",
    ...LAUNCH_SPOT,
    height: CANOE,
  });
  const vest = (who, k, pose) => scene(`${who}-en-gilet-de-sauvetage`, k, who, pose);
  const faces = { "bulle-cycy": { question: vest("cycy", 5, "question"), colere: vest("cycy", 2, "colere") }, "bulle-kevin": { pleurs: vest("kevin", 3, "pleurs") } };
  const [cycy, kevin] = BUBBLES.map(([who, at, tail]) => faceBubble({ layer: launchCrowd, who, looks: faces[who], look: Object.keys(faces[who])[0], ...at, size: 84, tail }));
  launchDecor.push(paperLayer({ stage, name: "depart-arbres", paper: riviere.trees("paper") }).el); // leaning over them, in front
  const launchScene = [...launchDecor, launchCrowd];

  // 3. the descent: the river going away to its bend, the canoe from the back; in front of it, the trees leaning over
  // the river (passing by on the sides) and Vitrac's bridge
  const descentDecor = draw(DESCENT).map((layer) => layer.el);
  const descentCrowd = stage.layer("descente-gens", { depth: 0 });
  const away = sceneActor({ layer: descentCrowd, who: "duo", looks: { dos: scene("cycy-et-kevin-en-canoe", 5) }, look: "dos", x: 195, y: 706, height: 150 });
  const trees = paperLayer({ stage, name: "descente-arbres", depth: 1.5, paper: riviere.penches() }).el;
  const bridge = paperLayer({ stage, name: "descente-pont", width: 3200, paper: riviere.pont() }).el; // still wide once far off
  const descentScene = [...descentDecor, descentCrowd, trees, bridge];

  // 4. the valley's map from Port d'Enveaux to Carsac, its road for the bus
  const valley = [
    paperLayer({ stage, name: "vallee-carte", paper: perigord.valleyMap({ depart: trajet.arrivee, arrivee: relais.arrivee, noms: relais.noms }) }).el,
    stage.layer("vallee-trajet"),
  ];
  const [bx, by] = perigord.VALLEY_ROUTE[0];
  const bus = paperVehicle({ layer: valley[1], name: relais.transport, markup: perigord.BUS, x: bx, y: by, width: 58 });

  // 5. the South-West's map, on east to the Périgord: its vines and woods, the Dordogne, the P at the arrival
  const road = trajet.points.map(project).map(({ x, y }) => [x, y]);
  const clear = carte.stops({ trajet, lieu }, project).map((s) => s.box);
  const end = project(trajet.points.at(-1));
  const regional = [
    carte.ocean(project),
    carte.land(project, { road, dordogne: false }),
    perigord.dordogne(project),
    perigord.vignes(project, { road, clear }),
    perigord.bois(project, { road, clear }),
    carte.landes(project, { road, clear }),
    carte.pyrenees(project),
    perigord.parking(end.x + 22, end.y - 4), // beside the pin
  ].join("");
  const map = [paperLayer({ stage, name: "carte", paper: regional }).el, stage.layer("carte-trajet")];
  const start = project(trajet.points[0]);
  const c3 = vehicle({ stage, layer: map[1], name: "c3", x: start.x, y: start.y, width: 60, view: "roule" });

  hide([...river, ...launchScene, ...descentScene, ...valley, duo.el]);
  stage.el.style.setProperty("--st-whole", "1"); // the maps in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in

  // 1. the map: the C3 from Bordeaux to Port d'Enveaux; the camera dives onto it, and the bus goes on to Carsac
  const launch = beat("La mise à l'eau");
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car: c3, trajet, lieu, project, duration: RELAY });
  recipes.relais(timeline, RELAY, { stage, from: { layers: map, x: end.x, y: end.y }, layers: valley, vehicle: bus, route: perigord.VALLEY_ROUTE, duration: launch - RELAY });

  // 2. the launch: the camera dives onto Carsac's pin and comes close on the beach, framed on the action band; the two
  // of them with their paddles by the sign, then Kevin helps Cycy in
  const [px, py] = perigord.VALLEY_ROUTE.at(-1);
  recipes.plonge(timeline, launch, { stage, from: { layers: valley, x: px, y: py }, layers: launchScene, to: FEET });
  stage.frame(timeline, launch, { whole: false, duration: 0.45 });
  /** The canoe into its view `key` at `at` s: squeezed to nothing and back, a sticker turned over. */
  const flip = (at, key) => {
    timeline.to(canoe.turn, { scaleX: 0, duration: 0.08, ease: "power1.in" }, at);
    canoe.show(timeline, at + 0.08, key);
    timeline.to(canoe.turn, { scaleX: 1, duration: 0.1, ease: "power1.out" }, at + 0.08);
  };
  const [[, dx, dy, scale], [aboard, ...where]] = ON_BEACH;
  timeline.set(canoe.el, { x: dx, y: dy, scale }, launch);
  const getIn = launch + 1.1; // the beach settled, the two of them standing still in the middle of the moment
  flip(getIn, aboard);
  timeline.to(canoe.el, { x: where[0], y: where[1], scale: where[2], duration: 0.3, ease: "power2.out" }, getIn);
  stage.sound(timeline, getIn + 0.12, "paddle");

  // 3. the rounds: the canoe paddles off from the front onto the water and spins round twice, eddies under it, dizzy
  // over it; it stops, Cycy puzzled then cross over its bow, Kevin in tears over its stern; a last half-turn, and it
  // goes off straight to the right in its drops
  const rounds = beat("Les ronds dans l'eau");
  const descent = beat("La descente");
  flip(rounds, "face");
  timeline.to(canoe.el, { x: 0, y: 0, scale: 1, duration: 0.7, ease: "power2.inOut" }, rounds);
  stage.pan(timeline, rounds, { x: 50, duration: 0.9, ease: "power2.inOut", only: launchDecor });
  const views = ["face", "dos"];
  const stop = eau.tourne(timeline, rounds + 0.2, { actor: canoe, layer: launchCrowd, faces: views, turns: 2, duration: 1.7 });
  eau.flotte(timeline, rounds, { actor: canoe, duration: stop - rounds });
  cycy.pop(timeline, stop);
  kevin.pop(timeline, stop + 0.05);
  cycy.show(timeline, stop + 0.55, "colere");
  kevin.leave(timeline, stop + 0.92);
  const gone = cycy.leave(timeline, stop + 0.96);
  eau.flotte(timeline, stop, { actor: canoe, duration: gone - stop, strokes: false });
  const straight = eau.tourne(timeline, gone, { actor: canoe, layer: launchCrowd, faces: views, turns: 0.5, duration: 0.36 });
  eau.flotte(timeline, gone, { actor: canoe, duration: descent - gone });
  timeline.to(canoe.el, { x: 150, y: -28, scale: 0.84, duration: descent - straight, ease: "power1.in" }, straight);
  stage.pan(timeline, straight, { x: 70, duration: descent - straight, ease: "power1.in", only: launchDecor });

  // 4. the descent: the canoe from the back paddles down the river as it glides towards it, the leaning trees passing by
  // on the sides, Domme and Montfort far off; Vitrac's bridge comes from the bend and passes over the canoe
  const lunch = beat("Le coin perdu");
  timeline.fromTo(descentScene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, descent);
  timeline.set(launchScene, { autoAlpha: 0 }, descent + 0.3);
  eau.rame(timeline, descent, { stage, actor: away, layers: [...descentDecor, trees], duration: lunch - descent, focus: riviere.BEND });
  stage.pan(timeline, descent, { zoom: BRIDGE.from, focus: riviere.BEND, duration: 0, only: [bridge] });
  stage.pan(timeline, descent, { zoom: BRIDGE.to, focus: riviere.BEND, duration: lunch - descent, ease: "power3.in", only: [bridge] });

  // 5 to 9. the river on a summer day, framed on the action band; the day's scenes come in front of it
  timeline.set(river, { autoAlpha: 1 }, lunch);
  timeline.to(descentScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, lunch);

  // 10. the poster on the river: Beynac on its cliff, the canoe gliding in front of it
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  timeline.fromTo(duo.pose, { y: 0 }, { y: -3, duration: 0.5, ease: "sine.inOut", repeat: 3, yoyo: true, immediateRender: false }, poster + 0.3); // afloat
  recipes.affiche(timeline, poster, { stage, layers: riverLayers, aventure, grain: texture, only: river });

  const actors = [c3, bus, canoe, cycy, kevin, away, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
