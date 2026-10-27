// The secret ending, once every debrief ending is found: Mini Cycy takes her behind the scenes of the swap,
// then the mastermind walks in, back turned, and turns around: Kevin. It ends on his biceps… and a bite.
// A tap writes the current line at once, or moves on to the next one.
import { content } from "./content.js";
import { fill, seeSecret } from "./logic.js";
import { sfx, startMusic, stopMusic } from "./audio.js";
import { fireworks, hearts } from "./effects.js";
import { createAvatar, preloadFaces } from "./avatar.js";
import { createBubble } from "./scenes.js";
import { starField } from "./debrief.js";
import { loadDebrief, saveDebrief } from "./state.js";
import { h, bump, shake, flash } from "./dom.js";

const gsap = window.gsap;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const src = (face) => `assets/cyrielle/${face}.webp`;

/** preview (?secret): nothing is saved. */
export function secretScreen({ preview = false, onReplay, onBack }) {
  const d = content.debrief;
  const sec = d.secret;
  const total = Object.keys(d.endings).length;
  const lines = sec.script.filter((line) => !line.reply);
  const entrance = lines.find((line) => line.enter);
  preloadFaces(
    lines.flatMap((line) => [line.face, line.duo, typeof line.enter === "string" && line.enter, ...(line.bite || []), ...Object.values(line.react || {})]),
  );
  preloadFaces(Object.values(sec.end));

  const cycy = createAvatar({ face: lines[0]?.face || "wink", size: 112 });
  const kevin = createAvatar({ face: typeof entrance?.enter === "string" ? entrance.enter : entrance?.face || "kevin-wink", size: 112 });
  const cycySlot = h("div", { class: "secret-actor" }, cycy.el);
  const kevinSlot = h("div", { class: "secret-actor", hidden: true }, kevin.el);
  const actors = { cycy, kevin };

  // The two of them in one sticker (the biceps, the bite): replaces the two separate ones
  const duoImg = h("img", { class: "secret-duo-img", alt: "", draggable: "false" });
  const duoSlot = h("div", { class: "secret-duo", hidden: true }, duoImg);
  const cast = h("div", { class: "secret-cast" }, cycySlot, kevinSlot, duoSlot);

  const bubble = createBubble();
  const speaker = h("p", { class: "secret-name" });
  const say = h("div", { class: "secret-say" }, speaker, bubble.el);
  const replyEl = h("div", { class: "debrief-choices secret-reply" });
  const stage = h(
    "div",
    { class: "debrief-stage secret-stage" },
    h("div", { class: "intro-bubble-slot debrief-bubble" }, say),
    cast,
    replyEl,
  );

  const endCast = h("div", { class: "secret-cast" });
  const ending = h(
    "div",
    { class: "debrief-end" },
    h("p", { class: "debrief-end-label" }, fill(sec.label, { n: total + 1, total })),
    h("h1", { class: "debrief-end-title" }, sec.title),
    endCast,
    h(
      "div",
      { class: "debrief-actions" },
      h("button", { class: "btn btn-secondary", type: "button", onclick: () => (sfx("tap"), onReplay()) }, d.replay),
      h("button", { class: "btn btn-secondary", type: "button", onclick: () => (sfx("tap"), onBack()) }, d.back),
    ),
  );

  const el = h("section", { class: "screen screen-debrief screen-secret", onclick: onTap }, starField(), stage, ending);
  let left = false;
  let release = null;

  /** A pause that a tap cuts short. */
  function wait(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(done, ms);
      function done() {
        clearTimeout(timer);
        release = null;
        resolve();
      }
      release = done;
    });
  }

  function onTap() {
    if (bubble.skipTyping()) return;
    release?.();
  }

  /** Her answer: one button, the dialogue goes on once she taps it. */
  function reply(label) {
    return new Promise((resolve) => {
      const button = h(
        "button",
        {
          class: "debrief-choice",
          type: "button",
          onclick(e) {
            e.stopPropagation();
            if (button.disabled) return;
            button.disabled = true;
            sfx("tap");
            bump(button);
            button.classList.add("is-chosen");
            setTimeout(() => {
              gsap.to(button, { opacity: 0, y: 8, duration: 0.3, onComplete: () => replyEl.replaceChildren() });
              resolve();
            }, 600);
          },
        },
        label,
      );
      replyEl.replaceChildren(button);
      gsap.from(button, { opacity: 0, y: 12, duration: 0.4, ease: "power2.out", clearProps: "opacity,transform" });
    });
  }

  /** Kevin walks in from the right; Mini Cycy slides over to make room. Entering with another sticker (back turned):
   *  a second of mystery, and he turns around on his first line. */
  async function enterKevin(line) {
    const before = cycySlot.getBoundingClientRect().left;
    kevinSlot.hidden = false;
    const after = cycySlot.getBoundingClientRect().left;
    gsap.from(cycySlot, { x: before - after, duration: 0.7, ease: "power2.out" });
    gsap.fromTo(kevinSlot, { x: innerWidth / 2 + 140 }, { x: 0, duration: 0.9, ease: "power3.out" });
    gsap.to(kevinSlot, { keyframes: { y: [0, -34, 0, -20, 0] }, duration: 0.9, ease: "none" });
    sfx("whoosh");
    cycy.react("surprised2", 2600);
    await sleep(typeof line.enter === "string" ? 1900 : 950);
    sfx("reveal");
  }

  /** The two separate stickers give way to one of the two of them (first time), or it changes (flip). */
  function showDuo(face) {
    if (duoSlot.hidden) {
      gsap.to([cycySlot, kevinSlot], { autoAlpha: 0, scale: 0.8, duration: 0.25 });
      setTimeout(() => {
        cycySlot.hidden = kevinSlot.hidden = true;
        duoImg.src = src(face);
        duoSlot.hidden = false;
        gsap.fromTo(duoSlot, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" });
      }, 260);
      return;
    }
    gsap
      .timeline()
      .to(duoImg, { scaleX: 0, duration: 0.11, ease: "power2.in", onComplete: () => (duoImg.src = src(face)) })
      .to(duoImg, { scaleX: 1, duration: 0.4, ease: "back.out(3)" });
  }

  /** Silence… then out of nowhere she bites, then harder. */
  async function bite(faces) {
    bubble.hide();
    setTimeout(() => (speaker.textContent = ""), 200); // with the bubble, not before it
    await sleep(1300);
    if (left) return;
    showDuo(faces[0]);
    sfx("crunch");
    shake(cast, 10);
    await sleep(750);
    if (left) return;
    showDuo(faces.at(-1));
    sfx("crunch");
    sfx("wrong");
    flash("rgba(214, 40, 57, 0.55)");
    shake(el, 22);
    await sleep(350);
  }

  async function run() {
    startMusic();
    if (!preview) saveDebrief(seeSecret(loadDebrief()));
    await sleep(700);
    for (const line of sec.script) {
      if (left) return;
      if (line.reply) {
        await reply(line.reply);
        continue;
      }
      if (line.enter) await enterKevin(line);
      if (line.bite) await bite(line.bite);
      if (left) return;
      if (line.sound) sfx(line.sound);
      if (line.duo) showDuo(line.duo);
      else if (line.face) {
        actors[line.who].set(line.face);
        actors[line.who].jump(10);
        // a wide sticker (arms out) is drawn bigger, so he keeps his size
        const slot = line.who === "kevin" ? kevinSlot : cycySlot;
        gsap.to(slot, { scale: line.grow || 1, transformOrigin: "50% 100%", duration: 0.4, ease: "back.out(2)" });
      }
      for (const [who, face] of Object.entries(line.react || {})) actors[who].set(face);
      speaker.textContent = sec.names[line.who];
      say.classList.toggle("is-kevin", line.who === "kevin");
      // with both of them on screen, the bubble's tail points at whoever speaks
      say.dataset.side = kevinSlot.hidden || !duoSlot.hidden ? "" : line.who === "kevin" ? "right" : "left";
      await bubble.say(line.text);
      await wait(1300 + line.text.length * 32);
    }
    if (!left) showEnd();
  }

  function showEnd() {
    bubble.hide();
    gsap.to(stage, {
      autoAlpha: 0,
      duration: 0.45,
      onComplete() {
        if (left) return;
        if (sec.end.duo) {
          duoImg.src = src(sec.end.duo);
          duoSlot.hidden = false;
          gsap.set(duoSlot, { autoAlpha: 1, scale: 1 });
          endCast.append(duoSlot);
        } else {
          endCast.append(cycySlot, kevinSlot);
          cycySlot.hidden = kevinSlot.hidden = false;
          gsap.set([cycySlot, kevinSlot], { x: 0, y: 0, autoAlpha: 1, scale: 1 });
          cycy.setBase(sec.end.cycy);
          kevin.setBase(sec.end.kevin);
        }
        stage.remove();
        gsap.fromTo(ending, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
        gsap.from(ending.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.12, delay: 0.1, ease: "power2.out", clearProps: "opacity,transform" });
        gsap.fromTo(endCast, { scale: 0.85 }, { scale: 1, duration: 0.7, delay: 0.3, ease: "elastic.out(1, 0.45)" });
        sfx("final");
        fireworks();
        setTimeout(() => !left && hearts(34, 1.6), 2600);
      },
    });
  }

  return {
    el,
    enter() {
      run();
    },
    leave() {
      left = true;
      bubble.skipTyping();
      release?.();
      stopMusic(1);
    },
  };
}
