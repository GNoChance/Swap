import { test } from "node:test";
import { existsSync } from "node:fs";
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

test("blanks parser finds the bracketed words", () => {
  const words = L.parseBlanks("Des [STRASS] pour une trend [TikTok] !").filter((p) => p.word).map((p) => p.word);
  assert.deepEqual(words, ["STRASS", "TIKTOK"]);
});

test("word search in content.js hides each word exactly once", () => {
  const { grid, words } = gift("wordsearch");
  assert.deepEqual(L.wordsearchErrors(grid, words), []);
  for (const place of L.wordsearchPlaces(grid, words)) assert.ok(place.from, place.word);
});

test("word search matches a word selected either way, never diagonally", () => {
  const grid = ["ABC", "DOG", "XYZ"];
  assert.equal(L.wordsearchMatch(grid, ["DOG", "BOY"], [1, 0], [1, 2]), 0);
  assert.equal(L.wordsearchMatch(grid, ["DOG", "BOY"], [1, 2], [1, 0]), 0);
  assert.equal(L.wordsearchMatch(grid, ["DOG", "BOY"], [0, 1], [2, 1]), 1);
  assert.equal(L.wordsearchMatch(grid, ["DOG", "BOY"], [0, 0], [2, 2]), -1);
  assert.equal(L.wordsearchMatch(grid, ["DOG", "BOY"], [1, 0], [1, 1]), -1);
  assert.deepEqual(L.wordsearchErrors(["DOGDOG"], ["DOG", "CAT"]), ["« DOG » apparaît 2 fois", "« CAT » n'est pas dans la grille"]);
});

test("fondue camps: the given letters fit each word", () => {
  for (const camp of gift("camp").camps) {
    assert.equal(camp.pattern.length, camp.word.length, camp.id);
    [...camp.pattern].forEach((ch, i) => ch !== "_" && assert.equal(ch, camp.word[i], camp.id));
    assert.ok(camp.pattern.includes("_"), camp.id);
  }
});

test("équation accepts mousse / Rituals", () => {
  const { accept } = gift("free", "Équation");
  for (const ok of ["mousse de douche", "2 mousses de douche Rituals", "Rituals", "du gel douche", "MOUSSES"])
    assert.ok(L.matchesAnswer(ok, accept), ok);
  for (const ko of ["savon", "douche", "nuage"]) assert.ok(!L.matchesAnswer(ko, accept), ko);
});

test("every sticker named in content.js exists", () => {
  const faces = new Set();
  const walk = (v, key) => {
    if (typeof v === "string" && (key === "face" || key === "revealFace")) faces.add(v);
    else if (v && typeof v === "object") for (const [k, child] of Object.entries(v)) walk(child, k);
  };
  walk(content);
  for (const s of content.intro.snacks) [s.hold, s.hug, s.tear, s.wow, s.bite, s.eat, s.empty, ...s.nibble, ...s.playFaces].forEach((f) => faces.add(f));
  for (const g of content.gifts) [...Object.values(g.unlocksFaces || {}).flat(), ...(g.playFaces || [])].forEach((f) => faces.add(f));
  Object.values(content.bonus.faces).forEach((f) => faces.add(f));
  Object.values(content.debrief.secret.end).forEach((f) => faces.add(f));
  Object.values(content.debrief.ubb.faces).forEach((f) => faces.add(f));
  for (const who of Object.values(content.museum.faces)) Object.values(who).forEach((f) => faces.add(f));
  for (const line of content.debrief.secret.script) {
    [line.duo, typeof line.enter === "string" && line.enter, ...(line.bite || []), ...Object.values(line.react || {})].filter(Boolean).forEach((f) => faces.add(f));
  }
  const missing = [...faces].filter((face) => !existsSync(new URL(`../assets/cyrielle/${face}.webp`, import.meta.url)));
  assert.deepEqual(missing, []);
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
  assert.deepEqual(p.steps.map((s) => s.status), ["active", ...Array(L.STEP_COUNT - 1).fill("locked")]);

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
  assert.equal(L.score(p), 5); // steps 0, 2, 4, 6, 8
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

test("fondue camp and snack are remembered, and survive storage", () => {
  let p = L.choose(L.initialProgress(), 0, "chocolat");
  p = L.choose(p, 0, "fromage"); // she changed her mind
  p = L.pickSnack(p, "brets");
  const back = L.sanitize(JSON.parse(JSON.stringify(p)));
  assert.equal(back.steps[0].choice, "fromage");
  assert.equal(back.snack, "brets");
  // no more changes once the gift is solved, and nothing on a locked step
  const solved = L.solve(p, 0, true);
  assert.equal(L.choose(solved, 0, "chocolat"), solved);
  assert.equal(L.choose(p, 3, "chocolat"), p);
  assert.equal(L.sanitize({ steps: L.initialProgress().steps }).snack, null);
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
  assert.equal(Object.keys(content.debrief.endings).length, 13);
  // one ending per gift in « ton cadeau préféré »
  assert.equal(content.debrief.nodes.favorite.choices.length, content.gifts.length);
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

test("secret ending: unlocked by the last ending found, remembered across runs", () => {
  const ids = Object.keys(content.debrief.endings);
  let store = null;
  for (const id of ids.slice(0, -1)) store = L.addDebriefRun(store, { ending: id, answers: [] });
  assert.equal(L.secretUnlocked(store, ids), false);
  store = L.addDebriefRun(store, { ending: ids.at(-1), answers: [] });
  assert.equal(L.secretUnlocked(store, ids), true);
  store = L.seeSecret(store);
  store = L.addDebriefRun(store, { ending: ids[0], answers: [] });
  assert.equal(store.secret, true);
  assert.equal(L.seeSecret(null).secret, true);
});

test("museum: matches in chronological order, every club has a name, a colour and a logo", () => {
  const { matches, clubs } = content.museum;
  for (let i = 1; i < matches.length; i++) assert.ok(matches[i - 1].date < matches[i].date, `${matches[i - 1].date} → ${matches[i].date}`);
  for (const id of ["ubb", ...matches.map((m) => m.opponent)]) {
    const club = clubs[id];
    assert.ok(club?.name && /^#[0-9a-f]{6}$/i.test(club.color), id);
    assert.ok(existsSync(new URL(`../assets/logos/${club.logo}`, import.meta.url)), club.logo);
  }
  for (const m of matches) {
    assert.ok(m.score === null || (m.score.length === 2 && m.score.every(Number.isInteger)), m.date);
    assert.ok(m.competition && m.stand && Number.isInteger(m.row) && Number.isInteger(m.seat), m.date);
  }
});

test("museum: every SVG logo has a size of its own (Safari draws an SVG without one at 0 × 0 in a canvas)", async () => {
  const { readFileSync } = await import("node:fs");
  for (const club of Object.values(content.museum.clubs).filter((c) => c.logo.endsWith(".svg"))) {
    const root = /<svg[^>]*>/.exec(readFileSync(new URL(`../assets/logos/${club.logo}`, import.meta.url), "utf8"))[0];
    assert.match(root, /\swidth="[\d.]+(px)?"/, club.logo);
    assert.match(root, /\sheight="[\d.]+(px)?"/, club.logo);
  }
});

test("museum: nothing from the tickets but the stand, row and seat (no name, ticket or barcode number)", () => {
  const text = JSON.stringify(content.museum);
  assert.doesNotMatch(text, /guarato|sicard|nicolas/i);
  assert.doesNotMatch(text, /\d{6,}/);
});

test("museum: 14 matches, a venue on each", () => {
  const { matches, venues } = content.museum;
  assert.equal(matches.length, 14);
  for (const m of matches) assert.ok(venues[m.venue], m.date);
  assert.deepEqual(matches.filter((m) => m.venue === "atlantique").map((m) => m.opponent), ["toulouse", "pau"]);
});

test("museum: the first match to come is « La prochaine œuvre »", () => {
  assert.equal(L.nextMatchIndex(content.museum.matches), 11);
  assert.equal(content.museum.matches[11].opponent, "bayonne");
  assert.equal(L.nextMatchIndex([{ score: [1, 0] }]), -1);
});

test("museum: their reaction to each match, the day of a match", () => {
  assert.equal(L.museumReaction({ score: [43, 31] }), "win");
  assert.equal(L.museumReaction({ score: [41, 19], final: true }), "final");
  assert.equal(L.museumReaction({ score: [31, 34] }), "lose");
  assert.equal(L.museumReaction({ score: [20, 20] }), "look");
  assert.equal(L.museumReaction({ score: null }), "point");
  assert.equal(L.museumDay("2026-10-31"), "31 octobre");
});

test("museum: cartel text", () => {
  const m = content.museum;
  const ctx = { clubs: m.clubs, labels: m, venues: m.venues };
  const toulouse = L.cartelText(m.matches[3], { ...ctx, upcoming: null });
  assert.equal(toulouse.title, "UBB 44 – 20 Toulouse");
  assert.ok(toulouse.lines.includes("dimanche 22 mars 2026 · Stade Atlantique"));
  assert.equal(toulouse.seat, "Tribune Ouest · Bloc 05 · Rang 58 · Places 9 et 10");
  const bayonne = L.cartelText(m.matches[11], { ...ctx, upcoming: "next" });
  assert.equal(bayonne.title, "La prochaine œuvre");
  assert.equal(bayonne.teams, "UBB – Bayonne");
  const final = L.cartelText(m.matches[6], { ...ctx, upcoming: null });
  assert.ok(final.lines.includes("Sur écran géant · Stade Chaban-Delmas"));
  assert.equal(final.note, "Jouée à Bilbao · 2e titre européen d'affilée");
});

test("museum: result, date in French, the two seats", () => {
  assert.equal(L.museumResult({ score: [43, 31] }), "win");
  assert.equal(L.museumResult({ score: [31, 34] }), "loss");
  assert.equal(L.museumResult({ score: [20, 20] }), "draw");
  assert.equal(L.museumResult({ score: null }), "soon");
  assert.equal(L.museumDate("2025-04-06"), "dimanche 6 avril 2025");
  assert.equal(L.museumDate("2026-12-13"), "dimanche 13 décembre 2026");
  assert.equal(L.seatPair(224), "224 et 225");
});

test("UBB surprise: seen once, remembered across runs and alongside the secret ending", () => {
  let store = L.addDebriefRun(null, { ending: "taquine", answers: [] });
  assert.equal(store.ubb, false);
  store = L.seeUbb(store);
  store = L.addDebriefRun(store, { ending: "cocooning", answers: [] });
  assert.equal(store.ubb, true);
  assert.deepEqual(store.found, ["taquine", "cocooning"]);
  assert.equal(L.seeSecret(store).ubb, true);
  assert.equal(L.seeUbb(L.seeSecret(store)).secret, true);
  assert.equal(L.seeUbb(null).ubb, true);
});

test("secret dialogue: every line has a speaker and a sticker, Kevin enters before he speaks", () => {
  const { script } = content.debrief.secret;
  let kevinIn = false;
  for (const line of script) {
    if (line.reply) continue;
    assert.ok(["cycy", "kevin"].includes(line.who) && (line.face || line.duo || line.bite) && line.text, JSON.stringify(line));
    if (line.enter) kevinIn = true;
    if (line.who === "kevin") assert.ok(kevinIn, line.text);
  }
});

test("debrief map: every ending on the bottom row, each question above its answers", () => {
  const tree = L.debriefTree(content.debrief);
  const endings = tree.filter((t) => t.ending);
  assert.equal(endings.length, Object.keys(content.debrief.endings).length);
  assert.ok(endings.every((t) => t.y === 1));
  const byId = Object.fromEntries(tree.map((t) => [t.id, t]));
  for (const t of tree) if (t.parent) assert.ok(byId[t.parent].y < t.y, t.id);
  assert.equal(byId[content.debrief.start].parent, null);
  assert.ok(endings.every((t, k) => k === 0 || t.x > endings[k - 1].x));
});

test("fill replaces placeholders", () => {
  assert.equal(L.fill("Cadeau n°{n}", { n: 3 }), "Cadeau n°3");
  assert.equal(L.fill("{x} reste", {}), "{x} reste");
});
