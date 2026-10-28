// « En savoir plus »: the souvenirs of a match, in a panel rising from the bottom over the zoomed-in painting.
// A row of polaroids that scrolls sideways (photos from assets/souvenirs/<date>/) and the story of the day; empty
// polaroids (« Souvenirs à venir ») until Kevin adds some, and « Rendez-vous le … » for a match still to come.
// Closes with its button, a tap outside the card, or a swipe down.
import { museumDate, museumDay, fill } from "../logic.js";
import { h } from "../dom.js";

const gsap = window.gsap;
const SWIPE = 80; // px down to close

export function souvenirPanel(match, { labels, title, onClose }) {
  const photos = match.photos.length
    ? match.photos.map((file, i) =>
        h(
          "figure",
          { class: "g3d-polaroid" },
          h("img", { src: `assets/souvenirs/${match.date}/${file}`, alt: `${labels.souvenirs} ${i + 1}`, loading: "lazy", draggable: "false" }),
        ),
      )
    : Array.from({ length: 3 }, () => h("figure", { class: "g3d-polaroid is-empty" }, h("span", { "aria-hidden": "true" }, "📷"), h("figcaption", {}, labels.empty)));

  const closeButton = h("button", { class: "g3d-souvenirs-close", type: "button", onclick: () => onClose() }, labels.close);
  const card = h(
    "div",
    { class: "g3d-souvenirs-card", role: "dialog", "aria-modal": "true", "aria-label": `${labels.souvenirs} · ${title}` },
    h("span", { class: "g3d-souvenirs-grip", "aria-hidden": "true" }),
    h("p", { class: "eyebrow" }, labels.souvenirs),
    h("h2", { class: "g3d-souvenirs-title" }, title),
    h("p", { class: "g3d-souvenirs-date" }, `${museumDate(match.date)} · ${labels.venues[match.venue]}`),
    h("div", { class: "g3d-photos" }, photos),
    !match.score && h("p", { class: "g3d-souvenirs-meet" }, fill(labels.meet, { day: museumDay(match.date) })),
    match.story && h("p", { class: "g3d-souvenirs-story" }, match.story),
    closeButton,
  );
  const el = h("div", { class: "g3d-souvenirs" }, card);
  // a tap outside the card closes it
  el.addEventListener("click", (e) => {
    if (e.target === el) onClose();
  });

  // a swipe down on the card, only from its top (the card scrolls when it is long; the photo row scrolls sideways)
  let startY = null;
  card.addEventListener(
    "touchstart",
    (e) => {
      startY = e.target.closest(".g3d-photos") || card.scrollTop > 0 ? null : e.touches[0].clientY;
    },
    { passive: true },
  );
  card.addEventListener(
    "touchmove",
    (e) => {
      if (startY === null) return;
      if (card.scrollTop > 0) {
        // she is scrolling the card after all
        startY = null;
        gsap.to(card, { y: 0, duration: 0.3, ease: "back.out(2)" });
        return;
      }
      const dy = Math.max(0, e.touches[0].clientY - startY);
      gsap.set(card, { y: dy });
    },
    { passive: true },
  );
  card.addEventListener("touchend", (e) => {
    if (startY === null) return;
    const dy = e.changedTouches[0].clientY - startY;
    startY = null;
    if (dy > SWIPE) onClose();
    else gsap.to(card, { y: 0, duration: 0.3, ease: "back.out(2)" });
  });

  return {
    el,
    open() {
      return new Promise((resolve) => {
        gsap.fromTo(el, { backgroundColor: "rgba(20, 12, 14, 0)" }, { backgroundColor: "rgba(20, 12, 14, 0.28)", duration: 0.4 });
        gsap.fromTo(card, { yPercent: 105 }, { yPercent: 0, y: 0, duration: 0.7, ease: "back.out(1.4)", onComplete: resolve });
        gsap.from(card.querySelectorAll(".g3d-polaroid"), { y: 30, rotation: 0, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.25, ease: "back.out(2)", clearProps: "opacity,transform" });
        closeButton.focus({ preventScroll: true });
      });
    },
    close() {
      return new Promise((resolve) => {
        gsap.to(el, { backgroundColor: "rgba(20, 12, 14, 0)", duration: 0.35 });
        gsap.to(card, { yPercent: 105, duration: 0.4, ease: "power2.in", onComplete: resolve });
      });
    },
  };
}
