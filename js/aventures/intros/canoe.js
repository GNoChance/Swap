// The Premier canoë's intro (the canoe's spec, § 2): the map in two steps (the C3 from Bordeaux along the Dordogne to
// the P of Port d'Enveaux; the camera dives onto it and the valley's illustrated map shows, the rental's little bus
// honks and drives up it to Carsac), the river on a summer day under Beynac's cliff, then the closing poster
// « LA DORDOGNE » on the river, the canoe in front of the cliff. Its moments are the beats of intros/index.js; its
// stickers, canoe.stickers.js. The river shows alone from the launch to the poster: the day's scenes come in front of it.
import { createStage, ENTER, HIDDEN } from "../scene/stage.js";
import { grain, paperLayer } from "../scene/decor.js";
import { paperVehicle, preload, sceneActor, vehicle } from "../scene/actors.js";
import { projection } from "../scene/geo.js";
import { fallbackUrl, sceneUrl } from "../scene/urls.js";
import * as carte from "../scene/props-carte.js";
import * as perigord from "../scene/props-perigord.js";
import * as riviere from "../scene/props-riviere.js";
import * as chateaux from "../scene/props-chateaux.js";
import * as recipes from "../scene/recipes.js";
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

/** mount(host, { aventure }): its scenes on a stage in `host` (the map on show, the others hidden until their moment),
 *  and its paused timeline (intros/index.js). */
export function mount(host, { aventure }) {
  const { trajet, lieu } = aventure;
  const { relais } = trajet;
  const stage = createStage(host);
  const project = projection({ origin: trajet.points[0], ...MAP });
  const draw = (list, skins) => list.map(([name, depth, markup]) => paperLayer({ stage, name, depth, paper: markup("paper"), poster: skins ? markup("poster") : undefined }));

  // back to front: the river, the valley's map, the South-West's map (each hidden under the one before it, until it
  // leaves); a scene is the list of its layers' elements
  // 1. the river, and the canoe in front of Beynac's cliff for the poster
  const riverLayers = draw(RIVER, true);
  const crowd = stage.layer("riviere-gens", { depth: 0.7 });
  const duo = sceneActor({ layer: crowd, who: "duo", looks: { falaise: scene("cycy-et-kevin-en-canoe", 11) }, look: "falaise", x: 195, y: 716, height: 240 });
  const river = [...riverLayers.map((layer) => layer.el), crowd];

  // 2. the valley's map from Port d'Enveaux to Carsac, its road for the bus
  const valley = [
    paperLayer({ stage, name: "vallee-carte", paper: perigord.valleyMap({ depart: trajet.arrivee, arrivee: relais.arrivee, noms: relais.noms }) }).el,
    stage.layer("vallee-trajet"),
  ];
  const [bx, by] = perigord.VALLEY_ROUTE[0];
  const bus = paperVehicle({ layer: valley[1], name: relais.transport, markup: perigord.BUS, x: bx, y: by, width: 58 });

  // 3. the South-West's map, on east to the Périgord: its vines and woods, the Dordogne, the P at the arrival
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

  hide([...river, ...valley, duo.el]);
  stage.el.style.setProperty("--st-whole", "1"); // the maps in the whole height (a phone held sideways): it starts there
  const texture = grain(stage);
  document.fonts?.load('600 26px "Cormorant Garamond"').catch(() => {}); // the names' and the lettering's font, on its way early

  const timeline = gsap.timeline({ paused: true });
  timeline.to(texture, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, ENTER); // once the screen is in

  // 1. the map: the C3 from Bordeaux to Port d'Enveaux; the camera dives onto it, and the bus goes on to Carsac
  const launch = beat("La mise à l'eau");
  recipes.carte(timeline, beat("La carte"), { stage, layers: map, car: c3, trajet, lieu, project, duration: RELAY });
  recipes.relais(timeline, RELAY, { stage, from: { layers: map, x: end.x, y: end.y }, layers: valley, vehicle: bus, route: perigord.VALLEY_ROUTE, duration: launch - RELAY });

  // 2 to 9. the river on a summer day, framed on the action band; the day's scenes come in front of it
  timeline.set(river, { autoAlpha: 1 }, launch);
  timeline.to(valley, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, launch);
  stage.frame(timeline, launch, { whole: false, duration: 0.45 });

  // 10. the poster on the river: Beynac on its cliff, the canoe gliding in front of it
  const poster = beat("L'affiche");
  timeline.fromTo(duo.el, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, poster);
  timeline.fromTo(duo.pose, { y: 0 }, { y: -3, duration: 0.5, ease: "sine.inOut", repeat: 3, yoyo: true, immediateRender: false }, poster + 0.3); // afloat
  recipes.affiche(timeline, poster, { stage, layers: riverLayers, aventure, grain: texture, only: river });

  const actors = [c3, bus, duo];
  return {
    timeline,
    ready: preload(actors.flatMap((a) => a.imgs)),
    dispose() {
      timeline.kill();
      stage.dispose();
    },
  };
}
