// A souvenir in full screen: the photo, or the video playing in the page with its sound, who added it and when.
// Arrows, a horizontal swipe or ← / → go to the next or previous; « Fermer » or Escape closes. It sits over the
// souvenirs panel, under the « ← Accueil » and sound buttons.
import { h } from "../dom.js";

const gsap = window.gsap;
const SWIPE = 50; // px sideways to change
const day = (iso) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** items: photos and videos (with url), index: the one tapped. */
export function openViewer(items, index, { labels, onClose = () => {} }) {
  const stage = h("div", { class: "g3d-viewer-stage" });
  const caption = h("p", { class: "g3d-viewer-caption" });
  const prev = h("button", { class: "g3d-viewer-nav", type: "button", "aria-label": "←", onclick: () => go(-1) }, "‹");
  const next = h("button", { class: "g3d-viewer-nav", type: "button", "aria-label": "→", onclick: () => go(1) }, "›");
  const el = h(
    "div",
    { class: "g3d-viewer", role: "dialog", "aria-modal": "true", "aria-label": labels.souvenirs },
    stage,
    h("div", { class: "g3d-viewer-bar" }, prev, caption, next),
    h("button", { class: "g3d-souvenirs-close g3d-viewer-close", type: "button", onclick: close }, labels.close),
  );

  function show(i) {
    index = (i + items.length) % items.length;
    const item = items[index];
    el.dataset.index = String(index);
    stage.querySelector("video")?.pause();
    stage.replaceChildren(
      item.kind === "video"
        ? h("video", { src: item.url, poster: item.thumbUrl || false, controls: true, playsinline: true, preload: "metadata" })
        : h("img", { src: item.url || item.thumbUrl, alt: "", draggable: "false" }),
    );
    caption.textContent = `${item.author} · ${day(item.created_at)}`;
    prev.hidden = next.hidden = items.length < 2;
  }

  function go(step) {
    show(index + step);
    gsap.fromTo(stage.firstChild, { opacity: 0, x: step * 24 }, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out", clearProps: "opacity,transform" });
  }

  function onKey(e) {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  let startX = null;
  // a drag on a video is its scrubber, not a swipe to the next souvenir
  stage.addEventListener("touchstart", (e) => (startX = e.target.closest("video") ? null : e.touches[0].clientX), { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1);
  });

  function close() {
    document.removeEventListener("keydown", onKey, true);
    stage.querySelector("video")?.pause();
    gsap.to(el, { autoAlpha: 0, duration: 0.25, onComplete: () => el.remove() });
    onClose();
  }

  document.addEventListener("keydown", onKey, true);
  document.body.append(el);
  show(index);
  gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
  return { close };
}
