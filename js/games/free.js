// Free answer (charade, devinette, équation): riddle lines, optional equation tiles, a tolerant text field.
import { h, svg, icons } from "../dom.js";
import { matchesAnswer } from "../logic.js";

export function createFree(gift, api) {
  const input = h("input", {
    class: "answer-input",
    type: "text",
    placeholder: api.ui.placeholder,
    autocomplete: "off",
    autocapitalize: "off",
    autocorrect: "off",
    spellcheck: "false",
    enterkeyhint: "go",
    "aria-label": api.ui.placeholder,
  });
  const submit = h("button", { class: "answer-submit", type: "submit", "aria-label": api.ui.submit }, svg(icons.arrow));
  const form = h("form", { class: "answer-form", novalidate: true }, input, submit);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input.value.trim()) {
      api.onWrong({ target: form, message: "" });
      input.focus();
      return;
    }
    if (matchesAnswer(input.value, gift.accept)) {
      input.blur();
      form.classList.add("is-right");
      input.readOnly = true;
      submit.disabled = true;
      api.onFound();
    } else {
      api.onWrong({ target: form });
      input.select();
    }
  });

  input.addEventListener("focus", () => setTimeout(() => form.scrollIntoView({ block: "center", behavior: "smooth" }), 320));

  // Equation terms: picture tiles ({ emoji, label }) and operators ({ op })
  const equation =
    gift.equation &&
    h(
      "div",
      { class: "equation", role: "img", "aria-label": gift.equation.map((t) => t.label || t.op).join(" ") },
      gift.equation.map((t) =>
        t.op
          ? h("span", { class: "eq-op" }, t.op)
          : h("span", { class: "eq-tile" }, h("span", { class: "eq-emoji" }, t.emoji), h("span", { class: "eq-label" }, t.label)),
      ),
    );

  const el = h(
    "div",
    { class: "game game-free" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    equation,
    form,
  );

  return {
    el,
    intro() {
      const gsap = window.gsap;
      const lines = el.querySelectorAll(".riddle-line");
      gsap.from(lines, { opacity: 0, y: 10, duration: 0.6, stagger: 0.32, ease: "power2.out" });
      if (!equation) return;
      // the terms pop in one by one once the riddle is written, the "?" last
      const terms = [...equation.children];
      const tl = gsap.timeline({ delay: 0.3 + lines.length * 0.32 });
      terms.forEach((term, k) => {
        tl.from(term, { opacity: 0, scale: 0.4, y: 8, duration: 0.4, ease: "back.out(2.6)", clearProps: "opacity,transform", onStart: () => api.sfx(k === terms.length - 1 ? "ding" : "letter") }, k * 0.32);
      });
      gsap.from(form, { opacity: 0, y: 8, duration: 0.5, delay: 0.3 + lines.length * 0.32 + terms.length * 0.32, ease: "power2.out", clearProps: "opacity,transform" });
    },
    reveal() {
      form.classList.add("is-hidden");
    },
  };
}
