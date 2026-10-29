// The portal's addresses: which world a #… address opens, and the old ?musee link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeHash, legacyRedirect } from "../js/router.js";

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
