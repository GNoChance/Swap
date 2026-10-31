// An outing's intro (#/aventures/<id>): the screen that plays its scenario (spec § 3), the outing's own if intros/index.js
// lists it, else the provisional intro (intros/provisoire.js). It ends on the scenario's timeline, then onDone(), unless
// the browser's back or forward has left its address. The first time it plays in full; once the outing is stamped,
// « Passer ▸ » or a touch anywhere ends it. ?demo&t=<s>: it starts at that moment of its timeline.
import { content } from "../content.js";
import { sfx } from "../audio.js";
import { h } from "../dom.js";
import { parseRoute } from "../router.js";
import { isDemo } from "../state.js";
import { SCENARIOS } from "./intros/index.js";
import * as provisoire from "./intros/provisoire.js";

const gsap = window.gsap;

/** The outing's scenario: its module, or the provisional intro if it has none or its module does not load. */
export async function loadScenario(id) {
  try {
    return (await SCENARIOS[id]?.load()) ?? provisoire;
  } catch {
    return provisoire; // the browser has already said which file did not load
  }
}

/** GSAP drops the time of any frame over 0.5 s (its lag smoothing): on a slow device the intro would end late. While
 *  an intro plays its timeline keeps the clock's time, all but the time the page is hidden (a locked phone): that
 *  frame back is dropped as before, which holds the intro where it was. Its first frame too: the page may be hidden
 *  as it starts (locked while its stickers came), or shown again without a frame yet. → the function that puts it back. */
function keepTime() {
  const { ticker } = gsap;
  let live = true;
  const again = () => live && ticker.lagSmoothing(0);
  const next = () => ticker.add(again, true); // once its next frame has dropped what it must
  const seen = () => (document.hidden ? ticker.lagSmoothing(500, 33) : next());
  next();
  document.addEventListener("visibilitychange", seen);
  return () => {
    live = false; // a frame still to come must not turn it off again
    document.removeEventListener("visibilitychange", seen);
    ticker.lagSmoothing(500, 33); // GSAP's own
  };
}

/** Where its timeline starts (s): ?t=<s> in the demo, else its beginning. */
function startAt() {
  const t = Number(new URLSearchParams(location.search).get("t"));
  return isDemo && t >= 0 ? t : 0;
}

/** introScreen({ aventure, ink, skippable, scenario, onDone }): a screen ({ el, noHome, enter, leave }) playing
 *  `scenario` (loadScenario()). */
export function introScreen({ aventure, ink, skippable, scenario, onDone }) {
  const skip = skippable ? h("button", { class: "intro-skip", type: "button" }, content.aventures.skip) : null;
  const el = h(
    "section",
    { class: "screen screen-aventures screen-intro", "data-id": aventure.id, "data-skippable": String(Boolean(skippable)) },
    skip,
  );

  let played = null; // the scenario on screen: { timeline, ready, dispose }
  let release = null; // keepTime()'s undoing
  let appear = null; // « Passer ▸ » coming in: its own tween, not its timeline's (it shows while the stickers come)
  let finished = false;
  const stop = () => (finished = true);
  // The browser's back or forward can leave its address while it plays (it stays on screen until the next screen is
  // ready): then it is over at once, with no effect. And it never ends for an address it has already left.
  const here = () => {
    const route = parseRoute(location.hash);
    return route.world === "aventures" && route.id === aventure.id;
  };
  const left = () => here() || stop();
  function finish() {
    if (finished) return;
    stop();
    played?.timeline.pause(); // nothing more of it (a sound, a bubble) while the screen goes
    if (here()) onDone();
  }
  // a touch anywhere (the button included) ends a skippable intro; the first time, a touch does nothing
  if (skippable)
    el.addEventListener("click", () => {
      if (finished) return;
      sfx("tap");
      finish();
    });

  return {
    el,
    noHome: true,
    async enter() {
      addEventListener("popstate", left);
      played = scenario.mount(el, { aventure, ink }); // on screen: it can measure itself
      const { timeline, ready } = played;
      const end = timeline.duration(); // s
      el.dataset.length = String(Math.round(end * 1000));
      // its own scenario ends on its poster (its last beat): « Passer ▸ » goes as the poster comes, off its frame
      const poster = scenario === provisoire ? undefined : SCENARIOS[aventure.id]?.beats.at(-1).at;
      if (skip) {
        gsap.set(skip, { autoAlpha: 0, y: 12 });
        appear = gsap.to(skip, { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.5, ease: "power2.out" });
        if (poster !== undefined) timeline.call(() => appear.kill(), null, poster).to(skip, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, poster);
      }
      // it ends on its own timeline, not by a timer: a locked phone (a hidden page) holds it where it was, so the
      // first time it is seen in full (keepTime() drops the time it was hidden, and only that)
      timeline.call(finish, null, end);
      await Promise.resolve(ready).catch(() => {}); // it resolves; were it to reject, the intro plays all the same
      if (finished) return; // left (or skipped) while it was getting ready
      const start = startAt();
      if (start >= end) return finish(); // ?t= past its end: over at once, not frozen on its last frame
      if (start >= poster) appear?.kill(); // ?t= on its poster: without « Passer ▸ »
      release = keepTime(); // only now: the heavy frames after its mount kept GSAP's smoothing for the screen's fade-in
      timeline.seek(start).play(); // a seek fires none of the callbacks it passes
    },
    leave() {
      stop();
      removeEventListener("popstate", left);
      release?.();
      appear?.kill();
      played?.dispose();
    },
  };
}
