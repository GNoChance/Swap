// Nos aventures (#/aventures): the passport, opened on the outing to live (spec § 4), and each outing's intro
// (#/aventures/<id>). Mini Cycy (buddy.js) stands on the book's corner: her welcome the first time, a word on later
// visits, a pout at a locked outing. Over an outing whose stamp waits, the rubber stamp (stamper.js) comes down; its
// touch stamps the passport, and the last stamp sets it free (gold dust, fireworks).
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { variant } from "../avatar.js";
import { centerOf, h, shake } from "../dom.js";
import { clearEffects, fireworks, goldDust } from "../effects.js";
import { fill, pick } from "../logic.js";
import { parseRoute } from "../router.js";
import { loadAventures, saveAventures } from "../state.js";
import { createBuddy } from "./buddy.js";
import { AVENTURES } from "./data.js";
import { addedSince, isComplete, live, monthYear, nextToLive, pageOf, passportPages, stamp, statuses } from "./logic.js";
import { createPassport } from "./passport.js";
import { introScreen } from "./intro.js";
import { refused } from "./route.js";
import { createStamper } from "./stamper.js";

const gsap = window.gsap;
const FALLBACK = { ink: "#7A1F35", tilt: 0 }; // a stamp missing from tampons.json
const AGAIN_FACES = { added: "surprised", complete: "smirk", progress: "joy" }; // her word on a later visit
const TAP_FACES = ["joy", "wink", "peace", "cool", "kiss"]; // touched, outside the welcome
const LANDED = 1500; // ms on page 0 once the welcome's passport has landed, before it turns to the outing to live
const NUDGE = 6000; // ms without a touch, the rubber stamp waiting, before Mini Cycy nudges (twice at most)
const LIT = 550; // ms after the contact: the stamp has flown, the next slot lights up
const NEXT_PAGE = 800; // ms after the contact: the next slot's page turns, if it is another
const OWN = 1000; // ms after the contact when a touch on the slot just stamped is still the stamp's (not its intro)
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
  let welcoming = !returning && !progress.welcomed; // the first visit, until the welcome is over (its page turned)
  const added = addedSince(AVENTURES, progress)[0];
  const kind = added ? "added" : next ? "progress" : "complete"; // her word on a later visit
  let frame = 0; // the passport flies in once the world has shown (its first frame)
  let arrived = false; // it has landed, or opened at once (back from an intro)

  const buddy = createBuddy({
    face: returning ? "wink" : welcoming ? t.welcomeFaces[0] : AGAIN_FACES[kind],
    tapFaces: () => (welcoming ? [buddy.avatar.base] : TAP_FACES), // in the welcome, her face goes with her words
  });
  let locked = null; // her last line at a locked outing
  let stamper = null; // the rubber stamp over the slot whose stamp waits, untouched: { el, dispose, id, page }
  let flying = null; // the one just pressed, until it clears itself away (or the screen is left)
  let nudged = null; // her last nudge
  let nudges = 0;
  let quiet = 0; // the countdown to her nudge
  let cheer = null; // her last line at a stamp
  let own = null; // { id, until }: the slot just stamped, still the stamp's (a double touch must not open its intro)
  const timers = new Set();
  /** fn in `ms`, unless the screen is left meanwhile. */
  function later(ms, fn) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!buddy.stopped) fn();
    }, ms);
    timers.add(timer);
  }

  const passport = createPassport({
    aventures: AVENTURES,
    stamps,
    statuses: statuses(AVENTURES, progress),
    onSlot(slotId, slot) {
      const status = statuses(AVENTURES, progress)[slotId];
      if (slotId === own?.id && performance.now() < own.until) return;
      if (status === "open" || status === "stamped") {
        sfx("tap");
        open(slotId);
      } else if (status === "locked") {
        shake(slot, 8);
        locked = pick(t.locked, locked);
        buddy.avatar.react("pout", 2600);
        buddy.say(typeset(fill(locked, { next: nameOf(nextToLive(AVENTURES, progress)) })));
      }
    },
    onPage(page) {
      // the rubber stamp waits on its page: it goes when the page is turned, and comes down again when it is back
      if (stamper && page !== stamper.page) withdraw();
      offer();
      if (page === progress.page) return;
      progress = { ...progress, page };
      saveAventures(progress);
    },
  });

  /** The outing whose stamp waits, if any. */
  function waitingId() {
    const id = nextToLive(AVENTURES, progress);
    return statuses(AVENTURES, progress)[id] === "pending" ? id : null;
  }

  /** The rubber stamp comes down over the slot whose stamp waits, once the book rests open on its page. */
  function offer() {
    const id = waitingId();
    if (!id || stamper || !arrived || buddy.stopped || passport.arriving() || passport.page() !== pageOf(AVENTURES, id)) return;
    new Image().src = `assets/aventures/tampons/${id}.svg`; // its print, ready for the contact
    const tool = createStamper({ slot: passport.slotOf(id), ink: stamps[id].ink, onPress: () => stamped(id) });
    stamper = { ...tool, id, page: pageOf(AVENTURES, id) };
    nudges = 0;
    idle();
  }

  /** The rubber stamp goes, untouched (its page turned, or leaving): it comes back with its page. */
  function withdraw() {
    clearTimeout(quiet);
    stamper?.dispose();
    stamper = null;
  }

  /** Without a touch for 6 s while the rubber stamp waits, Mini Cycy nudges: twice at most, never twice the same line. */
  function idle() {
    clearTimeout(quiet);
    if (!stamper || nudges >= 2) return;
    quiet = setTimeout(() => {
      if (!stamper || buddy.stopped) return;
      nudges++;
      nudged = pick(t.nudge, nudged);
      buddy.avatar.react("smirk", 2600);
      buddy.avatar.jump();
      buddy.say(typeset(nudged));
      idle();
    }, NUDGE);
  }

  /** The contact: stamped and saved at once (leaving now keeps it), the page gives, « TCHAC », the fresh print; Mini
   *  Cycy cheers, or (the last stamp) the passport is complete; then the next slot lights up, its page turned to. */
  function stamped(id) {
    clearTimeout(quiet);
    flying = stamper;
    stamper = null;
    progress = stamp(AVENTURES, progress, id);
    saveAventures(progress);
    own = { id, until: performance.now() + OWN };
    const next = nextToLive(AVENTURES, progress);
    // the next slot lights up once the stamp has flown
    passport.refresh(next ? { ...statuses(AVENTURES, progress), [next]: "locked" } : statuses(AVENTURES, progress));
    // the print fades in from 1.06 to 1, as a layer for that time: its filtered SVG is not redrawn at every size
    const print = passport.slotOf(id).querySelector(".pp-stamp");
    gsap.set(print, { willChange: "transform, opacity" });
    gsap.fromTo(print, { opacity: 0 }, { opacity: 0.94, duration: 0.22, ease: "power1.out" });
    gsap.fromTo(print, { "--in": 1.06 }, { "--in": 1, duration: 0.5, ease: "power3.out", onComplete: () => gsap.set(print, { clearProps: "opacity,willChange" }) });
    passport.press();
    sfx("stamp");
    shake(passport.el.querySelector(".pp-row"), 6);
    if (isComplete(AVENTURES, progress)) return complete(print);
    buddy.avatar.react(variant("joy"), 2400);
    buddy.avatar.jump();
    later(250, () => {
      cheer = pick(t.stamped, cheer); // an outing is left to live: the last stamp is complete()'s
      buddy.say(typeset(fill(cheer, { next: nameOf(next) })));
    });
    later(LIT, () => light(next));
    if (pageOf(AVENTURES, next) !== passport.page()) later(NEXT_PAGE, () => passport.goTo(pageOf(AVENTURES, next)));
  }

  /** The next slot to live, drawn at last: its words and gold dust come in (and the route to it, on the same page); on
   *  another page, that page is made ready to be turned to. */
  function light(next) {
    passport.refresh(statuses(AVENTURES, progress));
    const page = pageOf(AVENTURES, next);
    if (page !== passport.page()) return passport.prepare(page);
    const slot = passport.slotOf(next);
    const parts = [...slot.querySelectorAll(".slot-body, .slot-dust"), ...slot.parentElement.querySelectorAll(".pp-route")];
    gsap.fromTo(parts, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, clearProps: "opacity,visibility,transform" });
  }

  /** The last stamp: gold dust out of it, fireworks in the stamps' inks (the swap's pale ones would not show on the
   *  page), her two lines in turn (a touch hurries them, as in the welcome); as she asks for the next one, the passport
   *  turns to its « Prochaine destination ? » page. */
  async function complete(print) {
    goldDust(centerOf(print));
    later(250, () => {
      fireworks(5, [...new Set(Object.values(stamps).map((s) => s.ink))]);
      sfx("final");
    });
    const [first, second] = t.complete.map(typeset);
    buddy.avatar.setBase("joy");
    buddy.avatar.jump(36);
    await sleep(300);
    if (buddy.stopped) return;
    await buddy.say(first);
    if (!buddy.stopped) await buddy.pause(900 + first.length * 18);
    if (buddy.stopped) return;
    buddy.avatar.setBase("smirk");
    buddy.avatar.jump();
    buddy.say(second);
    passport.goTo(passportPages(AVENTURES).length - 1);
  }

  /** The first visit, the passport hidden: she hops in and says her 4 lines; under the last one the passport flies in
   *  and opens on page 0, then 1.5 s later turns to the outing to live. Saved once it has landed: all of it seen. */
  async function welcome() {
    const since = monthYear(AVENTURES.map((a) => a.from).sort()[0]);
    const lines = t.welcome.map((line) => typeset(fill(line, { since, n: AVENTURES.length })));
    const last = lines.length - 1;
    buddy.centre();
    await buddy.hopIn();
    for (let k = 0; k < last && !buddy.stopped; k++) {
      buddy.avatar.setBase(t.welcomeFaces[k]);
      await buddy.say(lines[k]);
      if (!buddy.stopped) await buddy.pause(900 + lines[k].length * 18);
    }
    if (buddy.stopped) return;
    buddy.avatar.setBase(t.welcomeFaces[last]);
    buddy.avatar.jump();
    sfx("drumroll");
    // « Tiens, le voilà ! Première destination… 🥁 »: she rises with it, to its corner
    const flight = passport.arrive(buddy.rise);
    buddy.say(lines[last]);
    await flight;
    if (buddy.stopped) return;
    arrived = true;
    // the whole welcome seen: saved at once (leaving now does not bring it back)
    progress = { ...progress, welcomed: true, known: ids };
    saveAventures(progress);
    await sleep(LANDED);
    if (buddy.stopped) return;
    welcoming = false;
    passport.goTo(start);
  }

  /** A later visit: her word (an outing added since, else everything stamped, else where we were), the passport rising
   *  already open on its page; the outings shown are known from now on. */
  function greet() {
    progress = { ...progress, known: ids };
    saveAventures(progress);
    buddy.avatar.jump();
    buddy.say(typeset(fill(t.again[kind], { name: nameOf(added), next: nameOf(next) })));
    passport.arriveAt(start).then(() => {
      arrived = true;
      offer(); // an outing whose stamp waits: its rubber stamp, once landed
    });
  }

  // leaving before the passport has landed, it goes at once: its first raster would only slow the way out. A rubber
  // stamp touched but not yet down goes at once too (leave() comes after the 0.3 s fade-out, past its contact): its
  // stamp still waits. An address that keeps the passport on screen is not leaving.
  const away = () => {
    if (keepsPassport(location.hash)) return;
    buddy.stop();
    withdraw();
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
  const el = h(
    "section",
    { class: "screen screen-aventures screen-passport" },
    h("i", { class: "pp-rays", "aria-hidden": "true" }),
    h("div", { class: "pp-layout" }, buddy.el, passport.el),
    backButton,
  );
  if (welcoming) gsap.set(buddy.avatar.el, { autoAlpha: 0 }); // until she hops in

  // A touch anywhere during an arrival ends it, and writes out the line being typed; that touch does nothing else (no
  // next line, no stamp: the rubber stamp comes after it). Otherwise a touch writes out the line, or else ends a pause
  // of the welcome; not on the slots, the rubber stamp and the buttons, whose touch means something else (a locked
  // slot's line would be written out as it starts). Any touch puts off her nudge.
  let spent = false;
  el.addEventListener(
    "pointerdown",
    (e) => {
      idle();
      spent = passport.arriving() && !e.target.closest(".world-back"); // leaving: the book goes as it is
      if (!spent) return;
      passport.land();
      buddy.skip();
    },
    true,
  );
  el.addEventListener("click", (e) => {
    if (spent || e.target.closest("button, .pp-slot, .pp-air")) return;
    buddy.touch();
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
      buddy.stop();
      cancelAnimationFrame(frame);
      removeEventListener("popstate", away);
      withdraw();
      flying?.dispose();
      timers.forEach(clearTimeout);
      clearEffects(); // the fireworks of a passport complete go with it
      passport.dispose();
      buddy.dispose();
    },
  };
}
