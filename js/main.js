// Screens (welcome → timeline → step panel → final) and the glue between games, progress, sounds and effects.
import { content } from "./content.js";
import * as P from "./logic.js";
import { fill, pick } from "./logic.js";
import { isDemo, isReplay, loadProgress, saveProgress, loadMuted, saveMuted, setFold, takeFold, loadHubCard } from "./state.js";
import { createRouter, legacyRedirect, routeHash } from "./router.js";
import { hubScreen } from "./hub.js";
import { hubWorlds, WORLDS } from "./hub-logic.js";
import { coverFrom, coverNow, fadeCover, reveal, collapseInto } from "./plate.js";
import { AVENTURES } from "./aventures/data.js";
import { sfx, unlockAudio, setMuted } from "./audio.js";
import { mountEffects, playEffect, fireworks, hearts, goldDust } from "./effects.js";
import { h, svg, icons, seal, shake, bump, centerOf, flash } from "./dom.js";
import { createFree } from "./games/free.js";
import { createAnagram } from "./games/anagram.js";
import { createBlanks } from "./games/blanks.js";
import { createQcm } from "./games/qcm.js";
import { createAcrostic } from "./games/acrostic.js";
import { createCrossword } from "./games/crossword.js";
import { createCamp } from "./games/camp.js";
import { createWordsearch } from "./games/wordsearch.js";
import { createAvatar, preloadFaces, variant, unlockVariants } from "./avatar.js";
import { welcomeScreen, bonusScreen } from "./scenes.js";
import { pubScreen } from "./pub.js";
import { debriefScreen, debriefReport } from "./debrief.js";
import { secretScreen } from "./secret.js";
import { ubbPreviewScreen } from "./ubb.js";
import { homeScreen } from "./home.js";
import { museumScreen } from "./museum.js";
import { testScreen } from "./testpage.js";

const gsap = window.gsap;
// Always the full animations, even with the iPhone setting « Réduire les animations » on (user's choice:
// on that setting she would leave and come back with her crisps in a blink). Set to true to bring the soft versions back.
const reduced = false;
const wide = matchMedia("(min-width: 720px)");
const { ui } = content;
const games = {
  free: createFree,
  anagram: createAnagram,
  blanks: createBlanks,
  qcm: createQcm,
  acrostic: createAcrostic,
  crossword: createCrossword,
  camp: createCamp,
  wordsearch: createWordsearch,
};
const FINAL = P.STEP_COUNT; // index of the "dernier mot" node on the timeline

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? Math.min(ms, 150) : ms));

let progress = loadProgress();

function commit(next) {
  progress = next;
  saveProgress(progress);
}

/** Furthest node the path reaches: the last unlocked step, or the final node once everything is open. */
function reachOf(p) {
  if (P.isComplete(p)) return FINAL;
  return p.steps.reduce((acc, s, i) => (s.status === "locked" ? acc : i), 0);
}

// ── Screens ─────────────────────────────────────────────────

const app = document.getElementById("app");
let current = null;

/** Fade the current screen out, then the next one in (`instant`: swap them at once, under a plate). `enter` runs
 *  once it is in the DOM; the promise resolves when the next screen is fully in. */
function show(screen, { instant = false } = {}) {
  const previous = current;
  current = screen;
  return new Promise((resolve) => {
    const enter = () => {
      previous?.el.remove();
      previous?.leave?.();
      homeButton.hidden = Boolean(screen.noHome);
      window.scrollTo(0, 0);
      app.append(screen.el);
      if (instant) resolve();
      else gsap.fromTo(screen.el, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.6, ease: "power1.out", onComplete: resolve });
      screen.enter?.();
    };
    if (!previous || instant) return enter();
    gsap.to(previous.el, { opacity: 0, duration: 0.3, ease: "power1.in", onComplete: enter });
  });
}

// ── The portal: the hub and its worlds ──────────────────────

const router = createRouter(sync);
let shown = null; // the route on screen
let busy = false; // a world is opening: taps on the cards wait, a change of address is handled right after

const sameRoute = (a, b) => a.world === b.world && a.id === b.id;

/** Puts the router's route on screen, one change at a time. */
async function sync() {
  if (busy) return; // done again once the current change is over
  const target = router.current();
  if (shown && sameRoute(shown, target)) return;
  busy = true;
  const from = shown;
  shown = target;
  try {
    await display(target, from);
  } catch (error) {
    console.error(error);
  } finally {
    busy = false;
  }
  sync(); // the address may have changed meanwhile (the browser's back button)
}

const colorOf = (world) => WORLDS.find((w) => w.id === world).color;

async function display(route, from) {
  // the swap was not written to be left without reloading (timers, a pub, a debrief…): leave it by reloading
  if (from?.world === "swap" && route.world !== "swap") return leaveSwap(route);
  if (route.world === "hub") return showHub(from);
  // from the hub, the card grows into a plate of its colour, the world opens underneath, the plate fades
  const card = current?.cardOf?.(route.world);
  let plate = null;
  if (card) {
    sfx("whoosh");
    current.dive(route.world);
    plate = await coverFrom(card.getBoundingClientRect(), colorOf(route.world));
  }
  let screen;
  try {
    screen = await worldScreen(route, from);
  } catch (error) {
    // the world did not load (a flaky connection): no plate left behind, back where we were
    console.error(error);
    plate?.remove();
    shown = from;
    router.back();
    return;
  }
  await show(screen, { instant: Boolean(plate) });
  if (plate) await reveal(plate);
}

async function worldScreen(route, from) {
  if (route.world === "swap") return home();
  if (route.world === "ubb") return museumWorld(() => router.back());
  const { aventuresWorld } = await import("./aventures/screen.js");
  return aventuresWorld({ id: route.id, from, back: () => router.back(), open: () => {}, done: () => {} });
}

/** The hub, on the card of the world we come from. Back from a world (or reloaded out of the swap), a plate of its
 *  colour covers the screen and folds back into its card. */
async function showHub(from) {
  const fold = from ? null : takeFold();
  const back = fold || (from && from.world !== "hub" ? from.world : null);
  const hub = hubScreen({ worlds: hubWorlds(content, AVENTURES.length), start: back || loadHubCard(), onEnter: enterWorld });
  if (!back) return show(hub);
  const plate = fold ? coverNow(colorOf(fold)) : await fadeCover(colorOf(back));
  await show(hub, { instant: true });
  await collapseInto(plate, hub.cardOf(back).getBoundingClientRect());
}

function enterWorld(world) {
  if (!busy) router.go({ world, id: null });
}

/** Leaves the swap by reloading the page on `route`; back on the hub, the plate folds into the Swap card. */
async function leaveSwap(route) {
  if (route.world === "hub") setFold("swap");
  await fadeCover(colorOf("swap"));
  history.replaceState(null, "", location.pathname + routeHash(route));
  location.reload();
  return new Promise(() => {}); // the page is going away
}

/** ⌂ on the swap's screens: back to the hub, reloading (also from ?rejouer, ?pub, ?demo…). */
function reloadToHub() {
  if (busy) return;
  busy = true;
  leaveSwap({ world: "hub", id: null });
}

function home() {
  return homeScreen({
    onResume: resume,
    onReplay: () => location.assign(`${location.pathname}?rejouer`),
  });
}

function hasWebGL() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // give the probe's context back at once
    return Boolean(gl);
  } catch {
    return false;
  }
}

/** The gallery's screen: in 3D, loaded only now (three.js is heavy); the CSS corridor if there is no WebGL, if loading
 *  fails, or with ?css. */
async function museumWorld(onBack) {
  const css = () => museumScreen({ onBack });
  if (new URLSearchParams(location.search).has("css") || !hasWebGL()) return css();
  try {
    const { museum3dScreen } = await import("./museum3d.js");
    return museum3dScreen({ onBack, onFail: () => show(css()) });
  } catch {
    return css();
  }
}

/** « Revoir mon parcours »: where she left the swap (the final screen once it is all open: her recap, the debrief). */
function resume() {
  if (!progress.started) return show(welcome());
  if (P.isComplete(progress)) return show(ending({ celebrate: false }));
  if (pubPending()) return playPub();
  show(timelineScreen());
}

// ── Welcome & bonus (scenes.js) ─────────────────────────────

function welcome() {
  return welcomeScreen({
    onBegin(snack) {
      const started = P.pickSnack(P.start(progress), snack || progress.snack);
      commit(isDemo ? P.unlockAll(started) : started);
      syncFaces();
      show(timelineScreen({ intro: true }));
    },
  });
}

/** After the last gift: the Nerds bonus the first time, then the final screen. */
function ending({ celebrate = true } = {}) {
  if (progress.bonus) return finalScreen({ celebrate });
  return bonusScreen({
    snack: snackOf(),
    onDone() {
      commit(P.seeBonus(progress));
      show(finalScreen({ celebrate: true }));
    },
  });
}

/** The ad break plays once, right after the gift n° content.pub.afterGift is opened. */
const PUB_STEP = content.pub.afterGift - 1;
const pubPending = () => !progress.pub && progress.steps[PUB_STEP]?.status === "done";

/**
 * walkFrom: back on the timeline, Mini Cyrielle then walks from that node to the next gift.
 * waitForTap: a « ▶ » button first (sound needs a tap when the page has just loaded).
 * preview (?pub): nothing is saved, the page reloads afterwards.
 */
function playPub({ walkFrom, waitForTap = false, preview = false } = {}) {
  const screen = pubScreen({
    waitForTap,
    values: textValues(),
    onDone() {
      if (preview) return location.replace(location.pathname + (isDemo ? "?demo" : ""));
      commit(P.seePub(progress));
      show(timelineScreen({ walkFrom }));
    },
  });
  screen.noHome = true; // the TV channel's logo sits in that corner
  show(screen);
}

/** The debrief; « Rejouer le débrief » starts it again, « Revoir le parcours » goes back to the timeline. */
function debrief() {
  return debriefScreen({
    values: textValues(),
    camp: progress.steps.find((s, i) => content.gifts[i].camps && s.choice)?.choice,
    onReplay: () => show(debrief()),
    onBack: backFromDebrief,
    onSecret: () => show(secret()),
  });
}

const backFromDebrief = () => show(progress.started ? timelineScreen() : welcome());

/** The secret ending (all endings found): behind the scenes, then Kevin. preview (?secret): nothing is saved. */
function secret({ preview = false } = {}) {
  return secretScreen({ preview, onReplay: () => show(debrief()), onBack: backFromDebrief });
}

/** The crisps she picked in the intro (an item of content.intro.snacks), or undefined. */
const snackOf = () => content.intro.snacks.find((s) => s.id === progress.snack);

/** {snack} in texts: the crisps she picked in the intro. */
function textValues() {
  return { snack: (snackOf() || content.intro.snacks[0]).name };
}

/** What a gift shows once revealed: the fondue follows the camp she picked (sticker, sentence, effect). */
function revealOf(gift, i) {
  const camp = gift.camps?.find((c) => c.id === progress.steps[i].choice);
  return { face: camp?.face || gift.revealFace, text: camp?.reveal || gift.reveal, effect: camp?.effect || gift.effect };
}

const isOpen = (i) => ["revealed", "done"].includes(progress.steps[i].status);

/** Stickers a revealed gift brings along (pyjama: she keeps it on to think, sleep and sulk; the potato, the 7MAGIC…).
 *  Each gift's own stickers are loaded as soon as it can be played, the crisps ones once picked. */
function syncFaces() {
  content.gifts.forEach((gift, i) => {
    if (progress.steps[i].status === "locked") return;
    preloadFaces([gift.revealFace, ...(gift.camps || []).map((c) => c.face), ...(gift.playFaces || [])]);
    if (gift.unlocksFaces && isOpen(i)) unlockVariants(gift.unlocksFaces);
  });
  const snack = snackOf();
  if (snack) preloadFaces([...snack.nibble, ...snack.playFaces, snack.empty]);
}

/** What she plays with once a gift is revealed (its sticker and playFaces), plus her crisps. */
const toyFaces = () => [
  ...new Set([
    ...content.gifts.flatMap((gift, i) => (isOpen(i) ? [revealOf(gift, i).face, ...(gift.playFaces || [])].filter(Boolean) : [])),
    ...(snackOf()?.playFaces || []),
  ]),
];

/** UBB stickers stay hidden until the jersey gift is open, so nothing gives it away. */
const UBB_STEP = content.gifts.findIndex((g) => g.revealFace?.startsWith("ubb"));
const ubbUnlocked = () => UBB_STEP >= 0 && progress.steps[UBB_STEP].status !== "locked" && progress.steps[UBB_STEP].status !== "active";

// ── Timeline ────────────────────────────────────────────────

let timeline = null;

function timelineScreen({ intro = false, walkFrom } = {}) {
  const t = content.timeline;
  const progressText = h("p", { class: "tl-progress" });
  const header = h(
    "header",
    { class: "tl-header" },
    h("img", { class: "tl-logo", src: "assets/logo/badge.webp", alt: "", width: "64", height: "64" }),
    h("h1", { class: "tl-title" }, t.title),
    h("p", { class: "ornament", "aria-hidden": "true" }, "✦"),
    progressText,
  );

  const pathSvg = svg(`<svg class="tl-path" aria-hidden="true"><path class="tl-path-base"/><path class="tl-path-done"/></svg>`);
  const [basePath, donePath] = pathSvg.querySelectorAll("path");
  const track = h("div", { class: "tl-track" }, pathSvg);

  const nodes = content.gifts.map((gift, i) => buildNode(gift, i));
  nodes.push(buildFinalNode());
  track.append(...nodes.map((n) => n.el));

  const el = h("section", { class: "screen screen-timeline" }, header, track);

  const buddy = createAvatar({
    face: "wink",
    size: 92,
    className: "tl-avatar",
    tappable: true,
    onTap: () => sfx("tap"),
    tapFaces: () => ["kiss", "cool", "smirk", "sushi-happy", "joy", "sushi-eat", ...toyFaces(), ...(ubbUnlocked() ? ["ubb-cap", "ubb-ball", "ubb-flag2"] : [])],
  });
  track.append(buddy.el);
  const LIFT = 12; // her feet stand a little above the seal's center

  /** Put her feet on the path, `len` px from the first seal (`hop` lifts her mid-jump). */
  function placeBuddy(len, hop = 0) {
    const p = donePath.getPointAtLength(Math.max(0, len));
    gsap.set(buddy.el, { x: p.x - buddy.width / 2, y: p.y - buddy.height - LIFT - hop });
  }

  // Path geometry: lengths[k] = path length from the first seal to seal k.
  let lengths = [0];
  let total = 0;
  let shownReach = intro ? 0 : walkFrom ?? reachOf(progress);
  let drawn = 0; // currently drawn length
  let drawing = false;
  let walking = false;

  function layout() {
    const width = track.offsetWidth;
    const height = track.offsetHeight;
    if (!width) return;
    const pts = nodes.filter((n) => !n.el.hidden).map((n) => centerIn(n.sealWrap, track));
    pathSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    pathSvg.setAttribute("width", width);
    pathSvg.setAttribute("height", height);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    lengths = [0];
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1];
      const [x1, y1] = pts[k];
      const dy = (y1 - y0) * 0.6;
      d += ` C${x0.toFixed(1)} ${(y0 + dy).toFixed(1)} ${x1.toFixed(1)} ${(y1 - dy).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      donePath.setAttribute("d", d);
      lengths.push(donePath.getTotalLength());
    }
    basePath.setAttribute("d", d);
    donePath.setAttribute("d", d);
    total = lengths.at(-1);
    if (!drawing) drawn = lengths[Math.min(shownReach, lengths.length - 1)];
    donePath.style.strokeDasharray = `${total} ${total}`;
    donePath.style.strokeDashoffset = total - drawn;
    if (!walking) placeBuddy(drawn);
  }

  /** Draw the path up to node `reach`; with `walk`, she hops along at the tip of the line. */
  function drawTo(reach, duration = 1.3, walk = false) {
    shownReach = reach;
    const from = drawn;
    const to = lengths[reach];
    const hops = Math.max(1, Math.round(Math.abs(to - from) / 70));
    const state = { len: from };
    drawing = true;
    walking = walk;
    return new Promise((resolve) => {
      gsap.to(state, {
        len: to,
        duration: reduced ? 0 : duration,
        ease: walk ? "power1.inOut" : "power2.inOut",
        onUpdate() {
          drawn = state.len;
          donePath.style.strokeDashoffset = total - drawn;
          if (walk) {
            const t = to === from ? 1 : (drawn - from) / (to - from);
            placeBuddy(drawn, Math.abs(Math.sin(t * Math.PI * hops)) * 22);
          }
        },
        onComplete() {
          drawing = walking = false;
          drawn = to;
          placeBuddy(to);
          resolve();
        },
      });
    });
  }

  // 30 s without a touch: she falls asleep. Any touch wakes her up.
  // Before that, every 12 s she keeps busy: a nibble from her packet, or a gift she already has.
  let sleepTimer = 0;
  let idleTimer = 0;
  function nudge() {
    clearTimeout(sleepTimer);
    clearTimeout(idleTimer);
    if (buddy.base.includes("sleep")) {
      buddy.setBase("wink");
      buddy.jump();
    }
    sleepTimer = setTimeout(() => !panel && buddy.setBase(variant("sleep")), 30000);
    idleTimer = setTimeout(idle, 12000);
  }

  function idle() {
    idleTimer = setTimeout(idle, 12000);
    if (panel || walking || buddy.base.includes("sleep")) return;
    const snack = snackOf();
    const toys = toyFaces();
    if (snack && !P.isComplete(progress) && (!toys.length || Math.random() < 0.55)) {
      // hand in the packet, a crisp, a happy sigh
      snack.nibble.forEach((face, k) => setTimeout(() => !panel && buddy.react(face, 1600), k * 1300));
      setTimeout(() => !panel && sfx("crunch"), 1400);
    } else if (toys.length) {
      buddy.react(pick(toys), 2600);
      buddy.jump(14);
    }
  }

  function render(except = -1) {
    nodes.forEach((n, i) => i !== except && n.render());
    progressText.textContent = fill(t.progress, { done: P.doneCount(progress), total: P.STEP_COUNT });
  }

  /** Show a newly unlocked node, still invisible, so the path can be laid out up to it before it fades in. */
  function appear(index) {
    gsap.set(nodes[index].el, { autoAlpha: 0 });
    nodes[index].render();
    layout();
  }

  const resizer = new ResizeObserver(() => layout());

  timeline = { nodes, render, drawTo, appear, buddy };
  render();

  return {
    el,
    enter() {
      layout();
      resizer.observe(track);
      document.fonts?.ready.then(layout);
      document.addEventListener("pointerdown", nudge);
      document.addEventListener("keydown", nudge);
      nudge();
      if (walkFrom !== undefined) {
        // back from the ad break: the walk to the next gift that the ad interrupted
        afterOpen(walkFrom);
        return;
      }
      if (!intro) {
        // Coming back mid-game: bring her (and the current gift) into view.
        const reach = reachOf(progress);
        if (reach > 0) wait(450).then(() => nodes[reach].el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }));
        return;
      }
      gsap.fromTo(buddy.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, delay: 1 });
      wait(1000).then(() => {
        buddy.react("joy", 1600);
        buddy.jump(40);
      });
      gsap.from(header.children, { opacity: 0, y: 14, duration: 0.7, stagger: 0.1, ease: "power2.out" });
      gsap.from(
        nodes.filter((n) => !n.el.hidden).map((n) => n.el),
        { opacity: 0, y: 22, duration: 0.6, stagger: 0.08, delay: 0.25, ease: "power2.out", clearProps: "transform" },
      );
      gsap.from(basePath, { opacity: 0, duration: 1, delay: 0.4 });
      wait(900).then(() => drawTo(reachOf(progress), 1.6, reachOf(progress) > 0));
    },
    leave() {
      resizer.disconnect();
      clearTimeout(sleepTimer);
      clearTimeout(idleTimer);
      document.removeEventListener("pointerdown", nudge);
      document.removeEventListener("keydown", nudge);
      if (timeline?.nodes === nodes) timeline = null;
    },
  };
}

/** Center of `el` in `container` coordinates, ignoring transforms. `container` must be positioned. */
function centerIn(el, container) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  for (let n = el; n && n !== container; n = n.offsetParent) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return [x, y];
}

function buildNode(gift, i) {
  const t = content.timeline;
  const sealWrap = h(
    "span",
    { class: "tl-seal" },
    seal(String(i + 1), { size: 60, seed: i + 3 }),
    h("span", { class: "tl-badge tl-badge--star" }, svg(icons.star)),
  );
  const status = h("span", { class: "tl-status" });
  const el = h(
    "button",
    { class: `tl-node ${i % 2 ? "is-right" : "is-left"}`, type: "button", onclick: () => onNode(i) },
    sealWrap,
    h("span", { class: "tl-text" }, h("span", { class: "tl-gift" }, fill(ui.gift, { n: i + 1 })), h("span", { class: "tl-name" }, gift.title), status),
  );
  const node = {
    el,
    sealWrap,
    render() {
      const state = progress.steps[i].status;
      el.dataset.state = state;
      el.hidden = state === "locked";
      status.textContent = { active: t.active, revealed: t.toOpen, done: `✦ ${gift.short}` }[state] || "";
    },
  };
  return node;
}

function buildFinalNode() {
  const sealWrap = h("span", { class: "tl-seal tl-seal--final" }, svg(icons.heart));
  const el = h(
    "button",
    { class: `tl-node tl-node--final ${FINAL % 2 ? "is-right" : "is-left"}`, type: "button", onclick: onFinalNode },
    sealWrap,
    h("span", { class: "tl-text" }, h("span", { class: "tl-name" }, content.timeline.finalNode)),
  );
  return {
    el,
    sealWrap,
    render() {
      el.dataset.state = "active";
      el.hidden = !P.isComplete(progress);
    },
  };
}

function onNode(i) {
  if (panel || progress.steps[i].status === "locked") return;
  sfx("open");
  openStep(i, timeline.nodes[i].el);
}

function onFinalNode() {
  if (!P.isComplete(progress)) return;
  show(ending());
}

/** A node unlocks: it fades in and its seal pops with a crack and gold dust. */
function pop(index) {
  const node = timeline?.nodes[index];
  if (!node) return;
  node.render();
  sfx("unlock");
  gsap.fromTo(node.el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "opacity,visibility,transform" });
  gsap.fromTo(node.sealWrap, { scale: 0.45, rotate: -18 }, { scale: 1, rotate: 0, duration: 0.75, ease: "back.out(2.2)", clearProps: "transform" });
  goldDust(centerOf(node.sealWrap));
}

/** After "J'ai ouvert mon cadeau": the path draws to the next node, which appears. */
async function afterOpen(previousReach) {
  if (!timeline) return;
  const reach = reachOf(progress);
  if (reach === previousReach) {
    timeline.render();
    if (P.isComplete(progress)) show(ending());
    return;
  }
  timeline.render(reach);
  timeline.appear(reach);
  timeline.nodes[reach].el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  await wait(500);
  const { buddy } = timeline;
  buddy.set("surprised");
  await timeline.drawTo(reach, 1.6, true);
  pop(reach);
  buddy.react("peace", 2400);
  buddy.jump();
  if (reach === FINAL) {
    await wait(1600);
    show(ending());
  }
}

// ── Step panel ──────────────────────────────────────────────

let panel = null;

function openStep(i, returnFocus) {
  const gift = content.gifts[i];
  const n = i + 1;
  const status = () => progress.steps[i].status;
  const reachBefore = reachOf(progress);
  let closed = false;
  let lastWrong = null;
  let errors = 0;

  // Mini Cyrielle peeks from the bottom of the sheet (sticky) and reacts.
  const surprise = status() === "revealed" && !progress.steps[i].found; // answer asked for, gift not opened yet
  const buddy = createAvatar({ face: status() === "active" ? variant("think") : surprise ? "smirk" : revealOf(gift, i).face || "wink", size: 78 });
  const buddyDock = h("div", { class: "sheet-buddy", "aria-hidden": "true" }, buddy.el);

  const feedback = h("p", { class: "feedback", "aria-live": "polite" });
  // onProgress: a partial success (one word right) clears a stale "wrong" message.
  const game = games[gift.type](gift, { ui, sfx, onFound: () => solve(true), onWrong, onProgress, onChoice });

  // Hint
  const hintZone = h("div", { class: "hint" });
  if (gift.hint) {
    const hintBox = () => h("div", { class: "hint-box" }, h("p", { class: "hint-title" }, ui.hintTitle), h("p", { class: "hint-text" }, gift.hint));
    if (progress.steps[i].hintUsed) hintZone.append(hintBox());
    else {
      const hintButton = h(
        "button",
        {
          class: "btn-link",
          type: "button",
          onclick() {
            sfx("tap");
            buddy.react("smirk", 2200);
            commit(P.useHint(progress, i));
            const box = hintBox();
            hintButton.replaceWith(box);
            gsap.from(box, { opacity: 0, height: 0, y: -6, duration: 0.45, ease: "power2.out", clearProps: "all" });
          },
        },
        ui.hint,
      );
      hintZone.append(hintButton);
    }
  }

  // "Voir la réponse" asks for a second tap, so it can't be pressed by accident.
  let confirmTimer = 0;
  const showAnswer = h(
    "button",
    {
      class: "btn-link btn-link--quiet",
      type: "button",
      onclick() {
        if (!showAnswer.classList.contains("is-confirm")) {
          sfx("tap");
          showAnswer.classList.add("is-confirm");
          showAnswer.textContent = ui.showAnswerConfirm;
          confirmTimer = setTimeout(() => {
            showAnswer.classList.remove("is-confirm");
            showAnswer.textContent = ui.showAnswer;
          }, 3500);
          return;
        }
        clearTimeout(confirmTimer);
        solve(false);
      },
    },
    ui.showAnswer,
  );
  const controls = h("div", { class: "step-controls" }, feedback, hintZone, h("div", { class: "step-actions" }, showAnswer));

  // Reveal
  const revealLabel = h("p", { class: "reveal-label" });
  const answerText = h("p", { class: "answer-text" }, gift.answer);
  const answerCard = h("div", { class: "answer-card" }, answerText);
  // « Voir la réponse »: the answer stays hidden (in the game too) until she has opened the gift for real
  let teaser = false;
  let walkPending = false; // opened after a teaser: closing the sheet must still walk on to the next gift
  const revealText = h("p", { class: "reveal-text" });
  const goOpen = h("p", { class: "reveal-go" }, fill(ui.goOpen, { n }));
  const revealActions = h("div", { class: "reveal-actions" });
  const reveal = h("div", { class: "reveal", hidden: true }, revealLabel, answerCard, revealText, goOpen, revealActions);

  const closeButton = h("button", { class: "sheet-close", type: "button", "aria-label": ui.close, onclick: () => close() }, svg(icons.close));
  const titleId = `step-title-${n}`;
  const sheet = h(
    "div",
    { class: "sheet", tabindex: "-1" },
    h("div", { class: "sheet-grip", "aria-hidden": "true" }),
    closeButton,
    h(
      "header",
      { class: "sheet-head" },
      seal(String(n), { size: 52, seed: i + 3 }),
      h("p", { class: "eyebrow" }, fill(ui.gift, { n })),
      h("h2", { class: "sheet-title", id: titleId }, gift.title),
    ),
    h("div", { class: "sheet-game" }, game.el),
    controls,
    reveal,
    buddyDock,
  );
  const backdrop = h("div", { class: "panel-backdrop", onclick: () => close() });
  const el = h("div", { class: "panel", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId }, backdrop, sheet);

  function onWrong({ target, message, face } = {}) {
    sfx("wrong");
    if (target) shake(target);
    errors++;
    // a wrong answer may come with its own sticker (QCM: the hike, the dumbbells)
    if (face) buddy.react(face, 3600);
    else buddy.react(variant(errors === 1 ? "pout" : errors === 2 ? "angry" : "cry"), 2400);
    shake(buddy.el, 5);
    const text = message === undefined ? (lastWrong = pick(ui.wrong, lastWrong)) : message;
    setFeedback(text);
  }

  /** Her pick inside the gift (fondue camp), saved right away. */
  function onChoice(choice) {
    commit(P.choose(progress, i, choice));
  }

  function onProgress() {
    setFeedback("");
    buddy.react("wink", 1500);
    buddy.jump(12);
  }

  function setFeedback(text) {
    feedback.textContent = text;
    if (text) gsap.fromTo(feedback, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
  }

  function solve(found) {
    if (status() !== "active") return;
    commit(P.solve(progress, i, found));
    syncFaces();
    buddy.setBase(revealOf(gift, i).face || variant(found ? "joy" : "surprised"));
    buddy.jump();
    if (found) {
      sfx("good");
      setFeedback("");
      wait(700).then(() => showReveal({ found: true, celebrate: true }));
    } else {
      buddy.setBase("smirk"); // « tu verras bien »: no sticker that would give the gift away
      showReveal({ found: false, celebrate: true, hidden: true });
    }
  }

  function showReveal({ found, celebrate, hidden = false }) {
    if (closed) return;
    teaser = hidden;
    revealLabel.textContent = found ? pick(ui.foundSelf) : ui.revealed;
    answerText.textContent = hidden ? ui.openToSee : gift.answer;
    answerCard.classList.toggle("is-teaser", hidden);
    revealText.textContent = revealOf(gift, i).text;
    revealText.hidden = hidden;
    const done = status() === "done";
    goOpen.hidden = done;
    revealActions.replaceChildren(
      done
        ? h("button", { class: "btn btn-secondary", type: "button", onclick: () => close() }, ui.close)
        : h("button", { class: "btn btn-primary", type: "button", onclick: opened }, ui.opened),
    );
    controls.hidden = true;
    reveal.hidden = false;
    if (!celebrate) return;
    gsap.from(reveal.children, { opacity: 0, y: 16, duration: 0.6, stagger: 0.12, ease: "power2.out", clearProps: "all" });
    reveal.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    if (hidden) {
      sfx("pop");
      return;
    }
    flash();
    sfx("reveal");
    answerCard.classList.remove("is-glowing");
    void answerCard.offsetWidth;
    answerCard.classList.add("is-glowing");
    wait(380).then(() => !closed && playEffect(revealOf(gift, i).effect, centerOf(answerCard)));
  }

  function opened(e) {
    bump(e.currentTarget);
    e.currentTarget.disabled = true;
    commit(P.open(progress, i));
    syncFaces(); // the next gift is now playable: load its stickers
    sfx("tap");
    if (teaser) unveil();
    else goOn();
  }

  /** After « Voir la réponse » and the gift opened: now the answer shows, with its effect. */
  function unveil() {
    teaser = false;
    walkPending = true;
    game.reveal(progress.steps[i].choice);
    answerText.textContent = gift.answer;
    answerCard.classList.remove("is-teaser");
    revealText.hidden = false;
    goOpen.hidden = true;
    buddy.setBase(revealOf(gift, i).face || variant("joy"));
    buddy.jump();
    const next = h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick(e) {
          bump(e.currentTarget);
          e.currentTarget.disabled = true;
          sfx("tap");
          goOn();
        },
      },
      ui.next,
    );
    revealActions.replaceChildren(next);
    gsap.fromTo(answerCard, { rotationY: 90 }, { rotationY: 0, duration: 0.55, ease: "back.out(2)", clearProps: "transform" });
    gsap.from([revealText, next], { opacity: 0, y: 12, duration: 0.5, stagger: 0.12, delay: 0.3, ease: "power2.out", clearProps: "all" });
    flash();
    sfx("reveal");
    answerCard.classList.remove("is-glowing");
    void answerCard.offsetWidth;
    answerCard.classList.add("is-glowing");
    wait(380).then(() => !closed && playEffect(revealOf(gift, i).effect, centerOf(answerCard)));
  }

  /** Gift opened: a kiss, the sheet closes, the path walks on (or the ad break plays). */
  function goOn() {
    walkPending = false;
    buddy.setBase(variant("kiss"));
    buddy.jump();
    wait(650)
      .then(() => close({ render: false }))
      .then(() => (i === PUB_STEP && !progress.pub ? playPub({ walkFrom: reachBefore }) : afterOpen(reachBefore)));
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  function close({ render = true } = {}) {
    if (walkPending) return goOn();
    if (closed) return Promise.resolve();
    closed = true;
    clearTimeout(confirmTimer);
    document.removeEventListener("keydown", onKey);
    document.activeElement?.blur?.();
    if (render) timeline?.render();
    return new Promise((resolve) => {
      gsap.to(backdrop, { opacity: 0, duration: 0.3 });
      gsap.to(sheet, {
        ...(wide.matches ? { opacity: 0, y: 20, scale: 0.97 } : { yPercent: 100 }),
        duration: 0.35,
        ease: "power2.in",
        onComplete() {
          el.remove();
          document.documentElement.classList.remove("is-locked");
          if (panel === api) panel = null;
          returnFocus?.focus({ preventScroll: true });
          resolve();
        },
      });
    });
  }

  const api = { close };
  panel = api;
  document.documentElement.classList.add("is-locked");
  document.body.append(el);
  document.addEventListener("keydown", onKey);

  gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35 });
  if (wide.matches) gsap.fromTo(sheet, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
  else gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "power3.out" });
  sheet.focus({ preventScroll: true });

  if (status() === "active") game.intro();
  else if (surprise) {
    showReveal({ found: false, celebrate: false, hidden: true });
  } else {
    game.reveal(progress.steps[i].choice);
    showReveal({ found: progress.steps[i].found, celebrate: false });
  }
}

// ── Final ───────────────────────────────────────────────────

function finalScreen({ celebrate }) {
  const f = content.final;
  const score = P.score(progress);
  const phrase = score === P.STEP_COUNT ? f.score.all : score >= P.STEP_COUNT / 2 ? f.score.high : score >= 1 ? f.score.low : f.score.none;

  const recap = h(
    "ol",
    { class: "recap" },
    content.gifts.map((gift, i) =>
      h(
        "li",
        { class: "recap-item" },
        seal(String(i + 1), { size: 34, seed: i + 3 }),
        h("span", { class: "recap-name" }, gift.short),
        progress.steps[i].found && h("span", { class: "recap-badge" }, f.foundBadge),
      ),
    ),
  );

  const buddy = createAvatar({
    face: score === P.STEP_COUNT ? "cool" : "peace",
    size: 116,
    tappable: true,
    onTap: () => sfx("tap"),
    tapFaces: ["kiss", "ubb-flag3", "joy", "ubb-cap", "sushi-full", "ubb-scarf", "wink", ...toyFaces()],
  });
  const card = h(
    "div",
    { class: "final-card" },
    h("div", { class: "final-avatar" }, buddy.el),
    h("p", { class: "eyebrow" }, f.eyebrow),
    h("h1", { class: "final-title" }, f.title),
    h("div", { class: "final-body" }, f.body.map((line) => h("p", {}, line))),
    f.signature && h("p", { class: "signature" }, f.signature),
    h(
      "div",
      { class: "score-card" },
      h("p", { class: "score-number" }, h("span", {}, String(score)), ` / ${P.STEP_COUNT}`),
      h("p", { class: "score-phrase" }, fill(phrase, { score })),
    ),
    h("h2", { class: "recap-title" }, f.recapTitle),
    recap,
    h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick() {
          sfx("tap");
          show(debrief());
        },
      },
      content.debrief.button,
    ),
    h(
      "button",
      {
        class: "btn btn-secondary",
        type: "button",
        onclick() {
          sfx("tap");
          show(timelineScreen());
        },
      },
      f.replay,
    ),
  );
  const el = h("section", { class: "screen screen-final" }, card);

  return {
    el,
    enter() {
      gsap.from(card.children, { opacity: 0, y: 18, duration: 0.8, stagger: 0.1, delay: 0.2, ease: "power2.out", clearProps: "all" });
      if (celebrate) {
        sfx("final");
        fireworks();
        buddy.react(variant("joy"), 1800);
        wait(400).then(() => buddy.jump(40));
      } else hearts(16);
    },
  };
}

// ── Chrome: sound toggle, demo badge, keyboard-aware viewport ──

let muted = loadMuted();
setMuted(muted);
const muteButton = h("button", {
  class: "mute",
  type: "button",
  onclick() {
    unlockAudio();
    muted = !muted;
    setMuted(muted);
    saveMuted(muted);
    renderMute();
    if (!muted) sfx("tap");
  },
});
function renderMute() {
  muteButton.replaceChildren(svg(muted ? icons.soundOff : icons.soundOn));
  muteButton.setAttribute("aria-label", muted ? ui.soundOff : ui.soundOn);
  muteButton.setAttribute("aria-pressed", String(muted));
}
renderMute();
document.body.append(muteButton);
if (isDemo) document.body.append(h("p", { class: "demo-badge" }, "Mode démo\nrien n'est enregistré"));

// Back to the home page from any screen of the swap: a fresh page load, which also leaves ?rejouer and ?demo
// (her progress is saved at every step, nothing is lost).
const homeButton = h(
  "button",
  {
    class: "home-button",
    type: "button",
    "aria-label": content.home.homeButton,
    onclick() {
      sfx("tap");
      reloadToHub();
    },
  },
  "⌂",
);
document.body.append(homeButton);

// Any first touch wakes the audio up (a reload lands straight on the timeline, without the welcome button).
for (const type of ["pointerdown", "keydown"]) document.addEventListener(type, unlockAudio, { once: true, capture: true });

// iOS keeps the layout viewport under the keyboard: expose the visible height so the sheet stays above it.
const vv = window.visualViewport;
if (vv) {
  const root = document.documentElement;
  const sync = () => {
    root.style.setProperty("--vvh", `${vv.height}px`);
    root.style.setProperty("--kb", `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
  };
  vv.addEventListener("resize", sync);
  vv.addEventListener("scroll", sync);
  sync();
}

// ── Boot ────────────────────────────────────────────────────

// ?musee, the gallery's address before the portal, becomes #/ubb (keeping ?css and the others)
const legacy = legacyRedirect(location.search);
if (legacy) history.replaceState(null, "", location.pathname + legacy.search + legacy.hash);

mountEffects();
preloadFaces();
syncFaces();
const preview = new URLSearchParams(location.search);

/** ?demo&scene=…: straight to one scene, from the ?test page (demo mode: nothing is saved). */
function playScene(scene) {
  const allDone = () => content.gifts.reduce((p, _, i) => P.open(P.solve(p, i, true), i), P.start(progress));
  const snack = preview.get("snack") || "munch";
  if (scene === "intro") return show(welcome());
  if (scene.startsWith("gift-")) {
    const i = Number(scene.slice(5)) - 1;
    commit(P.pickSnack(P.unlockAll(P.start(progress)), snack));
    syncFaces();
    show(timelineScreen());
    return wait(900).then(() => timeline && openStep(i, timeline.nodes[i].el));
  }
  if (scene === "bonus") {
    commit(P.pickSnack(allDone(), snack));
    return show(ending());
  }
  if (scene === "final") {
    commit(P.seeBonus(P.pickSnack(allDone(), snack)));
    return show(finalScreen({ celebrate: true }));
  }
  if (scene === "debrief") return show(debrief());
  if (scene === "map") {
    const store = { runs: [], found: Object.keys(content.debrief.endings), secret: true };
    return show(debriefReport({ onPlay: () => show(debrief()), store }));
  }
  show(testScreen());
}

if (preview.has("test")) show(testScreen());
else if (isDemo && preview.has("scene")) playScene(preview.get("scene"));
else if (preview.has("pub")) playPub({ waitForTap: true, preview: true });
else if (preview.has("debrief")) show(debriefReport({ onPlay: () => show(debrief()) })); // her answers, for you
else if (preview.has("secret")) show(secret({ preview: true })); // the secret ending, without finding the 13 endings
else if (preview.has("ubb")) show(ubbPreviewScreen()); // the UBB surprise on its own
else if (isReplay) show(welcome()); // « Tout rejouer depuis le début »: the intro, nothing saved
else router.start(); // the hub, or the world in the address
