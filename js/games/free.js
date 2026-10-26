// Free answer (charade, qui suis-je, devinette): riddle lines + a tolerant text field.
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

  const el = h(
    "div",
    { class: "game game-free" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    form,
  );

  return {
    el,
    intro() {
      window.gsap.from(el.querySelectorAll(".riddle-line"), { opacity: 0, y: 10, duration: 0.6, stagger: 0.32, ease: "power2.out" });
    },
    reveal() {
      form.classList.add("is-hidden");
    },
  };
}
