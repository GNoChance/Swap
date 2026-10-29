// Nos aventures (#/aventures): the passport, opened on the outing to live (spec § 4), and each outing's intro
// (#/aventures/<id>). Mini Cycy above the book (Task 4) and the rubber stamp (Task 5) plug in here.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { h, shake } from "../dom.js";
import { parseRoute } from "../router.js";
import { loadAventures, saveAventures } from "../state.js";
import { AVENTURES } from "./data.js";
import { live, nextToLive, pageOf, passportPages, statuses } from "./logic.js";
import { createPassport } from "./passport.js";
import { introScreen } from "./intro.js";
import { refused } from "./route.js";

const FALLBACK = { ink: "#7A1F35", tilt: 0 }; // a stamp missing from tampons.json

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
  const next = nextToLive(AVENTURES, progress);
  // the outing to live, or (everything stamped) the page left open last time, which a save does not bound
  const start = next ? pageOf(AVENTURES, next) : Math.min(progress.page, passportPages(AVENTURES).length - 1);
  // back from an intro: the book is already open on that outing's page
  const returning = from?.world === "aventures" && from.id ? from.id : null;
  const passport = createPassport({
    aventures: AVENTURES,
    stamps,
    statuses: statuses(AVENTURES, progress),
    onSlot(slotId, slot) {
      const status = statuses(AVENTURES, progress)[slotId];
      if (status === "open" || status === "stamped") {
        sfx("tap");
        open(slotId);
      } else if (status === "locked") shake(slot, 8); // Mini Cycy's line comes with Task 4
    },
    onPage(page) {
      if (page === progress.page) return;
      progress = { ...progress, page };
      saveAventures(progress);
    },
  });
  // the passport flies in once the world has shown (its first frame); leaving before it is open, it goes at once:
  // its first raster would only slow the way out. An address that keeps it on screen is not leaving.
  let frame = 0;
  let arrived = false;
  const away = () => {
    if (keepsPassport(location.hash)) return;
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
  const head = h("div", { class: "pp-head" }); // the row of Mini Cycy and her bubble (Task 4)
  const el = h(
    "section",
    { class: "screen screen-aventures screen-passport" },
    h("i", { class: "pp-rays", "aria-hidden": "true" }),
    h("div", { class: "pp-layout" }, head, passport.el),
    backButton,
  );

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
      const fly = () =>
        passport.arrive().then(() => {
          arrived = true;
          return passport.goTo(start);
        });
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(fly)));
    },
    leave() {
      cancelAnimationFrame(frame);
      removeEventListener("popstate", away);
      passport.dispose();
    },
  };
}
