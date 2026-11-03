// The bikes' recipes (the Île de Ré's spec, § 4): reusable pieces of timeline for the two of them on their bikes, each →
// the moment it ends (s): pedalling (pedale: their height rising from the wheels at each stroke, a little rock from side
// to side, and speed lines streaming out behind them when they go flat out), and the decor gliding by as they ride
// either way (defile: each layer at the pace of its depth). Everything is a tween of the timeline, nothing is worked out
// as it plays: it holds under any seek. Reads `window` only in its functions.
import { lens, path, wave } from "./geom.js";
import { HIDDEN } from "./stage.js";

const STROKE = 0.4; // s a stroke of the pedals, at speed 1
const ROCK = 0.8; // degrees they rock either side, a stroke each way, round their wheels' middle: the wheels stay down
const RISE = 0.025; // their height grows by that share at each stroke, from the wheels up: the wheels stay down
const DRIFT = 14; // units the speed lines slide back at each flurry
// the speed lines behind a rider going right: three paper streaks, white with a pale blue edge (an <svg>, its right end
// by the sticker's left edge: css/intros.css, st-traits)
const LINES = `<svg viewBox="0 0 64 36"><g stroke="#8fb7d6" stroke-width="1.2" stroke-linejoin="round">${path(lens(6, 7, 56, 1.8) + lens(16, 19, 46, 1.6) + lens(0, 30, 62, 1.8), "#fbfdff")}</g></svg>`;

/** pedale(tl, at, { actor, duration, speed, lines }): from `at` s for `duration` s, the actor (a scene sticker of the two
 *  of them on their bikes) pedalling, a stroke about every 0.4 s at speed 1 (faster at a higher speed): its height rising
 *  a little from its wheels at each stroke, rocking a little from side to side (a stroke each way), level again at the
 *  end. With `lines`, speed lines stream out behind it (it rides right: on its left), a flurry every two strokes, gone at
 *  the end. → its end (s). */
export function pedale(tl, at, { actor, duration, speed = 1, lines = false }) {
  const strokes = Math.max(2, Math.round((duration * speed) / STROKE) & ~1); // an even count: level again at the end
  const stroke = duration / strokes;
  tl.fromTo(actor.pose, { rotation: 0 }, { rotation: ROCK, duration, ease: wave(strokes / 2), immediateRender: false }, at);
  tl.fromTo(actor.pose, { scaleY: 1 }, { scaleY: 1 + RISE, duration: stroke / 2, ease: "sine.inOut", yoyo: true, repeat: strokes * 2 - 1, immediateRender: false }, at);
  if (!lines) return at + duration;
  const streaks = Object.assign(document.createElement("span"), { className: "st-traits", innerHTML: LINES });
  Object.assign(streaks.style, HIDDEN);
  actor.turn.append(streaks); // beside its sticker, out of its rocking pose
  tl.fromTo(streaks, { x: 0 }, { x: -DRIFT, duration: stroke * 2, ease: "power1.out", repeat: strokes / 2 - 1, immediateRender: false }, at);
  tl.fromTo(streaks, { autoAlpha: 0 }, { autoAlpha: 1, duration: stroke, ease: "sine.out", yoyo: true, repeat: strokes - 1, immediateRender: false }, at);
  return at + duration;
}

/** defile(tl, at, { stage, layers, distance, duration, ease }): from `at` s for `duration` s, the decor (`layers`, a
 *  scene's elements) gliding left past the two of them as they ride right (a negative `distance`: gliding right as they
 *  ride left): each layer `distance` × its depth (units), from half that right of its place to half that left of it
 *  (stage.pan(), x), its course centred on it: a layer that much wider than the widest screen covers it all along. →
 *  its end (s). */
export function defile(tl, at, { stage, layers, distance, duration, ease = "none" }) {
  stage.pan(tl, at, { x: -distance / 2, duration: 0, only: layers });
  stage.pan(tl, at, { x: distance / 2, duration, ease, only: layers });
  return at + duration;
}
