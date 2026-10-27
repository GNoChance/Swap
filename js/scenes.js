// Animated scenes: the welcome (Mini Cyrielle introduces the game, then opens her Monster Munch or Brets)
// and the Nerds bonus between the last gift and the final screen.
import { content } from "./content.js";
import { sfx, unlockAudio } from "./audio.js";
import { crisps, nerds, goldDust } from "./effects.js";
import { createAvatar, variant } from "./avatar.js";
import { h, svg, bump } from "./dom.js";

const gsap = window.gsap;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? Math.min(ms, 200) : ms));

/** Pauses that a tap can cut short, all released at once when the scene is skipped. */
function makeClock() {
  let release = null;
  let cancelled = false;
  return {
    wait(ms) {
      return new Promise((resolve) => {
        const timer = setTimeout(done, reduced ? Math.min(ms, 400) : ms);
        function done() {
          clearTimeout(timer);
          release = null;
          resolve();
        }
        release = done;
      });
    },
    next: () => release?.(),
    cancel() {
      cancelled = true;
      release?.();
    },
    get cancelled() {
      return cancelled;
    },
  };
}

/** Speech bubble that types its text letter by letter. */
export function createBubble() {
  const text = h("p", { class: "bubble-text" });
  const el = h("div", { class: "bubble", hidden: true }, text);
  let finishTyping = null;

  function show(message) {
    finishTyping?.();
    el.hidden = false;
    gsap.set(el, { opacity: 1, scale: 1 });
    text.textContent = message;
  }

  return {
    el,
    show,
    /** Resolves once the whole text is written (a tap writes it at once). */
    say(message) {
      finishTyping?.();
      el.hidden = false;
      text.textContent = "";
      sfx("pop");
      gsap.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.4)" });
      const chars = [...message];
      return new Promise((resolve) => {
        let i = 0;
        const timer = setInterval(() => {
          text.textContent += chars[i++] ?? "";
          if (i >= chars.length) finish();
        }, reduced ? 1 : 26);
        function finish() {
          clearInterval(timer);
          text.textContent = message;
          finishTyping = null;
          resolve();
        }
        finishTyping = finish;
      });
    },
    /** true if a text was being typed (the tap is then used to finish it). */
    skipTyping() {
      if (!finishTyping) return false;
      finishTyping();
      return true;
    },
    hide() {
      gsap.to(el, { opacity: 0, scale: 0.9, duration: 0.2, onComplete: () => (el.hidden = true) });
    },
  };
}

// Generic crisp bags (blue for Monster Munch, golden for Brets), only seen for a split second while they fall into her hands.
const BAG = "M8 9l5-5 5 5 6-5 5 5 6-5 5 5 6-5 5 5 6-5 5 5 6-5 5 5v82l-5 5-5-5-6 5-5-5-6 5-5-5-6 5-5-5-6 5-5-5-6 5-5-5z";
const PACKET_SVG = {
  munch: `
<svg class="intro-packet" viewBox="0 0 80 100" width="74" height="92" aria-hidden="true">
  <path fill="#1f3fa6" d="${BAG}"/>
  <path fill="#e3242b" d="M14 20h52v15H14z"/>
  <circle cx="40" cy="64" r="17" fill="#3d6fe0"/>
  <g fill="#f2a93b"><circle cx="31" cy="60" r="4"/><circle cx="43" cy="56" r="4"/><circle cx="48" cy="68" r="4"/><circle cx="35" cy="71" r="4"/></g>
</svg>`,
  brets: `
<svg class="intro-packet" viewBox="0 0 80 100" width="74" height="92" aria-hidden="true">
  <path fill="#c99a3e" d="${BAG}"/>
  <path fill="#e7c47a" d="M14 52h52v32H14z"/>
  <ellipse cx="40" cy="33" rx="22" ry="12" fill="#1d1a17"/>
  <text x="40" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-style="italic" font-weight="700" fill="#fff">Brets</text>
  <g fill="#f6dc8e" stroke="#c48a2c" stroke-width="1"><ellipse cx="31" cy="68" rx="8" ry="5.5"/><ellipse cx="48" cy="72" rx="8" ry="5.5" transform="rotate(-18 48 72)"/></g>
</svg>`,
};

// Mystery gift box for the bonus: the lid flies off when it bursts.
const BOX_SVG = `
<svg class="mystery-box" viewBox="0 0 120 120" width="132" height="132" aria-hidden="true">
  <g class="box-body">
    <rect x="18" y="54" width="84" height="58" rx="7" fill="#7a1f35"/>
    <rect x="18" y="54" width="84" height="10" fill="#5a1426"/>
    <rect x="54" y="54" width="12" height="58" fill="#d9bf8c"/>
    <text x="36" y="96" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="30" font-weight="600" fill="#f3dfb0">?</text>
    <text x="84" y="96" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="30" font-weight="600" fill="#f3dfb0">?</text>
  </g>
  <g class="box-lid">
    <rect x="12" y="40" width="96" height="18" rx="5" fill="#8c2a42"/>
    <rect x="54" y="40" width="12" height="18" fill="#e6cb8f"/>
    <ellipse cx="47" cy="31" rx="13" ry="8" transform="rotate(-22 47 31)" fill="none" stroke="#e6cb8f" stroke-width="5"/>
    <ellipse cx="73" cy="31" rx="13" ry="8" transform="rotate(22 73 31)" fill="none" stroke="#e6cb8f" stroke-width="5"/>
    <circle cx="60" cy="36" r="5.5" fill="#d9bf8c"/>
  </g>
</svg>`;

/** Crunch sounds, at most one every 45 ms however many crisps land together. */
function makeCrunch() {
  let last = 0;
  return () => {
    const now = performance.now();
    if (now - last < 45) return;
    last = now;
    sfx("crunch");
  };
}

// ── Welcome ─────────────────────────────────────────────────

export function welcomeScreen({ onBegin }) {
  const w = content.welcome;
  const intro = content.intro;
  const clock = makeClock();
  const bubble = createBubble();
  const buddy = createAvatar({ face: intro.lines[0]?.face || "wink", size: 150 });
  const packets = Object.fromEntries(Object.entries(PACKET_SVG).map(([id, markup]) => [id, svg(markup)]));
  const stage = h("div", { class: "intro-avatar" }, buddy.el, Object.values(packets));
  const choices = h("div", { class: "intro-choices", hidden: true });
  let snackPick = null; // the crisps she chose: an item of intro.snacks

  const button = h("button", { class: "btn btn-primary", type: "button", onclick: begin }, w.button);
  const end = h(
    "div",
    { class: "intro-end" },
    w.occasion && h("p", { class: "eyebrow" }, w.occasion),
    h("h1", { class: "welcome-title" }, w.title),
    w.signature && h("p", { class: "signature" }, w.signature),
    button,
  );
  const skip = h(
    "button",
    {
      class: "btn-link btn-link--quiet intro-skip",
      type: "button",
      hidden: true,
      onclick(e) {
        e.stopPropagation();
        finish({ skipped: true });
      },
    },
    intro.skip,
  );
  const prompt = h(
    "button",
    { class: "intro-tap", type: "button" },
    h("img", { class: "intro-tap-logo", src: "assets/logo/badge.webp", alt: "", width: "132", height: "132" }),
    h("span", { class: "intro-tap-text" }, intro.tap),
  );
  const el = h(
    "section",
    { class: "screen screen-welcome", onclick: onSceneTap },
    h("div", { class: "intro-bubble-slot" }, bubble.el),
    stage,
    // the crisps question and the title share one spot: nothing jumps when one replaces the other
    h("div", { class: "intro-foot" }, end, choices),
    skip,
    prompt,
  );

  let started = false;
  let ended = false;

  function onSceneTap() {
    if (!started) return start();
    if (ended || bubble.skipTyping()) return;
    clock.next();
  }

  function start() {
    started = true;
    unlockAudio();
    sfx("open");
    gsap.to(prompt, { opacity: 0, duration: 0.35, onComplete: () => prompt.remove() });
    skip.hidden = false;
    play();
  }

  async function play() {
    // She hops in from the left.
    gsap.set(buddy.el, { autoAlpha: 1 });
    gsap.fromTo(stage, { x: -(innerWidth / 2 + 140) }, { x: 0, duration: 1.2, ease: "power2.out" });
    gsap.to(stage, { keyframes: { y: [0, -36, 0, -26, 0, -14, 0] }, duration: 1.2, ease: "none" });
    [0, 0.4, 0.8].forEach((at) => setTimeout(() => !clock.cancelled && sfx("tap"), at * 1000));
    await sleep(1250);
    if (clock.cancelled) return;
    buddy.jump();

    for (const line of intro.lines) {
      if (clock.cancelled) return;
      buddy.set(line.face);
      await bubble.say(line.text);
      await clock.wait(900 + line.text.length * 18);
    }
    if (clock.cancelled) return;
    await askSnack();
    if (clock.cancelled) return;
    bubble.hide();
    await snack();
    if (clock.cancelled) return;
    buddy.set(snackPick.eat);
    buddy.jump(12);
    await bubble.say(snackPick.text);
    await sleep(400);
    finish();
  }

  /** « Plutôt Monster Munch ou Brets ? »: resolves once she has picked (also asked when the intro is skipped). */
  let asking = null;
  function askSnack() {
    if (snackPick) return Promise.resolve(snackPick);
    if (asking) return asking; // skipped while the question is on screen: same question, same answer
    buddy.set(intro.snackQuestion.face);
    bubble.say(intro.snackQuestion.text);
    return (asking = new Promise((resolve) => {
      const buttons = intro.snacks.map((item) =>
        h(
          "button",
          {
            class: "btn btn-secondary intro-choice",
            type: "button",
            onclick(e) {
              e.stopPropagation();
              if (snackPick) return;
              snackPick = item;
              sfx("tap");
              bump(e.currentTarget);
              buttons.forEach((b) => b !== e.currentTarget && gsap.to(b, { opacity: 0.25, duration: 0.3 }));
              buddy.jump();
              setTimeout(() => {
                gsap.to(choices, { autoAlpha: 0, duration: 0.3, onComplete: () => (choices.hidden = true) });
                resolve(item);
              }, 500);
            },
          },
          item.label,
        ),
      );
      choices.replaceChildren(...buttons);
      choices.hidden = false;
      gsap.set(choices, { autoAlpha: 1 });
      gsap.from(buttons, { opacity: 0, y: 12, duration: 0.4, stagger: 0.12, delay: 0.4, ease: "power2.out", clearProps: "opacity,transform" });
    }));
  }

  /** The packet drops into her hands, shakes harder and harder, and bursts. */
  async function snack() {
    const packet = packets[snackPick.id] || packets.munch;
    const top = stage.getBoundingClientRect().top;
    sfx("whoosh");
    gsap.fromTo(packet, { autoAlpha: 1, y: -(top + 200), rotation: -35 }, { y: 0, rotation: 0, duration: 0.6, ease: "power2.in" });
    await sleep(600);
    if (clock.cancelled) return;
    gsap.set(packet, { autoAlpha: 0 });
    buddy.set(snackPick.hold);
    buddy.jump(16);
    sfx("tap");
    await sleep(800);

    for (let k = 1; k <= 3; k++) {
      if (clock.cancelled) return;
      sfx("rattle");
      gsap.to(stage, { keyframes: { rotation: [0, -3 * k, 3 * k, -2 * k, 2 * k, 0] }, duration: 0.42, ease: "none" });
      await sleep(560);
    }
    if (clock.cancelled) return;

    buddy.set(snackPick.open);
    sfx("rip");
    gsap.fromTo(stage, { scale: 1.1 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" });
    const r = buddy.el.getBoundingClientRect();
    crisps({ x: r.left + r.width / 2, y: r.top + r.height * 0.48 }, { onBounce: makeCrunch(), kind: snackPick.id });
    await sleep(1500);
  }

  async function finish({ skipped = false } = {}) {
    if (ended) return;
    ended = true;
    clock.cancel();
    skip.hidden = true;
    if (skipped) {
      unlockAudio();
      started = true;
      prompt.remove();
      gsap.killTweensOf([stage, ...Object.values(packets)]);
      gsap.set(stage, { x: 0, y: 0, rotation: 0, scale: 1 });
      gsap.set(Object.values(packets), { autoAlpha: 0 });
      gsap.set(buddy.el, { autoAlpha: 1 });
      // skipping never skips the crisps question: she still gets her packet
      await askSnack();
      buddy.set(snackPick.eat);
      bubble.show(snackPick.text);
    }
    end.style.visibility = "visible";
    gsap.from(end.children, { opacity: 0, y: 16, duration: 0.7, stagger: 0.12, ease: "power2.out", clearProps: "opacity,transform" });
  }

  function begin(e) {
    e.stopPropagation();
    unlockAudio();
    sfx("open");
    bump(button);
    button.disabled = true;
    bubble.hide();
    buddy.set(variant("joy"));
    buddy.jump();
    onBegin(snackPick?.id);
  }

  return {
    el,
    enter() {
      gsap.set(buddy.el, { autoAlpha: 0 });
      gsap.set(Object.values(packets), { autoAlpha: 0 });
      end.style.visibility = "hidden";
    },
    leave() {
      clock.cancel();
    },
  };
}

// ── Bonus ───────────────────────────────────────────────────

export function bonusScreen({ onDone }) {
  const b = content.bonus;
  const bubble = createBubble();
  const buddy = createAvatar({ face: "surprised2", size: 116 });
  const box = svg(BOX_SVG);
  const lid = box.querySelector(".box-lid");
  const boxButton = h("button", { class: "bonus-box", type: "button", "aria-label": b.tap, onclick: shakeBox }, box);
  const hint = h("p", { class: "bonus-hint" }, b.tap);
  const doneButton = h(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      onclick() {
        sfx("tap");
        bump(doneButton);
        doneButton.disabled = true;
        buddy.set(variant("kiss"));
        onDone();
      },
    },
    b.button,
  );
  const reveal = h(
    "div",
    { class: "reveal", hidden: true },
    h("div", { class: "answer-card" }, h("p", { class: "answer-text" }, b.answer)),
    h("p", { class: "reveal-text" }, b.reveal),
    h("p", { class: "reveal-go" }, b.go),
    h("div", { class: "reveal-actions" }, doneButton),
  );
  const el = h(
    "section",
    { class: "screen screen-bonus" },
    h(
      "div",
      { class: "bonus-card" },
      h("p", { class: "eyebrow" }, b.eyebrow),
      h("div", { class: "intro-bubble-slot" }, bubble.el),
      h("div", { class: "bonus-row" }, h("div", { class: "bonus-avatar" }, buddy.el), boxButton),
      hint,
      reveal,
    ),
  );

  let taps = 0;
  let left = false;

  function shakeBox() {
    if (taps >= 3) return;
    taps++;
    sfx("rattle");
    gsap.to(box, { keyframes: { rotation: [0, -6 * taps, 6 * taps, -4 * taps, 4 * taps, 0] }, duration: 0.45, ease: "none" });
    gsap.to(boxButton, { keyframes: { y: [0, -7 * taps, 0] }, duration: 0.35, ease: "power1.out" });
    if (taps === 1) buddy.react(variant("think"), 1600);
    else if (taps === 2) buddy.react("surprised3", 1600);
    else burst();
  }

  async function burst() {
    gsap.to(hint, { opacity: 0, duration: 0.3 });
    await sleep(420);
    if (left) return;
    sfx("rip");
    sfx("reveal");
    gsap.to(lid, { y: -80, x: 18, rotation: 38, opacity: 0, duration: 0.75, ease: "power2.out", transformOrigin: "50% 50%" });
    gsap.fromTo(box, { scale: 1.12 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" });
    const r = box.getBoundingClientRect();
    const origin = { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
    nerds(origin);
    goldDust(origin);
    buddy.setBase(variant("joy"));
    buddy.jump(32);
    await sleep(1000);
    if (left) return;
    reveal.hidden = false;
    gsap.from(reveal.children, { opacity: 0, y: 16, duration: 0.6, stagger: 0.12, ease: "power2.out", clearProps: "all" });
    reveal.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }

  return {
    el,
    enter() {
      gsap.fromTo(buddy.el, { x: innerWidth / 2 + 120 }, { x: 0, duration: 1, ease: "power2.out" });
      gsap.to(buddy.el, { keyframes: { y: [0, -30, 0, -18, 0] }, duration: 1, ease: "none" });
      gsap.set(boxButton, { autoAlpha: 0 });
      gsap.set(hint, { opacity: 0 });
      sleep(500).then(() => !left && bubble.say(b.wait));
      sleep(1300).then(() => {
        if (left) return;
        sfx("whoosh");
        gsap.fromTo(boxButton, { autoAlpha: 1, y: -innerHeight * 0.6, rotation: -18 }, { y: 0, rotation: 0, duration: 0.9, ease: "bounce.out" });
        gsap.to(hint, { opacity: 1, duration: 0.5, delay: 0.9 });
      });
    },
    leave() {
      left = true;
    },
  };
}
