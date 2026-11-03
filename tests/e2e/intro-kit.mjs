// The end-to-end kit of the outings' own intros (js/aventures/intros/), shared by their suites (intros.mjs for the
// Premier bivouac, intros-canoe.mjs for the Premier canoë, intros-ile-de-re.mjs for the Île de Ré): the screens, the
// scripts set before each page's first line, what the page is asked (as expressions evaluated in it) or measured
// against, and the checks the suites share, each given its outing. Nothing here knows an outing.
import { SCENARIOS } from "../../js/aventures/intros/index.js";

export const VIEWPORTS = [
  { name: "iPhone 393 × 852 (puis tourné en 852 × 393)", width: 393, height: 852, mobile: true, turned: true },
  { name: "petit iPhone 375 × 667", width: 375, height: 667, mobile: true },
  { name: "PC 1440 × 900", width: 1440, height: 900, mobile: false, wide: true },
  { name: "PC 1920 × 1080", width: 1920, height: 1080, mobile: false, wide: true },
];
export const KEY = "swap-cyrielle:aventures";

/** Each moment of an outing's intro (intros/index.js): its start, and its middle (s). */
export const beatsOf = (id) => Object.fromEntries(SCENARIOS[id].beats.map(({ name, at }, k, all) => [name, { at, mid: (at + (all[k + 1]?.at ?? at + 2)) / 2 }]));

// ?graine=<save> (JSON) starts the page on that save, then drops itself from the address (as in aventures.mjs)
export const SEED = `{
  const seed = new URLSearchParams(location.search).get("graine");
  if (seed !== null) {
    localStorage.clear();
    if (seed) localStorage.setItem("${KEY}", seed);
    history.replaceState(null, "", location.pathname + location.hash);
  }
}`;
// ?decodage-rejete: decode() rejects on Cycy's front sticker in joy once it has arrived (as WebKit can, for another
// reason than a missing file); __rejected, how many times
export const REJECT = `if (location.search.includes("decodage-rejete")) {
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
export const LANDING = `new MutationObserver((_, watch) => {
  if (!document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]')) return;
  window.__landedAt = performance.now();
  watch.disconnect();
}).observe(document, { subtree: true, attributes: true, attributeFilter: ["class", "data-open"] });`;
// the stickers loaded ahead of an intro (a new Image() of one, js/aventures/screen.js, warm()), watched: __ahead, their
// paths; __collected, those the garbage collector has taken since. Once __gcAtIntro is set, a garbage collection (gc():
// cdp.mjs gives it) as an intro's screen comes in: past the passport's leave(), before the intro's mount() (main.js, show())
export const AHEAD = `{
  window.__ahead = [];
  window.__collected = [];
  const gone = new FinalizationRegistry((path) => window.__collected.push(path));
  window.Image = new Proxy(window.Image, {
    construct(target, args) {
      const img = Reflect.construct(target, args);
      queueMicrotask(() => {
        const path = new URL(img.src, location.href).pathname;
        if (!path.startsWith("/assets/aventures/") || !path.endsWith(".webp")) return;
        window.__ahead.push(path);
        gone.register(img, path);
      });
      return img;
    },
  });
  const append = Element.prototype.append;
  Element.prototype.append = function (...nodes) {
    if (window.__gcAtIntro && this.id === "app" && nodes[0]?.classList?.contains("screen-intro")) gc();
    return append.apply(this, nodes);
  };
}`;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const length = `Number(document.querySelector(".screen-intro")?.dataset.length)`; // ms, as the intro says
export const atPassport = `location.hash === "#/aventures" && document.querySelector(".screen-passport")`;
/** The passport open on page `n`, landed, its screen fully in: a touch counts. */
export const settled = (n) => `document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"][data-page="${n}"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`;
/** « Passer ▸ » fully shown, or gone (hidden). */
export const skipIs = (state) => `(() => {
  const el = document.querySelector(".screen-intro .intro-skip");
  const style = el && getComputedStyle(el);
  return Boolean(style) && (${state === "shown" ? `style.visibility === "visible" && style.opacity === "1"` : `style.visibility === "hidden"`});
})()`;
// the intro mounted, each of its stickers loaded or failed (img.complete); its timeline may still wait for them to be
// decoded (playing)
export const loaded =`document.querySelector(".screen-intro .st-stage") && ${length} > 0 && [...document.querySelectorAll(".st-actor__img")].every((img) => img.complete)`;
// the intro's timeline (found by its length)
export const timeline = `(() => {
  const length = Number(document.querySelector(".screen-intro")?.dataset.length) / 1000;
  return gsap.globalTimeline.getChildren(false, false, true).find((child) => Math.abs(child.duration() - length) < 0.02);
})()`;
// its timeline playing: its stickers decoded (ready), not only arrived; a hold before that would be undone by its play()
export const playing = `${loaded} && ${timeline}?.paused() === false`;
// the intro's timeline, held still at exactly `t` s: what is on screen then can be measured
export const holdAt = (t) => `(() => {
  ${timeline}.pause().seek(${t});
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
})()`;
// GSAP's lag smoothing, by its effect: after a frame of 0.8 s, how far a tween went (s). GSAP's own (500, 33) drops
// that time (a few hundredths); turned off, it keeps it all
export const lagged = `(async () => {
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
// an element shows: visible, and not see-through up its tree
export const SHOWS = `(el) => {
  if (getComputedStyle(el).visibility !== "visible") return false;
  for (let up = el; up; up = up.parentElement) if (Number(getComputedStyle(up).opacity) === 0) return false;
  return true;
}`;
// the boxes (px) of what shows (SHOWS: visible, and not see-through: opacity > 0 up its tree): the actors (the look
// each wears), the map's names and its pin, with the screen's size
export const sceneBoxes = `(() => {
  const box = (el, what) => { const r = el.getBoundingClientRect(); return { what, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const shows = ${SHOWS};
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
export const round = (b) => ({ ...b, left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) });
/** The boxes not entirely inside the screen (half a px of rounding allowed). */
export const outside = (screen, boxes) => boxes.filter((b) => !b || b.left < -0.5 || b.top < -0.5 || b.right > screen.width + 0.5 || b.bottom > screen.height + 0.5);

/** Every box entirely inside the screen (half a px of rounding allowed). */
export function inside({ screen, boxes }, where) {
  const out = outside(screen, boxes);
  if (!boxes.length) throw new Error(`${where} : pas de cadre ni de lettrage`);
  if (out.length) throw new Error(`${where} : hors de l'écran ${JSON.stringify(out.slice(0, 3).map(round))}`);
}
/** How far apart two boxes are (px; 0 if they touch or overlap). */
export const gap = (a, b) => Math.max(0, a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);

// the poster in place: its line and every letter of its title fully shown
export const built = `(() => {
  const parts = [...document.querySelectorAll(".af-title .af-letter, .af-line")];
  return parts.length > 1 && parts.every((el) => getComputedStyle(el).opacity === "1");
})()`;
// the boxes (px) of the poster's frame, title and line, and of each letter, with the screen's size
export const posterBoxes = `(() => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  return {
    screen: { width: innerWidth, height: innerHeight },
    title: document.querySelector(".af-title")?.textContent,
    line: document.querySelector(".af-line")?.textContent,
    boxes: [".af-frame", ".af-title", ".af-line", ".af-title .af-letter"].flatMap((s) => [...document.querySelectorAll(s)].map((el) => ({ what: s, ...box(el) }))),
  };
})()`;

// ── The checks the suites share, each given its outing ───────

/** The intro of outing `id` played through from `url`, as long as it says (`span`: { min, max }, ms) and not shorter:
 *  its poster says the lieu (`title`), then the stamp's name and dates (`line`), all of it on screen, its title out of
 *  the sound button's corner; then the passport. `where`: the screen, in the messages. */
export async function playedThrough(page, { url, id, span, title, line }, where) {
  await page.goto(url);
  await page.waitFor(`document.querySelector(".screen-intro .st-stage") && ${length} > 0`, 6000).catch(async () => {
    throw new Error(`${where} : pas de scène (data-length ${await page.eval(length)})`);
  });
  const ms = await page.eval(length);
  if (!(ms >= span.min && ms <= span.max)) throw new Error(`${where} : data-length ${ms}, pas entre ${span.min} et ${span.max}`);
  // the page's own clock: when its timeline started playing, when it left its address
  await page.eval(`(() => {
    window.__played = window.__ended = null;
    const watch = setInterval(() => {
      const tl = ${timeline};
      if (tl && tl.time() > 0 && window.__played === null) window.__played = performance.now() - tl.time() * 1000;
      if (location.hash !== "#/aventures/${id}") (window.__ended = performance.now()), clearInterval(watch);
    }, 10);
  })()`);
  await page.waitFor(built, ms + 4000);
  const seen = await page.eval(posterBoxes);
  if (seen.title !== title) throw new Error(`${where} : titre « ${seen.title} »`);
  if (seen.line !== line) throw new Error(`${where} : ligne « ${seen.line} »`);
  inside(seen, where);
  // the sound button's corner (the screen's top right 56 px): the title stays out of it
  const corner = seen.boxes.filter((b) => b.what === ".af-title .af-letter" && b.right > seen.screen.width - 56 && b.top < 56);
  if (corner.length) throw new Error(`${where} : le titre sous le bouton du son ${JSON.stringify(corner.map(round))}`);
  await page.waitFor(atPassport, 5000);
  const { played, ended } = await page.eval(`({ played: window.__played, ended: window.__ended })`);
  if (played === null || ended === null || ended - played < ms - 300) throw new Error(`${where} : jouée ${Math.round(ended - played)} ms pour ${ms}`);
}

/** A scene sticker blocked (`scene`: its path under assets/aventures/, without .webp): it goes to its stand-in
 *  assets/cyrielle/joy.webp (`what`: what it shows, in the messages), and the intro at `url` ends; no other error than
 *  the blocked file's (its check allows errors). */
export async function blockedScene(page, { url, scene, what }) {
  const before = page.errors.length;
  await page.block([`*/${scene}.webp`]);
  try {
    await page.goto(url);
    // the blocked sticker's look, before and after it goes to its stand-in (another scene of the two of them may share it)
    const looks = `[...document.querySelectorAll(".st-actor__img")].filter((img) => img.dataset.fallback === "assets/cyrielle/joy.webp" && (img.dataset.fell || img.src.endsWith("/${scene}.webp")))`;
    await page.waitFor(`${loaded} && ${looks}.length > 0 && ${looks}.every((img) => img.naturalWidth > 0)`, 8000);
    const now = await page.eval(`${looks}.map((img) => new URL(img.src).pathname)`);
    if (!now.length || now.some((src) => src !== "/assets/cyrielle/joy.webp")) throw new Error(`${what} : ${JSON.stringify(now)}`);
    await page.waitFor(atPassport, Number(await page.eval(length)) + 5000);
  } finally {
    await page.block([]);
  }
  const errors = page.errors.slice(before);
  if (errors.some((e) => !e.includes(`${scene.split("/")[1]}.webp`))) throw new Error(`erreurs : ${JSON.stringify(errors)}`);
}

/** Point 1: the passport opened on `save` (from `base`), outing `id` the one to live, on page `book` of the book: its
 *  scenario file (intros/<id>.js) already asked once the book has landed, and its stickers (`stickers`, their paths
 *  under assets/aventures/) too; once they have arrived, the touch on it neither asks the file again nor downloads any
 *  sticker again. */
export async function warmedOnPassport(page, { base, id, save, book, stickers }) {
  const scenarioAsked = `performance.getEntriesByType("resource").filter((e) => new URL(e.name).pathname === "/js/aventures/intros/${id}.js")`;
  await page.goto(`${base}?graine=${encodeURIComponent(JSON.stringify(save))}#/aventures`);
  await page.waitFor(`window.__landedAt`, 8000);
  await page.waitFor(`${scenarioAsked}.length === 1`, 3000).catch(async () => {
    throw new Error(`demandé ${await page.eval(`${scenarioAsked}.length`)} fois, le passeport posé`);
  });
  const after = await page.eval(`${scenarioAsked}[0].startTime - window.__landedAt`);
  if (after < -20) throw new Error(`demandé ${Math.round(-after)} ms avant que le livre soit posé`); // a frame's leeway
  await page.waitFor(`${settled(book)} && document.querySelector('.pp-slot[data-id="${id}"][data-status="open"]')`, 8000);
  // its stickers: all asked once the book landed, before any touch, each once (an entry is added once its response
  // has ended); then the touch downloads none again (the passport holds them, then its intro until its own are there:
  // screen.js, warm(); intro.js, held)
  const paths = JSON.stringify(stickers.map((p) => `/assets/aventures/${p}.webp`));
  const mine = `performance.getEntriesByType("resource").filter((e) => ${paths}.includes(new URL(e.name).pathname))`;
  await page.waitFor(`${stickers.length} > 0 && ${paths}.every((p) => ${mine}.some((e) => new URL(e.name).pathname === p && e.responseEnd > 0))`, 8000).catch(async () => {
    throw new Error(`stickers arrivés avant le toucher : ${await page.eval(`${mine}.filter((e) => e.responseEnd > 0).length`)} sur ${stickers.length}`);
  });
  const early = await page.eval(`${mine}.length`);
  await page.tap(`.pp-slot[data-id="${id}"]`);
  await page.waitFor(loaded, 8000);
  const asked = await page.eval(`${scenarioAsked}.length`);
  const late = await page.eval(`${mine}.slice(${early}).map((e) => e.transferSize)`); // an entry per image, but from the cache
  await page.goto("about:blank");
  if (asked !== 1) throw new Error(`redemandé au toucher : ${asked} demandes`);
  if (early !== stickers.length) throw new Error(`stickers demandés avant le toucher : ${early} demandes pour ${stickers.length}`);
  if (late.some((size) => size > 0)) throw new Error(`stickers retéléchargés au toucher : ${late.filter((size) => size > 0).length}`);
}

/** The first time (the passport opened on `save` from `base`, outing `id` the one to live on page `book`, out of the
 *  demo): a touch in the middle does not skip its intro; then the browser's back about 10 s in: the passport, no error,
 *  no scene left behind, and the outing not marked seen. */
export async function firstTime(page, { base, id, save, book }) {
  await page.goto(`${base}?graine=${encodeURIComponent(JSON.stringify(save))}#/aventures`);
  await page.waitFor(`${settled(book)} && document.querySelector('.pp-slot[data-id="${id}"][data-status="open"]')`, 8000);
  await page.tap(`.pp-slot[data-id="${id}"]`);
  await page.waitFor(`location.hash === "#/aventures/${id}" && ${playing}`, 8000);
  if ((await page.eval(`document.querySelector(".screen-intro").dataset.skippable`)) !== "false") throw new Error("passable la première fois");
  await page.waitFor(`${timeline}.time() > 6`, 9000);
  const touched = await page.eval(`${timeline}.time()`);
  await page.tap(".screen-intro");
  // still there and playing on, a second of its timeline later (by its own clock: a slow frame only delays it)
  await page.waitFor(`location.hash !== "#/aventures/${id}" || ${timeline}?.time() > ${touched + 1}`, 6000).catch(() => {});
  const later = await page.eval(`({ hash: location.hash, intro: Boolean(document.querySelector(".screen-intro .st-stage")), t: ${timeline}?.time(), paused: ${timeline}?.paused() })`);
  if (later.hash !== `#/aventures/${id}` || !later.intro || later.paused || !(later.t > touched + 1)) throw new Error(`après le toucher à ${touched.toFixed(2)} s : ${JSON.stringify(later)}`);
  await page.waitFor(`${timeline}.time() > 10`, 10000);
  await page.eval(`history.back()`);
  await page.waitFor(atPassport, 4000);
  await sleep(1500); // what the intro would have left behind
  const now = await page.eval(`({ hash: location.hash, stages: document.querySelectorAll(".st-stage").length, intro: Boolean(document.querySelector(".screen-intro")),
    slot: document.querySelector('.pp-slot[data-id="${id}"]')?.dataset.status, save: JSON.parse(localStorage.getItem("${KEY}")) })`);
  if (now.hash !== "#/aventures" || now.stages || now.intro || now.slot !== "open") throw new Error(JSON.stringify({ ...now, save: undefined }));
  if (now.save?.pending?.includes(id) || now.save?.stamped?.includes(id)) throw new Error(`enregistré : ${JSON.stringify(now.save)}`);
  await page.goto("about:blank");
}

/** Point 4: on the passport (from `base`), in and out of outing `id`'s intro three times in a row by the browser's back,
 *  at ?demo&t= each of `exits` (s), the last one in a scene of its own (`last`: its layers named `prefix`…, on show
 *  between `from` and `to` s; `where`, in the messages): gsap.globalTimeline.getChildren() back to its count at the
 *  start, and no .st-stage left. */
export async function inAndOut(page, { base, id, exits, last: { prefix, from, to, where } }) {
  await page.goto(`${base}?demo&t=${exits[0]}#/aventures`);
  const still = `${atPassport} && !document.querySelector(".screen-intro") && document.querySelector('.pp:not(.is-arriving) .pp-book[data-open="true"]') && !gsap.isTweening(document.querySelector(".screen-passport"))`;
  const count = `gsap.globalTimeline.getChildren().length`;
  /** The count of GSAP's children once the passport is still: only its own endless loops left (no screen fading, no
   *  timeline still going: a timeline left behind keeps this false). */
  const steady = async () => {
    await page.waitFor(still, 8000);
    await page.waitFor(`gsap.globalTimeline.getChildren().every((child) => child.repeat() === -1)`, 8000);
    return page.eval(count);
  };
  const before = await steady();
  for (const t of exits) {
    await page.eval(`history.replaceState(null, "", "?demo&t=${t}#/aventures")`); // where the next one starts
    await page.eval(`location.hash = "#/aventures/${id}"`);
    await page.waitFor(`${playing} && ${timeline}.time() >= ${t}`, 8000);
    await sleep(700);
    // the last one in its scene: on show by then
    const now = await page.eval(`({ t: ${timeline}.time(), scene: [...document.querySelectorAll('.st-layer[data-layer^="${prefix}"]')].some(${SHOWS}) })`);
    if (t === exits.at(-1) && !(now.t > from && now.t < to && now.scene)) throw new Error(`à ${now.t.toFixed(2)} s, pas ${where} ${JSON.stringify(now)}`);
    await page.eval(`history.back()`);
    await page.waitFor(still, 8000);
  }
  const after = await steady();
  const stages = await page.eval(`document.querySelectorAll(".st-stage").length`);
  if (after !== before || stages) throw new Error(`compte ${before} au départ, ${after} après ; ${stages} .st-stage`);
}

/** « Passer ▸ » in the demo (from `base`), `at` s into outing `id`'s intro: a touch ends it, its timeline stops at the
 *  touch, and the passport comes back. */
export async function skipped(page, { base, id, at }) {
  await page.goto(`${base}?demo&t=${at}#/aventures/${id}`);
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
}
