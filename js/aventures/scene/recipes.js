// The intros' recipes (spec § 4): reusable pieces of timeline, each → the moment it ends (s). For now, the closing
// poster (spec § 5, moment 6).
import { sfx } from "../../audio.js";
import { h } from "../../dom.js";
import { posterize } from "./decor.js";
import { posterLine, posterTitle } from "./poster-text.js";

const HOLD = 0.9; // s the finished poster stays before the end (at least 0.8)
// where the paper around the picture starts, off the widest screens (units): it closes in from there
const AWAY = { left: { x: -1100 }, right: { x: 1100 }, top: { y: -140 }, bottom: { y: 140 } };

/** affiche(tl, at, { stage, layers, aventure }): from `at` s, the camera back at rest (on a phone held sideways, the
 *  whole stage in the height), a cream frame closing in around the scene as the paper around a portrait poster, its
 *  rule drawn, the layers turning flat one by one (back to front), then the lieu falling letter by letter and the
 *  stamp's name and dates. → when the intro may end (s), the poster held. Its pieces: css/intros.css (af-*). */
export function affiche(tl, at, { stage, layers, aventure }) {
  stage.pan(tl, at, { duration: 0.6, ease: "power2.inOut" });
  stage.frame(tl, at, { whole: true, duration: 0.6 });

  const mats = Object.keys(AWAY).map((side) => h("div", { class: `af-mat af-mat--${side}` }));
  const rules = ["top", "right", "bottom", "left"].map((side) => h("i", { class: `af-rule af-rule--${side}` }));
  const glyphs = [...posterTitle(aventure)].map((c) => (c === " " ? c : h("span", { class: "af-letter" }, c))); // spaces stay text
  const letters = glyphs.filter((glyph) => typeof glyph !== "string");
  const title = h("p", { class: "af-title" }, glyphs);
  const line = h("p", { class: "af-line" }, posterLine(aventure));
  // a layer the camera never moves (depth 0), its poster in stage units
  stage.layer("affiche", { depth: 0 }).append(h("div", { class: "af-poster" }, mats, h("div", { class: "af-frame" }, rules), title, line));
  for (const el of [...mats, title, line]) Object.assign(el.style, { opacity: "0", visibility: "hidden" }); // autoAlpha 0

  // the paper closes in around the picture, then the rule draws itself round it
  tl.call(() => sfx("paper"), null, at).set([...mats, title], { autoAlpha: 1 }, at);
  Object.values(AWAY).forEach((from, k) => tl.fromTo(mats[k], from, { x: 0, y: 0, duration: 0.6, ease: "power3.out" }, at));
  rules.forEach((rule, k) => tl.fromTo(rule, { [k % 2 ? "scaleY" : "scaleX"]: 0 }, { [k % 2 ? "scaleY" : "scaleX"]: 1, duration: 0.22, ease: "power1.inOut" }, at + 0.3 + k * 0.08));

  posterize(tl, at + 0.2, layers, { stagger: 0.09 });

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
