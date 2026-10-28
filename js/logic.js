// Pure logic: answer matching and progress transitions. No DOM, no storage.

export const STEP_COUNT = 9;

/** Lowercase, strip accents, keep only a–z and 0–9. */
export function compact(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Compacted words; with `singular`, a trailing "s" is dropped ("pommes" → "pomme"). */
function tokens(text, singular) {
  return String(text)
    .split(/\s+/)
    .map(compact)
    .filter(Boolean)
    .map((t) => (singular && t.length > 2 ? t.replace(/s$/, "") : t));
}

/**
 * One accepted entry against the input, tolerant to plurals.
 * - multi-word entries and long words match anywhere ("bombe de bain" ⊂ "une bombe de bain lush")
 * - short single words must be a whole word ("mm" matches "m&m" but not "pomme")
 */
function matchesEntry(input, entry) {
  if (!compact(entry)) return false;
  const isMultiWord = /\s/.test(String(entry).trim());
  return [false, true].some((singular) => {
    const needle = tokens(entry, singular).join("");
    const words = tokens(input, singular);
    if (isMultiWord || needle.length >= 5) return words.join("").includes(needle);
    return words.includes(needle) || words.join("") === needle;
  });
}

/** `accept` items: a string, or an array of strings that must all be present. */
export function matchesAnswer(input, accept) {
  if (!compact(input)) return false;
  return accept.some((item) =>
    Array.isArray(item) ? item.every((entry) => matchesEntry(input, entry)) : matchesEntry(input, item),
  );
}

/** "Prépare … [STRASS] … [TIKTOK] !" → [{text}, {word:"STRASS"}, {text}, {word:"TIKTOK"}, {text}] */
export function parseBlanks(sentence) {
  const parts = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(sentence))) {
    if (m.index > last) parts.push({ text: sentence.slice(last, m.index) });
    parts.push({ word: m[1].toUpperCase() });
    last = re.lastIndex;
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last) });
  return parts;
}

/** Words of the acrostic phrase, with their first letter. Punctuation-only chunks are skipped. */
export function acrosticWords(phrase) {
  return phrase
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .map((w) => ({ word: w, letter: compact(w.match(/\p{L}/u)[0]).toUpperCase() }));
}

export function pick(list, previous) {
  if (list.length < 2) return list[0];
  let next;
  do next = list[Math.floor(Math.random() * list.length)];
  while (next === previous);
  return next;
}

export function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (key in values ? values[key] : `{${key}}`));
}

// ── Progress ────────────────────────────────────────────────
// Step status: "locked" → "active" → "revealed" (answer shown) → "done" (gift opened)
// bonus: the Nerds bonus (after the last gift) has been seen. pub: the ad break has been watched.
// snack: the crisps she picked in the intro ("munch" | "brets"). step.choice: her pick inside a gift (fondue camp).

export function initialProgress() {
  return {
    started: false,
    bonus: false,
    pub: false,
    snack: null,
    steps: Array.from({ length: STEP_COUNT }, (_, i) => ({
      status: i === 0 ? "active" : "locked",
      found: false,
      hintUsed: false,
      choice: null,
    })),
  };
}

function withStep(progress, index, patch) {
  return {
    ...progress,
    steps: progress.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
  };
}

export function start(progress) {
  return { ...progress, started: true };
}

export function useHint(progress, index) {
  return withStep(progress, index, { hintUsed: true });
}

/** Answer found (found=true) or shown with "Voir la réponse" (found=false). */
export function solve(progress, index, found) {
  const step = progress.steps[index];
  if (!step || step.status !== "active") return progress;
  return withStep(progress, index, { status: "revealed", found });
}

/** "J'ai ouvert mon cadeau" → step done, next one unlocked. */
export function open(progress, index) {
  const step = progress.steps[index];
  if (!step || step.status !== "revealed") return progress;
  let next = withStep(progress, index, { status: "done" });
  const following = next.steps[index + 1];
  if (following && following.status === "locked") next = withStep(next, index + 1, { status: "active" });
  return next;
}

/** Her pick inside a gift (the fondue camp); she can change her mind until the gift is solved. */
export function choose(progress, index, choice) {
  const step = progress.steps[index];
  if (!step || step.status !== "active") return progress;
  return withStep(progress, index, { choice });
}

export function pickSnack(progress, snack) {
  return { ...progress, snack };
}

export function seeBonus(progress) {
  return { ...progress, bonus: true };
}

export function seePub(progress) {
  return { ...progress, pub: true };
}

export function unlockAll(progress) {
  return {
    ...progress,
    started: true,
    steps: progress.steps.map((s) => (s.status === "locked" ? { ...s, status: "active" } : s)),
  };
}

export function doneCount(progress) {
  return progress.steps.filter((s) => s.status === "done").length;
}

export function isComplete(progress) {
  return doneCount(progress) === STEP_COUNT;
}

export function score(progress) {
  return progress.steps.filter((s) => s.found).length;
}

/** Repair anything odd loaded from storage (wrong length, unknown status…). */
export function sanitize(raw) {
  const base = initialProgress();
  if (!raw || !Array.isArray(raw.steps) || raw.steps.length !== STEP_COUNT) return base;
  const valid = ["locked", "active", "revealed", "done"];
  const text = (v) => (typeof v === "string" && v ? v : null);
  const steps = raw.steps.map((s, i) => ({
    status: valid.includes(s?.status) ? s.status : base.steps[i].status,
    found: Boolean(s?.found),
    hintUsed: Boolean(s?.hintUsed),
    choice: text(s?.choice),
  }));
  // The step after a done one can never stay locked.
  steps.forEach((s, i) => {
    if (s.status === "done" && steps[i + 1]?.status === "locked") steps[i + 1].status = "active";
  });
  return { started: Boolean(raw.started), bonus: Boolean(raw.bonus), pub: Boolean(raw.pub), snack: text(raw.snack), steps };
}

// ── Crossword ───────────────────────────────────────────────
// words: [{ word, clue, row, col, dir: "horizontal" | "vertical", golden? }], row/col from 0.

/** Lay the words on a grid: cells by "r,c", entries with their cell keys and clue numbers. */
export function crosswordGrid(words) {
  const cells = new Map();
  const entries = words.map((w, index) => {
    const word = compact(w.word).toUpperCase();
    const [dr, dc] = w.dir === "vertical" ? [1, 0] : [0, 1];
    const keys = [...word].map((letter, i) => {
      const r = w.row + dr * i;
      const c = w.col + dc * i;
      const key = `${r},${c}`;
      const cell = cells.get(key) || { r, c, key, letter, entries: [], conflict: false };
      if (cell.letter !== letter) cell.conflict = true;
      cell.entries.push(index);
      cells.set(key, cell);
      return key;
    });
    return { ...w, index, word, keys };
  });
  // Clue numbers follow the reading order of the first letters.
  [...new Set(entries.map((e) => e.keys[0]))]
    .map((key) => cells.get(key))
    .sort((a, b) => a.r - b.r || a.c - b.c)
    .forEach((cell, i) => (cell.number = i + 1));
  entries.forEach((e) => (e.number = cells.get(e.keys[0]).number));
  const all = [...cells.values()];
  return { cells, entries, rows: Math.max(...all.map((c) => c.r)) + 1, cols: Math.max(...all.map((c) => c.c)) + 1 };
}

/** What would make the grid unplayable: two different letters in one cell, or letters touching outside a word. */
export function crosswordErrors(words) {
  const { cells, entries } = crosswordGrid(words);
  const errors = [];
  for (const cell of cells.values()) {
    if (cell.r < 0 || cell.c < 0) errors.push(`Case hors grille en ligne ${cell.r + 1}, colonne ${cell.c + 1}`);
    if (cell.conflict) errors.push(`Deux lettres différentes en ligne ${cell.r + 1}, colonne ${cell.c + 1}`);
  }
  // Every horizontal or vertical run of 2+ letters must be exactly one of the words.
  const runs = new Set(entries.map((e) => `${e.dir === "vertical" ? "vertical" : "horizontal"}:${e.keys[0]}:${e.keys.length}`));
  for (const dir of ["horizontal", "vertical"]) {
    const [dr, dc] = dir === "vertical" ? [1, 0] : [0, 1];
    for (const cell of cells.values()) {
      if (cells.has(`${cell.r - dr},${cell.c - dc}`)) continue;
      let length = 1;
      while (cells.has(`${cell.r + dr * length},${cell.c + dc * length}`)) length++;
      if (length > 1 && !runs.has(`${dir}:${cell.key}:${length}`)) {
        errors.push(`Lettres collées hors d'un mot en ligne ${cell.r + 1}, colonne ${cell.c + 1}`);
      }
    }
  }
  return errors;
}

// ── Word search ─────────────────────────────────────────────
// grid: rows of letters ("MLBUZER", …); words read left → right or top → bottom (a selection may go backwards).

/** Cells [row, col] from one cell to another, if they share a row or a column; null otherwise. */
export function wordsearchLine([r0, c0], [r1, c1]) {
  if (r0 !== r1 && c0 !== c1) return null;
  const length = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1;
  const dr = Math.sign(r1 - r0);
  const dc = Math.sign(c1 - c0);
  return Array.from({ length }, (_, i) => [r0 + dr * i, c0 + dc * i]);
}

/** Index of the word spelled by the selection (either way), or -1. */
export function wordsearchMatch(grid, words, from, to) {
  const line = wordsearchLine(from, to);
  if (!line) return -1;
  const text = line.map(([r, c]) => grid[r]?.[c] ?? "").join("");
  const reversed = [...text].reverse().join("");
  return words.findIndex((w) => w === text || w === reversed);
}

/** Where each word sits: [{ word, from, to }] (first occurrence, rows then columns). */
export function wordsearchPlaces(grid, words) {
  return words.map((word) => {
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].indexOf(word);
      if (c >= 0) return { word, from: [r, c], to: [r, c + word.length - 1] };
    }
    for (let c = 0; c < grid[0].length; c++) {
      const r = grid.map((row) => row[c]).join("").indexOf(word);
      if (r >= 0) return { word, from: [r, c], to: [r + word.length - 1, c] };
    }
    return { word, from: null, to: null };
  });
}

/** What would make the grid unfair: ragged rows, a word missing, or a word hidden twice (any direction). */
export function wordsearchErrors(grid, words) {
  const errors = [];
  if (grid.some((row) => row.length !== grid[0].length)) errors.push("Toutes les lignes doivent avoir la même longueur");
  const lines = [...grid, ...Array.from({ length: grid[0].length }, (_, c) => grid.map((row) => row[c]).join(""))];
  const all = [...lines, ...lines.map((l) => [...l].reverse().join(""))];
  for (const word of words) {
    const hits = all.reduce((n, line) => n + line.split(word).length - 1, 0);
    if (hits === 0) errors.push(`« ${word} » n'est pas dans la grille`);
    if (hits > 1) errors.push(`« ${word} » apparaît ${hits} fois`);
  }
  return errors;
}

// ── Debrief (branching dialogue) ────────────────────────────
// { start, nodes: { id: { text, choices: [{ label, next }] } }, endings: { id: { n, title } } }

/** What would break the debrief: a dead end, a missing target, an unreachable node or ending, bad numbering. */
export function debriefErrors(d) {
  const errors = [];
  const nodes = d.nodes || {};
  const endings = d.endings || {};
  for (const id of Object.keys(nodes)) if (id in endings) errors.push(`« ${id} » est à la fois une question et une fin`);
  if (!(d.start in nodes)) errors.push(`La première question « ${d.start} » n'existe pas`);
  const seen = new Set();
  const visit = (id, depth) => {
    if (seen.has(id) || depth > 20) return;
    seen.add(id);
    const node = nodes[id];
    if (!node) return;
    if (!node.choices?.length) errors.push(`La question « ${id} » n'a aucune réponse`);
    for (const choice of node.choices || []) {
      if (!(choice.next in nodes) && !(choice.next in endings)) errors.push(`« ${choice.label} » mène à « ${choice.next} », qui n'existe pas`);
      else visit(choice.next, depth + 1);
    }
  };
  visit(d.start, 0);
  for (const id of [...Object.keys(nodes), ...Object.keys(endings)]) if (!seen.has(id)) errors.push(`« ${id} » n'est jamais atteint`);
  const numbers = Object.values(endings).map((e) => e.n).sort((a, b) => a - b);
  if (numbers.some((n, i) => n !== i + 1)) errors.push("Les fins doivent être numérotées de 1 à " + numbers.length);
  return errors;
}

/**
 * The debrief as a map: every question and ending once, with x, y in 0..1. Endings sit on the bottom row
 * in reading order, each question above the middle of its answers. → [{ id, parent, ending, x, y }]
 */
export function debriefTree(d) {
  const items = [];
  const place = (id, depth, parent) => {
    const item = { id, parent, ending: id in d.endings, depth, kids: [] };
    items.push(item);
    if (!item.ending) item.kids = (d.nodes[id]?.choices || []).map((choice) => place(choice.next, depth + 1, id));
    return item;
  };
  const root = place(d.start, 0, null);
  const endings = items.filter((item) => item.ending);
  endings.forEach((item, k) => (item.x = (k + 0.5) / endings.length));
  const centre = (item) => (item.ending ? item.x : (item.x = item.kids.reduce((sum, kid) => sum + centre(kid), 0) / item.kids.length));
  centre(root);
  const depth = Math.max(...items.filter((item) => !item.ending).map((item) => item.depth)) + 1;
  return items.map(({ id, parent, ending, x, depth: level }) => ({ id, parent, ending, x, y: ending ? 1 : level / depth }));
}

/** Saved debriefs: every run (answers + ending), the set of endings found, and whether the secret ending
 *  and the UBB surprise were seen. */
export function addDebriefRun(store, run) {
  const runs = Array.isArray(store?.runs) ? store.runs : [];
  const found = Array.isArray(store?.found) ? store.found : [];
  return { runs: [...runs, run], found: [...new Set([...found, run.ending])], secret: Boolean(store?.secret), ubb: Boolean(store?.ubb) };
}

// ── Museum of our matches ──

/** "win", "loss" or "draw" for UBB; "soon" while the match is still to be played (score: null). */
export function museumResult(match) {
  if (!match.score) return "soon";
  const [ubb, them] = match.score;
  return ubb > them ? "win" : ubb < them ? "loss" : "draw";
}

/** "2025-04-06" → "dimanche 6 avril 2025" (read at noon UTC: no timezone shifts the day). */
export function museumDate(iso) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

/** "2026-10-31" → "31 octobre": the day of a match still to come. */
export function museumDay(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

/** The first match still to be played (« La prochaine œuvre »), or -1. */
export function nextMatchIndex(matches) {
  return matches.findIndex((match) => !match.score);
}

/** How Mini Cycy and Kevin react in front of a match: a key of content.museum.faces. */
export function museumReaction(match) {
  const result = museumResult(match);
  if (result === "soon") return "point";
  if (result === "loss") return "lose";
  if (result === "draw") return "look";
  return match.final ? "final" : "win";
}

/** What the cartel says. upcoming: "next" (the first match to come), "soon" (the others) or null (played). */
export function cartelText(match, { clubs, labels, venues, upcoming }) {
  const club = clubs[match.opponent];
  const ubb = clubs.ubb.name;
  const date = museumDate(match.date);
  return {
    title: upcoming ? labels[upcoming] : `${ubb} ${match.score[0]} – ${match.score[1]} ${club.name}`,
    teams: upcoming ? `${ubb} – ${club.name}` : null,
    lines: match.final ? [match.competition, date, match.place] : [match.competition, `${date} · ${venues[match.venue]}`],
    note: match.note || null,
    seat: `${match.stand} · ${labels.row} ${match.row} · ${labels.seats} ${seatPair(match.seat)}`,
  };
}

/** His seat on the ticket, and hers right next to it. */
export function seatPair(seat) {
  return `${seat} et ${seat + 1}`;
}

/** The UBB surprise plays once, at the end of her first debrief. */
export function seeUbb(store) {
  return { runs: [], found: [], ...store, ubb: true };
}

/** The secret ending unlocks once every ending has been found. */
export function secretUnlocked(store, endingIds) {
  return endingIds.every((id) => store?.found?.includes(id));
}

export function seeSecret(store) {
  return { runs: [], found: [], ...store, secret: true };
}
