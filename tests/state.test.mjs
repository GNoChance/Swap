// The passport's progress in js/state.js: kept in storage; in ?demo, or when storage is blocked, for the life of the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AVENTURES } from "../js/aventures/data.js";
import { live, stamp, statuses } from "../js/aventures/logic.js";

const KEY = "swap-cyrielle:aventures";
const ids = AVENTURES.map((a) => a.id);
let copies = 0;

/** A fresh copy of js/state.js, as a page opened at `search` would load it, on `storage` ("blocked": it throws). */
async function stateAt(search, storage) {
  globalThis.location = { search, pathname: "/", hash: "#/aventures" };
  globalThis.history = { replaceState() {} };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      if (storage === "blocked") throw new DOMException("The operation is insecure.", "SecurityError");
      return storage;
    },
  });
  return import(`../js/state.js?copy=${++copies}`);
}

/** A localStorage that counts its writes; `failures`: how many writes throw first (storage full). */
function memoryStorage(failures = 0) {
  const map = new Map();
  return {
    map,
    writes: 0,
    getItem: (key) => map.get(key) ?? null,
    setItem(key, value) {
      if (failures-- > 0) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      this.writes++;
      map.set(key, String(value));
    },
    removeItem: (key) => map.delete(key),
  };
}

test("state: storage blocked, the passport still moves on within the page: welcomed, lived, stamped, the next outing open", async () => {
  const state = await stateAt("", "blocked");
  const first = state.loadAventures(AVENTURES);
  assert.equal(first.welcomed, false);
  state.saveAventures({ ...first, welcomed: true, known: ids });
  state.saveAventures(live(AVENTURES, state.loadAventures(AVENTURES), "bivouac-1"));
  assert.equal(statuses(AVENTURES, state.loadAventures(AVENTURES))["bivouac-1"], "pending");
  state.saveAventures(stamp(AVENTURES, state.loadAventures(AVENTURES), "bivouac-1"));
  const now = state.loadAventures(AVENTURES);
  assert.equal(now.welcomed, true); // back from the hub: no welcome again
  assert.equal(statuses(AVENTURES, now).canoe, "open");
});

test("state: ?demo&tampon=<id>, the stamp holds for the visit (the next outing opens), and nothing is written", async () => {
  const storage = memoryStorage();
  const state = await stateAt("?demo&tampon=bivouac-1", storage);
  const before = state.loadAventures(AVENTURES);
  assert.equal(statuses(AVENTURES, before)["bivouac-1"], "pending");
  state.saveAventures(stamp(AVENTURES, before, "bivouac-1"));
  const after = state.loadAventures(AVENTURES);
  assert.deepEqual(after.stamped, ["bivouac-1"]);
  assert.equal(statuses(AVENTURES, after).canoe, "open");
  assert.equal(storage.writes, 0);
});

test("state: ?demo&accueil, a first visit whatever her real save (Mini Cycy's welcome to come), and nothing is written", async () => {
  const storage = memoryStorage();
  storage.map.set(KEY, JSON.stringify({ stamped: ids, welcomed: true, known: ids }));
  const state = await stateAt("?demo&accueil", storage);
  const first = state.loadAventures(AVENTURES);
  assert.deepEqual([first.welcomed, first.stamped, first.pending], [false, [], []]);
  state.saveAventures({ ...first, welcomed: true, known: ids });
  assert.equal(state.loadAventures(AVENTURES).welcomed, true);
  assert.equal(storage.writes, 0);
});

test("state: storage that works is read back each time (no copy in the page); a write that fails once is held until the next one works", async () => {
  const storage = memoryStorage(1);
  const state = await stateAt("", storage);
  const lived = live(AVENTURES, state.loadAventures(AVENTURES), "bivouac-1");
  state.saveAventures(lived); // storage full: kept in the page
  assert.equal(storage.writes, 0);
  assert.deepEqual(state.loadAventures(AVENTURES).pending, ["bivouac-1"]);
  state.saveAventures(stamp(AVENTURES, lived, "bivouac-1")); // it works again: storage is the truth again
  assert.deepEqual(JSON.parse(storage.map.get(KEY)).stamped, ["bivouac-1"]);
  storage.map.delete(KEY); // wiped elsewhere (?reset in another tab)
  assert.deepEqual(state.loadAventures(AVENTURES).stamped, []);
});
