// End-to-end checks of the Île de Ré's intro (js/aventures/intros/ile-de-re.js), in headless Chrome, on the kit's
// screens (intro-kit.mjs) and the first phone turned sideways: its length and its closing poster « ÎLE DE RÉ », its map
// going north (the C3 from Bordeaux by Saintes to La Rochelle, the dots over the bridge to the pin at Rivedoux), the C3
// crossing the bridge as the camera follows it, who shows in its moments, its decor over a wide screen, the stickers it
// loads and a scene sticker's stand-in, its scenario warmed on the passport, a touch the first time, « Passer ▸ » in the
// demo, the browser's back. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then
// `node tests/e2e/intros-ile-de-re.mjs` (ONLY=1920: a single screen; SHOTS=<folder> keeps a screenshot of the middle of
// each moment on each screen, of the map at 2 and 3.9 s and of the finished poster). Stops at the first failure (exit
// code 1). A check also fails if the page logged an error.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { atPassport, beatsOf, holdAt, inside, KEY, LANDING, length, loaded, outside, playing, REJECT, round, sceneBoxes, SEED, settled, skipIs, sleep, timeline, VIEWPORTS } from "./intro-kit.mjs";
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
const MAP_NAMES = [trajet.depart, ...trajet.etapes, ile.lieu]; // written on the map, from the data
const MAP_TIMES = [0.3, 2, 3.9]; // s: the C3 on the map
const PIN_AT = 3.9; // s: from then on, the pin plopped at Rivedoux
// a save whose welcome is seen, the Premier bivouac and the Premier canoë stamped: the Île de Ré to live, the first time
const CANOE_STAMPED = { welcomed: true, known: AVENTURES.map((a) => a.id), stamped: ["bivouac-1", "canoe"] };
const SCENE = "ile-de-re/scene-cycy-et-kevin-a-velo-01"; // the two of them side by side on their bikes, on the poster
const beat = SCENARIOS[ID] ? beatsOf(ID) : {};
// who shows in the middle of a moment (spec § 2), entirely on screen: the C3 on the bridge, the two of them on their
// bikes in a scene sticker (« duo ») on the poster; the moments in between come with their own scenes (tasks 4 to 6)
const CAST = { "Le pont": ["c3"], "L'affiche": ["duo"] };
const CROSSING = [5, 6, 7.2]; // s: the C3 on the bridge, the camera following it

// what shows on the map: the actors as the kit sees them, the names and the pin that show, with the screen's size
const onMap = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = (el) => {
    if (getComputedStyle(el).visibility !== "visible") return false;
    for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
    return true;
  };
  const seen = (selector, what) => [...document.querySelectorAll(selector)].filter(shows).map((el) => box(el, what ?? el.textContent));
  return { ...${sceneBoxes}, names: seen(".st-name"), pins: seen(".st-pin", "épingle") };
})()`;
// the stage's layers that show, with their boxes (px)
const layersSeen = `(() => {
  const shows = (el) => {
    if (getComputedStyle(el).visibility !== "visible") return false;
    for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
    return true;
  };
  return [...document.querySelectorAll(".st-layer")].filter(shows).map((el) => { const r = el.getBoundingClientRect(); return { name: el.dataset.layer, left: r.left, right: r.right }; });
})()`;
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
   *  edge nor under the C3; « Bordeaux » in the screen at the start, then « Saintes », « La Rochelle » and « Île de Ré »;
   *  the pin at Rivedoux in the screen once it has plopped. */
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
      offScreen(now, t, named(now, t === MAP_TIMES[0] ? [trajet.depart] : [...trajet.etapes, ile.lieu]), "un nom de la carte");
      if (t >= PIN_AT) {
        if (now.pins.length !== 1) throw new Error(`${where}, à ${t} s : ${now.pins.length} épingle(s)`);
        offScreen(now, t, now.pins, "l'épingle");
      }
      const under = now.names.filter((b) => gap(b, now.actors[0]) === 0);
      if (under.length) throw new Error(`${where}, à ${t} s : ${JSON.stringify(under.map((b) => b.what))} sous la C3 ${JSON.stringify([...under, now.actors[0]].map(round))}`);
    }
  }

  /** In the middle of each moment of CAST, held there: exactly those it shows, each entirely on screen; on the bridge,
   *  as the camera follows it, the C3 alone and entirely on screen. */
  async function scenes(where) {
    for (const [name, needs] of Object.entries(CAST)) {
      const t = beat[name]?.mid;
      if (t === undefined) throw new Error(`pas de temps « ${name} »`);
      const now = await heldAt(t, sceneBoxes);
      const who = now.actors.map((b) => b.what).sort();
      if (JSON.stringify(who) !== JSON.stringify([...needs].sort())) throw new Error(`${where}, « ${name} » à ${t} s : à l'écran ${JSON.stringify(who)}`);
      const off = outside(now.screen, now.actors);
      if (off.length) throw new Error(`${where}, « ${name} » à ${t} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
    }
    for (const t of CROSSING) {
      const now = await heldAt(t, sceneBoxes);
      if (now.actors.length !== 1 || now.actors[0].what !== "c3") throw new Error(`${where}, sur le pont à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      const off = outside(now.screen, now.actors);
      if (off.length) throw new Error(`${where}, sur le pont à ${t} s : la C3 hors de l'écran ${JSON.stringify(off.map(round))}`);
    }
  }

  await check(`?demo#/aventures/${ID} : data-length entre ${LENGTH.min} et ${LENGTH.max} ms, l'intro jouée en entier (pas moins de data-length − 300 ms), puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= ${MAP_TIMES.map(fr).join(", ")}), la C3 seule et dans l'écran, « ${MAP_NAMES.join(" », « ")} » écrits, jamais coupés par le bord ni sous la C3 ; « ${trajet.depart} » dans l'écran au départ, puis « ${[...trajet.etapes, ile.lieu].join(" », « ")} » ; l'épingle dans l'écran à ${fr(PIN_AT)} s`, async () => {
    await maps(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : au milieu de chacun des temps (?t=), ${Object.entries(CAST).map(([name, who]) => `${name} : ${who.join(", ")}`).join(" ; ")}, entièrement dans l'écran ; sur le pont à ${CROSSING.map(fr).join(", ")} s, la C3 seule et entièrement dans l'écran`, async () => {
    await scenes(`${vp.width} × ${vp.height}`);
  });

  if (vp.width === 1920)
    await check(`1920 × 1080 (point 5) : sur le pont, à ?t= ${CROSSING.map(fr).join(", ")} (la caméra suit la C3), chaque couche visible couvre toute la largeur de l'écran`, async () => {
      for (const t of CROSSING) {
        const layers = await heldAt(t, layersSeen);
        if (!layers.some((l) => l.name.startsWith("pont-"))) throw new Error(`à ${t} s : aucune couche « pont-* » à l'écran ${JSON.stringify(layers.map((l) => l.name))}`);
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

  if (SHOTS) {
    // the middle of each moment, held still, on this screen (and the phone turned), plus the map and the finished
    // poster; the demo banner hidden
    const stops = [...Object.entries(beat).map(([name, { mid }], k) => [mid, `${String(k + 1).padStart(2, "0")}-${name.replace(/[^a-z]+/gi, "-").toLowerCase()}`]), [2, "00-carte-2s"], [3.9, "00-carte-3-9s"], [30.5, "11-affiche-30-5s"]];
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
    await check(`les stickers demandés sous /assets/aventures/ : exactement ceux de ${ID}.stickers.js (${stickers.length}), aucun d'une autre sortie`, async () => {
      await page.goto(ILE);
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`[...new Set(performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname).filter((p) => p.startsWith("/assets/aventures/") && p.endsWith(".webp")).map((p) => p.slice("/assets/aventures/".length, -".webp".length)))].sort()`);
      if (!stickers.length || JSON.stringify(asked) !== JSON.stringify([...stickers].sort())) throw new Error(`demandés ${JSON.stringify(asked)}, attendus ${JSON.stringify([...stickers].sort())}`);
    });

    await check(`un sticker de scène bloqué (${SCENE}, celui de l'affiche) : il passe sur son remplaçant assets/cyrielle/joy.webp, et l'intro se termine ; aucune autre erreur que celle du fichier bloqué`, async () => {
      const before = page.errors.length;
      await page.block([`*/${SCENE}.webp`]);
      try {
        await page.goto(ILE);
        // the blocked sticker's look, before and after it goes to its stand-in
        const looks = `[...document.querySelectorAll(".st-actor__img")].filter((img) => img.dataset.fallback === "assets/cyrielle/joy.webp" && (img.dataset.fell || img.src.endsWith("/${SCENE}.webp")))`;
        await page.waitFor(`${loaded} && ${looks}.length > 0 && ${looks}.every((img) => img.naturalWidth > 0)`, 8000);
        const now = await page.eval(`${looks}.map((img) => new URL(img.src).pathname)`);
        if (!now.length || now.some((src) => src !== "/assets/cyrielle/joy.webp")) throw new Error(`les vélos de l'affiche : ${JSON.stringify(now)}`);
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
      // its stickers: all asked once the book landed (before any touch) and all arrived (their responses ended), then
      // the touch downloads none again
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
