// Nos aventures (#/aventures), for now a shell: the passport comes with sub-project 2.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { h } from "../dom.js";

const gsap = window.gsap;

export function aventuresScreen({ onBack }) {
  const t = content.aventures;
  const back = h(
    "button",
    {
      class: "world-back",
      type: "button",
      onclick() {
        sfx("tap");
        onBack();
      },
    },
    t.back,
  );
  const card = h("div", { class: "aventures-soon" }, h("h1", { class: "aventures-title" }, t.title), h("p", {}, t.soon));
  const el = h("section", { class: "screen screen-aventures" }, card, back);

  return {
    el,
    noHome: true,
    enter() {
      gsap.from(card.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.12, delay: 0.1, ease: "power2.out", clearProps: "opacity,transform" });
    },
  };
}
