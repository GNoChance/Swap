// The Premier canoë's intro (the canoe's spec, § 2): the map in two steps (the C3 from Bordeaux along the Dordogne to
// the P of Port d'Enveaux; the camera dives onto it and the valley's illustrated map shows, the rental's little bus
// honks and drives up it to Carsac); the camera dives onto Carsac's beach, where the two of them stand with their
// paddles by the sign and Kevin helps Cycy in; the canoe paddles off and spins round and round, Cycy puzzled then
// cross and Kevin in tears in their bubbles, then it goes off straight; down the river under the leaning trees, Domme
// and Montfort far off, under Vitrac's bridge; lunch side by side at a table under a tree on a gravel bank, their views
// changing together; in the golden light between Castelnaud and Beynac, Kevin jumps out of the canoe into the river,
// splash, Cycy laughing, and another canoe at the back laughing too; at Port d'Enveaux, thumbs up by the finish board,
// the C3 all hearts, and off they go; the river on a summer day under Beynac's cliff, then the closing poster
// « LA DORDOGNE » on the river, the canoe in front of the cliff. Its moments are the beats of intros/index.js; its
// stickers, canoe.stickers.js. The river is the plouf's decor, and shows alone from Sarlat to the poster.
import { content } from "../../content.js";
import { createStage, ENTER, HIDDEN, layerX } from "../scene/stage.js";
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
/** A <span> of class `cls` holding `markup`. */
const span = (cls, markup = "") => Object.assign(document.createElement("span"), { className: cls, innerHTML: markup });
/** `el` at left, top (px in its box). → el */
function placed(el, left, top) {
  Object.assign(el.style, { left: `${left}px`, top: `${top}px` });
  return el;
}
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
// the start's signpost on Carsac's beach (its post's foot), and the middle of its plank: the camera keeps it whole
const SIGN = { x: 78, y: 666 };
const SIGN_PLANK = { x: 80, y: 585 };
// the launch at Carsac, back to front (paper only)
const LAUNCH = [
  ["depart-ciel", 0.04, riviere.sky],
  ["depart-rive", 0.12, riviere.rive],
  ["depart-eau", 0.3, () => riviere.water("paper", riviere.RIVE)],
  ["depart-plage", 0.6, () => riviere.plage() + riviere.panneau(SIGN.x, SIGN.y, content.aventures.intros.canoe.depart)],
];
// the descent from Carsac, back to front, behind the canoe (paper only)
const DESCENT = [
  ["descente-ciel", 0.04, riviere.sky],
  ["descente-fond", 0.12, () => riviere.lointain() + chateaux.domme() + chateaux.montfort()],
  ["descente-eau", 0.35, riviere.fuyante],
  ["descente-rives", 0.6, riviere.berges],
];
const LAUNCH_SPOT = { x: 215, y: 640 }; // where the canoe spins round, on the water off the beach
const CANOE = 170; // units: the canoe's height there
// the two of them on the beach: [view, offset from that spot (units), scale]
const ON_BEACH = [["pagaies", 10, 82, 1.15], ["monte", 35, 72, 1.1]];
const CLOSE_ON = { x: 110, y: 640 }; // the dive comes close on the beach there: the sign whole all along on a phone
// the heads in bubbles over the canoe from the front: Cycy's over its bow (on the left), Kevin's over its stern
const BUBBLES = [
  ["bulle-cycy", { x: 136, y: 404 }, { x: 183, y: 484 }],
  ["bulle-kevin", { x: 300, y: 400 }, { x: 251, y: 480 }],
];
const BRIDGE = { from: 0.5, to: 7 }; // the zoom of Vitrac's bridge, far off at the start of the descent, passing over at its end
// the lunch, back to front (paper only); the two of them stand on the table's front edge (riviere.TABLE)
const LUNCH = [
  ["coin-ciel", 0.04, riviere.sky],
  ["coin-fond", 0.12, () => riviere.hills("paper", false)], // its trees light to draw
  ["coin-eau", 0.3, () => riviere.water("paper")],
  ["coin-rive", 0.6, () => riviere.graviers() + riviere.tablee()],
];
// side by side at the table, their gingham cloths meeting: [who, x, height]. Kevin's stickers show more of him (600 ×
// ≈ 820 against Cycy's 600 × ≈ 580): his ≈ 0.85 as wide as hers, so that their heads and their cloths' checks are at one
// scale
const AT_TABLE = [["cycy", 133, 160], ["kevin", 266, 192]]; // overlapping ≈ 20 units: no white rim between the cloths
// their views at the same time, about every 0.7 s from the lunch's start: [view, s, Cycy's sticker, Kevin's] (the bite,
// a fry, the empty plate and thumbs up, the hand on the belly); none turning over in the moment's middle
const MEAL = [["croc", 0, 1, 2], ["frite", 0.6, 3, 3], ["assiette", 1.25, 11, 11], ["ventre", 1.95, 10, 10]];
const TABLE_FOCUS = { x: 195, y: 640 };
// the plouf, on the river between Castelnaud and Beynac: the canoe in front of the cliff, Kevin's leap from his seat
// into the river, the canoe drifting right, the laughing canoe on the far water out from behind the islet; on a phone
// held sideways, the frame between the action band and the whole stage (both castles whole)
const AFLOAT = { x: 165, y: 700, height: 210 };
const LEAP = { x: 200, y: 640, height: 140, to: { x: 236, y: 684 } }; // its splash in the safe zone, clear of the screen's corners
const ADRIFT = 38;
const GALLERY = { y: 478, from: 520, to: -170 };
const GOLDEN_FRAME = 0.35;
// the arrival at Port d'Enveaux, back to front (paper only): the two of them on the pebbles, the C3 on the parking,
// the finish board between them
const ARRIVAL = [
  ["arrivee-ciel", 0.04, riviere.sky],
  ["arrivee-fond", 0.12, () => riviere.hills("paper", false)],
  ["arrivee-eau", 0.3, () => riviere.water("paper")],
];
const LANDED = { x: 125, y: 712, height: 175 };
const PARKED = { x: 292, y: 615, width: 130 };
const FINISH = { x: 172, y: 552 };

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const { relais } = trajet;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const draw = (list, skins) => list.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: skins ? markup("poster") : undefined }));
  /** The golden light over what is under it (its layer `name`, the camera never moves it): GSAP fades it. */
  const veil = (name) => {
    const el = stage.layer(name, { depth: 0 });
    el.classList.add("st-veil", "st-veil--dore");
    return el;
  };

  // back to front: the river (with the plouf), the arrival, the lunch, the launch, the descent, the valley's map, the
  // South-West's map (each hidden under the one before it, until it leaves); a scene is the list of its layers' elements
  // 1. the river and the canoe in front of Beynac's cliff for the poster; among its layers, each at its depth's place,
  // those of the plouf: its golden sky over the summer one, Castelnaud on its hill behind Beynac's village, and on the
  // far water (behind the near banks) the laughing canoe and the islet it comes out from behind
  const [summer] = draw(RIVER.slice(0, 1), true); // the sky
  const gold = paperLayer({ stage, name: "riviere-or", depth: 0.04, paper: riviere.cielDore() }).el;
  const [hills] = draw(RIVER.slice(1, 2), true);
  const castle = paperLayer({ stage, name: "riviere-castelnaud", depth: 0.15, paper: chateaux.castelnaud() }).el;
  const cliffAndWater = draw(RIVER.slice(2, 4), true);
  const galleryLayer = stage.layer("plouf-galerie", { depth: 0.3 });
  const islet = paperLayer({ stage, name: "plouf-ilot", depth: 0.3, paper: riviere.ilot() }).el;
  const riverLayers = [summer, hills, ...cliffAndWater, ...draw(RIVER.slice(4), true)]; // then the banks, the leaning trees
  const crowd = stage.layer("riviere-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: crowd, who: "duo", looks: { falaise: scene("cycy-et-kevin-en-canoe", 11) }, look: "falaise", x: 195, y: 716, height: 240 });
  const river = [...riverLayers.map((layer) => layer.el), crowd];
  const vest = (who, k, pose) => scene(`${who}-en-gilet-de-sauvetage`, k, who, pose);

  // 2. the plouf on the river (its leaning trees left out): the canoe in front of the cliff, then Cycy alone in it,
  // then the splash scene; Kevin in his life jacket jumping in; the golden light over the land and the water
  const ploufCrowd = stage.layer("plouf-gens", { depth: 0.7 });
  const afloat = sceneActor({
    layer: ploufCrowd,
    who: "duo",
    looks: { falaise: scene("cycy-et-kevin-en-canoe", 11), seule: vest("cycy", 10, "joie"), eclaboussure: scene("cycy-et-kevin-en-canoe", 4) },
    look: "falaise",
    ...AFLOAT,
  });
  const jumper = sceneActor({ layer: ploufCrowd, who: "kevin", looks: { surprise: vest("kevin", 9, "surprise") }, look: "surprise", ...LEAP });
  const golden = veil("plouf-dore");
  // the laughing canoe: its laughers on their seats (6 units over its keel), its hull in front of them
  const gallery = riviere.galerie();
  const laughers = gallery.laughers.map((markup, k) => placed(span("st-galerie__rieur", markup), gallery.seats[k] - 14, -38));
  const boat = placed(span("st-galerie"), layerX(galleryLayer, GALLERY.from), GALLERY.y);
  boat.append(...laughers, placed(span("st-galerie__coque", gallery.hull), -48, -18));
  galleryLayer.append(boat);
  const ploufMoved = [...river.filter((el) => el !== riverLayers.at(-1).el && el !== crowd), gold, castle, galleryLayer, islet, ploufCrowd]; // its leaning trees left out
  const ploufScene = [...ploufMoved, golden];
  const fading = [gold, golden]; // the golden light comes

  // 3. the arrival at Port d'Enveaux: the shore, the grass and the parking, the finish board; the two of them thumbs up
  // on the pebbles, the C3 all hearts on the parking (facing right, the way it leaves); the golden light, fainter
  const arrivalDecor = [...draw(ARRIVAL).map((layer) => layer.el), paperLayer({ stage, name: "arrivee-sol", depth: 0.6, paper: riviere.herbe() + riviere.pancarte(FINISH.x, FINISH.y, content.aventures.intros.canoe.arrivee) }).el];
  const arrivalCrowd = stage.layer("arrivee-gens", { depth: 0.6 });
  const waiting = vehicle({ layer: arrivalCrowd, name: "c3", ...PARKED, view: "coeurs" });
  waiting.turn.classList.add("is-flipped");
  const landed = sceneActor({ layer: arrivalCrowd, who: "duo", looks: { pouces: scene("cycy-et-kevin-en-canoe", 8) }, look: "pouces", ...LANDED });
  const dusk = veil("arrivee-dore");
  const arrivalScene = [...arrivalDecor, arrivalCrowd];

  // 4. the lunch on a gravel bank, the table under its tree; the two of them side by side at it
  const lunchDecor = draw(LUNCH).map((layer) => layer.el);
  const lunchCrowd = stage.layer("coin-gens", { depth: 0.6 });
  const meal = (who, k) => scene(`${who}-qui-mange`, k, who);
  const diners = AT_TABLE.map(([who, x, height]) =>
    sceneActor({ layer: lunchCrowd, who: `repas-${who}`, looks: Object.fromEntries(MEAL.map(([view, , c, k]) => [view, meal(who, who === "cycy" ? c : k)])), look: MEAL[0][0], x, y: riviere.TABLE.y, height }),
  );
  const lunchScene = [...lunchDecor, lunchCrowd];

  // 5. the launch at Carsac: the beach and its sign; the two of them with their paddles, then getting in, then the canoe
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
  const faces = { "bulle-cycy": { question: vest("cycy", 5, "question"), colere: vest("cycy", 2, "colere") }, "bulle-kevin": { pleurs: vest("kevin", 3, "pleurs") } };
  const [cycy, kevin] = BUBBLES.map(([who, at, tail]) => faceBubble({ layer: launchCrowd, who, looks: faces[who], look: Object.keys(faces[who])[0], ...at, size: 84, tail }));
  launchDecor.push(paperLayer({ stage, name: "depart-arbres", paper: riviere.trees("paper") }).el); // leaning over them, in front
  const launchScene = [...launchDecor, launchCrowd];

  // 6. the descent: the river going away to its bend, the canoe from the back; in front of it Vitrac's bridge, and in
  // front of all the trees leaning over the river (passing by on the sides)
  const descentDecor = draw(DESCENT).map((layer) => layer.el);
  const descentCrowd = stage.layer("descente-gens", { depth: 0 });
  const away = sceneActor({ layer: descentCrowd, who: "duo", looks: { dos: scene("cycy-et-kevin-en-canoe", 5) }, look: "dos", x: 195, y: 706, height: 150 });
  const bridge = paperLayer({ stage, name: "descente-pont", width: 3200, paper: riviere.pont() }).el; // still wide once far off
  const trees = paperLayer({ stage, name: "descente-arbres", depth: 1.5, paper: riviere.penches() }).el;
  const descentScene = [...descentDecor, descentCrowd, bridge, trees];

  // 7. the valley's map from Port d'Enveaux to Carsac, its road for the bus
  const valley = [
    paperLayer({ stage, name: "vallee-carte", paper: perigord.valleyMap({ depart: trajet.arrivee, arrivee: relais.arrivee, noms: relais.noms }) }).el,
    stage.layer("vallee-trajet"),
  ];
  const [bx, by] = perigord.VALLEY_ROUTE[0];
  const bus = paperVehicle({ layer: valley[1], name: relais.transport, markup: perigord.BUS, x: bx, y: by, width: 58 });

  // 8. the South-West's map, on east to the Périgord: its vines and woods, the Dordogne, the P at the arrival
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

  hide([...river, castle, ...ploufScene, boat, jumper.el, ...arrivalScene, dusk, ...lunchScene, ...launchScene, ...descentScene, ...valley, duo.el]);
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
  recipes.plonge(timeline, launch, { stage, from: { layers: valley, x: px, y: py }, layers: launchScene, to: CLOSE_ON });
  stage.frame(timeline, launch, { whole: false, duration: 0.45 });
  const [[, dx, dy, scale], [aboard, ...where]] = ON_BEACH;
  timeline.set(canoe.el, { x: dx, y: dy, scale }, launch);
  const getIn = launch + 1.1; // the beach settled, the two of them standing still in the middle of the moment
  canoe.flip(timeline, getIn, aboard);
  timeline.to(canoe.el, { x: where[0], y: where[1], scale: where[2], duration: 0.3, ease: "power2.out" }, getIn);
  stage.sound(timeline, getIn + 0.12, "paddle");

  // 3. the rounds: the canoe paddles off from the front onto the water and spins round twice, eddies under it, dizzy
  // over it; it stops, Cycy puzzled (« ? ») then cross over its bow, Kevin in tears over its stern; a last half-turn,
  // and it goes off straight to the right in its drops. The camera only closes in a little round the sign: it stays whole
  const rounds = beat("Les ronds dans l'eau");
  const descent = beat("La descente");
  canoe.flip(timeline, rounds, "face");
  timeline.to(canoe.el, { x: 0, y: 0, scale: 1, duration: 0.7, ease: "power2.inOut" }, rounds);
  stage.pan(timeline, rounds, { zoom: 1.05, focus: SIGN_PLANK, duration: descent - rounds, ease: "sine.inOut", only: launchDecor });
  const views = ["face", "dos"];
  const stop = eau.tourne(timeline, rounds + 0.2, { actor: canoe, layer: launchCrowd, faces: views, turns: 2, duration: 1.7 });
  eau.flotte(timeline, rounds, { actor: canoe, duration: stop - rounds });
  cycy.pop(timeline, stop);
  cycy.emote(timeline, stop + 0.08, "question", 0.42);
  kevin.pop(timeline, stop + 0.05);
  cycy.show(timeline, stop + 0.55, "colere");
  kevin.leave(timeline, stop + 0.92);
  const gone = cycy.leave(timeline, stop + 0.96);
  eau.flotte(timeline, stop, { actor: canoe, duration: gone - stop, strokes: false });
  const straight = eau.tourne(timeline, gone, { actor: canoe, layer: launchCrowd, faces: views, turns: 0.5, duration: 0.36 });
  eau.flotte(timeline, gone, { actor: canoe, duration: descent - gone });
  timeline.to(canoe.el, { x: 150, y: -28, scale: 0.84, duration: descent - straight, ease: "power1.in" }, straight);

  // 4. the descent: the canoe from the back paddles down the river as it glides towards it, the leaning trees passing by
  // on the sides, Domme and Montfort far off; Vitrac's bridge comes from the bend and passes over the canoe
  const lunch = beat("Le coin perdu");
  timeline.fromTo(descentScene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, descent);
  timeline.set(launchScene, { autoAlpha: 0 }, descent + 0.3);
  eau.rame(timeline, descent, { stage, actor: away, layers: [...descentDecor, trees], duration: lunch - descent, focus: riviere.BEND });
  stage.pan(timeline, descent, { zoom: BRIDGE.from, focus: riviere.BEND, duration: 0, only: [bridge] });
  stage.pan(timeline, descent, { zoom: BRIDGE.to, focus: riviere.BEND, duration: lunch - descent, ease: "power3.in", only: [bridge] });

  // 5. the lunch: the gravel bank and the table under its tree, the glasses clink; the two of them side by side, the
  // bite, a fry, the empty plate and thumbs up, the hand on the belly, both at once, a little hop at each; the camera
  // closes in slowly on the table
  const plouf = beat("Le plouf");
  timeline.set(lunchScene, { autoAlpha: 1 }, lunch);
  timeline.to(descentScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, lunch);
  stage.pan(timeline, lunch, { zoom: 1.05, focus: TABLE_FOCUS, duration: plouf - lunch, ease: "sine.inOut", only: lunchScene });
  stage.sound(timeline, lunch + 0.35, "clink");
  for (const [view, at] of MEAL.slice(1))
    for (const diner of diners) {
      diner.flip(timeline, lunch + at, view);
      timeline.fromTo(diner.pose, { y: 0 }, { y: -6, duration: 0.12, ease: "power2.out", immediateRender: false }, lunch + at + 0.18).to(diner.pose, { y: 0, duration: 0.14, ease: "power2.in" }, lunch + at + 0.3);
    }

  // 6. the plouf, on the river in the golden light (framed so that both castles show on a phone held sideways), the
  // camera drifting: the canoe glides in in front of the cliff; Kevin jumps out of it in his life jacket, surprised, as
  // it shows Cycy alone; splash, and under the splash it turns into the scene of Kevin in the water and Cycy laughing,
  // drifting right; at the back, the laughing canoe comes out from behind the islet and goes by
  const arrival = beat("L'arrivée");
  timeline.set(ploufScene.filter((el) => !fading.includes(el)), { autoAlpha: 1 }, plouf);
  timeline.fromTo(fading, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "sine.inOut", immediateRender: false }, plouf);
  timeline.to(lunchScene, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, plouf);
  stage.frame(timeline, plouf, { whole: GOLDEN_FRAME, duration: 0.5 });
  stage.pan(timeline, plouf, { x: 8, zoom: 1.04, focus: { x: 195, y: 560 }, duration: arrival - plouf, ease: "sine.inOut", only: ploufMoved });
  const jump = plouf + 0.6;
  timeline.fromTo(afloat.el, { x: -40 }, { x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, plouf);
  eau.flotte(timeline, plouf, { actor: afloat, duration: jump - plouf });
  afloat.show(timeline, jump, "seule");
  eau.plouf(timeline, jump, { jumper, to: LEAP.to, layer: ploufCrowd });
  const splashed = jump + 0.65; // under the splash
  afloat.flip(timeline, splashed, "eclaboussure");
  eau.flotte(timeline, jump, { actor: afloat, duration: arrival - jump, strokes: false });
  timeline.fromTo(afloat.el, { x: 0 }, { x: ADRIFT, duration: arrival - splashed, ease: "sine.inOut", immediateRender: false }, splashed);
  const laugh = plouf + 1.4;
  const covered = arrival + 0.3; // the plouf hidden under the arrival
  timeline.set(boat, { autoAlpha: 1 }, laugh);
  timeline.fromTo(boat, { x: 0 }, { x: GALLERY.to - GALLERY.from, duration: covered - laugh, ease: "none", immediateRender: false }, laugh);
  timeline.fromTo(boat, { y: 0 }, { y: -1.6, duration: 0.42, ease: "sine.inOut", repeat: 4, yoyo: true, immediateRender: false }, laugh);
  laughers.forEach((el, k) => timeline.fromTo(el, { rotation: k ? 14 : -12 }, { rotation: k ? -12 : 14, duration: 0.17, ease: "sine.inOut", repeat: 11, yoyo: true, immediateRender: false }, laugh));

  // 7. the arrival: the landing at Port d'Enveaux settles over the plouf, framed on the action band, in a fainter golden
  // light; the two of them thumbs up by their canoe, the finish board; the C3 swells with its hearts and bounces; they hop
  // into it and off it goes to the right, its engine purring. The river behind, back at rest for the poster
  const sarlat = beat("Sarlat");
  timeline.fromTo(arrivalScene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, arrival);
  timeline.fromTo(dusk, { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 0.3, ease: "power1.out", immediateRender: false }, arrival);
  timeline.set([...ploufScene, boat], { autoAlpha: 0 }, covered);
  stage.pan(timeline, covered, { duration: 0, only: ploufMoved });
  stage.frame(timeline, arrival, { whole: false, duration: 0.4 });
  stage.pan(timeline, arrival, { zoom: 1.06, duration: 0, only: arrivalScene });
  stage.pan(timeline, arrival, { zoom: 1, duration: 0.8, ease: "power2.out", only: arrivalScene });
  const hearts = arrival + 0.35;
  timeline.fromTo(waiting.pose, { scale: 1 }, { scale: 1.14, duration: 0.14, ease: "power2.out", immediateRender: false }, hearts).to(waiting.pose, { scale: 1, duration: 0.34, ease: "back.out(3)" }, hearts + 0.14);
  waiting.bounce(timeline, hearts, 0.36);
  stage.sound(timeline, hearts, "pop");
  const hop = arrival + 1.06; // after the moment's middle
  timeline.fromTo(landed.pose, { y: 0 }, { y: -12, duration: 0.12, ease: "power2.out", immediateRender: false }, hop).to(landed.pose, { y: 0, duration: 0.1, ease: "power2.in" }, hop + 0.12);
  timeline.fromTo(landed.el, { x: 0, y: 0, scale: 1, autoAlpha: 1 }, { x: (PARKED.x - LANDED.x) * 0.8, y: PARKED.y - LANDED.y - 20, scale: 0.35, autoAlpha: 0, duration: 0.22, ease: "power2.in", immediateRender: false }, hop + 0.16); // into the car
  const leave = arrival + 1.4;
  waiting.view(timeline, leave, "roule");
  waiting.drive(timeline, leave, { fromX: PARKED.x, toX: PARKED.x + 640, duration: 0.7, ease: "power2.in" });
  waiting.bounce(timeline, leave, 0.6);
  waiting.smoke(timeline, leave + 0.05, 3);
  stage.sound(timeline, leave, "engine", sarlat + 0.1);

  // 8 and 9. the river on a summer day, framed on the action band, until Sarlat and La Roque-Gageac come in front of it
  timeline.set(river, { autoAlpha: 1 }, sarlat);
  timeline.to([...arrivalScene, dusk], { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, sarlat);

  // 10. the poster on the river: Beynac on its cliff, the canoe gliding in front of it
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  timeline.fromTo(duo.pose, { y: 0 }, { y: -3, duration: 0.5, ease: "sine.inOut", repeat: 3, yoyo: true, immediateRender: false }, poster + 0.3); // afloat
  recipes.affiche(timeline, poster, { stage, layers: riverLayers, aventure, grain: texture, only: river });

  const actors = [c3, bus, canoe, cycy, kevin, away, ...diners, afloat, jumper, waiting, landed, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
