// The outings' data for the intros (spec § 9): their transports and guests, and the place of each outing that has its
// own scenario (intros/index.js, read under Node: it imports nothing); the stickers each scenario shows and their
// stand-ins; the stage's scale, the map's projection and the poster's words.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AVENTURES, PEOPLE, TRANSPORTS } from "../js/aventures/data.js";
import { SCENARIOS } from "../js/aventures/intros/index.js";
import { fit } from "../js/aventures/scene/stage.js";
import { fitTitle, posterLine, posterTitle, TITLE_FIT, titleWidth } from "../js/aventures/scene/poster-text.js";
import { fallbackUrl, stickerUrl, vehicleUrl } from "../js/aventures/scene/urls.js";
import { projection } from "../js/aventures/scene/geo.js";
import { stops } from "../js/aventures/scene/props-carte.js";

const byId = (id) => AVENTURES.find((a) => a.id === id);
const exists = (path) => existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url)));
const POSES = ["joie", "colere", "pleurs", "boude", "question", "sommeil", "bisou", "peace", "surprise", "pouces", "theme", "saut"];
// the bivouac's map (bivouac-1.js): Bordeaux at (199, 161), 258 units a degree
const BIVOUAC_MAP = { origin: [44.837, -0.579], at: { x: 199, y: 161 }, unitsPerDegree: 258 };

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

// The stage (spec § 6): 390 × 760 units, the whole height from 560 px up, else the action band (y 250 to 730).
test("intros: fit scales the stage to the screen", () => {
  const near = (value, want, what) => assert.ok(Math.abs(value - want) < 1e-9, `${what}: ${value}, not ${want}`);
  const phone = fit(393, 852);
  near(phone.scale, 852 / 760, "393 × 852, scale");
  near(phone.y, 0, "393 × 852, y");
  near(phone.x, (393 - 390 * phone.scale) / 2, "393 × 852, x");
  const turned = fit(852, 393);
  near(turned.scale, 393 / 480, "852 × 393, scale");
  near(turned.y, -250 * turned.scale, "852 × 393, y");
  near(fit(1440, 900).scale, 900 / 760, "1440 × 900, scale");
  const small = fit(375, 667);
  assert.ok(375 >= 390 * small.scale, `375 × 667: the stage (${390 * small.scale} px) is wider than the screen`);
});

test("intros: the poster says the lieu, then the stamp's name and dates", () => {
  assert.equal(posterTitle(byId("bivouac-1")), "LACS D'AYOUS");
  assert.equal(posterLine(byId("bivouac-1")), "Premier bivouac · 17–18 mai 2025");
});

// The poster's title stays in its picture, under the sound button's corner (the screen's top right 56 px; checked on
// screen by tests/e2e/intros.mjs): a long lieu gets smaller.
test("intros: a long lieu shrinks to fit the poster, « LACS D'AYOUS » keeps its size", () => {
  assert.equal(fitTitle("LACS D'AYOUS", TITLE_FIT), TITLE_FIT.size);
  const long = "PORT DE SAINT-JEAN-DE-LUZ"; // 20 letters
  assert.equal(long.replace(/[^A-Z]/g, "").length, 20);
  assert.ok(titleWidth(long, TITLE_FIT) > TITLE_FIT.width, "the long lieu would not need to shrink");
  const size = fitTitle(long, TITLE_FIT);
  assert.ok(size < TITLE_FIT.size && size > 8, `size ${size}`);
  const width = titleWidth(long, { ...TITLE_FIT, size });
  assert.ok(width <= TITLE_FIT.width + 1e-9, `${width} units wide, room for ${TITLE_FIT.width}`);
  assert.ok(width > TITLE_FIT.width * 0.97, `${width} units wide: smaller than it needs`);
});

// The stickers (spec § 3 and § 7): only those a scenario names are loaded; each has a stand-in (the portal's spec, § 7).
test("intros: every sticker a scenario names exists", async () => {
  for (const id of Object.keys(SCENARIOS)) {
    const { stickers } = await import(`../js/aventures/intros/${id}.stickers.js`);
    assert.ok(Array.isArray(stickers) && stickers.length, `${id}: no stickers`);
    for (const path of stickers) {
      assert.ok(!path.endsWith(".webp"), `${id}: ${path} (without .webp)`);
      assert.ok(exists(`assets/aventures/${path}.webp`), `${id}: assets/aventures/${path}.webp is missing`);
      assert.ok(path.startsWith(`${id}/`) || path.startsWith("vehicules/"), `${id}: ${path} belongs to another outing`);
    }
  }
});

test("intros: every fallback sticker exists", () => {
  for (const who of ["cycy", "kevin"])
    for (const side of ["face", "dos"])
      for (const pose of POSES) {
        const url = fallbackUrl(who, side, pose);
        assert.match(url, /^assets\/cyrielle\/[a-z0-9-]+\.webp$/, `${who} ${side} ${pose}: ${url}`);
        assert.ok(exists(url), `${who} ${side} ${pose}: ${url} is missing`);
      }
  assert.equal(fallbackUrl("cycy", "face", "joie"), "assets/cyrielle/joy.webp");
  assert.equal(fallbackUrl("kevin", "face", "pouces"), "assets/cyrielle/kevin-smug.webp");
  assert.equal(fallbackUrl("cycy", "dos", "peace"), "assets/cyrielle/dos-cycy-cheer.webp");
  assert.equal(fallbackUrl("kevin", "dos", "surprise"), "assets/cyrielle/dos-kevin-shock.webp");
});

test("intros: sticker urls", () => {
  assert.equal(stickerUrl("bivouac-1", "kevin", "dos", "joie"), "assets/aventures/bivouac-1/kevin-dos-joie.webp");
  assert.equal(vehicleUrl("seat", "roule"), "assets/aventures/vehicules/seat-roule.webp");
});

// The map (spec § 5, moment 1): the real coordinates, in a simple equirectangular projection.
test("intros: the projection puts Bordeaux where the map wants it", () => {
  const project = projection(BIVOUAC_MAP);
  const near = (p, [x, y], tolerance, what) => assert.ok(Math.abs(p.x - x) <= tolerance && Math.abs(p.y - y) <= tolerance, `${what}: ${JSON.stringify(p)}, not (${x}, ${y})`);
  near(project([44.837, -0.579]), [199, 161], 0.01, "Bordeaux");
  near(project([43.295, -0.37]), [238, 559], 1.5, "Pau");
  near(project([42.873, -0.466]), [220, 668], 1.5, "Bious-Artigues");
  assert.ok(Math.abs(project([44.5, -1.2]).x - 84) < 2, "the Atlantic coast");
  assert.ok(project([43.295, -0.37]).y > project([44.837, -0.579]).y, "further south, lower on the map");
});

test("intros: the bivouac trip stays on the map", () => {
  const { trajet } = byId("bivouac-1");
  assert.equal(trajet.depart, "Bordeaux");
  assert.ok(trajet.etapes.includes("Pau"), `etapes ${trajet.etapes}`);
  assert.ok(trajet.points.length >= 6, `${trajet.points.length} points`);
  const project = projection(BIVOUAC_MAP);
  for (const point of trajet.points) {
    const { x, y } = project(point);
    assert.ok(x >= 25 && x <= 365 && y >= 120 && y <= 700, `${point} → (${x}, ${y})`);
  }
  assert.ok(trajet.points.at(-1)[0] < trajet.points[0][0], "the arrival is not south of the start");
});

// Each stage's name is written at its point of the road, given by the data (trajet.etapesAt).
test("intros: every stage of a trip has its point on the road", () => {
  for (const a of AVENTURES.filter((x) => x.trajet)) {
    const { etapes, etapesAt, points } = a.trajet;
    assert.equal(etapesAt?.length, etapes.length, `${a.id}: etapesAt ${etapesAt}`);
    etapesAt.forEach((at, k) => assert.ok(Number.isInteger(at) && at > 0 && at < points.length - 1, `${a.id}: ${etapes[k]} at ${at}`));
  }
  assert.deepEqual(byId("bivouac-1").trajet.etapesAt, [5]);
  const project = projection(BIVOUAC_MAP);
  const { trajet, lieu } = byId("bivouac-1");
  assert.deepEqual(stops({ trajet, lieu }, project).map((s) => s.name), ["Bordeaux", "Pau", "Lacs d'Ayous"]);
  // a stage without its point: a clear error that names it
  assert.throws(() => stops({ trajet: { ...trajet, etapesAt: [] }, lieu }, project), /« Pau »/);
  assert.throws(() => stops({ trajet: { ...trajet, etapesAt: [99] }, lieu }, project), /« Pau »/);
});
