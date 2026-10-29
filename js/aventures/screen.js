// Nos aventures (#/aventures): the passport, opened on the outing to live (spec § 4). The intros (Task 3), Mini Cycy
// above the book (Task 4) and the rubber stamp (Task 5) plug in here.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { h } from "../dom.js";
import { loadAventures, saveAventures } from "../state.js";
import { AVENTURES } from "./data.js";
import { nextToLive, pageOf, passportPages, statuses } from "./logic.js";
import { createPassport } from "./passport.js";

const FALLBACK = { ink: "#7A1F35", tilt: 0 }; // a stamp missing from tampons.json

/** { [id]: { ink, tilt } }, read from tampons.json (unreadable: the fallback for all). */
async function loadStamps() {
  let list = [];
  try {
    const response = await fetch("assets/aventures/tampons/tampons.json");
    if (response.ok) list = await response.json();
  } catch {
    /* offline: plain stamps */
  }
  const known = new Map((Array.isArray(list) ? list : []).map((s) => [s?.id, s]));
  return Object.fromEntries(
    AVENTURES.map(({ id }) => {
      const s = known.get(id);
      return [id, { ink: typeof s?.ink === "string" ? s.ink : FALLBACK.ink, tilt: Number.isFinite(s?.tilt) ? s.tilt : FALLBACK.tilt }];
    }),
  );
}

/** The passport's screen. id, from, open(id) and done() come into play with the intros (Task 3). */
export async function aventuresWorld({ id, from, open, done, back }) {
  const t = content.aventures;
  const stamps = await loadStamps();
  let progress = loadAventures(AVENTURES);
  const next = nextToLive(AVENTURES, progress);
  // the outing to live, or (everything stamped) the page left open last time, which a save does not bound
  const start = next ? pageOf(AVENTURES, next) : Math.min(progress.page, passportPages(AVENTURES).length - 1);
  const passport = createPassport({
    aventures: AVENTURES,
    stamps,
    statuses: statuses(AVENTURES, progress),
    onSlot() {}, // touching a slot opens its intro with Task 3
    onPage(page) {
      if (page === progress.page) return;
      progress = { ...progress, page };
      saveAventures(progress);
    },
  });
  // the passport flies in once the world has shown (its first frame); leaving before it is open, it goes at once:
  // its first raster would only slow the way out
  let frame = 0;
  let arrived = false;
  const away = () => {
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
        away();
        back();
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
