// The Premier bivouac's intro (spec § 5): the map (the Seat from Bordeaux to the Ayous lakes), the camera diving onto
// its pin, the parking in the Ossau valley (the Seat arrives, Cycy and Kevin come out), the walk up the mountain path
// (the firs, screes and névés passing by, the border collie crossing), up there by the lake (the tent unfolding, the
// two of them turning round and jumping for joy, the sky turning from sunset to night to sunrise), the way down (Kevin
// and his blocked back, overtaken by a snail, Cycy waiting for him), the car back in the valley among the cows until the
// collie moves them, then the closing poster « LACS D'AYOUS » on the lake. Its moments are the beats of
// intros/index.js; its stickers, bivouac-1.stickers.js.
import { createStage, ENTER, H, W } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { person, preload, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import * as props from "../scene/props.js";
import * as carte from "../scene/props-carte.js";
import * as vallee from "../scene/props-vallee.js";
import * as montagne from "../scene/props-montagne.js";
import * as lac from "../scene/props-lac.js";
import { cow, dog, snail } from "../scene/props-animaux.js";
import * as recipes from "../scene/recipes.js";
import { SCENARIOS } from "./index.js";

export { stickers } from "./bivouac-1.stickers.js";

const gsap = window.gsap;
const beat = (name) => SCENARIOS["bivouac-1"].beats.find((b) => b.name === name).at;
const MAP = { at: { x: 199, y: 161 }, unitsPerDegree: 258 }; // Bordeaux (its first point) there, 258 units a degree
const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles
const hide = (els) => els.forEach((el) => Object.assign(el.style, HIDDEN));

// the lake's layers, back to front: [name, depth (its share of the camera's moves), its markup in a skin]; the night's
// and the dawn's skies go between its sun and its peak
const LAKE_SKY = [
  ["ciel", 0.04, (skin) => props.sky(skin) + props.clouds(skin)],
  ["soleil", 0.04, (skin) => props.sun(skin)],
];
const LAKE_LAND = [
  ["pic", 0.15, (skin) => props.ridge(skin) + props.ossau(skin)],
  ["sapins", 0.26, (skin) => props.shores(skin)],
  ["refuge", 0.26, (skin) => props.refuge(336, 354, skin)],
  ["lac", 0.3, (skin) => props.lake(skin)],
  ["prairie", 0.55, (skin) => props.meadow(skin) + props.stream(skin)],
  ["neves", 0.55, (skin) => props.neves(skin)],
  ["tente", 0.7, (skin) => (skin === "poster" ? props.tent(skin) : "")], // the paper tent unfolds (props-lac.js)
  ["devant", 1, (skin) => props.foreground(skin)],
];
// the valley's, paper only
const VALLEY_LAYERS = [
  ["vallee-ciel", 0.05, vallee.sky],
  ["vallee-monts", 0.15, vallee.mountains],
  ["vallee-pentes", 0.35, vallee.slopes],
  ["vallee-prairie", 0.7, vallee.meadow],
];
// the path's, paper only: the near ones (depth over 1) pass by on the sides as they walk up
const PATH_LAYERS = [
  ["sentier-fond", 0.08, montagne.fond],
  ["sentier-cirque", 0.4, montagne.cirque],
  ["sentier-pente", 1, montagne.pente],
  ["sentier-roches", 1.5, montagne.roches],
  ["sentier-sapins", 2.2, montagne.sapins],
];
// the cows lying round the Seat (it parks at x 205): [x, y, size, facing, the way it walks off]
const HERD = [
  [66, 648, 0.74, "right", -1],
  [342, 650, 0.74, "left", 1],
  [100, 716, 0.88, "right", -1],
  [312, 720, 0.88, "left", 1],
  [-130, 690, 0.84, "right", -1],
  [540, 694, 0.84, "left", 1],
];

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const outing = aventure.id;
  const draw = (list, skins) => list.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: skins ? markup("poster") : undefined }));

  // back to front: the lake, the path, the valley, the map (each scene hidden under the one before it, until it
  // leaves; the path fades in over the lake, the valley over the path); a scene is the list of its layers' elements
  // 1. the lake: its sky, the night's and the dawn's, its land, its people, the sunset's and the night's light over all
  const [sky, sun] = draw(LAKE_SKY, true);
  const night = paperLayer({ stage, name: "nuit", depth: 0.04, paper: lac.nightSky() });
  const dawn = paperLayer({ stage, name: "aube", depth: 0.04, paper: lac.dawnSky() });
  const land = draw(LAKE_LAND, true);
  const tentLayer = land.find((layer) => layer.el.dataset.layer === "tente");
  const tent = lac.tentUnfold({ layer: tentLayer.el });
  tentLayer.paper = [tentLayer.paper, tent.el]; // the poster covers the unfolded tent too
  const lakeCrowd = stage.layer("lac-gens", { depth: 0.9 });
  const lakePeople = [
    person({ stage, layer: lakeCrowd, outing, who: "cycy", x: 168, y: 712, height: 108, side: "dos" }),
    person({ stage, layer: lakeCrowd, outing, who: "kevin", x: 262, y: 716, height: 112, side: "dos" }),
  ];
  const veils = ["chaud", "nuit"].map((name) => {
    const el = stage.layer(`lac-${name}`);
    el.classList.add("st-veil", `st-veil--${name}`);
    return el;
  });
  const [warm, dark] = veils;
  const starry = lac.stars({ layer: night.el });
  const sunrise = lac.dawnSun({ layer: dawn.el, x: 336, y: 228 });
  const lark = lac.bird({ layer: dawn.el, x: 30, y: 214 });
  const lakePoster = [sky, sun, ...land];
  const lake = [...lakePoster.map((layer) => layer.el), lakeCrowd];
  const nightfall = [night.el, dawn.el, ...veils]; // shown only while the sky turns

  // 2. the path: its layers (the dog, Kevin and the snail on the slope), the walkers in front
  const path = draw(PATH_LAYERS).map((layer) => layer.el);
  const slope = path[2];
  const pathCrowd = stage.layer("sentier-gens");
  const walkers = [
    person({ stage, layer: pathCrowd, outing, who: "cycy", x: 150, y: 724, height: 104, side: "dos" }),
    person({ stage, layer: pathCrowd, outing, who: "kevin", x: 240, y: 726, height: 108, side: "dos" }),
  ];
  const collie = dog({ layer: slope, x: 360, y: 528, size: 0.62 });
  const [top, bottom] = [montagne.TRAVERSE.from, montagne.TRAVERSE.to];
  const slowpoke = person({ stage, layer: slope, outing, who: "kevin", x: top[0], y: top[1], height: 66, pose: "pleurs" });
  const escargot = snail({ layer: slope, x: top[0] + 22, y: top[1] - 6, size: 0.9 });
  const waiting = person({ stage, layer: pathCrowd, outing, who: "cycy", x: 98, y: 722, height: 138 });
  const pathScene = [...path, pathCrowd];

  // 3. the valley: the parking, then the cows round the car and the collie
  const valley = draw(VALLEY_LAYERS).map((layer) => layer.el);
  const valleyCrowd = stage.layer("vallee-gens", { depth: 0.8 });
  const seat = vehicle({ stage, layer: valleyCrowd, name: "seat", x: 205, y: 652, width: 140, view: "roule" });
  const parkingPeople = [
    person({ stage, layer: valleyCrowd, outing, who: "cycy", x: 88, y: 696, height: 108 }), // either side of it, in front
    person({ stage, layer: valleyCrowd, outing, who: "kevin", x: 314, y: 700, height: 112 }),
  ];
  const herd = HERD.map(([x, y, size, facing]) => cow({ layer: valleyCrowd, x, y, size, facing }));
  const shepherd = dog({ layer: valleyCrowd, x: 205, y: 712, size: 0.8 });
  valley.push(valleyCrowd, paperLayer({ stage, name: "vallee-devant", depth: 1, paper: vallee.foreground() }).el);

  // 4. the map
  const stopsOnMap = carte.stops({ trajet, lieu }, project);
  const road = trajet.points.map(project).map(({ x, y }) => [x, y]);
  const map = [
    paperLayer({ stage, name: "carte", paper: carte.ocean(project) + carte.land(project, { road }) + carte.landes(project, { road, clear: stopsOnMap.map((s) => s.box) }) + carte.pyrenees(project) }).el,
    stage.layer("carte-trajet"),
  ];
  const start = project(trajet.points[0]);
  const car = vehicle({ stage, layer: map[1], name: "seat", x: start.x, y: start.y, width: 60, view: "roule" });

  hide([...lake, ...nightfall, ...pathScene, ...valley, collie.el, slowpoke.el, escargot.el, waiting.el, shepherd.el, ...herd.map((c) => c.el)]);
  stage.el.style.setProperty("--st-whole", "1"); // the map in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in
  const fadeIn = (els, at) => timeline.to(els, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, at);
  const fadeOut = (els, at) => timeline.to(els, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, at);

  // 1. the map: Bordeaux → the Ayous lakes
  const parking = beat("Le parking");
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car, trajet, lieu, project, duration: parking - beat("La carte") });

  // 2. the camera dives onto the pin, the valley shows through, the Seat arrives and the two of them come out
  const pin = project(trajet.points.at(-1));
  const dive = 4;
  stage.pan(timeline, parking, { x: dive * (pin.x - W / 2), y: dive * (pin.y - H / 2), zoom: dive, duration: 0.45, ease: "power2.in", only: map });
  stage.frame(timeline, parking, { whole: false, duration: 0.45 });
  timeline.set(valley, { autoAlpha: 1 }, parking + 0.05).to(map, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, parking + 0.1);
  recipes.route(timeline, parking, { stage, car: seat, people: parkingPeople, layers: valley });

  // 3. up the path, from the back: the firs, then the screes and névés pass by; the collie trots across
  const montee = beat("La montée");
  const haut = beat("En haut");
  timeline.set(pathScene, { autoAlpha: 1 }, montee);
  fadeOut(valley, montee);
  recipes.marche(timeline, montee, { stage, people: walkers, layers: path, duration: haut - montee - 0.1, focus: montagne.VANISH, grain: texture });
  const trot = montee + 0.55;
  timeline.set(collie.el, { autoAlpha: 1 }, trot).set(collie.el, { autoAlpha: 0 }, trot + 1.3);
  collie.run(timeline, trot, { toX: 10, duration: 1.3 });

  // 4. up there: the lake and the Ossau (in sight on a phone held sideways), the two of them from the back; the tent
  // unfolds, they turn round with joy and jump; the sun sets, the stars come out with the crickets, the sun rises with a
  // bird
  const descente = beat("La descente");
  timeline.set(lake, { autoAlpha: 1 }, haut);
  fadeOut(pathScene, haut);
  stage.frame(timeline, haut, { whole: 0.75, duration: 0.5 }); // the horns in sight; the whole height would show the layers' ends
  stage.pan(timeline, haut, { x: 10, zoom: 1.035, duration: descente - haut, ease: "sine.inOut", only: lake.filter((el) => el !== sun.el).concat(night.el, dawn.el) }); // a slow drift: the paper's depth
  lakePeople.forEach((who, k) => who.bob(timeline, haut + k * 0.06, 0.5));
  stage.sound(timeline, haut + 0.32, "paper");
  tent.unfold(timeline, haut + 0.3);
  lakePeople.forEach((who, k) => {
    who.turn(timeline, haut + 0.75 + k * 0.08, "face", "joie");
    const leap = haut + 0.98 + k * 0.08;
    who.into(timeline, leap, "face", "saut");
    who.into(timeline, who.jump(timeline, leap), "face", "joie");
  });
  const dusk = haut + 1.4;
  timeline.to(sun.el, { y: 150, duration: 0.5, ease: "power1.in" }, dusk);
  timeline.to(warm, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, dusk).to(warm, { autoAlpha: 0, duration: 0.25 }, dusk + 0.4);
  timeline.to([night.el, dark], { autoAlpha: 1, duration: 0.3, ease: "power1.inOut" }, dusk + 0.3);
  starry.light(timeline, dusk + 0.45);
  stage.sound(timeline, dusk + 0.4, "crickets");
  const dawnAt = dusk + 0.92;
  timeline.to(dawn.el, { autoAlpha: 1, duration: 0.35, ease: "power1.inOut" }, dawnAt).to(dark, { autoAlpha: 0, duration: 0.4 }, dawnAt);
  timeline.to(warm, { autoAlpha: 0.7, duration: 0.25 }, dawnAt).to(warm, { autoAlpha: 0, duration: 0.35 }, dawnAt + 0.35);
  sunrise.rise(timeline, dawnAt + 0.05, 0.55);
  lark.fly(timeline, dawnAt + 0.2, { dx: 300, dy: -60, duration: 1.1 });
  stage.sound(timeline, dawnAt + 0.3, "bird");

  // 5. the way down: Kevin, small up the path, bent, at tiny steps, sweating, his back blocked; a snail overtakes him.
  // Cycy hops down to the front, turns towards the slope and waits, tapping her foot
  const voiture = beat("La voiture");
  const down = voiture - descente;
  stage.pan(timeline, descente, { duration: 0, only: path }); // back at the foot of the path
  timeline.set(walkers.map((w) => w.el), { autoAlpha: 0 }, descente).set(slowpoke.el, { autoAlpha: 1 }, descente);
  fadeIn(pathScene, descente);
  stage.frame(timeline, descente, { whole: false, duration: 0.3 });
  timeline.set([...lake, ...nightfall], { autoAlpha: 0 }, descente + 0.35).set(sun.el, { y: 0 }, descente + 0.35); // the lake as it was, for the poster
  const crawl = 2.9; // s: a third of the traverse
  slowpoke.bob(timeline, descente, crawl, { step: 0.3, sway: 2.5, lift: 1.2, lean: -5 });
  timeline.to(slowpoke.el, { x: (bottom[0] - top[0]) / 3, y: (bottom[1] - top[1]) / 3, duration: crawl, ease: "none" }, descente);
  slowpoke.emote(timeline, descente + 0.3, "sweat", down - 0.4);
  slowpoke.emote(timeline, descente + 0.5, "zap", 0.6);
  slowpoke.emote(timeline, descente + 1.45, "zap", 0.8); // as the snail goes by
  const overtake = descente + 0.9;
  timeline.set(escargot.el, { autoAlpha: 1 }, overtake);
  escargot.slide(timeline, overtake, { toX: bottom[0] + 8, toY: bottom[1] - 2, duration: 1.9 });
  const come = descente + 0.15;
  timeline.set(waiting.el, { autoAlpha: 1 }, come);
  timeline.fromTo(waiting.el, { x: 96, y: -150, scale: 0.5 }, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "power1.in", immediateRender: false }, come);
  waiting.hop(timeline, waiting.hop(timeline, come, 14) + 0.01, 10);
  waiting.turn(timeline, descente + 1.1, "dos", "colere");
  waiting.emote(timeline, descente + 1.3, "dots", down - 1.4);
  waiting.stamp(timeline, descente + 1.35, 5);

  // 6. back at the car: the Seat in tears among the cows lying round it, « Meuh ! »; the collie runs in barking, the cows
  // get up and walk off, and the Seat is all hearts
  const poster = beat("L'affiche");
  timeline.set(parkingPeople.map((p) => p.el), { autoAlpha: 0 }, voiture).set(herd.map((c) => c.el), { autoAlpha: 1 }, voiture);
  fadeIn(valley, voiture);
  timeline.set(pathScene, { autoAlpha: 0 }, voiture + 0.35);
  seat.view(timeline, voiture, "trois-quarts-pleurs");
  stage.pan(timeline, voiture, { zoom: 1.05, focus: { x: 205, y: 640 }, duration: poster - voiture, ease: "sine.out", only: valley });
  herd[2].moo(timeline, voiture + 0.25);
  herd[3].moo(timeline, voiture + 0.6, 0.6);
  const rush = voiture + 0.55;
  timeline.set(shepherd.el, { autoAlpha: 1 }, rush);
  shepherd.run(timeline, rush, { fromX: -240, toX: 205, duration: 0.45, ease: "power2.out" });
  shepherd.bark(timeline, rush + 0.45);
  shepherd.bark(timeline, rush + 0.72);
  herd.forEach((c, k) => c.rise(timeline, rush + 0.52 + k * 0.05));
  herd.forEach((c, k) => c.leave(timeline, rush + 0.8 + k * 0.04, { dx: HERD[k][4] * 340, duration: 0.8 }));
  shepherd.run(timeline, rush + 1.0, { fromX: 205, toX: 600, duration: 0.6, ease: "power1.in" });
  const relief = rush + 1.12;
  seat.view(timeline, relief, "coeurs");
  seat.bounce(timeline, relief, 0.36);
  stage.sound(timeline, relief, "pop");

  // 7. the poster, on the lake with the two of them
  timeline.set(lake, { autoAlpha: 1 }, poster);
  fadeOut(valley, poster);
  recipes.affiche(timeline, poster, { stage, layers: lakePoster, aventure, grain: texture, only: lake });

  const actors = [car, seat, ...parkingPeople, ...walkers, ...lakePeople, slowpoke, waiting];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
