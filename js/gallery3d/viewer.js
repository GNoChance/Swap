// A souvenir in full screen: the photo, or the video playing in the page with its sound, who added it and when.
// A photo zooms: pinch (1× to 4×), drag once zoomed, double tap (2.5× on the spot, again: back), the mouse wheel and
// a double click on a computer. Arrows, ← / → or a sideways swipe (only at 1×) go to the next or previous; « Fermer »
// or Escape closes. A gesture that starts on a video is its player's (the scrubber). It sits over the souvenirs
// panel, under the « ← Accueil » and sound buttons.
import { h } from "../dom.js";

const gsap = window.gsap;
const SWIPE = 50; // px sideways to change
const MAX = 4;
const DOUBLE = 2.5;
const day = (iso) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** items: photos and videos (with url), index: the one tapped. cover (optional): { is(item), choose(item) } for
 *  « ⭐ Mettre sur le tableau ». */
export function openViewer(items, index, { labels, onClose = () => {}, cover = null }) {
  const ui = labels.souvenirsUi;
  const coverButton = h("button", {
    class: "g3d-pill g3d-cover",
    type: "button",
    hidden: true,
    async onclick() {
      const item = items[index];
      coverButton.disabled = true;
      try {
        await cover.choose(item);
      } catch {
        /* no network: the button comes back */
      }
      showCover();
    },
  });
  const stage = h("div", { class: "g3d-viewer-stage" });
  const caption = h("p", { class: "g3d-viewer-caption" });
  const prev = h("button", { class: "g3d-viewer-nav", type: "button", "aria-label": "←", onclick: () => go(-1) }, "‹");
  const next = h("button", { class: "g3d-viewer-nav", type: "button", "aria-label": "→", onclick: () => go(1) }, "›");
  const el = h(
    "div",
    { class: "g3d-viewer", role: "dialog", "aria-modal": "true", "aria-label": labels.souvenirs },
    stage,
    h("div", { class: "g3d-viewer-bar" }, prev, caption, next),
    coverButton,
    h("button", { class: "g3d-souvenirs-close g3d-viewer-close", type: "button", onclick: close }, labels.close),
  );

  // ── Zoom: scale and offset of the photo, from its centre ──
  let photo = null;
  let zoom = { s: 1, x: 0, y: 0 };

  function apply(next) {
    if (!photo) return;
    const s = clamp(next.s, 1, MAX);
    // the photo never leaves the screen: the offset is bounded by how much it overflows
    const mx = ((s - 1) * photo.offsetWidth) / 2;
    const my = ((s - 1) * photo.offsetHeight) / 2;
    zoom = s === 1 ? { s: 1, x: 0, y: 0 } : { s, x: clamp(next.x, -mx, mx), y: clamp(next.y, -my, my) };
    photo.style.transform = zoom.s === 1 ? "" : `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`;
    el.dataset.zoom = zoom.s.toFixed(2);
  }

  /** Zoom to s, keeping the screen point (px, py) where it is. */
  function zoomAt(s, px, py) {
    if (!photo) return;
    const box = photo.getBoundingClientRect(); // with the current transform
    const cx = box.left + box.width / 2 - zoom.x; // the photo's centre, untransformed
    const cy = box.top + box.height / 2 - zoom.y;
    const k = clamp(s, 1, MAX) / zoom.s;
    apply({ s: zoom.s * k, x: px - cx - (px - cx - zoom.x) * k, y: py - cy - (py - cy - zoom.y) * k });
  }

  function show(i) {
    index = (i + items.length) % items.length;
    const item = items[index];
    el.dataset.index = String(index);
    stage.querySelector("video")?.pause();
    photo = item.kind === "video" ? null : h("img", { src: item.url || item.thumbUrl, alt: "", draggable: "false" });
    const media = photo || h("video", { src: item.url, poster: item.thumbUrl || false, controls: true, playsinline: true, preload: "metadata" });
    // a photo: fingers anywhere on the stage (above or below it too) zoom the photo, never the page; a video: its player
    stage.style.touchAction = photo ? "none" : "";
    // the frame slides in (GSAP), the photo inside it zooms: never both on one element
    stage.replaceChildren(h("div", { class: "g3d-viewer-frame" }, media));
    zoom = { s: 1, x: 0, y: 0 };
    el.dataset.zoom = "1.00";
    caption.textContent = `${item.author} · ${day(item.created_at)}`;
    prev.hidden = next.hidden = items.length < 2;
    showCover();
  }

  /** The ⭐ button: only for a photo of a played match; « Sur le tableau » once it is the painting's. */
  function showCover() {
    const item = items[index];
    coverButton.hidden = !cover || item.kind !== "photo";
    if (coverButton.hidden) return;
    const on = cover.is(item);
    coverButton.textContent = on ? ui.isCover : ui.cover;
    coverButton.disabled = on;
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

  // ── Touch: pinch, drag, double tap, swipe ──
  let gesture = null;
  let lastTap = { t: 0, x: 0, y: 0 };
  let touchedAt = -Infinity; // a phone adds a dblclick after a double tap, which the taps already handled
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });

  stage.addEventListener(
    "touchstart",
    (e) => {
      touchedAt = performance.now();
      if (e.target.closest("video")) return (gesture = null); // the player's own gesture (scrubber)
      const [a, b] = e.touches;
      if (b && photo) gesture = { kind: "pinch", d0: dist(a, b), s0: zoom.s, m: mid(a, b) };
      else if (!b) gesture = { kind: "one", x0: a.clientX, y0: a.clientY, last: { x: a.clientX, y: a.clientY }, t0: performance.now(), moved: false };
    },
    { passive: true },
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (!gesture) return;
      const [a, b] = e.touches;
      if (gesture.kind === "pinch" && b) {
        e.preventDefault();
        const m = mid(a, b);
        zoomAt(gesture.s0 * (dist(a, b) / gesture.d0), m.x, m.y);
        apply({ ...zoom, x: zoom.x + m.x - gesture.m.x, y: zoom.y + m.y - gesture.m.y }); // and follow the fingers
        gesture.m = m;
      } else if (gesture.kind === "one" && a) {
        if (Math.hypot(a.clientX - gesture.x0, a.clientY - gesture.y0) > 10) gesture.moved = true;
        if (zoom.s > 1) {
          e.preventDefault();
          apply({ ...zoom, x: zoom.x + a.clientX - gesture.last.x, y: zoom.y + a.clientY - gesture.last.y });
        }
        gesture.last = { x: a.clientX, y: a.clientY };
      }
    },
    { passive: false },
  );
  stage.addEventListener("touchend", (e) => {
    touchedAt = performance.now();
    const g = gesture;
    if (!g || e.touches.length) return; // a finger still down: the gesture goes on
    gesture = null;
    if (g.kind === "pinch") {
      if (zoom.s < 1.05) apply({ s: 1 });
      return;
    }
    const end = e.changedTouches[0];
    const dx = end.clientX - g.x0;
    if (zoom.s === 1 && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(end.clientY - g.y0)) return go(dx < 0 ? 1 : -1);
    if (g.moved || performance.now() - g.t0 > 300 || !photo) return;
    // a tap: two of them close together zoom in on the spot, or back out
    const now = performance.now();
    if (now - lastTap.t < 320 && Math.hypot(end.clientX - lastTap.x, end.clientY - lastTap.y) < 40) {
      lastTap = { t: 0, x: 0, y: 0 };
      if (zoom.s > 1) apply({ s: 1 });
      else zoomAt(DOUBLE, end.clientX, end.clientY);
    } else lastTap = { t: now, x: end.clientX, y: end.clientY };
  });

  // ── A computer: wheel, double click, drag with the mouse ──
  stage.addEventListener(
    "wheel",
    (e) => {
      if (!photo) return;
      e.preventDefault();
      zoomAt(zoom.s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    },
    { passive: false },
  );
  stage.addEventListener("dblclick", (e) => {
    if (!photo || e.target.closest("video") || performance.now() - touchedAt < 800) return;
    if (zoom.s > 1) apply({ s: 1 });
    else zoomAt(DOUBLE, e.clientX, e.clientY);
  });
  // Safari's own pinch would zoom the whole page with the photo
  el.addEventListener("gesturestart", (e) => photo && e.preventDefault());

  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && zoom.s > 1 && photo) drag = { x: e.clientX, y: e.clientY };
  });
  addEventListener("pointermove", onPointerMove);
  addEventListener("pointerup", onPointerUp);
  function onPointerMove(e) {
    if (!drag) return;
    apply({ ...zoom, x: zoom.x + e.clientX - drag.x, y: zoom.y + e.clientY - drag.y });
    drag = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp() {
    drag = null;
  }

  function close() {
    document.removeEventListener("keydown", onKey, true);
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("pointerup", onPointerUp);
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
