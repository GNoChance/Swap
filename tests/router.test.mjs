// The portal's addresses: which world a #… address opens, and the old ?musee link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeHash, legacyRedirect, createRouter } from "../js/router.js";

const hub = { world: "hub", id: null };

test("router: an empty address, # or #/ is the hub", () => {
  for (const h of ["", "#", "#/"]) assert.deepEqual(parseRoute(h), hub);
});

test("router: each world has its address, trailing slash and capitals tolerated", () => {
  assert.deepEqual(parseRoute("#/swap"), { world: "swap", id: null });
  assert.deepEqual(parseRoute("#/ubb/"), { world: "ubb", id: null });
  assert.deepEqual(parseRoute("#/UBB"), { world: "ubb", id: null });
  assert.deepEqual(parseRoute("#/aventures"), { world: "aventures", id: null });
  assert.deepEqual(parseRoute("#/aventures/roadtrip"), { world: "aventures", id: "roadtrip" });
});

test("router: anything else leads to the hub", () => {
  for (const h of ["#/inconnu", "#/swap/extra", "#/aventures/../x", "#/aventures/%3Cb%3E", "#/aventures/a/b"]) {
    assert.deepEqual(parseRoute(h), hub, h);
  }
});

test("router: routeHash writes the address back", () => {
  assert.equal(routeHash(hub), "#/");
  assert.equal(routeHash({ world: "aventures", id: "roadtrip" }), "#/aventures/roadtrip");
  for (const h of ["#/", "#/swap", "#/ubb", "#/aventures", "#/aventures/paris-2"]) assert.equal(routeHash(parseRoute(h)), h);
});

test("router: ?musee becomes #/ubb and keeps the other parameters", () => {
  assert.deepEqual(legacyRedirect("?musee"), { search: "", hash: "#/ubb" });
  assert.deepEqual(legacyRedirect("?musee&css"), { search: "?css", hash: "#/ubb" });
  assert.deepEqual(legacyRedirect("?css&musee&souvenirs=fake"), { search: "?css&souvenirs=fake", hash: "#/ubb" });
});

test("router: the other special addresses are left alone", () => {
  for (const s of ["", "?demo", "?ubb", "?rejouer"]) assert.equal(legacyRedirect(s), null, s);
});

test("router: replace rewrites the address in place, keeps whether it is one of the portal's, then shows it", () => {
  const saved = { location: globalThis.location, history: globalThis.history };
  const entries = []; // the browser's history: [state, url]
  globalThis.location = { hash: "#/aventures/roadtrip" };
  globalThis.history = {
    get state() {
      return entries.at(-1)?.[0] ?? null;
    },
    pushState(state, _, url) {
      entries.push([state, url]);
      location.hash = url;
    },
    replaceState(state, _, url) {
      entries.splice(-1, 1, [state, url]);
      location.hash = url;
    },
  };
  try {
    entries.push([null, "#/aventures/roadtrip"]); // opened straight on an outing
    const seen = [];
    const router = createRouter((route, previous) => seen.push([route, previous]));
    router.replace({ world: "aventures", id: null });
    assert.deepEqual(entries, [[{ portail: false }, "#/aventures"]]);
    assert.deepEqual(router.current(), { world: "aventures", id: null });
    assert.deepEqual(seen, [[{ world: "aventures", id: null }, { world: "aventures", id: "roadtrip" }]]);
    router.go({ world: "aventures", id: "canoe" }); // an entry of the portal's stays one
    router.replace({ world: "aventures", id: null });
    assert.deepEqual(entries.at(-1), [{ portail: true }, "#/aventures"]);
    assert.equal(entries.length, 2);
  } finally {
    Object.assign(globalThis, saved);
  }
});

test("router: a second back() before the first one's popstate is ignored (a double tap), until it lands or 1 s has gone by", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const saved = { location: globalThis.location, history: globalThis.history };
  const popstate = []; // the router's popstate listeners
  let backs = 0; // history.back() calls; the browser steps back later (popstate)
  globalThis.location = { hash: "#/aventures" };
  globalThis.history = { state: { portail: true }, back: () => backs++ };
  globalThis.addEventListener = (type, fn) => type === "popstate" && popstate.push(fn);
  try {
    const router = createRouter(() => {});
    router.start();
    router.back();
    router.back(); // the same button touched twice: the browser has not stepped back yet
    assert.equal(backs, 1);
    location.hash = "#/";
    popstate.forEach((fn) => fn()); // it has
    router.back();
    assert.equal(backs, 2);
    router.back(); // no popstate this time (nothing before the first entry): after 1 s, back() works again
    t.mock.timers.tick(999);
    router.back();
    assert.equal(backs, 2);
    t.mock.timers.tick(1);
    router.back();
    assert.equal(backs, 3);
  } finally {
    Object.assign(globalThis, saved);
    delete globalThis.addEventListener;
  }
});
