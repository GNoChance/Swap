// The passport (docs/design/passeport/): a leather book in CSS 3D. Its leaves lie on the right half and turn around
// the binding (rotateY to -180deg); the back of a turned leaf becomes the left page. The cover is a leaf too (leather
// outside, endpaper inside), so arriving = rising in a spin, landing, then turning the cover. Only the leaves on show
// are displayed (GPU memory on iPhone): the right page, the left one, and the one turning.
import { content } from "../content.js";
import { fill } from "../logic.js";
import { sfx } from "../audio.js";
import { h, svg } from "../dom.js";
import { passportPages, shortDate } from "./logic.js";
import * as art from "./art.js";

const gsap = window.gsap;
const TURN = 0.45; // s, one leaf
const FLICK = 0.35; // px/ms: a quick swipe turns the leaf even before 60°
const EDGE = 24; // px: a touch that starts nearer the left edge belongs to Safari's back gesture
const PHOTOS = ["wink", "kevin-joy"]; // page 0: Cycy, Kevin
// gold dust rising in the slot to live: x, y, size (u), duration, delay, drift (u)
const DUST = [
  [28, 70, 1.5, 4.4, -0.6, 3],
  [41, 78, 1.1, 5.2, -2.3, -2],
  [55, 72, 1.8, 4.7, -3.6, 4],
  [67, 80, 1.2, 5.6, -1.3, -3],
  [35, 86, 1, 4.9, -4.1, 2],
  [61, 88, 1.5, 5.3, -2.9, -1],
];
const GLOW = "drop-shadow(rgba(242,190,92,1) 0px 0px 2.5px) drop-shadow(rgba(242,177,52,0.7) 0px 0px 10px)";
const GLOW_LOW = "drop-shadow(rgba(242,190,92,0.7) 0px 0px 1.5px) drop-shadow(rgba(242,177,52,0.3) 0px 0px 4px)";
let instances = 0;

const stampSrc = (id) => `assets/aventures/tampons/${id}.svg`;
const u = (n) => `calc(var(--u) * ${n})`;
const i = (cls) => h("i", { class: cls, "aria-hidden": "true" });

/** "Titulaires : Cycy & Kevin" → ["Titulaires", "Cycy & Kevin"]; "Depuis le {date}" → ["Depuis le", "{date}"]. */
function split(text) {
  const colon = text.indexOf(" : ");
  const at = colon >= 0 ? colon : text.indexOf("{");
  return [text.slice(0, at).trim(), text.slice(colon >= 0 ? at + 3 : at).trim()];
}

/** createPassport({ aventures, stamps: { [id]: { ink, tilt } }, statuses, onSlot(id, slotEl), onPage(page) }):
 *  { el, arrive, openAt, goTo, page, slotOf, refresh, press, dispose }. It starts closed and hidden. */
export function createPassport({ aventures, stamps, statuses, onSlot, onPage }) {
  const t = content.aventures;
  const p = `pp${++instances}`;
  const pages = passportPages(aventures);
  const last = pages.length - 1;
  const byId = new Map(aventures.map((a) => [a.id, a]));
  const order = pages.flatMap((page) => page.ids || []); // passport order: Nº 01, Nº 02…
  let status = statuses;

  // ── The pages ─────────────────────────────────────────────

  const slots = new Map(); // id → .pp-slot
  const running = () => h("p", { class: "pg-running" }, t.title);
  const folio = (k) => h("span", { class: "pg-folio" }, String(k + 1));

  function slotEl(id, side) {
    const slot = h("div", { class: `pp-slot slot-${side}`, "data-id": id });
    slot.addEventListener("click", () => {
      if (!dragged) onSlot?.(id, slot);
    });
    slots.set(id, slot);
    return slot;
  }

  /** The slot's inside, from its status alone. */
  function drawSlot(slot) {
    const id = slot.dataset.id;
    const s = status[id] || "locked";
    const n = order.indexOf(id) + 1;
    const a = byId.get(id);
    const parts = [i("slot-corners")];
    if (s !== "stamped") parts.push(svg(art.frame));
    parts.push(h("span", { class: "slot-no" }, `Nº ${String(n).padStart(2, "0")}`));
    if (s === "locked") parts.push(h("div", { class: "slot-body slot-body--locked" }, svg(art.lock), h("span", { class: "slot-date" }, shortDate(a.from))));
    if (s === "open") {
      const word = t.slot.open.replace(/\s*✦$/, "");
      parts.push(
        h(
          "div",
          { class: "slot-body slot-body--open" },
          h("span", { class: "slot-open" }, `${word} `, word !== t.slot.open && h("i", {}, "✦")),
          h("span", { class: "pp-slot-name" }, a.name.replace(" · ", "\u00a0· ")),
          h("span", { class: "slot-date" }, shortDate(a.from)),
        ),
        h(
          "span",
          { class: "slot-dust", "aria-hidden": "true" },
          DUST.map(([x, y, size, d, delay, drift]) =>
            h("i", { style: `--x:${x}%;--y:${y}%;--s:${u(size)};--d:${d}s;--dl:${delay}s;--dx:${u(drift)}` }),
          ),
        ),
      );
    }
    if (s === "stamped") {
      // a hand-set stamp is never quite centred: a small offset of its own
      const dx = (((n * 37) % 7) - 3) * 0.4;
      const dy = (((n * 53) % 5) - 2) * 0.4;
      parts.push(
        h("img", {
          class: "pp-stamp",
          "data-id": id,
          src: stampSrc(id),
          alt: a.name,
          draggable: "false",
          style: `--tilt:${stamps[id]?.tilt ?? 0}deg;--dx:${u(dx)};--dy:${u(dy)}`,
        }),
      );
    }
    slot.dataset.status = s;
    slot.replaceChildren(...parts);
  }

  /** A page of stamps: its slots, and the route from a stamp to the slot to live. */
  function stampsFront(ids, k) {
    const route = h("div", { class: "pp-route-box" });
    const body = h("div", { class: "pp-pg pg-stamps" }, i("pp-sec"), running(), ids.map((id, j) => slotEl(id, j ? "b" : "a")), route, folio(k));
    return { body, route };
  }

  /** The back of a page: plain paper, the watermark, and the ink of its stamps showing through. */
  const back = (ghosts = h("div", { class: "pg-ghosts" })) => ({ body: h("div", { class: "pp-pg pg-back" }, i("pp-sec"), i("pg-wm"), ghosts), ghosts });

  const count = h("dd", {});
  function identityFront() {
    const id = t.identity;
    const [holdersLabel, holders] = split(id.holders);
    const [sinceLabel, since] = split(id.since);
    const [countLabel] = split(id.count);
    const [cycy, kevin] = holders.split(" & ");
    const photo = (face, alt, late) =>
      h("figure", { class: "id-photo" }, h("img", { src: `assets/cyrielle/${face}.webp`, alt, draggable: "false" }), i("id-laminate"), i(`id-sheen${late ? " id-sheen--late" : ""}`));
    const field = (label, value, cls = "") => h("div", { class: `id-field ${cls}`.trim() }, h("dt", {}, label), value);
    return h(
      "div",
      { class: "pp-pg pg-identity" },
      i("pp-sec"),
      h("header", { class: "id-head" }, h("h2", { class: "id-title" }, id.title), svg(art.idEmblem(p))),
      h("div", { class: "id-photos" }, photo(PHOTOS[0], cycy, false), photo(PHOTOS[1], kevin, true), svg(art.idSeal(p))),
      h(
        "dl",
        { class: "id-fields" },
        field(holdersLabel, h("dd", {}, `${cycy} `, h("em", {}, "&"), ` ${kevin}`, svg(art.heart)), "id-field--holders"),
        field(sinceLabel, h("dd", {}, fill(since, { date: shortDate(byId.get(order[0]).from) }))),
        field(countLabel, count),
        h(
          "div",
          { class: "id-ghost", "aria-hidden": "true" },
          PHOTOS.map((face) => h("img", { src: `assets/cyrielle/${face}.webp`, alt: "" })),
        ),
      ),
      h("div", { class: "id-mrz" }, h("span", {}, id.mrz)),
      folio(0),
    );
  }

  function nextFront(k) {
    return h(
      "div",
      { class: "pp-pg pg-next" },
      i("pp-sec"),
      running(),
      h("div", { class: "nx-slot" }, svg(art.nextRing(p)), h("span", { class: "nx-q" }, "?"), h("span", { class: "nx-date" }, "__/__/____")),
      h("p", { class: "nx-text" }, t.slot.next),
      svg(art.trail),
      svg(art.rose),
      svg(art.plane),
      folio(k),
    );
  }

  // ── The leaves ────────────────────────────────────────────

  function leafEl(kind, front, backFace, frontClass, backClass, through = true) {
    const frontShade = i("leaf-shade");
    const backShade = i("leaf-shade");
    const glow = through ? i("leaf-through") : null;
    const f = h("div", { class: `pp-face leaf-front ${frontClass}` }, front, frontShade, glow);
    const b = h("div", { class: `pp-face leaf-back ${backClass}` }, backFace, backShade);
    return { el: h("div", { class: `pp-leaf pp-leaf--${kind}` }, f, b), front: f, frontShade, backShade, glow, angle: 0 };
  }

  const [title, ...rest] = t.cover.title.split(" ");
  const cover = leafEl(
    "cover",
    [
      svg(art.stitch(p)),
      h("p", { class: "cv-holders pp-foil" }, t.cover.holders),
      svg(art.coverEmblem(p)),
      h("h1", { class: "cv-title pp-foil" }, title),
      h("p", { class: "cv-sub pp-foil" }, rest.join(" ")),
      svg(art.chip(p)),
    ],
    i("endpaper"),
    "cv-face pp-leather",
    "cv-inside pp-leather",
    false,
  );
  const stampPages = []; // { ids, route, ghosts }
  const leaves = [
    cover,
    ...pages.map((page, k) => {
      if (page.kind === "identity") return leafEl("page", identityFront(), back().body, "pp-paper", "pp-plain");
      if (page.kind === "next") return leafEl("page", nextFront(k), back().body, "pp-paper", "pp-plain");
      const front = stampsFront(page.ids, k);
      const behind = back();
      stampPages.push({ ids: page.ids, route: front.route, ghosts: behind.ghosts });
      return leafEl("page", front.body, behind.body, "pp-paper", "pp-plain");
    }),
  ];
  /** The leaf of a page; -1 is the cover. */
  const leafOf = (page) => leaves[page + 1];

  /** Slots, routes, ghosts and the count of stamps, from the statuses. */
  function draw() {
    for (const slot of slots.values()) if (slot.dataset.status !== status[slot.dataset.id]) drawSlot(slot);
    for (const { ids, route, ghosts } of stampPages) {
      const [a, b] = ids.map((id) => status[id]);
      route.replaceChildren(...(a === "stamped" && (b === "open" || b === "pending") ? [svg(art.route)] : []));
      ghosts.replaceChildren(
        ...ids.flatMap((id, j) =>
          status[id] === "stamped"
            ? [h("img", { class: "pg-ghost", src: stampSrc(id), alt: "", style: `--tilt:${stamps[id]?.tilt ?? 0}deg;top:${u(j ? 102.5 : 43.5)}` })]
            : [],
        ),
      );
    }
    const stamped = aventures.filter((a) => status[a.id] === "stamped").length;
    count.textContent = fill(split(t.identity.count)[1], { n: stamped, total: aventures.length });
  }
  draw();

  // ── The book ──────────────────────────────────────────────

  const boardL = i("pp-board pp-board--l pp-leather pp-open-only");
  const spine = i("pp-spine pp-open-only");
  const blockL = i("pp-block pp-block--l pp-open-only");
  const seam = i("pp-seam pp-open-only");
  const ribbon = i("pp-ribbon pp-open-only");
  const castR = i("pp-cast pp-cast--r");
  const castL = i("pp-cast pp-cast--l");
  const volRibbon = i("vol-ribbon");
  const book = h(
    "div",
    { class: "pp-book", "data-open": "false", "data-page": "0" },
    boardL,
    i("pp-board pp-board--r pp-leather"),
    spine,
    blockL,
    i("pp-block pp-block--r"),
    castR,
    castL,
    leaves.map((leaf) => leaf.el),
    seam,
    ribbon,
  );
  const pose = h("div", { class: "pp-pose" }, h("div", { class: "pp-vol", "aria-hidden": "true" }, i("vol-back"), volRibbon, i("vol-edge-b"), i("vol-edge-r")), book);
  const stage = h("div", { class: "pp-stage" }, pose);
  const nav = (cls, label, step) =>
    h(
      "button",
      {
        class: `pp-nav ${cls}`,
        type: "button",
        "aria-label": label,
        onclick() {
          if (drag?.leaf || !isOpen()) return;
          sfx("tap");
          goTo(target + step);
        },
      },
      svg(art.arrows[step < 0 ? "prev" : "next"]),
    );
  const prev = nav("pp-prev", t.prev, -1);
  const next = nav("pp-next", t.nextPage, 1);
  const foot = h("div", { class: "pp-foot" }, prev, next);
  const el = h("div", { class: "pp is-away" }, svg(art.defs(p)), h("div", { class: "pp-row" }, stage), foot); // hidden until it arrives or opens
  const openOnly = [boardL, spine, blockL, seam, ribbon];
  const foils = [...el.querySelectorAll(".pp-foil")];

  let current = 0; // the page on the right, at rest
  let target = 0; // where the leaves are heading
  let turning = null; // { tween, done } while a leaf turns by itself
  let busy = false; // goTo's loop is running
  let waiters = [];
  let arrival = null;
  let sheen = null;
  let pulses = [];
  let disposed = false;
  const isOpen = () => book.dataset.open === "true";
  const clamp = (page) => Math.max(0, Math.min(last, Math.round(page)));

  // the motions keep to the clock: a slow frame (a texture rasterised for the first time) is skipped, not waited for
  const clocked = new Map(); // animation → its ticker callback
  function onClock(anim) {
    const start = performance.now();
    const tick = () => {
      anim.time((performance.now() - start) / 1000);
      if (anim.progress() >= 1) stopClock(anim);
    };
    anim.pause();
    clocked.set(anim, tick);
    gsap.ticker.add(tick);
    return anim;
  }
  function stopClock(anim) {
    gsap.ticker.remove(clocked.get(anim));
    clocked.delete(anim);
  }

  /** A leaf at an angle (0 = flat on the right, -180 = turned), with its shading; cast: it is the one turning. */
  function setAngle(leaf, a, cast = false) {
    leaf.angle = a;
    leaf.el.style.transform = `rotateY(${a}deg)`;
    const lift = Math.abs(Math.sin((a * Math.PI) / 180));
    const front = a > -90; // the face on show; the hidden one keeps nothing that could leak through its back
    leaf.frontShade.style.opacity = front ? -a / 90 : 0;
    leaf.backShade.style.opacity = front ? 0 : (180 + a) / 90;
    if (leaf.glow) leaf.glow.style.opacity = front ? 0.6 * lift : 0;
    if (leaf === cover) leaf.el.classList.toggle("is-flipped", !front);
    if (!cast) return;
    castR.style.opacity = a > -90 ? lift : 0;
    castL.style.opacity = a > -90 ? 0 : lift;
  }

  /** Shows the leaves needed: the left page and the right one, plus, while leaf `turn` moves in `dir`, the one it
   *  uncovers. The turning leaf is on top; on the right the lower pages lie above, on the left the higher ones. */
  function mount(turn = null, dir = 0) {
    const shown = new Set([current - 1, current]);
    if (dir) shown.add(dir > 0 ? current + 1 : current - 2);
    leaves.forEach((leaf, k) => {
      const page = k - 1;
      leaf.el.classList.toggle("is-shown", shown.has(page));
      leaf.el.classList.toggle("is-turning", page === turn);
      leaf.el.classList.toggle("is-current", turn === null && page === current && isOpen());
      leaf.el.dataset.side = leaf.angle > -90 ? "r" : "l";
      leaf.el.style.zIndex = page === turn ? 40 : leaf.angle > -90 ? 30 - page : 10 + page;
    });
    book.classList.toggle("is-turning", turn !== null);
    if (turn !== null) stopPulses(); // nothing glows on a moving face (WebKit leaks it through the back)
  }

  function syncNav() {
    prev.disabled = target <= 0;
    next.disabled = target >= last;
  }

  /** At rest on `current`. */
  function settle() {
    castR.style.opacity = castL.style.opacity = 0;
    mount();
    book.dataset.page = String(current);
    book.style.setProperty("--tl", (current / last).toFixed(3));
    book.style.setProperty("--tr", ((last - current) / last).toFixed(3));
    syncNav();
    startPulses();
    onPage?.(current);
  }

  // the slot to live glows (open: 2.4 s, pending: 1.4 s), only on the page on show
  function stopPulses() {
    for (const tween of pulses) {
      tween.kill();
      gsap.set(tween.targets(), { clearProps: "filter" });
    }
    pulses = [];
  }
  function startPulses() {
    stopPulses();
    const frames = leafOf(current).el.querySelectorAll('.pp-slot[data-status="open"] .slot-frame, .pp-slot[data-status="pending"] .slot-frame');
    pulses = [...frames].map((frame) =>
      gsap.fromTo(
        frame,
        { filter: GLOW },
        { filter: GLOW_LOW, duration: frame.parentElement.dataset.status === "pending" ? 0.7 : 1.2, ease: "sine.inOut", yoyo: true, repeat: -1 },
      ),
    );
  }

  /** The cover's foil: a glint sweeps the titles every 7 s, while the cover shows. */
  function startSheen() {
    sheen?.kill();
    sheen = gsap
      .timeline({ repeat: -1 })
      .fromTo(foils, { backgroundPosition: "28% 0%" }, { backgroundPosition: "-12% 0%", duration: 0.84, ease: "sine.inOut" })
      .set(foils, { backgroundPosition: "96% 0%" })
      .to(foils, { backgroundPosition: "28% 0%", duration: 1.26, ease: "sine.inOut" })
      .to({}, { duration: 4.9 });
  }

  function stopTurn() {
    if (!turning) return;
    const { tween, done } = turning;
    turning = null;
    stopClock(tween);
    tween.kill();
    done();
  }

  /** Closed, at its pose: the cover on page 0. */
  function close() {
    stopTurn();
    stopArrival();
    current = target = 0;
    leaves.forEach((leaf) => setAngle(leaf, 0));
    gsap.set([pose, book], { clearProps: "transform" }); // the closed pose, from the CSS
    el.classList.add("is-closed");
    el.classList.remove("is-open");
    book.dataset.open = "false";
    book.dataset.page = "0";
    gsap.set(foot, { autoAlpha: 0 });
    gsap.set([volRibbon, ...openOnly], { clearProps: "opacity" });
    mount();
    syncNav();
  }

  function stopArrival() {
    if (!arrival) return;
    stopClock(arrival);
    arrival.kill();
    arrival = null;
  }

  /** Open and still: the volume of the closed book goes, the foil stops. */
  function opened() {
    stopArrival();
    sheen?.kill();
    sheen = null;
    gsap.set(foils, { clearProps: "backgroundPosition" });
    gsap.set(openOnly, { clearProps: "opacity" });
    gsap.set(stage, { clearProps: "transform" });
    gsap.set(foot, { autoAlpha: 1 });
    gsap.set([pose, book], { clearProps: "transform" }); // open, from the CSS
    el.classList.remove("is-closed");
    el.classList.add("is-open");
    book.dataset.open = "true";
  }

  /** Between the closed pose (k = 1) and the open book (k = 0). */
  function posed(k) {
    pose.style.transform = `translateX(calc(${k} * -2.5% + ${1 - k} * var(--open-dx))) scale(${1 - 0.1 * k}) rotateX(${8 * k}deg) rotateY(${-10 * k}deg) rotateZ(${-1.6 * k}deg)`;
    book.style.transform = `translateZ(${7 * k}px)`;
  }

  /** It rises in a spin, lands, and the cover opens on page 0. */
  function arrive() {
    close();
    el.classList.remove("is-away");
    startSheen();
    const spin = { a: 0 };
    const flat = { k: 1 };
    // the cover counts as turning from the start: all it will show (its inside, page 0, the shadows) is painted
    // during the flight, not in the middle of the opening
    mount(-1);
    return new Promise((resolve) => {
      arrival = gsap
        .timeline({
          onComplete() {
            opened();
            settle();
            run(); // a goTo asked for during the arrival
            resolve();
          },
        })
        // never its scale: the textures are rasterised once per size
        .fromTo(stage, { y: () => innerHeight * 0.8, rotation: -380 }, { y: 0, rotation: 0, duration: 1, ease: "power3.out" })
        .to(stage, { y: 5, duration: 0.08, ease: "power1.in" }) // it lands, and the cover lifts as it does
        .to(stage, { y: 0, duration: 0.2, ease: "power2.out" })
        .addLabel("open", 0.9)
        .call(
          () => {
            sheen?.kill();
            gsap.set(foils, { clearProps: "backgroundPosition" });
            el.classList.remove("is-closed");
          },
          null,
          "open",
        )
        .set(openOnly, { opacity: 0 }, "open")
        .to(spin, { a: -180, duration: 1, ease: "power2.inOut", onUpdate: () => setAngle(cover, spin.a, true) }, "open")
        .to(flat, { k: 0, duration: 0.9, ease: "power2.inOut", onUpdate: () => posed(flat.k) }, "open")
        .to(volRibbon, { opacity: 0, duration: 0.2 }, "open")
        .to(openOnly, { opacity: 1, duration: 0.35 }, "open+=0.65")
        .to(foot, { autoAlpha: 1, duration: 0.3 }, "open+=0.7");
      onClock(arrival);
    });
  }

  /** Open on a page at once. */
  function openAt(page) {
    stopTurn();
    stopArrival();
    current = target = clamp(page);
    leaves.forEach((leaf, k) => setAngle(leaf, k - 1 < current ? -180 : 0));
    el.classList.remove("is-away");
    opened();
    settle();
    run();
  }

  /** One leaf by itself, in `dir` (+1: forward, -1: back), in TURN s. */
  function turn(dir) {
    const page = dir > 0 ? current : current - 1;
    const leaf = leafOf(page);
    mount(page, dir);
    return new Promise((resolve) => {
      const state = { a: leaf.angle };
      const done = () => resolve();
      const tween = onClock(gsap.to(state, {
        a: dir > 0 ? -180 : 0,
        duration: TURN,
        ease: "power2.inOut",
        onUpdate: () => setAngle(leaf, state.a, true),
        onComplete() {
          turning = null;
          current += dir;
          settle();
          resolve();
        },
      }));
      turning = { tween, done };
    });
  }

  /** Turns the leaves one by one up to `page` (bounded); a new call changes where they are heading. */
  function goTo(page) {
    target = clamp(page);
    syncNav();
    const reached = new Promise((resolve) => waiters.push(resolve));
    run();
    return reached;
  }

  async function run() {
    if (busy) return;
    busy = true;
    while (!disposed && isOpen() && !drag?.leaf && current !== target) await turn(Math.sign(target - current));
    busy = false;
    if (disposed || current !== target) return; // closed, or under a finger: taken up again after
    const done = waiters;
    waiters = [];
    done.forEach((resolve) => resolve());
  }

  // ── The finger (and the mouse) turns a leaf; a trackpad's sideways swipe turns a page ──

  let drag = null; // { id, x, y, leaf, page, dir, width, track: [[time, x]] }
  let dragged = false; // a drag happened: the click that follows is not a tap on a slot

  book.addEventListener("pointerdown", (e) => {
    dragged = false;
    if (!isOpen() || busy || drag || e.button > 0 || e.clientX < EDGE) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, leaf: null, track: [[e.timeStamp, e.clientX]] };
  });
  book.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.track.push([e.timeStamp, e.clientX]);
    if (drag.track.length > 8) drag.track.shift();
    if (!drag.leaf) {
      if (Math.abs(dx) < 8 && Math.abs(e.clientY - drag.y) < 8) return;
      const dir = dx < 0 ? 1 : -1;
      if (Math.abs(dx) < Math.abs(e.clientY - drag.y) || current + dir < 0 || current + dir > last) {
        drag = null; // up or down, or past a bound: not a turn
        return;
      }
      book.setPointerCapture(e.pointerId);
      dragged = true;
      const page = dir > 0 ? current : current - 1;
      Object.assign(drag, { page, dir, leaf: leafOf(page), width: leafOf(current).el.offsetWidth });
      mount(page, dir);
      drag.leaf.el.classList.add("is-dragged");
    }
    // the angle follows the finger: dx / width × 180
    const a = (drag.dir > 0 ? 0 : -180) + (dx / drag.width) * 180;
    setAngle(drag.leaf, Math.max(-180, Math.min(0, a)), true);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { leaf, dir, track } = drag;
    drag = null;
    if (!leaf) return;
    leaf.el.classList.remove("is-dragged");
    const [t0, x0] = track[0];
    const [t1, x1] = track[track.length - 1];
    const speed = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
    const turned = dir > 0 ? -leaf.angle : 180 + leaf.angle;
    const through = turned > 60 || speed * -dir > FLICK; // past 60°, or flicked
    const end = through === dir > 0 ? -180 : 0;
    const state = { a: leaf.angle };
    const asked = target; // a goTo meanwhile wins
    busy = true;
    const tween = onClock(gsap.to(state, {
      a: end,
      duration: Math.max(0.12, (TURN * Math.abs(end - leaf.angle)) / 180),
      ease: "power2.out",
      onUpdate: () => setAngle(leaf, state.a, true),
      onComplete() {
        turning = null;
        if (through) current += dir;
        if (target === asked) target = current;
        settle();
        busy = false;
        run();
      },
    }));
    turning = { tween, done: () => (busy = false) };
  };
  book.addEventListener("pointerup", release);
  book.addEventListener("pointercancel", release);

  let wheel = 0;
  let wheelEnd = 0;
  let wheelSpent = false; // one page per swipe of the trackpad
  el.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // scrolling up or down: not ours
      e.preventDefault(); // no back or forward of the browser
      clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => {
        wheel = 0;
        wheelSpent = false;
      }, 220);
      if (wheelSpent || !isOpen() || drag?.leaf) return;
      wheel += e.deltaX;
      if (Math.abs(wheel) < 40) return;
      wheelSpent = true;
      goTo(target + Math.sign(wheel));
    },
    { passive: false },
  );

  close();

  return {
    el,
    arrive,
    openAt,
    goTo,
    page: () => current,
    slotOf: (id) => slots.get(id),
    /** Redraws the slots (and what depends on them) from new statuses. */
    refresh(now) {
      status = now;
      draw();
      if (isOpen() && !busy) startPulses();
    },
    /** The page gives under the stamp for an instant. */
    press() {
      const leaf = leafOf(current);
      gsap.set(leaf.front, { willChange: "transform" }); // its raster is kept while it gives (textures)
      gsap.set(leaf.frontShade, { willChange: "opacity" });
      return new Promise((resolve) => {
        gsap
          .timeline({
            onComplete() {
              gsap.set([leaf.front, leaf.frontShade], { clearProps: "willChange" });
              resolve();
            },
          })
          .to(leaf.front, { scale: 0.985, duration: 0.07, ease: "power2.out" })
          .to(leaf.frontShade, { opacity: 0.16, duration: 0.07 }, 0)
          .to(leaf.front, { scale: 1, duration: 0.3, ease: "back.out(3)", clearProps: "transform" })
          .to(leaf.frontShade, { opacity: 0, duration: 0.3 }, "<");
      });
    },
    dispose() {
      disposed = true;
      stopTurn();
      stopPulses();
      stopArrival();
      for (const anim of [...clocked.keys()]) {
        stopClock(anim);
        anim.kill();
      }
      sheen?.kill();
      clearTimeout(wheelEnd);
      gsap.killTweensOf([stage, foot, volRibbon, ...openOnly, ...leaves.map((leaf) => leaf.front)]);
    },
  };
}
