// « En savoir plus »: the souvenirs of a match, in a panel rising from the bottom over the zoomed-in painting.
// With no store (Supabase not configured): empty polaroids (« Souvenirs à venir ») as before. With one: locked until
// the shared code is typed on this phone, then the photos and videos in a row of polaroids, the notes underneath,
// all kept live. Closes with its button, a tap outside the card, or a swipe down.
import { museumDate, museumDay, fill } from "../logic.js";
import { sortItems, checkFile, checkNote, checkName, noteLength, NOTE_MAX } from "../souvenirs/logic.js";
import { h } from "../dom.js";

const gsap = window.gsap;
const SWIPE = 80; // px down to close
const NAME_KEY = "swap-cyrielle:souvenirs-name";

const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
};

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
  let pending = []; // uploads on their way: { key, file, progress, failed }
  let unsubscribe = null;
  let closed = false;
  let name = savedName();

  // kept across renders: a live insert must not wipe a note being typed
  const fileInput = h("input", {
    class: "g3d-file",
    type: "file",
    accept: "image/*,video/mp4,video/quicktime",
    multiple: true,
    hidden: true,
    onchange() {
      send([...fileInput.files]);
      fileInput.value = "";
    },
  });
  const addArea = h("div", { class: "g3d-add-area" });
  const addError = h("p", { class: "g3d-add-error", role: "alert" });

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

  /** An upload on its way: its progress, or « Échec · Réessayer ». */
  function pendingPolaroid(job) {
    const fig = h(
      "figure",
      { class: `g3d-polaroid ${job.failed ? "is-failed" : "is-uploading"}`, "data-key": job.key },
      h(
        "div",
        { class: "g3d-polaroid-shot" },
        job.failed ? h("button", { class: "g3d-retry", type: "button", onclick: () => upload(job) }, ui.failed) : h("span", { class: "g3d-progress" }),
      ),
      h("figcaption", {}, name),
    );
    fig.style.setProperty("--progress", job.progress);
    return fig;
  }

  const addPolaroid = () =>
    h("button", { class: "g3d-polaroid g3d-add", type: "button", onclick: toggleMenu }, h("span", { class: "g3d-add-plus", "aria-hidden": "true" }, "+"), h("span", {}, ui.add.replace(/^\+\s*/, "")));

  function render() {
    const row = body.querySelector(".g3d-photos");
    const scroll = row?.scrollLeft || 0;
    const media = items.filter((i) => i.kind !== "note");
    const notes = items.filter((i) => i.kind === "note");
    setState(
      "ready",
      h("div", { class: "g3d-photos" }, media.length || pending.length ? [media.map(polaroid), pending.map(pendingPolaroid)] : emptyPolaroids(labels.empty), addPolaroid()),
      addArea,
      addError,
      meet(),
      notes.length && h("div", { class: "g3d-notes" }, notes.map(note)),
      fileInput,
    );
    body.querySelector(".g3d-photos").scrollLeft = scroll;
  }

  // ── Adding: the « + » menu, the first name once, photos and videos, notes ──

  function keep(item) {
    if (!items.some((i) => i.id === item.id)) items = sortItems([...items, item]);
  }

  function toggleMenu() {
    addError.textContent = "";
    if (addArea.querySelector(".g3d-add-menu")) return addArea.replaceChildren();
    addArea.replaceChildren(
      h(
        "div",
        { class: "g3d-add-menu" },
        // the file picker must open inside the tap itself (iPhone): nothing awaited before it
        h("button", { class: "g3d-pill g3d-add-media", type: "button", onclick: () => withName(pickFiles) }, `📷 ${ui.media}`),
        h("button", { class: "g3d-pill g3d-add-note", type: "button", onclick: () => withName(showNoteForm) }, `✎ ${ui.note}`),
      ),
    );
  }

  /** Runs action now if this phone knows its first name, else after asking for it once. */
  function withName(action) {
    if (name) return action();
    const input = h("input", { type: "text", autocomplete: "given-name", maxlength: "40", enterkeyhint: "next", placeholder: ui.name, "aria-label": ui.name });
    addArea.replaceChildren(
      h(
        "form",
        {
          class: "g3d-name-form g3d-code",
          onsubmit(e) {
            e.preventDefault();
            const check = checkName(input.value);
            if (check.error) return input.focus({ preventScroll: true });
            name = check.name;
            try {
              localStorage.setItem(NAME_KEY, name);
            } catch {
              /* asked again next time, that's all */
            }
            action();
          },
        },
        input,
        h("button", { class: "g3d-pill", type: "submit" }, ui.next),
      ),
    );
    input.focus({ preventScroll: true });
  }

  function pickFiles() {
    addArea.replaceChildren();
    fileInput.click();
  }

  function send(files) {
    addError.textContent = "";
    for (const file of files) {
      const check = checkFile(file);
      if (check.error) {
        addError.textContent = check.error === "too-big" ? ui.tooBig : ui.notMedia;
        continue;
      }
      const job = { key: crypto.randomUUID(), file, progress: 0, failed: false };
      pending.push(job);
      upload(job);
    }
  }

  async function upload(job) {
    job.failed = false;
    job.progress = 0;
    render();
    try {
      const item = await store.addMedia(match.date, job.file, {
        author: name,
        onProgress(p) {
          job.progress = p;
          body.querySelector(`[data-key="${job.key}"]`)?.style.setProperty("--progress", p);
        },
      });
      pending = pending.filter((j) => j !== job);
      keep(item);
    } catch (err) {
      if (err.message === "locked") {
        pending = [];
        if (!closed) showLocked();
        return;
      }
      job.failed = true;
    }
    if (!closed) render();
  }

  function showNoteForm() {
    const area = h("textarea", { rows: "3", placeholder: ui.notePlaceholder, "aria-label": ui.note });
    const counter = h("span", { class: "g3d-note-count", "aria-live": "polite" }, String(NOTE_MAX));
    const publish = h("button", { class: "g3d-pill", type: "submit", disabled: true }, ui.publish);
    area.addEventListener("input", () => {
      const left = NOTE_MAX - noteLength(area.value.trim());
      counter.textContent = String(Math.max(0, left));
      counter.classList.toggle("is-over", left < 0);
      publish.disabled = Boolean(checkNote(area.value).error);
    });
    addArea.replaceChildren(
      h(
        "form",
        {
          class: "g3d-note-form",
          async onsubmit(e) {
            e.preventDefault();
            const check = checkNote(area.value);
            if (check.error) return;
            publish.disabled = true;
            addError.textContent = "";
            try {
              keep(await store.addNote(match.date, check.text, { author: name }));
              addArea.replaceChildren();
              if (!closed) render();
            } catch (err) {
              if (err.message === "locked") return closed || showLocked();
              addError.textContent = ui.network;
              publish.disabled = false;
            }
          },
        },
        area,
        h("div", { class: "g3d-note-actions" }, counter, publish),
      ),
    );
    area.focus({ preventScroll: true });
  }

  // on a PC: photos and videos dropped on the panel
  card.addEventListener("dragover", (e) => {
    if (el.dataset.state !== "ready") return;
    e.preventDefault();
    card.classList.add("is-dropping");
  });
  card.addEventListener("dragleave", () => card.classList.remove("is-dropping"));
  card.addEventListener("drop", (e) => {
    card.classList.remove("is-dropping");
    if (el.dataset.state !== "ready") return;
    e.preventDefault();
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) withName(() => (addArea.replaceChildren(), send(files)));
  });

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
