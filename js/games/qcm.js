// Multiple choice: a wrong option shakes and shows its tease, the right one wins.
import { h } from "../dom.js";

const LETTERS = ["A", "B", "C", "D"];

export function createQcm(gift, api) {
  let locked = false;

  const options = gift.options.map((option, i) => {
    const tease = h("span", { class: "qcm-tease" }, option.tease || "");
    const button = h(
      "button",
      { class: "qcm-option", type: "button", onclick: () => choose(i) },
      h("span", { class: "qcm-letter" }, LETTERS[i]),
      h("span", { class: "qcm-text" }, h("span", { class: "qcm-label" }, option.label), tease),
    );
    return { option, button, tease };
  });

  function choose(i) {
    const { option, button, tease } = options[i];
    if (locked || button.classList.contains("is-wrong")) return;
    if (option.correct) {
      locked = true;
      markRight();
      api.onFound();
    } else {
      button.classList.add("is-wrong");
      window.gsap.fromTo(tease, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" });
      api.onWrong({ target: button, message: option.tease ? "" : undefined });
    }
  }

  function markRight() {
    options.forEach(({ option, button }) => {
      button.disabled = true;
      button.classList.toggle("is-right", Boolean(option.correct));
      button.classList.toggle("is-dim", !option.correct);
    });
  }

  const el = h(
    "div",
    { class: "game game-qcm" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    h("div", { class: "qcm-list" }, options.map((o) => o.button)),
  );

  return {
    el,
    intro() {
      window.gsap.from(options.map((o) => o.button), { opacity: 0, y: 14, duration: 0.5, stagger: 0.12, delay: 0.15, ease: "power2.out", clearProps: "opacity,transform" });
    },
    reveal() {
      locked = true;
      markRight();
    },
  };
}
