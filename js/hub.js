// The hub (#/), the site's entry: a carousel of the three worlds. Native horizontal scrolling snaps one card to the
// middle; the side cards shrink and fade with their distance. Mini Cycy and Kevin stand above and hop onto the card
// in the middle. Touching a side card brings it to the middle; touching the middle one enters its world (onEnter).
import { content } from "./content.js";
import { fill } from "./logic.js";
import { sfx, unlockAudio } from "./audio.js";
import { createAvatar } from "./avatar.js";
import { h, svg } from "./dom.js";
import { cardScale, cardFade, closestIndex } from "./hub-logic.js";
import { saveHubCard } from "./state.js";

const gsap = window.gsap;

const GOLD = "#D9BF8C";
const ART = {
  swap: `<svg viewBox="0 0 120 120" aria-hidden="true">
    <rect x="22" y="54" width="76" height="52" rx="5" fill="#F6EFE6"/>
    <rect x="16" y="40" width="88" height="18" rx="5" fill="#FFFDF9"/>
    <rect x="55" y="40" width="10" height="66" fill="${GOLD}"/>
    <path d="M60 40C48 22 30 26 36 36C40 42 52 41 60 40ZM60 40C72 22 90 26 84 36C80 42 68 41 60 40Z" fill="${GOLD}"/>
    <circle cx="60" cy="40" r="5" fill="#B8935A"/></svg>`,
  ubb: `<svg viewBox="0 0 120 120" aria-hidden="true">
    <rect x="14" y="18" width="92" height="84" rx="3" fill="#FFFDF9" stroke="#B8935A" stroke-width="7"/>
    <g transform="rotate(-32 60 60)"><ellipse cx="60" cy="60" rx="34" ry="21" fill="#7A1733"/>
    <path d="M40 60H80M50 54V66M56 54V66M62 54V66M68 54V66" stroke="#FFFDF9" stroke-width="3" stroke-linecap="round"/></g></svg>`,
  aventures: `<svg viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="88" cy="30" r="15" fill="#F2B134"/>
    <path d="M88 6V12M88 48V54M64 30H70M106 30H112M71 13L75 17M101 43L105 47M105 13L101 17M75 43L71 47" stroke="#F2B134" stroke-width="4" stroke-linecap="round"/>
    <rect x="28" y="30" width="56" height="78" rx="6" fill="#7A1F35"/>
    <circle cx="56" cy="62" r="15" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <path d="M41 62H71M56 47C49 55 49 69 56 77C63 69 63 55 56 47Z" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
    <path d="M42 92H70" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/></svg>`,
};

export function hubScreen({ worlds, start, onEnter }) {
  const t = content.hub;
  const buddy = (face, tapFaces) => createAvatar({ face, size: 84, tappable: true, tapFaces, onTap: () => sfx("tap") });
  const cycy = buddy("wink", ["joy", "kiss", "peace", "cool", "wink"]);
  const kevin = buddy("kevin-joy", ["kevin-wink", "kevin-kiss", "kevin-cheer", "kevin-smug", "kevin-surprised"]);
  const buddies = h("div", { class: "hub-buddies" }, cycy.el, kevin.el);

  let index = Math.max(0, worlds.findIndex((w) => w.id === start));
  const faces = [];
  const cards = worlds.map((w, i) => {
    const face = h(
      "span",
      { class: "hub-card-face" },
      svg(ART[w.id]),
      h("span", { class: "hub-card-title" }, w.title),
      h("span", { class: "hub-card-note" }, w.note),
    );
    faces.push(face);
    return h(
      "button",
      {
        class: "hub-card",
        type: "button",
        "data-world": w.id,
        style: `--world-bg: ${w.color}; --world-ink: ${w.ink}`,
        onclick(e) {
          unlockAudio();
          sfx("tap");
          if (i === index) onEnter(w.id, e.currentTarget);
          else scrollToCard(i, true);
        },
      },
      face,
    );
  });
  const track = h("div", { class: "hub-track" }, cards);
  const dots = worlds.map((_, i) =>
    h("button", { class: "hub-dot", type: "button", "aria-label": fill(t.dot, { n: i + 1 }), onclick: () => scrollToCard(i, true) }),
  );
  const el = h(
    "section",
    { class: "screen screen-hub" },
    h("h1", { class: "hub-title" }, t.title),
    buddies,
    track,
    h("div", { class: "hub-dots" }, dots),
    h("p", { class: "hub-hint" }, t.hint),
  );

  function setCurrent(i, cheer) {
    index = i;
    el.dataset.current = worlds[i].id;
    cards.forEach((card, k) => card.setAttribute("aria-current", String(k === i)));
    dots.forEach((dot, k) => dot.setAttribute("aria-current", String(k === i)));
    saveHubCard(worlds[i].id);
    if (!cheer) return;
    cycy.react("joy", 1400);
    kevin.react("kevin-cheer", 1400);
    cycy.jump(18);
    setTimeout(() => kevin.jump(18), 90);
  }

  function scrollToCard(i, smooth) {
    const card = cards[i];
    track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth ? "smooth" : "instant" });
  }

  // one measure per frame: each card's scale and fade, and which one is in the middle
  let frame = 0;
  function measure() {
    frame = 0;
    const view = track.getBoundingClientRect();
    const middle = view.left + view.width / 2;
    const centres = cards.map((card) => {
      const r = card.getBoundingClientRect();
      return r.left + r.width / 2;
    });
    const width = cards[0].offsetWidth;
    faces.forEach((face, i) => {
      const d = centres[i] - middle;
      face.style.transform = `scale(${cardScale(d, width)})`;
      face.style.filter = `opacity(${cardFade(d, width)})`;
    });
    const nearest = closestIndex(centres, middle);
    if (nearest !== index) setCurrent(nearest, true);
  }
  const onScroll = () => (frame ||= requestAnimationFrame(measure));
  const onResize = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    scrollToCard(index, false); // the card in the middle stays there when the phone turns
    measure();
  };
  track.addEventListener("scroll", onScroll, { passive: true });

  return {
    el,
    noHome: true,
    enter() {
      scrollToCard(index, false); // before the first frame: no visible jump
      setCurrent(index, false);
      measure();
      addEventListener("resize", onResize);
      gsap.from([buddies, ...cards], { opacity: 0, y: 14, duration: 0.6, stagger: 0.07, ease: "power2.out", clearProps: "opacity,transform" });
    },
    leave() {
      removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    },
    current: () => worlds[index].id,
    /** The card's visible face (what the plates grow out of and fold into). */
    cardOf: (id) => faces[Math.max(0, worlds.findIndex((w) => w.id === id))],
    /** Mini Cycy and Kevin slip into the card as it grows. */
    dive(id) {
      const target = faces[worlds.findIndex((w) => w.id === id)].getBoundingClientRect();
      const from = buddies.getBoundingClientRect();
      gsap.to(buddies, {
        x: target.left + target.width / 2 - (from.left + from.width / 2),
        y: target.top + target.height / 2 - (from.top + from.height / 2),
        scale: 0.5,
        duration: 0.5,
        ease: "power2.in",
      });
    },
  };
}
