// End-to-end checks of the outings' own intros (js/aventures/intros/), in headless Chrome, on two phones (the first one
// also turned sideways) and two PCs: the Premier bivouac's map, parking and lake with their actors on screen, the
// stickers it loads (and their stand-ins), its closing poster and its framing, its scenario file missing, leaving at
// once, ?demo&t=. Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/intros.mjs`
// (ONLY=1920: a single screen). Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { AVENTURES } from "../../js/aventures/data.js";
import { SCENARIOS } from "../../js/aventures/intros/index.js";
import { stickers } from "../../js/aventures/intros/bivouac-1.stickers.js";

const BASE = process.env.BASE || "http://localhost:5173/";
const VIEWPORTS = [
  { name: "iPhone 393 × 852 (puis tourné en 852 × 393)", width: 393, height: 852, mobile: true, turned: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false, wide: true },
  { name: "PC 1920 × 1080", width: 1920, height: 1080, mobile: false, wide: true },
];
const TITLE = "LACS D'AYOUS";
const LINE = "Premier bivouac · 17–18 mai 2025";
const PROVISIONAL = 4500; // ms, the provisional intro
const BIVOUAC = `${BASE}?demo#/aventures/bivouac-1`;
const KEY = "swap-cyrielle:aventures";
const bivouac = AVENTURES.find((a) => a.id === "bivouac-1");
const NAMES = [bivouac.trajet.depart, ...bivouac.trajet.etapes, bivouac.lieu]; // written on the map, from the data
// each moment of the intro (intros/index.js): its start, and its middle (s)
const beat = Object.fromEntries(SCENARIOS["bivouac-1"].beats.map(({ name, at }, k, all) => [name, { at, mid: (at + (all[k + 1]?.at ?? at + 2)) / 2 }]));
// ?graine=<save> (JSON) starts the page on that save, then drops itself from the address (as in aventures.mjs)
const SEED = `{
  const seed = new URLSearchParams(location.search).get("graine");
  if (seed !== null) {
    localStorage.clear();
    if (seed) localStorage.setItem("${KEY}", seed);
    history.replaceState(null, "", location.pathname + location.hash);
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const length = `Number(document.querySelector(".screen-intro")?.dataset.length)`; // ms, as the intro says
const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
// the intro mounted, its stickers arrived (or their stand-ins): its timeline plays
const loaded = `document.querySelector(".screen-intro .st-stage") && ${length} > 0 && [...document.querySelectorAll(".st-actor__img")].every((img) => img.complete)`;
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
// the intro's timeline, held still at exactly `t` s (found by its length): what is on screen then can be measured
const holdAt = (t) => `(() => {
  const length = Number(document.querySelector(".screen-intro").dataset.length) / 1000;
  const tl = gsap.globalTimeline.getChildren(false, false, true).find((child) => Math.abs(child.duration() - length) < 0.02);
  tl.pause().seek(${t});
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;
// the boxes (px) of what shows: the actors (the look each wears), the map's names and its pin, with the screen's size
const sceneBoxes = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = (el) => getComputedStyle(el).visibility === "visible";
  const actors = [...document.querySelectorAll(".st-actor")].filter(shows).map((el) => {
    const img = [...el.querySelectorAll(".st-actor__img")].find(shows);
    return img && box(img, el.dataset.who || el.dataset.vehicle);
  }).filter(Boolean);
  return {
    screen: { width: innerWidth, height: innerHeight },
    actors,
    names: [...document.querySelectorAll(".st-name")].map((el) => box(el, el.textContent)),
    pin: [...document.querySelectorAll(".st-pin")].map((el) => box(el, "épingle"))[0],
  };
})()`;
const round = (b) => ({ ...b, left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) });
/** The boxes not entirely inside the screen (half a px of rounding allowed). */
const outside = (screen, boxes) => boxes.filter((b) => !b || b.left < -0.5 || b.top < -0.5 || b.right > screen.width + 0.5 || b.bottom > screen.height + 0.5);

/** Every box entirely inside the screen (half a px of rounding allowed). */
function inside({ screen, boxes }, where) {
  const out = outside(screen, boxes);
  if (!boxes.length) throw new Error(`${where} : pas de cadre ni de lettrage`);
  if (out.length) throw new Error(`${where} : hors de l'écran ${JSON.stringify(out.slice(0, 3).map(round))}`);
}

async function suite(page, vp) {
  const check = checker(page);

  /** The bivouac's intro played through: its poster says the lieu, then the stamp's name and dates, all of it on
   *  screen, its title out of the sound button's corner; then the passport. */
  async function poster(where) {
    await page.goto(BIVOUAC);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000);
    const ms = await page.eval(length);
    await page.waitFor(built, ms + 4000);
    const seen = await page.eval(posterBoxes);
    if (seen.title !== TITLE) throw new Error(`${where} : titre « ${seen.title} »`);
    if (seen.line !== LINE) throw new Error(`${where} : ligne « ${seen.line} »`);
    inside(seen, where);
    // the sound button's corner (the screen's top right 56 px): the title stays out of it
    const corner = seen.boxes.filter((b) => b.what === ".af-title .af-letter" && b.right > seen.screen.width - 56 && b.top < 56);
    if (corner.length) throw new Error(`${where} : le titre sous le bouton du son ${JSON.stringify(corner.map(round))}`);
    await page.waitFor(atPassport, 5000);
  }

  /** The map, the parking and the lake, each held at its moment: the Seat, the start's name, the pin and the lieu's
   *  name on screen when they count (spec § 11), the names those of the data, none cut by the screen's edge; then Cycy,
   *  Kevin and the Seat, the two of them not hidden by it. */
  async function scenes(where) {
    const seen = async (t) => {
      await page.goto(`${BASE}?demo&t=${t}#/aventures/bivouac-1`);
      await page.waitFor(loaded, 8000);
      await sleep(250);
      await page.eval(holdAt(t));
      return page.eval(sceneBoxes);
    };
    for (const t of [0.3, 1.6, 3.0]) {
      const now = await seen(t);
      const names = now.names.map((b) => b.what);
      if (JSON.stringify(names) !== JSON.stringify(NAMES)) throw new Error(`${where}, à ${t} s : les noms ${JSON.stringify(names)}, pas ${JSON.stringify(NAMES)}`);
      const seat = now.actors.filter((b) => b.what === "seat");
      if (seat.length !== 1 || now.actors.length !== 1) throw new Error(`${where}, à ${t} s : à l'écran ${JSON.stringify(now.actors.map((b) => b.what))}`);
      const wanted = [...seat];
      if (t === 0.3) wanted.push(now.names.find((b) => b.what === bivouac.trajet.depart));
      if (t === 3.0) wanted.push(now.pin, now.names.find((b) => b.what === bivouac.lieu));
      const off = outside(now.screen, wanted);
      if (off.length) throw new Error(`${where}, sur la carte à ${t} s : hors de l'écran ${JSON.stringify(off.map((b) => b && round(b)))}`);
      // a name in view is whole: never cut by the screen's edge
      const cut = outside(now.screen, now.names.filter((b) => b.right > 0 && b.left < now.screen.width && b.bottom > 0 && b.top < now.screen.height));
      if (cut.length) throw new Error(`${where}, sur la carte à ${t} s : un nom coupé par le bord ${JSON.stringify(cut.map(round))}`);
    }
    for (const [name, needs] of [
      ["Le parking", ["cycy", "kevin", "seat"]],
      ["En haut", ["cycy", "kevin"]],
    ]) {
      const t = beat[name].mid;
      const now = await seen(t);
      const who = now.actors.map((b) => b.what).sort();
      if (JSON.stringify(who) !== JSON.stringify(needs)) throw new Error(`${where}, « ${name} » à ${t} s : à l'écran ${JSON.stringify(who)}`);
      const off = outside(now.screen, now.actors);
      if (off.length) throw new Error(`${where}, « ${name} » à ${t} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
      // the two of them beside the Seat, not hidden by it: each box covers at most a fifth of its own by the Seat's
      const seat = now.actors.find((b) => b.what === "seat");
      for (const b of seat ? now.actors.filter((a) => a !== seat) : []) {
        const shared = Math.max(0, Math.min(b.right, seat.right) - Math.max(b.left, seat.left)) * Math.max(0, Math.min(b.bottom, seat.bottom) - Math.max(b.top, seat.top));
        const share = shared / ((b.right - b.left) * (b.bottom - b.top));
        if (share > 0.2) throw new Error(`${where}, « ${name} » à ${t} s : ${b.what} recouvre la Seat à ${Math.round(share * 100)} %`);
      }
    }
  }

  await check(`?demo#/aventures/bivouac-1 : l'intro jouée en entier, puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= 0,3, 1,6 et 3,0), la Seat dans l'écran, « ${bivouac.trajet.depart} » au départ, l'épingle et « ${bivouac.lieu} » à l'arrivée, les noms ceux des données et jamais coupés par le bord ; au parking puis sur la vue du lac (?t= au milieu), Cycy, Kevin (et la Seat au parking) dans l'écran, Cycy et Kevin pas cachés par la Seat`, async () => {
    await scenes(`${vp.width} × ${vp.height}`);
  });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la carte, le parking et le lac comme sur les autres écrans", async () => {
      await page.resize(852, 393);
      try {
        await scenes("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : le parking cadré sur la bande d'action, puis l'affiche entière dans la hauteur, son lettrage dans l'écran ; puis le passeport", async () => {
      await page.resize(852, 393);
      try {
        await page.goto(`${BASE}?demo&t=${beat["Le parking"].mid}#/aventures/bivouac-1`);
        await page.waitFor(`innerWidth === 852 && ${loaded}`, 8000);
        await page.eval(holdAt(beat["Le parking"].mid));
        // the band y 250 to 730 fills the height: the world's 760 units are 760 × 393 / 480 px high, its top above the screen
        const world = await page.eval(`(() => { const r = document.querySelector(".st-world").getBoundingClientRect(); return { top: r.top, height: r.height }; })()`);
        if (Math.abs(world.height - (760 * 393) / 480) > 1 || Math.abs(world.top + (250 * 393) / 480) > 1) throw new Error(`cadrage ${JSON.stringify(world)}`);
        await poster("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp.wide)
    await check(`${vp.width} × ${vp.height} (point 3) : à trois instants de l'intro (?t=), chaque couche couvre toute la largeur de l'écran`, async () => {
      for (const t of [0.5, 2.2, 4.4]) {
        await page.goto(`${BASE}?demo&t=${t}#/aventures/bivouac-1`);
        await page.waitFor(`document.querySelectorAll(".st-layer").length > 0 && ${length} > 0`, 6000);
        await sleep(400);
        const seen = await page.eval(`(() => [...document.querySelectorAll(".st-layer")].map((el) => {
          const r = el.getBoundingClientRect();
          return { name: el.dataset.layer, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }))()`);
        const bare = seen.filter((l) => l.left > 0 || l.right < vp.width);
        if (bare.length) throw new Error(`à ${t} s : bord vide ${JSON.stringify(bare.map((l) => ({ ...l, left: Math.round(l.left), right: Math.round(l.right) })))}`);
        const sky = seen.find((l) => l.name === "ciel");
        if (!sky || sky.top > 0.5 || sky.bottom < vp.height - 0.5) throw new Error(`à ${t} s : le ciel ne couvre pas la hauteur ${JSON.stringify(sky)}`);
      }
    });

  if (vp === VIEWPORTS[0]) {
    await check(`les stickers demandés sous /assets/aventures/ : exactement ceux de bivouac-1.stickers.js (${stickers.length}), aucun d'une autre sortie`, async () => {
      await page.goto(BIVOUAC);
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`[...new Set(performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname).filter((p) => p.startsWith("/assets/aventures/") && p.endsWith(".webp")).map((p) => p.slice("/assets/aventures/".length, -".webp".length)))].sort()`);
      if (JSON.stringify(asked) !== JSON.stringify([...stickers].sort())) throw new Error(`demandés ${JSON.stringify(asked)}`);
    });

    await check("un sticker bloqué (cycy-face-joie) : Cycy passe sur son remplaçant assets/cyrielle/joy.webp, et l'intro se termine ; aucune autre erreur que celle du fichier bloqué", async () => {
      const before = page.errors.length;
      await page.block(["*/bivouac-1/cycy-face-joie.webp"]);
      try {
        await page.goto(BIVOUAC);
        const cycy = `[...document.querySelectorAll('.st-actor[data-who="cycy"] .st-actor__img')]`;
        await page.waitFor(`${cycy}.length > 0 && ${cycy}.every((img) => img.complete && img.naturalWidth > 0)`, 8000);
        const srcs = await page.eval(`${cycy}.map((img) => new URL(img.src).pathname)`);
        if (!srcs.every((src) => src === "/assets/cyrielle/joy.webp")) throw new Error(`Cycy : ${JSON.stringify(srcs)}`);
        await page.waitFor(atPassport, Number(await page.eval(length)) + 5000);
      } finally {
        await page.block([]);
      }
      const errors = page.errors.slice(before);
      if (errors.some((e) => !e.includes("cycy-face-joie.webp"))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
    }, { allowErrors: true });

    await check("point 1 : entrer dans l'intro (première visite, hors démo) puis le retour du navigateur 50 ms après, pendant le chargement des stickers : le passeport, aucune scène restée, rien d'enregistré, pas de tampon qui attend", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify({ welcomed: true, known: AVENTURES.map((a) => a.id) }))}#/aventures`);
      await page.waitFor(`document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"][data-page="1"]') && document.querySelector('.pp-slot[data-id="bivouac-1"][data-status="open"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`, 8000);
      await page.eval(`new MutationObserver((_, watch) => {
        if (!document.querySelector("#app > .screen-intro")) return;
        watch.disconnect();
        setTimeout(() => history.back(), 50);
      }).observe(document, { childList: true, subtree: true })`);
      await page.tap('.pp-slot[data-id="bivouac-1"]');
      await page.waitFor(`location.hash === "#/aventures/bivouac-1"`, 4000);
      await page.waitFor(atPassport, 4000);
      await sleep(4500); // past the stickers' wait (4 s): nothing comes back
      const now = await page.eval(`({ hash: location.hash, stages: document.querySelectorAll(".st-stage").length, intro: Boolean(document.querySelector(".screen-intro")),
        tool: Boolean(document.querySelector(".pp-tool")), slot: document.querySelector('.pp-slot[data-id="bivouac-1"]')?.dataset.status, save: JSON.parse(localStorage.getItem("${KEY}")) })`);
      if (now.hash !== "#/aventures" || now.stages || now.intro || now.tool || now.slot !== "open") throw new Error(JSON.stringify({ ...now, save: undefined }));
      if (now.save?.pending?.includes("bivouac-1") || now.save?.stamped?.includes("bivouac-1")) throw new Error(`enregistré : ${JSON.stringify(now.save)}`);
      await page.goto("about:blank");
    });
  }

  // Chrome logs nothing for a file the bench blocks (a real 404 logs the network's failure): at most that one error
  await check("point 4 : le fichier du scénario bloqué (intros/bivouac-1.js), l'intro provisoire joue (4500 ms) ; aucune autre erreur que celle du fichier bloqué", async () => {
    const before = page.errors.length;
    await page.block(["*/intros/bivouac-1.js"]);
    try {
      await page.goto(BIVOUAC);
      await page.waitFor(`${length} > 0`, 6000);
      const now = await page.eval(`({ length: ${length}, stage: Boolean(document.querySelector(".st-stage")), sign: Boolean(document.querySelector(".in-sign")),
        asked: performance.getEntriesByType("resource").some((e) => e.name.endsWith("/intros/bivouac-1.js")) })`);
      if (!now.asked) throw new Error("le fichier du scénario n'a pas été demandé");
      if (now.length !== PROVISIONAL || now.stage || !now.sign) throw new Error(`pas l'intro provisoire : ${JSON.stringify(now)}`);
      await sleep(1500);
    } finally {
      await page.block([]);
    }
    const errors = page.errors.slice(before);
    if (errors.length > 1 || errors.some((e) => !e.includes("intros/bivouac-1.js"))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
  }, { allowErrors: true });

  await check("?demo&t=99 (après la fin de l'intro) : retour au passeport, sans rester figé sur la dernière image", async () => {
    await page.goto(`${BASE}?demo&t=99#/aventures/bivouac-1`);
    await page.waitFor(atPassport, 5000);
  });

  await check("?t=99 sans ?demo : ignoré, l'intro part du début (première fois : toujours là 1,5 s plus tard, son affiche pas encore là)", async () => {
    await page.goto(`${BASE}?t=99#/aventures/bivouac-1`);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000);
    await sleep(1500);
    const now = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro")), poster: ${built} })`);
    if (now.hash !== "#/aventures/bivouac-1" || !now.intro || now.poster) throw new Error(`?t=99 suivi hors démo : ${JSON.stringify(now)}`);
    // leave it unfinished, nothing saved: the next checks start from a fresh profile
    await page.goto("about:blank");
    await page.goto(`${BASE}?demo#/aventures`);
    await page.eval(`localStorage.clear()`);
  });
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await page.beforeLoad(SEED);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
