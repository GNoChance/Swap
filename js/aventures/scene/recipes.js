// The intros' recipes (spec § 4): reusable pieces of timeline, each → the moment it ends (s): the trip on a paper map
// and its relay on a map of its own (the canoe's spec, § 4), the vehicle arriving with its people, the walk up a path,
// and the closing poster (spec § 5, moments 1, 2, 3 and 7). Both maps drive their vehicle along the same road (roadOf).
import { sfx } from "../../audio.js";
import { h } from "../../dom.js";
import { posterize, sheet } from "./decor.js";
import { curve } from "./geom.js";
import { fitTitle, posterLine, posterTitle, TITLE_FIT } from "./poster-text.js";
import { names, PIN, routeDots, routeLine, stops } from "./props-carte.js";
import { ENTER, H, HIDDEN, layerX, W } from "./stage.js";

const HOLD = 0.9; // s the finished poster stays before the end (at least 0.8)
// where the paper around the picture starts, off the widest screens (units): it closes in from there
const AWAY = { left: { x: -1100 }, right: { x: 1100 }, top: { y: -140 }, bottom: { y: 140 } };

/** affiche(tl, at, { stage, layers, aventure, grain, only }): from `at` s, the camera back at rest on the scene (`only`,
 *  its layers' elements; on a phone held sideways, the whole stage in the height), a cream frame closing in around it as
 *  the paper around a portrait poster, its rule drawn, the layers turning flat one by one (back to front) as the grain
 *  fades, then the lieu falling letter by letter (smaller if it is long) and the stamp's name and dates. → when the
 *  intro may end (s), the poster held. Its pieces: css/intros.css (af-*). */
export function affiche(tl, at, { stage, layers, aventure, grain, only }) {
  stage.pan(tl, at, { duration: 0.6, ease: "power2.inOut", only });
  stage.frame(tl, at, { whole: true, duration: 0.6 });

  const mats = Object.keys(AWAY).map((side) => h("div", { class: `af-mat af-mat--${side}` }));
  const rules = ["top", "right", "bottom", "left"].map((side) => h("i", { class: `af-rule af-rule--${side}` }));
  const glyphs = [...posterTitle(aventure)].map((c) => (c === " " ? c : h("span", { class: "af-letter" }, c))); // spaces stay text
  const letters = glyphs.filter((glyph) => typeof glyph !== "string");
  const title = h("p", { class: "af-title", style: `font-size: ${fitTitle(posterTitle(aventure), TITLE_FIT)}px` }, glyphs);
  const line = h("p", { class: "af-line" }, posterLine(aventure));
  // a layer the camera never moves (depth 0), its poster in stage units
  stage.layer("affiche", { depth: 0 }).append(h("div", { class: "af-poster" }, mats, h("div", { class: "af-frame" }, rules), title, line));
  for (const el of [...mats, title, line]) Object.assign(el.style, HIDDEN);

  // the paper closes in around the picture, then the rule draws itself round it
  tl.call(() => sfx("paper"), null, at).set([...mats, title], { autoAlpha: 1 }, at);
  Object.values(AWAY).forEach((from, k) => tl.fromTo(mats[k], from, { x: 0, y: 0, duration: 0.6, ease: "power3.out" }, at));
  rules.forEach((rule, k) => tl.fromTo(rule, { [k % 2 ? "scaleY" : "scaleX"]: 0 }, { [k % 2 ? "scaleY" : "scaleX"]: 1, duration: 0.22, ease: "power1.inOut" }, at + 0.3 + k * 0.08));

  posterize(tl, at + 0.2, layers, { stagger: 0.09, grain });

  // the lieu falls letter by letter (a sound every other one), then the line
  const fall = at + 0.92;
  letters.forEach((letter, k) => {
    tl.fromTo(letter, { y: -26, rotation: k % 2 ? 7 : -6, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.34, ease: "back.out(2)" }, fall + k * 0.04);
    if (k % 2 === 0) tl.call(() => sfx("letter"), null, fall + k * 0.04 + 0.18);
  });
  const said = fall + letters.length * 0.04 + 0.1;
  tl.fromTo(line, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out" }, said);
  const end = said + 0.35 + HOLD;
  tl.set({}, {}, end);
  return end;
}

/** marche(tl, at, { stage, people, layers, duration, focus, zoom, grain }): from `at` s for `duration` s, the people
 *  (from the back) walking on the spot, swaying, their steps heard, as the decor (`layers`, a scene's) glides towards
 *  them: each layer closes in on `focus` (where the path goes) by its depth, so the near ones (depth over 1) pass by on
 *  the sides. The grain, still over the moving decor, softens meanwhile. → its end (s). */
export function marche(tl, at, { stage, people, layers, duration, focus, zoom = 1.6, grain }) {
  stage.pan(tl, at, { zoom, focus, duration, ease: "power1.inOut", only: layers });
  people.forEach((person, k) => person.bob(tl, at + k * 0.09, duration - k * 0.09, { step: 0.21, sway: 3, lift: 4 }));
  for (let t = at + 0.1; t < at + duration - 0.1; t += 0.21) tl.call(() => sfx("step"), null, t);
  if (grain) tl.to(grain, { autoAlpha: 0.4, duration: 0.4, ease: "power1.out" }, at).to(grain, { autoAlpha: 1, duration: 0.4, ease: "power1.in" }, at + duration - 0.4);
  return at + duration;
}

const SHORT = 50; // units: the car pulls up this short of the arrival, its pin beside it
const DOT = 7; // units between the road's dots
const LOOK = 60; // units the car looks ahead and back along the road, to know where it heads
const CENTRE = { x: W / 2, y: H / 2 }; // where the camera zooms (stage.js: each layer's middle)

/** Does the car face right at `along` units on a road `length` long (`at(d)`: its point d units along)? The stickers
 *  face left: it turns right where the road clearly heads right, and keeps the trip's heading (`right`) elsewhere. */
function facesRight(at, along, length, right) {
  const dx = at(Math.min(length, along + LOOK)).x - at(Math.max(0, along - LOOK)).x;
  return Math.abs(dx) > LOOK * 0.7 ? dx > 0 : right;
}

/** A road through `points` ([x, y]) by its chords, known before anything is laid out: its length, and its point
 *  `dist` units along ({ x, y }). */
function chordsOf(points) {
  const chords = points.slice(1).map(([x, y], k) => Math.hypot(x - points[k][0], y - points[k][1]));
  const total = chords.reduce((a, b) => a + b, 0);
  const near = (dist) => {
    let k = 0;
    while (k < chords.length - 1 && dist > chords[k]) dist -= chords[k++];
    const f = Math.min(1, dist / chords[k]);
    return { x: points[k][0] + f * (points[k + 1][0] - points[k][0]), y: points[k][1] + f * (points[k + 1][1] - points[k][1]) };
  };
  return { total, near };
}

/** A value GSAP can tween (a getter/setter), handed to `set` at each change. */
function settable(set) {
  let value = 0;
  return (next) => (next === undefined ? value : set((value = next)));
}

/** roadOf({ layer, mover, points, short }) → { progress, tail, length }: the dotted road through `points` ([x, y], stage
 *  units), drawn in `layer` under `mover` (an actor standing on its first point, its sticker facing left: a vehicle()
 *  or a paperVehicle()). progress(p) puts the mover p (0 → 1) of the way to `short` units before the end, facing where
 *  it heads (else the trip's heading), the dots revealed behind it; tail(q) reveals the last dots to the end (0 → 1);
 *  both are getter/setters the timeline tweens, so they hold under seek (an onUpdate would not). length(): the road's
 *  length (units). The road is measured on first use, once it is laid out. */
export function roadOf({ layer, mover, points, short = SHORT }) {
  const gsap = window.gsap;
  const drawn = sheet("st-paper", parseFloat(layer.style.width), routeLine(curve(points)));
  layer.insertBefore(drawn, mover.el); // under the mover
  const line = drawn.querySelector(".st-route-path");
  const holder = drawn.querySelector(".st-route-dots");
  const right = points.at(-1)[0] >= points[0][0]; // the trip's heading
  const { total, near } = chordsOf(points);
  mover.turn.classList.toggle("is-flipped", facesRight(near, 0, total, right)); // its facing at the start

  let length = 0;
  let dots = [];
  let shown = 0;
  let setX, setY;
  function measure() {
    length = line.getTotalLength();
    holder.innerHTML = routeDots(Array.from({ length: Math.floor(length / DOT) + 1 }, (_, k) => line.getPointAtLength(k * DOT)));
    dots = [...holder.children];
    setX = gsap.quickSetter(mover.el, "x", "px");
    setY = gsap.quickSetter(mover.el, "y", "px");
  }
  function reveal(along) {
    const count = along > 0 ? Math.min(dots.length, Math.floor(along / DOT) + 1) : 0;
    for (let k = Math.min(shown, count); k < Math.max(shown, count); k++) dots[k].setAttribute("visibility", k < count ? "visible" : "hidden");
    shown = count;
  }
  function place(p) {
    if (!length) measure();
    const along = p * (length - short);
    const here = line.getPointAtLength(along);
    setX(here.x - mover.x);
    setY(here.y - mover.y);
    mover.turn.classList.toggle("is-flipped", facesRight((dist) => line.getPointAtLength(dist), along, length, right));
    reveal(along);
  }
  return {
    progress: settable(place),
    // the last dots, to the end
    tail: settable((q) => {
      if (!length) measure();
      reveal(length - short + q * short);
    }),
    length() {
      if (!length) measure();
      return length;
    },
  };
}

/** The pin of an arrival at `point` ({ x, y }, stage units), in `layer` over what it holds, hidden until it plops:
 *  its tip on the point. */
function pinAt(layer, point) {
  const pin = h("div", { class: "st-pin" });
  pin.innerHTML = PIN;
  Object.assign(pin.style, HIDDEN, { left: `${layerX(layer, point.x - 14)}px`, top: `${point.y - 38}px` });
  layer.append(pin);
  return pin;
}

/** The pin plopping at `at` s, a pop heard. */
function plop(tl, at, pin) {
  tl.call(() => sfx("pop"), null, at + 0.03);
  tl.fromTo(pin, { autoAlpha: 1, scale: 0, y: -16 }, { scale: 1, y: 0, duration: 0.42, ease: "back.out(3)", immediateRender: false }, at);
}

/** carte(tl, at, { stage, layers, car, trajet, lieu, project, duration }): from `at` s, the trip on the map. The car
 *  (a vehicle in view « roule », standing on the trip's first point) waits for the map to be seen, then drives along
 *  the road with a bounce and its engine, the dotted line drawn behind it (roadOf()), the camera (on `layers`, the
 *  map's) following it a little closer; it pulls up by the arrival, the last dots run to it and its pin plops. The names
 *  come from the data: trajet.depart, trajet.etapes (each at its point trajet.etapesAt[k]) and trajet.arrivee, else
 *  lieu (stops()). → its end (s). */
export function carte(tl, at, { stage, layers, car, trajet, lieu, project, duration }) {
  const gsap = window.gsap;
  const points = trajet.points.map(project).map(({ x, y }) => [x, y]);
  const road = roadOf({ layer: car.layer, mover: car, points });
  car.layer.insertBefore(sheet("st-paper", parseFloat(car.layer.style.width), names(stops({ trajet, lieu }, project))), car.el); // over the road, under the car
  const end = project(trajet.points.at(-1));
  const pin = pinAt(car.layer, end); // over it
  const { total, near } = chordsOf(points);
  const sideways = Math.abs(end.x - points[0][0]) > Math.abs(end.y - points[0][1]); // a trip west to east (stops())

  const leave = at + ENTER; // the map seen (at 0, the screen faded in)
  const arrive = at + duration - 0.62; // the pin has plopped before the map leaves
  const ease = "sine.inOut";
  stage.sound(tl, at + 0.3, "engine");
  tl.to(road, { progress: 1, duration: arrive - leave, ease }, leave);
  car.bounce(tl, leave, arrive - leave);
  // the camera a little closer, after the car: where it will be (by the chords, as eased) at each step, a little
  // ahead; sideways it follows it only a quarter, so the names and the coast stay whole on a phone
  const zoom = 1.12;
  const steps = [0.5, 0.82, 1];
  steps.forEach((f, k) => {
    const from = k ? steps[k - 1] : 0;
    const there = near(gsap.parseEase(ease)(f) * (total - SHORT));
    const x = CENTRE.x + (there.x - CENTRE.x) / 4;
    // at the end of a trip south, the pin and the road behind it; a trip east keeps the road at its height
    const look = { x, y: f === 1 && !sideways ? (there.y + end.y) / 2 - 130 : there.y + 40 };
    stage.pan(tl, leave + from * (arrive - leave), { x: zoom * (look.x - CENTRE.x), y: zoom * (look.y - CENTRE.y), zoom, duration: (f - from) * (arrive - leave), ease: ["sine.in", "none", "sine.out"][k], only: layers });
  });
  // the last dots run to the arrival, its pin plops
  tl.to(road, { tail: 1, duration: 0.2, ease: "power1.out" }, arrive);
  plop(tl, arrive + 0.12, pin);
  return at + duration;
}

const RELAY_SHORT = 30; // units: the relay's vehicle pulls up this short of its arrival
const DIVE = 4; // the zoom the camera dives to, onto the relay's start
const CLOSE = 1.3; // the zoom the next map shows at first, on its own start

/** relais(tl, at, { stage, from, layers, vehicle, route, duration }): from `at` s, the trip goes on by another vehicle
 *  on a map of its own. The camera dives onto the relay's start on the map before (from = { layers, x, y }: its layers'
 *  elements and that point, stage units) as it fades; the next map (`layers`, its elements, hidden until then: the
 *  last holds `vehicle`) shows through close on its own start (route[0]), then settles. The vehicle (a paperVehicle()
 *  standing on route[0]) honks and drives along `route` ([x, y], stage units) with a bounce, its dotted line drawn
 *  behind it (roadOf()); it pulls up by the arrival, the last dots run to it and its pin plops. → its end (s). */
export function relais(tl, at, { stage, from, layers, vehicle, route, duration }) {
  const road = roadOf({ layer: vehicle.layer, mover: vehicle, points: route, short: RELAY_SHORT });
  const [ex, ey] = route.at(-1);
  const pin = pinAt(vehicle.layer, { x: ex, y: ey });
  // the dive, the map before fading as the next one shows through, close on the same place
  stage.pan(tl, at, { x: DIVE * (from.x - W / 2), y: DIVE * (from.y - H / 2), zoom: DIVE, duration: 0.45, ease: "power2.in", only: from.layers });
  const [sx, sy] = route[0];
  stage.pan(tl, at, { x: CLOSE * (sx - W / 2), y: CLOSE * (sy - H / 2), zoom: CLOSE, duration: 0, only: layers });
  tl.set(layers, { autoAlpha: 1 }, at + 0.05).to(from.layers, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, at + 0.1);
  stage.pan(tl, at + 0.3, { duration: 0.8, ease: "power2.inOut", only: layers });
  // the vehicle honks and drives off, its pin plops
  const leave = at + 0.5;
  const arrive = at + duration - 0.62;
  stage.sound(tl, at + 0.42, "honk");
  tl.to(road, { progress: 1, duration: arrive - leave, ease: "sine.inOut" }, leave);
  vehicle.bounce(tl, leave, arrive - leave);
  tl.to(road, { tail: 1, duration: 0.2, ease: "power1.out" }, arrive);
  plop(tl, arrive + 0.12, pin);
  return at + duration;
}

/** route(tl, at, { stage, car, people, layers }): from `at` s, the scene (`layers`) settling as the vehicle (standing
 *  where it parks, in view « roule ») rolls in from the right, bouncing in its puffs of smoke; it brakes and turns
 *  three-quarters, and the people (standing where they get to, beside it and in front of it) jump out of it from the
 *  front and hop with joy. → when they have hopped (s). */
export function route(tl, at, { stage, car, people, layers }) {
  stage.pan(tl, at, { zoom: 1.06, duration: 0, only: layers });
  stage.pan(tl, at, { zoom: 1, duration: 0.8, ease: "power2.out", only: layers });
  const roll = 0.26;
  car.drive(tl, at, { fromX: car.x + 560, toX: car.x, duration: roll, ease: "power3.out" });
  car.bounce(tl, at, roll + 0.06);
  car.smoke(tl, at + 0.04, 3);
  const stop = at + roll;
  car.brake(tl, stop);
  car.view(tl, stop + 0.04, "trois-quarts");
  let end = stop;
  people.forEach((person, k) => {
    Object.assign(person.el.style, HIDDEN); // in the car until then
    const out = stop + 0.02 + k * 0.03;
    tl.fromTo(person.el, { x: (car.x - person.x) * 0.6, y: -24, autoAlpha: 0, scale: 0.55 }, { x: 0, y: 0, autoAlpha: 1, scale: 1, duration: 0.18, ease: "power2.out", immediateRender: false }, out);
    end = Math.max(end, person.hop(tl, person.hop(tl, out + 0.22, 12) + 0.02, 10));
  });
  return end;
}
