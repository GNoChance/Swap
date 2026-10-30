// The outings' data for the intros (spec § 9): their transports and guests, and the place of each outing that has its
// own scenario (intros/index.js, read under Node: it imports nothing).
import { test } from "node:test";
import assert from "node:assert/strict";
import { AVENTURES, PEOPLE, TRANSPORTS } from "../js/aventures/data.js";
import { SCENARIOS } from "../js/aventures/intros/index.js";

const byId = (id) => AVENTURES.find((a) => a.id === id);

test("intros: transports and people are known, in the spec's table", () => {
  for (const a of AVENTURES) {
    assert.ok(Array.isArray(a.transports) && a.transports.length, `${a.id}: no transports`);
    assert.ok(a.transports.every((t) => TRANSPORTS.includes(t)), `${a.id}: transports ${a.transports}`);
    assert.ok(Array.isArray(a.people), `${a.id}: no people`);
    assert.ok(a.people.every((p) => PEOPLE.includes(p)), `${a.id}: people ${a.people}`);
  }
  assert.deepEqual(byId("bivouac-1").transports, ["seat", "pied"]);
  assert.deepEqual(byId("royan-2").people, ["dede", "nini", "caro", "marius", "manon", "noe"]);
  assert.deepEqual(byId("espelette").transports, ["camping-car"]);
  assert.equal(byId("espelette").people.length, 9);
  assert.equal(byId("espelette").people[0], "fabus");
  // the passport's save, the stamps' files and `known` hang on the ids: unchanged, in the same order
  assert.deepEqual(
    AVENTURES.map((a) => a.id),
    ["bivouac-1", "canoe", "ile-de-re", "marqueze", "airbnb", "boxers", "paris-1", "paris-2", "sardaigne", "dordogne-1-an", "bivouac-2", "royan-1", "royan-2", "roadtrip", "espelette"],
  );
});

test("intros: every outing with a scenario has its lieu", () => {
  for (const id of Object.keys(SCENARIOS)) {
    assert.ok(byId(id), `${id}: no such outing`);
    assert.ok(typeof byId(id).lieu === "string" && byId(id).lieu.trim(), `${id}: no lieu`);
  }
});
