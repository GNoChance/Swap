// The gallery of our matches (?musee): a white museum corridor in CSS 3D, one painting per match, oldest first.
// Scrolling walks down the corridor (one snap stop per painting); at each stop the painting swings off its wall to
// face her, with its cartel. Mini Cycy and Kevin walk at the bottom of the screen and react to each match.
//
// No nested 3D context: every element is projected straight from the stage's perspective, its depth computed here
// each frame from the camera position (z_rel: 0 = the screen plane, negative = further away). Anything about to pass
// behind the eye is hidden, Safari draws those inside out.
import { content } from "./content.js";
import { museumResult, museumDate, seatPair } from "./logic.js";
import { sfx, unlockAudio } from "./audio.js";
import { confetti } from "./effects.js";
import { createAvatar, preloadFaces } from "./avatar.js";
import { h } from "./dom.js";

const gsap = window.gsap;
const PERSPECTIVE = 700;
const NEAR = PERSPECTIVE - 20; // nothing comes closer than this
const FRONT = 60; // a painting facing her stands this far behind the screen
const GOLD = ["#c9a15b", "#e6cb8f", "#f3dfb0", "#7a1733", "#ffffff"];

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

export function museumScreen({ onBack }) {
  const m = content.museum;
  const { clubs, matches } = m;
  const stops = matches.length + 2; // the entrance, one stop per painting, the end
  const last = matches.length - 1;
  preloadFaces(Object.values(m.faces).flatMap((who) => Object.values(who)));

  // ── The corridor ──
  const stage = h("div", { class: "mu-stage" });
  const segments = []; // walls and floor: { el, z, len, place(z) }
  const paintings = []; // { el, i, side, z }

  const logo = (club) => h("span", { class: "mu-medal" }, h("img", { class: "mu-logo", src: `assets/logos/${club.logo}`, alt: club.name, draggable: "false" }));

  function painting(match, i) {
    const club = clubs[match.opponent];
    const result = museumResult(match);
    const soon = result === "soon";
    const canvas = h(
      "div",
      { class: "mu-canvas" },
      h("span", { class: "mu-field mu-field-home" }),
      h("span", { class: "mu-field mu-field-away" }),
      h("p", { class: "mu-canvas-date" }, museumDate(match.date)),
      h("div", { class: "mu-logos" }, logo(clubs.ubb), h("span", { class: "mu-vs" }, "×"), logo(club)),
    );
    canvas.style.setProperty("--home", clubs.ubb.color);
    canvas.style.setProperty("--away", club.color);
    const veil = soon && h("div", { class: "mu-veil" }, h("span", { class: "mu-veil-tag" }, i === last ? m.next : m.soon));
    const title = soon ? (i === last ? m.next : m.soon) : `${clubs.ubb.name} ${match.score[0]} – ${match.score[1]} ${club.name}`;
    const cartel = h(
      "div",
      { class: "mu-cartel" },
      h("p", { class: "mu-cartel-title" }, title),
      soon && h("p", { class: "mu-cartel-teams" }, `${clubs.ubb.name} – ${club.name}`),
      h("p", {}, match.competition),
      h("p", {}, match.final ? museumDate(match.date) : `${museumDate(match.date)} · ${m.place}`),
      match.final && h("p", {}, match.place),
      match.note && h("p", { class: "mu-cartel-note" }, match.note),
      h("p", { class: "mu-cartel-seat" }, `${match.stand} · ${m.row} ${match.row} · ${m.seats} ${seatPair(match.seat)}`),
    );
    // two marks on the edges: the end-to-end test checks which way the painting faces
    const el = h(
      "div",
      { class: `mu-painting is-${result}${match.final ? " is-final" : ""}` },
      h("div", { class: "mu-frame" }, canvas, veil),
      cartel,
      h("i", { class: "mu-edge mu-edge-l", "aria-hidden": "true" }),
      h("i", { class: "mu-edge mu-edge-r", "aria-hidden": "true" }),
    );
    el.dataset.stop = i + 1;
    return el;
  }

  // ── Overlays: the title at the entrance, the end, the two visitors ──
  const intro = h(
    "div",
    { class: "mu-intro" },
    h("p", { class: "eyebrow" }, m.kicker),
    h("h1", { class: "mu-title" }, m.title),
    h("p", { class: "mu-subtitle" }, m.subtitle),
    h("p", { class: "mu-hint" }, m.hint, h("span", { "aria-hidden": "true" }, " ↓")),
  );
  const end = h("div", { class: "mu-end" }, h("p", { class: "mu-end-title" }, m.end), h("p", { class: "mu-end-note" }, m.endNote));
  const cycy = createAvatar({ face: m.faces.cycy.look, size: 96 });
  const kevin = createAvatar({ face: m.faces.kevin.look, size: 96 });
  const visitors = h("div", { class: "mu-visitors" }, h("div", { class: "mu-visitor" }, cycy.el), h("div", { class: "mu-visitor" }, kevin.el));
  const backButton = h(
    "button",
    {
      class: "mu-back",
      type: "button",
      onclick() {
        sfx("tap");
        onBack();
      },
    },
    m.back,
  );

  const track = h("div", { class: "mu-track" }, stage);
  const el = h("section", { class: "screen screen-museum" }, track, h("div", { class: "mu-overlays" }, intro, end, visitors), backButton);

  // ── Layout: sizes from the viewport ──
  let L = {}; // vw, vh, stopH, tw, sp, hw, floorY, ceilY, wallY, frontY
  function layout() {
    const vw = innerWidth;
    const vh = innerHeight;
    const tw = Math.round(Math.min(vw * 0.82, vh * 0.42, 420));
    const sp = Math.max(900, tw * 2.8); // distance between two stops
    const hw = Math.max(vw * 0.62, tw * 0.95); // half the corridor's width
    L = { vw, vh, stopH: vh, tw, sp, hw, floorY: vh * 0.36, ceilY: -vh * 0.62, wallY: -vh * 0.05, frontY: -vh * 0.08 };
    el.style.setProperty("--tw", `${tw}px`);
    track.style.height = `${stops * vh}px`;
    track.querySelectorAll(".mu-stop").forEach((s) => s.remove());
    for (let k = 0; k < stops; k++) {
      const stop = h("div", { class: "mu-stop", "aria-hidden": "true" });
      stop.style.top = `${k * vh}px`;
      stop.style.height = `${vh}px`;
      track.append(stop);
    }
    build();
  }

  function build() {
    stage.replaceChildren();
    segments.length = 0;
    paintings.length = 0;
    const { sp, hw, floorY, ceilY } = L;
    const len = sp / 4; // short pieces: by the time one has to go (too close to the eye), it is off screen
    const wallH = floorY - ceilY;
    const z0 = sp * 0.6; // the corridor starts just behind the entrance
    const count = Math.ceil((z0 + stops * sp + sp) / len);
    for (let s = 0; s < count; s++) {
      const z = z0 - (s + 0.5) * len;
      const add = (cls, w, hgt, place) => {
        const piece = h("div", { class: `mu-piece ${cls}` });
        piece.style.width = `${w}px`;
        piece.style.height = `${hgt}px`;
        stage.append(piece);
        segments.push({ el: piece, z, len, place, shown: true });
      };
      add("mu-wall mu-wall-l", len, wallH, (zr) => `translate3d(${-hw}px, ${(ceilY + floorY) / 2}px, ${zr}px) rotateY(90deg)`);
      add("mu-wall mu-wall-r", len, wallH, (zr) => `translate3d(${hw}px, ${(ceilY + floorY) / 2}px, ${zr}px) rotateY(-90deg)`);
      add("mu-floor", hw * 2, len, (zr) => `translate3d(0, ${floorY}px, ${zr}px) rotateX(90deg)`);
    }
    // the back wall, at the end of the corridor
    const back = h("div", { class: "mu-piece mu-backwall" });
    back.style.width = `${hw * 2}px`;
    back.style.height = `${wallH}px`;
    stage.append(back);
    segments.push({ el: back, z: -(stops + 0.4) * sp, len: 0, place: (zr) => `translate3d(0, ${(ceilY + floorY) / 2}px, ${zr}px)`, shown: true });
    // the paintings, left and right in turn, a little ahead of their stop
    matches.forEach((match, i) => {
      const el = painting(match, i);
      stage.append(el);
      paintings.push({ el, i, side: i % 2 ? 1 : -1, z: -(i + 1) * sp - sp * 0.32 });
    });
    render(true);
  }

  // ── Each frame: place everything for the camera at stop p (a float) ──
  let p = 0;
  function render(force = false) {
    const { sp, hw, tw, wallY, frontY } = L;
    const cam = p * sp;
    for (const s of segments) {
      const zr = s.z + cam;
      const visible = zr + s.len / 2 < NEAR && zr > -5 * sp;
      if (visible !== s.shown || force) {
        s.el.style.display = visible ? "" : "none";
        s.shown = visible;
      }
      if (!visible) continue;
      s.el.style.transform = `translate(-50%, -50%) ${s.place(zr)}`;
      s.el.style.opacity = clamp01(1 - (-zr - 2.4 * sp) / (2.6 * sp)).toFixed(3);
    }
    // 1 at its stop: the painting faces her; the others fade meanwhile, so nothing far shows around it
    const focus = paintings.map((pt) => ease(clamp01(1 - Math.abs(p - (pt.i + 1)) / 0.55)));
    const top = Math.max(0, ...focus);
    for (const pt of paintings) {
      const f = focus[pt.i];
      const dim = f === top ? 1 : 1 - 0.92 * top;
      const zWall = pt.z + cam;
      const zr = lerp(zWall, -FRONT, f);
      const visible = zr < NEAR - tw / 2 && zr > -5 * sp;
      pt.el.style.display = visible ? "" : "none";
      if (!visible) continue;
      const x = lerp(pt.side * (hw - 8), 0, f);
      const y = lerp(wallY, frontY, f);
      const rot = lerp(pt.side * -90, 0, f);
      pt.el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${zr.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`;
      pt.el.style.zIndex = String(Math.round(10000 + zr));
      pt.el.style.opacity = (dim * clamp01(1 - (-zr - 2.4 * sp) / (2.6 * sp))).toFixed(3);
      pt.el.style.setProperty("--f", f.toFixed(3));
      pt.el.classList.toggle("is-facing", f > 0.98);
    }
    intro.style.opacity = clamp01(1 - p * 2.4).toFixed(3);
    intro.style.visibility = p > 0.45 ? "hidden" : "";
  }

  // ── Walking and reacting ──
  let frame = 0;
  let idle = null;
  let walking = false;
  let lastStop = -1;
  let stepTimer = null;
  let nap = null; // 25 s standing still in front of a painting: they sit down and doze off
  const bobs = [];
  const NAP = 25000;

  function setFaces(key) {
    cycy.set(m.faces.cycy[key]);
    kevin.set(m.faces.kevin[key]);
  }

  function startWalking() {
    if (walking) return;
    walking = true;
    lastStop = -1;
    clearTimeout(nap);
    setFaces("walk");
    end.classList.remove("is-shown");
    visitors.classList.remove("is-swapped");
    [cycy, kevin].forEach((a, k) =>
      bobs.push(gsap.to(a.el.parentElement, { y: -7, rotation: k ? 2.5 : -2.5, duration: 0.17, repeat: -1, yoyo: true, ease: "sine.inOut", delay: k * 0.17 })),
    );
    sfx("step");
    stepTimer = setInterval(() => sfx("step"), 340);
  }

  function stopWalking() {
    walking = false;
    clearInterval(stepTimer);
    bobs.splice(0).forEach((tween) => tween.kill());
    gsap.to(visitors.querySelectorAll(".mu-visitor"), { y: 0, rotation: 0, duration: 0.2 });
  }

  /** Arrived at stop k: they look, cheer, sulk… */
  function arrive(k) {
    if (k === lastStop) return;
    lastStop = k;
    if (k === 0) return setFaces("look");
    if (k === stops - 1) {
      setFaces("turn");
      visitors.classList.add("is-swapped"); // their kisses fly towards each other
      end.classList.add("is-shown");
      gsap.fromTo(end.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out" });
      sfx("reveal");
      return;
    }
    const match = matches[k - 1];
    const result = museumResult(match);
    sfx("ding");
    if (result === "soon") return setFaces("point");
    if (result === "loss") {
      setFaces("lose");
      setTimeout(() => lastStop === k && sfx("sadTrombone"), 350);
      return;
    }
    setFaces(match.final ? "final" : "win");
    [cycy, kevin].forEach((a, i) => setTimeout(() => a.jump(20), i * 110));
    if (match.final) {
      sfx("final");
      confetti(GOLD);
    } else setTimeout(() => lastStop === k && sfx("applause"), 300);
  }

  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const next = Math.max(0, Math.min(stops - 1, scrollY / L.stopH));
      if (Math.abs(next - p) > 0.002) startWalking();
      p = next;
      render();
      clearTimeout(idle);
      idle = setTimeout(settle, 140);
    });
  }

  function settle() {
    stopWalking();
    const k = Math.round(p);
    if (Math.abs(p - k) < 0.06) arrive(k);
    else setFaces("look");
    clearTimeout(nap);
    if (k > 0 && k < stops - 1) nap = setTimeout(() => setFaces("sleep"), NAP);
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Math.abs(innerWidth - L.vw) < 2 && Math.abs(innerHeight - L.vh) < 120) return; // Safari's bars coming and going
      const at = p;
      layout();
      scrollTo(0, at * L.stopH);
    }, 200);
  }

  return {
    el,
    noHome: true,
    enter() {
      document.documentElement.classList.add("is-museum");
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onResize);
      addEventListener("pointerdown", unlockAudio, { once: true });
      layout();
      scrollTo(0, 0);
      gsap.from(visitors, { y: 160, duration: 0.9, delay: 0.3, ease: "power3.out" });
    },
    leave() {
      document.documentElement.classList.remove("is-museum");
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      clearTimeout(nap);
      stopWalking();
    },
  };
}
