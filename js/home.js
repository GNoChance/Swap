// The swap's home page (#/swap): « Redécouvrir le swap », her path as she left it, or everything from the start
// without erasing anything. The ⌂ button takes her back to the hub.
import { content } from "./content.js";
import { sfx, unlockAudio } from "./audio.js";
import { createAvatar } from "./avatar.js";
import { h, bump } from "./dom.js";

const gsap = window.gsap;

export function homeScreen({ onResume, onReplay }) {
  const t = content.home;
  const buddy = createAvatar({
    face: t.face,
    size: 120,
    tappable: true,
    onTap: () => sfx("tap"),
    tapFaces: ["maillot-cheer", "maillot-wink", "maillot-kiss", "maillot-thumbs", "maillot-shy"],
  });

  const choice = (label, note, action) =>
    h(
      "button",
      {
        class: "home-choice",
        type: "button",
        onclick(e) {
          unlockAudio();
          sfx("tap");
          bump(e.currentTarget);
          action();
        },
      },
      h("span", { class: "home-choice-label" }, label),
      h("small", {}, note),
    );
  const choices = h("div", { class: "home-choices", hidden: true }, choice(t.resume, t.resumeNote, onResume), choice(t.replay, t.replayNote, onReplay));

  // « Redécouvrir le swap » opens its two choices underneath
  const swapButton = h(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      "aria-expanded": "false",
      onclick() {
        unlockAudio();
        sfx("tap");
        const open = choices.hidden;
        choices.hidden = !open;
        swapButton.setAttribute("aria-expanded", String(open));
        if (open) gsap.from(choices.children, { opacity: 0, y: -8, duration: 0.35, stagger: 0.08, ease: "power2.out", clearProps: "opacity,transform" });
      },
    },
    t.swap,
  );
  const card = h(
    "div",
    { class: "home-card" },
    h("div", { class: "home-avatar" }, buddy.el),
    h("p", { class: "eyebrow" }, t.kicker),
    h("h1", { class: "home-title" }, t.title),
    h("p", { class: "ornament", "aria-hidden": "true" }, "✦"),
    h("div", { class: "home-actions" }, swapButton, choices),
  );
  const el = h("section", { class: "screen screen-home" }, card);

  return {
    el,
    enter() {
      gsap.from(card.children, { opacity: 0, y: 16, duration: 0.7, stagger: 0.1, delay: 0.15, ease: "power2.out", clearProps: "opacity,transform" });
      setTimeout(() => buddy.jump(24), 700);
    },
  };
}
