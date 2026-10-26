// Fill-in-the-blanks: first and last letters are given, the middle is typed in letter boxes.
// Each word uses one real (invisible) input laid over its boxes: reliable keyboard + backspace on iOS.
import { h } from "../dom.js";
import { compact, parseBlanks } from "../logic.js";

export function createBlanks(gift, api) {
  const gsap = window.gsap;
  const words = [];

  const sentence = h(
    "p",
    { class: "blank-sentence" },
    parseBlanks(gift.sentence).map((part) => (part.text ? part.text : buildWord(part.word))),
  );

  function buildWord(word) {
    const middle = word.slice(1, -1);
    const boxes = [...middle].map(() => h("span", { class: "blank-box" }));
    const input = h("input", {
      class: "blank-input",
      type: "text",
      maxlength: String(middle.length),
      autocomplete: "off",
      autocapitalize: "characters",
      autocorrect: "off",
      spellcheck: "false",
      enterkeyhint: "next",
      "aria-label": `Mot de ${word.length} lettres commençant par ${word[0]}`,
    });
    const group = h(
      "span",
      { class: "blank-word" },
      h("span", { class: "blank-box is-given" }, word[0]),
      boxes,
      h("span", { class: "blank-box is-given" }, word.at(-1)),
      input,
    );
    const entry = { word, middle, boxes, input, group, solved: false };
    words.push(entry);

    const render = () => {
      const value = input.value;
      boxes.forEach((box, i) => {
        box.textContent = value[i] || "";
        box.classList.toggle("is-current", document.activeElement === input && i === Math.min(value.length, middle.length - 1) && !entry.solved);
      });
    };

    let previous = "";
    input.addEventListener("input", () => {
      const clean = compact(input.value).toUpperCase().slice(0, middle.length);
      input.value = clean;
      if (clean.length > previous.length) api.sfx("letter");
      previous = clean;
      render();
      if (clean.length === middle.length) check(entry);
    });
    input.addEventListener("focus", () => {
      render();
      setTimeout(() => group.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
    });
    input.addEventListener("blur", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
    entry.render = render;
    return group;
  }

  function check(entry) {
    if (entry.input.value === entry.middle) {
      solveWord(entry);
      api.sfx("good");
      api.onProgress();
      const next = words.find((w) => !w.solved);
      if (next) next.input.focus();
      else {
        entry.input.blur();
        api.onFound();
      }
    } else {
      api.onWrong({ target: entry.group });
      setTimeout(() => {
        entry.input.value = "";
        entry.render();
      }, 650);
    }
  }

  function solveWord(entry) {
    entry.solved = true;
    entry.input.value = entry.middle;
    entry.input.readOnly = true;
    entry.input.tabIndex = -1;
    entry.render();
    entry.group.classList.add("is-right");
    gsap.to(entry.boxes, { keyframes: { y: [0, -6, 0] }, duration: 0.4, stagger: 0.05 });
  }

  const el = h(
    "div",
    { class: "game game-blanks" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    sentence,
  );

  return {
    el,
    intro() {
      gsap.from(sentence, { opacity: 0, y: 10, duration: 0.7, delay: 0.2, ease: "power2.out" });
    },
    reveal() {
      words.filter((w) => !w.solved).forEach(solveWord);
      words.forEach((w) => w.input.blur());
    },
  };
}
