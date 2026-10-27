// Ad break: a kitsch home-shopping spot for « LE SWAP™ » starring Mini Cyrielle.
// The whole spot is one GSAP timeline (times in seconds below); it pauses on « Je commande ! ».
import { content } from "./content.js";
import { fill } from "./logic.js";
import { sfx, unlockAudio } from "./audio.js";
import { confetti } from "./effects.js";
import { createAvatar } from "./avatar.js";
import { h, shake } from "./dom.js";

const gsap = window.gsap;
const END = 33.8; // the « Reprise du programme » card; skipping jumps here

export function pubScreen({ onDone, waitForTap = false, values = {} }) {
  const p = content.pub;
  const buddy = createAvatar({ face: "pout2", size: 132 });
  const buddyWrap = h("div", { class: "pub-buddy" }, buddy.el);

  const layer = (cls, ...children) => h("div", { class: `pub-layer ${cls}` }, ...children);
  const card = layer("pub-card", h("p", { class: "pub-card-title" }, p.card));
  const problemBig = h("p", { class: "pub-big" }, p.problem);
  const problemSub = h("p", { class: "pub-sub" }, p.problem2);
  const problem = layer("pub-problem", problemBig, problemSub);
  const badge = h("p", { class: "pub-badge" }, h("span", {}, p.badge));
  const logo = h("p", { class: "pub-logo" }, p.product);
  const reveal = layer("pub-reveal", badge, logo);
  const featureItems = p.features.map((text) => h("li", { class: "pub-feature" }, h("span", { class: "pub-check" }, "✔"), h("span", {}, fill(text, values))));
  const features = layer("pub-features", h("p", { class: "pub-logo pub-logo--sm" }, p.product), h("ul", { class: "pub-feature-list" }, featureItems));
  const quote = h("p", { class: "pub-quote" }, p.quote);
  const quoteBy = h("p", { class: "pub-quote-by" }, p.quoteBy);
  const stars = Array.from({ length: 5 }, () => h("span", { class: "pub-star" }, "★"));
  const testimonial = layer("pub-testimonial", quote, quoteBy, h("p", { class: "pub-stars" }, stars));
  const wait1 = h("p", { class: "pub-big pub-shout" }, p.wait);
  const wait2 = h("p", { class: "pub-big pub-shout" }, p.wait2);
  const offer = h("p", { class: "pub-offer" }, p.offer);
  const waitScene = layer("pub-wait", wait1, wait2, offer);
  const priceEls = p.prices.map((text) => h("p", { class: "pub-price" }, h("span", {}, text), h("span", { class: "pub-strike" })));
  const stamp = h("p", { class: "pub-stamp" }, p.free);
  const price = layer("pub-price-scene", h("div", { class: "pub-prices" }, priceEls), stamp);
  const ctaButton = h("button", { class: "pub-cta", type: "button", onclick: order }, p.cta);
  const ordered = h("p", { class: "pub-stamp pub-stamp--ok" }, p.ordered);
  const cta = layer("pub-cta-scene", ctaButton, ordered);
  const back = layer("pub-card pub-back", h("p", { class: "pub-card-title" }, p.back));
  const fineText = h("p", { class: "pub-fine-text" }, p.fine);
  const fine = h("div", { class: "pub-fine" }, fineText);
  const flashLayer = h("div", { class: "tv-flash" });
  const staticLayer = h("div", { class: "tv-static" });
  const skipButton = h("button", { class: "pub-skip", type: "button", onclick: onSkip });
  const playButton = waitForTap ? h("button", { class: "pub-play", type: "button", onclick: start }, p.play) : null;

  const screen = h(
    "div",
    { class: "tv-screen", "data-scene": "card" },
    h("div", { class: "pub-bg" }),
    card,
    problem,
    reveal,
    features,
    testimonial,
    waitScene,
    price,
    cta,
    buddyWrap,
    fine,
    back,
    h("div", { class: "tv-bug" }, "PUB"),
    h("div", { class: "tv-scanlines" }),
    flashLayer,
    staticLayer,
    skipButton,
    playButton,
  );
  const el = h("section", { class: "screen screen-pub" }, h("div", { class: "tv" }, screen));

  // ── The spot ──
  const tl = gsap.timeline({ paused: true });
  const at = (time, fn) => tl.call(fn, null, time);
  const scene = (name) => (screen.dataset.scene = name);
  const showLayer = (target, time) => tl.fromTo(target, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, time);
  const hideLayer = (target, time) => tl.to(target, { autoAlpha: 0, duration: 0.2 }, time);
  // immediateRender: false — a later flash must not show before its time
  const zap = (time) => {
    tl.fromTo(staticLayer, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.45, ease: "power2.in", immediateRender: false }, time);
    at(time, () => sfx("static"));
  };
  const jiggle = (target, time, strength = 6) =>
    tl.to(target, { keyframes: { x: [0, -strength, strength, -strength * 0.6, strength * 0.6, 0] }, duration: 0.4 }, time);

  // 0 · static, then the « PUBLICITÉ » card
  zap(0);
  showLayer(card, 0.3);
  tl.from(card.firstChild, { scale: 0.3, rotation: -12, duration: 0.6, ease: "back.out(2.5)" }, 0.3);
  at(0.35, () => sfx("jingle"));
  hideLayer(card, 2.5);

  // 2.6 · the problem, in sad grey
  at(2.6, () => {
    scene("problem");
    buddy.set("pout2");
  });
  tl.fromTo(buddyWrap, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(2)" }, 2.6);
  showLayer(problem, 2.7);
  tl.from(problemBig, { y: -20, opacity: 0, duration: 0.5 }, 2.8);
  tl.from(problemSub, { scale: 0.6, opacity: 0, duration: 0.45, ease: "back.out(2)" }, 4.3);
  at(4.5, () => {
    sfx("sadTrombone");
    buddy.set("sushi-sulk");
  });
  hideLayer(problem, 6.7);

  // 6.8 · « NOUVEAU ! LE SWAP™ »
  at(6.8, () => {
    scene("reveal");
    buddy.set("surprised3");
    buddy.jump(30);
    sfx("reveal");
  });
  tl.fromTo(flashLayer, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, 6.8);
  showLayer(reveal, 6.8);
  tl.from(badge, { scale: 0, rotation: -90, duration: 0.6, ease: "back.out(2)" }, 7);
  at(7, () => sfx("pop"));
  tl.from(logo, { scale: 3, opacity: 0, duration: 0.7, ease: "power3.out" }, 7.2);
  tl.fromTo(logo, { backgroundPosition: "130% 0" }, { backgroundPosition: "-30% 0", duration: 1.1, ease: "power1.inOut" }, 8);
  hideLayer(reveal, 10.1);

  // 10.2 · the selling points
  at(10.2, () => {
    scene("features");
    buddy.set("cool");
  });
  tl.to(buddyWrap, { x: () => screen.clientWidth * 0.3, scale: 0.72, duration: 0.5, ease: "power2.inOut" }, 10.2);
  showLayer(features, 10.3);
  featureItems.forEach((item, k) => {
    const time = 10.6 + k * 0.85;
    tl.from(item, { x: -30, opacity: 0, duration: 0.35, ease: "back.out(2)" }, time);
    at(time, () => sfx("ding"));
  });
  at(13.4, () => buddy.set("smirk"));
  hideLayer(features, 15.9);
  tl.to(buddyWrap, { x: 0, scale: 1, duration: 0.5, ease: "power2.inOut" }, 15.9);

  // 16 · the testimonial
  at(16, () => {
    scene("testimonial");
    buddy.set("cry2");
  });
  showLayer(testimonial, 16.1);
  tl.from(quote, { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(2)" }, 16.2);
  tl.from(quoteBy, { y: 8, opacity: 0, duration: 0.4 }, 16.9);
  stars.forEach((star, k) => {
    const time = 17.4 + k * 0.22;
    tl.fromTo(star, { scale: 0.4, color: "rgba(255,255,255,0.35)" }, { scale: 1, color: "#FFD23F", duration: 0.3, ease: "back.out(3)" }, time);
    at(time, () => sfx("dingHigh"));
  });
  at(18.6, () => buddy.set("joy2"));
  hideLayer(testimonial, 19.7);

  // 19.8 · « MAIS ATTENDEZ… CE N'EST PAS TOUT ! »
  at(19.8, () => {
    scene("wait");
    buddy.set("surprised2");
    buddy.jump(24);
    sfx("pop");
  });
  showLayer(waitScene, 19.8);
  tl.from(wait1, { scale: 2, opacity: 0, duration: 0.4, ease: "back.out(2)" }, 19.9);
  jiggle(wait1, 20.4);
  tl.from(wait2, { scale: 2, opacity: 0, duration: 0.4, ease: "back.out(2)" }, 21.2);
  at(21.2, () => sfx("pop"));
  jiggle(wait2, 21.7, 8);
  tl.from(offer, { y: 20, opacity: 0, duration: 0.5, ease: "back.out(2)" }, 22.3);
  at(22.4, () => {
    buddy.set("kiss2");
    buddy.jump();
    sfx("good");
  });
  hideLayer(waitScene, 25.1);

  // 25.2 · prices crossed out one after the other, then « GRATUIT ♥ »
  at(25.2, () => {
    scene("price");
    buddy.set("think2");
    sfx("drumroll");
  });
  tl.to(buddyWrap, { x: () => -screen.clientWidth * 0.28, scale: 0.8, duration: 0.5, ease: "power2.inOut" }, 25.2);
  showLayer(price, 25.2);
  priceEls.forEach((priceEl, k) => {
    const time = 25.4 + k * 0.95;
    tl.from(priceEl, { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(2)" }, time);
    tl.fromTo(priceEl.lastChild, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power2.in" }, time + 0.55);
    tl.to(priceEl, { opacity: 0.45, duration: 0.2 }, time + 0.75);
  });
  // stamps are centred with xPercent/yPercent: GSAP owns their transform
  tl.fromTo(stamp, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 3, rotation: -25 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.45, ease: "back.out(1.6)" }, 28.3);
  at(28.45, () => {
    sfx("kaching");
    confetti();
    buddy.set("peace");
    buddy.jump(28);
  });
  tl.fromTo(fine, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 28.6);
  tl.fromTo(fineText, { x: () => screen.clientWidth }, { x: () => -fineText.offsetWidth, duration: 8, ease: "none" }, 28.6);
  hideLayer(price, 31);
  tl.to(buddyWrap, { x: 0, scale: 1, duration: 0.5, ease: "power2.inOut" }, 31);

  // 31.1 · « ☎ Je commande ! » — the spot waits for her tap
  at(31.1, () => {
    scene("cta");
    buddy.set("wink");
  });
  showLayer(cta, 31.1);
  tl.from(ctaButton, { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(2.5)" }, 31.2);
  tl.addPause(31.8);
  tl.to(ctaButton, { opacity: 0.35, scale: 0.9, duration: 0.3 }, 32.3);
  tl.fromTo(ordered, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 2.4, rotation: 12 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.4, ease: "back.out(1.8)" }, 32.3);
  at(32.4, () => {
    sfx("good");
    buddy.set("joy");
    buddy.jump(30);
  });

  // 33.8 · back to the show
  zap(END);
  hideLayer([cta, buddyWrap, fine], END);
  at(END + 0.1, () => {
    scene("card");
    skipButton.hidden = true;
  });
  showLayer(back, END + 0.2);
  tl.from(back.firstChild, { scale: 0.3, duration: 0.6, ease: "back.out(2.5)" }, END + 0.2);
  at(END + 0.25, () => sfx("jingle"));
  at(END + 2.2, () => onDone());

  function order() {
    if (ctaButton.disabled) return;
    ctaButton.disabled = true;
    sfx("ring");
    tl.play(31.85);
  }

  // ── « Passer la pub » (YouTube style): a countdown, then a first tap that doesn't work ──
  let countdown = 0;
  let tried = false;
  function startCountdown() {
    let left = 5;
    skipButton.disabled = true;
    skipButton.textContent = fill(p.skipIn, { s: left });
    countdown = setInterval(() => {
      left--;
      if (left > 0) skipButton.textContent = fill(p.skipIn, { s: left });
      else {
        clearInterval(countdown);
        skipButton.disabled = false;
        skipButton.textContent = p.skip;
      }
    }, 1000);
  }

  function onSkip() {
    if (!tried) {
      tried = true;
      sfx("wrong");
      shake(skipButton, 6);
      skipButton.textContent = p.skipNope;
      setTimeout(() => (skipButton.textContent = p.skip), 1600);
      return;
    }
    skipButton.hidden = true;
    tl.seek(END - 0.05).play();
  }

  function start() {
    unlockAudio();
    playButton?.remove();
    tl.play(0);
    startCountdown();
  }

  return {
    el,
    enter() {
      if (!waitForTap) start();
    },
    leave() {
      tl.kill();
      clearInterval(countdown);
    },
  };
}
