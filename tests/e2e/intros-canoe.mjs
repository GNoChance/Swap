// End-to-end checks of the Premier canoë's intro (js/aventures/intros/canoe.js), in headless Chrome, on the kit's
// screens (intro-kit.mjs) and the first phone turned sideways: its length and its closing poster « LA DORDOGNE », its
// map in two steps (the C3 from Bordeaux to Port d'Enveaux, then the bus up the valley to Carsac), who shows in each of
// its moments, the canoe spinning round (one view at a time, whole again after) and the phone turned meanwhile, the
// stickers it loads and a scene sticker's stand-in, its scenario warmed on the passport, a touch the first time,
// « Passer ▸ » in the demo, the browser's back. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then
// `node tests/e2e/intros-canoe.mjs` (ONLY=1920: a single screen). Stops at the first failure (exit code 1). A check also
// fails if the page logged an error.
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { atPassport, beatsOf, holdAt, inside, KEY, LANDING, length, loaded, outside, playing, REJECT, round, sceneBoxes, SEED, settled, skipIs, sleep, timeline, VIEWPORTS } from "./intro-kit.mjs";
import { AVENTURES } from "../../js/aventures/data.js";

// read here rather than imported: without its scenario, the suite still runs and says what fails
const { stickers } = await import("../../js/aventures/intros/canoe.stickers.js").catch(() => ({ stickers: [] }));
const BASE = process.env.BASE || "http://localhost:5173/";
const CANOE = `${BASE}?demo#/aventures/canoe`;
const TITLE = "LA DORDOGNE";
const LINE = "Premier canoë · Dordogne · 11 août 2025";
const LENGTH = { min: 30000, max: 32000 }; // ms, the canoe's intro (spec § 2)
const canoe = AVENTURES.find((a) => a.id === "canoe");
const { trajet } = canoe;
const MAP_NAMES = [trajet.depart, ...trajet.etapes, trajet.arrivee]; // the regional map's, from the data
const RELAY_NAMES = [trajet.arrivee, ...trajet.relais.noms, trajet.relais.arrivee]; // the valley's
const MAP_TIMES = [0.3, 1.5, 2, 2.6]; // s: the C3 on the regional map
const ARRIVAL_IN_SIGHT = 2; // s: from then on, the C3 near it, Port d'Enveaux's P in the screen
const RELAY_AT = 4.6; // s: the bus by Carsac, its pin plopped
// the valley's places west to east (spec § 2, moment 1; Beynac faces Castelnaud: either first), Sarlat up north
const VALLEY_ORDER = [["Port d'Enveaux"], ["les Milandes"], ["Beynac", "Castelnaud"], ["Marqueyssac"], ["La Roque-Gageac"], ["Domme"], ["Vitrac"], ["Montfort"], ["Carsac"]];
const SARLAT = "Sarlat";
// a save whose welcome is seen, the Premier bivouac stamped: the canoe to live, the first time
const BIVOUAC_STAMPED = { welcomed: true, known: AVENTURES.map((a) => a.id), stamped: ["bivouac-1"] };
const SCENE = "canoe/scene-cycy-et-kevin-en-canoe-11"; // the canoe in front of the cliff, on the poster
const beat = beatsOf("canoe");
// who shows in the middle of each moment after the map (spec § 2), all of them entirely on screen: the two of them in a
// scene sticker (« duo »), their heads in bubbles
const CAST = {
  "La mise à l'eau": ["duo"],
  "Les ronds dans l'eau": ["duo", "bulle-cycy", "bulle-kevin"],
  "La descente": ["duo"],
};
const SPIN = [7.5, 7.9, 8.3, 10.6]; // s: in the middle of the canoe's half-turns, then off again after the last one
const OFF_AGAIN = 10.6; // s: its width whole again

// a look shows: visible, and not see-through up its tree
const SHOWS = `(el) => {
  if (getComputedStyle(el).visibility !== "visible") return false;
  for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
  return true;
}`;
// the words on the wooden signs that show (the start's « Carsac · 28 km »)
const SIGNS = `[...document.querySelectorAll(".st-sign")].filter(${SHOWS}).map((el) => { const r = el.getBoundingClientRect(); return { what: el.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })`;
// the actors as the kit sees them, a bubble by its disc (what shows of the look cropped in it); the signs' words
const castBoxes = `(() => {
  const seen = ${sceneBoxes};
  const discs = Object.fromEntries([...document.querySelectorAll(".st-bubble__disc")].map((el) => {
    const r = el.getBoundingClientRect();
    return [el.closest(".st-actor").dataset.who, { left: r.left, top: r.top, right: r.right, bottom: r.bottom }];
  }));
  return { ...seen, actors: seen.actors.map((b) => (discs[b.what] ? { what: b.what, ...discs[b.what] } : b)), signs: ${SIGNS} };
})()`;
// the canoe's looks that show (one at a time: never two views, never none) and its turn box's scaleX (its width); the
// signs' words, with the screen's size
const canoeSeen = `(() => {
  const shows = ${SHOWS};
  const looks = [...document.querySelectorAll('[data-who="duo"] .st-actor__img')].filter(shows);
  const turn = looks[0]?.closest(".st-actor__turn");
  const transform = turn && getComputedStyle(turn).transform;
  return { looks: looks.length, scaleX: !turn ? null : transform === "none" ? 1 : new DOMMatrix(transform).a, signs: ${SIGNS}, screen: { width: innerWidth, height: innerHeight } };
})()`;
const BRIDGE_PASSING = 13.8; // s: Vitrac's bridge near, the leaning trees over the canoe (Review Focus 5's screen)
// the descent's layers, in paint order (the world's children, none with a z-index), with whether each shows
const descentOrder = `(() => {
  const shows = ${SHOWS};
  return [...document.querySelector(".st-world").children].filter((el) => el.dataset.layer?.startsWith("descente-")).map((el) => ({ name: el.dataset.layer, shows: shows(el), z: getComputedStyle(el).zIndex }));
})()`;

// the requests for the canoe's scenario file
const scenarioAsked = `performance.getEntriesByType("resource").filter((e) => new URL(e.name).pathname === "/js/aventures/intros/canoe.js")`;
// the poster in place: its line and every letter of its title fully shown
const built = `(() => {
  const parts = [...document.querySelectorAll(".af-title .af-letter, .af-line")];
  return parts.length > 1 && parts.every((el) => getComputedStyle(el).opacity === "1");
})()`;
// the boxes (px) of the poster's frame, title and line, and of each letter, with the screen's size
const posterBoxes = `(() => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  return {
    screen: { width: innerWidth, height: innerHeight },
    title: document.querySelector(".af-title")?.textContent,
    line: document.querySelector(".af-line")?.textContent,
    boxes: [".af-frame", ".af-title", ".af-line", ".af-title .af-letter"].flatMap((s) => [...document.querySelectorAll(s)].map((el) => ({ what: s, ...box(el) }))),
  };
})()`;
// what shows on the maps (the regional map's and the valley's are both in the page, one hidden): the actors as the kit
// sees them, the names and pins that show, the parking's P, the valley's places (.st-place, data-place), and the
// stage's scale (px a unit)
const onMap = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = ${SHOWS};
  const seen = (selector, what) => [...document.querySelectorAll(selector)].filter(shows).map((el) => box(el, what ?? el.textContent));
  const places = [...document.querySelectorAll(".st-place")].filter(shows).map((el) => box(el, el.dataset.place));
  const scale = document.querySelector(".st-world").getBoundingClientRect().height / 760;
  return { ...${sceneBoxes}, names: seen(".st-name"), pins: seen(".st-pin", "épingle"), parking: seen(".st-parking", "P"), places, scale };
})()`;
/** How far apart two boxes are (px; 0 if they touch or overlap). */
const gap = (a, b) => Math.max(0, a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);

async function suite(page, vp) {
  const check = checker(page);

  /** The intro held still at exactly `t` s (?demo&t=, then sought back there once playing): what `expression` sees. */
  async function heldAt(t, expression) {
    await page.goto(`${BASE}?demo&t=${t}#/aventures/canoe`);
    await page.waitFor(playing, 8000);
    await sleep(250);
    await page.eval(holdAt(t));
    return page.eval(expression);
  }

  /** The canoe's intro played through, as long as it says (30 to 32 s) and not shorter: its poster says the lieu, then
   *  the stamp's name and dates, all of it on screen, its title out of the sound button's corner; then the passport. */
  async function poster(where) {
    await page.goto(CANOE);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000).catch(async () => {
      throw new Error(`${where} : pas de scène (data-length ${await page.eval(length)})`);
    });
    const ms = await page.eval(length);
    if (!(ms >= LENGTH.min && ms <= LENGTH.max)) throw new Error(`${where} : data-length ${ms}, pas entre ${LENGTH.min} et ${LENGTH.max}`);
    // the page's own clock: when its timeline started playing, when it left its address
    await page.eval(`(() => {
      window.__played = window.__ended = null;
      const watch = setInterval(() => {
        const tl = ${timeline};
        if (tl && tl.time() > 0 && window.__played === null) window.__played = performance.now() - tl.time() * 1000;
        if (location.hash !== "#/aventures/canoe") (window.__ended = performance.now()), clearInterval(watch);
      }, 10);
    })()`);
    await page.waitFor(built, ms + 4000);
    const seen = await page.eval(posterBoxes);
    if (seen.title !== TITLE) throw new Error(`${where} : titre « ${seen.title} »`);
    if (seen.line !== LINE) throw new Error(`${where} : ligne « ${seen.line} »`);
    inside(seen, where);
    // the sound button's corner (the screen's top right 56 px): the title stays out of it
    const corner = seen.boxes.filter((b) => b.what === ".af-title .af-letter" && b.right > seen.screen.width - 56 && b.top < 56);
    if (corner.length) throw new Error(`${where} : le titre sous le bouton du son ${JSON.stringify(corner.map(round))}`);
    await page.waitFor(atPassport, 5000);
    const { played, ended } = await page.eval(`({ played: window.__played, ended: window.__ended })`);
    if (played === null || ended === null || ended - played < ms - 300) throw new Error(`${where} : jouée ${Math.round(ended - played)} ms pour ${ms}`);
  }

  /** The map in two steps, held at given moments. On the regional map: the C3 alone and in sight, the three names of
   *  the data written, none cut by the screen's edge, all of them in the screen at the start, Bergerac never under the
   *  C3, and the P of Port d'Enveaux in the screen once the C3 comes near it, its pin and its name too at the end. On the
   *  valley's map: the bus alone and in sight, the relay's names those of the data, every name and every place in the
   *  screen, the places west to east in the spec's order (Beynac facing Castelnaud across the river, Sarlat up north),
   *  each name by its own place and on no other, Carsac's pin in sight. */
  async function maps(where) {
    const seen = (t) => heldAt(t, onMap);
    const offScreen = (now, t, boxes, what) => {
      const off = outside(now.screen, boxes);
      if (off.length) throw new Error(`${where}, à ${t} s : ${what} hors de l'écran ${JSON.stringify(off.map((b) => b && round(b)))}`);
    };
    /** Names in view are whole: never cut by the screen's edge. */
    const whole = (now, t) => offScreen(now, t, now.names.filter((b) => b.right > 0 && b.left < now.screen.width && b.bottom > 0 && b.top < now.screen.height), "un nom coupé par le bord");
    for (const t of MAP_TIMES) {
      const now = await seen(t);
      const names = now.names.map((b) => b.what);
      if (JSON.stringify(names) !== JSON.stringify(MAP_NAMES)) throw new Error(`${where}, à ${t} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(MAP_NAMES)}`);
      if (now.actors.length !== 1 || now.actors[0].what !== "c3") throw new Error(`${where}, à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      offScreen(now, t, now.actors, "la C3");
      whole(now, t);
      if (t === MAP_TIMES[0]) offScreen(now, t, now.names, "un nom de la carte");
      const stage = now.names.find((b) => b.what === trajet.etapes[0]);
      if (gap(stage, now.actors[0]) === 0) throw new Error(`${where}, à ${t} s : « ${stage.what} » sous la C3 ${JSON.stringify([stage, now.actors[0]].map(round))}`);
      if (t >= ARRIVAL_IN_SIGHT) {
        if (now.parking.length !== 1) throw new Error(`${where}, à ${t} s : ${now.parking.length} P`);
        offScreen(now, t, now.parking, "le P");
      }
      if (t === MAP_TIMES.at(-1)) {
        if (now.pins.length !== 1) throw new Error(`${where}, à ${t} s : ${now.pins.length} épingle(s)`);
        offScreen(now, t, [...now.pins, now.names.find((b) => b.what === trajet.arrivee)], "l'arrivée");
      }
    }
    const now = await seen(RELAY_AT);
    const names = now.names.map((b) => b.what);
    if (JSON.stringify([...names].sort()) !== JSON.stringify([...RELAY_NAMES].sort())) throw new Error(`${where}, à ${RELAY_AT} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(RELAY_NAMES)}`);
    if (now.actors.length !== 1 || now.actors[0].what !== "bus") throw new Error(`${where}, à ${RELAY_AT} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
    if (now.pins.length !== 1) throw new Error(`${where}, à ${RELAY_AT} s : ${now.pins.length} épingle(s)`);
    offScreen(now, RELAY_AT, [...now.actors, ...now.pins], "le bus ou l'épingle");
    offScreen(now, RELAY_AT, now.names, "un nom de la vallée");
    // the places west to east, Beynac and Castelnaud side by side, each on its own bank; Sarlat over all of them
    const place = (name) => now.places.find((b) => b.what === name);
    const missing = [...VALLEY_ORDER.flat(), SARLAT].filter((name) => !place(name));
    if (missing.length) throw new Error(`${where}, à ${RELAY_AT} s : pas de place pour ${JSON.stringify(missing)}`);
    offScreen(now, RELAY_AT, now.places, "une place de la vallée");
    const middle = (b) => (b.left + b.right) / 2;
    const order = VALLEY_ORDER.flat().sort((a, b) => middle(place(a)) - middle(place(b)));
    const slots = order.map((name) => VALLEY_ORDER.findIndex((slot) => slot.includes(name)));
    if (slots.some((slot, k) => k && slot < slots[k - 1])) throw new Error(`${where}, à ${RELAY_AT} s : d'ouest en est ${JSON.stringify(order)}`);
    const [beynac, castelnaud] = [place("Beynac"), place("Castelnaud")];
    if (Math.abs(middle(beynac) - middle(castelnaud)) > 30 * now.scale || beynac.bottom > castelnaud.top) throw new Error(`${where}, à ${RELAY_AT} s : Beynac pas en face de Castelnaud ${JSON.stringify([beynac, castelnaud].map(round))}`);
    if (now.places.some((b) => b.what !== SARLAT && b.top < place(SARLAT).bottom)) throw new Error(`${where}, à ${RELAY_AT} s : Sarlat pas au nord`);
    // each name by its own place (at most 14 units away), on no other place and no other name
    for (const name of now.names) {
      const own = place(name.what);
      if (!own || gap(name, own) > 14 * now.scale) throw new Error(`${where}, à ${RELAY_AT} s : « ${name.what} » loin de sa place ${JSON.stringify([name, own].map((b) => b && round(b)))}`);
      const onto = [...now.places.filter((b) => b.what !== name.what), ...now.names.filter((b) => b !== name)].find((b) => gap(name, b) === 0);
      if (onto) throw new Error(`${where}, à ${RELAY_AT} s : « ${name.what} » sur « ${onto.what} »`);
    }
  }

  /** In the middle of each moment after the map, held there: exactly those it shows (CAST), each entirely on screen;
   *  the words of a sign that shows, whole (never cut by the screen's edge). */
  async function scenes(where) {
    for (const [name, needs] of Object.entries(CAST)) {
      const t = beat[name].mid;
      const now = await heldAt(t, castBoxes);
      const who = now.actors.map((b) => b.what).sort();
      if (JSON.stringify(who) !== JSON.stringify([...needs].sort())) throw new Error(`${where}, « ${name} » à ${t} s : à l'écran ${JSON.stringify(who)}`);
      const off = outside(now.screen, [...now.actors, ...now.signs]);
      if (off.length) throw new Error(`${where}, « ${name} » à ${t} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
    }
  }

  await check(`?demo#/aventures/canoe : data-length entre ${LENGTH.min} et ${LENGTH.max} ms, l'intro jouée en entier (pas moins de data-length − 300 ms), puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= ${MAP_TIMES.join(", ").replaceAll(".", ",")}), la C3 seule et dans l'écran, « ${MAP_NAMES.join(" », « ")} » écrits, jamais coupés par le bord, tous dans l'écran au départ, « ${trajet.etapes[0]} » jamais sous la C3, le P de ${trajet.arrivee} dans l'écran dès ${ARRIVAL_IN_SIGHT} s, son épingle et son nom à la fin ; à ?t= ${String(RELAY_AT).replace(".", ",")}, sur la vallée, le bus seul et dans l'écran, les noms du relais ceux des données, chaque nom et chaque place dans l'écran, les places d'ouest en est (${VALLEY_ORDER.map((slot) => slot.join(" face à ")).join(", ")}, ${SARLAT} au nord), chaque nom près de sa place et sur aucune autre, « ${trajet.relais.arrivee} » et son épingle dans l'écran`, async () => {
    await maps(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : au milieu de chacun des temps (?t=), ${Object.entries(CAST).map(([name, who]) => `${name} : ${who.join(", ")}`).join(" ; ")}, entièrement dans l'écran, et le panneau du départ entier quand il se montre`, async () => {
    await scenes(`${vp.width} × ${vp.height}`);
  });

  if (vp.width === 1920)
    await check(`1920 × 1080 (point 5) : à ?t= ${String(BRIDGE_PASSING).replace(".", ",")}, dans la descente, le pont de Vitrac peint devant le canoë et les arbres qui penchent peints devant le pont (au premier plan), tous à l'écran`, async () => {
      const layers = await heldAt(BRIDGE_PASSING, descentOrder);
      const order = ["descente-gens", "descente-pont", "descente-arbres"].map((name) => layers.findIndex((l) => l.name === name));
      const wrong = order.some((k, i) => k < 0 || !layers[k].shows || layers[k].z !== "auto" || (i && k < order[i - 1]));
      if (wrong) throw new Error(`l'ordre des couches de la descente ${JSON.stringify(layers)}`);
    });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la carte en deux étapes et chacun des temps comme sur les autres écrans, puis l'affiche jouée en entier, son lettrage dans l'écran ; puis le passeport", async () => {
      await page.resize(852, 393);
      try {
        await maps("852 × 393");
        await scenes("852 × 393");
        await poster("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp.turned)
    await check("point 3 : le téléphone tourné pendant les ronds dans l'eau (portrait → paysage vers 8 s, puis 1 s plus tard → portrait) : la même intro, sa timeline avance tout du long (au moins 0,7 fois l'horloge entre les deux arrêts), et à chaque arrêt le canoë et les bulles qui se montrent, entièrement dans l'écran", async () => {
      const [rounds, descent] = [beat["Les ronds dans l'eau"], beat["La descente"]];
      await page.goto(`${BASE}?demo&t=${rounds.at + 0.8}#/aventures/canoe`);
      await page.waitFor(playing, 8000); // turned at once
      await page.eval(`void (window.__intro = document.querySelector(".screen-intro"))`);
      /** At a stop on a width × height screen, read on a frame after the resize (its stage refitted): the intro still the
       *  same, still in the spin, the canoe and the bubbles that show entirely on screen. → its timeline's time and the
       *  clock's. */
      const stop = async (width, height) => {
        await page.resize(width, height);
        await page.waitFor(`innerWidth === ${width}`, 2000);
        const now = await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          same: window.__intro === document.querySelector(".screen-intro"), t: ${timeline}?.time(), clock: performance.now() / 1000, seen: ${castBoxes},
        }))))`);
        if (!now.same) throw new Error(`${width} × ${height} : l'intro a changé`);
        if (!(now.t >= rounds.at && now.t < descent.at)) throw new Error(`${width} × ${height} : arrêt à ${now.t?.toFixed(2)} s, pas pendant les ronds dans l'eau`);
        const who = now.seen.actors.map((b) => b.what);
        if (who.filter((w) => w === "duo").length !== 1 || who.some((w) => !CAST["Les ronds dans l'eau"].includes(w))) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : à l'écran ${JSON.stringify(who)}`);
        const off = outside(now.seen.screen, [...now.seen.actors, ...now.seen.signs]);
        if (off.length) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
        return now;
      };
      try {
        const turned = Date.now();
        const sideways = await stop(852, 393);
        await sleep(Math.max(0, 1000 - (Date.now() - turned)));
        const back = await stop(vp.width, vp.height);
        // never restarted nor held: the timeline keeps the clock's time
        const [played, spent] = [back.t - sideways.t, back.clock - sideways.clock];
        if (played < 0.7 * spent) throw new Error(`la timeline a avancé de ${played.toFixed(2)} s en ${spent.toFixed(2)} s (${sideways.t.toFixed(2)} s puis ${back.t.toFixed(2)} s)`);
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp === VIEWPORTS[0]) {
    await check(`point 2 : à ?demo&t= ${SPIN.join(", ").replaceAll(".", ",")} (au milieu des demi-tours du canoë, puis reparti), le canoë montre exactement une vue ; à ${String(OFF_AGAIN).replace(".", ",")} s, sa boîte turn a un scaleX de 1 ou de −1 (à 0,01 près) ; et de 0,1 en 0,1 s, en avant puis en arrière, de la mise à l'eau à la descente : jamais deux vues ni aucune pendant les ronds dans l'eau, et le panneau du départ jamais coupé par le bord`, async () => {
      for (const t of SPIN) {
        const now = await heldAt(t, canoeSeen);
        if (now.looks !== 1) throw new Error(`à ${t} s : ${now.looks} vue(s) du canoë`);
        if (t === OFF_AGAIN && !(Math.abs(Math.abs(now.scaleX) - 1) <= 0.01)) throw new Error(`à ${t} s : scaleX ${now.scaleX}, pas ±1`);
      }
      const [launch, rounds, descent] = ["La mise à l'eau", "Les ronds dans l'eau", "La descente"].map((name) => beat[name].at);
      const times = Array.from({ length: Math.round((descent - launch) / 0.1) - 1 }, (_, k) => +(launch + 0.1 + k * 0.1).toFixed(2));
      for (const t of [...times, ...[...times].reverse()]) {
        await page.eval(holdAt(t));
        const now = await page.eval(canoeSeen);
        if (t >= rounds && now.looks !== 1) throw new Error(`à ${t} s (cherché depuis la page de ${OFF_AGAIN} s) : ${now.looks} vue(s) du canoë`);
        const cut = outside(now.screen, now.signs);
        if (cut.length) throw new Error(`à ${t} s : le panneau coupé par le bord ${JSON.stringify(cut.map(round))}`);
      }
    });

    await check(`les stickers demandés sous /assets/aventures/ : exactement ceux de canoe.stickers.js (${stickers.length}), aucun d'une autre sortie`, async () => {
      await page.goto(CANOE);
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`[...new Set(performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname).filter((p) => p.startsWith("/assets/aventures/") && p.endsWith(".webp")).map((p) => p.slice("/assets/aventures/".length, -".webp".length)))].sort()`);
      if (!stickers.length || JSON.stringify(asked) !== JSON.stringify([...stickers].sort())) throw new Error(`demandés ${JSON.stringify(asked)}, attendus ${JSON.stringify([...stickers].sort())}`);
    });

    await check(`un sticker de scène bloqué (${SCENE}) : il passe sur son remplaçant assets/cyrielle/joy.webp, et l'intro se termine ; aucune autre erreur que celle du fichier bloqué`, async () => {
      const before = page.errors.length;
      await page.block([`*/${SCENE}.webp`]);
      try {
        await page.goto(CANOE);
        // the blocked sticker's look, before and after it goes to its stand-in (the other scenes of the two of them share it)
        const looks = `[...document.querySelectorAll(".st-actor__img")].filter((img) => img.dataset.fallback === "assets/cyrielle/joy.webp" && (img.dataset.fell || img.src.endsWith("/${SCENE}.webp")))`;
        await page.waitFor(`${loaded} && ${looks}.length > 0 && ${looks}.every((img) => img.naturalWidth > 0)`, 8000);
        const now = await page.eval(`${looks}.map((img) => new URL(img.src).pathname)`);
        if (!now.length || now.some((src) => src !== "/assets/cyrielle/joy.webp")) throw new Error(`le canoë devant la falaise : ${JSON.stringify(now)}`);
        await page.waitFor(atPassport, Number(await page.eval(length)) + 5000);
      } finally {
        await page.block([]);
      }
      const errors = page.errors.slice(before);
      if (errors.some((e) => !e.includes(`${SCENE.split("/")[1]}.webp`))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
    }, { allowErrors: true });

    await check("point 1 : le passeport posé, le Premier bivouac tamponné (le canoë à vivre) : le fichier intros/canoe.js est déjà demandé, une fois le livre arrivé ; le toucher sur le Premier canoë ne le redemande pas", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(BIVOUAC_STAMPED))}#/aventures`);
      await page.waitFor(`window.__landedAt`, 8000);
      await page.waitFor(`${scenarioAsked}.length === 1`, 3000).catch(async () => {
        throw new Error(`demandé ${await page.eval(`${scenarioAsked}.length`)} fois, le passeport posé`);
      });
      const after = await page.eval(`${scenarioAsked}[0].startTime - window.__landedAt`);
      if (after < -20) throw new Error(`demandé ${Math.round(-after)} ms avant que le livre soit posé`); // a frame's leeway
      await page.waitFor(`${settled(1)} && document.querySelector('.pp-slot[data-id="canoe"][data-status="open"]')`, 8000);
      await page.tap('.pp-slot[data-id="canoe"]');
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`${scenarioAsked}.length`);
      await page.goto("about:blank");
      if (asked !== 1) throw new Error(`redemandé au toucher : ${asked} demandes`);
    });

    await check("la première fois (Premier bivouac tamponné, le canoë à vivre, hors démo) : un toucher au milieu ne passe pas l'intro ; puis le retour du navigateur vers 10 s : le passeport, sans erreur, aucune scène restée, et le canoë n'est pas marqué vu", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(BIVOUAC_STAMPED))}#/aventures`);
      await page.waitFor(`${settled(1)} && document.querySelector('.pp-slot[data-id="canoe"][data-status="open"]')`, 8000);
      await page.tap('.pp-slot[data-id="canoe"]');
      await page.waitFor(`location.hash === "#/aventures/canoe" && ${playing}`, 8000);
      if ((await page.eval(`document.querySelector(".screen-intro").dataset.skippable`)) !== "false") throw new Error("passable la première fois");
      await page.waitFor(`${timeline}.time() > 6`, 9000);
      const touched = await page.eval(`${timeline}.time()`);
      await page.tap(".screen-intro");
      // still there and playing on, a second of its timeline later (by its own clock: a slow frame only delays it)
      await page.waitFor(`location.hash !== "#/aventures/canoe" || ${timeline}?.time() > ${touched + 1}`, 6000).catch(() => {});
      const later = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro .st-stage")), t: ${timeline}?.time(), paused: ${timeline}?.paused() })`);
      if (later.hash !== "#/aventures/canoe" || !later.intro || later.paused || !(later.t > touched + 1)) throw new Error(`après le toucher à ${touched.toFixed(2)} s : ${JSON.stringify(later)}`);
      await page.waitFor(`${timeline}.time() > 10`, 10000);
      await page.eval(`history.back()`);
      await page.waitFor(atPassport, 4000);
      await sleep(1500); // what the intro would have left behind
      const now = await page.eval(`({ hash: location.hash, stages: document.querySelectorAll(".st-stage").length, intro: Boolean(document.querySelector(".screen-intro")),
        slot: document.querySelector('.pp-slot[data-id="canoe"]')?.dataset.status, save: JSON.parse(localStorage.getItem("${KEY}")) })`);
      if (now.hash !== "#/aventures" || now.stages || now.intro || now.slot !== "open") throw new Error(JSON.stringify({ ...now, save: undefined }));
      if (now.save?.pending?.includes("canoe") || now.save?.stamped?.includes("canoe")) throw new Error(`enregistré : ${JSON.stringify(now.save)}`);
      await page.goto("about:blank");
    });

    await check("?demo (tamponné) : « Passer ▸ » au début de « La descente » la termine, sa timeline s'arrête au toucher, et ramène au passeport", async () => {
      const { at } = beatsOf("canoe")["La descente"];
      await page.goto(`${BASE}?demo&t=${at}#/aventures/canoe`);
      await page.waitFor(`${playing} && ${skipIs("shown")}`, 8000);
      await page.eval(`(() => {
        const tl = ${timeline};
        document.addEventListener("click", () => {
          window.__skipped = { paused: tl.paused(), t: tl.time() };
          setTimeout(() => (window.__later = tl.time()), 250);
        }, { once: true });
      })()`);
      await page.tap(".intro-skip");
      await page.waitFor(`window.__later !== undefined`, 2000);
      const now = await page.eval(`({ ...window.__skipped, later: window.__later })`);
      if (!now.paused || now.later !== now.t) throw new Error(`la timeline continue après le toucher : ${JSON.stringify(now)}`);
      await page.waitFor(atPassport, 3000);
    });
  }
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await page.beforeLoad(SEED);
  await page.beforeLoad(REJECT);
  await page.beforeLoad(LANDING);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
