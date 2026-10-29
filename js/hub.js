// The hub (#/), the site's entry: one card per world. Touching a card enters its world (onEnter).
import { content } from "./content.js";
import { sfx, unlockAudio } from "./audio.js";
import { h } from "./dom.js";

export function hubScreen({ worlds, start, onEnter }) {
  const cards = worlds.map((w) =>
    h(
      "button",
      {
        class: "hub-card",
        type: "button",
        "data-world": w.id,
        style: `--world-bg: ${w.color}; --world-ink: ${w.ink}`,
        onclick(e) {
          unlockAudio();
          sfx("tap");
          onEnter(w.id, e.currentTarget);
        },
      },
      h("span", { class: "hub-card-title" }, w.title),
      h("small", { class: "hub-card-note" }, w.note),
    ),
  );
  const el = h(
    "section",
    { class: "screen screen-hub", "data-current": start },
    h("h1", { class: "hub-title" }, content.hub.title),
    h("div", { class: "hub-track" }, cards),
  );

  return {
    el,
    noHome: true,
    cardOf: (id) => cards.find((card) => card.dataset.world === id),
  };
}
