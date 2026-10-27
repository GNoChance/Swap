// The secret ending, once every debrief ending is found: Mini Cycy takes her behind the scenes of the swap,
// then the mastermind walks in: Kevin. A tap writes the current line at once, or moves on to the next one.
import { content } from "./content.js";
import { fill, seeSecret } from "./logic.js";
import { sfx, startMusic, stopMusic } from "./audio.js";
import { fireworks, hearts } from "./effects.js";
import { createAvatar, preloadFaces } from "./avatar.js";
import { createBubble } from "./scenes.js";
import { starField } from "./debrief.js";
import { loadDebrief, saveDebrief } from "./state.js";
import { h, bump } from "./dom.js";

const gsap = window.gsap;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** preview (?secret): nothing is saved. */
export function secretScreen({ preview = false, onReplay, onBack }) {
  const d = content.debrief;
  const sec = d.secret;
  const total = Object.keys(d.endings).length;
  const lines = sec.script.filter((line) => !line.reply);
  preloadFaces([...lines.map((line) => line.face), sec.end.cycy, sec.end.kevin]);

  const cycy = createAvatar({ face: lines[0]?.face || "wink", size: 112 });
  const kevin = createAvatar({ face: lines.find((line) => line.who === "kevin")?.face || "kevin-wink", size: 112 });
  const cycySlot = h("div", { class: "secret-actor" }, cycy.el);
  const kevinSlot = h("div", { class: "secret-actor", hidden: true }, kevin.el);
  const actors = { cycy, kevin };

  const bubble = createBubble();
  const speaker = h("p", { class: "secret-name" });
  const say = h("div", { class: "secret-say" }, speaker, bubble.el);
  const replyEl = h("div", { class: "debrief-choices secret-reply" });
  const stage = h(
    "div",
    { class: "debrief-stage secret-stage" },
    h("div", { class: "intro-bubble-slot debrief-bubble" }, say),
    h("div", { class: "secret-cast" }, cycySlot, kevinSlot),
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

  /** Kevin walks in from the right; Mini Cycy slides over to make room. */
  async function enterKevin() {
    const before = cycySlot.getBoundingClientRect().left;
    kevinSlot.hidden = false;
    const after = cycySlot.getBoundingClientRect().left;
    gsap.from(cycySlot, { x: before - after, duration: 0.7, ease: "power2.out" });
    gsap.fromTo(kevinSlot, { x: innerWidth / 2 + 140 }, { x: 0, duration: 0.9, ease: "power3.out" });
    gsap.to(kevinSlot, { keyframes: { y: [0, -34, 0, -20, 0] }, duration: 0.9, ease: "none" });
    sfx("whoosh");
    cycy.react("surprised2", 1600);
    await sleep(950);
    sfx("reveal");
    kevin.jump(30);
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
      if (line.enter) await enterKevin();
      if (left) return;
      if (line.sound) sfx(line.sound);
      actors[line.who].set(line.face);
      actors[line.who].jump(10);
      speaker.textContent = sec.names[line.who];
      say.classList.toggle("is-kevin", line.who === "kevin");
      // with both of them on screen, the bubble's tail points at whoever speaks
      say.dataset.side = kevinSlot.hidden ? "" : line.who === "kevin" ? "right" : "left";
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
        endCast.append(cycySlot, kevinSlot);
        kevinSlot.hidden = false;
        gsap.set([cycySlot, kevinSlot], { x: 0, y: 0 });
        stage.remove();
        gsap.fromTo(ending, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
        gsap.from(ending.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.12, delay: 0.1, ease: "power2.out", clearProps: "opacity,transform" });
        cycy.setBase(sec.end.cycy);
        kevin.setBase(sec.end.kevin);
        cycy.jump(30);
        setTimeout(() => !left && kevin.jump(30), 220);
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
