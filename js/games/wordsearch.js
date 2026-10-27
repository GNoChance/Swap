// Word search: slide a finger from the first to the last letter of a word (or tap both ends).
// A found word gets a golden ring; the gift is found once every word is.
import { h } from "../dom.js";
import { fill, wordsearchLine, wordsearchMatch, wordsearchPlaces } from "../logic.js";

export function createWordsearch(gift, api) {
  const gsap = window.gsap;
  const { grid, words } = gift;
  const found = new Set();
  let anchor = null; // first cell of the current selection: [r, c]
  let dragging = false;
  let moved = false;
  let locked = false;

  const cells = grid.map((row, r) =>
    [...row].map((letter, c) => {
      const cell = h("span", { class: "ws-cell", "data-r": r, "data-c": c }, letter);
      cell.style.gridArea = `${r + 1} / ${c + 1}`;
      return cell;
    }),
  );
  const board = h(
    "div",
    { class: "ws-grid", role: "img", "aria-label": grid.join(" ") },
    cells.flat(),
  );
  board.style.setProperty("--cols", grid[0].length);
  board.style.setProperty("--rows", grid.length);
  const counter = h("p", { class: "ws-counter", "aria-live": "polite" });

  const at = (e) => {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".ws-cell");
    return target && board.contains(target) ? [Number(target.dataset.r), Number(target.dataset.c)] : null;
  };
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

  function paint(to) {
    const line = anchor && to ? wordsearchLine(anchor, to) || [anchor] : anchor ? [anchor] : [];
    const keys = new Set(line.map(([r, c]) => `${r},${c}`));
    cells.flat().forEach((cell) => cell.classList.toggle("is-selecting", keys.has(`${cell.dataset.r},${cell.dataset.c}`)));
  }

  function clearSelection() {
    anchor = null;
    paint(null);
  }

  /** Golden ring over a word, laid on the grid so it follows any resize. */
  function ring(from, to) {
    const el = h("span", { class: "ws-ring" });
    el.style.gridArea = `${Math.min(from[0], to[0]) + 1} / ${Math.min(from[1], to[1]) + 1} / ${Math.max(from[0], to[0]) + 2} / ${Math.max(from[1], to[1]) + 2}`;
    board.append(el);
    return el;
  }

  function markFound(index, from, to, animate = true) {
    found.add(index);
    for (const [r, c] of wordsearchLine(from, to)) cells[r][c].classList.add("is-found");
    const el = ring(from, to);
    if (animate) {
      gsap.fromTo(el, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.4)" });
      gsap.to(wordsearchLine(from, to).map(([r, c]) => cells[r][c]), { keyframes: { y: [0, -5, 0] }, duration: 0.4, stagger: 0.05 });
    }
    render();
  }

  function tryWord(from, to) {
    const index = wordsearchMatch(grid, words, from, to);
    const line = wordsearchLine(from, to);
    clearSelection();
    if (index >= 0 && !found.has(index)) {
      api.sfx("good");
      markFound(index, from, to);
      if (found.size === words.length) {
        locked = true;
        api.onFound();
      } else api.onProgress();
    } else if (index < 0 && line && line.length >= 3) {
      api.onWrong({ target: board });
    }
  }

  board.addEventListener("pointerdown", (e) => {
    if (locked) return;
    const cell = at(e);
    if (!cell) return;
    e.preventDefault();
    board.setPointerCapture?.(e.pointerId);
    dragging = true;
    moved = false;
    if (anchor && !same(anchor, cell)) {
      // second tap: the selection goes from the first tapped letter to this one
      const from = anchor;
      dragging = false;
      tryWord(from, cell);
      return;
    }
    anchor = cell;
    api.sfx("letter");
    paint(cell);
  });

  board.addEventListener("pointermove", (e) => {
    if (!dragging || !anchor) return;
    const cell = at(e);
    if (!cell) return;
    if (!same(cell, anchor)) moved = true;
    paint(cell);
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    const cell = at(e);
    if (moved && cell && !same(cell, anchor)) tryWord(anchor, cell);
    else if (moved) clearSelection();
    // a simple tap keeps the letter selected, waiting for the other end of the word
  };
  board.addEventListener("pointerup", end);
  board.addEventListener("pointercancel", () => {
    dragging = false;
    clearSelection();
  });

  function render() {
    counter.textContent = fill(gift.progress, { found: found.size, total: words.length });
  }
  render();

  const el = h(
    "div",
    { class: "game game-wordsearch" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    h("div", { class: "ws-board" }, board),
    counter,
  );

  return {
    el,
    intro() {
      gsap.from(cells.flat(), { opacity: 0, scale: 0.6, duration: 0.35, stagger: { each: 0.012, from: "random" }, delay: 0.2, ease: "back.out(2)", clearProps: "opacity,transform" });
    },
    reveal() {
      locked = true;
      clearSelection();
      wordsearchPlaces(grid, words).forEach((place, index) => !found.has(index) && place.from && markFound(index, place.from, place.to, false));
    },
  };
}
