// End-to-end checks of the passport (#/aventures) and the outings' intros, in headless Chrome, on two phones and a PC.
// Needs the site running (`node tests/e2e/serve.mjs`, port 5173), then `node tests/e2e/aventures.mjs` (ONLY=PC: a single
// screen; SHOTS=<folder> keeps a screenshot of page 0, of a page of stamps, of the welcome's end, of the rubber stamp
// waiting, of the passport complete (its fireworks) and of an intro per screen).
// Stops at the first failure (exit code 1). A check also fails if the page logged an error.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "./cdp.mjs";
import { check as checker } from "./check.mjs";
import { content } from "../../js/content.js";
import { fill } from "../../js/logic.js";
import { AVENTURES } from "../../js/aventures/data.js";
import { SCENARIOS } from "../../js/aventures/intros/index.js";
import { monthYear, pageOf, passportPages, sanitizeProgress, statuses } from "../../js/aventures/logic.js";

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
let landscaped = false; // the phone-in-landscape check has run (once a run)
const INKS = JSON.parse(readFileSync(new URL("../../assets/aventures/tampons/tampons.json", import.meta.url), "utf8"));
const FALLBACK_INK = "#7A1F35"; // a stamp tampons.json does not give
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
    let lived = false;
    try {
      lived = JSON.parse(localStorage.getItem("${KEY}"))?.pending?.includes(id);
    } catch {} // blocked storage: by its address alone
    if (location.hash === "#/aventures/" + id && !lived) return;
    window.__introEnd = performance.now() - at;
    clearInterval(watch);
  }, 20);
}).observe(document, { childList: true, subtree: true });`;

// The book, in the page from its first line (at: in performance.now() ms, from the start of the page's load):
// __open = { at, page }, the first time it is open, landed or still rising; __bookOpen = { at, page }, the first time it
// is open and landed; __turnAt, when a leaf first starts turning after that; __turned, when the book first has a leaf
// turning at all (the cover of an arrival counts); __pages, the pages it has shown (out of its hiding), in order.
const BOOK_CLOCK = `new MutationObserver(() => {
  const pp = document.querySelector(".pp");
  const any = pp?.querySelector(".pp-book");
  if (!any) return;
  const at = performance.now();
  if (!pp.classList.contains("is-away") && (window.__pages ??= []).at(-1) !== any.dataset.page) window.__pages.push(any.dataset.page);
  if (any.classList.contains("is-turning")) window.__turned ??= at;
  if (any.dataset.open === "true") window.__open ??= { at, page: any.dataset.page };
  const book = document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]');
  if (book && !window.__bookOpen) window.__bookOpen = { at, page: book.dataset.page };
  else if (book?.classList.contains("is-turning") && !window.__turnAt) window.__turnAt = at;
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["class", "data-open", "data-page"] });`;
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
// The passport's saves, in the page (after SEED): __welcomedAt, when the page first saved a welcome seen (performance.now()
// ms). By the page's clock: a slow first raster of the open book can hold the page, and a check's next look, for 1 to 2 s.
const SAVE_CLOCK = `{
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === "${KEY}" && !window.__welcomedAt && String(value).includes('"welcomed":true')) window.__welcomedAt = performance.now();
    return set.call(this, key, value);
  };
}`;
// ?stockage-bloque: localStorage and sessionStorage throw as soon as they are touched (blocked cookies, some private modes)
const NO_STORAGE = `if (location.search.includes("stockage-bloque"))
  for (const name of ["localStorage", "sessionStorage"])
    Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException("The operation is insecure.", "SecurityError"); } });`;

// The audio's wake-up (main.js), in the page from its first line: __unlocks, the document's events that call unlockAudio
// once (the bench plays sound without a touch: what iOS needs, the end of a touch, is checked here by its listeners)
const AUDIO_SPY = `{
  const add = document.addEventListener;
  document.addEventListener = function (type, listener, options) {
    if (listener?.name === "unlockAudio" && options?.once && options?.capture) (window.__unlocks ??= []).push(type);
    return add.call(this, type, listener, options);
  };
}`;

// Mini Cycy's lines, as content.js writes them (the page may put no-break spaces in: read as spaces)
const A = content.aventures;
const nameOf = (id) => AVENTURES.find((a) => a.id === id).name;
const WELCOME = A.welcome.map((line) => fill(line, { since: monthYear(AVENTURES.map((a) => a.from).sort()[0]), n: AVENTURES.length }));
const LOCKED = A.locked.map((line) => fill(line, { next: nameOf("bivouac-1") }));
const STAMPED = (next) => A.stamped.map((line) => fill(line, { next: nameOf(next) })); // after a stamp, `next` to live
const WELCOMED = { welcomed: true, known: ids }; // a save whose welcome is seen, nothing lived
const LONGEST = AVENTURES.reduce((a, b) => (b.name.length > a.name.length ? b : a)); // the outing with the longest name
const nbsp = (name) => name.replace(/ /g, "\u00a0"); // an outing's name in her bubble: never broken

// The rubber stamp, in the page: __toolAt, when a .pp-tool last came on screen; __nudgeAt, when Mini Cycy began a nudge
// since (her bubble's data-say), in performance.now() ms; __said, every line she began (data-say); __vibes, the
// vibrations asked for (a « TCHAC » is [25]), its own navigator.vibrate standing in for the phone's; __tchacAt, when
// the first « TCHAC » was asked for (the contact).
const TOOL_CLOCK = `{
  navigator.vibrate = (pattern) => {
    const vibe = JSON.stringify(pattern);
    (window.__vibes ??= []).push(vibe);
    if (vibe === "[25]") window.__tchacAt ??= performance.now();
    return true;
  };
  const nudges = ${JSON.stringify(A.nudge)};
  new MutationObserver((records) => {
    const tool = document.querySelector(".pp-tool");
    if (tool && tool !== window.__tool) Object.assign(window, { __tool: tool, __toolAt: performance.now(), __nudgeAt: null });
    for (const r of records) {
      if (r.attributeName !== "data-say") continue;
      const say = r.target.dataset.say.replace(/\\u00a0/g, " ");
      (window.__said ??= []).push(say);
      if (window.__tool && window.__nudgeAt === null && nudges.includes(say)) window.__nudgeAt = performance.now();
    }
  }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-say"] });
}`;

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
const introLength = `Number(window.__intro?.dataset.length)`; // ms, how long the last intro on screen lasts, as it says
const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
const waiting = `document.querySelector('.pp-tool[data-state="waiting"]')`; // the rubber stamp down, floating, untouched
const stampOn = (id) => `document.querySelector('.pp-stamp[data-id="${id}"]')`;
const saysNow = `(document.querySelector(".pp-head .bubble")?.dataset.say || "").replace(/\\u00a0/g, " ")`; // the line begun
const tchacs = `(window.__vibes || []).filter((v) => v === "[25]").length`;

async function suite(page, vp) {
  const check = checker(page);
  await page.beforeLoad(INTRO_CLOCK);
  await page.beforeLoad(BOOK_CLOCK);
  await page.beforeLoad(SEED);
  await page.beforeLoad(SAVE_CLOCK);
  await page.beforeLoad(NO_STORAGE);
  await page.beforeLoad(TOOL_CLOCK);
  await page.beforeLoad(AUDIO_SPY);
  const shown =() => page.eval(`Number(${book}.dataset.page)`);
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
  /** A touch in the middle of a first-time intro that must change nothing. An intro that ended well before its length
   *  was ended by the touch; one that ended at its time, by its clock (the page's clock says which). */
  async function untouchable(id) {
    const before = await page.eval(`({ t: performance.now() - window.__introAt, end: window.__introEnd, id: window.__intro?.dataset.id, length: ${introLength} })`);
    if (before.id !== id || before.end !== null || before.t > before.length - 1000) throw new Error(`pas d'intro de ${id} à toucher : ${JSON.stringify(before)}`);
    await page.tap(".screen-intro");
    await page.waitFor(`performance.now() - window.__introAt > ${Math.min(before.t + 600, before.length - 300)}`, 5000);
    const end = await page.eval(`window.__introEnd`);
    if (end !== null && end < before.length - 300) throw new Error(`un toucher a passé l'intro (finie ${Math.round(end)} ms après son début)`);
  }
  /** The hub on screen (alone, its entrance over): a touch on the passport's card. */
  async function throughCard() {
    const hub = `document.querySelector(".screen-hub")`;
    await page.waitFor(`${hub} && document.querySelectorAll("#app > .screen").length === 1 && !document.querySelector(".plate")
      && [...document.querySelectorAll(".screen-hub, .hub-card, .hub-buddies")].every((el) => !gsap.isTweening(el))`, 8000);
    if ((await page.eval(`${hub}.dataset.current`)) !== "aventures") {
      await page.tap(`.hub-dot:nth-child(3)`); // its card may be two notches away, off the screen
      await page.waitFor(`${hub}.dataset.current === "aventures"`, 4000);
      await sleep(600); // the smooth scroll settles
    }
    await page.tap(`[data-world="aventures"]`);
  }
  /** From the hub, a fresh profile whose welcome is seen: the passport by its card, open on the outing to live. */
  async function viaHub() {
    await seeded(`#/`, WELCOMED);
    await throughCard();
    await page.waitFor(`!document.querySelector(".plate") && ${opened} && ${onPage(1)}`, 12000); // the plate gone: a touch counts
  }
  /** The page's clock for the next touch: __tapAt (performance.now() ms); __said, __vibes and __tchacAt start empty. */
  const armTap = () =>
    page.eval(`window.__said = []; window.__vibes = []; window.__tchacAt = undefined; addEventListener("pointerdown", () => (window.__tapAt = performance.now()), { capture: true, once: true })`);
  /** A first touch that does nothing (Mini Cycy, her line written out: no stamp, no page turned, no line passed). The
   *  audio wakes up at a document's first touch (main.js); in the app, the hub, the slot and the intro have long been
   *  touched by the time the stamp is: a timed touch after this one measures the passport, not the waking. */
  async function warmUp() {
    await page.waitFor(`(() => { const b = document.querySelector(".pp-head .bubble"); return b.hidden || b.textContent === b.dataset.say; })()`, 5000);
    const state = `JSON.stringify({ page: ${book}.dataset.page, say: ${saysNow}, said: ${said}, tool: Boolean(${waiting}), tchacs: ${tchacs},
      slots: [...document.querySelectorAll(".pp-slot")].map((s) => s.dataset.status).join() })`;
    const before = await page.eval(`window.__touched = false; addEventListener("click", () => (window.__touched = true), { once: true }); ${state}`);
    await page.tap(".aventures-buddy");
    await page.waitFor(`window.__touched`, 2000);
    const after = await page.eval(state);
    if (after !== before) throw new Error(`le toucher neutre a changé quelque chose : ${before} → ${after}`);
  }
  /** How long after the timed touch its contact came (its « TCHAC »), in s, for the logs. */
  const contactAt = async () => {
    const t = await page.eval(`window.__tchacAt === undefined ? null : window.__tchacAt - window.__tapAt`);
    return t === null ? "jamais" : `${(t / 1000).toFixed(2)} s`;
  };
  /** How long after that touch `condition` first held, by the page's clock; null if not within `ms` + 2 s. */
  const since = (condition, ms) =>
    page.eval(`new Promise((resolve) => {
      const tick = () => {
        const t = performance.now() - window.__tapAt;
        if (${condition}) return resolve(Math.round(t));
        if (t > ${ms + 2000}) return resolve(null);
        setTimeout(tick, 15);
      };
      tick();
    })`);
  /** The passport with its rubber stamp down over `id` (floating, untouched), its screen fully in: a touch counts. */
  async function toolOn(id) {
    await page.waitFor(`${waiting} && ${opened} && !gsap.isTweening(document.querySelector(".screen-passport"))`, 8000);
    const where = await page.eval(`(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, x: (r.left + r.right) / 2 }; };
      const slot = document.querySelector('${slot(id)}');
      return { slot: box(slot), tool: box(document.querySelector(".pp-tool")), status: slot.dataset.status };
    })()`);
    const { slot: s, tool: t } = where;
    const u = (s.right - s.left) / 80; // the slot is 80u wide
    // over the slot, centred: its top 10u above the slot's (6 px more as it floats), its rubber well inside it
    if (where.status !== "pending" || Math.abs(t.x - s.x) > 2 || t.top < s.top - 11 * u - 6 || t.bottom > s.bottom)
      throw new Error(`le tampon encreur n'est pas sur ${id} : ${JSON.stringify(where)}`);
  }
  /** The rectangles of the rubber stamp, its hint, Mini Cycy's bubble and « ‹ Accueil »: whole on screen, apart; the
   *  hint inside its page (the page of the slot whose stamp waits). */
  async function apart(what = "") {
    const fit = await page.eval(`(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, shown: !el.hidden && r.width > 0 }; };
      const q = (selector) => box(document.querySelector(selector));
      const doc = document.documentElement;
      return { tool: q(".pp-tool"), hint: q(".pp-tool-hint"), bubble: q(".pp-head .bubble"), back: q(".world-back"), next: q(".pp-next"),
        page: box(document.querySelector('.pp-slot[data-status="pending"]').parentElement),
        w: innerWidth, h: innerHeight, scroll: doc.scrollHeight > innerHeight || doc.scrollWidth > innerWidth };
    })()`);
    const inside = (r, o = { top: 0, left: 0, bottom: fit.h, right: fit.w }) => r.shown && r.top >= o.top && r.left >= o.left && r.bottom <= o.bottom && r.right <= o.right;
    const meet = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const wrong = [
      ...["tool", "hint", "bubble", "next"].filter((k) => !inside(fit[k])).map((k) => `${k} hors de l'écran`),
      !inside(fit.hint, fit.page) && "« Touche pour tamponner » sort de sa page",
      meet(fit.bubble, fit.tool) && "la bulle touche le tampon encreur",
      meet(fit.bubble, fit.hint) && "la bulle touche « Touche pour tamponner »",
      meet(fit.bubble, fit.back) && "la bulle touche « ‹ Accueil »",
      fit.scroll && "la page défile",
    ].filter(Boolean);
    if (wrong.length) throw new Error(`${what && `${what} : `}${wrong.join(" ; ")} : ${JSON.stringify(fit)}`);
  }
  /** Mini Cycy's bubble whole on screen, its line inside it, clear of « ‹ Accueil », and of the rubber stamp and its
   *  hint if there. */
  async function bubbleFits(what) {
    const fit = await page.eval(`(() => {
      const [bubble, back, tool, hint] = [".pp-head .bubble", ".world-back", ".pp-tool", ".pp-tool-hint"].map((s) => document.querySelector(s)?.getBoundingClientRect());
      const range = document.createRange();
      range.selectNodeContents(document.querySelector(".pp-head .bubble-text"));
      const text = range.getBoundingClientRect(); // its line, an unbreakable name included
      const meet = (a, b) => Boolean(a && b) && a.top < b.bottom && b.top < a.bottom && a.left < b.right && b.left < a.right;
      return { inside: bubble.width > 0 && bubble.top >= 0 && bubble.left >= 0 && bubble.bottom <= innerHeight && bubble.right <= innerWidth,
        spills: text.left < bubble.left || text.right > bubble.right || text.top < bubble.top || text.bottom > bubble.bottom,
        meets: meet(bubble, back), tool: meet(bubble, tool) || meet(bubble, hint), bubble: [bubble.left, bubble.top, bubble.right, bubble.bottom].map(Math.round) };
    })()`);
    const wrong = [!fit.inside && "sort de l'écran", fit.spills && "laisse dépasser sa ligne", fit.meets && "touche « ‹ Accueil »", fit.tool && "touche le tampon encreur"].filter(Boolean);
    if (wrong.length) throw new Error(`${what} : la bulle ${wrong.join(", ")} (${fit.bubble.join(", ")})`);
  }
  /** The words of the page on show: a slot's (its number, « À vivre », the name, the date, the padlock) inside it, its
   *  number across its top edge; the page's own (running head, folio, identity fields, next destination) inside the
   *  page; no two touching. */
  async function labelsFit(what) {
    const labels = await page.eval(`(() => {
      const front = document.querySelector(".pp-leaf.is-current > .leaf-front");
      const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
      const label = (el, within, edge = false) => ({ name: (el.textContent.trim() || el.getAttribute("class")).replace(/\\s+/g, " "), box: box(el), within: box(within), edge, shown: el.getClientRects().length > 0 });
      const slots = [...front.querySelectorAll(".pp-slot")].flatMap((slot) => [...slot.querySelectorAll(".slot-no, .slot-body > *")].map((el) => label(el, slot, el.matches(".slot-no"))));
      const own = [...front.querySelectorAll(".pg-running, .pg-folio, .id-title, .id-field dt, .id-field dd, .id-mrz span, .nx-date, .nx-text")].map((el) => label(el, front.querySelector(".pp-pg")));
      return [...slots, ...own].filter((l) => l.shown);
    })()`);
    const E = 0.5; // px of rounding
    const out = labels.filter(({ box: b, within: w, edge }) =>
      b.left < w.left - E || b.right > w.right + E || (edge ? b.top > w.top || b.bottom < w.top : b.top < w.top - E || b.bottom > w.bottom + E));
    const meet = (a, b) => a.left < b.right - E && b.left < a.right - E && a.top < b.bottom - E && b.top < a.bottom - E;
    const touching = labels.flatMap((a, k) => labels.slice(k + 1).filter((b) => meet(a.box, b.box)).map((b) => `« ${a.name} » et « ${b.name} »`));
    const wrong = [...out.map((l) => `« ${l.name} » déborde`), ...touching.map((pair) => `${pair} se touchent`)];
    if (wrong.length) throw new Error(`${what} : ${wrong.join(" ; ")}`);
  }

  await check("?demo#/aventures (une visite suivante) : le passeport monte déjà ouvert sur la page 0, sans couverture qui tourne, avec ses 15 tampons chargés", async () => {
    await page.goto(`${BASE}?demo#/aventures`);
    await page.waitFor(`document.querySelector(".screen-aventures.screen-passport") && document.querySelector(".world-back")`, 4000);
    await page.waitFor(opened, 4000);
    const path = await page.eval(`({ open: window.__open?.page, pages: window.__pages, turned: window.__turned ?? null })`);
    if (path.open !== "0" || path.pages.join() !== "0" || path.turned !== null) throw new Error(`pas déjà ouvert sur la page 0 : ${JSON.stringify(path)}`);
    const count = await page.eval(`document.querySelectorAll(".pp-stamp").length`);
    if (count !== 15) throw new Error(`${count} tampons`);
    await page.waitFor(`[...document.querySelectorAll(".pp-stamp")].every((img) => img.complete && img.naturalWidth > 0)`, 5000);
    await page.waitFor(onPage(0), 2000);
    await sleep(600);
    await shot("identity");
  });

  await check("ouvert d'un lien direct, le son se réveille au premier toucher : unlockAudio écoute pointerdown, pointerup, touchend et keydown (iOS ne le réveille qu'à la fin d'un toucher)", async () => {
    const types = await page.eval(`(window.__unlocks || []).slice().sort().join()`);
    if (types !== "keydown,pointerdown,pointerup,touchend") throw new Error(`unlockAudio écoute : ${types || "rien"}`);
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
   *  at once (typing it takes 1 to 3 s), the book still hidden; `last` (the 3rd pair): only the first touch, or none.
   *  In the page: __fourth, just before the touch that brings the 4th bubble; __savedThen, the save at that moment. */
  async function welcomePairs(targets, last = 2) {
    await page.waitFor(`${buddy} && ${saying(WELCOME[0])}`, 6000);
    if (!(await page.eval(hiddenBook))) throw new Error("le passeport se montre dès la 1re bulle");
    for (let i = 1; i <= 3; i++) {
      if (i === 3) await page.eval(`window.__fourth = performance.now(); try { window.__savedThen = localStorage.getItem("${KEY}"); } catch {}`);
      for (let k = 0; k < (i === 3 ? last : 2); k++) await page.tap(targets[i - 1]);
      if (i === 3) break;
      await page.waitFor(saying(WELCOME[i]), 700);
      if (!(await page.eval(hiddenBook))) throw new Error(`le passeport se montre dès la bulle ${i + 1}`);
    }
  }

  await check(
    "profil neuf : Mini Cycy arrive, le passeport caché ; « welcome[0] », trois fois deux touchers → « welcome[3] » ; pendant la 4e le passeport arrive (un toucher termine son arrivée : la page 0, welcomed et known enregistrés dès lors), 1,5 s après la page 1",
    async () => {
      await seeded(`#/aventures`);
      await welcomePairs([".bubble", ".aventures-buddy", ".pp"]); // the bubble, Mini Cycy, anywhere
      if (await page.eval(`JSON.parse(window.__savedThen)?.welcomed`)) throw new Error("welcomed enregistré avant la 4e bulle");
      // the 3rd pair's second touch fell in the arrival: open on page 0 well before the 1.9 s of an arrival
      await page.waitFor(`${opened} && ${onPage(0)}`, 1500);
      const landed = await page.eval(`window.__bookOpen.at - window.__fourth`);
      if (landed > 1400) throw new Error(`ouvert ${Math.round(landed)} ms après la 4e bulle : le toucher n'a pas terminé l'arrivée`);
      // the whole welcome seen: saved as it lands, by the page's clock (not 1.5 s later, with the turn)
      const kept = await page.eval(`window.__welcomedAt ? window.__welcomedAt - window.__bookOpen.at : null`);
      if (kept === null || Math.abs(kept) > 100) throw new Error(kept === null ? "rien d'enregistré à l'arrivée posée" : `enregistré ${Math.round(kept)} ms après l'arrivée posée`);
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

  await check(
    "rechargement : une seule bulle, « Re ! On en était à Premier bivouac 👀 », et le passeport ouvert directement sur la page 1 (jamais la page 0, aucune page qui tourne) en moins de 1,5 s, posé en moins de 3 s",
    async () => {
      await page.reload();
      // by the page's clock, from the start of the reload: open (it may still be rising), then landed; its first raster,
      // which can block a frame or two for 1 to 2 s on a machine without a GPU, delays only the landing
      await page.waitFor(`window.__open && window.__bookOpen`, 6000);
      const { open, landed } = await page.eval(`({ open: window.__open, landed: window.__bookOpen.at })`);
      console.log(`    (ouvert sur la page ${open.page} ${(open.at / 1000).toFixed(2)} s après le début du rechargement, posé à ${(landed / 1000).toFixed(2)} s)`);
      await page.waitFor(saying("Re ! On en était à Premier bivouac 👀"), 3000);
      await sleep(1200);
      const path = await page.eval(`({ pages: window.__pages, turned: window.__turned ?? null })`);
      const wrong = [
        open.page !== "1" && `ouvert d'abord sur la page ${open.page}`,
        open.at > 1500 && `ouvert ${Math.round(open.at)} ms après le début du rechargement`,
        landed > 3000 && `posé ${Math.round(landed)} ms après le début du rechargement`,
        path.pages.join() !== "1" && `pages montrées : ${path.pages.join(", ")}`,
        path.turned !== null && `une page a tourné à ${Math.round(path.turned)} ms`,
      ].filter(Boolean);
      if (wrong.length) throw new Error(wrong.join(" ; "));
      if (!(await page.eval(saying("Re ! On en était à Premier bivouac 👀")))) throw new Error(`puis : ${JSON.stringify(await page.eval(said))}`);
      if ((await page.eval(`document.querySelectorAll(".bubble").length`)) !== 1) throw new Error("plusieurs bulles");
    },
  );

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
      // both from the touch: her pout (2.6 s) at once, while the line is written out in full (the longest takes up to
      // 3 s), one of the three, not the one before
      await Promise.all([
        page.waitFor(`${buddy}.querySelector(".avatar-img").src.endsWith("/pout.webp")`, 1000).catch(async () => {
          throw new Error(`pas de bouderie après le toucher : ${await page.eval(`${buddy}.querySelector(".avatar-img").src`)}`);
        }),
        page.waitFor(`${said}.length === 1 && ${JSON.stringify(LOCKED)}.includes(${said}[0]) && ${said}[0] !== ${JSON.stringify(previous)}`, 3000).catch(async () => {
          throw new Error(`bulle : ${JSON.stringify(await page.eval(said))} (avant : ${JSON.stringify(previous)})`);
        }),
      ]);
      previous = (await page.eval(said))[0];
    }
  });

  await check(
    `les bulles à surveiller (BRIEF.md, piège 17) : welcome[1] et welcome[2] (Mini Cycy au milieu, le passeport caché), locked[1] avec le nom le plus long (« ${LONGEST.name} ») ; entières dans l'écran, sans toucher « ‹ Accueil » ; locked[1] ne couvre ni le tampon encreur ni le contenu des emplacements`,
    async () => {
      // the welcome: two touches a bubble, the next one out in full at once
      await seeded(`#/aventures`);
      await page.waitFor(`${buddy} && ${saying(WELCOME[0])}`, 6000);
      for (const k of [1, 2]) {
        await page.tap(".bubble");
        await page.tap(".bubble");
        await page.waitFor(`${saying(WELCOME[k])} && ${hiddenBook} && !gsap.isTweening(document.querySelector(".pp-head .bubble"))`, 2000);
        await bubbleFits(`welcome[${k}]`);
      }
      // locked[1]: a locked slot touched (Marquèze) while the rubber stamp waits over the top slot of its page (Île de
      // Ré), until she says locked[1]. The longest name never follows a locked slot today (Espelette is the last outing):
      // it takes the place of {next} in her line as the page wrote it, which sizes the bubble as say() would
      // (.bubble::before); so {next} is a page's top outing other than the longest, Île de Ré while it qualifies
      const tops = passportPages(AVENTURES).filter((p) => p.ids?.length === 2 && p.ids[0] !== LONGEST.id).map((p) => p.ids);
      const [host, shut] = tops.find(([top]) => top === "ile-de-re") ?? tops[0];
      await page.goto(`${BASE}?demo&tampon=${host}#/aventures`);
      await toolOn(host);
      const lines = A.locked.map((line) => fill(line, { next: nameOf(host) }));
      // never the same line twice running: one chance in two at each touch after the first
      for (let k = 0, previous = null; previous !== lines[1]; k++) {
        if (k === 30) throw new Error(`trente touchers sans locked[1] : ${JSON.stringify(await page.eval(said))}`);
        await page.tap(slot(shut));
        await page.waitFor(`${said}.length === 1 && ${JSON.stringify(lines)}.includes(${said}[0]) && ${said}[0] !== ${JSON.stringify(previous)}`, 3000);
        previous = (await page.eval(said))[0];
      }
      // written out, and in place: say() no longer rewrites the line under the measure
      await page.waitFor(`(() => {
        const bubble = document.querySelector(".pp-head .bubble");
        return !gsap.isTweening(bubble) && bubble.querySelector(".bubble-text").textContent === bubble.dataset.say;
      })()`, 4000);
      const line = await page.eval(`(() => {
        const bubble = document.querySelector(".pp-head .bubble");
        const line = bubble.dataset.say.replace(${JSON.stringify(nbsp(nameOf(host)))}, ${JSON.stringify(nbsp(LONGEST.name))});
        if (line === bubble.dataset.say) return null;
        bubble.dataset.say = line;
        bubble.querySelector(".bubble-text").textContent = line;
        return line;
      })()`);
      if (!line) throw new Error(`« ${nameOf(host)} » introuvable dans sa bulle : ${JSON.stringify(await page.eval(said))}`);
      await bubbleFits(`locked[1] (« ${line.replace(/\u00a0/g, " ")} »)`);
      const covered = await page.eval(`(() => {
        const b = document.querySelector(".pp-head .bubble").getBoundingClientRect();
        const meet = (r) => r.width > 0 && r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom;
        const inside = document.querySelectorAll(".pp-leaf.is-current .pp-slot :is(.slot-no, .slot-body > *, .pp-stamp)");
        return [...inside].filter((el) => meet(el.getBoundingClientRect())).map((el) => el.textContent.trim() || el.getAttribute("class"));
      })()`);
      if (covered.length) throw new Error(`locked[1] couvre dans les emplacements : ${covered.join(", ")}`);
    },
  );

  await check("profil neuf, la 1re bulle : l'écran tourne (h × w) puis revient (w × h) ; après chaque changement, Mini Cycy et sa bulle sont entières dans l'écran", async () => {
    await seeded(`#/aventures`);
    await page.waitFor(`${buddy} && ${saying(WELCOME[0])}`, 6000);
    const where = `(() => {
      const box = (selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), in: r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
      };
      return { cycy: box(".aventures-buddy"), bubble: box(".pp-head .bubble"), welcome: ${hiddenBook} && !document.querySelector(".pp.is-arriving") };
    })()`;
    try {
      for (const [w, h] of [[vp.height, vp.width], [vp.width, vp.height]]) {
        await page.resize(w, h);
        await page.waitFor(`innerWidth === ${w} && innerHeight === ${h}`, 2000);
        await page.waitFor(`(${where}).cycy.in && (${where}).bubble.in`, 2000).catch(async () => {
          throw new Error(`en ${w} × ${h}, hors de l'écran : ${JSON.stringify(await page.eval(where))}`);
        });
        if (!(await page.eval(`(${where}).welcome`))) throw new Error(`en ${w} × ${h} : l'accueil a déjà passé la 3e bulle, rien à juger`);
      }
    } finally {
      await page.resize(vp.width, vp.height);
    }
  });

  await check("partir pendant l'accueil, le passeport encore caché (la 3e bulle) : rien n'est enregistré, l'accueil revient la fois d'après", async () => {
    await seeded(`#/aventures`);
    await welcomePairs([".bubble", ".bubble", ".bubble"], 0);
    await page.tap(".world-back");
    await page.waitFor(`document.querySelector(".screen-hub")`, 4000);
    await sleep(5000); // past the 3rd bubble's pause and the landing the welcome would have had
    if ((await saved())?.welcomed) throw new Error(`sauvegarde : ${JSON.stringify(await saved())}`);
    await page.goto(`${BASE}#/aventures`);
    await page.waitFor(`${saying(WELCOME[0])} && ${hiddenBook}`, 6000);
  });

  await check("partir (« ‹ Accueil ») pendant le vol de la 4e bulle : rien n'est enregistré, sans erreur, le hub s'affiche ; l'accueil revient la fois d'après", async () => {
    for (let attempt = 1; ; attempt++) {
      await seeded(`#/aventures`);
      await welcomePairs([".bubble", ".bubble", ".bubble"], 1); // the arrival under way, untouched
      await page.waitFor(`document.querySelector(".pp.is-arriving")`, 2000);
      // when the touch arrives, is the book still flying? (a frame held by a slow raster can let it land first)
      await page.eval(`addEventListener("pointerdown", () => (window.__leftFlying = Boolean(document.querySelector(".pp.is-arriving"))), { capture: true, once: true })`);
      await page.tap(".world-back");
      await page.waitFor(`document.querySelector(".screen-hub") && !document.querySelector(".screen-passport")`, 4000);
      if (await page.eval(`window.__leftFlying`)) break;
      if (attempt === 3) throw new Error("trois fois, le passeport était déjà posé quand « ‹ Accueil » a été touché");
      console.log("    (le passeport était déjà posé quand « ‹ Accueil » a été touché, essai suivant)");
    }
    await sleep(3000); // past the landing the flight would have had
    if ((await saved())?.welcomed) throw new Error(`sauvegarde : ${JSON.stringify(await saved())}`);
    if (!(await page.eval(`location.hash === "#/" && Boolean(document.querySelector(".screen-hub"))`))) throw new Error(`plus sur le hub : ${await page.eval("location.hash")}`);
    await page.goto(`${BASE}#/aventures`);
    await page.waitFor(`${saying(WELCOME[0])} && ${hiddenBook}`, 6000);
  });

  await check(
    "l'accueil vu jusqu'à l'arrivée de la 4e bulle (l'arrivée 3D posée en moins de 4 s, sans toucher), partir sur la page 0 : welcomed et known enregistrés ; la fois d'après, pas d'accueil mais « Re ! On en était à Premier bivouac 👀 »",
    async () => {
      for (let attempt = 1; ; attempt++) {
        await seeded(`#/aventures`);
        await welcomePairs([".bubble", ".bubble", ".bubble"], 1); // the arrival this time in full, untouched
        await page.waitFor(`${opened} && ${onPage(0)}`, 5000);
        await page.tap(".world-back"); // within the 1.5 s on page 0
        await page.waitFor(`document.querySelector(".screen-hub")`, 4000);
        const at = await page.eval(`({ landed: window.__bookOpen.at - window.__fourth, turned: window.__turnAt ?? null })`);
        console.log(`    (arrivée posée ${(at.landed / 1000).toFixed(2)} s après la 4e bulle)`);
        if (at.landed > 4000) throw new Error(`l'arrivée s'est posée ${Math.round(at.landed)} ms après la 4e bulle`);
        if (at.turned === null) break;
        // a frame held by a slow raster: the touch came after the 1.5 s, nothing to judge
        if (attempt === 3) throw new Error("trois fois, la page avait déjà tourné quand « ‹ Accueil » a été touché");
        console.log("    (la page avait déjà tourné quand « ‹ Accueil » a été touché, essai suivant)");
      }
      const save = await saved();
      if (save?.welcomed !== true || [...(save.known || [])].sort().join() !== [...ids].sort().join()) throw new Error(`sauvegarde : ${JSON.stringify(save)}`);
      await page.goto(`${BASE}#/aventures`);
      await page.waitFor(saying("Re ! On en était à Premier bivouac 👀"), 6000);
    },
  );

  await check(
    "stockage bloqué : l'accueil se déroule, le passeport arrive (page 0) puis s'ouvre sur la page 1, sans erreur ; la page retient tout : Premier bivouac vécu puis tamponné, le canoë s'ouvre ; revenu du hub, pas d'accueil mais « Re ! On en était à Premier canoë · Dordogne 👀 »",
    async () => {
      await page.goto(`${BASE}?stockage-bloque#/aventures`);
      if (!(await page.eval(`(() => { try { localStorage; return false; } catch { return true; } })()`))) throw new Error("le stockage n'est pas bloqué");
      await welcomePairs([".bubble", ".bubble", ".bubble"], 1); // the arrival this time in full
      await page.waitFor(saying(WELCOME[3]), 3000);
      await page.waitFor(`${opened} && ${onPage(0)}`, 4000);
      await page.waitFor(`${opened} && ${onPage(1)} && !${book}.classList.contains("is-turning")`, 4000);
      // its intro seen through, then its stamp: the page remembers both
      await page.tap(slot("bivouac-1"));
      await page.waitFor(intro(false), 4000);
      await backOn(1, (await page.eval(introLength)) + 4500);
      await toolOn("bivouac-1");
      await page.tap(".pp-tool");
      await page.waitFor(`${stampOn("bivouac-1")} && document.querySelector('${slot("canoe")}[data-status="open"]')`, 4000).catch(async () => {
        throw new Error(`pas tamponné : ${JSON.stringify(await page.eval(`[...document.querySelectorAll(".pp-slot")].slice(0, 2).map((s) => s.dataset.status)`))}`);
      });
      // to the hub and back, in the same page: her word of a later visit, not the welcome
      await page.tap(".world-back");
      await throughCard();
      await page.waitFor(saying(fill(A.again.progress, { next: nameOf("canoe") })), 8000).catch(async () => {
        throw new Error(`revenu du hub : ${JSON.stringify(await page.eval(said))}`);
      });
    },
  );

  await check("?demo&accueil#/aventures : l'accueil de la première visite (Mini Cycy, le passeport caché, puis son arrivée, Premier bivouac à vivre), sans rien écrire dans le stockage", async () => {
    await page.goto(`${BASE}?demo&accueil#/aventures`);
    // a save in place, which the welcome must neither read nor change ("welcomed":false: SAVE_CLOCK stays quiet)
    const kept = JSON.stringify({ stamped: ids, pending: [], welcomed: false, known: [], page: 3 });
    await page.eval(`localStorage.setItem("${KEY}", ${JSON.stringify(kept)})`);
    await welcomePairs([".bubble", ".bubble", ".bubble"], 1);
    await page.waitFor(saying(WELCOME[3]), 3000);
    await page.waitFor(`${opened} && ${onPage(1)} && document.querySelector('${slot("bivouac-1")}[data-status="open"]')`, 8000);
    const after = await page.eval(`({ save: localStorage.getItem("${KEY}"), welcomed: window.__welcomedAt ?? null })`);
    if (after.save !== kept || after.welcomed !== null) throw new Error(`le stockage a changé : ${JSON.stringify(after)}`);
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
    const length = await page.eval(introLength);
    await sleep(1300);
    await page.eval(`history.back()`);
    await backOn(1, 4000);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="open"]')`, 2000);
    await page.waitFor(`performance.now() - window.__introAt > ${length + 1500}`, length + 3000); // past the end the intro would have had
    if ((await statusOf("bivouac-1")) !== "open") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    if (!(await page.eval(`${atPassport} && document.querySelector('${slot("bivouac-1")}[data-status="open"]')`))) throw new Error("l'intro a fini quand même");
  });

  await check("venu du hub, le retour du navigateur tout près de la fin de l'intro de la première fois (200 ms et 50 ms avant) : le passeport, pas le hub ; l'aventure reste à vivre", async () => {
    for (const early of [200, 50]) {
      for (let attempt = 1; ; attempt++) {
        await viaHub();
        await page.tap(slot("bivouac-1"));
        await page.waitFor(intro(false), 6000);
        const length = await page.eval(introLength);
        const at = length - early;
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
        await page.waitFor(`performance.now() - window.__introAt > ${length + 2000}`, 6000); // past its end, and a step back more
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
    const length = await page.eval(introLength);
    if ((await page.eval(`location.hash`)) !== "#/aventures/bivouac-1") throw new Error(`adresse : ${await page.eval("location.hash")}`);
    if (await page.eval(`Boolean(document.querySelector(".intro-skip"))`)) throw new Error("un bouton « Passer »");
    if ((await statusOf("bivouac-1")) !== "open") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    await sleep(400);
    await untouchable("bivouac-1");
    await backOn(1, length + 2500);
    const took = Date.now() - begun;
    if (took < length - 500) throw new Error(`l'intro n'a duré que ${took} ms`);
    if (!(await saved()).pending.includes("bivouac-1")) throw new Error(`pending : ${JSON.stringify((await saved()).pending)}`);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 1000);
    await page.reload();
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 6000);
  });

  await check(
    "le téléphone verrouillé 4 s pendant l'intro de la première fois (la page cachée et gelée) : au retour, l'aventure est toujours à vivre ; l'intro reprend où elle en était et ne finit qu'après toute sa durée en page visible",
    async () => {
      await fresh();
      await page.tap(slot("bivouac-1"));
      await page.waitFor(intro(false), 4000);
      const length = await page.eval(introLength);
      await page.waitFor(`performance.now() - window.__introAt > 1500`, 4000);
      await page.eval(`window.__seen = []; document.addEventListener("visibilitychange", () => window.__seen.push(performance.now() - window.__introAt))`);
      await page.lock(4000);
      await page.waitFor(`document.visibilityState === "visible" && window.__seen.length === 2`, 3000);
      if ((await statusOf("bivouac-1")) !== "open") throw new Error(`marquée vécue dès le retour : ${await statusOf("bivouac-1")}`);
      await page.waitFor(`window.__introEnd !== null`, length + 4000);
      const [hidden, back] = await page.eval(`window.__seen`);
      const end = await page.eval(`window.__introEnd`);
      // visible from its start to `hidden`, then from `back` to its end: its length in all, give or take a frame
      console.log(`    (cachée de ${(hidden / 1000).toFixed(2)} s à ${(back / 1000).toFixed(2)} s, finie à ${(end / 1000).toFixed(2)} s)`);
      if (back - hidden < 3900) throw new Error(`la page n'a été cachée que ${Math.round(back - hidden)} ms`);
      if (end - (back - hidden) < length - 250) throw new Error(`finie à ${Math.round(end)} ms : ${Math.round(end - (back - hidden))} ms en page visible, pas ${length}`);
      await backOn(1, 4000);
      if ((await statusOf("bivouac-1")) !== "pending") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    },
  );

  await check("profil neuf : toucher Premier bivouac ouvre son intro, impossible à passer ; en moins de sa durée + 2,5 s, le passeport déjà ouvert sur sa page, son tampon attend", async () => {
    await fresh();
    const begun = Date.now();
    await page.tap(slot("bivouac-1"));
    await page.waitFor(`location.hash === "#/aventures/bivouac-1" && ${intro(false)}`, 4000);
    if ((await page.eval(`document.querySelector(".screen-intro").dataset.id`)) !== "bivouac-1") throw new Error("data-id");
    if (await page.eval(`Boolean(document.querySelector(".intro-skip"))`)) throw new Error("un bouton « Passer »");
    const length = await page.eval(introLength);
    await sleep(1800);
    await untouchable("bivouac-1");
    await backOn(1, Math.max(0, length + 2500 - (Date.now() - begun)));
    console.log(`    (retour en ${((Date.now() - begun) / 1000).toFixed(2)} s)`);
    if (!(await saved()).pending.includes("bivouac-1")) throw new Error(`pending : ${JSON.stringify((await saved()).pending)}`);
    await page.waitFor(`document.querySelector('${slot("bivouac-1")}[data-status="pending"]')`, 1000);
  });

  // ── Stamping: the rubber stamp, the « TCHAC », the passport complete ──

  await check("après l'intro de Premier bivouac : le tampon encreur descend au-dessus de son emplacement, « Touche pour tamponner » en dessous, pas encore de tampon posé", async () => {
    await toolOn("bivouac-1");
    const hint = await page.eval(`(() => {
      const el = document.querySelector(".pp-tool-hint");
      const r = el.getBoundingClientRect();
      const tool = document.querySelector(".pp-tool").getBoundingClientRect();
      const slot = document.querySelector('${slot("bivouac-1")}').getBoundingClientRect();
      return { text: el.textContent, below: r.top >= tool.bottom - 1, onEdge: Math.abs((r.top + r.bottom) / 2 - slot.bottom) < 3, shown: getComputedStyle(el).visibility === "visible" && Number(getComputedStyle(el).opacity) > 0.9 };
    })()`);
    if (hint.text !== A.stampHint) throw new Error(`pastille : « ${hint.text} »`);
    if (!hint.below || !hint.onEdge || !hint.shown) throw new Error(`pastille mal placée : ${JSON.stringify(hint)}`);
    if (await page.eval(`Boolean(${stampOn("bivouac-1")})`)) throw new Error("le tampon est déjà posé");
    await sleep(500);
    await shot("tool");
  });

  await check("sans toucher : au bout de 6,5 s (pas avant 6 s), Mini Cycy relance d'une des deux répliques nudge ; le tampon encreur, sa pastille et la bulle tiennent dans l'écran sans se toucher", async () => {
    await page.waitFor(`window.__nudgeAt`, 9000);
    const after = await page.eval(`window.__nudgeAt - window.__toolAt`);
    console.log(`    (relance ${(after / 1000).toFixed(2)} s après l'arrivée du tampon encreur)`);
    if (after < 5950 || after > 6500) throw new Error(`relance ${Math.round(after)} ms après le tampon encreur, pas 6 s`);
    await page.waitFor(`${said}.length === 1 && ${JSON.stringify(A.nudge)}.includes(${said}[0])`, 2000).catch(async () => {
      throw new Error(`bulle : ${JSON.stringify(await page.eval(said))}`);
    });
    await apart();
  });

  await check("rechargement, le tampon encreur en attente : il revient sur Premier bivouac, qui attend toujours (point 1)", async () => {
    await page.reload();
    await toolOn("bivouac-1");
    if ((await statusOf("bivouac-1")) !== "pending") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
  });

  await check("le tampon attend : toucher un emplacement verrouillé ne change pas l'adresse ; #/aventures/bivouac-1 (par l'avant du navigateur, ou en lien) ramène au passeport", async () => {
    await page.tap(slot("canoe"));
    await sleep(900);
    if ((await page.eval(`location.hash`)) !== "#/aventures") throw new Error(`adresse ${await page.eval("location.hash")}`);
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

  await check("toucher le tampon encreur : en moins de 1,5 s, le tampon de Premier bivouac est posé, l'outil parti, la sauvegarde a stamped [bivouac-1], le canoë est à vivre, Mini Cycy dit une réplique stamped ; un seul « TCHAC »", async () => {
    await toolOn("bivouac-1");
    await warmUp();
    await armTap();
    await page.tap(".pp-tool");
    const parts = {
      stamp: `Boolean(${stampOn("bivouac-1")})`,
      gone: `!document.querySelector(".pp-tool")`,
      saved: `JSON.parse(localStorage.getItem("${KEY}"))?.stamped?.join() === "bivouac-1"`,
      canoe: `document.querySelector('${slot("canoe")}')?.dataset.status === "open"`,
      line: `${JSON.stringify(STAMPED("canoe"))}.includes(${saysNow})`,
    };
    const took = await since(Object.values(parts).join(" && "), 1500);
    // the contact (0.37 s in the tool's timeline) next to the total: what the page took, apart from this machine's frames
    const times = `${took === null ? "jamais" : `${(took / 1000).toFixed(2)} s`} après le toucher, le contact à ${await contactAt()}`;
    console.log(`    (tout est là ${times})`);
    if (took === null || took > 1500) {
      const now = await page.eval(`({ ${Object.entries(parts).map(([k, v]) => `${k}: ${v}`).join(", ")} })`);
      throw new Error(`${times} : ${JSON.stringify(now)}`);
    }
    if ((await statusOf("canoe")) !== "open") throw new Error(`canoe enregistré ${await statusOf("canoe")}`);
    await page.waitFor(`${said}.length === 1 && ${JSON.stringify(STAMPED("canoe"))}.includes(${said}[0])`, 3000);
    await bubbleFits("stamped");
    if ((await page.eval(tchacs)) !== 1) throw new Error(`vibrations : ${JSON.stringify(await page.eval("window.__vibes"))}`);
  });

  await check("profil neuf (accueil vu) : /#/aventures/espelette (verrouillée) et /#/aventures/inconnue mènent au passeport, sur #/aventures", async () => {
    for (const id of ["espelette", "inconnue"]) {
      await seeded(`#/aventures/${id}`, WELCOMED);
      await page.waitFor(atPassport, 4000);
      await page.waitFor(`${opened} && ${onPage(1)}`, 8000);
      if (await page.eval(`Boolean(document.querySelector(".screen-intro"))`)) throw new Error(`${id} : une intro s'est ouverte`);
    }
  });

  await check("?demo#/aventures/<id> : l'intro de chaque sortie sans scénario à elle (intros/index.js) dure 4500 ms, comme l'écrit son data-length", async () => {
    for (const id of ids.filter((id) => !Object.hasOwn(SCENARIOS, id))) {
      await page.goto(`${BASE}?demo#/aventures/${id}`);
      await page.waitFor(`document.querySelector('#app > .screen-intro[data-id="${id}"]')`, 6000);
      const now = await page.eval(`({ id: window.__intro?.dataset.id, length: ${introLength} })`);
      if (now.id !== id || now.length !== 4500) throw new Error(`${id} : ${JSON.stringify(now)}`);
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

  await check("?demo&tampon=canoe#/aventures : le tampon encreur est sur le canoë, Premier bivouac est tamponné ; après le toucher, la page 2 en moins de 2,5 s", async () => {
    await page.goto(`${BASE}?demo&tampon=canoe#/aventures`);
    await toolOn("canoe");
    if (!(await page.eval(`Boolean(${stampOn("bivouac-1")})`))) throw new Error("bivouac-1 n'est pas tamponné");
    await warmUp();
    await armTap();
    await page.tap(".pp-tool");
    const took = await since(onPage(2), 2500);
    const times = `${took === null ? "jamais" : `${(took / 1000).toFixed(2)} s`} après le toucher, le contact à ${await contactAt()}`;
    console.log(`    (page 2 ${times})`);
    if (took === null || took > 2500) throw new Error(`page ${await shown()} (page 2 ${times})`);
    if (!(await page.eval(`Boolean(${stampOn("canoe")}) && document.querySelector('${slot("ile-de-re")}').dataset.status === "open"`))) throw new Error("canoe non tamponné, ou Île de Ré pas à vivre");
  });

  await check("?demo&tampon=canoe : deux touchers à 50 ms sur le tampon encreur, un sur son emplacement pendant l'élan, un autre pendant que la page tourne : un seul « TCHAC », une seule réplique, le canoë seul tamponné, aucune intro", async () => {
    await page.goto(`${BASE}?demo&tampon=canoe#/aventures`);
    await toolOn("canoe");
    await armTap();
    await page.tap(".pp-tool");
    await sleep(50);
    await page.tap(".pp-tool").catch(() => {});
    await sleep(60);
    await page.tap(slot("canoe"));
    await page.waitFor(`${book}.classList.contains("is-turning")`, 3000);
    await page.tap(slot("canoe")).catch(() => {}); // on the leaf turning away
    await page.waitFor(`${opened} && ${onPage(2)}`, 3000);
    await sleep(900);
    const after = await page.eval(`({ tchacs: ${tchacs}, said: window.__said, hash: location.hash, intro: Boolean(document.querySelector(".screen-intro")),
      status: Object.fromEntries([...document.querySelectorAll(".pp-slot")].map((s) => [s.dataset.id, s.dataset.status])) })`);
    const lines = after.said.filter((line) => A.stamped.some((s) => line === fill(s, { next: nameOf("ile-de-re") })));
    const wrong = [
      after.tchacs !== 1 && `${after.tchacs} « TCHAC »`,
      lines.length !== 1 && `répliques : ${JSON.stringify(after.said)}`,
      (after.hash !== "#/aventures" || after.intro) && `une intro (${after.hash})`,
      Object.entries(after.status).some(([id, s]) => (s === "stamped") !== ids.slice(0, ids.indexOf("ile-de-re")).includes(id)) && `statuts : ${JSON.stringify(after.status)}`,
      after.status["ile-de-re"] !== "open" && "Île de Ré n'est pas à vivre",
    ].filter(Boolean);
    if (wrong.length) throw new Error(wrong.join(" ; "));
  });

  // the outing after a stamp, on its provisional intro: the Île de Ré (the canoe has its own scenario, of 31 s)
  await check("?demo&tampon=canoe : après le tampon, toucher l'Île de Ré ouvre son intro, une seule entrée d'historique de plus ; à sa fin, le tampon encreur attend sur l'Île de Ré ; rien n'est enregistré", async () => {
    await page.goto(`${BASE}?demo&tampon=canoe#/aventures`);
    const kept = await page.eval(`localStorage.getItem("${KEY}")`);
    const its = pageOf(AVENTURES, "ile-de-re");
    await toolOn("canoe");
    await page.tap(".pp-tool");
    const lit = `document.querySelector('${slot("ile-de-re")}[data-status="open"] .slot-body')`;
    // the canoe stamped, the book turned to the Île de Ré's page and still
    await page.waitFor(`${stampOn("canoe")} && ${lit} && !gsap.isTweening(${lit}) && ${opened} && ${onPage(its)} && !${book}.classList.contains("is-turning")`, 6000);
    // the entries the page writes from now on (history.length stops at 50, which a long run reaches)
    await page.eval(`window.__entries = { push: 0, replace: 0 };
      for (const kind of ["push", "replace"]) {
        const write = history[kind + "State"];
        history[kind + "State"] = function (...args) {
          window.__entries[kind]++;
          return write.apply(this, args);
        };
      }`);
    await page.tap(slot("ile-de-re"));
    await page.waitFor(`location.hash === "#/aventures/ile-de-re" && document.querySelector('.screen-intro[data-id="ile-de-re"]')`, 4000).catch(async () => {
      throw new Error(`pas d'intro de l'Île de Ré : ${JSON.stringify(await page.eval(`({ hash: location.hash, entries: window.__entries, ile: document.querySelector('${slot("ile-de-re")}')?.dataset.status })`))}`);
    });
    const entries = await page.eval(`window.__entries`);
    if (entries.push !== 1 || entries.replace !== 0) throw new Error(`historique : ${JSON.stringify(entries)} (une entrée ajoutée, aucune réécrite)`);
    await backOn(its, (await page.eval(introLength)) + 4500);
    await toolOn("ile-de-re");
    if ((await page.eval(`localStorage.getItem("${KEY}")`)) !== kept) throw new Error(`la sauvegarde a changé : ${await page.eval(`localStorage.getItem("${KEY}")`)}`);
  });

  await check("toucher l'emplacement lui-même (hors du tampon encreur et de sa pastille) tamponne aussi : un seul « TCHAC », Premier bivouac enregistré stamped", async () => {
    await seeded(`#/aventures`, { ...WELCOMED, pending: ["bivouac-1"] });
    await toolOn("bivouac-1");
    // a point of the slot that neither the tool nor its hint covers: its left part, halfway down
    const at = await page.eval(`(() => {
      const r = document.querySelector('${slot("bivouac-1")}').getBoundingClientRect();
      const [x, y] = [r.left + r.width * 0.12, r.top + r.height * 0.5];
      const hit = document.elementFromPoint(x, y);
      return { x, y, slot: Boolean(hit?.closest('${slot("bivouac-1")}')), tool: Boolean(hit?.closest(".pp-air")) };
    })()`);
    if (!at.slot || at.tool) throw new Error(`le point touché n'est pas l'emplacement seul : ${JSON.stringify(at)}`);
    await armTap();
    await page.tapAt(at.x, at.y);
    await page.waitFor(`${stampOn("bivouac-1")} && !document.querySelector(".pp-tool")`, 4000).catch(async () => {
      throw new Error(`pas tamponné : ${JSON.stringify(await page.eval(`({ tool: document.querySelector(".pp-tool")?.dataset.state, slot: document.querySelector('${slot("bivouac-1")}').dataset.status })`))}`);
    });
    await page.waitFor(`${said}.length === 1 && ${JSON.stringify(STAMPED("canoe"))}.includes(${said}[0])`, 3000);
    if ((await statusOf("bivouac-1")) !== "stamped") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    if ((await page.eval(tchacs)) !== 1) throw new Error(`vibrations : ${JSON.stringify(await page.eval("window.__vibes"))}`);
  });

  await check("?demo&tampon=canoe : un toucher pendant l'arrivée la termine et écrit la bulle « Re ! … », sans tamponner : le tampon encreur descend ensuite, le canoë attend, aucun « TCHAC »", async () => {
    const greeting = fill(A.again.progress, { next: nameOf("canoe") });
    for (let attempt = 1; ; attempt++) {
      await page.goto(`${BASE}?demo&tampon=canoe#/aventures`);
      // rising, its slot already on screen (it starts half a screen low)
      await page.waitFor(`document.querySelector(".pp.is-arriving") && document.querySelector('${slot("canoe")}').getBoundingClientRect().top < innerHeight - 20`, 6000);
      await page.eval(`addEventListener("pointerdown", () => (window.__landedByTap = Boolean(document.querySelector(".pp.is-arriving"))), { capture: true, once: true })`);
      await armTap();
      await page.tap(slot("canoe"));
      if (await page.eval(`window.__landedByTap`)) break;
      if (attempt === 3) throw new Error("trois fois, le passeport était déjà posé au toucher");
      console.log("    (le passeport était déjà posé au toucher, essai suivant)");
    }
    await page.waitFor(`${opened} && ${saying(greeting)}`, 600).catch(async () => {
      throw new Error(`après le toucher : ${JSON.stringify(await page.eval(`({ open: Boolean(${opened}), said: ${said} })`))}`);
    });
    await page.waitFor(`${waiting} || document.querySelector('${slot("canoe")}').dataset.status !== "pending"`, 4000);
    await sleep(1500);
    const now = await page.eval(`({ canoe: document.querySelector('${slot("canoe")}').dataset.status, tchacs: ${tchacs}, said: ${said}, tool: Boolean(${waiting}) })`);
    if (now.canoe !== "pending" || now.tchacs || !now.tool || JSON.stringify(now.said) !== JSON.stringify([greeting])) throw new Error(JSON.stringify(now));
  });

  await check("partir (« ‹ Accueil ») juste après le contact : le tampon est enregistré, sans erreur ; au retour, le canoë à vivre, plus de tampon encreur", async () => {
    await seeded(`#/aventures`, { ...WELCOMED, pending: ["bivouac-1"] });
    await toolOn("bivouac-1");
    await page.tap(".pp-tool");
    await page.waitFor(stampOn("bivouac-1"), 2000);
    await page.tap(".world-back");
    await page.waitFor(`document.querySelector(".screen-hub") && !document.querySelector(".screen-passport")`, 4000);
    await sleep(1500); // past the stamp's flight, Mini Cycy's line, the next slot lit
    const save = await saved();
    if (save?.stamped?.join() !== "bivouac-1" || save.pending.length) throw new Error(`sauvegarde : ${JSON.stringify(save)}`);
    await page.goto(`${BASE}#/aventures`);
    await page.waitFor(`${opened} && document.querySelector('${slot("canoe")}[data-status="open"]')`, 8000);
    await sleep(1500);
    if (await page.eval(`Boolean(document.querySelector(".pp-tool"))`)) throw new Error("un tampon encreur");
  });

  await check("partir (« ‹ Accueil ») entre le toucher et le contact : Premier bivouac attend toujours dans la sauvegarde, aucun « TCHAC », sans erreur, le hub s'affiche ; à la visite suivante, le tampon encreur redescend", async () => {
    for (let attempt = 1; ; attempt++) {
      await seeded(`#/aventures`, { ...WELCOMED, pending: ["bivouac-1"] });
      await toolOn("bivouac-1");
      await armTap();
      // when « ‹ Accueil » is touched, has the contact come yet? (a frame held by a slow raster can let it come first)
      await page.eval(`addEventListener("pointerdown", (e) => {
        if (e.target.closest(".world-back")) window.__leftEarly = window.__tchacAt === undefined && !document.querySelector('${slot("bivouac-1")} .pp-stamp');
      }, { capture: true })`);
      await page.tap(".pp-tool");
      await page.tap(".world-back");
      await page.waitFor(`document.querySelector(".screen-hub") && !document.querySelector(".screen-passport")`, 4000);
      if (await page.eval(`window.__leftEarly`)) break;
      if (attempt === 3) throw new Error("trois fois, le contact était déjà venu quand « ‹ Accueil » a été touché");
      console.log("    (le contact était déjà venu quand « ‹ Accueil » a été touché, essai suivant)");
    }
    await page.waitFor(`performance.now() - window.__tapAt > 1500`, 4000); // past the contact and the flight it would have had
    if ((await statusOf("bivouac-1")) !== "pending") throw new Error(`statut enregistré : ${await statusOf("bivouac-1")}`);
    if (await page.eval(tchacs)) throw new Error(`vibrations : ${JSON.stringify(await page.eval("window.__vibes"))}`);
    if (!(await page.eval(`location.hash === "#/" && Boolean(document.querySelector(".screen-hub"))`))) throw new Error(`plus sur le hub : ${await page.eval("location.hash")}`);
    await page.goto(`${BASE}#/aventures`);
    await toolOn("bivouac-1");
  });

  await check(
    "?demo&tampon=espelette#/aventures, le toucher : les 15 aventures tamponnées, pluie dorée et feu d'artifice sous « ‹ Accueil », ‹ ›, Mini Cycy et sa bulle (sur le livre), puis complete[0] et complete[1], et la page « Prochaine destination ? »",
    async () => {
      await page.goto(`${BASE}?demo&tampon=espelette#/aventures`);
      await toolOn("espelette");
      await armTap();
      await page.tap(".pp-tool");
      await page.waitFor(`document.querySelectorAll('.pp-slot[data-status="stamped"]').length === 15`, 2000);
      await page.waitFor(`${said}[0] === ${JSON.stringify(A.complete[0])}`, 4000);
      // what lies over the confetti: the canvas made touchable for a moment, the topmost element at each one's middle
      const layers = await page.eval(`(() => {
        const canvas = document.querySelector(".fx-canvas");
        canvas.style.pointerEvents = "auto";
        const over = (selector) => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2) === canvas ? "sous" : "dessus";
        };
        const out = Object.fromEntries([".world-back", ".pp-prev", ".pp-next", ".aventures-buddy", ".pp-head .bubble", ".pp-book"].map((s) => [s, over(s)]));
        canvas.style.pointerEvents = "";
        return out;
      })()`);
      const wrong = Object.entries(layers).filter(([s, at]) => at !== (s === ".pp-book" ? "sous" : "dessus"));
      if (wrong.length) throw new Error(`confettis : ${JSON.stringify(layers)}`);
      await shot("complete");
      await page.waitFor(saying(A.complete[0]), 3000);
      await bubbleFits("complete[0]");
      await page.waitFor(saying(A.complete[1]), 9000);
      await bubbleFits("complete[1]");
      const order = (await page.eval("window.__said")).filter((line) => A.complete.includes(line));
      if (order.join("|") !== A.complete.join("|")) throw new Error(`répliques : ${JSON.stringify(order)}`);
      await page.waitFor(`${opened} && ${onPage(9)}`, 4000);
    },
  );

  // once a run, on its first phone (the same two sizes on the other would add nothing)
  if (vp.mobile && !landscaped) {
    landscaped = true;
    await check(
      "un téléphone en paysage (852 × 393, puis 667 × 375) : la 4e bulle de l'accueil, Mini Cycy montée, « Re ! … » et nudge sur un tampon encreur en haut de page, « Re ! … » en bas de page, stamped, complete[0] et complete[1] entières dans l'écran, sans toucher le tampon encreur ni « ‹ Accueil » ; « Touche pour tamponner » dans sa page ; les mots des pages (identité, emplacements de chaque sorte, le nom le plus long, « Prochaine destination ? ») dans leur emplacement ou leur page, sans se toucher ; ‹ › ronds",
      async () => {
        const greeting = (id) => saying(fill(A.again.progress, { next: nameOf(id) }));
        const still = (n) => `${opened} && ${onPage(n)} && !${book}.classList.contains("is-turning")`; // resting open on page n
        try {
          for (const [w, h] of [[852, 393], [667, 375]]) {
            const at = `en ${w} × ${h}`;
            await page.resize(w, h);
            // the welcome: her 4th line, the passport landed and she risen to its corner
            await seeded(`#/aventures`);
            await page.waitFor(`innerWidth === ${w} && innerHeight === ${h}`, 2000);
            await welcomePairs([".bubble", ".bubble", ".bubble"], 1);
            await page.waitFor(`${opened} && ${saying(WELCOME[3])} && !gsap.isTweening(document.querySelector(".pp-head"))`, 6000);
            await bubbleFits(`${at}, welcome[3]`);
            // then the page of the outing to live: a slot to live, a slot locked
            await page.waitFor(still(1), 5000);
            await labelsFit(`${at}, page 1 (à vivre, verrouillé)`);
            // under a page narrower than the two of them, ‹ › stay round
            const discs = await page.eval(`[".pp-prev", ".pp-next"].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.width, r.height].map(Math.round); })`);
            if (discs.some(([dw, dh]) => Math.abs(dw - dh) > 1)) throw new Error(`${at} : ‹ › écrasés (${JSON.stringify(discs)})`);
            // the identity page, and the outing with the longest name to live
            await page.goto(`${BASE}?demo#/aventures`);
            await page.waitFor(still(0), 8000);
            await labelsFit(`${at}, page d'identité`);
            await seeded(`#/aventures`, { ...WELCOMED, stamped: ids.slice(0, ids.indexOf(LONGEST.id)) });
            await page.waitFor(still(pageOf(AVENTURES, LONGEST.id)), 8000);
            await labelsFit(`${at}, « ${LONGEST.name} » à vivre`);
            // a slot at the top of its page (Île de Ré): the tool comes nearest to her bubble
            await page.goto(`${BASE}?demo&tampon=ile-de-re#/aventures`);
            await toolOn("ile-de-re");
            await labelsFit(`${at}, page 2 (à tamponner, verrouillé)`);
            await page.waitFor(greeting("ile-de-re"), 3000);
            await apart(`${at}, « Re ! … »`);
            await page.waitFor(`window.__nudgeAt && ${said}.length === 1 && ${JSON.stringify(A.nudge)}.includes(${said}[0])`, 9000);
            await apart(`${at}, nudge`);
            await page.tap(".pp-tool");
            await page.waitFor(`${said}.length === 1 && ${JSON.stringify(STAMPED("marqueze"))}.includes(${said}[0])`, 4000);
            await bubbleFits(`${at}, stamped`);
            // Marquèze lit, under the fresh stamp
            const lit = `document.querySelector('${slot("marqueze")}[data-status="open"] .slot-body')`;
            await page.waitFor(`${lit} && !gsap.isTweening(${lit})`, 3000);
            await labelsFit(`${at}, page 2 (tamponné, à vivre)`);
            // a slot at the bottom of its page (the canoe): the hint nearest to the page's edge
            await page.goto(`${BASE}?demo&tampon=canoe#/aventures`);
            await toolOn("canoe");
            await labelsFit(`${at}, page 1 (tamponné, à tamponner)`);
            await page.waitFor(greeting("canoe"), 3000);
            await apart(`${at}, « Re ! … » en bas de page`);
            // the passport complete
            await page.goto(`${BASE}?demo&tampon=espelette#/aventures`);
            await toolOn("espelette");
            await page.tap(".pp-tool");
            await page.waitFor(saying(A.complete[0]), 6000);
            await bubbleFits(`${at}, complete[0]`);
            await page.waitFor(saying(A.complete[1]), 9000);
            await bubbleFits(`${at}, complete[1]`);
            await page.waitFor(still(9), 4000);
            await labelsFit(`${at}, « Prochaine destination ? »`);
          }
        } finally {
          await page.resize(vp.width, vp.height);
        }
      },
    );
  }

  await check("un double toucher rapide sur « ‹ Accueil » (venu du hub, une page du site avant lui) : le hub, une seule entrée en arrière", async () => {
    await page.goto(`${BASE}?test`);
    await page.waitFor(`document.querySelector(".test-group")`, 4000);
    await viaHub();
    await page.eval(`window.__same = true`); // gone if the page before the hub opens
    const { x, y } = await page.center(".world-back");
    await page.doubleTap(x, y);
    await page.waitFor(`location.search === "?test" || (document.querySelector(".screen-hub") && document.querySelectorAll("#app > .screen").length === 1 && !document.querySelector(".plate"))`, 8000);
    const now = await page.eval(`({ search: location.search, hash: location.hash, same: window.__same === true })`);
    if (now.search !== "" || now.hash !== "#/" || !now.same) throw new Error(`deux entrées en arrière : ${JSON.stringify(now)}`);
  });

  await check("?test : le groupe « Nos aventures » a ses 5 adresses (la vraie progression, tout tamponné, l'accueil de Mini Cycy, le moment du tampon, la remise à zéro), « Les intros » une par sortie dans l'ordre du passeport ; aucun autre groupe ne les reprend", async () => {
    await page.goto(`${BASE}?test`);
    await page.waitFor(`document.querySelector(".test-group")`, 4000);
    const groups = await page.eval(`[...document.querySelectorAll(".test-group")].map((g) => ({ title: g.querySelector("h2").textContent, hrefs: [...g.querySelectorAll("a")].map((a) => a.getAttribute("href")) }))`);
    const ours = groups.find((g) => g.title === "Nos aventures")?.hrefs ?? [];
    const want = ["./#/aventures", "?demo#/aventures", "?demo&accueil#/aventures", "?demo&tampon=bivouac-1#/aventures", "?reset#/aventures"];
    if (ours.join(" ") !== want.join(" ")) throw new Error(`« Nos aventures » : ${JSON.stringify(ours)}`);
    const intros = groups.find((g) => g.title === "Les intros")?.hrefs ?? [];
    // one per outing in passport order; right after each outing with a scenario, one per beat (?demo&t=<at>)
    const each = passportPages(AVENTURES).flatMap((p) => p.ids || []).flatMap((id) => [
      `?demo#/aventures/${id}`,
      ...(SCENARIOS[id]?.beats ?? []).map(({ at }) => `?demo&t=${at}#/aventures/${id}`),
    ]);
    if (intros.join(" ") !== each.join(" ")) throw new Error(`« Les intros » : ${JSON.stringify(intros)}`);
    const links = await page.eval(`[...[...document.querySelectorAll(".test-group")].find((g) => g.querySelector("h2").textContent === "Les intros").querySelectorAll("a")].map((a) => ({ label: a.querySelector("span").textContent, note: a.querySelector("small")?.textContent ?? "" }))`);
    const first = links.findIndex((l) => l.label.endsWith(AVENTURES.find((a) => a.id === "bivouac-1").name));
    const beats = SCENARIOS["bivouac-1"].beats.map((b) => b.name);
    if (first < 0 || !/nouvelle/i.test(links[first].note)) throw new Error(`pas de mention « nouvelle » sur le Premier bivouac : ${JSON.stringify(links[first])}`);
    if (links.slice(first + 1, first + 1 + beats.length).map((l) => l.label).join("|") !== beats.join("|")) throw new Error(`les temps : ${JSON.stringify(links.slice(first + 1, first + 1 + beats.length))}`);
    // each beat's moment written the French way (« à 3,3 s »)
    const notes = SCENARIOS["bivouac-1"].beats.map(({ at }) => `à ${String(at).replace(".", ",")} s`);
    if (links.slice(first + 1, first + 1 + beats.length).map((l) => l.note).join("|") !== notes.join("|")) throw new Error(`les moments : ${JSON.stringify(links.slice(first + 1, first + 1 + beats.length).map((l) => l.note))}`);
    if (links.filter((l) => /nouvelle/i.test(l.note)).length !== Object.keys(SCENARIOS).length) throw new Error("« nouvelle » ailleurs que sur les sorties qui ont leur scénario");
    const elsewhere = groups.filter((g) => !["Nos aventures", "Les intros"].includes(g.title)).flatMap((g) => g.hrefs).filter((href) => href.includes("#/aventures"));
    if (elsewhere.length) throw new Error(`ailleurs sur la page : ${elsewhere.join(", ")}`);
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
