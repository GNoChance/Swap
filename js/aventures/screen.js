// Nos aventures (#/aventures): the passport, opened on the outing to live (spec § 4), and each outing's intro
// (#/aventures/<id>). Mini Cycy (buddy.js) stands on the book's corner: her welcome the first time, a word on later
// visits, a pout at a locked outing. The rubber stamp (Task 5) plugs in here.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { h, shake } from "../dom.js";
import { fill, pick } from "../logic.js";
import { parseRoute } from "../router.js";
import { loadAventures, saveAventures } from "../state.js";
import { createBuddy } from "./buddy.js";
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
        buddy.avatar.react("pout", 2600);
        buddy.say(typeset(fill(locked, { next: nameOf(nextToLive(AVENTURES, progress)) })));
      }
    },
    onPage(page) {
      if (page === progress.page) return;
      progress = { ...progress, page };
      saveAventures(progress);
    },
  });

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
    passport.arriveAt(start).then(() => (arrived = true));
  }

  // leaving before the passport has landed, it goes at once: its first raster would only slow the way out. An address
  // that keeps it on screen is not leaving.
  const away = () => {
    if (keepsPassport(location.hash)) return;
    buddy.stop();
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
  // next line). Otherwise a touch writes out the line, or else ends a pause of the welcome; not on the slots and the
  // buttons, whose touch means something else (a locked slot's line would be written out as it starts).
  let spent = false;
  el.addEventListener(
    "pointerdown",
    (e) => {
      spent = passport.arriving() && !e.target.closest(".world-back"); // leaving: the book goes as it is
      if (!spent) return;
      passport.land();
      buddy.skip();
    },
    true,
  );
  el.addEventListener("click", (e) => {
    if (spent || e.target.closest("button, .pp-slot")) return;
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
      passport.dispose();
      buddy.dispose();
    },
  };
}
