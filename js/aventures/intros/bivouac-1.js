// The Premier bivouac's intro (spec § 5), version 1: the map (the Seat from Bordeaux to the Ayous lakes), the camera
// diving onto its pin, the parking in the Ossau valley (the Seat arrives, Cycy and Kevin come out), the view of the
// Ayous lake and the Ossau with the two of them, then the closing poster « LACS D'AYOUS ». Its moments are the beats
// of intros/index.js; its stickers, bivouac-1.stickers.js.
import { createStage, ENTER, H, W } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { person, preload, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import * as props from "../scene/props.js";
import * as carte from "../scene/props-carte.js";
import * as vallee from "../scene/props-vallee.js";
import * as recipes from "../scene/recipes.js";
import { SCENARIOS } from "./index.js";

export { stickers } from "./bivouac-1.stickers.js";

const gsap = window.gsap;
const beat = (name) => SCENARIOS["bivouac-1"].beats.find((b) => b.name === name).at;
const MAP = { at: { x: 199, y: 161 }, unitsPerDegree: 258 }; // Bordeaux (its first point) there, 258 units a degree
const ETAPES_AT = [5]; // the point each stage's name is written at: Pau, the 6th
const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles

// the lake's layers, back to front: [name, depth (its share of the camera's moves), its markup in a skin]
const LAKE_LAYERS = [
  ["ciel", 0.04, (skin) => props.sky(skin) + props.sun(skin) + props.clouds(skin)],
  ["pic", 0.15, (skin) => props.ridge(skin) + props.ossau(skin)],
  ["sapins", 0.26, (skin) => props.shores(skin)],
  ["refuge", 0.26, (skin) => props.refuge(336, 354, skin)],
  ["lac", 0.3, (skin) => props.lake(skin)],
  ["prairie", 0.55, (skin) => props.meadow(skin) + props.stream(skin)],
  ["neves", 0.55, (skin) => props.neves(skin)],
  ["tente", 0.7, (skin) => props.tent(skin)],
  ["devant", 1, (skin) => props.foreground(skin)],
];
// the valley's, paper only
const VALLEY_LAYERS = [
  ["vallee-ciel", 0.05, vallee.sky],
  ["vallee-monts", 0.15, vallee.mountains],
  ["vallee-pentes", 0.35, vallee.slopes],
  ["vallee-prairie", 0.7, vallee.meadow],
];

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const outing = aventure.id;

  // back to front: the lake, the valley, the map (each scene hidden under the one before it, until it leaves); a scene
  // is the list of its layers' elements
  const lakeLayers = LAKE_LAYERS.map(([name, depth, draw]) => paperLayer({ stage, name, depth, paper: draw("paper"), poster: draw("poster") }));
  const lakeCrowd = stage.layer("lac-gens", { depth: 0.9 });
  const lake = [...lakeLayers.map((layer) => layer.el), lakeCrowd];
  const lakePeople = [
    person({ stage, layer: lakeCrowd, outing, who: "cycy", x: 168, y: 712, height: 108 }),
    person({ stage, layer: lakeCrowd, outing, who: "kevin", x: 262, y: 716, height: 112 }),
  ];
  const valley = VALLEY_LAYERS.map(([name, depth, draw]) => paperLayer({ stage, name, depth, paper: draw() }).el);
  const valleyCrowd = stage.layer("vallee-gens", { depth: 0.8 });
  const seat = vehicle({ stage, layer: valleyCrowd, name: "seat", x: 205, y: 652, width: 140, view: "roule" });
  const parkingPeople = [
    person({ stage, layer: valleyCrowd, outing, who: "cycy", x: 88, y: 696, height: 108 }), // either side of it, in front
    person({ stage, layer: valleyCrowd, outing, who: "kevin", x: 314, y: 700, height: 112 }),
  ];
  valley.push(valleyCrowd, paperLayer({ stage, name: "vallee-devant", depth: 1, paper: vallee.foreground() }).el);
  const stopsOnMap = carte.stops({ trajet, lieu, etapesAt: ETAPES_AT }, project);
  const road = trajet.points.map(project).map(({ x, y }) => [x, y]);
  const map = [
    paperLayer({ stage, name: "carte", paper: carte.ocean(project) + carte.land(project, { road }) + carte.landes(project, { road, clear: stopsOnMap.map((s) => s.box) }) + carte.pyrenees(project) }).el,
    stage.layer("carte-trajet"),
  ];
  const start = project(trajet.points[0]);
  const car = vehicle({ stage, layer: map[1], name: "seat", x: start.x, y: start.y, width: 60, view: "roule" });
  for (const el of [...lake, ...valley]) Object.assign(el.style, HIDDEN);
  stage.el.style.setProperty("--st-whole", "1"); // the map in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in

  // 1. the map: Bordeaux → the Ayous lakes
  const parking = beat("Le parking");
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car, trajet, lieu, project, duration: parking - beat("La carte"), etapesAt: ETAPES_AT });

  // 2. the camera dives onto the pin, the valley shows through, the Seat arrives and the two of them come out
  const pin = project(trajet.points.at(-1));
  const dive = 4;
  stage.pan(timeline, parking, { x: dive * (pin.x - W / 2), y: dive * (pin.y - H / 2), zoom: dive, duration: 0.45, ease: "power2.in", only: map });
  stage.frame(timeline, parking, { whole: false, duration: 0.45 });
  timeline.set(valley, { autoAlpha: 1 }, parking + 0.05).to(map, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, parking + 0.1);
  recipes.route(timeline, parking, { stage, car: seat, people: parkingPeople, layers: valley });

  // 3. up there: the lake and the Ossau, Cycy and Kevin from the front, with joy
  const haut = beat("En haut");
  const poster = beat("L'affiche");
  timeline.set(lake, { autoAlpha: 1 }, haut).to(valley, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, haut);
  stage.pan(timeline, haut, { x: 10, zoom: 1.035, duration: poster - haut, ease: "sine.inOut", only: lake }); // a slow drift: the paper's depth
  lakePeople.forEach((who, k) => who.hop(timeline, who.hop(timeline, haut + 0.3 + k * 0.12, 14) + 0.25, 10));

  // 4. the poster
  recipes.affiche(timeline, poster, { stage, layers: lakeLayers, aventure, grain: texture });

  const actors = [car, seat, ...parkingPeople, ...lakePeople];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
