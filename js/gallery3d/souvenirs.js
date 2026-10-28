// « En savoir plus »: the souvenirs of a match, in a panel rising from the bottom over the zoomed-in painting.
// With no store (Supabase not configured): empty polaroids (« Souvenirs à venir ») as before. With one: locked until
// the shared code is typed on this phone, then the photos and videos in a row of polaroids, the notes underneath,
// all kept live. Closes with its button, a tap outside the card, or a swipe down.
import { museumDate, museumDay, fill } from "../logic.js";
import { sortItems } from "../souvenirs/logic.js";
import { h } from "../dom.js";

const gsap = window.gsap;
const SWIPE = 80; // px down to close

const emptyPolaroids = (caption, extra = "") =>
  Array.from({ length: 3 }, () => h("figure", { class: `g3d-polaroid is-empty ${extra}` }, h("span", { "aria-hidden": "true" }, extra ? "🔒" : "📷"), h("figcaption", {}, caption)));

/** store: from souvenirs/store.js, or null. state (data-state): none | locked | loading | ready | offline. */
export function souvenirPanel(match, { labels, title, onClose, store }) {
  const ui = labels.souvenirsUi;
  const body = h("div", { class: "g3d-souvenirs-body" });
  const closeButton = h("button", { class: "g3d-souvenirs-close", type: "button", onclick: () => onClose() }, labels.close);
  const card = h(
    "div",
    { class: "g3d-souvenirs-card", role: "dialog", "aria-modal": "true", "aria-label": `${labels.souvenirs} · ${title}` },
    h("span", { class: "g3d-souvenirs-grip", "aria-hidden": "true" }),
    h("p", { class: "eyebrow" }, labels.souvenirs),
    h("h2", { class: "g3d-souvenirs-title" }, title),
    h("p", { class: "g3d-souvenirs-date" }, `${museumDate(match.date)} · ${labels.venues[match.venue]}`),
    body,
    closeButton,
  );
  const el = h("div", { class: "g3d-souvenirs" }, card);
  const meet = () => !match.score && h("p", { class: "g3d-souvenirs-meet" }, fill(labels.meet, { day: museumDay(match.date) }));
  let items = [];
  let unsubscribe = null;
  let closed = false;

  function setState(state, ...children) {
    el.dataset.state = state;
    body.replaceChildren(...children.flat().filter(Boolean));
  }

  // ── The states ──

  function showNone() {
    setState("none", h("div", { class: "g3d-photos" }, emptyPolaroids(labels.empty)), meet());
  }

  function showLocked() {
    const error = h("p", { class: "g3d-code-error", role: "alert" });
    const input = h("input", { type: "password", name: "code", autocomplete: "current-password", enterkeyhint: "go", "aria-label": ui.code, placeholder: ui.code });
    const submit = h("button", { class: "g3d-pill", type: "submit" }, ui.unlock);
    const form = h(
      "form",
      {
        class: "g3d-code",
        hidden: true,
        async onsubmit(e) {
          e.preventDefault();
          if (!input.value) return;
          submit.disabled = true;
          error.textContent = "";
          try {
            await store.unlock(input.value);
            input.blur();
            load();
          } catch (err) {
            error.textContent = err.message === "bad-code" ? ui.badCode : ui.network;
            submit.disabled = false;
            input.select();
          }
        },
      },
      input,
      submit,
    );
    const opener = h(
      "button",
      {
        class: "g3d-pill g3d-unlock-open",
        type: "button",
        onclick() {
          opener.hidden = true;
          form.hidden = false;
          input.focus({ preventScroll: true });
        },
      },
      ui.enter,
    );
    setState("locked", h("div", { class: "g3d-photos" }, emptyPolaroids(ui.locked, "is-locked")), h("p", { class: "g3d-locked-note" }, `🔒 ${ui.locked}`), opener, form, error);
  }

  function showOffline() {
    setState("offline", h("p", { class: "g3d-code-error", role: "alert" }, ui.network), h("button", { class: "g3d-pill", type: "button", onclick: load }, "↻"));
  }

  function polaroid(item) {
    const thumb = item.thumbUrl ? h("img", { src: item.thumbUrl, alt: "", loading: "lazy", draggable: "false" }) : h("span", { class: "g3d-thumb-missing", "aria-hidden": "true" }, "🎞");
    return h(
      "figure",
      { class: `g3d-polaroid is-${item.kind}`, "data-id": item.id },
      h("div", { class: "g3d-polaroid-shot" }, thumb, item.kind === "video" && h("span", { class: "g3d-play", "aria-hidden": "true" }, "▶")),
      h("figcaption", {}, fill(ui.by, { name: item.author })),
    );
  }

  const note = (item) => h("blockquote", { class: "g3d-note", "data-id": item.id }, h("p", {}, `❝ ${item.text} ❞`), h("footer", {}, `— ${item.author}`));

  function render() {
    const row = body.querySelector(".g3d-photos");
    const scroll = row?.scrollLeft || 0;
    const media = items.filter((i) => i.kind !== "note");
    const notes = items.filter((i) => i.kind === "note");
    setState(
      "ready",
      h("div", { class: "g3d-photos" }, media.length ? media.map(polaroid) : emptyPolaroids(labels.empty)),
      meet(),
      notes.length && h("div", { class: "g3d-notes" }, notes.map(note)),
    );
    body.querySelector(".g3d-photos").scrollLeft = scroll;
  }

  // ── Loading, live ──

  function onChange(change) {
    if (change.type === "insert") {
      if (items.some((i) => i.id === change.item.id)) return; // our own, already shown
      items = sortItems([...items, change.item]);
    } else {
      if (!items.some((i) => i.id === change.id)) return;
      items = items.filter((i) => i.id !== change.id);
    }
    render();
  }

  async function load() {
    if (closed) return;
    if (!(await store.isUnlocked())) return showLocked();
    setState("loading", h("div", { class: "g3d-photos" }, emptyPolaroids("…")));
    try {
      items = await store.list(match.date);
    } catch (err) {
      if (closed) return;
      return err.message === "locked" ? showLocked() : showOffline();
    }
    if (closed) return;
    render();
    unsubscribe ??= store.subscribe(match.date, onChange);
  }

  if (store) {
    setState("loading", h("div", { class: "g3d-photos" }, emptyPolaroids("…")));
    load();
  } else showNone();

  // ── Closing: tap outside, swipe down ──

  el.addEventListener("click", (e) => {
    if (e.target === el) onClose();
  });
  // a swipe down on the card, only from its top (the card scrolls when it is long; the photo row scrolls sideways)
  let startY = null;
  card.addEventListener(
    "touchstart",
    (e) => {
      startY = e.target.closest(".g3d-photos, form") || card.scrollTop > 0 ? null : e.touches[0].clientY;
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
      closed = true;
      unsubscribe?.();
      return new Promise((resolve) => {
        gsap.to(el, { backgroundColor: "rgba(20, 12, 14, 0)", duration: 0.35 });
        gsap.to(card, { yPercent: 105, duration: 0.4, ease: "power2.in", onComplete: resolve });
      });
    },
  };
}
