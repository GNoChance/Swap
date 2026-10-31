// The water's recipes (the canoe's spec, § 4): reusable pieces of timeline for a boat on the river, each → the moment it
// ends (s): afloat (flotte: it pitches gently, its paddles' drops and « plic »), spinning round like a card turned over
// (tourne: squeezed to nothing, into its other view, stretched out the other way; eddies under it, a dizzy spiral over
// it), and paddling down the river as the decor glides towards it (rame). Everything is a tween or a set of the
// timeline, nothing is worked out as it plays: it holds under any seek. Reads `window` only in its functions.
import { sfx } from "../../audio.js";
import { gouttes, remous, tournis } from "./props-riviere.js";
import { HIDDEN, layerX } from "./stage.js";

const SWAY = 1.2; // s: a pitch from side to side and back
const BOB = 0.9; // s: a rise and fall
const STROKE = 0.45; // s between two strokes of the paddles

/** An ease that makes a wave of `cycles` whole periods: 0 at both ends, the tween's end value at its crests. */
const wave = (cycles) => (p) => Math.sin(2 * Math.PI * cycles * p);
/** An element of class `cls` holding `markup`, hidden. */
function element(cls, markup) {
  const el = Object.assign(document.createElement("span"), { className: cls });
  el.innerHTML = markup;
  Object.assign(el.style, HIDDEN);
  return el;
}

/** flotte(tl, at, { actor, duration, strokes }): from `at` s for `duration` s, the actor afloat: its pose pitching ±2°
 *  and rising and falling ±2 units, about 1.2 s a pitch, back level at the end. With `strokes`, a stroke of the paddles
 *  every 0.45 s, on either side in turn: drops spring up there, « plic ». → its end (s). */
export function flotte(tl, at, { actor, duration, strokes = true }) {
  const sways = Math.max(1, Math.round(duration / SWAY));
  const bobs = Math.max(1, Math.round(duration / BOB));
  tl.fromTo(actor.pose, { rotation: 0 }, { rotation: 2, duration, ease: wave(sways), immediateRender: false }, at);
  tl.fromTo(actor.pose, { y: 0 }, { y: -2, duration, ease: wave(bobs), immediateRender: false }, at);
  if (!strokes) return at + duration;
  // a splash on each side, by the paddles' blades (its foot at the boat's water line)
  const splashes = [-1, 1].map((side) => {
    const el = element("st-drops", gouttes());
    Object.assign(el.style, { left: `${side * actor.size * 0.5 - 14}px`, bottom: `${actor.size * 0.1}px` });
    actor.el.append(el);
    return el;
  });
  let k = 0;
  for (let t = at + 0.15; t < at + duration - 0.3; t += STROKE, k++) {
    const drops = splashes[k % 2];
    tl.fromTo(drops, { autoAlpha: 0, y: 2, scale: 0.4 }, { autoAlpha: 1, y: -9, scale: 1, duration: 0.14, ease: "power2.out", immediateRender: false }, t).to(drops, { autoAlpha: 0, y: -3, scale: 0.85, duration: 0.18, ease: "power1.in" }, t + 0.14);
    tl.call(() => sfx("paddle"), null, t);
  }
  return at + duration;
}

// where each boat's pivots leave it, as the timeline is built (in its order): the sign of its width, the view it shows
const pivots = new WeakMap();

/** tourne(tl, at, { actor, layer, faces: [front, back], turns, duration }): from `at` s for `duration` s, the actor (a
 *  scene actor standing on its point, showing one of its two views `faces`, keys of its looks) spins round `turns`
 *  times like a card turned over: each half-turn squeezes its turn box to nothing (scaleX → 0), shows its other view,
 *  and stretches it out the other way (scaleX from 1 to −1 in turn; a turn box flipped by its class, is-flipped, starts
 *  from −1). Meanwhile eddies spiral under it in `layer` (under it in its own layer), a dizzy spiral floats over it
 *  after its first half-turn, and a whoosh sounds at each turn. At the end its scaleX is exactly ±1 and one view shows.
 *  A pivot carries on from where the last one left it. → its end (s). */
export function tourne(tl, at, { actor, layer, faces, turns = 2.5, duration }) {
  const state = pivots.get(actor) ?? { sign: actor.turn.classList.contains("is-flipped") ? -1 : 1, side: 0 };
  pivots.set(actor, state);
  const halves = Math.max(1, Math.round(turns * 2));
  const half = duration / halves;
  const end = at + duration;
  actor.wearAt(tl, at, faces[state.side]);
  for (let k = 0; k < halves; k++) {
    const t = at + k * half;
    if (k % 2 === 0) tl.call(() => sfx("whoosh"), null, t);
    tl.fromTo(actor.turn, { scaleX: state.sign }, { scaleX: 0, duration: half / 2, ease: "sine.in", immediateRender: false }, t);
    state.side = 1 - state.side;
    state.sign = -state.sign;
    actor.wearAt(tl, t + half / 2, faces[state.side]);
    tl.fromTo(actor.turn, { scaleX: 0 }, { scaleX: state.sign, duration: half / 2, ease: "sine.out", immediateRender: false }, t + half / 2);
  }

  // the eddies, laid flat on the water round the boat's water line, turning the other way
  const radius = actor.size * 0.8;
  const swirl = element("st-swirl", "");
  const spin = Object.assign(document.createElement("span"), { className: "st-swirl__spin" });
  spin.innerHTML = remous(radius);
  swirl.append(spin);
  Object.assign(swirl.style, { left: `${layerX(layer, actor.x - radius)}px`, top: `${actor.y - actor.size * 0.08 - radius}px` });
  if (layer === actor.layer) layer.insertBefore(swirl, actor.el);
  else layer.append(swirl);
  tl.fromTo(swirl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, at)
    .fromTo(spin, { rotation: 0, scale: 0.6 }, { rotation: -300 * turns - 120, scale: 1, duration: duration + 0.4, ease: "power1.out", immediateRender: false }, at)
    .to(swirl, { autoAlpha: 0, duration: 0.4, ease: "power1.in" }, end);

  // the dizzy spiral over its head, bobbing as it turns
  if (halves > 1) {
    const dizzy = element("st-dizzy", "");
    const whirl = Object.assign(document.createElement("span"), { className: "st-dizzy__spin" });
    whirl.innerHTML = tournis();
    dizzy.append(whirl);
    Object.assign(dizzy.style, { left: "-26px", bottom: `${actor.size + 2}px` });
    actor.el.append(dizzy);
    const from = at + half;
    tl.fromTo(dizzy, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)", immediateRender: false }, from)
      .fromTo(dizzy, { y: 0 }, { y: -5, duration: end - from, ease: wave(Math.max(1, Math.round((end - from) / 0.5))), immediateRender: false }, from)
      .fromTo(whirl, { rotation: 0 }, { rotation: 540 * turns, duration: end - from + 0.2, ease: "none", immediateRender: false }, from)
      .to(dizzy, { autoAlpha: 0, scale: 0.5, duration: 0.2, ease: "power1.in" }, end);
  }
  return end;
}

/** rame(tl, at, { stage, actor, layers, duration, focus, zoom }): from `at` s for `duration` s, the boat (from the back)
 *  paddling down the river as the decor (`layers`, a scene's) glides towards it, as marche() walks up a path: each
 *  layer closes in on `focus` (where the river goes) by its depth, so the near ones (depth over 1) pass by on the sides;
 *  the boat afloat (flotte()), its « plic » instead of steps. → its end (s). */
export function rame(tl, at, { stage, actor, layers, duration, focus, zoom = 1.6 }) {
  stage.pan(tl, at, { zoom, focus, duration, ease: "power1.inOut", only: layers });
  return flotte(tl, at, { actor, duration });
}
