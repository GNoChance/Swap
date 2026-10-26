// Anagram: tap tiles to fill the slots, tap a slot to give the letter back.
import { h, flyLetter } from "../dom.js";

export function createAnagram(gift, api) {
  const gsap = window.gsap;
  const size = gift.solution.length;
  /** slotTile[i] = index of the tile sitting in slot i, or null */
  const slotTile = Array(size).fill(null);
  let locked = false;

  const slots = Array.from({ length: size }, (_, i) =>
    h("button", { class: "slot", type: "button", "aria-label": `Case ${i + 1}`, onclick: () => giveBack(i) }),
  );
  const tiles = gift.letters.map((letter, i) =>
    h("button", { class: "tile", type: "button", "aria-label": `Lettre ${letter}`, onclick: () => place(i) }, letter),
  );

  const slotRow = h("div", { class: "slot-row" }, slots);
  const el = h(
    "div",
    { class: "game game-anagram" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    slotRow,
    h("div", { class: "tile-row" }, tiles),
  );

  function place(tileIndex) {
    if (locked || tiles[tileIndex].classList.contains("is-used")) return;
    const slotIndex = slotTile.indexOf(null);
    if (slotIndex < 0) return;
    slotTile[slotIndex] = tileIndex;
    const tile = tiles[tileIndex];
    const slot = slots[slotIndex];
    api.sfx("letter");
    tile.classList.add("is-used");
    flyLetter(tile, slot, gift.letters[tileIndex]).then(() => {
      if (slotTile[slotIndex] !== tileIndex) return;
      slot.textContent = gift.letters[tileIndex];
      slot.classList.add("is-filled");
      gsap.fromTo(slot, { scale: 0.85 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
      if (slots.every((s) => s.classList.contains("is-filled"))) check();
    });
  }

  function giveBack(slotIndex) {
    const tileIndex = slotTile[slotIndex];
    if (locked || tileIndex === null || !slots[slotIndex].classList.contains("is-filled")) return;
    api.sfx("tap");
    slotTile[slotIndex] = null;
    slots[slotIndex].textContent = "";
    slots[slotIndex].classList.remove("is-filled");
    tiles[tileIndex].classList.remove("is-used");
    gsap.fromTo(tiles[tileIndex], { scale: 0.6 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" });
  }

  function check() {
    const word = slotTile.map((t) => gift.letters[t]).join("");
    if (word === gift.solution) {
      locked = true;
      win();
      api.onFound();
    } else {
      locked = true;
      api.onWrong({ target: slotRow });
      setTimeout(() => {
        locked = false;
        slotTile.forEach((_, i) => giveBack(i));
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
      gsap.from(tiles, { opacity: 0, y: 16, rotate: () => gsap.utils.random(-12, 12), duration: 0.5, stagger: 0.06, ease: "back.out(2)", clearProps: "opacity,transform" });
    },
    reveal() {
      locked = true;
      [...gift.solution].forEach((letter, i) => {
        slots[i].textContent = letter;
        slots[i].classList.add("is-filled");
      });
      tiles.forEach((t) => t.classList.add("is-used"));
      win();
    },
  };
}
