// End-to-end checks of the passport (#/aventures) and the outings' intros, in headless Chrome, on two phones and a PC.
// Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/aventures.mjs` (ONLY=PC: a single
// screen; SHOTS=<folder> keeps a screenshot of page 0, of a page of stamps, of the welcome's end and of an intro per
// screen).
// Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { content } from "../../js/content.js";
import { fill } from "../../js/logic.js";
import { AVENTURES } from "../../js/aventures/data.js";
import { monthYear, pageOf, sanitizeProgress, statuses } from "../../js/aventures/logic.js";

const BASE = process.env.BASE || "http://localhost:5173/";
const SHOTS = process.env.SHOTS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = [
  { name: "iPhone 393 × 852", width: 393, height: 852, mobile: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false },
];
const KEY = "swap-cyrielle:aventures";
const ids = AVENTURES.map((a) => a.id);
const INKS = JSON.parse(readFileSync(new URL("../../assets/aventures/tampons/tampons.json", import.meta.url), "utf8"));
const FALLBACK_INK = "#7A1F35"; // a stamp tampons.json does not give
const LENGTH = 4500; // ms, an intro (js/aventures/intro.js)
// The intros' clock, in the page from its first line: __introAt, when the last intro came on screen (just after its
// enter()), in performance.now() ms; __introEnd, how long after that it ended (its address left, or its stamp began to
// wait), null while it runs. Kept by the page itself, so a slow check (a screenshot) does not shift what it reads.
const INTRO_CLOCK = `new MutationObserver(() => {
  const el = document.querySelector("#app > .screen-intro");
  if (!el || el === window.__intro) return;
  const at = performance.now();
  Object.assign(window, { __intro: el, __introAt: at, __introEnd: null });
  const watch = setInterval(() => {
    if (window.__intro !== el) return clearInterval(watch);
    const { id } = el.dataset;
    if (location.hash === "#/aventures/" + id && !JSON.parse(localStorage.getItem("${KEY}"))?.pending?.includes(id)) return;
    window.__introEnd = performance.now() - at;
    clearInterval(watch);
  }, 20);
}).observe(document, { childList: true, subtree: true });`;

// The book, in the page from its first line: __bookOpen = { at, page }, the first time it is open and landed; __turnAt,
// when a leaf first starts turning after that (at: in performance.now() ms, from the start of the page's load).
const BOOK_CLOCK = `new MutationObserver(() => {
  const book = document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]');
  if (book && !window.__bookOpen) window.__bookOpen = { at: performance.now(), page: book.dataset.page };
  else if (book?.classList.contains("is-turning") && !window.__turnAt) window.__turnAt = performance.now();
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["class", "data-open"] });`;
// ?graine=<a passport save, or nothing>: a new profile (storage cleared) holding that save, set before the site's first
// line; the address then drops it, so a reload keeps what the page has saved since
const SEED = `{
  const seed = new URLSearchParams(location.search).get("graine");
  if (seed !== null) {
    localStorage.clear();
    sessionStorage.clear();
    if (seed) localStorage.setItem("${KEY}", seed);
    history.replaceState(null, "", location.pathname + location.hash);
  }
}`;
// ?stockage-bloque: localStorage and sessionStorage throw as soon as they are touched (blocked cookies, some private modes)
const NO_STORAGE = `if (location.search.includes("stockage-bloque"))
  for (const name of ["localStorage", "sessionStorage"])
    Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException("The operation is insecure.", "SecurityError"); } });`;

// Mini Cycy's lines, as content.js writes them (the page may put no-break spaces in: read as spaces)
const A = content.aventures;
const nameOf = (id) => AVENTURES.find((a) => a.id === id).name;
const WELCOME = A.welcome.map((line) => fill(line, { since: monthYear(AVENTURES.map((a) => a.from).sort()[0]), n: AVENTURES.length }));
const LOCKED = A.locked.map((line) => fill(line, { next: nameOf("bivouac-1") }));
const WELCOMED = { welcomed: true, known: ids }; // a save whose welcome is seen, nothing lived

const book = `document.querySelector(".pp-book")`;
const opened = `document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]')`; // open, and landed
const hiddenBook = `getComputedStyle(${book}).visibility === "hidden"`;
const buddy = `document.querySelector(".screen-passport .aventures-buddy")`;
const said = `[...document.querySelectorAll(".bubble")].filter((b) => !b.hidden).map((b) => b.textContent.replace(/\\u00a0/g, " "))`;
/** One bubble on show, saying exactly `text` (written out). */
const saying = (text) => `JSON.stringify(${said}) === ${JSON.stringify(JSON.stringify([text]))}`;
const onPage = (n) => `${book}?.dataset.page === "${n}"`;
const slot = (id) => `.pp-slot[data-id="${id}"]`;
const intro = (skippable) => `document.querySelector('.screen-intro[data-skippable="${skippable}"]')`;
const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;

async function suite(page, vp) {
  const check = checker(page);
  await page.beforeLoad(INTRO_CLOCK);
  await page.beforeLoad(BOOK_CLOCK);
  await page.beforeLoad(SEED);
  await page.beforeLoad(NO_STORAGE);
  const shown = () => page.eval(`Number(${book}.dataset.page)`);
  const saved = () => page.eval(`JSON.parse(localStorage.getItem("${KEY}"))`);
  /** A tap or a swipe that must not move the book (a bound). */
  async function stays(n, gesture) {
    await gesture();
    await sleep(900);
    if ((await shown()) !== n) throw new Error(`page ${await shown()} au lieu de ${n}`);
  }
  const shot = async (name) => SHOTS && page.screenshot(join(SHOTS, `${name}-${vp.width}x${vp.height}.png`));
  /** An outing's status, from the save. */
  const statusOf = async (id) => statuses(AVENTURES, sanitizeProgress(await saved(), ids))[id];
  /** `hash` in a new profile (storage cleared) holding this passport save, if any (SEED). */
  const seeded = (hash, save = null) => page.goto(`${BASE}?graine=${save ? encodeURIComponent(JSON.stringify(save)) : ""}${hash}`);
  /** A fresh profile whose welcome is seen (the book itself is under test), the passport open on the outing to live
   *  (page 1), its screen fully in: on a slow machine the book (by the clock) can land before the screen's fade-in (a
   *  GSAP tween) is over, and a touch then is ignored. */
  async function fresh() {
    await seeded(`#/aventures`, WELCOMED);
    await page.waitFor(`${opened} && ${onPage(1)} && !gsap.isTweening(document.querySelector(".screen-passport"))`, 8000);
  }
  /** Back on the passport, opened at once on `page` (no arrival), Mini Cycy there without a word: checked as soon as
   *  its screen is in. */
  async function backOn(n, timeout) {
    await page.waitFor(atPassport, timeout);
    const at = await page.eval(`({ open: ${book}?.dataset.open, page: ${book}?.dataset.page, buddy: Boolean(${buddy}), said: ${said} })`);
    if (at.open !== "true" || at.page !== String(n)) throw new Error(`passeport ${at.open === "true" ? "ouvert" : "fermé"} sur la page ${at.page}, pas déjà ouvert sur la ${n}`);
    if (!at.buddy || at.said.length) throw new Error(`retour d'une intro : Mini Cycy ${at.buddy ? "là" : "absente"}, bulles ${JSON.stringify(at.said)}`);
  }
  /** A touch in the middle of a first-time intro that must change nothing. An intro that ended well before its 4.5 s
   *  was ended by the touch; one that ended at its time, by its clock (the page's clock says which). */
  async function untouchable(id) {
    const before = await page.eval(`({ t: performance.now() - window.__introAt, end: window.__introEnd, id: window.__intro?.dataset.id })`);
    if (before.id !== id || before.end !== null || before.t > LENGTH - 1000) throw new Error(`pas d'intro de ${id} à toucher : ${JSON.stringify(before)}`);
    await page.tap(".screen-intro");
    await page.waitFor(`performance.now() - window.__introAt > ${Math.min(before.t + 600, LENGTH - 300)}`, 5000);
    const end = await page.eval(`window.__introEnd`);
    if (end !== null && end < LENGTH - 300) throw new Error(`un toucher a passé l'intro (finie ${Math.round(end)} ms après son début)`);
  }
  /** From the hub, a fresh profile whose welcome is seen: the passport by its card, open on the outing to live. */
  async function viaHub() {
    await seeded(`#/`, WELCOMED);
    const hub = `document.querySelector(".screen-hub")`;
    await page.waitFor(`${hub} && [...document.querySelectorAll(".screen-hub, .hub-card, .hub-buddies")].every((el) => !gsap.isTweening(el))`, 8000);
    if ((await page.eval(`${hub}.dataset.current`)) !== "aventures") {
      await page.tap(`.hub-dot:nth-child(3)`); // its card may be two notches away, off the screen
      await page.waitFor(`${hub}.dataset.current === "aventures"`, 4000);
      await sleep(600); // the smooth scroll settles
    }
    await page.tap(`[data-world="aventures"]`);
    await page.waitFor(`!document.querySelector(".plate") && ${opened} && ${onPage(1)}`, 12000); // the plate gone: a touch counts
  }

  await check("?demo#/aventures : le passeport arrive et s'ouvre en moins de 4 s, avec ses 15 tampons chargés", async () => {
    await page.goto(`${BASE}?demo#/aventures`);
    await page.waitFor(`document.querySelector(".screen-aventures.screen-passport") && document.querySelector(".world-back")`, 4000);
    await page.waitFor(opened, 4000);
    const count = await page.eval(`document.querySelectorAll(".pp-stamp").length`);
    if (count !== 15) throw new Error(`${count} tampons`);
    await page.waitFor(`[...document.querySelectorAll(".pp-stamp")].every((img) => img.complete && img.naturalWidth > 0)`, 5000);
    await page.waitFor(onPage(0), 2000);
    await sleep(600);
    await shot("identity");
  });

  await check("?demo#/aventures : Mini Cycy dit « On repart où aujourd'hui ? », sa seule bulle", async () => {
    await page.waitFor(`${buddy} && ${saying(A.again.complete)}`, 3000);
  });

  await check("‹ › et le glisser tournent les pages une à une", async () => {
    await page.tap(".pp-next");
    await page.waitFor(onPage(1), 2000);
    await page.swipe(".pp-book", -150); // the finger to the left: the next page
    await page.waitFor(onPage(2), 2000);
    await page.swipe(".pp-book", 150); // to the right: back
    await page.waitFor(onPage(1), 2000);
    await sleep(400);
    await shot("stamps");
  });

  if (!vp.mobile)
    await check("à la souris : un glisser relâché hors du livre ne reste pas collé, un vrai glisser tourne la page", async () => {
      const r = await page.eval(`(() => {
        const b = ${book}.getBoundingClientRect();
        return { left: b.left, right: b.right, y: (b.top + b.bottom) / 2 };
      })()`);
      const edge = r.right - 16;
      const out = r.right + 60;
      if (await page.eval(`Boolean(document.elementFromPoint(${out}, ${r.y})?.closest(".pp-book"))`)) throw new Error("le point de sortie est encore sur le livre");
      const still = () =>
        page.eval(`!document.querySelector(".pp-leaf.is-dragged, .pp-book.is-turning")
          && [...document.querySelectorAll(".pp-leaf")].every((leaf) => /^rotateY\\((0|-180)deg\\)$/.test(leaf.style.transform))`);
      // pressed near the edge, moved a few px, then out of the book and released there
      await page.mouse("down", edge, r.y);
      await page.mouse("move", edge - 4, r.y);
      await page.mouse("move", out, r.y);
      await page.mouse("up", out, r.y);
      // the mouse goes over the book, no button pressed
      for (let k = 1; k <= 12; k++) {
        await page.mouse("move", out - ((out - r.left - 40) * k) / 12, r.y);
        await sleep(16);
      }
      await sleep(300);
      if (!(await still())) throw new Error("une feuille suit la souris sans bouton enfoncé");
      if ((await shown()) !== 1) throw new Error(`page ${await shown()} au lieu de 1`);
      // a real drag turns the page
      await page.mouse("down", edge, r.y);
      for (let k = 1; k <= 12; k++) {
        await page.mouse("move", edge - (300 * k) / 12, r.y);
        await sleep(16);
      }
      await page.mouse("up", edge - 300, r.y);
      await page.waitFor(onPage(2), 2000);
      await page.tap(".pp-prev");
      await page.waitFor(onPage(1), 2000);
    });

  await check("les bornes : rien avant la page 0, rien après la page 9", async () => {
    await page.tap(".pp-prev");
    await page.waitFor(onPage(0), 2000);
    await stays(0, () => page.tap(".pp-prev"));
    await stays(0, () => page.swipe(".pp-book", 150));
    for (let n = 1; n <= 9; n++) {
      await page.tap(".pp-next");
      await page.waitFor(onPage(n), 2000);
    }
    await stays(9, () => page.tap(".pp-next"));
    await stays(9, () => page.swipe(".pp-book", -150));
  });

  await check("le passeport tient dans l'écran, sans défilement, Mini Cycy et sa bulle compris (la bulle sous « ‹ Accueil »)", async () => {
    const fit = await page.eval(`(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const [book, next, cycy, bubble, back] = [".pp-book", ".pp-next", ".aventures-buddy", ".pp-head .bubble", ".world-back"].map(rect);
      const doc = document.documentElement;
      const inside = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
      return { book: book.bottom, next: next.bottom, h: innerHeight, scroll: doc.scrollHeight > innerHeight || doc.scrollWidth > innerWidth,
        cycy: inside(cycy), bubble: inside(bubble) && bubble.height > 0, meets: bubble.top < back.bottom && back.left < bubble.right && bubble.left < back.right };
    })()`);
    if (fit.book > fit.h) throw new Error(`bas du livre à ${fit.book} px, écran de ${fit.h} px`);
    if (fit.next > fit.h) throw new Error(`bas des boutons à ${fit.next} px, écran de ${fit.h} px`);
    if (fit.scroll) throw new Error("la page défile");
    if (!fit.cycy || !fit.bubble) throw new Error(`hors de l'écran : ${fit.cycy ? "" : "Mini Cycy "}${fit.bubble ? "" : "sa bulle"}`);
    if (fit.meets) throw new Error("la bulle touche « ‹ Accueil »");
  });

  await check("?demo : la bannière du mode démo ne couvre aucun bouton (passeport, accueil du swap, hub)", async () => {
    const buttons = ".world-back, .home-button, .mute, .pp-prev, .pp-next, .hub-dot";
    const covered = () =>
      page.eval(`(() => {
        const badge = document.querySelector(".demo-badge")?.getBoundingClientRect();
        if (!badge) return ["pas de bannière"];
        const shows = (el, r) => !el.hidden && getComputedStyle(el).visibility !== "hidden" && r.width > 0 && r.height > 0;
        return [...document.querySelectorAll(${JSON.stringify(buttons)})].flatMap((el) => {
          const r = el.getBoundingClientRect();
          const meets = r.left < badge.right && badge.left < r.right && r.top < badge.bottom && badge.top < r.bottom;
          return shows(el, r) && meets ? [el.className] : [];
        });
      })()`);
    const screens = [
      ["?demo#/aventures", `${opened} && getComputedStyle(document.querySelector(".pp-next")).visibility === "visible"`],
      ["?demo#/swap", `document.querySelector(".home-button:not([hidden])")`],
      ["?demo#/", `document.querySelector(".hub-dot")`],
    ];
    for (const [url, ready] of screens) {
      if (url !== "?demo#/aventures") await page.goto(`${BASE}${url}`); // the passport is already open
      await page.waitFor(ready, 6000);
      await sleep(700);
      const under = await covered();
      if (under.length) throw new Error(`${url} : la bannière couvre ${under.join(", ")}`);
    }
  });

  await check("profil neuf (accueil vu) : Premier bivouac à vivre, le canoë verrouillé sans son nom ; ouvert et retenu sur sa page", async () => {
    await seeded(`#/aventures`, WELCOMED);
    await page.waitFor(`document.querySelector('.pp-slot[data-id="bivouac-1"]')`, 4000);
    if (!(await page.eval(`Boolean(document.querySelector('.pp-slot[data-id="bivouac-1"][data-status="open"]'))`))) throw new Error("bivouac-1 n'est pas à vivre");
    if (!(await page.eval(`Boolean(document.querySelector('.pp-slot[data-id="canoe"][data-status="locked"]'))`))) throw new Error("canoe n'est pas verrouillé");
    const names = await page.eval(`document.querySelectorAll('.pp-slot[data-status="locked"] .pp-slot-name').length`);
    if (names !== 0) throw new Error(`${names} noms dans des emplacements verrouillés`);
    await page.waitFor(`${opened} && ${onPage(1)}`, 6000);
    await page.waitFor(`JSON.parse(localStorage.getItem("${KEY}"))?.page === 1`, 2000);
  });

  await check("une page enregistrée trop loin (42) s'ouvre sur la dernière", async () => {
    const all = JSON.stringify({ stamped: ids, pending: [], welcomed: true, known: ids, page: 42 });
    await page.eval(`localStorage.setItem("${KEY}", ${JSON.stringify(all)})`);
    await page.reload();
    await page.waitFor(`${opened} && ${onPage(9)}`, 6000); // a later visit: already open on its page
    if ((await saved()).page !== 9) throw new Error(`page enregistrée : ${(await saved()).page}`);
  });

  // ── Mini Cycy: the welcome, the later visits, her reactions ──

  /** The touches of the welcome, two a bubble up to the 4th: the first writes the rest of a bubble, the second goes on
   *  (a bubble already written: on, then the next one written at once). After each pair, the next bubble is out in full
   *  at once (typing it takes 1 to 3 s), the book still hidden; `last` (the 3rd pair): only the first touch. */
  async function welcomePairs(targets, last = 2) {
    await page.waitFor(`${buddy} && ${saying(WELCOME[0])}`, 6000);
    if (!(await page.eval(hiddenBook))) throw new Error("le passeport se montre dès la 1re bulle");
    for (let i = 1; i <= 3; i++) {
      if (i === 3) await page.eval(`window.__fourth = performance.now()`);
      for (let k = 0; k < (i === 3 ? last : 2); k++) await page.tap(targets[i - 1]);
      if (i === 3) break;
      await page.waitFor(saying(WELCOME[i]), 700);
      if (!(await page.eval(hiddenBook))) throw new Error(`le passeport se montre dès la bulle ${i + 1}`);
    }
  }

  await check(
    "profil neuf : Mini Cycy arrive, le passeport caché ; « welcome[0] », trois fois deux touchers → « welcome[3] » ; pendant la 4e le passeport arrive (un toucher termine son arrivée : la page 0), 1,5 s après la page 1 ; welcomed et known enregistrés",
    async () => {
      await seeded(`#/aventures`);
      await welcomePairs([".bubble", ".aventures-buddy", ".pp"]); // the bubble, Mini Cycy, anywhere
      if ((await saved())?.welcomed) throw new Error("welcomed enregistré avant la fin de l'accueil");
      // the 3rd pair's second touch fell in the arrival: open on page 0 well before the 1.9 s of an arrival
      await page.waitFor(`${opened} && ${onPage(0)}`, 1500);
      const landed = await page.eval(`window.__bookOpen.at - window.__fourth`);
      if (landed > 1400) throw new Error(`ouvert ${Math.round(landed)} ms après la 4e bulle : le toucher n'a pas terminé l'arrivée`);
      await page.waitFor(saying(WELCOME[3]), 1500);
      // page 0 for 1.5 s, by the page's clock (a leaf's first turn here can wait a slow first raster: page 1 comes later)
      await page.waitFor(`${opened} && ${onPage(1)}`, 5000);
      const pause = await page.eval(`window.__turnAt - window.__bookOpen.at`);
      console.log(`    (posé ${(landed / 1000).toFixed(2)} s après la 4e bulle ; la page tourne ${(pause / 1000).toFixed(2)} s après)`);
      if (!(pause >= 1450 && pause <= 2500)) throw new Error(`la page tourne ${Math.round(pause)} ms après la page 0, pas 1,5 s`);
      const save = await saved();
      if (save?.welcomed !== true || [...(save.known || [])].sort().join() !== [...ids].sort().join()) throw new Error(`sauvegarde : ${JSON.stringify(save)}`);
      await shot("welcome-end");
    },
  );

  await check("rechargement : une seule bulle, « Re ! On en était à Premier bivouac 👀 », et le passeport ouvert sur la page 1 en moins de 1,5 s", async () => {
    await page.reload();
    await page.waitFor(`window.__bookOpen`, 5000);
    const open = await page.eval(`window.__bookOpen`);
    console.log(`    (ouvert et posé sur la page ${open.page} ${(open.at / 1000).toFixed(2)} s après le début du rechargement)`);
    if (open.page !== "1") throw new Error(`ouvert sur la page ${open.page}`);
    if (open.at > 1500) throw new Error(`ouvert ${Math.round(open.at)} ms après le début du rechargement`);
    await page.waitFor(saying("Re ! On en était à Premier bivouac 👀"), 3000);
    await sleep(1200);
    if (!(await page.eval(saying("Re ! On en était à Premier bivouac 👀")))) throw new Error(`puis : ${JSON.stringify(await page.eval(said))}`);
    if ((await page.eval(`document.querySelectorAll(".bubble").length`)) !== 1) throw new Error("plusieurs bulles");
  });

  await check('une sauvegarde { welcomed: true, known: tous sauf "royan-1" } : « Oh, un nouveau tampon à gagner : Royan ✨ », et known est mis à jour', async () => {
    await seeded(`#/aventures`, { welcomed: true, known: ids.filter((id) => id !== "royan-1") });
    await page.waitFor(saying("Oh, un nouveau tampon à gagner : Royan ✨"), 5000);
    await page.waitFor(`${opened} && ${onPage(1)}`, 3000);
    const known = (await saved())?.known || [];
    if ([...known].sort().join() !== [...ids].sort().join()) throw new Error(`known : ${JSON.stringify(known)}`);
  });

  await check("toucher un emplacement verrouillé : Mini Cycy boude (pout) et dit l'une des trois répliques locked (Premier bivouac pour {next}), jamais deux fois la même de suite", async () => {
    await fresh();
    let previous = null;
    for (let k = 0; k < 4; k++) {
      await page.tap(slot("canoe"));
      // a line written out in full, one of the three, not the one before
      await page.waitFor(`${said}.length === 1 && ${JSON.stringify(LOCKED)}.includes(${said}[0]) && ${said}[0] !== ${JSON.stringify(previous)}`, 3000).catch(async () => {
        throw new Error(`bulle : ${JSON.stringify(await page.eval(said))} (avant : ${JSON.stringify(previous)})`);
      });
      await page.waitFor(`${buddy}.querySelector(".avatar-img").src.endsWith("/pout.webp")`, 1000);
      previous = (await page.eval(said))[0];
    }
  });

  await check("partir pendant l'accueil (« ‹ Accueil » sur la page 0, juste avant la fin) : rien n'est enregistré, l'accueil revient la fois d'après", async () => {
    await seeded(`#/aventures`);
    await welcomePairs([".bubble", ".bubble", ".bubble"], 1);
    await page.waitFor(`${opened} && ${onPage(0)}`, 4000);
    await page.tap(".world-back");
    await page.waitFor(`document.querySelector(".screen-hub")`, 4000);
    await sleep(2500); // past the end the welcome would have had
    if ((await saved())?.welcomed) throw new Error(`sauvegarde : ${JSON.stringify(await saved())}`);
    await page.goto(`${BASE}#/aventures`);
    await page.waitFor(`${saying(WELCOME[0])} && ${hiddenBook}`, 6000);
  });

  await check("stockage bloqué : l'accueil se déroule, le passeport arrive (page 0) puis s'ouvre sur la page 1, sans erreur", async () => {
    await page.goto(`${BASE}?stockage-bloque#/aventures`);
    if (!(await page.eval(`(() => { try { localStorage; return false; } catch { return true; } })()`))) throw new Error("le stockage n'est pas bloqué");
    await welcomePairs([".bubble", ".bubble", ".bubble"], 1); // the arrival this time in full
    await page.waitFor(saying(WELCOME[3]), 3000);
    await page.waitFor(`${opened} && ${onPage(0)}`, 4000);
    await page.waitFor(`${opened} && ${onPage(1)}`, 4000);
  });

  // ── Living an outing: its intro, the unlocking ────────────

  await check("toucher un emplacement verrouillé : il tremble, l'adresse ne change pas", async () => {
    await fresh();
    await page.tap(slot("canoe"));
    await page.waitFor(`gsap.isTweening(document.querySelector('${slot("canoe")}'))`, 1000);
    await sleep(900);
    if ((await page.eval(`location.hash`)) !== "#/aventures") throw new Error(`adresse : ${await page.eval("location.hash")}`);
    if (await page.eval(`Boolean(document.querySelector(".screen-intro"))`)) throw new Error("une intro s'est ouverte");
  });

  await check("deux touchers à 50 ms sur l'emplacement à vivre : une seule intro, une seule entrée d'historique", async () => {
    const length = await page.eval(`history.length`);
    await page.tap(slot("bivouac-1"));
    await sleep(50);
    await page.tap(slot("bivouac-1")).catch(() => {}); // the slot may already be gone
    await page.waitFor(`location.hash === "#/aventures/bivouac-1" && ${intro(false)}`, 4000);
    await sleep(1200);
    const screens = await page.eval(`document.querySelectorAll("#app > .screen").length`);
    if (screens !== 1 || !(await page.eval(`Boolean(${intro(false)})`))) throw new Error(`${screens} écrans`);
    if ((await page.eval(`history.length`)) !== length + 1) throw new Error(`historique : ${length} → ${await page.eval(`history.length`)}`);
  });

  await check("le retour du navigateur pendant l'intro de la première fois : le passeport, déjà ouvert sur sa page ; l'aventure reste à vivre", async () => {
    await fresh();
    await page.tap(slot("bivouac-1"));
    await page.waitFor(intro(false), 4000);
    await sleep(1300);
    await page.eval(`history.back()`);
    await backOn(1, 4000);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="open"]')`, 2000);
    await page.waitFor(`performance.now() - window.__introAt > ${LENGTH + 1500}`, LENGTH + 3000); // past the end the intro would have had
    if ((await statusOf("bivouac-1")) !== "open") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    if (!(await page.eval(`${atPassport} && document.querySelector('${slot("bivouac-1")}[data-status="open"]')`))) throw new Error("l'intro a fini quand même");
  });

  await check("venu du hub, le retour du navigateur tout près de la fin de l'intro de la première fois (4,3 s, 4,45 s) : le passeport, pas le hub ; l'aventure reste à vivre", async () => {
    for (const at of [4300, 4450]) {
      for (let attempt = 1; ; attempt++) {
        await viaHub();
        await page.tap(slot("bivouac-1"));
        await page.waitFor(intro(false), 6000);
        // the back, `at` ms into the intro by the page's clock; when it arrives, has the intro already ended by itself?
        const late = await page.eval(`new Promise((resolve) => {
          addEventListener("popstate", () => resolve(Boolean(JSON.parse(localStorage.getItem("${KEY}"))?.pending?.length)), { once: true, capture: true });
          setTimeout(() => history.back(), window.__introAt + ${at} - performance.now());
        })`);
        if (late) {
          // a busy machine: the back arrived after the intro's own end, nothing to judge
          if (attempt === 3) throw new Error(`à ${at} ms, le retour est arrivé trois fois après la fin de l'intro`);
          console.log(`    (à ${at} ms : le retour est arrivé après la fin de l'intro, essai suivant)`);
          continue;
        }
        await page.waitFor(`performance.now() - window.__introAt > ${LENGTH + 2000}`, 6000); // past its end, and a step back more
        const now = await page.eval(`({ hash: location.hash, hub: Boolean(document.querySelector(".screen-hub")), screens: document.querySelectorAll("#app > .screen").length,
          passport: Boolean(document.querySelector(".screen-passport")), slot: document.querySelector('${slot("bivouac-1")}')?.dataset.status })`);
        if (now.hash !== "#/aventures" || now.hub || !now.passport || now.screens !== 1) throw new Error(`à ${at} ms : ${JSON.stringify(now)}`);
        if (now.slot !== "open" || (await statusOf("bivouac-1")) !== "open") throw new Error(`à ${at} ms : emplacement ${now.slot}, statut enregistré ${await statusOf("bivouac-1")}`);
        if ((await saved()).pending.length) throw new Error(`à ${at} ms : pending ${JSON.stringify((await saved()).pending)}`);
        break;
      }
    }
  });

  await check("recharger pendant l'intro de la première fois : elle repart en entier, impossible à passer ; l'aventure reste à vivre, puis son tampon attend, même après un rechargement", async () => {
    await fresh();
    await page.tap(slot("bivouac-1"));
    await page.waitFor(intro(false), 4000);
    await sleep(1500);
    await page.reload();
    await page.waitFor(intro(false), 6000);
    const begun = Date.now();
    if ((await page.eval(`location.hash`)) !== "#/aventures/bivouac-1") throw new Error(`adresse : ${await page.eval("location.hash")}`);
    if (await page.eval(`Boolean(document.querySelector(".intro-skip"))`)) throw new Error("un bouton « Passer »");
    if ((await statusOf("bivouac-1")) !== "open") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    await sleep(400);
    await untouchable("bivouac-1");
    await backOn(1, 7000);
    const took = Date.now() - begun;
    if (took < 4000) throw new Error(`l'intro n'a duré que ${took} ms`);
    if (!(await saved()).pending.includes("bivouac-1")) throw new Error(`pending : ${JSON.stringify((await saved()).pending)}`);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 1000);
    await page.reload();
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 6000);
  });

  await check("profil neuf : toucher Premier bivouac ouvre son intro, impossible à passer ; en moins de 7 s, le passeport déjà ouvert sur sa page, son tampon attend", async () => {
    await fresh();
    const begun = Date.now();
    await page.tap(slot("bivouac-1"));
    await page.waitFor(`location.hash === "#/aventures/bivouac-1" && ${intro(false)}`, 4000);
    if ((await page.eval(`document.querySelector(".screen-intro").dataset.id`)) !== "bivouac-1") throw new Error("data-id");
    if (await page.eval(`Boolean(document.querySelector(".intro-skip"))`)) throw new Error("un bouton « Passer »");
    await sleep(1800);
    await untouchable("bivouac-1");
    await backOn(1, Math.max(0, 7000 - (Date.now() - begun)));
    console.log(`    (retour en ${((Date.now() - begun) / 1000).toFixed(2)} s)`);
    if (!(await saved()).pending.includes("bivouac-1")) throw new Error(`pending : ${JSON.stringify((await saved()).pending)}`);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 1000);
  });

  await check("le tampon attend : toucher un emplacement verrouillé ou celui à tamponner ne change pas l'adresse ; #/aventures/bivouac-1 (par l'avant du navigateur, ou en lien) ramène au passeport", async () => {
    for (const id of ["canoe", "bivouac-1"]) {
      await page.tap(slot(id));
      await sleep(900);
      if ((await page.eval(`location.hash`)) !== "#/aventures") throw new Error(`${id} : adresse ${await page.eval("location.hash")}`);
    }
    // the browser's forward to it (the intro's entry) while the passport flies in: it stays, and lands
    await page.reload();
    await page.waitFor(`document.querySelector(".screen-passport")`, 6000);
    const flying = await page.eval(`(() => { const open = ${opened}; history.forward(); return !open; })()`);
    await page.waitFor(`${atPassport} && ${opened}`, 8000);
    if (await page.eval(`document.querySelector(".pp").hidden`)) throw new Error("le passeport est caché");
    if (!flying) console.log("    (le passeport était déjà ouvert : l'avant n'a pas été essayé pendant l'arrivée)");
    await page.goto(`${BASE}#/aventures/bivouac-1`);
    await page.waitFor(atPassport, 4000);
    await page.waitFor(opened, 8000);
    if (await page.eval(`Boolean(document.querySelector(".screen-intro"))`)) throw new Error("une intro s'est ouverte");
  });

  await check("profil neuf (accueil vu) : /#/aventures/espelette (verrouillée) et /#/aventures/inconnue mènent au passeport, sur #/aventures", async () => {
    for (const id of ["espelette", "inconnue"]) {
      await seeded(`#/aventures/${id}`, WELCOMED);
      await page.waitFor(atPassport, 4000);
      await page.waitFor(`${opened} && ${onPage(1)}`, 8000);
      if (await page.eval(`Boolean(document.querySelector(".screen-intro"))`)) throw new Error(`${id} : une intro s'est ouverte`);
    }
  });

  await check("?demo#/aventures/roadtrip : « Passer ▸ », ou un toucher n'importe où, ramène en moins de 1,5 s au passeport ouvert sur sa page", async () => {
    for (const target of [".intro-skip", ".screen-intro"]) {
      await page.goto(`${BASE}?demo#/aventures/roadtrip`);
      await page.waitFor(`${intro(true)} && document.querySelector(".intro-skip")`, 6000);
      const label = await page.eval(`document.querySelector(".intro-skip").textContent`);
      if (label !== "Passer ▸") throw new Error(`bouton : « ${label} »`);
      await sleep(1600);
      const begun = Date.now();
      await page.tap(target);
      await backOn(pageOf(AVENTURES, "roadtrip"), 1500);
      console.log(`    (${target} : retour en ${((Date.now() - begun) / 1000).toFixed(2)} s)`);
    }
    await sleep(1200);
    if ((await page.eval(said)).length) throw new Error(`retour d'une intro : une bulle après coup, ${JSON.stringify(await page.eval(said))}`);
  });

  await check(
    "tampons.json introuvable : l'intro de roadtrip prend l'encre par défaut, le passeport ses tampons droits, sans autre erreur ; il est relu à l'intro suivante",
    async () => {
      const before = page.errors.length;
      const ink = () => page.eval(`document.querySelector(".screen-intro")?.style.getPropertyValue("--in-ink").toUpperCase()`);
      await page.block(["*tampons.json*"]);
      await page.goto(`${BASE}?demo#/aventures/roadtrip`);
      await page.waitFor(`${intro(true)} && document.querySelector(".intro-skip")`, 6000);
      if ((await ink()) !== FALLBACK_INK) throw new Error(`encre : ${await ink()}`);
      await page.tap(".intro-skip");
      await backOn(pageOf(AVENTURES, "roadtrip"), 3000);
      const tilts = await page.eval(`[...document.querySelectorAll(".pp-stamp")].map((s) => s.style.getPropertyValue("--tilt"))`);
      if (tilts.length !== 15 || tilts.some((t) => t !== "0deg")) throw new Error(`tampons : ${tilts.join(" ")}`);
      // the file is back: the next intro reads it (a failed read is not kept)
      await page.block([]);
      await page.waitFor(`getComputedStyle(document.querySelector(".screen-passport")).opacity === "1"`, 3000); // in: a touch counts
      await page.tap(slot("roadtrip"));
      await page.waitFor(intro(true), 4000);
      const real = INKS.find((s) => s.id === "roadtrip").ink.toUpperCase();
      if ((await ink()) !== real) throw new Error(`encre après coup : ${await ink()} au lieu de ${real}`);
      const others = page.errors.slice(before).filter((e) => !e.includes("tampons.json"));
      if (others.length) throw new Error(`erreur dans la page : ${others.join(" | ")}`);
    },
    { allowErrors: true }, // the blocked file's own failure; any other error still fails the check
  );

  await check("?demo&tampon=roadtrip#/aventures/roadtrip (son tampon attend) : refusée, le passeport, sur #/aventures", async () => {
    await page.goto(`${BASE}?demo&tampon=roadtrip#/aventures/roadtrip`);
    await page.waitFor(atPassport, 4000);
    await page.waitFor(opened, 8000);
    if (await page.eval(`Boolean(document.querySelector(".screen-intro"))`)) throw new Error("une intro s'est ouverte");
    if (!(await page.eval(`Boolean(document.querySelector('${slot("roadtrip")}[data-status="pending"]'))`))) throw new Error("roadtrip n'attend pas son tampon");
  });

  if (SHOTS) {
    // an intro once its sign hangs (not in a timed check: a screenshot can take seconds here)
    await page.goto(`${BASE}?demo#/aventures/roadtrip`);
    await page.waitFor(intro(true), 6000);
    await sleep(2200);
    await shot("intro");
  }
}

for (const vp of VIEWPORTS.filter((v) => !process.env.ONLY || v.name.includes(process.env.ONLY))) {
  console.log(`— ${vp.name}`);
  const page = await launch(vp);
  await suite(page, vp);
  await page.close();
}
console.log("Tout est bon.");
