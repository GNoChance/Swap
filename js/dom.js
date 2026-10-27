// Small DOM helpers shared by every screen and game.

const gsap = window.gsap;

/** h("button", { class: "btn", onclick }, "Texte", childNode) */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key === "class") el.className = value;
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

/** Build a node from trusted markup (icons, seals). */
export function svg(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export function shake(el, strength = 10) {
  gsap.killTweensOf(el, "x");
  gsap.to(el, {
    keyframes: { x: [0, -strength, strength * 0.9, -strength * 0.6, strength * 0.4, -strength * 0.2, 0] },
    duration: 0.5,
    ease: "power1.out",
    clearProps: "x",
  });
}

/** Warm white flash over everything: the reveal "pop", stronger than a vibration on iPhone. */
export function flash() {
  const veil = h("div", { class: "flash", "aria-hidden": "true" });
  document.body.append(veil);
  gsap
    .timeline({ onComplete: () => veil.remove() })
    .to(veil, { opacity: 0.75, duration: 0.12, ease: "power1.out" })
    .to(veil, { opacity: 0, duration: 0.6, ease: "power2.out" });
}

/** Tactile "bump" for iPhone, where there is no vibration. */
export function bump(el, amount = 0.985) {
  gsap.fromTo(el, { scale: 1 }, { scale: amount, duration: 0.09, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "scale" });
}

/** A letter flies from one element to another (anagram, code secret). */
export function flyLetter(fromEl, toEl, letter) {
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const ghost = h("span", { class: "fly-letter", "aria-hidden": "true" }, letter);
  ghost.style.left = `${a.left + a.width / 2}px`;
  ghost.style.top = `${a.top + a.height / 2}px`;
  document.body.append(ghost);
  gsap.set(ghost, { xPercent: -50, yPercent: -50 });
  return new Promise((resolve) => {
    gsap.to(ghost, { keyframes: { scale: [1, 1.25, 1] }, duration: 0.42 });
    gsap.to(ghost, {
      x: b.left + b.width / 2 - (a.left + a.width / 2),
      y: b.top + b.height / 2 - (a.top + a.height / 2),
      duration: 0.42,
      ease: "power3.inOut",
      onComplete() {
        ghost.remove();
        resolve();
      },
    });
  });
}

export function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ── Wax seal ────────────────────────────────────────────────

let sealId = 0;

/** Irregular wax blob with an embossed label. Deterministic shape per seed. */
export function seal(label, { size = 64, seed = 1, className = "" } = {}) {
  const id = `seal-${++sealId}`;
  let s = (seed * 7919) % 233280;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 30;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 45 + rnd() * 4.5 - (i % 4 === 0 ? rnd() * 3 : 0);
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r];
  });
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2].map((v) => v.toFixed(2));
  let d = `M${mid(pts[n - 1], pts[0]).join(" ")}`;
  for (let i = 0; i < n; i++) d += ` Q${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} ${mid(pts[i], pts[(i + 1) % n]).join(" ")}`;
  const fontSize = String(label).length > 1 ? 30 : 40;
  return svg(`
    <svg class="seal ${className}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="36%" cy="30%" r="80%">
          <stop offset="0" stop-color="#A33A56"/>
          <stop offset=".5" stop-color="#7A1F35"/>
          <stop offset="1" stop-color="#4A0E1F"/>
        </radialGradient>
      </defs>
      <path d="${d} Z" fill="url(#${id})"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(30,4,12,.35)" stroke-width="2.4"/>
      <circle cx="50" cy="51" r="32" fill="none" stroke="rgba(255,220,225,.16)" stroke-width="1"/>
      <text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="Cormorant Garamond, Georgia, serif"
        font-weight="600" font-style="italic" font-size="${fontSize}" fill="rgba(30,4,12,.45)">${label}</text>
      <text x="50" y="50.6" text-anchor="middle" dominant-baseline="central" font-family="Cormorant Garamond, Georgia, serif"
        font-weight="600" font-style="italic" font-size="${fontSize}" fill="#EBC6B0">${label}</text>
    </svg>`);
}

// ── Icons ───────────────────────────────────────────────────

export const icons = {
  lock: `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.6 0 5.5 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m6 6 12 12M18 6 6 18"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="m15.5 9.5 5 5m0-5-5 5"/></svg>`,
};
