// Full-screen particle canvas. One effect per gift, plus shared gold dust, hearts and fireworks.
// Each particle: position/velocity/physics + its own draw(ctx, p) in local (translated, rotated) space.

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.createElement("canvas");
canvas.className = "fx-canvas";
canvas.setAttribute("aria-hidden", "true");
const ctx = canvas.getContext("2d");
const particles = [];
let W = 0;
let H = 0;
let raf = 0;
let last = 0;

export function mountEffects() {
  document.body.appendChild(canvas);
  resize();
  addEventListener("resize", resize);
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const count = (n) => Math.max(1, Math.round(reduced ? n * 0.3 : n));

function add(p) {
  particles.push({
    x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 1, rot: 0, vr: 0, age: 0, life: 2, delay: 0, alpha: 1,
    fadeIn: 0.12, fadeOut: 0.3,
    ...p,
  });
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  ctx.clearRect(0, 0, W, H);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.delay > 0) {
      p.delay -= dt;
      continue;
    }
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      p.onEnd?.(p);
      continue;
    }
    p.vy += p.g * dt;
    if (p.drag !== 1) {
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.tick?.(p, dt);
    const t = p.age / p.life;
    const fade = Math.min(1, t / p.fadeIn, (1 - t) / p.fadeOut);
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha * fade);
    ctx.translate(p.x + (p.ox || 0), p.y);
    ctx.rotate(p.rot);
    p.draw(ctx, p, t);
    ctx.restore();
  }
  raf = particles.length ? requestAnimationFrame(loop) : 0;
  if (!raf) ctx.clearRect(0, 0, W, H);
}

export function clearEffects() {
  particles.length = 0;
}

// ── Shapes ──────────────────────────────────────────────────

function heartPath(c, s) {
  c.beginPath();
  c.moveTo(0, -s * 0.25);
  c.bezierCurveTo(-s * 0.5, -s * 0.9, -s * 1.2, -s * 0.1, 0, s * 0.8);
  c.bezierCurveTo(s * 1.2, -s * 0.1, s * 0.5, -s * 0.9, 0, -s * 0.25);
  c.closePath();
}

function starPath(c, r, pinch = 0.14) {
  c.beginPath();
  c.moveTo(0, -r);
  c.quadraticCurveTo(r * pinch, -r * pinch, r, 0);
  c.quadraticCurveTo(r * pinch, r * pinch, 0, r);
  c.quadraticCurveTo(-r * pinch, r * pinch, -r, 0);
  c.quadraticCurveTo(-r * pinch, -r * pinch, 0, -r);
  c.closePath();
}

function glow(c, r, color, strength = 0.35) {
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, color.replace("ALPHA", strength));
  g.addColorStop(1, color.replace("ALPHA", 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
}

// ── Shared: gold dust around the answer ─────────────────────

export function goldDust(origin) {
  const { x, y } = origin || { x: W / 2, y: H / 2 };
  for (let i = 0; i < count(46); i++) {
    const a = rand(0, Math.PI * 2);
    const speed = rand(60, 260);
    add({
      x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 40,
      g: 40, drag: 0.95, life: rand(1.2, 2.2), delay: rand(0, 0.15),
      r: rand(1.2, 3.2), hue: pickOne(["#C9A15B", "#E6CB8F", "#B8935A", "#F3DFB0"]),
      draw(c, p, t) {
        glow(c, p.r * 4, "rgba(214,180,110,ALPHA)", 0.35);
        c.fillStyle = p.hue;
        c.beginPath();
        c.arc(0, 0, p.r * (1 - t * 0.4), 0, Math.PI * 2);
        c.fill();
      },
    });
  }
}

// ── 1. Bath bomb: iridescent bubbles + fizz ────────────────

function bubbles() {
  for (let i = 0; i < count(44); i++) {
    const r = rand(6, 24);
    add({
      x: rand(0, W), y: H + r + rand(0, 60), vy: -rand(90, 190),
      life: rand(2.6, 4.2), delay: rand(0, 1.3), r, fadeIn: 0.08, fadeOut: 0.12,
      phase: rand(0, 6), amp: rand(8, 26), freq: rand(1.5, 3),
      tick(p) {
        p.ox = Math.sin(p.age * p.freq + p.phase) * p.amp;
      },
      draw(c, p, t) {
        const pop = t > 0.9 ? 1 + (t - 0.9) * 4 : 1;
        const r = p.r * pop;
        const fill = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        fill.addColorStop(0, "rgba(255,255,255,0.05)");
        fill.addColorStop(0.75, "rgba(232,200,235,0.18)");
        fill.addColorStop(1, "rgba(160,215,235,0.45)");
        c.fillStyle = fill;
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.fill();
        const rim = c.createLinearGradient(-r, -r, r, r);
        rim.addColorStop(0, "rgba(233,150,190,0.8)");
        rim.addColorStop(0.5, "rgba(120,200,225,0.8)");
        rim.addColorStop(1, "rgba(175,140,225,0.8)");
        c.strokeStyle = rim;
        c.lineWidth = 1.2;
        c.stroke();
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.beginPath();
        c.ellipse(-r * 0.4, -r * 0.42, r * 0.22, r * 0.12, -0.7, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
  for (let i = 0; i < count(60); i++) {
    add({
      x: rand(W * 0.1, W * 0.9), y: H + 4, vy: -rand(140, 320), vx: rand(-20, 20),
      life: rand(1, 2.2), delay: rand(0, 1.6), r: rand(1, 2.4),
      draw(c, p) {
        c.fillStyle = "rgba(150,170,215,0.7)";
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
}

// ── 2. Pyjama: drifting moons and stars ─────────────────────

function moons() {
  for (let i = 0; i < count(34); i++) {
    const isMoon = Math.random() < 0.35;
    add({
      x: rand(0, W), y: -30 - rand(0, 80), vy: rand(45, 95), vx: rand(-10, 10),
      vr: rand(-0.4, 0.4), life: rand(4.5, 6.5), delay: rand(0, 1.6),
      r: isMoon ? rand(9, 15) : rand(4, 9), isMoon, phase: rand(0, 6), amp: rand(10, 30),
      color: pickOne(["#D9BF8C", "#C9A15B", "#E8D3A8", "#B48BA0"]),
      tick(p) {
        p.ox = Math.sin(p.age * 0.9 + p.phase) * p.amp;
      },
      draw(c, p) {
        glow(c, p.r * 2.6, "rgba(217,191,140,ALPHA)", 0.25);
        c.fillStyle = p.color;
        if (p.isMoon) {
          c.save();
          c.beginPath();
          c.arc(0, 0, p.r, 0, Math.PI * 2);
          c.clip();
          c.beginPath();
          c.rect(-p.r, -p.r, p.r * 2, p.r * 2);
          c.arc(p.r * 0.45, -p.r * 0.2, p.r * 0.85, 0, Math.PI * 2);
          c.fill("evenodd");
          c.restore();
        } else {
          c.globalAlpha *= 0.65 + 0.35 * Math.sin(p.age * 5 + p.phase);
          starPath(c, p.r);
          c.fill();
        }
      },
    });
  }
}

// ── 3. M&M's: candy rain that bounces ───────────────────────

const CANDY = ["#E3242B", "#F7C600", "#2E9E44", "#1E64C8", "#F2802B", "#6B3E26"];

function candies() {
  for (let i = 0; i < count(42); i++) {
    const r = rand(10, 15);
    add({
      x: rand(r, W - r), y: -r - rand(0, 160), vy: rand(0, 120), vx: rand(-40, 40), g: 1100,
      vr: rand(-4, 4), life: rand(3, 4), delay: rand(0, 1), r, bounces: 0,
      flip: rand(0, 6), flipSpeed: rand(3, 8), color: pickOne(CANDY), fadeOut: 0.2,
      tick(p, dt) {
        const floor = H - p.r - 6;
        if (p.y > floor && p.vy > 0 && p.bounces < 3) {
          p.y = floor;
          p.vy *= -0.45;
          p.vx *= 0.7;
          p.vr *= 0.6;
          p.bounces++;
        }
        p.flip += p.flipSpeed * dt;
      },
      draw(c, p) {
        const sy = Math.max(0.3, Math.abs(Math.cos(p.flip)));
        c.scale(1, sy);
        const g = c.createRadialGradient(-p.r * 0.35, -p.r * 0.4, p.r * 0.1, 0, 0, p.r);
        g.addColorStop(0, "rgba(255,255,255,0.55)");
        g.addColorStop(0.35, p.color);
        g.addColorStop(1, p.color);
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(0,0,0,0.12)";
        c.beginPath();
        c.arc(0, p.r * 0.12, p.r, 0.15 * Math.PI, 0.85 * Math.PI);
        c.fill();
        if (sy > 0.55) {
          c.fillStyle = "#fff";
          c.font = `700 ${p.r * 1.05}px Inter, system-ui, sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText("m", 0, -p.r * 0.06);
        }
      },
    });
  }
}

// ── 4. Patate positive: smiling potatoes + hearts ──────────

function potatoPath(c, p) {
  const n = p.bumps.length;
  const pts = p.bumps.map((f, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * p.r * 1.25 * f, Math.sin(a) * p.r * f];
  });
  c.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  c.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    m = mid(pts[i], pts[(i + 1) % n]);
    c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  c.closePath();
}

function potatoes() {
  for (let i = 0; i < count(14); i++) {
    const r = rand(16, 24);
    add({
      x: rand(W * 0.1, W * 0.9), y: H + r * 2, vy: -rand(H * 1.05, H * 1.4), vx: rand(-110, 110),
      g: H * 1.35, vr: rand(-2.5, 2.5), life: 2.6, delay: rand(0, 1), r, fadeIn: 0.02, fadeOut: 0.08,
      bumps: Array.from({ length: 9 }, () => rand(0.88, 1.08)),
      draw(c, p) {
        potatoPath(c, p);
        const g = c.createRadialGradient(-p.r * 0.4, -p.r * 0.4, p.r * 0.2, 0, 0, p.r * 1.3);
        g.addColorStop(0, "#E9C48E");
        g.addColorStop(1, "#B98A52");
        c.fillStyle = g;
        c.fill();
        c.strokeStyle = "rgba(110,70,35,0.35)";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "rgba(120,80,40,0.3)";
        for (const [sx, sy] of [[0.7, -0.45], [-0.75, 0.4], [0.55, 0.55]]) {
          c.beginPath();
          c.arc(sx * p.r, sy * p.r, p.r * 0.07, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#3B2416";
        for (const ex of [-0.32, 0.32]) {
          c.beginPath();
          c.ellipse(ex * p.r, -p.r * 0.12, p.r * 0.08, p.r * 0.12, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = "#3B2416";
        c.lineWidth = Math.max(1.4, p.r * 0.08);
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, p.r * 0.1, p.r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();
        c.fillStyle = "rgba(235,120,130,0.45)";
        for (const cx of [-0.62, 0.62]) {
          c.beginPath();
          c.arc(cx * p.r, p.r * 0.18, p.r * 0.14, 0, Math.PI * 2);
          c.fill();
        }
      },
    });
  }
  hearts(16, 0.6);
}

// ── 5. Strass: prismatic twinkles ───────────────────────────

const PRISM = ["#A58BD6", "#5EC2D6", "#E78FAE", "#C9A15B", "#7FA8E8"];

function sparkle(c, p, t) {
  const tw = 0.55 + 0.45 * Math.sin(p.age * p.speed + p.phase);
  const r = p.r * (0.6 + 0.6 * tw);
  glow(c, r * 2.4, p.glow, 0.4 * tw);
  c.fillStyle = p.color;
  starPath(c, r, 0.12);
  c.fill();
  c.rotate(Math.PI / 4);
  c.globalAlpha *= 0.55;
  starPath(c, r * 0.55, 0.2);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(0, 0, r * 0.16 + 0.6, 0, Math.PI * 2);
  c.fill();
}

const glowOf = { "#A58BD6": "rgba(165,139,214,ALPHA)", "#5EC2D6": "rgba(94,194,214,ALPHA)", "#E78FAE": "rgba(231,143,174,ALPHA)", "#C9A15B": "rgba(201,161,91,ALPHA)", "#7FA8E8": "rgba(127,168,232,ALPHA)" };

function sparkles(origin) {
  const { x, y } = origin || { x: W / 2, y: H / 2 };
  for (let i = 0; i < count(36); i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(200, 520);
    const color = pickOne(PRISM);
    add({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 0.92, g: 20, life: rand(1.6, 2.6),
      r: rand(5, 11), phase: rand(0, 6), speed: rand(8, 14), color, glow: glowOf[color], draw: sparkle,
    });
  }
  for (let i = 0; i < count(34); i++) {
    const color = pickOne(PRISM);
    add({
      x: rand(16, W - 16), y: rand(16, H - 16), vy: -rand(0, 12), life: rand(1, 1.8), delay: rand(0.1, 1.8),
      r: rand(4, 10), phase: rand(0, 6), speed: rand(6, 12), color, glow: glowOf[color], draw: sparkle,
      fadeIn: 0.3, fadeOut: 0.4,
    });
  }
}

// ── 6. Air Styler: gusts of wavy strands ────────────────────

const HAIR = ["#8B5A2B", "#C8A165", "#5C3A21", "#7A1F35", "#B8935A", "#D9BF8C"];

function wind() {
  for (let i = 0; i < count(26); i++) {
    const len = rand(140, 300);
    add({
      x: -len - rand(0, 200), y: rand(H * 0.08, H * 0.92), vx: rand(620, 1000), vy: rand(-30, 30),
      life: (W + len * 2 + 200) / 620, delay: rand(0, 1.2), len, fadeIn: 0.05, fadeOut: 0.1,
      amp: rand(6, 16), k: rand(0.03, 0.06), phase: rand(0, 6), width: rand(1.4, 3.2),
      color: pickOne(HAIR), alpha: rand(0.55, 0.9),
      draw(c, p) {
        const grad = c.createLinearGradient(-p.len, 0, 0, 0);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, p.color);
        c.strokeStyle = grad;
        c.lineWidth = p.width;
        c.lineCap = "round";
        c.beginPath();
        for (let s = 0; s <= p.len; s += 8) {
          const yy = Math.sin(s * p.k + p.phase + p.age * 9) * p.amp * (s / p.len);
          if (s === 0) c.moveTo(-p.len + s, yy);
          else c.lineTo(-p.len + s, yy);
        }
        c.stroke();
      },
    });
  }
  for (let i = 0; i < count(10); i++) {
    add({
      x: rand(W * 0.1, W * 0.9), y: rand(H * 0.15, H * 0.85), vx: rand(160, 300), life: rand(1, 1.6),
      delay: rand(0.2, 1.4), r: rand(10, 22), vr: 6,
      draw(c, p, t) {
        c.strokeStyle = "rgba(184,147,90,0.6)";
        c.lineWidth = 1.4;
        c.beginPath();
        for (let a = 0; a < Math.PI * 3.2; a += 0.2) {
          const rr = (a / (Math.PI * 3.2)) * p.r * (0.6 + t);
          c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.stroke();
      },
    });
  }
}

// ── 7. UBB: red & blue confetti cannons + rugby balls ──────

const UBB = ["#D62839", "#1F4E9E", "#D62839", "#1F4E9E", "#C9A15B", "#FFFFFF"];

function confettiPiece(c, p) {
  const sy = Math.cos(p.flip);
  c.scale(1, sy);
  c.fillStyle = p.color;
  c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  if (p.color === "#FFFFFF") {
    c.strokeStyle = "rgba(43,26,30,0.25)";
    c.lineWidth = 0.8;
    c.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }
}

function cannon(fromX, dir, n, colors) {
  for (let i = 0; i < count(n); i++) {
    const a = (-Math.PI / 2) + dir * rand(0.15, 0.75);
    const s = rand(H * 0.9, H * 1.5);
    add({
      x: fromX, y: H + 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 900, drag: 0.975,
      vr: rand(-8, 8), life: rand(2.6, 3.6), delay: rand(0, 0.35), w: rand(7, 12), h: rand(4, 7),
      flip: rand(0, 6), color: pickOne(colors), fadeIn: 0.02,
      tick(p, dt) {
        p.flip += dt * 9;
        if (p.vy > 0) p.vx += Math.sin(p.age * 6 + p.w) * 8;
      },
      draw: confettiPiece,
    });
  }
}

function rugby() {
  cannon(-10, 1, 70, UBB);
  cannon(W + 10, -1, 70, UBB);
  for (let i = 0; i < count(3); i++) {
    add({
      x: -40, y: rand(H * 0.25, H * 0.6), vx: rand(W * 0.7, W * 1.0), vy: -rand(H * 0.5, H * 0.7), g: H * 1.1,
      vr: rand(6, 10), life: 2.4, delay: 0.4 + i * 0.35, fadeIn: 0.02, fadeOut: 0.1,
      draw(c) {
        c.fillStyle = "#8B4A2B";
        c.beginPath();
        c.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#fff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-7, 0);
        c.lineTo(7, 0);
        for (let s = -5; s <= 5; s += 3.3) {
          c.moveTo(s, -2.5);
          c.lineTo(s, 2.5);
        }
        c.stroke();
      },
    });
  }
}

/** Two confetti cannons from the bottom corners. */
export function confetti(colors = ["#E3242B", "#FFD23F", "#1E64C8", "#FFFFFF", "#2E9E44", "#FF5FA2"]) {
  cannon(-10, 1, 60, colors);
  cannon(W + 10, -1, 60, colors);
}

// ── Hearts & fireworks (final) ──────────────────────────────

export function hearts(n = 24, delayMax = 1.4) {
  for (let i = 0; i < count(n); i++) {
    add({
      x: rand(0, W), y: H + 20, vy: -rand(70, 150), life: rand(3.5, 5.5), delay: rand(0, delayMax),
      s: rand(7, 14), phase: rand(0, 6), amp: rand(12, 30), vr: 0,
      color: pickOne(["#7A1F35", "#A23A55", "#E7A0B0", "#C9A15B"]),
      tick(p) {
        p.ox = Math.sin(p.age * 1.6 + p.phase) * p.amp;
        p.rot = Math.sin(p.age * 2 + p.phase) * 0.25;
      },
      draw(c, p) {
        c.fillStyle = p.color;
        heartPath(c, p.s);
        c.fill();
      },
    });
  }
}

const FIRE = ["#F3DFB0", "#C9A15B", "#E7A0B0", "#FFFFFF", "#F28AA5"];

function rocket(delay) {
  const tx = rand(W * 0.15, W * 0.85);
  const ty = rand(H * 0.12, H * 0.42);
  const x0 = tx + rand(-40, 40);
  add({
    x: x0, x0, y: H + 10, life: rand(0.7, 1), delay, fadeIn: 0.01, fadeOut: 0.01,
    tick(p) {
      const ease = 1 - Math.pow(1 - p.age / p.life, 3);
      p.x = p.x0 + (tx - p.x0) * ease;
      p.y = H + 10 + (ty - H - 10) * ease;
    },
    onEnd: () => explode(tx, ty),
    draw(c) {
      glow(c, 10, "rgba(243,223,176,ALPHA)", 0.8);
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(0, 0, 2, 0, Math.PI * 2);
      c.fill();
    },
  });
}

function explode(x, y) {
  const color = pickOne(FIRE);
  const heartShaped = Math.random() < 0.35;
  const n = count(56);
  for (let i = 0; i < n; i++) {
    let vx;
    let vy;
    if (heartShaped) {
      // parametric heart outline
      const t = (i / n) * Math.PI * 2;
      vx = 16 * Math.pow(Math.sin(t), 3) * 14;
      vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 14;
    } else {
      const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
      const s = rand(150, 290);
      vx = Math.cos(a) * s;
      vy = Math.sin(a) * s;
    }
    add({
      x, y, vx, vy, g: 120, drag: 0.94, life: rand(1.3, 2), r: rand(1.4, 2.6),
      color: Math.random() < 0.2 ? "#FFFFFF" : color, fadeIn: 0.01, fadeOut: 0.5,
      draw(c, p) {
        glow(c, p.r * 4, "rgba(243,223,176,ALPHA)", 0.3);
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
}

export function fireworks(rounds = 7) {
  for (let i = 0; i < (reduced ? 2 : rounds); i++) rocket(i * 0.45 + rand(0, 0.2));
  hearts(30, 3);
}

// ── Fondue: melted cheese or chocolate drips down from the top ──

const MELT = {
  cheese: { body: ["#F6D776", "#F2C94C", "#EDBE3F"], shine: "rgba(255,250,220,.8)", edge: "rgba(176,128,28,.5)" },
  chocolate: { body: ["#5A3220", "#6B3E26", "#4E2A1A"], shine: "rgba(255,225,200,.38)", edge: "rgba(36,18,8,.55)" },
};

function drip(c, p, length) {
  const r = p.w / 2;
  c.beginPath();
  c.moveTo(-p.band, -6);
  c.lineTo(p.band, -6);
  c.lineTo(p.band, 10);
  c.quadraticCurveTo(r, 12, r, 22);
  c.lineTo(r, length);
  c.arc(0, length, r, 0, Math.PI);
  c.lineTo(-r, 22);
  c.quadraticCurveTo(-r, 12, -p.band, 10);
  c.closePath();
}

/** kinds: "cheese", "chocolate" or both (the generic fondue). */
function melt(kinds) {
  const n = Math.max(6, Math.round(W / 30));
  for (let i = 0; i < n; i++) {
    const m = MELT[kinds[i % kinds.length]];
    add({
      x: (i + 0.5) * (W / n), y: 0,
      life: rand(3.2, 4.2), delay: rand(0, 0.35), fadeIn: 0.02, fadeOut: 0.3,
      w: rand(9, 20), band: W / n / 2 + 2, len: rand(50, Math.min(240, H * 0.3)), speed: rand(0.4, 0.6),
      color: pickOne(m.body), m,
      draw(c, p, t) {
        const grow = Math.min(1, t / p.speed);
        const length = 22 + p.len * (1 - Math.pow(1 - grow, 3));
        c.fillStyle = p.color;
        drip(c, p, length);
        c.fill();
        c.strokeStyle = p.m.edge;
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = p.m.shine;
        c.fillRect(-p.w * 0.28, 14, p.w * 0.16, Math.max(0, length - 20));
      },
    });
  }
  // drops falling off the drips
  for (let i = 0; i < count(28); i++) {
    const m = MELT[pickOne(kinds)];
    add({
      x: rand(0, W), y: rand(80, Math.min(260, H * 0.32)), vy: rand(20, 80), g: 900,
      life: rand(1.4, 2.4), delay: rand(0.9, 2.2), r: rand(3, 6), color: pickOne(m.body), m,
      draw(c, p) {
        c.fillStyle = p.color;
        c.beginPath();
        c.moveTo(0, -p.r * 2.2);
        c.quadraticCurveTo(p.r, -p.r * 0.4, p.r, 0);
        c.arc(0, 0, p.r, 0, Math.PI);
        c.quadraticCurveTo(-p.r, -p.r * 0.4, 0, -p.r * 2.2);
        c.fill();
        c.fillStyle = p.m.shine;
        c.beginPath();
        c.arc(-p.r * 0.35, -p.r * 0.2, p.r * 0.28, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
  // something to dip: bread cubes for the cheese, strawberries for the chocolate
  for (let i = 0; i < count(16); i++) {
    const kind = pickOne(kinds);
    add({
      x: rand(W * 0.08, W * 0.92), y: -30, vy: rand(60, 160), vx: rand(-30, 30), g: 420, vr: rand(-3, 3),
      life: rand(2.8, 3.6), delay: rand(0.3, 1.6), s: rand(9, 14), kind,
      draw(c, p) {
        if (p.kind === "cheese") {
          c.fillStyle = "#E8C98F";
          c.fillRect(-p.s, -p.s, p.s * 2, p.s * 2);
          c.strokeStyle = "#B07A3A";
          c.lineWidth = 2.5;
          c.strokeRect(-p.s, -p.s, p.s * 2, p.s * 2);
          c.fillStyle = "rgba(176,122,58,.35)";
          for (const [dx, dy] of [[-0.4, -0.3], [0.3, 0.1], [-0.1, 0.45]]) c.fillRect(dx * p.s, dy * p.s, 2, 2);
        } else {
          c.fillStyle = "#E3343E";
          c.beginPath();
          c.moveTo(0, p.s * 1.1);
          c.bezierCurveTo(-p.s * 1.2, p.s * 0.2, -p.s * 1, -p.s * 0.9, 0, -p.s * 0.7);
          c.bezierCurveTo(p.s * 1, -p.s * 0.9, p.s * 1.2, p.s * 0.2, 0, p.s * 1.1);
          c.fill();
          c.fillStyle = "#3E9A4A";
          for (const a of [-0.9, 0, 0.9]) {
            c.beginPath();
            c.ellipse(Math.sin(a) * p.s * 0.45, -p.s * 0.8, p.s * 0.22, p.s * 0.45, a, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = "rgba(255,236,160,.85)";
          for (const [dx, dy] of [[-0.35, -0.1], [0.3, 0.05], [0, 0.45], [-0.15, 0.2]]) c.fillRect(dx * p.s, dy * p.s, 1.6, 2.2);
        }
      },
    });
  }
}

const fondue = () => melt(["cheese", "chocolate"]);
const cheese = () => melt(["cheese"]);
const chocolate = () => melt(["chocolate"]);

// ── Shower foam: two waves of scented foam clouds (× 2) and pearly bubbles ──

function foam() {
  for (let wave = 0; wave < 2; wave++) {
    for (let i = 0; i < count(10); i++) {
      const s = rand(26, 52);
      add({
        x: rand(W * 0.06, W * 0.94), y: H + s * 1.4, vy: -rand(150, 240),
        life: rand(3.2, 4.4), delay: wave * 1.2 + rand(0, 0.5), fadeIn: 0.08, fadeOut: 0.3,
        s, phase: rand(0, 6),
        puffs: Array.from({ length: 6 }, (_, k) => [Math.cos((k / 6) * Math.PI * 2) * rand(0.5, 0.8), Math.sin((k / 6) * Math.PI * 2) * rand(0.25, 0.4), rand(0.42, 0.62)]),
        tick(p) {
          p.ox = Math.sin(p.age * 1.3 + p.phase) * 16;
        },
        draw(c, p, t) {
          const k = 0.75 + t * 0.6;
          c.scale(k, k);
          for (const [dx, dy, r] of [[0, 0, 0.7], ...p.puffs]) {
            const x = dx * p.s;
            const y = dy * p.s;
            const g = c.createRadialGradient(x - r * p.s * 0.35, y - r * p.s * 0.35, 0, x, y, r * p.s);
            g.addColorStop(0, "rgba(255,255,255,1)");
            g.addColorStop(0.65, "rgba(250,246,253,.95)");
            g.addColorStop(1, "rgba(214,204,232,.85)");
            c.fillStyle = g;
            c.beginPath();
            c.arc(x, y, r * p.s, 0, Math.PI * 2);
            c.fill();
          }
        },
      });
    }
  }
  for (let i = 0; i < count(36); i++) {
    const r = rand(3, 9);
    add({
      x: rand(0, W), y: H + r, vy: -rand(110, 220), life: rand(2.2, 3.6), delay: rand(0, 2.2), r,
      phase: rand(0, 6),
      tick(p) {
        p.ox = Math.sin(p.age * 2.4 + p.phase) * 10;
      },
      draw(c, p) {
        c.fillStyle = "rgba(255,255,255,.35)";
        c.strokeStyle = "rgba(190,165,215,.85)";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "rgba(255,255,255,.95)";
        c.beginPath();
        c.arc(-p.r * 0.35, -p.r * 0.35, p.r * 0.25, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
}

// ── Snacks that bounce on the bottom of the screen ──────────

/** Bounce off the floor (and the sides) instead of falling through. Runs in a particle's tick. */
function bounceOnFloor(p) {
  if (p.y > p.floor) {
    p.y = p.floor;
    if (p.vy > 70) {
      p.vy *= -p.bounce;
      p.vx *= 0.78;
      p.vr *= 0.6;
      if (p.bounces++ < 2) p.onBounce?.(p);
    } else {
      p.vy = 0;
      p.vx *= 0.86;
      p.vr *= 0.82;
    }
  }
  if (p.x < 6 || p.x > W - 6) {
    p.vx *= -0.6;
    p.x = Math.max(6, Math.min(W - 6, p.x));
  }
}

/** Monster Munch: a little smiling ghost (dome, pointed bottom corner), eyes and smile cut out (fill with "evenodd"). */
function ghostPath(c, s) {
  c.beginPath();
  c.moveTo(-0.75 * s, -0.12 * s);
  c.arc(0, -0.12 * s, 0.75 * s, Math.PI, 0);
  c.quadraticCurveTo(0.82 * s, 0.5 * s, 0.55 * s, 0.76 * s);
  c.quadraticCurveTo(0.1 * s, 0.98 * s, -0.36 * s, 0.82 * s);
  c.lineTo(-0.86 * s, 0.98 * s);
  c.quadraticCurveTo(-0.76 * s, 0.42 * s, -0.75 * s, -0.12 * s);
  c.closePath();
  for (const ex of [-0.24, 0.26]) {
    c.moveTo((ex + 0.11) * s, -0.24 * s);
    c.ellipse(ex * s, -0.24 * s, 0.11 * s, 0.17 * s, 0, 0, Math.PI * 2);
  }
  c.moveTo(-0.44 * s, 0.1 * s);
  c.quadraticCurveTo(0.04 * s, 0.72 * s, 0.52 * s, 0.06 * s);
  c.quadraticCurveTo(0.06 * s, 0.38 * s, -0.44 * s, 0.1 * s);
}

/** Brets: a plain golden crisp. */
function chipPath(c, p) {
  c.beginPath();
  p.edge.forEach(([x, y], k) => (k ? c.lineTo(x * p.s, y * p.s) : c.moveTo(x * p.s, y * p.s)));
  c.closePath();
}

const chipEdge = () =>
  Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2;
    const r = rand(0.85, 1.08);
    return [Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.82];
  });

/** Crisps burst out of a packet, spin, and bounce on the bottom of the screen (kind: "munch" ghosts or "brets" chips). */
export function crisps(origin, { onBounce, kind = "munch" } = {}) {
  const brets = kind === "brets";
  const { x, y } = origin || { x: W / 2, y: H / 2 };
  for (let i = 0; i < count(brets ? 54 : 40); i++) {
    const a = -Math.PI / 2 + rand(-1.05, 1.05);
    const speed = rand(420, 820);
    add({
      x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      g: 1500, drag: 0.998, vr: rand(-9, 9), rot: rand(0, 6),
      life: rand(3.8, 5.2), delay: rand(0, 0.12), fadeIn: 0.02, fadeOut: 0.12,
      s: brets ? rand(7, 11.5) : rand(10, 15), floor: H - rand(14, 70), bounce: rand(0.38, 0.55), bounces: 0, onBounce,
      tone: pickOne(brets ? ["#F6D98A", "#F2CF74", "#EFC766", "#F8E2A0"] : ["#F2A93B", "#EFA032", "#F5B347", "#E8952B"]),
      edge: brets && chipEdge(),
      tick: bounceOnFloor,
      draw(c, p) {
        c.fillStyle = p.tone;
        if (p.edge) {
          chipPath(c, p);
          c.fill();
          // the curve of the crisp: a paler shine on one side
          const shine = c.createRadialGradient(-p.s * 0.35, -p.s * 0.25, 0, -p.s * 0.35, -p.s * 0.25, p.s);
          shine.addColorStop(0, "rgba(255, 248, 215, .7)");
          shine.addColorStop(1, "rgba(255, 248, 215, 0)");
          c.fillStyle = shine;
          c.fill();
          c.strokeStyle = "rgba(196, 150, 60, .7)";
          c.lineWidth = 1;
          c.stroke();
          c.fillStyle = "rgba(170, 120, 40, .5)";
          for (const [dx, dy] of [[-0.4, -0.15], [0.35, 0.25], [0.1, -0.4]]) c.fillRect(dx * p.s, dy * p.s, 1.4, 1.4);
          return;
        }
        ghostPath(c, p.s);
        c.fill("evenodd");
        const glow = c.createRadialGradient(-p.s * 0.2, -p.s * 0.35, 0, -p.s * 0.2, -p.s * 0.35, p.s * 1.1);
        glow.addColorStop(0, "rgba(255, 226, 150, .55)");
        glow.addColorStop(1, "rgba(255, 226, 150, 0)");
        c.fillStyle = glow;
        c.fill("evenodd");
        c.strokeStyle = "rgba(176, 98, 22, .6)";
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = "rgba(190, 104, 24, .5)";
        for (const [dx, dy] of [[-0.5, 0.35], [0.45, -0.5], [0.1, 0.6], [-0.1, -0.6]]) c.fillRect(dx * p.s, dy * p.s, 1.4, 1.4);
      },
    });
  }
  // a few crumbs
  for (let i = 0; i < count(30); i++) {
    const a = -Math.PI / 2 + rand(-1.3, 1.3);
    const speed = rand(150, 500);
    add({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, g: 1300, life: rand(0.8, 1.6),
      r: rand(1, 2.2), color: pickOne(brets ? ["#F2CF74", "#D9A94B", "#F8E2A0"] : ["#F2A93B", "#D9822B", "#F5C56B"]),
      draw(c, p) {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(0, 0, p.r, 0, Math.PI * 2);
        c.fill();
      },
    });
  }
}

const NERDS = ["#FF5FA2", "#A86BFF", "#4FB7FF", "#FFD23F", "#5EDC8F", "#FF8A3D"];

/** Nerds: tiny bumpy candy rocks raining out of a box and bouncing. */
export function nerds(origin) {
  const { x, y } = origin || { x: W / 2, y: H / 2 };
  for (let i = 0; i < count(170); i++) {
    const a = -Math.PI / 2 + rand(-1.2, 1.2);
    const speed = rand(260, 760);
    const shape = Array.from({ length: 6 }, (_, k) => {
      const ang = (k / 6) * Math.PI * 2;
      const r = rand(0.75, 1.15);
      return [Math.cos(ang) * r, Math.sin(ang) * r];
    });
    add({
      x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      g: 1350, drag: 0.997, vr: rand(-10, 10),
      life: rand(3.2, 4.8), delay: rand(0, 0.25), fadeIn: 0.02, fadeOut: 0.14,
      s: rand(2.6, 4.4), floor: H - rand(10, 60), bounce: rand(0.35, 0.55), bounces: 0,
      color: pickOne(NERDS), shape,
      tick: bounceOnFloor,
      draw(c, p) {
        c.fillStyle = p.color;
        c.beginPath();
        p.shape.forEach(([sx, sy], k) => (k ? c.lineTo(sx * p.s, sy * p.s) : c.moveTo(sx * p.s, sy * p.s)));
        c.closePath();
        c.fill();
        c.fillStyle = "rgba(255,255,255,.55)";
        c.fillRect(-p.s * 0.4, -p.s * 0.45, p.s * 0.45, p.s * 0.35);
      },
    });
  }
}

const effects = { bubbles, moons, candies, potatoes, sparkles, wind, rugby, fondue, cheese, chocolate, foam };

export function playEffect(name, origin) {
  goldDust(origin);
  effects[name]?.(origin);
}
