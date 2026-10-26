import { test } from "node:test";
import assert from "node:assert/strict";
import { content } from "../js/content.js";
import * as L from "../js/logic.js";

const gift = (type, title) => content.gifts.find((g) => g.type === type && (!title || g.title.includes(title)));

test("compact strips case, accents and punctuation", () => {
  assert.equal(L.compact("Une Bombe de Bain, Lush !"), "unebombedebainlush");
  assert.equal(L.compact("M&M's"), "mms");
  assert.equal(L.compact("Pomme de terre"), "pommedeterre");
});

test("charade accepts natural answers", () => {
  const { accept } = gift("free", "Charade");
  for (const ok of ["bombe de bain", "Une bombe de bain Lush", "BOMBEDEBAIN", "un truc lush", "une bombe pour le bain", "Bombe de bain !"])
    assert.ok(L.matchesAnswer(ok, accept), ok);
  for (const ko of ["bombe", "bain moussant", "pétard", "", "   "]) assert.ok(!L.matchesAnswer(ko, accept), ko);
});

test("crossword in content.js is a valid grid with one golden word", () => {
  const { words } = gift("crossword");
  assert.deepEqual(L.crosswordErrors(words), []);
  assert.equal(words.filter((w) => w.golden).length, 1);
});

test("crossword numbers clues in reading order, shared by words starting on the same cell", () => {
  const { entries } = L.crosswordGrid([
    { word: "ROND", row: 0, col: 0, dir: "horizontal" },
    { word: "RIZ", row: 0, col: 0, dir: "vertical" },
    { word: "DOS", row: 0, col: 3, dir: "vertical" },
  ]);
  assert.deepEqual(entries.map((e) => e.number), [1, 1, 2]);
});

test("crossword errors catch clashing letters and letters touching outside a word", () => {
  const clash = L.crosswordErrors([
    { word: "ROND", row: 0, col: 0, dir: "horizontal" },
    { word: "SOL", row: 0, col: 0, dir: "vertical" },
  ]);
  assert.equal(clash.length, 1);
  const touching = L.crosswordErrors([
    { word: "ROND", row: 0, col: 0, dir: "horizontal" },
    { word: "AMI", row: 1, col: 0, dir: "horizontal" },
  ]);
  assert.ok(touching.length > 0);
});

test("devinette accepts patate / pomme de terre", () => {
  const { accept } = gift("free", "Devinette");
  for (const ok of ["patate", "Une patate positive", "pomme de terre", "Pommes de terre", "PATATES"])
    assert.ok(L.matchesAnswer(ok, accept), ok);
  for (const ko of ["carotte", "frite", "pomme"]) assert.ok(!L.matchesAnswer(ko, accept), ko);
});

test("anagram letters are exactly the solution letters", () => {
  const g = gift("anagram");
  assert.deepEqual([...g.letters].sort(), [...g.solution].sort());
});

test("blanks sentence has the two words", () => {
  const words = L.parseBlanks(gift("blanks").sentence).filter((p) => p.word).map((p) => p.word);
  assert.deepEqual(words, ["STRASS", "TIKTOK"]);
});

test("acrostic initials spell the solution", () => {
  const g = gift("acrostic");
  assert.equal(L.acrosticWords(g.phrase).map((w) => w.letter).join(""), g.solution);
});

test("qcm has exactly one correct option", () => {
  assert.equal(gift("qcm").options.filter((o) => o.correct).length, 1);
});

test("every gift has the fields the UI needs", () => {
  assert.equal(content.gifts.length, L.STEP_COUNT);
  for (const g of content.gifts) {
    for (const key of ["type", "title", "lines", "answer", "reveal", "short", "effect"]) assert.ok(g[key], `${g.title}: ${key}`);
  }
});

test("progress: steps unlock one after another", () => {
  let p = L.initialProgress();
  assert.deepEqual(p.steps.map((s) => s.status), ["active", "locked", "locked", "locked", "locked", "locked", "locked"]);

  // can't open before solving, can't solve a locked step
  assert.equal(L.open(p, 0), p);
  assert.equal(L.solve(p, 1, true), p);

  p = L.solve(p, 0, true);
  assert.equal(p.steps[0].status, "revealed");
  assert.equal(p.steps[1].status, "locked");
  p = L.open(p, 0);
  assert.equal(p.steps[0].status, "done");
  assert.equal(p.steps[1].status, "active");

  for (let i = 1; i < L.STEP_COUNT; i++) p = L.open(L.solve(p, i, i % 2 === 0), i);
  assert.ok(L.isComplete(p));
  assert.equal(L.score(p), 4); // steps 0, 2, 4, 6
});

test("progress: solving twice does not change found", () => {
  let p = L.solve(L.initialProgress(), 0, false);
  p = L.solve(p, 0, true);
  assert.equal(p.steps[0].found, false);
});

test("sanitize repairs bad storage", () => {
  assert.deepEqual(L.sanitize(null), L.initialProgress());
  assert.deepEqual(L.sanitize({ steps: [1, 2] }), L.initialProgress());
  const raw = L.initialProgress();
  raw.steps[0] = { status: "done", found: true };
  raw.steps[3] = { status: "weird" };
  const fixed = L.sanitize(raw);
  assert.equal(fixed.steps[1].status, "active");
  assert.equal(fixed.steps[3].status, "locked");
});

test("bonus: unseen at first, remembered once seen, survives storage", () => {
  const p = L.initialProgress();
  assert.equal(p.bonus, false);
  const seen = L.seeBonus(p);
  assert.equal(seen.bonus, true);
  assert.equal(L.sanitize(JSON.parse(JSON.stringify(seen))).bonus, true);
  assert.equal(L.sanitize({ started: true, steps: p.steps }).bonus, false);
});

test("pub: unseen at first, remembered once seen, survives storage", () => {
  const p = L.initialProgress();
  assert.equal(p.pub, false);
  const seen = L.seePub(p);
  assert.equal(seen.pub, true);
  assert.equal(L.sanitize(JSON.parse(JSON.stringify(seen))).pub, true);
  assert.equal(L.sanitize({ started: true, steps: p.steps }).pub, false);
});

test("pub plays after a gift that exists, before the last one", () => {
  const { afterGift } = content.pub;
  assert.ok(Number.isInteger(afterGift) && afterGift >= 1 && afterGift < L.STEP_COUNT);
});

test("debrief in content.js: every answer leads somewhere, every ending is reachable", () => {
  assert.deepEqual(L.debriefErrors(content.debrief), []);
  assert.equal(Object.keys(content.debrief.endings).length, 9);
});

test("debrief errors catch dead ends, missing targets and unreachable endings", () => {
  const errors = L.debriefErrors({
    start: "a",
    nodes: { a: { text: "?", choices: [{ label: "x", next: "nope" }] }, b: { text: "?", choices: [] } },
    endings: { e: { n: 2 } },
  });
  assert.ok(errors.some((e) => e.includes("nope")));
  assert.ok(errors.some((e) => e.includes("« b »")));
  assert.ok(errors.some((e) => e.includes("« e »")));
  assert.ok(errors.some((e) => e.includes("numérotées")));
});

test("debrief runs pile up and found endings are counted once", () => {
  let store = L.addDebriefRun(null, { ending: "taquine", answers: [] });
  store = L.addDebriefRun(store, { ending: "taquine", answers: [] });
  store = L.addDebriefRun(store, { ending: "cocooning", answers: [] });
  assert.equal(store.runs.length, 3);
  assert.deepEqual(store.found, ["taquine", "cocooning"]);
});

test("fill replaces placeholders", () => {
  assert.equal(L.fill("Cadeau n°{n}", { n: 3 }), "Cadeau n°3");
  assert.equal(L.fill("{x} reste", {}), "{x} reste");
});
