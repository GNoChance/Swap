// Debrief, The Quarry style: Mini Cyrielle asks, every answer forks the golden path,
// and each branch leads to its own ending. Her answers are kept for you (?debrief).
import { content } from "./content.js";
import { fill, addDebriefRun, secretUnlocked, debriefTree } from "./logic.js";
import { sfx, unlockAudio, startMusic, stopMusic } from "./audio.js";
import { playEffect, hearts, confetti } from "./effects.js";
import { createAvatar } from "./avatar.js";
import { createBubble } from "./scenes.js";
import { playUbb } from "./ubb.js";
import { loadDebrief, saveDebrief } from "./state.js";
import { h, svg, bump, centerOf } from "./dom.js";

const gsap = window.gsap;
// Always the full animations, even with the iPhone setting « Réduire les animations » on (user's choice:
// on that setting she would leave and come back with her crisps in a blink). Set to true to bring the soft versions back.
const reduced = false;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? Math.min(ms, 200) : ms));
const NS = "http://www.w3.org/2000/svg";
const STEP_Y = 54; // path: vertical distance between two choices
const SPREAD = 62; // path: horizontal distance between two branches

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

/**
 * Every ending of the debrief on one map: the branches to the endings already found in gold, the one just
 * reached glowing (its edges have the class is-current, to be drawn in), the rest dotted with a « ? »,
 * and the secret ending underneath (🔒 until found).
 */
export function completionMap(store, current) {
  const d = content.debrief;
  const tree = debriefTree(d);
  const byId = Object.fromEntries(tree.map((t) => [t.id, t]));
  const W = 320;
  const pos = (t) => [16 + t.x * (W - 32), 14 + t.y * 136];
  const climb = (id, set) => {
    for (let t = byId[id]; t; t = byId[t.parent]) set.add(t.id);
    return set;
  };
  const lit = new Set();
  (store?.found || []).forEach((id) => byId[id] && climb(id, lit));
  const now = current ? climb(current, new Set()) : new Set();
  const state = (id) => (now.has(id) ? " is-current" : lit.has(id) ? " is-found" : "");

  const map = svgEl("svg", { class: "debrief-map", viewBox: `0 0 ${W} 196`, "aria-hidden": "true" });
  for (const t of tree) {
    if (!t.parent) continue;
    const [x0, y0] = pos(byId[t.parent]);
    const [x1, y1] = pos(t);
    const my = (y0 + y1) / 2;
    map.append(svgEl("path", { d: `M${x0} ${y0} C${x0} ${my} ${x1} ${my} ${x1} ${y1}`, class: `map-edge${state(t.id)}` }));
  }
  for (const t of tree) {
    const [x, y] = pos(t);
    if (!t.ending) {
      map.append(svgEl("circle", { cx: x, cy: y, r: 3.6, class: `map-node${state(t.id)}` }));
      continue;
    }
    const known = lit.has(t.id) || now.has(t.id);
    const dot = svgEl("g", { class: `map-end${state(t.id)}`, transform: `translate(${x} ${y})` });
    const label = svgEl("text", { y: 2.4, "text-anchor": "middle" });
    label.textContent = known ? d.endings[t.id].n : "?";
    dot.append(svgEl("circle", { r: 7.2 }), label);
    map.append(dot);
  }
  // the secret ending, under the row of endings
  const all = Object.keys(d.endings).every((id) => lit.has(id) || now.has(id));
  map.append(svgEl("path", { d: `M${W / 2} 158 L${W / 2} 172`, class: `map-edge${store?.secret ? " is-found" : all ? " is-current" : ""}` }));
  const secret = svgEl("g", { class: `map-end map-secret${store?.secret ? " is-found" : ""}`, transform: `translate(${W / 2} 182)` });
  const mark = svgEl("text", { y: 3.6, "text-anchor": "middle" });
  mark.textContent = store?.secret ? "✦" : "🔒";
  secret.append(svgEl("circle", { r: 10 }), mark);
  map.append(secret);
  return map;
}

export function starField() {
  return h(
    "div",
    { class: "debrief-stars", "aria-hidden": "true" },
    Array.from({ length: 60 }, () => {
      const star = h("span", { class: "debrief-star" });
      star.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 3}s;--delay:${-Math.random() * 4}s;--s:${1 + Math.random() * 1.6}px`;
      return star;
    }),
  );
}

/** values: placeholders for the texts ({snack}); camp: her fondue side, which picks that ending's version. */
/** onSecret: opens the secret ending (all endings found). */
export function debriefScreen({ values = {}, camp, onReplay, onBack, onSecret }) {
  const d = content.debrief;
  const total = Object.keys(d.endings).length;
  const answers = [];

  const buddy = createAvatar({ face: d.intro.face, size: 112 });
  const bubble = createBubble();
  const choicesEl = h("div", { class: "debrief-choices" });
  const toast = h("p", { class: "debrief-toast" }, h("span", { class: "debrief-toast-icon", "aria-hidden": "true" }, "⑂"), d.pathChosen);

  // The path: a golden trail that forks at every question.
  const pathSvg = svg(`<svg class="debrief-path" viewBox="0 0 300 244" aria-hidden="true"><g class="debrief-stubs"></g><g class="debrief-trail"></g></svg>`);
  const stubsLayer = pathSvg.querySelector(".debrief-stubs");
  const trail = pathSvg.querySelector(".debrief-trail");
  let px = 150;
  let py = 18;
  let lastDot = svgEl("circle", { cx: px, cy: py, r: 5, class: "trail-dot" });
  trail.append(lastDot);

  const stage = h(
    "div",
    { class: "debrief-stage" },
    pathSvg,
    h("div", { class: "intro-bubble-slot debrief-bubble" }, bubble.el),
    h("div", { class: "debrief-avatar" }, buddy.el),
    choicesEl,
  );

  const endLabel = h("p", { class: "debrief-end-label" });
  const endTitle = h("h1", { class: "debrief-end-title" });
  const endAvatar = h("div", { class: "debrief-end-avatar" });
  const endText = h("p", { class: "debrief-end-text" });
  const endFound = h("p", { class: "debrief-found" });
  const endSecret = h("div", { class: "debrief-secret" });
  const ending = h(
    "div",
    { class: "debrief-end" },
    h("div", { class: "debrief-end-path" }),
    endLabel,
    endTitle,
    endAvatar,
    endText,
    endFound,
    endSecret,
    h(
      "div",
      { class: "debrief-actions" },
      h("button", { class: "btn btn-secondary", type: "button", onclick: () => (sfx("tap"), onReplay()) }, d.replay),
      h("button", { class: "btn btn-secondary", type: "button", onclick: () => (sfx("tap"), onBack()) }, d.back),
    ),
  );

  const el = h("section", { class: "screen screen-debrief" }, starField(), toast, stage, ending);
  let left = false;

  // ── Path drawing ──

  const curve = (x0, y0, x1, y1) => {
    const my = (y0 + y1) / 2;
    return `M${x0} ${y0} C${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
  };

  function drawStubs(count) {
    const spread = count > 1 ? Math.min(SPREAD, 252 / (count - 1)) : 0; // many answers: the fork tightens to fit
    const center = Math.max(24 + (spread * (count - 1)) / 2, Math.min(276 - (spread * (count - 1)) / 2, px));
    return Array.from({ length: count }, (_, k) => {
      const tx = center + (k - (count - 1) / 2) * spread;
      const ty = py + STEP_Y;
      const path = svgEl("path", { d: curve(px, py, tx, ty), class: "stub" });
      const dot = svgEl("circle", { cx: tx, cy: ty, r: 4, class: "stub-dot" });
      stubsLayer.append(path, dot);
      gsap.from([path, dot], { opacity: 0, duration: 0.5, stagger: 0.06 });
      return { path, dot, tx, ty };
    });
  }

  function takeBranch(stubs, k) {
    stubs.forEach((stub, j) => {
      if (j === k) return;
      gsap.to([stub.path, stub.dot], { opacity: 0, duration: 0.5, onComplete: () => (stub.path.remove(), stub.dot.remove()) });
    });
    const { path, dot, tx, ty } = stubs[k];
    path.setAttribute("class", "trail-segment");
    dot.setAttribute("class", "trail-dot");
    dot.setAttribute("r", 5);
    trail.append(path, dot);
    const length = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
    gsap.fromTo(dot, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.45, delay: 0.5, ease: "back.out(3)" });
    lastDot = dot;
    px = tx;
    py = ty;
  }

  function showToast() {
    sfx("dingHigh");
    gsap
      .timeline()
      .fromTo(toast, { autoAlpha: 0, xPercent: -50, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }) // centred by GSAP, which owns its transform
      .to(toast, { autoAlpha: 0, y: -6, duration: 0.4, delay: 1.3 });
  }

  // ── Dialogue ──

  /** Shows the answers and resolves with the index she taps. */
  function ask(node) {
    return new Promise((resolve) => {
      const stubs = drawStubs(node.choices.length);
      let chosen = false;
      const buttons = node.choices.map((choice, k) =>
        h(
          "button",
          {
            class: "debrief-choice",
            type: "button",
            onclick(e) {
              if (chosen) return;
              chosen = true;
              sfx("tap");
              bump(e.currentTarget);
              buttons.forEach((b, j) => b.classList.add(j === k ? "is-chosen" : "is-faded"));
              takeBranch(stubs, k);
              showToast();
              setTimeout(() => {
                gsap.to(buttons, { opacity: 0, y: 8, duration: 0.3, stagger: 0.05, onComplete: () => choicesEl.replaceChildren() });
                resolve(k);
              }, 700);
            },
          },
          choice.label,
        ),
      );
      choicesEl.classList.toggle("is-grid", Boolean(node.grid));
      choicesEl.replaceChildren(...buttons);
      gsap.from(buttons, { opacity: 0, y: 12, duration: 0.4, stagger: node.grid ? 0.05 : 0.1, ease: "power2.out", clearProps: "opacity,transform" });
    });
  }

  async function run() {
    startMusic();
    await sleep(500);
    buddy.jump();
    await bubble.say(d.intro.text);
    await sleep(1400);
    let id = d.start;
    while (!left && d.nodes[id]) {
      const node = d.nodes[id];
      buddy.set(node.face);
      await bubble.say(node.text);
      if (left) return;
      const k = await ask(node);
      if (left) return;
      answers.push({ question: node.text, answer: node.choices[k].label });
      id = node.choices[k].next;
      await sleep(900);
    }
    if (!left) showEnding(id);
  }

  function showEnding(id) {
    const end = { ...d.endings[id], ...d.endings[id].camps?.[camp] };
    const store = addDebriefRun(loadDebrief(), { ending: id, answers, date: new Date().toISOString() });
    saveDebrief(store);

    endLabel.textContent = fill(d.endLabel, { n: end.n, total });
    endTitle.textContent = end.title;
    endText.textContent = fill(end.text, values);
    endFound.textContent = fill(d.found, { found: store.found.length, total });
    // The UBB surprise: once, a few seconds after her first ending (before the secret ending, if it unlocks too);
    // after that, a button to see it again
    const ubbButton = () =>
      h("button", { class: "btn btn-secondary btn-ubb", type: "button", onclick: () => (sfx("tap"), playUbb({ onDone: startMusic })) }, d.ubb.button);
    if (store.ubb) endSecret.append(ubbButton());
    // The secret ending: a padlock until every ending is found, then it bursts in once; after that, a button
    const unlocking = !store.secret && secretUnlocked(store, Object.keys(d.endings));
    if (store.secret) {
      endSecret.append(
        h("button", { class: "btn btn-secondary btn-secret", type: "button", onclick: () => (sfx("tap"), onSecret()) }, d.secret.button),
      );
    } else if (!unlocking) endSecret.append(h("p", { class: "debrief-lock" }, fill(d.secret.locked, { total })));
    if (!store.ubb) {
      setTimeout(() => {
        if (left) return;
        playUbb({
          onDone() {
            if (left) return;
            const button = ubbButton();
            endSecret.prepend(button);
            gsap.from(button, { opacity: 0, y: 10, duration: 0.5, ease: "power2.out", clearProps: "opacity,transform" });
            if (unlocking) glitchTo(onSecret);
            else startMusic();
          },
        });
      }, 450 + d.ubb.delay);
    } else if (unlocking) setTimeout(() => !left && glitchTo(onSecret), 4500);
    lastDot.setAttribute("class", "trail-dot is-end");
    lastDot.setAttribute("r", 8);

    bubble.hide();
    gsap.to(stage, {
      autoAlpha: 0,
      duration: 0.45,
      onComplete() {
        if (left) return;
        // the map of every ending found so far, the path of this run drawn in
        const map = completionMap(store, id);
        ending.firstChild.append(map);
        map.querySelectorAll(".map-edge.is-current").forEach((edge, k) => {
          const length = edge.getTotalLength();
          gsap.fromTo(edge, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.5, delay: 0.4 + k * 0.35, ease: "power2.out" });
        });
        gsap.from(map.querySelector(".map-end.is-current"), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, delay: 0.5 + map.querySelectorAll(".map-edge.is-current").length * 0.35, ease: "back.out(3)" });
        endAvatar.append(buddy.el);
        stage.remove();
        gsap.fromTo(ending, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
        gsap.from(ending.children, { opacity: 0, y: 14, duration: 0.6, stagger: 0.12, delay: 0.1, ease: "power2.out", clearProps: "opacity,transform" });
        buddy.setBase(end.face);
        buddy.jump(30);
        sfx("reveal");
        setTimeout(() => {
          if (left) return;
          if (end.effect === "hearts") hearts(34, 1.6);
          else if (end.effect === "confetti") {
            sfx("static");
            setTimeout(() => sfx("jingle"), 350);
            confetti();
          } else playEffect(end.effect, centerOf(buddy.el));
        }, 500);
      },
    });
  }

  /** TV static over everything, « FIN SECRÈTE DÉBLOQUÉE » flickering, then the secret ending. */
  function glitchTo(next) {
    const text = h("p", { class: "secret-glitch-text" }, d.secret.unlocked);
    const noise = h("div", { class: "tv-static" });
    const veil = h("div", { class: "secret-glitch", "aria-live": "polite" }, noise, text);
    document.body.append(veil);
    sfx("static");
    setTimeout(() => sfx("static"), 700);
    gsap
      .timeline({ onComplete: () => veil.remove() })
      .set(noise, { autoAlpha: 0.9 })
      .fromTo(text, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, repeat: 7, yoyo: true }, 0.2)
      .to(noise, { autoAlpha: 0.35, duration: 0.15, repeat: 5, yoyo: true }, 0.2)
      .add(() => next(), 1.6)
      .to(veil, { autoAlpha: 0, duration: 0.5 }, 1.9);
  }

  return {
    el,
    enter() {
      run();
    },
    leave() {
      left = true;
      bubble.skipTyping();
      stopMusic(1);
    },
  };
}

// ── ?debrief: what she answered, for you ────────────────────

/** store: what to show (her saved answers by default; the ?test page passes a full one). */
export function debriefReport({ onPlay, store = loadDebrief() }) {
  const d = content.debrief;
  const r = d.report;
  const endings = Object.entries(d.endings).sort(([, a], [, b]) => a.n - b.n);
  const total = endings.length;
  const date = (iso) => {
    try {
      return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "";
    }
  };

  const runs = store.runs.length
    ? store.runs.map((run, i) => {
        const end = d.endings[run.ending];
        return h(
          "article",
          { class: "report-run" },
          h("h2", { class: "report-run-title" }, fill(r.run, { n: i + 1 }), h("span", { class: "report-date" }, date(run.date))),
          h(
            "ol",
            { class: "report-answers" },
            run.answers.map((a) => h("li", {}, h("span", { class: "report-q" }, a.question), h("span", { class: "report-a" }, a.answer))),
          ),
          h("p", { class: "report-ending" }, `${r.ending} : `, h("strong", {}, end ? `${fill(d.endLabel, { n: end.n, total })} · ${end.title}` : run.ending)),
        );
      })
    : h("p", { class: "report-empty" }, r.empty);

  const found = h(
    "ul",
    { class: "report-endings" },
    endings.map(([id, end]) => h("li", { class: store.found.includes(id) ? "is-found" : "" }, `${store.found.includes(id) ? "✔" : "·"} ${fill(d.endLabel, { n: end.n, total })} · ${end.title}`)),
  );

  const el = h(
    "section",
    { class: "screen screen-report" },
    h(
      "div",
      { class: "report-card" },
      h("h1", { class: "report-title" }, r.title),
      runs,
      h("h2", { class: "recap-title" }, `${r.endings} : ${store.found.length} / ${total}`),
      found,
      completionMap(store, null),
      h("p", { class: "report-secret" }, `${r.secret} : `, h("strong", {}, store.secret ? r.secretFound : r.secretNotYet)),
      h("p", { class: "report-secret" }, `${r.ubb} : `, h("strong", {}, store.ubb ? r.ubbSeen : r.secretNotYet)),
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick() {
            unlockAudio();
            sfx("tap");
            onPlay();
          },
        },
        r.play,
      ),
    ),
  );
  return { el };
}
