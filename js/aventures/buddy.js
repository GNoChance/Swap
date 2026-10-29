// Mini Cycy over the passport (#/aventures) and her bubble: her lines, the welcome's pauses (a touch ends them), her hop
// in, and the middle of the screen where she stands until the passport flies in. screen.js says what she does and when.
import { sfx } from "../audio.js";
import { createAvatar } from "../avatar.js";
import { h } from "../dom.js";
import { createBubble } from "../scenes.js";

const gsap = window.gsap;
const WIDE = "(min-width: 760px)"; // style.css's two-page layout: the closed book lands in the middle, then slides open
const MARGIN = 8; // px, around her and her bubble standing in the middle of a short screen
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** createBuddy({ face, tapFaces }): { el (her row on the book's top right corner, .pp-head), avatar (avatar.js), say,
 *  touch, skip, pause, stop, stopped, hopIn, centre, rise, dispose }. */
export function createBuddy({ face, tapFaces }) {
  const bubble = createBubble();
  const avatar = createAvatar({ face, size: 80, className: "aventures-buddy", tappable: true, tapFaces, onTap: () => sfx("tap") });
  const el = h("div", { class: "pp-head" }, bubble.el, avatar.el);
  let release = null; // ends the welcome's pause under way
  let stopped = false;
  let centred = false;

  /** A line in her bubble, typed; the whole line sizes the bubble from the start (.pp-head .bubble::before). */
  function say(line) {
    bubble.el.dataset.say = line;
    const typed = bubble.say(line);
    if (centred) place(); // its height may not fit a short screen where she stands
    return typed;
  }

  /** Where the bubble's left edge sits in her row at its widest (its max-width, from the CSS). */
  function widest() {
    const { hidden } = bubble.el;
    bubble.el.hidden = false;
    bubble.el.style.width = "100vw"; // held back by its max-width
    const left = bubble.el.offsetLeft;
    bubble.el.style.width = "";
    bubble.el.hidden = hidden;
    return left;
  }

  // Before the passport, she and her bubble stand in the middle of the screen (larger on a wide one), anchored at her
  // feet, the bubble taken at its widest, and kept whole on a short screen (a phone turned sideways); while centred,
  // the screen's changes of size move them. They rise to the book's corner as it flies in.
  function place() {
    gsap.set(el, { x: 0, y: 0, scale: 1 }); // measured where the CSS puts them
    const r = el.getBoundingClientRect();
    const across = r.width - widest();
    const tall = r.height - Math.min(avatar.el.offsetTop, bubble.el.hidden ? Infinity : bubble.el.offsetTop); // up from her feet
    const scale = Math.min(matchMedia(WIDE).matches ? 1.3 : 1, (innerWidth - 2 * MARGIN) / across, (innerHeight - 2 * MARGIN) / tall);
    const feet = Math.max(innerHeight * 0.56, MARGIN + tall * scale);
    gsap.set(el, { transformOrigin: "100% 100%", scale, x: (innerWidth + across * scale) / 2 - r.right, y: feet - r.bottom });
  }
  function uncentre() {
    centred = false;
    removeEventListener("resize", place);
  }

  /** Leaving: the welcome stops where it is, unsaved (it comes back the next time). */
  function stop() {
    stopped = true;
    release?.();
    bubble.skipTyping();
    uncentre();
  }

  return {
    el,
    avatar,
    say,
    /** A touch: writes out the line being typed, or else ends the welcome's pause under way. */
    touch() {
      if (!bubble.skipTyping()) release?.();
    },
    /** Writes out the line being typed (a touch that ends an arrival). */
    skip: () => bubble.skipTyping(),
    /** A pause of the welcome: a touch ends it (as in the swap's scenes), and so does leaving. */
    pause: (ms) =>
      new Promise((resolve) => {
        const done = () => {
          clearTimeout(timer);
          release = null;
          resolve();
        };
        const timer = setTimeout(done, ms);
        release = done;
      }),
    stop,
    get stopped() {
      return stopped;
    },
    /** She hops in from the right, onto her corner. */
    async hopIn() {
      gsap.set(avatar.el, { autoAlpha: 1 });
      gsap.fromTo(avatar.el, { x: innerWidth - avatar.el.getBoundingClientRect().left + 24 }, { x: 0, duration: 0.7, ease: "power2.out" });
      gsap.to(avatar.el, { keyframes: { y: [0, -64, 0] }, duration: 0.7, ease: "none" });
      await sleep(700);
      if (stopped) return;
      sfx("step"); // no haptics: on a link opened straight here, nothing has been touched yet (Chrome blocks vibrate)
      avatar.jump(10);
    },
    /** In the middle of the screen, until she rises. */
    centre() {
      centred = true;
      place();
      addEventListener("resize", place);
    },
    /** Her rise to the book's corner, added to its arrival (on its clock): with the book on a phone, where it opens in
     *  place; with its opening on a wide screen, where it lands closed in the middle and slides under her corner. */
    rise(arrival) {
      uncentre();
      const wide = matchMedia(WIDE).matches;
      const motion = wide ? { duration: 0.9, ease: "power2.inOut" } : { duration: 1, ease: "power3.out" };
      arrival.to(el, { x: 0, y: 0, scale: 1, ...motion, clearProps: "transform" }, wide ? "open" : 0);
    },
    /** Gone (stopped first): her tweens killed, her idle bob runs forever. */
    dispose() {
      gsap.killTweensOf([el, avatar.el, ...avatar.el.querySelectorAll("*"), bubble.el]);
    },
  };
}
