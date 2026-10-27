// Pick a side (fondue: cheese or chocolate), then fill the missing letters of that word.
// Each card is a <label> around one invisible input: a tap on the card opens the iPhone keyboard.
import { h } from "../dom.js";
import { compact } from "../logic.js";

export function createCamp(gift, api) {
  const gsap = window.gsap;
  let active = null;
  let solved = false;

  const cards = gift.camps.map((camp) => {
    const blanks = [...camp.pattern].flatMap((ch, i) => (ch === "_" ? [i] : []));
    const missing = blanks.map((i) => camp.word[i]).join("");
    const boxes = [...camp.pattern].map((ch) => h("span", { class: `blank-box${ch === "_" ? "" : " is-given"}` }, ch === "_" ? "" : ch));
    const input = h("input", {
      class: "camp-input",
      type: "text",
      maxlength: String(missing.length),
      autocomplete: "off",
      autocapitalize: "characters",
      autocorrect: "off",
      spellcheck: "false",
      enterkeyhint: "done",
      "aria-label": `${camp.emoji} ${camp.pattern.replace(/_/g, " _ ")} ${camp.after}`,
    });
    const word = h("span", { class: "blank-word camp-word" }, boxes);
    const el = h(
      "label",
      { class: "camp-card" },
      h("span", { class: "camp-emoji", "aria-hidden": "true" }, camp.emoji),
      h("span", { class: "camp-line" }, word, h("span", { class: "camp-after" }, camp.after)),
      input,
    );
    const card = { camp, blanks, missing, boxes, input, word, el };

    const render = () => {
      const value = input.value;
      blanks.forEach((at, k) => {
        boxes[at].textContent = value[k] || "";
        boxes[at].classList.toggle("is-current", document.activeElement === input && !solved && k === Math.min(value.length, blanks.length - 1));
      });
    };
    card.render = render;

    let previous = "";
    input.addEventListener("input", () => {
      if (solved) return;
      const clean = compact(input.value).toUpperCase().slice(0, missing.length);
      input.value = clean;
      if (clean.length > previous.length) api.sfx("letter");
      previous = clean;
      render();
      if (clean.length === missing.length) check(card);
    });
    input.addEventListener("focus", () => {
      select(card);
      render();
      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
    });
    input.addEventListener("blur", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
    return card;
  });

  /** Her side: the other card fades (still tappable, she can change her mind until it's solved). */
  function select(card) {
    if (solved || active === card) return;
    active = card;
    api.sfx("tap");
    api.onChoice(card.camp.id);
    cards.forEach((c) => {
      c.el.classList.toggle("is-active", c === card);
      c.el.classList.toggle("is-other", c !== card);
    });
    gsap.fromTo(card.el, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  }

  function check(card) {
    if (card.input.value === card.missing) {
      win(card);
      api.onFound();
    } else {
      api.onWrong({ target: card.word });
      setTimeout(() => {
        card.input.value = "";
        card.render();
      }, 650);
    }
  }

  function win(card) {
    solved = true;
    card.input.value = card.missing;
    card.input.readOnly = true;
    card.input.blur();
    cards.forEach((c) => {
      c.input.tabIndex = -1;
      c.input.readOnly = true;
      c.render();
    });
    card.el.classList.add("is-right");
    card.word.classList.add("is-right");
    gsap.to(card.blanks.map((i) => card.boxes[i]), { keyframes: { y: [0, -6, 0] }, duration: 0.4, stagger: 0.05 });
  }

  const el = h(
    "div",
    { class: "game game-camp" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    h("div", { class: "camp-list" }, cards[0].el, h("p", { class: "camp-or" }, gift.or), cards.slice(1).map((c) => c.el)),
  );

  return {
    el,
    intro() {
      gsap.from(el.querySelectorAll(".camp-card, .camp-or"), { opacity: 0, y: 12, duration: 0.5, stagger: 0.15, delay: 0.2, ease: "power2.out", clearProps: "opacity,transform" });
    },
    /** Answer shown (or gift reopened): her side if she picked one, else both words. */
    reveal(choice) {
      const picked = cards.find((c) => c.camp.id === choice) || active;
      if (picked) {
        active = picked;
        cards.forEach((c) => c.el.classList.toggle("is-other", c !== picked));
        win(picked);
      } else cards.forEach((c) => win(c));
    },
  };
}
