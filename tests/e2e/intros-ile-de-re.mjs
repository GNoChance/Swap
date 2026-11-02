// End-to-end checks of the Île de Ré's intro (js/aventures/intros/ile-de-re.js), in headless Chrome, on the kit's
// screens (intro-kit.mjs) and the first phone turned sideways: its length and its closing poster « ÎLE DE RÉ », its map
// going north (the C3 from Bordeaux by Saintes and La Rochelle to the pin at the foot of the bridge, La Pallice), the
// two of them on their bikes at the bridge's foot, crossing it as the camera follows them, then across the island as
// the decor glides by (one view at a time, the speed lines with the flat-out views only, no C3, the km signs whole, the
// phone turned meanwhile), who shows in its moments, its decor over a wide screen, the stickers it loads and a scene
// sticker's stand-in, its scenario warmed on the passport, a touch the first time, « Passer ▸ » in the demo, the
// browser's back. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then
// `node tests/e2e/intros-ile-de-re.mjs` (ONLY=1920: a single screen; SHOTS=<folder> keeps a screenshot of the middle of
// each moment on each screen, of the map at 2, 3.9 and 4.4 s, of the bridge at 5, 6, 7, 8 and 9.2 s, of the island at
// 9.6, 10.5, 12, 13.5 and 14.8 s and of the finished poster). Stops at the first failure (exit code 1). A check also
// fails if the page logged an error.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { atPassport, beatsOf, holdAt, inside, KEY, LANDING, length, loaded, outside, playing, REJECT, round, sceneBoxes, SEED, settled, skipIs, sleep, timeline, VIEWPORTS } from "./intro-kit.mjs";
import { content } from "../../js/content.js";
import { AVENTURES } from "../../js/aventures/data.js";
import { pageOf } from "../../js/aventures/logic.js";
import { SCENARIOS } from "../../js/aventures/intros/index.js";

// read here rather than imported: without its scenario, the suite still runs and says what fails
const { stickers } = await import("../../js/aventures/intros/ile-de-re.stickers.js").catch(() => ({ stickers: [] }));
const SHOTS = process.env.SHOTS;
const BASE = process.env.BASE || "http://localhost:5173/";
const ID = "ile-de-re";
const ILE = `${BASE}?demo#/aventures/${ID}`;
const TITLE = "ÎLE DE RÉ";
const LINE = "Île de Ré · 17–18 août 2025";
const LENGTH = { min: 30000, max: 32000 }; // ms, the Île de Ré's intro (spec § 2)
const ile = AVENTURES.find((a) => a.id === ID);
const { trajet } = ile;
const PIN_NAME = ile.lieu; // the pin's name (the trip has no arrivee), at the foot of the bridge
const MAP_NAMES = [trajet.depart, ...trajet.etapes, PIN_NAME]; // written on the map, from the data
const MAP_TIMES = [0.3, 2, 3.9, 4.4]; // s: the C3 on the map, the last just before the dive
const PIN_AT = 3.9; // s: from then on, the pin plopped at the bridge's head, La Pallice
const ROCHELLE = "La Rochelle"; // its name, next to the pin's: their boxes never cross
// s: the end of the map, the C3 parked at the pin: its middle within that share of its width from the pin's tip (2/3:
// 40 units for the C3's 60)
const PARKED = { at: 4.4, near: 2 / 3 };
// a save whose welcome is seen, the Premier bivouac and the Premier canoë stamped: the Île de Ré to live, the first time
const CANOE_STAMPED = { welcomed: true, known: AVENTURES.map((a) => a.id), stamped: ["bivouac-1", "canoe"] };
const SCENE = "ile-de-re/scene-cycy-et-kevin-a-velo-01"; // the two of them side by side on their bikes, over the bridge and on the poster
const beat = SCENARIOS[ID] ? beatsOf(ID) : {};
// who shows in the middle of a moment (spec § 2), entirely on screen: the two of them on their bikes in a scene sticker
// (« duo ») at the bridge's foot, over the bridge, across the island, and on the poster; the moments in between come
// with their own scenes (tasks 5 and 6)
const CAST = { "En selle": ["duo"], "Le pont": ["duo"], "La traversée": ["duo"], "L'affiche": ["duo"] };
const CROSSING = [7, 8, 9.2]; // s: the two of them on the bridge, the camera following them
const FOLLOWED = [...CROSSING, 9.45]; // s: and the follow's end, its layers furthest
const GLIDING = [10, 12.5, 14.8]; // s: across the island, the decor gliding by, the last once it has stopped
// s: from « En selle » to « Le phare », the bikes on the bridge and across the island (Review Focus 2): no C3, a single
// view of the bikes
const BIKES = { from: 4.5, to: 15 };
// the flat-out views (their numbers on the bike board): the speed lines show with them only, and with them most of the
// time
const FLAT_OUT = ["05", "06"];
const KM = content.aventures.intros.ileDeRe?.bornes ?? []; // the km signs' words, counting down to the lighthouse
const DIVE_OVER = 5; // s: the map, its C3 on it, gone under the bridge by then (recipes.plonge)
const RENTAL = "En selle"; // in its middle, the bike rental's sign at the bridge's foot whole on screen
const RENTAL_SIGN = content.aventures.intros.ileDeRe?.location; // its words

// an element shows: visible, and not see-through up its tree
const SHOWS = `(el) => {
  if (getComputedStyle(el).visibility !== "visible") return false;
  for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
  return true;
}`;
// what shows on the map: the actors as the kit sees them, the names and the pin that show, with the screen's size
const onMap = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const seen = (selector, what) => [...document.querySelectorAll(selector)].filter(${SHOWS}).map((el) => box(el, what ?? el.textContent));
  return { ...${sceneBoxes}, names: seen(".st-name"), pins: seen(".st-pin", "épingle") };
})()`;
// the stage's layers that show, with their boxes (px)
const layersSeen = `[...document.querySelectorAll(".st-layer")].filter(${SHOWS}).map((el) => { const r = el.getBoundingClientRect(); return { name: el.dataset.layer, left: r.left, right: r.right }; })`;
// the bikes' looks that show (one at a time: never two views, never none), the number of the one shown on the bike
// board, its turn box squeezed (turning over), the speed lines that show, the tilt of the actor wearing them (degrees),
// and each C3 that shows with its layer
const bikesSeen = `(() => {
  const shows = ${SHOWS};
  const looks = [...document.querySelectorAll('[data-who="duo"] .st-actor__img')].filter(shows);
  const matrix = (el) => { const t = el && getComputedStyle(el).transform; return t && t !== "none" ? new DOMMatrix(t) : null; };
  const m = looks[0] && matrix(looks[0].closest(".st-actor"));
  const turn = looks[0] && matrix(looks[0].closest(".st-actor__turn"));
  return {
    looks: looks.length,
    view: looks[0]?.src.match(/-a-velo-(\\d+)\\.webp$/)?.[1] ?? null,
    turning: Boolean(turn && Math.abs(turn.a) < 0.999),
    lines: [...document.querySelectorAll('[data-who="duo"] .st-traits')].filter(shows).length,
    tilt: m ? (Math.atan2(m.b, m.a) * 180) / Math.PI : 0,
    c3: [...document.querySelectorAll('[data-vehicle="c3"]')].filter((el) => [...el.querySelectorAll(".st-actor__img")].some(shows)).map((el) => el.closest(".st-layer")?.dataset.layer),
  };
})()`;
// the km signs that show (each its words and its box), with the screen's size
const kmSeen = `({
  screen: { width: innerWidth, height: innerHeight },
  signs: [...document.querySelectorAll(".st-borne")].filter(${SHOWS}).map((el) => { const r = el.getBoundingClientRect(); return { what: el.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }),
})`;
// the rental's signs that show (each its board and its words), with the screen's size
const signsSeen = `({
  screen: { width: innerWidth, height: innerHeight },
  signs: [...document.querySelectorAll(".st-enseigne")].filter(${SHOWS}).map((el) => { const r = el.getBoundingClientRect(); return { what: el.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }),
})`;
// the requests for the Île de Ré's scenario file
const scenarioAsked = `performance.getEntriesByType("resource").filter((e) => new URL(e.name).pathname === "/js/aventures/intros/${ID}.js")`;
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
/** How far apart two boxes are (px; 0 if they touch or overlap). */
const gap = (a, b) => Math.max(0, a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
const fr = (t) => String(t).replace(".", ",");

async function suite(page, vp) {
  const check = checker(page);

  /** The intro held still at exactly `t` s (?demo&t=, then sought back there once playing): what `expression` sees. */
  async function heldAt(t, expression) {
    await page.goto(`${BASE}?demo&t=${t}#/aventures/${ID}`);
    await page.waitFor(playing, 8000);
    await sleep(250);
    await page.eval(holdAt(t));
    return page.eval(expression);
  }

  /** The intro played through, as long as it says (30 to 32 s) and not shorter: its poster says the lieu, then the
   *  stamp's name and dates, all of it on screen, its title out of the sound button's corner; then the passport. */
  async function poster(where) {
    await page.goto(ILE);
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
        if (location.hash !== "#/aventures/${ID}") (window.__ended = performance.now()), clearInterval(watch);
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

  /** The map, held at given moments: the C3 alone and in sight, the names of the data written, none cut by the screen's
   *  edge, none over another (the pin's « Île de Ré » clear of « La Rochelle ») nor under the C3; « Bordeaux » in the
   *  screen at the start, then « Saintes », « La Rochelle » and « Île de Ré »; the pin at La Pallice in the screen once it
   *  has plopped, clear of « La Rochelle » too; at the map's end, the C3 parked at the pin's tip. */
  async function maps(where) {
    const offScreen = (now, t, boxes, what) => {
      const off = outside(now.screen, boxes);
      if (off.length) throw new Error(`${where}, à ${t} s : ${what} hors de l'écran ${JSON.stringify(off.map((b) => b && round(b)))}`);
    };
    const named = (now, list) => list.map((name) => now.names.find((b) => b.what === name));
    for (const t of MAP_TIMES) {
      const now = await heldAt(t, onMap);
      const names = now.names.map((b) => b.what);
      if (JSON.stringify(names) !== JSON.stringify(MAP_NAMES)) throw new Error(`${where}, à ${t} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(MAP_NAMES)}`);
      if (now.actors.length !== 1 || now.actors[0].what !== "c3") throw new Error(`${where}, à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      offScreen(now, t, now.actors, "la C3");
      // names in view are whole: never cut by the screen's edge
      offScreen(now, t, now.names.filter((b) => b.right > 0 && b.left < now.screen.width && b.bottom > 0 && b.top < now.screen.height), "un nom coupé par le bord");
      offScreen(now, t, named(now, t === MAP_TIMES[0] ? [trajet.depart] : [...trajet.etapes, PIN_NAME]), "un nom de la carte");
      const crossed = now.names.flatMap((a, k) => now.names.slice(k + 1).filter((b) => gap(a, b) === 0).map((b) => [a, b]));
      if (crossed.length) throw new Error(`${where}, à ${t} s : des noms l'un sur l'autre ${JSON.stringify(crossed.map((pair) => pair.map(round)))}`);
      if (t >= PIN_AT) {
        if (now.pins.length !== 1) throw new Error(`${where}, à ${t} s : ${now.pins.length} épingle(s)`);
        offScreen(now, t, now.pins, "l'épingle");
        const rochelle = now.names.find((b) => b.what === ROCHELLE);
        if (gap(now.pins[0], rochelle) === 0) throw new Error(`${where}, à ${t} s : l'épingle sur « ${ROCHELLE} » ${JSON.stringify([now.pins[0], rochelle].map(round))}`);
      }
      if (t >= PARKED.at) {
        // the pin's tip: its box's middle, 38 of its 42 units down (props-carte.js, PIN)
        const [pin, car] = [now.pins[0], now.actors[0]];
        const tip = { x: (pin.left + pin.right) / 2, y: pin.top + ((pin.bottom - pin.top) * 38) / 42 };
        const far = Math.hypot((car.left + car.right) / 2 - tip.x, (car.top + car.bottom) / 2 - tip.y) / (car.right - car.left);
        if (!(far <= PARKED.near)) throw new Error(`${where}, à ${t} s : la C3 garée à ${far.toFixed(2)} de sa largeur de la pointe de l'épingle, pas à ${PARKED.near.toFixed(2)} au plus ${JSON.stringify([car, pin].map(round))}`);
      }
      const under = now.names.filter((b) => gap(b, now.actors[0]) === 0);
      if (under.length) throw new Error(`${where}, à ${t} s : ${JSON.stringify(under.map((b) => b.what))} sous la C3 ${JSON.stringify([...under, now.actors[0]].map(round))}`);
    }
  }

  /** In the middle of each moment of CAST, held there: exactly those it shows, each entirely on screen; in the middle of
   *  « En selle », the rental's sign whole on screen, its words from content.js; on the bridge, as the camera follows
   *  them, the two of them on their bikes alone and entirely on screen. */
  async function scenes(where) {
    for (const [name, needs] of Object.entries(CAST)) {
      const t = beat[name]?.mid;
      if (t === undefined) throw new Error(`pas de temps « ${name} »`);
      const now = await heldAt(t, sceneBoxes);
      const who = now.actors.map((b) => b.what).sort();
      if (JSON.stringify(who) !== JSON.stringify([...needs].sort())) throw new Error(`${where}, « ${name} » à ${t} s : à l'écran ${JSON.stringify(who)}`);
      const off = outside(now.screen, now.actors);
      if (off.length) throw new Error(`${where}, « ${name} » à ${t} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
      if (name !== RENTAL) continue;
      const { screen, signs } = await page.eval(signsSeen);
      if (!RENTAL_SIGN || signs.length !== 1 || signs[0].what !== RENTAL_SIGN) throw new Error(`${where}, « ${name} » à ${t} s : le panneau de la location ${JSON.stringify(signs.map((b) => b.what))}, pas « ${RENTAL_SIGN} »`);
      const cut = outside(screen, signs);
      if (cut.length) throw new Error(`${where}, « ${name} » à ${t} s : le panneau de la location coupé par le bord ${JSON.stringify(cut.map(round))}`);
    }
    for (const t of CROSSING) {
      const now = await heldAt(t, sceneBoxes);
      if (now.actors.length !== 1 || now.actors[0].what !== "duo") throw new Error(`${where}, sur le pont à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      const off = outside(now.screen, now.actors);
      if (off.length) throw new Error(`${where}, sur le pont à ${t} s : les vélos hors de l'écran ${JSON.stringify(off.map(round))}`);
    }
    await kmSigns(where);
  }

  /** Across the island, from its start, sought on every 0.1 s to « Le phare »: each km sign that shows is whole on
   *  screen, its words from content.js; and each of them shows on the way. */
  async function kmSigns(where) {
    const [from, to] = [beat["La traversée"]?.at, beat["Le phare"]?.at];
    if (from === undefined || to === undefined) throw new Error("pas de temps « La traversée » ou « Le phare »");
    if (KM.length < 2) throw new Error(`les panneaux kilométriques : ${JSON.stringify(KM)} dans content.js`);
    await page.goto(`${BASE}?demo&t=${from}#/aventures/${ID}`);
    await page.waitFor(playing, 8000);
    const seen = new Set();
    for (let k = 1; from + k * 0.1 < to - 0.05; k++) {
      const t = +(from + k * 0.1).toFixed(2);
      await page.eval(holdAt(t));
      const { screen, signs } = await page.eval(kmSeen);
      const odd = signs.filter((b) => !KM.includes(b.what));
      if (odd.length) throw new Error(`${where}, à ${t} s : un panneau ${JSON.stringify(odd.map((b) => b.what))}, pas l'un de ${JSON.stringify(KM)}`);
      const cut = outside(screen, signs);
      if (cut.length) throw new Error(`${where}, à ${t} s : un panneau kilométrique coupé par le bord ${JSON.stringify(cut.map(round))}`);
      signs.forEach((b) => seen.add(b.what));
    }
    const missed = KM.filter((what) => !seen.has(what));
    if (missed.length) throw new Error(`${where} : jamais montré(s) pendant la traversée ${JSON.stringify(missed)}`);
  }

  await check(`?demo#/aventures/${ID} : data-length entre ${LENGTH.min} et ${LENGTH.max} ms, l'intro jouée en entier (pas moins de data-length − 300 ms), puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= ${MAP_TIMES.map(fr).join(", ")}), la C3 seule et dans l'écran, « ${MAP_NAMES.join(" », « ")} » écrits, jamais coupés par le bord, l'un sur l'autre (« ${PIN_NAME} » hors de « ${ROCHELLE} ») ni sous la C3 ; « ${trajet.depart} » dans l'écran au départ, puis « ${[...trajet.etapes, PIN_NAME].join(" », « ")} » ; l'épingle dans l'écran à ${fr(PIN_AT)} s, hors de « ${ROCHELLE} » ; à ${fr(PARKED.at)} s, la C3 garée à la pointe de l'épingle (son milieu à ${Math.round(PARKED.near * 100)} % de sa largeur au plus)`, async () => {
    await maps(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : au milieu de chacun des temps (?t=), ${Object.entries(CAST).map(([name, who]) => `${name} : ${who.join(", ")}`).join(" ; ")}, entièrement dans l'écran ; au milieu de « ${RENTAL} », le panneau « ${RENTAL_SIGN} » de la location entier dans l'écran ; sur le pont à ${CROSSING.map(fr).join(", ")} s, vous deux à vélo seuls et entièrement dans l'écran ; pendant la traversée (de 0,1 en 0,1 s), chaque panneau kilométrique entier dans l'écran quand il se montre, et chacun (« ${KM.join(" », « ")} ») montré`, async () => {
    await scenes(`${vp.width} × ${vp.height}`);
  });

  if (vp.width === 1920)
    await check(`1920 × 1080 (point 5) : sur le pont, à ?t= ${FOLLOWED.map(fr).join(", ")} (la caméra vous suit, jusqu'au bout de sa course), puis pendant la traversée, à ?t= ${GLIDING.map(fr).join(", ")} (le décor défile, jusqu'au bout de sa course), chaque couche visible couvre toute la largeur de l'écran`, async () => {
      for (const [scene, times] of [["pont-", FOLLOWED], ["traversee-", GLIDING]])
        for (const t of times) {
          const layers = await heldAt(t, layersSeen);
          if (!layers.some((l) => l.name.startsWith(scene))) throw new Error(`à ${t} s : aucune couche « ${scene}* » à l'écran ${JSON.stringify(layers.map((l) => l.name))}`);
          const bare = layers.filter((l) => l.left > 0.5 || l.right < vp.width - 0.5);
          if (bare.length) throw new Error(`à ${t} s : bord vide ${JSON.stringify(bare.map((l) => ({ ...l, left: Math.round(l.left), right: Math.round(l.right) })))}`);
        }
    });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la carte et les temps comme sur les autres écrans, puis l'affiche jouée en entier, son lettrage dans l'écran ; puis le passeport", async () => {
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
    await check("point 3 : le téléphone tourné pendant la traversée (portrait → paysage vers 10,5 s, puis 1 s plus tard → portrait) : la même intro, sa timeline avance tout du long (au moins 0,7 fois l'horloge entre les deux arrêts), et à chaque arrêt vous deux à vélo, seuls et entièrement dans l'écran", async () => {
      const [from, to] = [beat["La traversée"].at, beat["Le phare"].at];
      await page.goto(`${BASE}?demo&t=${from + 1}#/aventures/${ID}`);
      await page.waitFor(playing, 8000); // turned at once
      await page.eval(`void (window.__intro = document.querySelector(".screen-intro"))`);
      /** At a stop on a width × height screen, read on a frame after the resize (its stage refitted): the intro still the
       *  same, still across the island, the two of them on their bikes alone and entirely on screen. → its timeline's
       *  time and the clock's. */
      const stop = async (width, height) => {
        await page.resize(width, height);
        await page.waitFor(`innerWidth === ${width}`, 2000);
        const now = await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          same: window.__intro === document.querySelector(".screen-intro"), t: ${timeline}?.time(), clock: performance.now() / 1000, seen: ${sceneBoxes},
        }))))`);
        if (!now.same) throw new Error(`${width} × ${height} : l'intro a changé`);
        if (!(now.t >= from && now.t < to)) throw new Error(`${width} × ${height} : arrêt à ${now.t?.toFixed(2)} s, pas pendant la traversée`);
        const who = now.seen.actors.map((b) => b.what);
        if (JSON.stringify(who) !== JSON.stringify(["duo"])) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : à l'écran ${JSON.stringify(who)}`);
        const off = outside(now.seen.screen, now.seen.actors);
        if (off.length) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : les vélos hors de l'écran ${JSON.stringify(off.map(round))}`);
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

  if (SHOTS) {
    // the middle of each moment, held still, on this screen (and the phone turned), plus the map, the bridge, the island
    // and the finished poster; the demo banner hidden
    const bridge = [5, 6, 7, 8, 9.2].map((t) => [t, `00-pont-${String(t).replace(".", "-")}s`]);
    const island = [9.6, 10.5, 12, 13.5, 14.8].map((t) => [t, `00-traversee-${String(t).replace(".", "-")}s`]);
    const stops = [...Object.entries(beat).map(([name, { mid }], k) => [mid, `${String(k + 1).padStart(2, "0")}-${name.replace(/[^a-z]+/gi, "-").toLowerCase()}`]), [2, "00-carte-2s"], [3.9, "00-carte-3-9s"], [PARKED.at, "00-carte-4-4s"], ...bridge, ...island, [30.5, "11-affiche-30-5s"]];
    for (const [width, height] of vp.turned ? [[vp.width, vp.height], [852, 393]] : [[vp.width, vp.height]]) {
      await page.resize(width, height);
      try {
        for (const [t, file] of stops) {
          await page.goto(`${BASE}?demo&t=${t}#/aventures/${ID}`);
          await page.waitFor(`innerWidth === ${width} && ${playing}`, 8000);
          await sleep(250);
          await page.eval(holdAt(t));
          await page.eval(`document.querySelectorAll(".demo-badge").forEach((el) => (el.style.display = "none"))`);
          await page.screenshot(join(SHOTS, `${file}-${width}x${height}.png`));
        }
      } finally {
        await page.resize(vp.width, vp.height);
      }
    }
  }

  if (vp === VIEWPORTS[0]) {
    const selle = beat["En selle"]?.mid;
    await check(`point 2 et la C3 : de ${fr(BIKES.from)} à ${fr(BIKES.to)} s (« En selle », « Le pont » et « La traversée »), aucune C3 (toutes les 0,25 s ; seule celle de la carte s'efface avant ${DIVE_OVER} s, pendant la plongée) ; et de 0,1 en 0,1 s, en avant puis en arrière, les vélos montrent exactement une vue, les traits de vitesse ne se montrent qu'avec les vues à fond (${FLAT_OUT.join(", ")}) ou en se retournant, avec chacune d'elles la plupart du temps, et plus à la fin ; au milieu d'« En selle » (${fr(selle)} s), ils penchent pareil qu'on y arrive en avançant ou en reculant`, async () => {
      // the middle of « En selle » reached forward: the page started before it, paused before it, then sought on to it
      await page.goto(`${BASE}?demo&t=${BIKES.from}#/aventures/${ID}`);
      await page.waitFor(playing, 8000);
      const before = await page.eval(`${timeline}.pause().time()`);
      if (!(before < selle)) throw new Error(`la page a joué jusqu'à ${before.toFixed(2)} s : pas d'arrivée en avançant à ${selle} s`);
      await page.eval(holdAt(selle));
      const { tilt: forward } = await page.eval(bikesSeen);
      const quarters = Array.from({ length: Math.round((BIKES.to - BIKES.from) / 0.25) + 1 }, (_, k) => BIKES.from + k * 0.25);
      for (const t of quarters) {
        const now = await heldAt(t, bikesSeen);
        const c3 = now.c3.filter((layer) => !(t < DIVE_OVER && layer === "carte-trajet"));
        if (c3.length) throw new Error(`à ${t} s : une C3 à l'écran (${JSON.stringify(now.c3)})`);
      }
      const times = Array.from({ length: Math.round((BIKES.to - BIKES.from) / 0.1) - 1 }, (_, k) => +(BIKES.from + 0.1 + k * 0.1).toFixed(2));
      // for each pass, each flat-out view: [times worn (not turning over), times its speed lines showed]
      const lined = [{}, {}];
      for (const [k, t] of [...times, ...[...times].reverse()].entries()) {
        await page.eval(holdAt(t));
        const now = await page.eval(bikesSeen);
        const back = k >= times.length; // the second pass: each time reached from a later one
        const how = back ? "en reculant" : "en avançant";
        if (now.looks !== 1) throw new Error(`à ${t} s (cherché depuis la page de ${BIKES.to} s) : ${now.looks} vue(s) des vélos`);
        if (back && t === selle && !(Math.abs(now.tilt - forward) < 0.05)) throw new Error(`à ${t} s : penchés de ${forward?.toFixed(2)}° en avançant, de ${now.tilt.toFixed(2)}° en reculant`);
        const flatOut = FLAT_OUT.includes(now.view);
        if (now.lines && !flatOut && !now.turning) throw new Error(`à ${t} s ${how} : des traits de vitesse avec la vue ${now.view}`);
        if (flatOut && !now.turning) {
          const tally = (lined[Number(back)][now.view] ??= [0, 0]);
          tally[0] += 1;
          tally[1] += now.lines ? 1 : 0;
        }
        if (t === times.at(-1) && now.lines) throw new Error(`à ${t} s ${how} : encore des traits de vitesse à la fin`);
      }
      lined.forEach((pass, back) =>
        FLAT_OUT.forEach((view) => {
          const [worn, shown] = pass[view] ?? [0, 0];
          if (!worn || shown < worn / 2) throw new Error(`${back ? "en reculant" : "en avançant"} : la vue ${view} portée ${worn} fois, ses traits de vitesse montrés ${shown} fois`);
        }),
      );
    });

    await check(`les stickers demandés sous /assets/aventures/ : exactement ceux de ${ID}.stickers.js (${stickers.length}), aucun d'une autre sortie`, async () => {
      await page.goto(ILE);
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`[...new Set(performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname).filter((p) => p.startsWith("/assets/aventures/") && p.endsWith(".webp")).map((p) => p.slice("/assets/aventures/".length, -".webp".length)))].sort()`);
      if (!stickers.length || JSON.stringify(asked) !== JSON.stringify([...stickers].sort())) throw new Error(`demandés ${JSON.stringify(asked)}, attendus ${JSON.stringify([...stickers].sort())}`);
    });

    await check(`un sticker de scène bloqué (${SCENE}, celui du pont et de l'affiche) : il passe sur son remplaçant assets/cyrielle/joy.webp, et l'intro se termine ; aucune autre erreur que celle du fichier bloqué`, async () => {
      const before = page.errors.length;
      await page.block([`*/${SCENE}.webp`]);
      try {
        await page.goto(ILE);
        // the blocked sticker's look, before and after it goes to its stand-in
        const looks = `[...document.querySelectorAll(".st-actor__img")].filter((img) => img.dataset.fallback === "assets/cyrielle/joy.webp" && (img.dataset.fell || img.src.endsWith("/${SCENE}.webp")))`;
        await page.waitFor(`${loaded} && ${looks}.length > 0 && ${looks}.every((img) => img.naturalWidth > 0)`, 8000);
        const now = await page.eval(`${looks}.map((img) => new URL(img.src).pathname)`);
        if (!now.length || now.some((src) => src !== "/assets/cyrielle/joy.webp")) throw new Error(`les vélos du pont et de l'affiche : ${JSON.stringify(now)}`);
        await page.waitFor(atPassport, Number(await page.eval(length)) + 5000);
      } finally {
        await page.block([]);
      }
      const errors = page.errors.slice(before);
      if (errors.some((e) => !e.includes(`${SCENE.split("/")[1]}.webp`))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
    }, { allowErrors: true });

    await check("point 1 : le passeport posé, le Premier canoë tamponné (l'Île de Ré à vivre) : le fichier intros/ile-de-re.js est déjà demandé, une fois le livre arrivé, et ses stickers aussi ; une fois qu'ils sont arrivés, le toucher sur l'Île de Ré ne redemande pas le fichier et ne retélécharge aucun sticker", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(CANOE_STAMPED))}#/aventures`);
      await page.waitFor(`window.__landedAt`, 8000);
      await page.waitFor(`${scenarioAsked}.length === 1`, 3000).catch(async () => {
        throw new Error(`demandé ${await page.eval(`${scenarioAsked}.length`)} fois, le passeport posé`);
      });
      const after = await page.eval(`${scenarioAsked}[0].startTime - window.__landedAt`);
      if (after < -20) throw new Error(`demandé ${Math.round(-after)} ms avant que le livre soit posé`); // a frame's leeway
      await page.waitFor(`${settled(pageOf(AVENTURES, ID))} && document.querySelector('.pp-slot[data-id="${ID}"][data-status="open"]')`, 8000);
      // its stickers: all asked once the book landed, before any touch, each once (an entry is added once its
      // response has ended); then the touch downloads none again (the passport holds them: screen.js, warm())
      const paths = JSON.stringify(stickers.map((p) => `/assets/aventures/${p}.webp`));
      const mine = `performance.getEntriesByType("resource").filter((e) => ${paths}.includes(new URL(e.name).pathname))`;
      await page.waitFor(`${stickers.length} > 0 && ${paths}.every((p) => ${mine}.some((e) => new URL(e.name).pathname === p && e.responseEnd > 0))`, 8000).catch(async () => {
        throw new Error(`stickers arrivés avant le toucher : ${await page.eval(`${mine}.filter((e) => e.responseEnd > 0).length`)} sur ${stickers.length}`);
      });
      const early = await page.eval(`${mine}.length`);
      await page.tap(`.pp-slot[data-id="${ID}"]`);
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`${scenarioAsked}.length`);
      const late = await page.eval(`${mine}.slice(${early}).map((e) => e.transferSize)`); // an entry per image, but from the cache
      await page.goto("about:blank");
      if (asked !== 1) throw new Error(`redemandé au toucher : ${asked} demandes`);
      if (early !== stickers.length) throw new Error(`stickers demandés avant le toucher : ${early} demandes pour ${stickers.length}`);
      if (late.some((size) => size > 0)) throw new Error(`stickers retéléchargés au toucher : ${late.filter((size) => size > 0).length}`);
    });

    await check("la première fois (Premier canoë tamponné, l'Île de Ré à vivre, hors démo) : un toucher au milieu ne passe pas l'intro ; puis le retour du navigateur vers 10 s : le passeport, sans erreur, aucune scène restée, et l'Île de Ré n'est pas marquée vue", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(CANOE_STAMPED))}#/aventures`);
      await page.waitFor(`${settled(pageOf(AVENTURES, ID))} && document.querySelector('.pp-slot[data-id="${ID}"][data-status="open"]')`, 8000);
      await page.tap(`.pp-slot[data-id="${ID}"]`);
      await page.waitFor(`location.hash === "#/aventures/${ID}" && ${playing}`, 8000);
      if ((await page.eval(`document.querySelector(".screen-intro").dataset.skippable`)) !== "false") throw new Error("passable la première fois");
      await page.waitFor(`${timeline}.time() > 6`, 9000);
      const touched = await page.eval(`${timeline}.time()`);
      await page.tap(".screen-intro");
      // still there and playing on, a second of its timeline later (by its own clock: a slow frame only delays it)
      await page.waitFor(`location.hash !== "#/aventures/${ID}" || ${timeline}?.time() > ${touched + 1}`, 6000).catch(() => {});
      const later = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro .st-stage")), t: ${timeline}?.time(), paused: ${timeline}?.paused() })`);
      if (later.hash !== `#/aventures/${ID}` || !later.intro || later.paused || !(later.t > touched + 1)) throw new Error(`après le toucher à ${touched.toFixed(2)} s : ${JSON.stringify(later)}`);
      await page.waitFor(`${timeline}.time() > 10`, 10000);
      await page.eval(`history.back()`);
      await page.waitFor(atPassport, 4000);
      await sleep(1500); // what the intro would have left behind
      const now = await page.eval(`({ hash: location.hash, stages: document.querySelectorAll(".st-stage").length, intro: Boolean(document.querySelector(".screen-intro")),
        slot: document.querySelector('.pp-slot[data-id="${ID}"]')?.dataset.status, save: JSON.parse(localStorage.getItem("${KEY}")) })`);
      if (now.hash !== "#/aventures" || now.stages || now.intro || now.slot !== "open") throw new Error(JSON.stringify({ ...now, save: undefined }));
      if (now.save?.pending?.includes(ID) || now.save?.stamped?.includes(ID)) throw new Error(`enregistré : ${JSON.stringify(now.save)}`);
      await page.goto("about:blank");
    });

    await check(`?demo (tamponné) : « Passer ▸ » au début du pont la termine, sa timeline s'arrête au toucher, et ramène au passeport`, async () => {
      const { at } = beat["Le pont"] ?? { at: 4.5 };
      await page.goto(`${BASE}?demo&t=${at}#/aventures/${ID}`);
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

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
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
