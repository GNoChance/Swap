// Code secret: tap each word, its first letter lights up and flies into the next empty slot.
import { h, flyLetter } from "../dom.js";
import { acrosticWords } from "../logic.js";

export function createAcrostic(gift, api) {
  const gsap = window.gsap;
  const words = acrosticWords(gift.phrase);
  const size = gift.solution.length;
  /** slotWord[i] = index of the word whose letter sits in slot i, or null */
  const slotWord = Array(size).fill(null);
  let locked = false;

  const slots = Array.from({ length: size }, (_, i) =>
    h("button", { class: "slot slot--sm", type: "button", "aria-label": `Case ${i + 1}`, onclick: () => giveBack(i) }),
  );

  const chips = words.map(({ word }, i) => {
    const first = word.search(/\p{L}/u);
    return h(
      "button",
      { class: "word-chip", type: "button", onclick: () => take(i) },
      word.slice(0, first),
      h("span", { class: "word-initial" }, word[first]),
      word.slice(first + 1),
    );
  });

  const slotRow = h("div", { class: "slot-row" }, slots);
  const el = h(
    "div",
    { class: "game game-acrostic" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    h("p", { class: "word-phrase" }, chips),
    slotRow,
  );

  function take(wordIndex) {
    const chip = chips[wordIndex];
    if (locked || chip.classList.contains("is-used")) return;
    const slotIndex = slotWord.indexOf(null);
    if (slotIndex < 0) return;
    slotWord[slotIndex] = wordIndex;
    chip.classList.add("is-used");
    api.sfx("letter");
    const initial = chip.querySelector(".word-initial");
    flyLetter(initial, slots[slotIndex], words[wordIndex].letter).then(() => {
      if (slotWord[slotIndex] !== wordIndex) return;
      slots[slotIndex].textContent = words[wordIndex].letter;
      slots[slotIndex].classList.add("is-filled");
      gsap.fromTo(slots[slotIndex], { scale: 0.85 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
      if (slots.every((s) => s.classList.contains("is-filled"))) check();
    });
  }

  function giveBack(slotIndex) {
    const wordIndex = slotWord[slotIndex];
    if (locked || wordIndex === null || !slots[slotIndex].classList.contains("is-filled")) return;
    api.sfx("tap");
    slotWord[slotIndex] = null;
    slots[slotIndex].textContent = "";
    slots[slotIndex].classList.remove("is-filled");
    chips[wordIndex].classList.remove("is-used");
  }

  function check() {
    locked = true;
    const word = slotWord.map((w) => words[w].letter).join("");
    if (word === gift.solution) {
      win();
      api.onFound();
    } else {
      api.onWrong({ target: slotRow });
      setTimeout(() => {
        locked = false;
        slotWord.forEach((_, i) => giveBack(i));
      }, 750);
    }
  }

  function win() {
    slots.forEach((s) => s.classList.add("is-right"));
    gsap.to(slots, { keyframes: { y: [0, -10, 0] }, duration: 0.45, stagger: 0.06, ease: "power2.out" });
  }

  return {
    el,
    intro() {
      gsap.from(chips, { opacity: 0, y: 8, duration: 0.45, stagger: 0.07, delay: 0.15, ease: "power2.out", clearProps: "opacity,transform" });
    },
    reveal() {
      locked = true;
      [...gift.solution].forEach((letter, i) => {
        slots[i].textContent = letter;
        slots[i].classList.add("is-filled");
      });
      chips.forEach((c) => c.classList.add("is-used"));
      win();
    },
  };
}
