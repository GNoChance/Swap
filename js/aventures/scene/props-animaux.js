// The intros' animals (spec § 4 and § 5): the Blonde d'Aquitaine cows of the Ossau valley (lying, standing, walking
// off), the border collie (trotting, barking), the snail, and the puffs of dust they raise; drawn in code in paper,
// each piece with its shadow and light edge (a « vaches et berger » sticker sheet may replace them later). Each is an
// element standing on its point (x, y: under its feet) in a layer, facing left, with its moves on a timeline (sets and
// tweens: they hold under seek). Reads `window` only in its functions.
import { sfx } from "../../audio.js";
import { content } from "../../content.js";
import { cutPiece } from "./decor.js";
import { blob, dot, path, poly } from "./geom.js";
import { W } from "./stage.js";

const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles
const box = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });
const svg = (viewBox, size, markup) => `<svg viewBox="${viewBox.join(" ")}" width="${viewBox[2] * size}" height="${viewBox[3] * size}">${markup}</svg>`;
const line = (d, stroke, width) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** Its shadow on the ground: a flat soft ellipse under its feet, `w` wide. */
const ground = (w) => `<ellipse cx="0" cy="1" rx="${w / 2}" ry="${w / 14}" fill="#3b2a18" fill-opacity=".2"/>`;

/** An animal's element: its boxes in `layer` at x, y (turn: its facing; body: its hops and sways, drawn apart), its
 *  looks (markup each) stacked in the body. → { el, turn, body, looks }. */
function creature({ layer, x, y, cls, looks }) {
  const el = box("div", `st-prop ${cls}`);
  const turn = box("div", "st-prop__turn");
  const body = box("div", "st-prop__body");
  turn.append(body);
  el.append(turn);
  el.style.left = `${x + (parseFloat(layer.style.width) - W) / 2}px`; // the layer's x 0 is the stage's
  el.style.top = `${y}px`;
  const shown = looks.map((markup, k) => {
    const look = box("span", "st-prop__look");
    look.innerHTML = markup;
    if (k) Object.assign(look.style, HIDDEN);
    body.append(look);
    return look;
  });
  layer.append(el);
  return { el, turn, body, looks: shown };
}

/** Shows look `k` of `looks` at `at` s. */
const wearAt = (tl, at, looks, k) => looks.forEach((look, i) => tl.set(look, { autoAlpha: i === k ? 1 : 0 }, at));

/** A bubble of words `lift` units over an animal's point (outside its turn box: never mirrored), popping at `at` s for
 *  `duration` s. */
function say(tl, at, { el }, text, duration, lift) {
  let bubble = el.querySelector(":scope > .st-emote");
  if (!bubble) {
    bubble = Object.assign(box("span", "st-emote st-emote--bubble"), { textContent: text });
    Object.assign(bubble.style, HIDDEN, { bottom: `${lift}px` });
    el.append(bubble);
  }
  tl.fromTo(bubble, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: "back.out(2.4)", immediateRender: false }, at);
  tl.to(bubble, { autoAlpha: 0, scale: 0.7, duration: 0.16, ease: "power1.in" }, at + duration);
}

// ── The cow ─────────────────────────────────────────────────

const COW = { hide: "#e8cd9a", shade: "#cfac75", lit: "#f6e5c0", far: "#c4a26c", edge: "#a98552", muzzle: "#eec5ab", inner: "#e2a98e", hoof: "#5b4a3a", horn: "#f4edda", tip: "#9c8b6a", collar: "#2f2a27", bell: "#b0913f", ink: "#3b2a18", tuft: "#a8834f" };

/** The cow's head (its muzzle at the left), moved by dx, dy: the head and its forelock, ear, horn, broad pink muzzle,
 *  eye; the collar and its big bell. → { outline, markup }. */
function cowHead(dx, dy) {
  const at = (list) => list.map(([x, y]) => [x + dx, y + dy]);
  const head = blob(at([[-30, -50], [-38, -58], [-50, -59], [-58, -51], [-63, -41], [-61, -31], [-53, -27], [-42, -29], [-32, -37]]));
  const muzzle = blob(at([[-63, -42], [-55, -40], [-51, -32], [-57, -27], [-64, -31]]));
  const forelock = blob(at([[-44, -58], [-38, -61], [-34, -56], [-40, -55]]));
  const ear = poly(at([[-37, -55], [-25, -61], [-22, -56], [-32, -51]]));
  const inner = poly(at([[-33, -55], [-26, -58], [-25, -56], [-31, -53]]));
  const horn = poly(at([[-48, -57], [-51, -64], [-47, -69], [-44, -64], [-44, -57]]));
  const tip = poly(at([[-50.5, -65], [-47, -69], [-45.5, -66]]));
  const collar = poly(at([[-35, -53], [-29, -54], [-25, -33], [-31, -31]]));
  const bell = poly(at([[-36, -34], [-23, -34], [-21, -21], [-38, -21]]));
  const p = (x, y) => [x + dx, y + dy];
  return {
    outline: head,
    markup: [
      path(head, COW.hide),
      path(forelock, COW.lit),
      path(ear, COW.shade),
      path(inner, COW.inner),
      path(horn, COW.horn),
      path(tip, COW.tip),
      path(muzzle, COW.muzzle),
      path(dot(...p(-60.5, -33), 1) + dot(...p(-56, -32.5), 1), COW.ink),
      path(dot(...p(-49, -48), 1.8), COW.ink),
      path(dot(...p(-48.4, -48.7), 0.6), "#fff"),
      path(collar, COW.collar),
      path(bell, COW.bell),
      path(dot(...p(-29.5, -21.5), 1.5), COW.collar),
    ].join(""),
  };
}

/** A standing cow, facing left (its feet on y 0): a deep body, its withers and hips, four stout legs. */
function cowStanding() {
  const body = blob([[-34, -32], [-28, -48], [-10, -54], [10, -52], [28, -54], [41, -47], [44, -34], [40, -22], [26, -18], [6, -15], [-14, -17], [-28, -21]]);
  const belly = blob([[-24, -20], [6, -16], [28, -19], [38, -25], [6, -23]]);
  const back = blob([[-24, -49], [-6, -53], [12, -50], [28, -53], [12, -48]]);
  const leg = (x, top, fill) => path(poly([[x, top], [x + 8, top], [x + 7, -3], [x + 1, -3]]), fill) + path(poly([[x + 0.5, -4], [x + 7.5, -4], [x + 8, 0], [x, 0]]), COW.hoof);
  const legsAt = [[-25, -26], [28, -28]];
  const head = cowHead(0, 0);
  const tail = line("M43 -46C48 -40 48 -30 46 -21", COW.shade, 2.4) + path(dot(46, -19.5, 2.8), COW.tuft);
  const outline = body + head.outline + legsAt.map(([x, top]) => poly([[x, top], [x + 8, top], [x + 8, 0], [x, 0]])).join("");
  return (
    ground(84) +
    cutPiece({
      silhouette: outline,
      markup: [leg(-16, -24, COW.far), leg(20, -26, COW.far), tail, path(body, COW.hide), path(belly, COW.shade), path(back, COW.lit), ...legsAt.map(([x, top]) => leg(x, top, COW.hide)), head.markup, `<path d="${body}" fill="none" stroke="${COW.edge}" stroke-opacity=".55" stroke-width="1.1"/>`].join(""),
      edge: "M-26 -49C-12 -54 12 -51 28 -53",
      lift: 0.6,
    })
  );
}

/** A cow lying down, facing left, chewing: its round body on the ground, a hind leg folded along its side, its front
 *  legs tucked under its chest, its head up. */
function cowLying() {
  const body = blob([[-32, -24], [-24, -38], [-4, -43], [16, -42], [33, -39], [45, -28], [47, -13], [40, -3], [20, -1], [-6, -1], [-24, -3], [-33, -12]]);
  const belly = blob([[-24, -5], [4, -2], [30, -3], [40, -8], [4, -9]]);
  const back = blob([[-20, -38], [0, -42.5], [26, -40], [8, -37]]);
  const haunch = blob([[12, -31], [30, -34], [41, -20], [32, -8], [12, -12]]);
  const hock = poly([[36, -9], [46, -6], [48, -1], [38, -1]]);
  const fore = blob([[-24, -9], [-40, -8], [-46, -2], [-22, 0]]);
  const head = cowHead(4, 14);
  const tail = line("M46 -20C52 -14 50 -6 55 -2", COW.shade, 2.4) + path(dot(55.5, -1.6, 2.6), COW.tuft);
  return (
    ground(92) +
    cutPiece({
      silhouette: body + head.outline + fore,
      markup: [tail, path(body, COW.hide), path(belly, COW.shade), path(back, COW.lit), path(haunch, COW.lit), `<path d="M14 -30C26 -34 38 -28 40 -18" fill="none" stroke="${COW.shade}" stroke-width="1.4"/>`, path(hock, COW.shade), path(dot(47, -2, 1.8), COW.hoof), path(fore, COW.shade), path(dot(-44, -2.4, 2), COW.hoof), head.markup, `<path d="${body}" fill="none" stroke="${COW.edge}" stroke-opacity=".55" stroke-width="1.1"/>`].join(""),
      edge: "M-22 -38C-8 -43 14 -43 33 -39",
      lift: 0.6,
    })
  );
}

const COW_VIEW = [-66, -72, 128, 74];
/** A puff of dust from the ground (puff()), dropped at the creature's feet. */
const dustAt = (layer, x, y) => puff({ layer, x, y });

/** cow({ layer, x, y, size, facing, pose }): a cow, `size` times 124 units wide, lying ("couchee") or standing
 *  ("debout"), facing "left" or "right". Cow = { el, rise, leave, moo }. */
export function cow({ layer, x, y, size = 1, facing = "left", pose = "couchee" }) {
  const self = creature({ layer, x, y, cls: "st-cow", looks: [svg(COW_VIEW, size, cowLying()), svg(COW_VIEW, size, cowStanding())] });
  const [lying, standing] = self.looks;
  if (pose === "debout") {
    Object.assign(lying.style, HIDDEN);
    Object.assign(standing.style, { opacity: "", visibility: "" });
  }
  let right = facing === "right";
  if (right) self.turn.style.transform = "scaleX(-1)";
  const dust = dustAt(layer, x + (right ? -16 : 16) * size, y);
  return Object.assign(self, {
    /** Gets up at `at` s: a heave, standing, a puff of dust. → when it stands. */
    rise(tl, at) {
      tl.to(self.body, { scaleY: 0.86, scaleX: 1.06, duration: 0.08, ease: "power1.out" }, at);
      wearAt(tl, at + 0.08, self.looks, 1);
      tl.to(self.body, { y: -7 * size, scaleY: 1.06, scaleX: 0.97, duration: 0.12, ease: "power2.out" }, at + 0.08)
        .to(self.body, { y: 0, scaleY: 1, scaleX: 1, duration: 0.14, ease: "power2.in" }, at + 0.2);
      dust.blow(tl, at + 0.1, { dx: right ? -10 : 10 });
      return at + 0.34;
    },
    /** Walks off by dx units (turning round to go that way) in `duration` s, swaying, fading as it goes. */
    leave(tl, at, { dx, duration = 0.8 }) {
      if (dx > 0 !== right) {
        right = dx > 0;
        tl.set(self.turn, { scaleX: right ? -1 : 1 }, at);
      }
      const step = 0.16;
      tl.to(self.el, { x: dx, duration, ease: "power1.in" }, at)
        .fromTo(self.body, { rotation: -3 }, { rotation: 3, duration: step, ease: "sine.inOut", repeat: Math.round(duration / step) - 1, yoyo: true, immediateRender: false }, at)
        .to(self.el, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, at + duration - 0.25);
    },
    /** « Meuh ! » at `at` s: its head up, a bubble, the sound. */
    moo(tl, at, duration = 0.8) {
      tl.call(() => sfx("moo"), null, at);
      tl.fromTo(self.body, { rotation: 0 }, { rotation: -4, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1, immediateRender: false }, at);
      say(tl, at, self, content.aventures.intros.moo, duration, 52 * size);
    },
  });
}

// ── The border collie ───────────────────────────────────────

const DOG = { coat: "#26262b", white: "#f7f3ea", eye: "#7a5230", tongue: "#e48a86" };

/** The collie's body, head and tail, facing left, and its legs in one of two strides (`gathered` or stretched). */
function collie(gathered) {
  const body = blob([[-16, -22], [-6, -25], [10, -24], [19, -20], [20, -13], [10, -11], [-6, -11], [-15, -13]]);
  const chest = blob([[-19, -20], [-13, -21], [-9, -14], [-12, -9], [-18, -12]]);
  const head = blob([[-16, -26], [-21, -33], [-28, -34], [-33, -28], [-31, -22], [-23, -20]]);
  const ear = poly([[-21, -31], [-18, -39], [-14, -30]]);
  const blaze = poly([[-27, -34], [-25, -34], [-27, -25], [-30, -24]]);
  const muzzle = blob([[-32, -28], [-37.5, -25.5], [-36, -22], [-29, -22]]);
  const legs = gathered
    ? [["M-12 -13L-6 -1"], ["M-8 -13L-1 -2"], ["M12 -13L4 -1"], ["M16 -13L9 -2"]]
    : [["M-12 -13L-23 -2"], ["M-8 -13L-17 -1"], ["M12 -13L23 -3"], ["M16 -13L27 -2"]];
  const paws = gathered ? [[-6, -1], [-1, -2], [4, -1], [9, -2]] : [[-23, -2], [-17, -1], [23, -3], [27, -2]];
  const tail = line("M19 -20C26 -25 30 -29 34 -25", DOG.coat, 3.4) + path(dot(34.5, -24.5, 2.3), DOG.white);
  const outline = body + head + ear;
  return (
    ground(40) +
    cutPiece({
      silhouette: outline,
      markup: [
        legs.map(([d]) => line(d, DOG.coat, 3.4)).join(""),
        paws.map(([px, py]) => path(dot(px, py, 1.9), DOG.white)).join(""),
        tail,
        path(body, DOG.coat),
        path(chest, DOG.white),
        path(head, DOG.coat),
        path(ear, DOG.coat),
        path(blaze, DOG.white),
        path(muzzle, DOG.white),
        path(dot(-37.3, -25.3, 1.2), DOG.coat),
        path(dot(-25.5, -29.5, 1.3), DOG.eye),
      ].join(""),
      edge: "M-14 -24C-4 -26 8 -25.5 18 -21",
      lift: 0.5,
    })
  );
}

const DOG_VIEW = [-42, -42, 84, 44];

/** dog({ layer, x, y, size }): the border collie, `size` times 84 units wide, facing left. Dog = { el, run, bark }. */
export function dog({ layer, x, y, size = 1 }) {
  const self = creature({ layer, x, y, cls: "st-dog", looks: [svg(DOG_VIEW, size, collie(false)), svg(DOG_VIEW, size, collie(true))] });
  let right = false;
  return Object.assign(self, {
    /** Trots from its x (or fromX) to toX (stage units) in `duration` s, its legs striding, facing where it goes. */
    run(tl, at, { fromX = x, toX, duration, ease = "none" }) {
      const goesRight = toX > fromX;
      if (goesRight !== right) {
        right = goesRight;
        tl.set(self.turn, { scaleX: right ? -1 : 1 }, at);
      }
      tl.fromTo(self.el, { x: fromX - x }, { x: toX - x, duration, ease, immediateRender: false }, at);
      const stride = 0.09;
      for (let k = 0; k * stride < duration; k++) wearAt(tl, at + k * stride, self.looks, k % 2);
      wearAt(tl, at + duration, self.looks, 0);
      tl.fromTo(self.body, { y: 0 }, { y: -2.4 * size, duration: stride, ease: "sine.out", repeat: Math.max(1, Math.round(duration / stride) & ~1) - 1, yoyo: true, immediateRender: false }, at);
    },
    /** « Ouaf ! » at `at` s: its head jolts, a bubble, the sound. */
    bark(tl, at) {
      tl.call(() => sfx("bark"), null, at);
      tl.fromTo(self.body, { rotation: 0 }, { rotation: right ? 7 : -7, duration: 0.07, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, at);
      say(tl, at, self, content.aventures.intros.bark, 0.5, 40 * size);
    },
  });
}

// ── The snail ───────────────────────────────────────────────

/** The snail, facing left: its foot and eye stalks, its spiral shell, the speed lines behind it. */
function snailDrawing() {
  const foot = blob([[-22, -2], [-25, -8], [-22, -15], [-16, -14], [-11, -7], [8, -5], [20, -3], [25, 0], [0, 0.5]]);
  const shell = dot(4, -15, 12.5);
  const spiral = "M4.5 -15.5a2.5 2.5 0 1 1 2 -3a5 5 0 1 1 -7 6a8 8 0 1 1 11.5 -9.5";
  return (
    line("M24 -25h14M28 -16h18M26 -7h13", "#5e5240", 2.6) + // its speed
    ground(42) +
    cutPiece({
      silhouette: foot + shell,
      markup: [
        line("M-20 -13L-26 -26M-16 -13L-17 -28", "#8f7d5e", 2),
        path(dot(-26, -26.5, 2.4) + dot(-17, -28.5, 2.4), "#3b2a18"),
        path(foot, "#a99272"),
        path(blob([[-21, -12], [-16, -13], [-12, -8], [6, -5.5], [-14, -7]]), "#c8b493"),
        path(dot(-21.5, -10, 0.9), "#3b2a18"), // its smile
        path(shell, "#d4843a"),
        path(dot(5, -13.5, 9.5), "#bb6c2c"),
        line(spiral, "#6e3f18", 1.9),
        path(blob([[-5, -24], [2, -27.5], [9, -26], [1, -24.5]]), "#f0c08a"),
        `<path d="${foot}" fill="none" stroke="#7a6748" stroke-width="1" stroke-opacity=".6"/>`,
      ].join(""),
      lift: 0.4,
    })
  );
}

const SNAIL_VIEW = [-30, -32, 72, 34];

/** snail({ layer, x, y, size }): the snail, `size` times 72 units wide, facing left. Snail = { el, slide }. */
export function snail({ layer, x, y, size = 1 }) {
  const self = creature({ layer, x, y, cls: "st-snail", looks: [svg(SNAIL_VIEW, size, snailDrawing())] });
  return Object.assign(self, {
    /** Slides to toX, toY (stage units) in `duration` s, its foot stretching and gathering as it goes. */
    slide(tl, at, { toX, toY = y, duration }) {
      tl.to(self.el, { x: toX - x, y: toY - y, duration, ease: "none" }, at);
      const pulse = 0.22;
      tl.fromTo(self.body, { scaleX: 0.94 }, { scaleX: 1.07, duration: pulse, ease: "sine.inOut", repeat: Math.max(1, Math.round(duration / pulse) & ~1) - 1, yoyo: true, immediateRender: false }, at);
    },
  });
}

// ── The dust ────────────────────────────────────────────────

const PUFF = `<svg viewBox="-14 -12 28 24" width="28" height="24"><g fill="#3b2a18" fill-opacity=".14" transform="translate(0 2)"><circle cx="-5" cy="2" r="7"/><circle cx="4" cy="0" r="8"/><circle cx="0" cy="-5" r="6"/></g><g fill="#eadfc8"><circle cx="-5" cy="2" r="7"/><circle cx="4" cy="0" r="8"/><circle cx="0" cy="-5" r="6"/></g><path d="M-6-6a6 6 0 0 1 9-3" fill="none" stroke="#fffaf0" stroke-width="1.4" stroke-linecap="round"/></svg>`;

/** puff({ layer, x, y }): a puff of dust on the ground at x, y, hidden until it blows. Puff = { el, blow }. */
export function puff({ layer, x, y }) {
  const el = box("span", "st-puff");
  el.innerHTML = PUFF;
  Object.assign(el.style, HIDDEN, { left: `${x - 14 + (parseFloat(layer.style.width) - W) / 2}px`, top: `${y - 18}px` });
  layer.append(el);
  return {
    el,
    /** Blows up and fades from `at` s, drifting dx, dy. */
    blow(tl, at, { dx = 0, dy = -8, scale = 1.4 } = {}) {
      tl.fromTo(el, { autoAlpha: 1, x: 0, y: 0, scale: 0.4 }, { x: dx, y: dy, scale, duration: 0.45, ease: "power1.out", immediateRender: false }, at).to(el, { autoAlpha: 0, duration: 0.2, ease: "power1.in" }, at + 0.28);
    },
  };
}
