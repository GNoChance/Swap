// The plates between the hub and its worlds: a sheet of the world's colour grows out of its card to fill the screen,
// and folds back into it on the way back. GSAP tweens a clip-path inset (no Flip plugin), smooth on Safari.
const gsap = window.gsap;

const RADIUS = 28; // the cards' corners
const FULL = "inset(0px 0px 0px 0px round 0px)";
const around = (r) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${RADIUS}px)`;

function plate(color) {
  const el = document.createElement("div");
  el.className = "plate";
  el.style.background = color;
  document.body.append(el);
  return el;
}

/** Grows from the card's rectangle to the whole screen (0.55 s); resolves with the plate. */
export function coverFrom(rect, color) {
  const el = plate(color);
  return new Promise((resolve) => {
    gsap.fromTo(el, { clipPath: around(rect) }, { clipPath: FULL, duration: 0.55, ease: "power3.inOut", onComplete: () => resolve(el) });
  });
}

/** The whole screen at once (a page that opens folded). */
export function coverNow(color) {
  const el = plate(color);
  el.style.clipPath = FULL;
  return el;
}

/** The whole screen, fading in (0.25 s); resolves with the plate. */
export function fadeCover(color) {
  const el = plate(color);
  el.style.clipPath = FULL;
  return new Promise((resolve) => {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", onComplete: () => resolve(el) });
  });
}

/** Fades the plate away (0.35 s) and removes it. */
export function reveal(el) {
  return new Promise((resolve) => {
    gsap.to(el, {
      opacity: 0,
      duration: 0.35,
      ease: "power1.in",
      onComplete() {
        el.remove();
        resolve();
      },
    });
  });
}

/** Folds the plate from the whole screen into the card's rectangle (0.5 s), fades it, removes it. */
export function collapseInto(el, rect) {
  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete() {
          el.remove();
          resolve();
        },
      })
      .fromTo(el, { clipPath: FULL }, { clipPath: around(rect), duration: 0.5, ease: "power3.inOut" })
      .to(el, { opacity: 0, duration: 0.25, ease: "power1.in" });
  });
}
