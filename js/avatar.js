// Mini Cyrielle: die-cut stickers (assets/cyrielle/*.webp) brought to life with GSAP.
// Layers: el (placed by the page) > float (idle bob) > sticker (flip and jump) > img.
import { h } from "./dom.js";

const gsap = window.gsap;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const FACES = [
  // emotions (two drawings of most of them: "joy" / "joy2"…)
  "joy", "joy2", "angry", "angry2", "cry", "cry2", "pout", "pout2", "think", "think2", "sleep", "sleep2",
  "kiss", "kiss2", "wink", "smirk", "cool", "peace", "surprised", "surprised2", "surprised3",
  // Monster Munch (intro)
  "munch-hold", "munch-open", "munch-eat", "munch-empty",
  // sushi
  "sushi-eat", "sushi-happy", "sushi-full", "sushi-sulk",
  // UBB: only once the jersey (gift 7) is revealed, so nothing gives it away
  "ubb-flag", "ubb-flag2", "ubb-flag3", "ubb-ball", "ubb-scarf", "ubb-cap", "ubb-cap-scarf",
];

const VARIANTS = {
  joy: ["joy", "joy2"],
  angry: ["angry", "angry2"],
  cry: ["cry", "cry2"],
  pout: ["pout", "pout2"],
  think: ["think", "think2"],
  sleep: ["sleep", "sleep2"],
  kiss: ["kiss", "kiss2"],
  surprised: ["surprised", "surprised2", "surprised3"],
};

/** One of the drawings of an emotion, at random ("cry" → "cry" or "cry2"). */
export function variant(face) {
  const list = VARIANTS[face];
  return list ? list[Math.floor(Math.random() * list.length)] : face;
}

const src = (face) => `assets/cyrielle/${face}.webp`;

/** Load every face up front, so a change of expression never flashes. */
export function preloadFaces() {
  for (const face of FACES) {
    const img = new Image();
    img.src = src(face);
  }
}

/** Faces she cycles through when tapped (unless the page gives its own list). */
const TAP_FACES = ["kiss", "cool", "smirk", "joy", "sushi-happy"];

/** The sticker box is size wide and HEIGHT_RATIO × size tall; the image sits at its bottom (her "feet"). */
export const HEIGHT_RATIO = 1.32;

export function createAvatar({ face = "wink", size = 80, className = "", tappable = false, tapFaces = TAP_FACES, onTap } = {}) {
  const img = h("img", { class: "avatar-img", src: src(face), alt: "", draggable: "false" });
  const sticker = h("div", { class: "avatar-sticker" }, img);
  const float = h("div", { class: "avatar-float" }, sticker);
  const shadow = h("div", { class: "avatar-shadow", "aria-hidden": "true" });
  const el = h("div", { class: `avatar ${className}`.trim(), "aria-hidden": "true" }, shadow, float);
  el.style.setProperty("--avatar-size", `${size}px`);

  let current = face;
  let base = face;
  let timer = 0;
  let tapIndex = 0;

  if (!reduced) {
    gsap.to(float, { y: -size * 0.06, rotation: 1.6, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(shadow, { scaleX: 0.86, opacity: 0.7, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  /** Change expression: the sticker flips on its edge, swaps, and springs back. */
  function set(next) {
    if (next === current) return;
    current = next;
    if (reduced) {
      img.src = src(next);
      return;
    }
    gsap.killTweensOf(sticker, "scaleX,scaleY,rotation");
    gsap
      .timeline()
      .to(sticker, { scaleX: 0, rotation: -7, duration: 0.11, ease: "power2.in", onComplete: () => (img.src = src(next)) })
      .to(sticker, { scaleX: 1, rotation: 0, duration: 0.45, ease: "back.out(3)" })
      .fromTo(sticker, { scaleY: 1.12 }, { scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, "<");
  }

  /** A face for a moment, then back to the base face. */
  function react(next, ms = 1800) {
    clearTimeout(timer);
    set(next);
    timer = setTimeout(() => set(base), ms);
  }

  function setBase(next) {
    base = next;
    clearTimeout(timer);
    set(next);
  }

  function jump(height = size * 0.3) {
    if (reduced) return;
    gsap.killTweensOf(sticker, "y");
    gsap
      .timeline()
      .to(sticker, { y: -height, duration: 0.22, ease: "power2.out" })
      .to(sticker, { y: 0, duration: 0.45, ease: "bounce.out" });
    gsap.fromTo(shadow, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: "power2.out" });
  }

  if (tappable) {
    el.classList.add("is-tappable");
    el.addEventListener("click", () => {
      onTap?.();
      if (current.startsWith("sleep")) return;
      const faces = typeof tapFaces === "function" ? tapFaces() : tapFaces;
      react(variant(faces[tapIndex++ % faces.length]), 1800);
      jump();
    });
  }

  return {
    el,
    set,
    react,
    setBase,
    jump,
    get face() {
      return current;
    },
    get base() {
      return base;
    },
    /** Box height in px (the sticker sits at its bottom). */
    height: size * HEIGHT_RATIO,
    width: size,
  };
}
