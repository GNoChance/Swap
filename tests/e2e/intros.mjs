// End-to-end checks of the outings' own intros (js/aventures/intros/), in headless Chrome, on two phones (the first one
// also turned sideways) and two PCs: the Premier bivouac's length, its map and each of its moments with their actors on
// screen, the phone turned while it plays, the stickers it loads (and their stand-ins), its closing poster and its
// framing, its scenario file missing, leaving at once, entering and leaving three times, ?demo&t=. Needs the site
// running (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/intros.mjs` (ONLY=1920: a single screen; SHOTS=<folder> keeps a screenshot of the middle of each moment on each screen). Stops
// at the first failure (exit code 1). A check also fails if the page logged an error.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { AVENTURES } from "../../js/aventures/data.js";
import { SCENARIOS } from "../../js/aventures/intros/index.js";
import { stickers } from "../../js/aventures/intros/bivouac-1.stickers.js";

const BASE = process.env.BASE || "http://localhost:5173/";
const SHOTS = process.env.SHOTS;
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
const LENGTH = { min: 17000, max: 18500 }; // ms, the bivouac's intro (spec § 5)
// each moment of the intro (intros/index.js): its start, and its middle (s)
const beat = Object.fromEntries(SCENARIOS["bivouac-1"].beats.map(({ name, at }, k, all) => [name, { at, mid: (at + (all[k + 1]?.at ?? at + 2)) / 2 }]));
// who shows in the middle of each moment after the map (spec § 5): all of them entirely on screen
const CAST = {
  "Le parking": ["cycy", "kevin", "seat"],
  "La montée": ["cycy", "kevin"],
  "En haut": ["cycy", "kevin"],
  "La descente": ["cycy", "kevin"],
  "La voiture": ["seat"],
  "L'affiche": ["cycy", "kevin"],
};
// ?graine=<save> (JSON) starts the page on that save, then drops itself from the address (as in aventures.mjs)
const SEED = `{
  const seed = new URLSearchParams(location.search).get("graine");
  if (seed !== null) {
    localStorage.clear();
    if (seed) localStorage.setItem("${KEY}", seed);
    history.replaceState(null, "", location.pathname + location.hash);
  }
}`;
// ?decodage-rejete: decode() rejects on Cycy's front sticker in joy once it has arrived (as WebKit can, for another
// reason than a missing file); __rejected, how many times
const REJECT = `if (location.search.includes("decodage-rejete")) {
  const decode = HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode = function () {
    return decode.call(this).then(() => {
      if (!this.src.includes("/cycy-face-joie.webp")) return;
      window.__rejected = (window.__rejected || 0) + 1;
      throw new DOMException("The source image cannot be decoded.", "EncodingError");
    });
  };
}`;
// __landedAt: when the passport's book first rests open, its arrival over (performance.now() ms)
const LANDING = `new MutationObserver((_, watch) => {
  if (!document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]')) return;
  window.__landedAt = performance.now();
  watch.disconnect();
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["class", "data-open"] });`;
const WELCOMED = { welcomed: true, known: AVENTURES.map((a) => a.id) }; // a save whose welcome is seen, nothing lived

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const length = `Number(document.querySelector(".screen-intro")?.dataset.length)`; // ms, as the intro says
const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
/** The passport open on page `n`, landed, its screen fully in: a touch counts. */
const settled = (n) => `document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"][data-page="${n}"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`;
/** « Passer ▸ » fully shown, or gone (hidden). */
const skipIs = (state) => `(() => {
  const el = document.querySelector(".screen-intro .intro-skip");
  const style = el && getComputedStyle(el);
  return Boolean(style) && (${state === "shown" ? `style.visibility === "visible" && style.opacity === "1"` : `style.visibility === "hidden"`});
})()`;
// the requests for the bivouac's scenario file
const scenarioAsked = `performance.getEntriesByType("resource").filter((e) => new URL(e.name).pathname === "/js/aventures/intros/bivouac-1.js")`;
// the intro mounted, each of its stickers loaded or failed (img.complete); its timeline may still wait for them to be
// decoded (playing)
const loaded =`document.querySelector(".screen-intro .st-stage") && ${length} > 0 && [...document.querySelectorAll(".st-actor__img")].every((img) => img.complete)`;
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
// the intro's timeline (found by its length)
const timeline = `(() => {
  const length = Number(document.querySelector(".screen-intro")?.dataset.length) / 1000;
  return gsap.globalTimeline.getChildren(false, false, true).find((child) => Math.abs(child.duration() - length) < 0.02);
})()`;
// its timeline playing: its stickers decoded (ready), not only arrived; a hold before that would be undone by its play()
const playing = `${loaded} && ${timeline}?.paused() === false`;
// the intro's timeline, held still at exactly `t` s: what is on screen then can be measured
const holdAt = (t) => `(() => {
  ${timeline}.pause().seek(${t});
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;
// GSAP's lag smoothing, by its effect: after a frame of 0.8 s, how far a tween went (s). GSAP's own (500, 33) drops
// that time (a few hundredths); turned off, it keeps it all
const lagged = `(async () => {
  const frames = (n) => new Promise((resolve) => (function next(k) { k ? requestAnimationFrame(() => next(k - 1)) : resolve(); })(n));
  const probe = gsap.to({}, { duration: 60, ease: "none" });
  await frames(2);
  const t0 = probe.time();
  const until = performance.now() + 800;
  while (performance.now() < until);
  await frames(2);
  const went = probe.time() - t0;
  probe.kill();
  return went;
})()`;
// the boxes (px) of what shows (visible, and not see-through: opacity > 0 up its tree): the actors (the look each
// wears), the map's names and its pin, with the screen's size
const sceneBoxes = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = (el) => {
    if (getComputedStyle(el).visibility !== "visible") return false;
    for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
    return true;
  };
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

  /** The bivouac's intro played through, as long as it says (17 to 18.5 s) and not shorter: its poster says the lieu,
   *  then the stamp's name and dates, all of it on screen, its title out of the sound button's corner; then the
   *  passport. */
  async function poster(where) {
    await page.goto(BIVOUAC);
    await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000);
    const ms = await page.eval(length);
    if (!(ms >= LENGTH.min && ms <= LENGTH.max)) throw new Error(`${where} : data-length ${ms}, pas entre ${LENGTH.min} et ${LENGTH.max}`);
    // the page's own clock: when its timeline started playing, when it left its address
    await page.eval(`(() => {
      window.__played = window.__ended = null;
      const watch = setInterval(() => {
        const tl = ${timeline};
        if (tl && tl.time() > 0 && window.__played === null) window.__played = performance.now() - tl.time() * 1000;
        if (location.hash !== "#/aventures/bivouac-1") (window.__ended = performance.now()), clearInterval(watch);
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

  /** The map and each moment after it, held there: on the map, the Seat, the start's name, the pin and the lieu's name
   *  on screen when they count (spec § 11), the names those of the data, none cut by the screen's edge; in the middle of
   *  each moment, those it shows (Cycy, Kevin, the Seat) entirely on screen, the two of them not hidden by the Seat. */
  async function scenes(where) {
    const seen = async (t) => {
      await page.goto(`${BASE}?demo&t=${t}#/aventures/bivouac-1`);
      await page.waitFor(playing, 8000);
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
    const moments = Object.keys(beat).filter((name) => name !== "La carte");
    if (JSON.stringify(moments) !== JSON.stringify(Object.keys(CAST))) throw new Error(`les temps de l'intro ${JSON.stringify(Object.keys(beat))}, pas « La carte » puis ${JSON.stringify(Object.keys(CAST))}`);
    for (const [name, needs] of Object.entries(CAST)) {
      const t = beat[name].mid;
      const now = await seen(t);
      const who = now.actors.map((b) => b.what).sort();
      if (JSON.stringify(who) !== JSON.stringify([...needs].sort())) throw new Error(`${where}, « ${name} » à ${t} s : à l'écran ${JSON.stringify(who)}`);
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

  await check(`?demo#/aventures/bivouac-1 : data-length entre ${LENGTH.min} et ${LENGTH.max} ms, l'intro jouée en entier (pas moins de data-length − 300 ms), puis l'affiche dit exactement « ${TITLE} » et « ${LINE} », son cadre et son lettrage entièrement dans l'écran, le titre hors du coin du bouton du son ; puis le passeport`, async () => {
    await poster(`${vp.width} × ${vp.height}`);
  });

  await check(`${vp.width} × ${vp.height} : sur la carte (?t= 0,3, 1,6 et 3,0), la Seat dans l'écran, « ${bivouac.trajet.depart} » au départ, l'épingle et « ${bivouac.lieu} » à l'arrivée, les noms ceux des données et jamais coupés par le bord ; au milieu de chacun des autres temps (?t=), ${Object.entries(CAST).map(([name, who]) => `${name} : ${who.join(", ")}`).join(" ; ")}, entièrement dans l'écran, Cycy et Kevin pas cachés par la Seat`, async () => {
    await scenes(`${vp.width} × ${vp.height}`);
  });

  if (vp.turned)
    await check("852 × 393 (le téléphone tourné) : la carte et chacun des temps comme sur les autres écrans", async () => {
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
        await page.waitFor(`innerWidth === 852 && ${playing}`, 8000);
        await page.eval(holdAt(beat["Le parking"].mid));
        // the band y 250 to 730 fills the height: the world's 760 units are 760 × 393 / 480 px high, its top above the screen
        const world = await page.eval(`(() => { const r = document.querySelector(".st-world").getBoundingClientRect(); return { top: r.top, height: r.height }; })()`);
        if (Math.abs(world.height - (760 * 393) / 480) > 1 || Math.abs(world.top + (250 * 393) / 480) > 1) throw new Error(`cadrage ${JSON.stringify(world)}`);
        await poster("852 × 393");
      } finally {
        await page.resize(vp.width, vp.height);
      }
    });

  if (vp.turned)
    await check("point 2 : le téléphone tourné pendant la montée (portrait → paysage, puis 1 s plus tard → portrait) : la même intro, sa timeline avance tout du long (au moins 0,7 fois l'horloge entre les deux arrêts), et à chaque arrêt exactement Cycy et Kevin, entièrement dans l'écran", async () => {
      const montee = beat["La montée"];
      const from = +(montee.at + 0.2).toFixed(2); // the climb lasts 2.8 s: room for the two stops
      await page.goto(`${BASE}?demo&t=${from}#/aventures/bivouac-1`);
      await page.waitFor(playing, 8000); // turned at once: the climb is short
      await page.eval(`void (window.__intro = document.querySelector(".screen-intro"))`);
      const valleyGone = montee.at + 0.35; // s: the valley faded out (0.3 s)
      /** At a stop on a width × height screen, read on a frame after the resize (its stage refitted), the valley gone: the
       *  intro still the same, still climbing, and exactly Cycy and Kevin on screen, entirely. → its timeline's time and
       *  the clock's. */
      const stop = async (width, height) => {
        await page.resize(width, height);
        await page.waitFor(`innerWidth === ${width}`, 2000);
        const now = await page.eval(`new Promise((resolve) => {
          const tl = ${timeline};
          const until = performance.now() + 3000;
          const look = () => {
            if (!tl) return resolve({ same: false });
            if (tl.time() < ${valleyGone} && performance.now() < until) return requestAnimationFrame(look);
            resolve({ same: window.__intro === document.querySelector(".screen-intro"), stalled: tl.time() < ${valleyGone}, t: tl.time(), clock: performance.now() / 1000, seen: ${sceneBoxes} });
          };
          requestAnimationFrame(look);
        })`);
        if (!now.same) throw new Error(`${width} × ${height} : l'intro a changé`);
        if (now.stalled) throw new Error(`${width} × ${height} : la timeline n'avance plus (à ${now.t.toFixed(2)} s après 3 s)`);
        if (now.t >= beat["En haut"].at) throw new Error(`${width} × ${height} : arrêt après la montée (à ${now.t.toFixed(2)} s), trop tard pour compter Cycy et Kevin`);
        const who = now.seen.actors.map((b) => b.what).sort();
        if (JSON.stringify(who) !== JSON.stringify(["cycy", "kevin"])) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : à l'écran ${JSON.stringify(who)}`);
        const off = outside(now.seen.screen, now.seen.actors);
        if (off.length) throw new Error(`${width} × ${height} à ${now.t.toFixed(2)} s : hors de l'écran ${JSON.stringify(off.map(round))}`);
        return now;
      };
      try {
        const turned = Date.now();
        const sideways = await stop(852, 393);
        await sleep(Math.max(0, 1000 - (Date.now() - turned)));
        const back = await stop(vp.width, vp.height);
        if (sideways.t < montee.at) throw new Error(`tourné à ${sideways.t.toFixed(2)} s, pas pendant la montée`);
        // never restarted nor held: the timeline keeps the clock's time
        const [played, spent] = [back.t - sideways.t, back.clock - sideways.clock];
        if (played < 0.7 * spent) throw new Error(`la timeline a avancé de ${played.toFixed(2)} s en ${spent.toFixed(2)} s (${sideways.t.toFixed(2)} s puis ${back.t.toFixed(2)} s)`);
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

    await check("un sticker bloqué (cycy-face-joie) : Cycy de face en joie passe sur son remplaçant assets/cyrielle/joy.webp, ses autres poses restent les siennes, et l'intro se termine ; aucune autre erreur que celle du fichier bloqué", async () => {
      const before = page.errors.length;
      await page.block(["*/bivouac-1/cycy-face-joie.webp"]);
      try {
        await page.goto(BIVOUAC);
        const cycy = `[...document.querySelectorAll('.st-actor[data-who="cycy"] .st-actor__img')]`;
        await page.waitFor(`${cycy}.length > 0 && ${cycy}.every((img) => img.complete && img.naturalWidth > 0)`, 8000);
        const looks = await page.eval(`${cycy}.map((img) => ({ src: new URL(img.src).pathname, standIn: img.dataset.fallback }))`);
        const joy = looks.filter((look) => look.standIn === "assets/cyrielle/joy.webp");
        const others = looks.filter((look) => look.standIn !== "assets/cyrielle/joy.webp");
        if (!joy.length || !joy.every((look) => look.src === "/assets/cyrielle/joy.webp") || !others.every((look) => look.src.startsWith("/assets/aventures/bivouac-1/cycy-")))
          throw new Error(`Cycy : ${JSON.stringify(looks.map((look) => look.src))}`);
        await page.waitFor(atPassport, Number(await page.eval(length)) + 5000);
      } finally {
        await page.block([]);
      }
      const errors = page.errors.slice(before);
      if (errors.some((e) => !e.includes("cycy-face-joie.webp"))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
    }, { allowErrors: true });

    await check("point 1 : entrer dans l'intro (première visite, hors démo) puis le retour du navigateur 50 ms après, ses stickers encore en route (retenus 1,5 s) et sa timeline pas encore partie : le passeport, aucune scène restée, rien d'enregistré, pas de tampon qui attend, et le lissage de GSAP à son réglage d'origine", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify({ welcomed: true, known: AVENTURES.map((a) => a.id) }))}#/aventures`);
      await page.waitFor(`document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"][data-page="1"]') && document.querySelector('.pp-slot[data-id="bivouac-1"][data-status="open"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`, 8000);
      // just before the back: is its timeline still waiting (paused), and how many of its stickers are still on their way?
      await page.eval(`new MutationObserver((_, watch) => {
        const el = document.querySelector("#app > .screen-intro");
        if (!el) return;
        watch.disconnect();
        setTimeout(() => {
          const tl = ${timeline};
          window.__atBack = { timeline: Boolean(tl), paused: tl?.paused(), loading: [...el.querySelectorAll(".st-actor__img")].filter((img) => !img.complete).length };
          history.back();
        }, 50);
      }).observe(document, { childList: true, subtree: true })`);
      await page.hold(["*/assets/aventures/*.webp"], 1500);
      try {
        await page.tap('.pp-slot[data-id="bivouac-1"]');
        await page.waitFor(`location.hash === "#/aventures/bivouac-1"`, 4000);
        await page.waitFor(atPassport, 4000);
        await sleep(4500); // past the stickers' wait (4 s): nothing comes back
      } finally {
        await page.hold([]);
      }
      const now = await page.eval(`({ hash: location.hash, stages: document.querySelectorAll(".st-stage").length, intro: Boolean(document.querySelector(".screen-intro")),
        tool: Boolean(document.querySelector(".pp-tool")), slot: document.querySelector('.pp-slot[data-id="bivouac-1"]')?.dataset.status, save: JSON.parse(localStorage.getItem("${KEY}")), atBack: window.__atBack })`);
      if (!now.atBack?.timeline || !now.atBack.paused || !now.atBack.loading) throw new Error(`au retour, l'intro n'attendait plus ses stickers : ${JSON.stringify(now.atBack)}`);
      if (now.hash !== "#/aventures" || now.stages || now.intro || now.tool || now.slot !== "open") throw new Error(JSON.stringify({ ...now, save: undefined }));
      if (now.save?.pending?.includes("bivouac-1") || now.save?.stamped?.includes("bivouac-1")) throw new Error(`enregistré : ${JSON.stringify(now.save)}`);
      const went = await page.eval(lagged);
      if (went > 0.3) throw new Error(`le lissage de GSAP coupé : une image de 0,8 s a avancé de ${went.toFixed(2)} s`);
      await page.goto("about:blank");
    });

    await check("point 5 : sur le passeport, entrer dans l'intro et en sortir trois fois de suite (le retour du navigateur pendant qu'elle joue) : gsap.globalTimeline.getChildren() revient à son compte de départ, aucune .st-stage ne reste, et le lissage de GSAP est à son réglage d'origine", async () => {
      await page.goto(`${BASE}?demo#/aventures`);
      const settled = `${atPassport} && !document.querySelector(".screen-intro") && document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`;
      const count = `gsap.globalTimeline.getChildren().length`;
      /** The count of GSAP's children once the passport is still: only its own endless loops left (no screen fading,
       *  no timeline still going: a timeline left behind keeps this false). */
      const steady = async () => {
        await page.waitFor(settled, 8000);
        await page.waitFor(`gsap.globalTimeline.getChildren().every((child) => child.repeat() === -1)`, 8000);
        return page.eval(count);
      };
      const before = await steady();
      for (let k = 0; k < 3; k++) {
        await page.eval(`location.hash = "#/aventures/bivouac-1"`);
        await page.waitFor(`${loaded} && ${timeline}?.isActive()`, 8000);
        await sleep(700);
        await page.eval(`history.back()`);
        await page.waitFor(settled, 8000);
      }
      const after = await steady();
      const stages = await page.eval(`document.querySelectorAll(".st-stage").length`);
      if (after !== before || stages) throw new Error(`compte ${before} au départ, ${after} après ; ${stages} .st-stage`);
      const went = await page.eval(lagged);
      if (went > 0.3) throw new Error(`le lissage de GSAP coupé : une image de 0,8 s a avancé de ${went.toFixed(2)} s`);
    });

    await check("le téléphone verrouillé (page gelée), puis une autre app devant (page cachée qui tourne), pendant le chargement des stickers de la première fois (retenus 1,5 s ; cachée avant leur arrivée, de nouveau visible 3 s après) : l'intro part du début (sa timeline à moins de 0,5 s), et la sortie reste à vivre", async () => {
      for (const away of ["lock", "hide"]) {
        await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(WELCOMED))}#/aventures`);
        await page.waitFor(`${settled(1)} && document.querySelector('.pp-slot[data-id="bivouac-1"][data-status="open"]')`, 8000);
        const held = 1500;
        await page.hold(["*/assets/aventures/*.webp"], held);
        try {
          await page.tap('.pp-slot[data-id="bivouac-1"]');
          await page.waitFor(`document.querySelector(".screen-intro .st-stage") && [...document.querySelectorAll(".st-actor__img")].some((img) => !img.complete)`, 6000);
          const mounted = Date.now();
          await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve))))`); // its mount drawn: the page free to hide
          await page[away](held + 3000 - (Date.now() - mounted));
          await page.waitFor(`document.visibilityState === "visible" && ${timeline}?.time() > 0`, 3000); // its first frame back
          const now = await page.eval(`({ t: ${timeline}.time(), hash: location.hash, save: JSON.parse(localStorage.getItem("${KEY}")) })`);
          if (now.t >= 0.5) throw new Error(`${away} : la timeline à ${now.t.toFixed(2)} s dès le retour`);
          if (now.hash !== "#/aventures/bivouac-1" || now.save?.pending?.includes("bivouac-1")) throw new Error(`${away} : ${JSON.stringify({ ...now, save: now.save?.pending })}`);
        } finally {
          await page.hold([]);
          await page.goto("about:blank");
        }
      }
    });

    await check("?demo (Premier bivouac tamponné), ses stickers retenus 3 s : « Passer ▸ » se montre avant que sa timeline ne parte", async () => {
      await page.goto(`${BASE}?demo#/aventures`);
      await page.waitFor(settled(0), 8000);
      await page.hold(["*/assets/aventures/*.webp"], 3000);
      try {
        await page.eval(`location.hash = "#/aventures/bivouac-1"`);
        await page.waitFor(skipIs("shown"), 2500).catch(() => {
          throw new Error("pas de « Passer ▸ » pendant le chargement des stickers");
        });
        const now = await page.eval(`({ paused: ${timeline}?.paused(), loading: [...document.querySelectorAll(".st-actor__img")].filter((img) => !img.complete).length })`);
        if (!now.paused || !now.loading) throw new Error(`plus en chargement : ${JSON.stringify(now)}`);
      } finally {
        await page.hold([]);
        await page.goto("about:blank");
      }
    });

    await check(`?demo&t=${beat["La voiture"].at} : « Passer ▸ » avant les « Meuh ! » et le « Ouaf ! » : sa timeline s'arrête au toucher, plus rien n'en part ; puis le passeport`, async () => {
      await page.goto(`${BASE}?demo&t=${beat["La voiture"].at}#/aventures/bivouac-1`);
      await page.waitFor(`${playing} && ${skipIs("shown")}`, 8000);
      // just after the touch (the screen's own listener has run), and 250 ms later: the screen still there till then
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

    const posterAt = beat["L'affiche"].at;
    const onPoster = +(posterAt + 0.3).toFixed(2); // s, a moment just into it
    await check(`?demo : « Passer ▸ » s'efface quand l'affiche commence (${posterAt} s), et ?demo&t= sur l'affiche la montre sans lui ; un toucher n'importe où passe toujours l'intro`, async () => {
      await page.goto(`${BASE}?demo&t=${+(posterAt - 2).toFixed(2)}#/aventures/bivouac-1`);
      await page.waitFor(`${playing} && ${skipIs("shown")}`, 8000);
      const before = await page.eval(`${timeline}.time()`);
      if (before >= posterAt) throw new Error(`déjà à ${before.toFixed(2)} s quand « Passer ▸ » se montre`);
      await page.waitFor(`${timeline}.time() > ${posterAt + 0.5}`, 5000);
      if (!(await page.eval(skipIs("gone")))) throw new Error("« Passer ▸ » toujours là sur l'affiche");
      await page.goto(`${BASE}?demo&t=${onPoster}#/aventures/bivouac-1`);
      await page.waitFor(playing, 8000);
      await sleep(1300); // past the time it would have come in
      if (!(await page.eval(skipIs("gone")))) throw new Error(`?demo&t=${onPoster} : « Passer ▸ » sur l'affiche`);
      const t = await page.eval(`${timeline}.time()`);
      if (t > (await page.eval(length)) / 1000 - 0.3) throw new Error(`l'intro déjà finie (${t.toFixed(2)} s) : le toucher ne dirait rien`);
      await page.tap(".screen-intro");
      await page.waitFor(atPassport, 3000);
    });

    await check("?decodage-rejete : decode() rejeté sur un sticker pourtant arrivé (Cycy de face en joie) : il garde son sticker, pas son remplaçant", async () => {
      await page.goto(`${BASE}?demo&decodage-rejete#/aventures/bivouac-1`);
      await page.waitFor(playing, 8000);
      const now = await page.eval(`({ rejected: window.__rejected ?? 0, looks: [...document.querySelectorAll('.st-actor[data-who="cycy"] .st-actor__img')].map((img) => ({ src: new URL(img.src).pathname, fell: img.dataset.fell ?? null })) })`);
      if (!now.rejected) throw new Error("aucun decode() rejeté");
      const wrong = now.looks.filter((look) => look.fell || !look.src.startsWith("/assets/aventures/bivouac-1/cycy-"));
      if (wrong.length) throw new Error(`sur son remplaçant : ${JSON.stringify(wrong)}`);
      await page.goto("about:blank");
    });

    await check("le passeport posé (une visite suivante, Premier bivouac à vivre) : le fichier de son scénario est déjà demandé, une fois le livre arrivé ; le toucher sur Premier bivouac ne le redemande pas", async () => {
      await page.goto(`${BASE}?graine=${encodeURIComponent(JSON.stringify(WELCOMED))}#/aventures`);
      await page.waitFor(`window.__landedAt`, 8000);
      await page.waitFor(`${scenarioAsked}.length === 1`, 3000).catch(async () => {
        throw new Error(`demandé ${await page.eval(`${scenarioAsked}.length`)} fois, le passeport posé`);
      });
      const after = await page.eval(`${scenarioAsked}[0].startTime - window.__landedAt`);
      if (after < -20) throw new Error(`demandé ${Math.round(-after)} ms avant que le livre soit posé`); // a frame's leeway
      await page.waitFor(settled(1), 8000);
      await page.tap('.pp-slot[data-id="bivouac-1"]');
      await page.waitFor(loaded, 8000);
      const asked = await page.eval(`${scenarioAsked}.length`);
      await page.goto("about:blank");
      if (asked !== 1) throw new Error(`redemandé au toucher : ${asked} demandes`);
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

  if (SHOTS) {
    // the middle of each moment, held still, on this screen (and the phone turned); the demo banner hidden
    const turned = vp.turned ? [[vp.width, vp.height], [852, 393]] : [[vp.width, vp.height]];
    for (const [width, height] of turned) {
      await page.resize(width, height);
      try {
        for (const [name, { mid }] of Object.entries(beat)) {
          await page.goto(`${BASE}?demo&t=${mid}#/aventures/bivouac-1`);
          await page.waitFor(`innerWidth === ${width} && ${playing}`, 8000);
          await sleep(250);
          await page.eval(holdAt(mid));
          await page.eval(`document.querySelectorAll(".demo-badge").forEach((el) => (el.style.display = "none"))`);
          await page.screenshot(join(SHOTS, `${String(Object.keys(beat).indexOf(name) + 1).padStart(2, "0")}-${name.replace(/[^a-z]+/gi, "-").toLowerCase()}-${width}x${height}.png`));
        }
      } finally {
        await page.resize(vp.width, vp.height);
      }
    }
  }

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
