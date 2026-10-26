// Crossword: tap a cell (tap it again to switch direction) or a clue, then type. The golden word is the gift.
// One invisible input follows the current cell: it opens the iOS keyboard and catches letters and backspace.
// It always holds a sentinel character, so backspace on an "empty" cell still fires an input event.
import { h, shake } from "../dom.js";
import { compact, crosswordGrid } from "../logic.js";

const SENTINEL = "-";

export function createCrossword(gift, api) {
  const gsap = window.gsap;
  const { cells, entries, rows, cols } = crosswordGrid(gift.words);
  const order = [...entries].sort((a, b) => a.number - b.number || (a.dir === "vertical" ? 1 : -1));
  const letters = new Map(); // cell key → typed letter
  const solved = new Set(); // entry indexes
  let active = order[0].index;
  let pos = 0;
  let locked = false;

  // Grid
  const cellEls = new Map();
  for (const cell of cells.values()) {
    const golden = cell.entries.some((i) => entries[i].golden);
    const letter = h("span", { class: "xw-letter" });
    const el = h(
      "div",
      {
        class: `xw-cell${golden ? " is-golden" : ""}`,
        // keep the focus (and the keyboard) on the input while moving between cells
        onmousedown: (e) => e.preventDefault(),
        onclick: () => onCell(cell.key),
      },
      cell.number && h("span", { class: "xw-num" }, cell.number),
      letter,
    );
    el.style.gridRow = String(cell.r + 1);
    el.style.gridColumn = String(cell.c + 1);
    cellEls.set(cell.key, { el, letter });
  }
  const grid = h("div", { class: "xw-grid", "aria-hidden": "true" }, [...cellEls.values()].map((c) => c.el));
  grid.style.setProperty("--cols", cols);
  grid.style.setProperty("--rows", rows);

  const input = h("input", {
    class: "xw-input",
    type: "text",
    value: SENTINEL,
    autocomplete: "off",
    autocapitalize: "characters",
    autocorrect: "off",
    spellcheck: "false",
    enterkeyhint: "next",
    "aria-label": "Lettre",
  });
  const board = h("div", { class: "xw-board" }, grid, input);

  // Clues
  const clueNum = h("span", { class: "xw-clue-num" });
  const clueText = h("span", { class: "xw-clue-text" });
  const clueBar = h("div", { class: "xw-clue", "aria-live": "polite" }, clueNum, clueText);

  const clueItems = entries.map((e) =>
    h(
      "li",
      { class: `xw-item${e.golden ? " is-golden" : ""}` },
      h(
        "button",
        {
          type: "button",
          onclick() {
            if (locked) return;
            api.sfx("tap");
            select(e.index);
            focus();
          },
        },
        h("span", { class: "xw-item-num" }, e.number),
        h("span", { class: "xw-item-text" }, `${e.clue} (${e.word.length})`),
      ),
    ),
  );
  const lists = h(
    "div",
    { class: "xw-lists" },
    ["horizontal", "vertical"].map((dir) =>
      h(
        "div",
        { class: "xw-group" },
        h("p", { class: "xw-group-title" }, dir === "horizontal" ? api.ui.across : api.ui.down),
        h("ol", { class: "xw-list" }, order.filter((e) => e.dir === dir).map((e) => clueItems[e.index])),
      ),
    ),
  );

  const el = h(
    "div",
    { class: "game game-crossword" },
    h("div", { class: "riddle" }, gift.lines.map((line) => h("p", { class: "riddle-line" }, line))),
    clueBar,
    board,
    lists,
  );

  // ── State helpers ──

  /** Letters of a solved word can't be changed any more. */
  const isFixed = (key) => cells.get(key).entries.some((i) => solved.has(i));
  const isComplete = (e) => e.keys.every((key) => letters.get(key));
  const isRight = (e) => e.keys.every((key) => letters.get(key) === cells.get(key).letter);

  function firstOpen(e) {
    const i = e.keys.findIndex((key) => !letters.get(key));
    return i < 0 ? 0 : i;
  }

  function nextOpenEntry() {
    const start = order.findIndex((e) => e.index === active);
    for (let k = 1; k <= order.length; k++) {
      const e = order[(start + k) % order.length];
      if (!solved.has(e.index)) return e.index;
    }
    return active;
  }

  function select(index, at = firstOpen(entries[index])) {
    active = index;
    pos = at;
    render();
  }

  function focus() {
    input.value = SENTINEL;
    input.focus({ preventScroll: true });
    input.setSelectionRange(SENTINEL.length, SENTINEL.length);
  }

  function render() {
    const e = entries[active];
    const current = e.keys[pos];
    for (const [key, { el: cellEl, letter }] of cellEls) {
      letter.textContent = letters.get(key) || "";
      cellEl.classList.toggle("is-word", !locked && e.keys.includes(key));
      cellEl.classList.toggle("is-current", !locked && key === current);
      cellEl.classList.toggle("is-right", isFixed(key));
    }
    clueNum.textContent = `${e.number} ${e.dir === "vertical" ? "↓" : "→"}`;
    clueText.textContent = e.clue;
    clueBar.classList.toggle("is-golden", Boolean(e.golden));
    clueBar.hidden = locked;
    clueItems.forEach((item, i) => {
      item.classList.toggle("is-active", !locked && i === active);
      item.classList.toggle("is-solved", solved.has(i));
    });
    // The invisible input sits on the current cell, so iOS scrolls to the right place.
    const target = cellEls.get(current).el;
    Object.assign(input.style, {
      left: `${target.offsetLeft}px`,
      top: `${target.offsetTop}px`,
      width: `${target.offsetWidth}px`,
      height: `${target.offsetHeight}px`,
    });
  }

  // ── Interactions ──

  function onCell(key) {
    if (locked) return;
    const options = cells.get(key).entries;
    const typing = document.activeElement === input;
    let next;
    if (typing && entries[active].keys[pos] === key && options.length > 1) next = options.find((i) => i !== active);
    else if (options.includes(active)) next = active;
    else next = options.find((i) => !solved.has(i)) ?? options[0];
    api.sfx("tap");
    select(next, entries[next].keys.indexOf(key));
    focus();
  }

  function typeLetter(ch) {
    const e = entries[active];
    let p = pos;
    while (p < e.keys.length && isFixed(e.keys[p])) p++;
    if (p >= e.keys.length) return;
    const key = e.keys[p];
    letters.set(key, ch);
    api.sfx("letter");
    let next = p + 1;
    while (next < e.keys.length && isFixed(e.keys[next])) next++;
    pos = Math.min(next, e.keys.length - 1);
    render();
    gsap.fromTo(cellEls.get(key).letter, { scale: 1.35 }, { scale: 1, duration: 0.25, ease: "back.out(3)", clearProps: "transform" });
    check(key);
  }

  function backspace() {
    const e = entries[active];
    let p = pos;
    if (!letters.get(e.keys[p]) || isFixed(e.keys[p])) {
      p--;
      while (p >= 0 && isFixed(e.keys[p])) p--;
      if (p < 0) return;
    }
    letters.delete(e.keys[p]);
    pos = p;
    api.sfx("tap");
    render();
  }

  /** After a letter: solve the words it completes correctly, flag the ones it completes wrongly. */
  function check(key) {
    const wrong = [];
    for (const e of entries) {
      if (solved.has(e.index) || !isComplete(e)) continue;
      if (isRight(e)) solveEntry(e);
      else if (e.keys.includes(key)) wrong.push(e);
    }
    if (solved.size === entries.length) return finish();
    if (wrong.length) {
      const keys = new Set(wrong.flatMap((e) => e.keys));
      for (const k of keys) {
        const cellEl = cellEls.get(k).el;
        cellEl.classList.add("is-wrong");
        shake(cellEl, 4);
        setTimeout(() => cellEl.classList.remove("is-wrong"), 700);
      }
      api.onWrong({});
    } else if (solved.has(active)) select(nextOpenEntry());
    render();
  }

  function solveEntry(e) {
    solved.add(e.index);
    api.sfx("good");
    api.onProgress();
    gsap.to(
      e.keys.map((k) => cellEls.get(k).el),
      { keyframes: { y: [0, -6, 0] }, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform" },
    );
  }

  function finish() {
    locked = true;
    input.blur();
    render();
    api.onFound();
  }

  input.addEventListener("input", () => {
    const value = input.value;
    if (value.length < SENTINEL.length) backspace();
    else {
      const typed = value.startsWith(SENTINEL) ? value.slice(SENTINEL.length) : value;
      for (const ch of compact(typed).replace(/[^a-z]/g, "").toUpperCase()) if (!locked) typeLetter(ch);
    }
    input.value = SENTINEL;
    input.setSelectionRange(SENTINEL.length, SENTINEL.length);
  });

  input.addEventListener("keydown", (e) => {
    if (locked) return;
    const e0 = entries[active];
    if (e.key === "Enter") {
      e.preventDefault();
      select(nextOpenEntry());
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      pos = Math.min(pos + 1, e0.keys.length - 1);
      render();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      pos = Math.max(pos - 1, 0);
      render();
    }
  });

  input.addEventListener("focus", () => {
    board.classList.add("is-typing");
    setTimeout(() => cellEls.get(entries[active].keys[pos])?.el.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
  });
  input.addEventListener("blur", () => board.classList.remove("is-typing"));

  // The grid is measured once it is in the page (render positions the input from offsets).
  requestAnimationFrame(render);

  return {
    el,
    intro() {
      gsap.from(
        [...cellEls.values()].map((c) => c.el),
        { opacity: 0, scale: 0.6, duration: 0.35, stagger: 0.018, delay: 0.15, ease: "back.out(2)", clearProps: "opacity,transform" },
      );
    },
    reveal() {
      for (const cell of cells.values()) letters.set(cell.key, cell.letter);
      entries.forEach((e) => solved.add(e.index));
      locked = true;
      input.blur();
      render();
    },
  };
}
