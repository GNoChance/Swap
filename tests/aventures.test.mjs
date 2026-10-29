// The passport's rules (spec § 4): which outing is open, the stamps, the save, the pages, the dates. Pure logic, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AVENTURES } from "../js/aventures/data.js";
import {
  initialProgress,
  sanitizeProgress,
  statuses,
  nextToLive,
  live,
  stamp,
  isComplete,
  openable,
  addedSince,
  demoProgress,
  passportPages,
  pageOf,
  formatRange,
  shortDate,
  monthYear,
} from "../js/aventures/logic.js";

const a = { id: "a", name: "A", from: "2025-01-01", to: "2025-01-01" };
const b = { id: "b", name: "B", from: "2025-02-01", to: "2025-02-01" };
const c = { id: "c", name: "C", from: "2025-03-01", to: "2025-03-01" };
const z = { id: "z", name: "Z", from: "2025-01-01", to: "2025-01-01" }; // same day as a

test("aventures: in date order, only the oldest outing without a stamp is open", () => {
  const s0 = statuses(AVENTURES, initialProgress());
  assert.equal(s0["bivouac-1"], "open");
  assert.ok(AVENTURES.slice(1).every((x) => s0[x.id] === "locked"));
  const later = statuses([a, b, c], { ...initialProgress(), stamped: ["a", "c"] }); // a sortie added in the middle
  assert.deepEqual(later, { a: "stamped", b: "open", c: "stamped" });
  // By start date, then by id, whatever the order of the list (which is left as it was)
  const shuffled = [c, b, a];
  assert.deepEqual(statuses(shuffled, initialProgress()), { a: "open", b: "locked", c: "locked" });
  assert.deepEqual(shuffled, [c, b, a]);
  assert.deepEqual(statuses([z, a], initialProgress()), { a: "open", z: "locked" });
});

test("aventures: living the open outing leaves its stamp waiting, and nothing opens meanwhile", () => {
  const p1 = live(AVENTURES, initialProgress(), "bivouac-1");
  assert.deepEqual(p1.pending, ["bivouac-1"]);
  assert.ok(Object.values(statuses(AVENTURES, p1)).every((v) => v !== "open"));
  assert.deepEqual(live(AVENTURES, initialProgress(), "canoe"), initialProgress()); // locked: unchanged
  assert.equal(live(AVENTURES, p1, "canoe"), p1); // nothing to live: unchanged, same object
  const fresh = initialProgress();
  live(AVENTURES, fresh, "bivouac-1");
  assert.deepEqual(fresh, initialProgress()); // the progress passed in is never changed
  // A save with several stamps waiting: still nothing open, and the oldest one comes first
  const several = { ...initialProgress(), pending: ["c", "a"] };
  assert.deepEqual(statuses([a, b, c], several), { a: "pending", b: "locked", c: "pending" });
  assert.equal(nextToLive([a, b, c], several), "a");
});

test("aventures: stamping the waiting outing opens the next one; anything else changes nothing", () => {
  const p1 = live(AVENTURES, initialProgress(), "bivouac-1");
  const p2 = stamp(AVENTURES, p1, "bivouac-1");
  assert.deepEqual([p2.stamped, p2.pending], [["bivouac-1"], []]);
  assert.equal(statuses(AVENTURES, p2).canoe, "open");
  assert.equal(nextToLive(AVENTURES, p1), "bivouac-1");
  assert.equal(nextToLive(AVENTURES, p2), "canoe");
  assert.equal(stamp(AVENTURES, p2, "canoe"), p2); // not pending: unchanged, same object
  // Open and stamped outings can be opened; locked, waiting and unknown ones cannot
  assert.ok(openable(AVENTURES, p2, "bivouac-1") && openable(AVENTURES, p2, "canoe") && !openable(AVENTURES, p2, "royan-1") && !openable(AVENTURES, p1, "bivouac-1"));
  assert.equal(openable(AVENTURES, p2, "inconnue"), false);
});

test("aventures: ?demo stamps every outing, or those before ?tampon, whose stamp then waits", () => {
  const all = demoProgress(AVENTURES);
  assert.ok(isComplete(AVENTURES, all) && nextToLive(AVENTURES, all) === null);
  const t = demoProgress(AVENTURES, "canoe");
  assert.deepEqual([t.stamped, t.pending], [["bivouac-1"], ["canoe"]]);
  assert.equal(isComplete(AVENTURES, t), false);
  assert.deepEqual(demoProgress([a, b, c], "b"), { stamped: ["a"], pending: ["b"], welcomed: true, known: ["a", "b", "c"], page: 0 });
  assert.deepEqual(demoProgress([c, a, b], "b").stamped, ["a"]); // "before" is by date
  const unknown = demoProgress([a, b, c], "inconnue"); // a mistyped ?tampon: everything stamped
  assert.deepEqual([unknown.stamped, unknown.pending], [["a", "b", "c"], []]);
});

test("aventures: a damaged or old save is cleaned up, a good one is kept as it is", () => {
  assert.deepEqual(sanitizeProgress({ stamped: ["a", "a", "zzz"], pending: ["a", "b"], welcomed: "oui", page: -3, known: 4 }, ["a", "b", "c"]),
    { stamped: ["a"], pending: ["b"], welcomed: false, known: [], page: 0 });
  assert.deepEqual(sanitizeProgress(null, ["a"]), initialProgress());
  assert.deepEqual(sanitizeProgress({ pending: ["c", "a"] }, ["a", "b", "c"]), { stamped: [], pending: ["c", "a"], welcomed: false, known: [], page: 0 });
  assert.deepEqual(
    sanitizeProgress({ stamped: ["a"], pending: ["b"], welcomed: true, known: ["a", "b", "b", "zzz"], page: 2, old: true }, ["a", "b", "c"]),
    { stamped: ["a"], pending: ["b"], welcomed: true, known: ["a", "b"], page: 2 },
  );
});

test("aventures: the outings added since the last visit, once welcomed", () => {
  assert.deepEqual(addedSince([a, b, c], { ...initialProgress(), welcomed: true, known: ["a", "c"] }), ["b"]);
  assert.deepEqual(addedSince([a, b, c], initialProgress()), []);
  // an outing already lived is never announced as a new stamp to win (an old save without `known`)
  assert.deepEqual(addedSince([a, b, c], { ...initialProgress(), welcomed: true, known: [], stamped: ["a"], pending: ["b"] }), ["c"]);
});

test("aventures: the passport's pages: identity, two stamps a page, then the next destination", () => {
  const pages = passportPages(AVENTURES);
  assert.equal(pages.length, 10);
  assert.deepEqual([pages[0].kind, pages[9].kind], ["identity", "next"]);
  assert.deepEqual(pages[1].ids, ["bivouac-1", "canoe"]);
  assert.deepEqual(pages[8].ids, ["espelette"]);
  assert.equal(pageOf(AVENTURES, "espelette"), 8);
  assert.deepEqual(passportPages([c, b, a]), [{ kind: "identity" }, { kind: "stamps", ids: ["a", "b"] }, { kind: "stamps", ids: ["c"] }, { kind: "next" }]);
  assert.equal(pageOf([c, b, a], "c"), 2);
  assert.equal(pageOf(AVENTURES, "inconnue"), 0); // unknown: the identity page
});

test("aventures: dates in French", () => {
  assert.equal(formatRange("2025-05-17", "2025-05-18"), "17–18 mai 2025");
  assert.equal(formatRange("2025-08-11", "2025-08-11"), "11 août 2025");
  assert.equal(formatRange("2026-04-30", "2026-05-02"), "30 avril – 2 mai 2026");
  assert.equal(formatRange("2025-12-29", "2026-01-05"), "29 décembre 2025 – 5 janvier 2026");
  // French typography: the first of the month is « 1er » (Royan, la bande: 1er août 2026)
  assert.equal(formatRange("2026-08-01", "2026-08-01"), "1er août 2026");
  assert.equal(formatRange("2026-05-01", "2026-05-03"), "1er–3 mai 2026");
  assert.equal(formatRange("2026-04-30", "2026-05-01"), "30 avril – 1er mai 2026");
  assert.equal(shortDate("2025-05-17"), "17/05/2025");
  assert.equal(monthYear("2025-05-17"), "mai 2025");
});
