// The intros' recipes (spec § 4): reusable pieces of timeline, each → the moment it ends (s): the trip on a paper map,
// the vehicle arriving with its people, the walk up a path, and the closing poster (spec § 5, moments 1, 2, 3 and 7).
import { sfx } from "../../audio.js";
import { h } from "../../dom.js";
import { posterize, sheet } from "./decor.js";
import { curve } from "./geom.js";
import { fitTitle, posterLine, posterTitle, TITLE_FIT } from "./poster-text.js";
import { names, PIN, routeDots, routeLine, stops } from "./props-carte.js";
import { ENTER, H, W } from "./stage.js";

const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles
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

/** carte(tl, at, { stage, layers, car, trajet, lieu, project, duration }): from `at` s, the trip on the map. The car
 *  (a vehicle in view « roule », standing on the trip's first point) waits for the map to be seen, then drives along
 *  the road with a bounce and its engine, the dotted line drawn behind it, the camera (on `layers`, the map's)
 *  following it south a little closer; it pulls up by the arrival, the last dots run to it and its pin plops. The names
 *  come from the data: trajet.depart, trajet.etapes (each at its point trajet.etapesAt[k]) and lieu. → its end (s). */
export function carte(tl, at, { stage, layers, car, trajet, lieu, project, duration }) {
  const gsap = window.gsap;
  const road = trajet.points.map(project);
  const shift = (parseFloat(car.layer.style.width) - W) / 2; // the layer's x 0 is the stage's
  const drawn = sheet("st-paper", parseFloat(car.layer.style.width), routeLine(curve(road.map(({ x, y }) => [x, y]))) + names(stops({ trajet, lieu }, project)));
  car.layer.insertBefore(drawn, car.el); // under the car
  const end = road.at(-1);
  const pin = h("div", { class: "st-pin" });
  pin.innerHTML = PIN;
  Object.assign(pin.style, HIDDEN, { left: `${end.x - 14 + shift}px`, top: `${end.y - 38}px` });
  car.layer.append(pin); // over it

  const line = drawn.querySelector(".st-route-path");
  const holder = drawn.querySelector(".st-route-dots");
  const right = end.x >= road[0].x; // the trip's heading
  // the road by its chords, for what is set before anything can be measured: the car's facing at the start, the camera
  const chords = road.slice(1).map((p, k) => Math.hypot(p.x - road[k].x, p.y - road[k].y));
  const total = chords.reduce((a, b) => a + b, 0);
  const near = (dist) => {
    let k = 0;
    while (k < chords.length - 1 && dist > chords[k]) dist -= chords[k++];
    const f = Math.min(1, dist / chords[k]);
    return { x: road[k].x + f * (road[k + 1].x - road[k].x), y: road[k].y + f * (road[k + 1].y - road[k].y) };
  };
  car.turn.classList.toggle("is-flipped", facesRight(near, 0, total, right));

  // the car along the road, and the dots behind it: getter/setters the timeline tweens, so they hold under seek (an
  // onUpdate would not); the road is measured on their first use, once it is laid out
  let length = 0;
  let dots = [];
  let shown = 0;
  let setX, setY;
  function measure() {
    length = line.getTotalLength();
    holder.innerHTML = routeDots(Array.from({ length: Math.floor(length / DOT) + 1 }, (_, k) => line.getPointAtLength(k * DOT)));
    dots = [...holder.children];
    setX = gsap.quickSetter(car.el, "x", "px");
    setY = gsap.quickSetter(car.el, "y", "px");
  }
  function reveal(along) {
    const count = along > 0 ? Math.min(dots.length, Math.floor(along / DOT) + 1) : 0;
    for (let k = Math.min(shown, count); k < Math.max(shown, count); k++) dots[k].setAttribute("visibility", k < count ? "visible" : "hidden");
    shown = count;
  }
  function place(p) {
    if (!length) measure();
    const along = p * (length - SHORT);
    const here = line.getPointAtLength(along);
    setX(here.x - car.x);
    setY(here.y - car.y);
    car.turn.classList.toggle("is-flipped", facesRight((dist) => line.getPointAtLength(dist), along, length, right));
    reveal(along);
  }
  /** A value GSAP can tween (a getter/setter), handed to `set` at each change. */
  const settable = (set) => {
    let value = 0;
    return (next) => (next === undefined ? value : set((value = next)));
  };
  const driver = { progress: settable(place) };
  // the last dots, to the pin
  const tail = {
    progress: settable((q) => {
      if (!length) measure();
      reveal(length - SHORT + q * SHORT);
    }),
  };
  const leave = at + ENTER; // the map seen (at 0, the screen faded in)
  const arrive = at + duration - 0.62; // the pin has plopped before the map leaves
  const ease = "sine.inOut";
  stage.sound(tl, at + 0.3, "engine");
  tl.to(driver, { progress: 1, duration: arrive - leave, ease }, leave);
  car.bounce(tl, leave, arrive - leave);
  // the camera a little closer, after the car south: where it will be (by the chords, as eased) at each step, a little
  // ahead; sideways it follows it only a quarter, so the names and the coast stay whole on a phone
  const zoom = 1.12;
  const steps = [0.5, 0.82, 1];
  steps.forEach((f, k) => {
    const from = k ? steps[k - 1] : 0;
    const there = near(gsap.parseEase(ease)(f) * (total - SHORT));
    const x = CENTRE.x + (there.x - CENTRE.x) / 4;
    const look = { x, y: f === 1 ? (there.y + end.y) / 2 - 130 : there.y + 40 }; // at the end, the pin and the road behind
    stage.pan(tl, leave + from * (arrive - leave), { x: zoom * (look.x - CENTRE.x), y: zoom * (look.y - CENTRE.y), zoom, duration: (f - from) * (arrive - leave), ease: ["sine.in", "none", "sine.out"][k], only: layers });
  });
  // the last dots run to the arrival, its pin plops
  tl.to(tail, { progress: 1, duration: 0.2, ease: "power1.out" }, arrive);
  tl.call(() => sfx("pop"), null, arrive + 0.15);
  tl.fromTo(pin, { autoAlpha: 1, scale: 0, y: -16 }, { scale: 1, y: 0, duration: 0.42, ease: "back.out(3)", immediateRender: false }, arrive + 0.12);
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
