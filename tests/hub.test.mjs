// The hub's three worlds and the list of our outings: pure data and maths, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { content } from "../js/content.js";
import { WORLDS, hubWorlds, closestIndex, cardScale, cardFade } from "../js/hub-logic.js";
import { AVENTURES } from "../js/aventures/data.js";

const file = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)));

test("hub: three worlds, in order, with their titles and counts from the data", () => {
  assert.deepEqual(
    hubWorlds(content, 15).map((w) => [w.id, w.title, w.note]),
    [
      ["swap", "Le Swap", "9 cadeaux"],
      ["ubb", "La Galerie UBB", "14 matchs"],
      ["aventures", "Nos aventures", "15 aventures"],
    ],
  );
  assert.equal(hubWorlds(content, 15)[0].color, "#7A1F35");
  assert.deepEqual(
    WORLDS.map((w) => [w.id, w.color, w.ink]),
    [
      ["swap", "#7A1F35", "#F6EFE6"],
      ["ubb", "#ECE7DF", "#7A1733"],
      ["aventures", "#0F8C8A", "#FFF8E7"],
    ],
  );
});

test("hub: the card nearest the middle of the screen is the current one", () => {
  assert.equal(closestIndex([100, 400, 700], 390), 1);
  assert.equal(closestIndex([100, 400, 700], 560), 2);
});

test("hub: cards shrink and fade with their distance from the middle, up to one card width", () => {
  assert.equal(cardScale(0, 300), 1);
  assert.equal(cardScale(-150, 300), 0.94);
  assert.equal(cardScale(600, 300), 0.88);
  assert.equal(cardFade(0, 300), 1);
  assert.equal(cardFade(300, 300), 0.55);
});

test("aventures: the 15 outings, in date order, matching the stamps", () => {
  const stamps = JSON.parse(file("../assets/aventures/tampons/tampons.json"));
  assert.equal(AVENTURES.length, 15);
  assert.deepEqual(
    AVENTURES.map((a) => [a.id, a.name]),
    stamps.map((s) => [s.id, s.name]),
  );
  assert.ok(AVENTURES.every((a) => /^\d{4}-\d{2}-\d{2}$/.test(a.from) && /^\d{4}-\d{2}-\d{2}$/.test(a.to) && a.from <= a.to));
  assert.ok(AVENTURES.every((a, i) => i === 0 || AVENTURES[i - 1].from <= a.from));
  assert.equal(AVENTURES[0].from, "2025-05-17");
  assert.equal(AVENTURES[14].to, "2026-10-25");
});

test("hub: the swap's home page no longer has its gallery button", () => {
  assert.equal(content.home.museum, undefined);
});

test("name: the app is called « Cycy et Kevin », page and home-screen app alike", () => {
  const manifest = JSON.parse(file("../manifest.webmanifest"));
  assert.equal(manifest.name, "Cycy et Kevin");
  assert.equal(manifest.short_name, "Cycy et Kevin");
  const html = file("../index.html").toString();
  assert.match(html, /<title>Cycy et Kevin<\/title>/);
  assert.match(html, /apple-mobile-web-app-title" content="Cycy et Kevin"/);
});

test("icon: every size is there, square", () => {
  const size = (png) => [png.readUInt32BE(16), png.readUInt32BE(20)]; // the PNG header (IHDR)
  for (const [name, n] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["favicon-32.png", 32],
    ["favicon-64.png", 64],
  ]) {
    assert.deepEqual(size(file(`../assets/logo/${name}`)), [n, n], name);
  }
});
