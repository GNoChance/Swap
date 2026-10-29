// Nos aventures (#/aventures): the passport, opened on the outing to live (spec § 4), and each outing's intro
// (#/aventures/<id>). Mini Cycy stands on the book's corner: her welcome the first time, a word on later visits, a pout
// at a locked outing. The rubber stamp (Task 5) plugs in here.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { createAvatar } from "../avatar.js";
import { h, shake } from "../dom.js";
import { fill, pick } from "../logic.js";
import { parseRoute } from "../router.js";
import { createBubble } from "../scenes.js";
import { loadAventures, saveAventures } from "../state.js";
import { AVENTURES } from "./data.js";
import { addedSince, live, monthYear, nextToLive, pageOf, passportPages, statuses } from "./logic.js";
import { createPassport } from "./passport.js";
import { introScreen } from "./intro.js";
import { refused } from "./route.js";

const gsap = window.gsap;
const FALLBACK = { ink: "#7A1F35", tilt: 0 }; // a stamp missing from tampons.json
const AGAIN_FACES = { added: "surprised", complete: "smirk", progress: "joy" }; // her word on a later visit
const TAP_FACES = ["joy", "wink", "peace", "cool", "kiss"]; // touched, outside the welcome
const LANDED = 1500; // ms on page 0 once the welcome's passport has landed, before it turns to the outing to live
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** No break before « : ! ? » (French spacing), after a number (« 15 sorties »), nor inside an outing's name. */
const typeset = (text) => text.replace(/ ([:!?])/g, "\u00a0$1").replace(/(\d) (?=\p{L})/gu, "$1\u00a0");
const nameOf = (id) => (AVENTURES.find((a) => a.id === id)?.name ?? "").replace(/ /g, "\u00a0");

/** { [id]: { ink, tilt } } from tampons.json's list (not a list: the fallback for all). */
function byId(list) {
  const known = new Map((Array.isArray(list) ? list : []).map((s) => [s?.id, s]));
  return Object.fromEntries(
    AVENTURES.map(({ id }) => {
      const s = known.get(id);
      return [id, { ink: typeof s?.ink === "string" ? s.ink : FALLBACK.ink, tilt: Number.isFinite(s?.tilt) ? s.tilt : FALLBACK.tilt }];
    }),
  );
}

let reading = null; // tampons.json, read once for every intro and every return to the passport
/** The stamps; unreadable (offline): the fallback this time, and another try the next time. */
function loadStamps() {
  reading ??= fetch("assets/aventures/tampons/tampons.json")
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`tampons.json: ${response.status}`))))
    .then(byId, () => {
      reading = null;
      return byId([]);
    });
  return reading;
}

/** An address the passport stays on: #/aventures, or an outing whose intro cannot play (main.js puts it back). */
function keepsPassport(hash) {
  const route = parseRoute(hash);
  return route.world === "aventures" && (!route.id || refused(route));
}

/** The passport's screen, or (id) that outing's intro; main.js only sends an outing whose intro can play.
 *  open(id): to an intro; done(): an intro is over; back(): to the hub. */
export async function aventuresWorld({ id, from, open, done, back }) {
  const t = content.aventures;
  const stamps = await loadStamps();
  let progress = loadAventures(AVENTURES);
  if (id) {
    return introScreen({
      aventure: AVENTURES.find((a) => a.id === id),
      ink: stamps[id]?.ink,
      skippable: statuses(AVENTURES, progress)[id] === "stamped",
      onDone() {
        // seen through the first time: its stamp waits, saved at once
        const now = loadAventures(AVENTURES);
        const lived = live(AVENTURES, now, id);
        if (lived !== now) saveAventures(lived);
        done();
      },
    });
  }
  const ids = AVENTURES.map((a) => a.id);
  const next = nextToLive(AVENTURES, progress);
  // the outing to live, or (everything stamped) the page left open last time, which a save does not bound
  const start = next ? pageOf(AVENTURES, next) : Math.min(progress.page, passportPages(AVENTURES).length - 1);
  // back from an intro: the book is already open on that outing's page, and Mini Cycy says nothing
  const returning = from?.world === "aventures" && from.id ? from.id : null;
  let welcoming = !returning && !progress.welcomed; // the first visit, until the welcome is seen through
  const added = addedSince(AVENTURES, progress)[0];
  const kind = added ? "added" : next ? "progress" : "complete"; // her word on a later visit

  const bubble = createBubble();
  const buddy = createAvatar({
    face: returning ? "wink" : welcoming ? t.welcomeFaces[0] : AGAIN_FACES[kind],
    size: 80,
    className: "aventures-buddy",
    tappable: true,
    tapFaces: () => (welcoming ? [buddy.base] : TAP_FACES), // in the welcome, her face goes with her words
    onTap: () => sfx("tap"),
  });
  /** A line in her bubble, typed; the whole line sizes the bubble from the start (.pp-head .bubble::before). */
  function say(line) {
    bubble.el.dataset.say = line;
    return bubble.say(line);
  }
  let locked = null; // her last line at a locked outing

  const passport = createPassport({
    aventures: AVENTURES,
    stamps,
    statuses: statuses(AVENTURES, progress),
    onSlot(slotId, slot) {
      const status = statuses(AVENTURES, progress)[slotId];
      if (status === "open" || status === "stamped") {
        sfx("tap");
        open(slotId);
      } else if (status === "locked") {
        shake(slot, 8);
        locked = pick(t.locked, locked);
        buddy.react("pout", 2600);
        say(typeset(fill(locked, { next: nameOf(nextToLive(AVENTURES, progress)) })));
      }
    },
    onPage(page) {
      if (page === progress.page) return;
      progress = { ...progress, page };
      saveAventures(progress);
    },
  });

  // the welcome's pauses: a touch ends the one under way (as in the swap's scenes), and so does leaving
  let release = null;
  let stopped = false;
  const pause = (ms) =>
    new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        release = null;
        resolve();
      };
      const timer = setTimeout(done, ms);
      release = done;
    });
  /** Leaving: the welcome stops where it is, unsaved (it comes back the next time). */
  function stop() {
    stopped = true;
    release?.();
    bubble.skipTyping();
  }

  /** She hops in from the right, onto her corner. */
  async function hopIn() {
    gsap.set(buddy.el, { autoAlpha: 1 });
    gsap.fromTo(buddy.el, { x: innerWidth - buddy.el.getBoundingClientRect().left + 24 }, { x: 0, duration: 0.7, ease: "power2.out" });
    gsap.to(buddy.el, { keyframes: { y: [0, -64, 0] }, duration: 0.7, ease: "none" });
    await sleep(700);
    if (stopped) return;
    sfx("step"); // no haptics: on a link opened straight here, nothing has been touched yet (Chrome blocks vibrate)
    buddy.jump(10);
  }

  // Before the passport, she and her bubble stand in the middle of the screen (larger on a wide one), anchored at her
  // feet; they rise to the book's corner as it flies in.
  function centre() {
    const r = head.getBoundingClientRect();
    const scale = innerWidth >= 760 ? 1.3 : 1;
    const pair = 80 + Math.min(parseFloat(getComputedStyle(head).getPropertyValue("--say-max")), r.width - 92); // at its widest
    gsap.set(head, { transformOrigin: "100% 100%", scale, x: (innerWidth + pair * scale) / 2 - r.right, y: innerHeight * 0.56 - r.bottom });
  }

  /** The first visit, the passport hidden: she hops in and says her 4 lines; under the last one the passport flies in
   *  and opens on page 0, then 1.5 s later turns to the outing to live. Saved only then. */
  async function welcome() {
    const since = monthYear(AVENTURES.map((a) => a.from).sort()[0]);
    const lines = t.welcome.map((line) => typeset(fill(line, { since, n: AVENTURES.length })));
    const last = lines.length - 1;
    centre();
    await hopIn();
    for (let k = 0; k < last && !stopped; k++) {
      buddy.setBase(t.welcomeFaces[k]);
      await say(lines[k]);
      if (!stopped) await pause(900 + lines[k].length * 18);
    }
    if (stopped) return;
    buddy.setBase(t.welcomeFaces[last]);
    buddy.jump();
    sfx("drumroll");
    // « Tiens, le voilà ! Première destination… 🥁 »: she rises with the book, on its clock
    const flight = passport.arrive((arrival) => arrival.to(head, { x: 0, y: 0, scale: 1, duration: 1, ease: "power3.out", clearProps: "transform" }, 0));
    say(lines[last]);
    await flight;
    if (stopped) return;
    arrived = true;
    await sleep(LANDED);
    if (stopped) return;
    welcoming = false;
    progress = { ...progress, welcomed: true, known: ids };
    saveAventures(progress);
    passport.goTo(start);
  }

  /** A later visit: her word (an outing added since, else everything stamped, else where we were), the passport rising
   *  already open on its page; the outings shown are known from now on. */
  function greet() {
    progress = { ...progress, known: ids };
    saveAventures(progress);
    buddy.jump();
    say(typeset(fill(t.again[kind], { name: nameOf(added), next: nameOf(next) })));
    passport.arriveAt(start).then(() => (arrived = true));
  }

  // the passport flies in once the world has shown (its first frame); leaving before it is open, it goes at once:
  // its first raster would only slow the way out. An address that keeps it on screen is not leaving.
  let frame = 0;
  let arrived = false;
  const away = () => {
    if (keepsPassport(location.hash)) return;
    stop();
    cancelAnimationFrame(frame);
    if (arrived) return;
    passport.dispose();
    passport.el.hidden = true;
  };
  const backButton = h(
    "button",
    {
      class: "world-back",
      type: "button",
      onclick() {
        sfx("tap");
        back();
        away(); // once the address has changed
      },
    },
    t.back,
  );
  const head = h("div", { class: "pp-head" }, bubble.el, buddy.el); // Mini Cycy and her bubble
  const el = h(
    "section",
    { class: "screen screen-aventures screen-passport" },
    h("i", { class: "pp-rays", "aria-hidden": "true" }),
    h("div", { class: "pp-layout" }, head, passport.el),
    backButton,
  );
  if (welcoming) gsap.set(buddy.el, { autoAlpha: 0 }); // until she hops in

  // A touch anywhere during an arrival ends it, and writes out the line being typed; that touch does nothing else (no
  // next line). Otherwise a touch writes out the line, or else ends a pause of the welcome; not on the slots and the
  // buttons, whose touch means something else (a locked slot's line would be written out as it starts).
  let spent = false;
  el.addEventListener(
    "pointerdown",
    () => {
      spent = passport.arriving();
      if (!spent) return;
      passport.land();
      bubble.skipTyping();
    },
    true,
  );
  el.addEventListener("click", (e) => {
    if (spent || e.target.closest("button, .pp-slot")) return;
    if (!bubble.skipTyping()) release?.();
  });

  return {
    el,
    noHome: true,
    enter() {
      addEventListener("popstate", away); // the browser's back or forward: leaving
      if (returning) {
        arrived = true;
        passport.openAt(pageOf(AVENTURES, returning));
        return;
      }
      const begin = welcoming ? welcome : greet;
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(begin)));
    },
    leave() {
      stop();
      cancelAnimationFrame(frame);
      removeEventListener("popstate", away);
      passport.dispose();
      gsap.killTweensOf([head, buddy.el, ...buddy.el.querySelectorAll("*"), bubble.el]); // her idle bob runs forever
    },
  };
}
