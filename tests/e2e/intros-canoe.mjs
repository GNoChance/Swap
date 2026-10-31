// End-to-end checks of the Premier canoë's intro (js/aventures/intros/canoe.js), in headless Chrome, on the kit's
// screens (intro-kit.mjs) and the first phone turned sideways: its length and its closing poster « LA DORDOGNE », its
// map in two steps (the C3 from Bordeaux to Port d'Enveaux, then the bus up the valley to Carsac), the stickers it loads
// and a scene sticker's stand-in, its scenario warmed on the passport, a touch the first time, « Passer ▸ » in the demo,
// the browser's back. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then
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
const MAP_TIMES = [0.3, 1.5, 2.6]; // s: the C3 on the regional map
const RELAY_AT = 4.6; // s: the bus by Carsac, its pin plopped
// a save whose welcome is seen, the Premier bivouac stamped: the canoe to live, the first time
const BIVOUAC_STAMPED = { welcomed: true, known: AVENTURES.map((a) => a.id), stamped: ["bivouac-1"] };
const SCENE = "canoe/scene-cycy-et-kevin-en-canoe-11"; // the canoe in front of the cliff, on the poster

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
// sees them, the names and pins that show, and the parking's P
const onMap = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = (el) => {
    if (getComputedStyle(el).visibility !== "visible") return false;
    for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
    return true;
  };
  const seen = (selector, what) => [...document.querySelectorAll(selector)].filter(shows).map((el) => box(el, what ?? el.textContent));
  return { ...${sceneBoxes}, names: seen(".st-name"), pins: seen(".st-pin", "épingle"), parking: seen(".st-parking", "P") };
})()`;

async function suite(page, vp) {
  const check = checker(page);

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

  /** The map in two steps, held at given moments: on the regional map, the C3 alone and in sight, the three names of the
   *  data written, none cut by the screen's edge, and at its end the pin and the P of Port d'Enveaux in sight; on the
   *  valley's map, the bus alone and in sight, the relay's names those of the data, none cut, Carsac and its pin in
   *  sight. */
  async function maps(where) {
    const seen = async (t) => {
      await page.goto(`${BASE}?demo&t=${t}#/aventures/canoe`);
      await page.waitFor(playing, 8000);
      await sleep(250);
      await page.eval(holdAt(t));
      return page.eval(onMap);
    };
    /** Names in view are whole: never cut by the screen's edge. */
    const whole = (now, t) => {
      const cut = outside(now.screen, now.names.filter((b) => b.right > 0 && b.left < now.screen.width && b.bottom > 0 && b.top < now.screen.height));
      if (cut.length) throw new Error(`${where}, à ${t} s : un nom coupé par le bord ${JSON.stringify(cut.map(round))}`);
    };
    for (const t of MAP_TIMES) {
      const now = await seen(t);
      const names = now.names.map((b) => b.what);
      if (JSON.stringify(names) !== JSON.stringify(MAP_NAMES)) throw new Error(`${where}, à ${t} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(MAP_NAMES)}`);
      if (now.actors.length !== 1 || now.actors[0].what !== "c3") throw new Error(`${where}, à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      const wanted = [...now.actors];
      if (t === MAP_TIMES.at(-1)) {
        if (now.pins.length !== 1 || now.parking.length !== 1) throw new Error(`${where}, à ${t} s : ${now.pins.length} épingle(s), ${now.parking.length} P`);
        wanted.push(...now.pins, ...now.parking);
      }
      const off = outside(now.screen, wanted);
      if (off.length) throw new Error(`${where}, sur la carte à ${t} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
      whole(now, t);
    }
    const now = await seen(RELAY_AT);
    const names = now.names.map((b) => b.what);
    if (JSON.stringify([...names].sort()) !== JSON.stringify([...RELAY_NAMES].sort())) throw new Error(`${where}, à ${RELAY_AT} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(RELAY_NAMES)}`);
    if (now.actors.length !== 1 || now.actors[0].what !== "bus") throw new Error(`${where}, à ${RELAY_AT} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
    if (now.pins.length !== 1) throw new Error(`${where}, à ${RELAY_AT} s : ${now.pins.length} épingle(s)`);
    const off = outside(now.screen, [...now.actors, ...now.pins, now.names.find((b) => b.what === trajet.relais.arrivee)]);
    if (off.length) throw new Error(`${where}, sur la vallée à ${RELAY_AT} s : hors de l'écran ${JSON.stringify(off.map((b) => b && round(b)))}`);
    whole(now, RELAY_AT);
  }

  await check(`?demo#/aventures/canoe : data-length entre ${LENGTH.min} et ${LENGTH.max} ms, l'intro jouée en entier (pas moins de data-length − 300 ms), puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= ${MAP_TIMES.join(", ").replaceAll(".", ",")}), la C3 seule et dans l'écran, « ${MAP_NAMES.join(" », « ")} » écrits et jamais coupés par le bord, à la fin l'épingle et le P de ${trajet.arrivee} dans l'écran ; à ?t= ${String(RELAY_AT).replace(".", ",")}, sur la vallée, le bus seul et dans l'écran, les noms du relais ceux des données et jamais coupés, « ${trajet.relais.arrivee} » et son épingle dans l'écran`, async () => {
    await maps(`${vp.width} × ${vp.height}`);
  });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la carte en deux étapes comme sur les autres écrans, puis l'affiche jouée en entier, son lettrage dans l'écran ; puis le passeport", async () => {
      await page.resize(852, 393);
      try {
        await maps("852 × 393");
        await poster("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp === VIEWPORTS[0]) {
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
        const looks = `[...document.querySelectorAll(".st-actor__img")].filter((img) => img.dataset.fallback === "assets/cyrielle/joy.webp")`;
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
      await sleep(1200);
      const later = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro .st-stage")), t: ${timeline}?.time(), paused: ${timeline}?.paused() })`);
      if (later.hash !== "#/aventures/canoe" || !later.intro || later.paused || !(later.t > touched + 0.8)) throw new Error(`après le toucher à ${touched.toFixed(2)} s : ${JSON.stringify(later)}`);
      await page.waitFor(`${timeline}.time() > 10`, 6000);
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
