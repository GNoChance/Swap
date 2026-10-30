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
      if (skip) {
        gsap.set(skip, { autoAlpha: 0, y: 12 });
        timeline.to(skip, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.5);
      }
      // it ends on its own timeline, not by the clock: a locked phone (a hidden page) holds it where it was, so the
      // first time it is seen in full (GSAP's lag smoothing resumes it there; a frame under 0.5 s costs nothing)
      timeline.call(finish, null, end);
      await ready;
      if (finished) return; // left (or skipped) while it was getting ready
      timeline.seek(startAt()).play(); // a seek fires none of the callbacks it passes
    },
    leave() {
      stop();
      removeEventListener("popstate", left);
      played?.dispose();
    },
  };
}
