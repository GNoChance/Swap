// The intros' actors (spec § 4): stickers standing in the scene. A person has a sticker per side (face, dos) and pose,
// a vehicle one per view, a sticker of several people together is a plain actor. Each actor holds an <img> per look it
// uses, all loaded before the intro plays (preload()), and the timeline shows one look at a time (a set: it holds under
// seek). An actor stands on its point (x, y: the middle of its feet or wheels, in stage units) in its layer; it moves
// on its own (x, y), turns or flips (scaleX) and hops, sways, leans (y, rotation) in three nested boxes, the last one
// drawn apart (css/intros.css, st-actor*). Reads `window` only in its functions.
import { sfx } from "../../audio.js";
import { content } from "../../content.js";
import { fallbackUrl, stickerUrl, vehicleFallback, vehicleUrl } from "./urls.js";
import { W } from "./stage.js";

const HIDDEN = { opacity: "0", visibility: "hidden" }; // autoAlpha 0, without reading the page's styles
const SHOWN = { opacity: "", visibility: "" };
const box = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });

/** The base of every actor: its boxes in `layer` at x, y, and its looks (one <img> each, `size`: its height, or its
 *  width with `wide`). Actor = { el, layer, x, y, imgs, look(key, src, fallback), wear(key), wearAt(tl, at, key) }. */
function cast({ layer, x, y, size, wide = false }) {
  const el = box("div", "st-actor");
  const turn = box("div", "st-actor__turn");
  const pose = box("div", "st-actor__pose");
  turn.append(pose);
  el.append(turn);
  el.style.left = `${x + (parseFloat(layer.style.width) - W) / 2}px`; // the layer's inline width: its x 0 is the stage's
  el.style.top = `${y}px`;
  layer.append(el);
  const looks = new Map(); // key → <img>
  const self = {
    el,
    turn,
    pose,
    layer,
    x,
    y,
    get imgs() {
      return [...looks.values()];
    },
    /** The look `key` (its sticker `src`, its stand-in `fallback`), made once, hidden. */
    look(key, src, fallback) {
      if (looks.has(key)) return looks.get(key);
      const img = Object.assign(box("img", "st-actor__img"), { src, alt: "", draggable: false });
      if (fallback) img.dataset.fallback = fallback;
      img.style[wide ? "width" : "height"] = `${size}px`;
      Object.assign(img.style, HIDDEN);
      looks.set(key, img);
      pose.append(img);
      return img;
    },
    /** Shows the look `key` now (before the timeline plays). */
    wear(key) {
      for (const [k, img] of looks) Object.assign(img.style, k === key ? SHOWN : HIDDEN);
    },
    /** Shows the look `key` at `at` s. */
    wearAt(tl, at, key) {
      for (const [k, img] of looks) tl.set(img, { autoAlpha: k === key ? 1 : 0 }, at);
    },
  };
  return self;
}

/** actor({ stage, layer, src, fallback, x, y, height }): a sticker on its own. */
export function actor({ layer, src, fallback, x, y, height }) {
  const self = cast({ layer, x, y, size: height });
  self.look("sticker", src, fallback);
  self.wear("sticker");
  return self;
}

/** A small hop of `target` (y), `height` units, landing with a squash, from `at` s; → when it has landed. */
function hopOf(tl, target, at, height, rise = 0.16) {
  tl.to(target, { y: -height, duration: rise, ease: "power2.out" }, at)
    .to(target, { y: 0, duration: rise, ease: "power2.in" }, at + rise)
    .to(target, { scaleX: 1.06, scaleY: 0.92, duration: 0.05, ease: "power1.out" }, at + 2 * rise)
    .to(target, { scaleX: 1, scaleY: 1, duration: 0.09, ease: "power1.inOut" }, at + 2 * rise + 0.05);
  return at + 2 * rise + 0.14;
}

// the signs a person carries over her (emote()): a bubble with words, or a drawing
const SIGNS = {
  dots: () => bubble(content.aventures.intros.dots),
  moo: () => bubble(content.aventures.intros.moo),
  sweat: () => drawing("st-emote--sweat", `<path d="M6 2C3 7 2 9 2 11a4 4 0 0 0 8 0c0-2-1-4-4-9zM18 8c-2 4-3 5-3 7a3 3 0 0 0 6 0c0-2-1-3-3-7z" fill="#8fc3e6" stroke="#fff" stroke-width="1.6"/>`),
  zap: () => drawing("st-emote--zap", `<path d="M13 1L3 14h7l-3 11 11-14h-7z" fill="#f6c453" stroke="#3b2a18" stroke-width="1.4" stroke-linejoin="round"/>`),
};
const bubble = (text) => Object.assign(box("span", "st-emote st-emote--bubble"), { textContent: text });
function drawing(cls, markup) {
  const el = box("span", `st-emote ${cls}`);
  el.innerHTML = `<svg viewBox="0 0 24 26" width="24" height="26">${markup}</svg>`;
  return el;
}

/** person({ stage, layer, outing, who, x, y, height, side, pose }): Cycy or Kevin (`who`), `height` units tall, from the
 *  front or the back (`side`: "face" or "dos") in one of the 12 poses. Person = Actor + { set, into, turn, hop, jump,
 *  bob, stamp, lean, emote }. */
export function person({ layer, outing, who, x, y, height, side = "face", pose = "joie" }) {
  const self = cast({ layer, x, y, size: height });
  self.el.dataset.who = who;
  const look = (s, p) => self.look(`${s}-${p}`, stickerUrl(outing, who, s, p), fallbackUrl(who, s, p));
  const signs = new Map();
  Object.assign(self, {
    /** From the front or the back, in a pose, now (before the timeline plays). */
    set(s, p) {
      look(s, p);
      self.wear(`${s}-${p}`);
    },
    /** Into side `s` and pose `p` at `at` s, at once. */
    into(tl, at, s, p) {
      look(s, p);
      self.wearAt(tl, at, `${s}-${p}`);
    },
    /** Turns round at `at` s (face ↔ dos), into `p`: squeezed to nothing and back. */
    turn(tl, at, s, p) {
      look(s, p);
      tl.to(self.turn, { scaleX: 0, duration: 0.08, ease: "power1.in" }, at);
      self.wearAt(tl, at + 0.08, `${s}-${p}`);
      tl.to(self.turn, { scaleX: 1, duration: 0.1, ease: "power1.out" }, at + 0.08);
    },
    /** A hop on the spot, `height` units; → when it has landed. */
    hop: (tl, at, height = 14) => hopOf(tl, self.pose, at, height),
    /** A jump: crouched, then high; → when it has landed. */
    jump(tl, at) {
      tl.to(self.pose, { scaleY: 0.9, scaleX: 1.05, duration: 0.1, ease: "power1.out" }, at).to(self.pose, { scaleY: 1, scaleX: 1, duration: 0.08 }, at + 0.1);
      return hopOf(tl, self.pose, at + 0.1, 40, 0.24);
    },
    /** Walking for `duration` s: a sway from foot to foot, `step` s a step, `sway` degrees either side of `lean`, lifted
     *  `lift` units a step. */
    bob(tl, at, duration, { step = 0.18, sway = 2.5, lift = 3, lean = 0 } = {}) {
      const steps = Math.max(2, Math.round(duration / step) & ~1); // an even count: it ends upright
      tl.fromTo(self.pose, { rotation: lean - sway }, { rotation: lean + sway, duration: step, ease: "sine.inOut", repeat: steps - 1, yoyo: true, immediateRender: false }, at)
        .to(self.pose, { y: -lift, duration: step / 2, ease: "sine.out", repeat: steps * 2 - 1, yoyo: true }, at)
        .to(self.pose, { rotation: 0, duration: 0.1 }, at + steps * step);
    },
    /** Taps a foot `count` times from `at` s, impatient, a step's sound each. → when done. */
    stamp(tl, at, count = 4) {
      const beat = 0.3;
      for (let k = 0; k < count; k++) {
        const t = at + k * beat;
        tl.to(self.pose, { rotation: 3, y: -5, duration: 0.07, ease: "power1.out" }, t).to(self.pose, { rotation: 0, y: 0, duration: 0.08, ease: "power2.in" }, t + 0.07);
        tl.call(() => sfx("step"), null, t + 0.15);
      }
      return at + count * beat;
    },
    /** Leans by `degrees` (towards the back for a negative angle) in `duration` s, and stays so. */
    lean(tl, at, degrees, duration = 0.3) {
      tl.to(self.pose, { rotation: degrees, duration, ease: "power2.out" }, at);
    },
    /** A sign over her for `duration` s: "dots" (« … »), "sweat" (drops), "zap" (a flash in her back) or "moo". */
    emote(tl, at, kind, duration = 1) {
      if (!signs.has(kind)) {
        const sign = SIGNS[kind]();
        Object.assign(sign.style, HIDDEN);
        self.pose.append(sign);
        signs.set(kind, sign);
      }
      const sign = signs.get(kind);
      tl.fromTo(sign, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: "back.out(2.4)", immediateRender: false }, at);
      if (kind === "sweat") tl.fromTo(sign, { y: 0 }, { y: 5, duration: 0.3, repeat: Math.max(1, Math.round(duration / 0.3) - 1), ease: "power1.in", immediateRender: false }, at + 0.2);
      tl.to(sign, { autoAlpha: 0, scale: 0.6, duration: 0.18, ease: "power1.in" }, at + duration);
    },
  });
  self.set(side, pose);
  return self;
}

// a puff of paper smoke: three discs, their shadow under them
const PUFF = `<svg viewBox="-14 -12 28 24" width="28" height="24"><g fill="#3b2a18" fill-opacity=".16" transform="translate(0 2)"><circle cx="-5" cy="2" r="7"/><circle cx="4" cy="0" r="8"/><circle cx="0" cy="-5" r="6"/></g><g fill="#f3ede2"><circle cx="-5" cy="2" r="7"/><circle cx="4" cy="0" r="8"/><circle cx="0" cy="-5" r="6"/></g><path d="M-6-6a6 6 0 0 1 9-3" fill="none" stroke="#fffaf0" stroke-width="1.4" stroke-linecap="round"/></svg>`;

/** vehicle({ stage, layer, name, x, y, width, view }): the car (`name`, as in vehicleUrl()), `width` units wide, in one
 *  of its 12 views (its turn box flips it: scaleX −1). Vehicle = Actor + { view, drive, bounce, smoke, brake }. */
export function vehicle({ layer, name: car, x, y, width, view = "trois-quarts" }) {
  const self = cast({ layer, x, y, size: width, wide: true });
  self.el.dataset.vehicle = car;
  const k = width / 150; // its moves, for a car 150 units wide
  const look = (name) => self.look(name, vehicleUrl(car, name), vehicleFallback());
  look(view);
  self.wear(view);
  return Object.assign(self, {
    /** Into the view `name` at `at` s. */
    view(tl, at, name) {
      look(name);
      self.wearAt(tl, at, name);
    },
    /** Drives to the stage's x `toX` (from `fromX` if given) in `duration` s. */
    drive(tl, at, { fromX, toX, duration = 0.6, ease = "power3.out" }) {
      const to = { x: toX - x, duration, ease };
      if (fromX === undefined) tl.to(self.el, to, at);
      else tl.fromTo(self.el, { x: fromX - x }, { ...to, immediateRender: false }, at);
    },
    /** Bumps on the road for `duration` s. */
    bounce(tl, at, duration) {
      const bump = 0.09;
      tl.to(self.pose, { y: -2.6 * k, duration: bump, ease: "sine.out", repeat: Math.max(1, Math.round(duration / bump) & ~1) - 1, yoyo: true }, at);
    },
    /** `puffs` puffs of paper smoke from its back (its right, the stickers facing left), 0.12 s apart. */
    smoke(tl, at, puffs = 3) {
      for (let i = 0; i < puffs; i++) {
        const puff = box("span", "st-puff");
        puff.innerHTML = PUFF;
        Object.assign(puff.style, HIDDEN, { left: `${width * 0.84}px`, bottom: `${width * 0.03}px` });
        self.turn.append(puff);
        const when = at + i * 0.12;
        tl.fromTo(puff, { autoAlpha: 1, x: 0, y: 0, scale: 0.35 * k }, { x: 26 * k, y: -12 * k, scale: 1.25 * k, duration: 0.55, ease: "power1.out", immediateRender: false }, when).to(
          puff,
          { autoAlpha: 0, duration: 0.25, ease: "power1.in" },
          when + 0.3,
        );
      }
    },
    /** Brakes at `at` s: a screech, the nose dips and comes back. */
    brake(tl, at) {
      tl.call(() => sfx("brake"), null, at)
        .to(self.pose, { rotation: -3.5, scaleY: 0.96, duration: 0.08, ease: "power2.out" }, at)
        .to(self.pose, { rotation: 0, scaleY: 1, duration: 0.35, ease: "elastic.out(1.2, 0.45)" }, at + 0.08);
    },
  });
}

/** preload(imgs, timeout): resolves once every image has arrived or failed; a failed one goes once to its stand-in
 *  (data-fallback). At `timeout` ms, those not there yet go to their stand-in, and it resolves all the same. */
export function preload(imgs, timeout = 4000) {
  const late = new Set(imgs);
  const swap = (img) => {
    if (!img.dataset.fallback || img.dataset.fell) return false;
    img.dataset.fell = "true";
    img.src = img.dataset.fallback;
    return true;
  };
  const there = (img) => img.complete && img.naturalWidth > 0; // a decode() can fail on an image that did arrive (WebKit)
  const arrive = (img) =>
    img
      .decode()
      .catch(() => (!there(img) && swap(img) ? img.decode().catch(() => {}) : undefined))
      .then(() => late.delete(img));
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      for (const img of late) if (img.isConnected) swap(img); // left already: nothing to load any more
      resolve();
    }, timeout);
    Promise.all(imgs.map(arrive)).then(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
