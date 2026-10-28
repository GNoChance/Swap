// Every texture of the 3D gallery, drawn in a canvas: no image to download but the club logos.
// The paintings and cartels use the site's fonts, so loadFonts() runs first.
import { cartelText, museumDate } from "../logic.js";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const INK = "#2b1a1e";

/** Where things are on a painting's canvas (the end-to-end test samples the medallions). */
export const PAINTING = {
  width: 1024,
  height: 768,
  medals: [
    { x: 307, y: 461, r: 113 },
    { x: 717, y: 461, r: 113 },
  ],
};

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function loadFonts() {
  return Promise.all(
    [`italic 500 40px ${SERIF}`, `600 40px ${SERIF}`, `400 40px ${SANS}`, `600 40px ${SANS}`].map((font) => document.fonts.load(font)),
  ).then(() => {});
}

const images = new Map();
/** A logo, or null if it doesn't load: the medallion then stays white. */
function loadImage(src) {
  if (!images.has(src)) {
    const img = new Image();
    img.src = src;
    images.set(
      src,
      img.decode().then(
        () => img,
        () => null,
      ),
    );
  }
  return images.get(src);
}

/** The font size that fits `text` in maxWidth, from `size` down. */
function fit(g, text, font, size, maxWidth) {
  let s = size;
  do g.font = font.replace("{s}", `${s}px`);
  while (g.measureText(text).width > maxWidth && --s > 12);
  return s;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** A match painting, 1024 × 768: mat, two fields of colour (UBB, the opponent), the date, the two logos. */
export async function paintingCanvas(match, { clubs, labels, upcoming }) {
  const { width: W, height: H, medals } = PAINTING;
  const c = canvas(W, H);
  const g = c.getContext("2d");
  const club = clubs[match.opponent];
  // the mat, then the canvas inside it
  g.fillStyle = "#fbf9f5";
  g.fillRect(0, 0, W, H);
  const inner = { x: 61, y: 46, w: 902, h: 676 };
  g.fillStyle = "#f1ece3";
  g.fillRect(inner.x, inner.y, inner.w, inner.h);

  const fx = inner.x + inner.w * 0.07;
  const fw = inner.w * 0.86;
  for (const [color, top, darken] of [
    [clubs.ubb.color, inner.y + inner.h * 0.07, true],
    [club.color, inner.y + inner.h * 0.53, false],
  ]) {
    const grad = g.createLinearGradient(0, top, 0, top + inner.h * 0.4);
    grad.addColorStop(0, darken ? color : `color-mix(in srgb, ${color} 88%, #fff)`);
    grad.addColorStop(1, darken ? `color-mix(in srgb, ${color} 82%, #000)` : color);
    g.fillStyle = grad;
    roundRect(g, fx, top, fw, inner.h * 0.4, 6);
    g.fill();
  }

  // the date on a cream band
  g.textAlign = "center";
  g.textBaseline = "middle";
  const date = museumDate(match.date);
  fit(g, date, `italic 500 {s} ${SERIF}`, 56, fw - 80);
  const tw = g.measureText(date).width + 40;
  g.fillStyle = "rgba(251, 249, 245, 0.92)";
  g.fillRect(W / 2 - tw / 2, 276 - 34, tw, 68);
  g.fillStyle = INK;
  g.fillText(date, W / 2, 278);

  // the two medallions and their logos
  const logos = await Promise.all([clubs.ubb, club].map((cl) => loadImage(`assets/logos/${cl.logo}`)));
  medals.forEach(({ x, y, r }, k) => {
    g.save();
    g.shadowColor = "rgba(0, 0, 0, 0.35)";
    g.shadowBlur = 24;
    g.shadowOffsetY = 10;
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const img = logos[k];
    if (!img) return;
    const box = r * 2 * 0.74;
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const w = ratio >= 1 ? box : box * ratio;
    const h = ratio >= 1 ? box / ratio : box;
    g.drawImage(img, x - w / 2, y - h / 2, w, h);
  });
  g.font = `400 72px ${SERIF}`;
  g.fillStyle = "#fbf9f5";
  g.fillText("×", W / 2, medals[0].y);

  if (upcoming) veil(g, inner, labels[upcoming]);
  return c;
}

/** A match still to come: a pleated linen sheet over the canvas, with its tag. */
function veil(g, inner, tag) {
  const grad = g.createLinearGradient(0, inner.y, 0, inner.y + inner.h);
  grad.addColorStop(0, "#e4ddd2");
  grad.addColorStop(1, "#cfc6b8");
  g.fillStyle = grad;
  g.fillRect(inner.x, inner.y, inner.w, inner.h);
  g.save();
  g.beginPath();
  g.rect(inner.x, inner.y, inner.w, inner.h);
  g.clip();
  // vertical pleats of uneven widths, like a sheet hanging from the frame
  for (let x = inner.x, k = 0; x < inner.x + inner.w; k++) {
    const w = 46 + ((k * 37) % 5) * 9;
    const fold = g.createLinearGradient(x, 0, x + w, 0);
    fold.addColorStop(0, "rgba(255, 255, 255, 0)");
    fold.addColorStop(0.35, "rgba(255, 255, 255, 0.42)");
    fold.addColorStop(0.72, "rgba(0, 0, 0, 0.08)");
    fold.addColorStop(1, "rgba(255, 255, 255, 0)");
    g.fillStyle = fold;
    g.fillRect(x, inner.y, w, inner.h);
    x += w;
  }
  const hem = g.createLinearGradient(0, inner.y + inner.h * 0.75, 0, inner.y + inner.h);
  hem.addColorStop(0, "rgba(0, 0, 0, 0)");
  hem.addColorStop(1, "rgba(0, 0, 0, 0.1)");
  g.fillStyle = hem;
  g.fillRect(inner.x, inner.y, inner.w, inner.h);
  g.restore();
  g.font = `italic 500 60px ${SERIF}`;
  const w = g.measureText(tag).width + 70;
  const cx = inner.x + inner.w / 2;
  const cy = inner.y + inner.h / 2;
  g.fillStyle = "#fbf9f5";
  g.fillRect(cx - w / 2, cy - 48, w, 96);
  g.strokeStyle = "rgba(43, 26, 30, 0.25)";
  g.lineWidth = 2;
  g.strokeRect(cx - w / 2, cy - 48, w, 96);
  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(tag, cx, cy + 2);
}

/** A cartel, 1024 × 512: the white card under each painting. Big type: on a phone it is read from across the room. */
export function cartelCanvas(match, ctx) {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext("2d");
  const text = cartelText(match, ctx);
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, H);
  const pad = 46;
  const max = W - pad * 2;
  // the seat on two lines: the stand, then the row and the two seats
  const cut = text.seat.indexOf(` · ${ctx.labels.row} `);
  const seat = cut > 0 ? [text.seat.slice(0, cut), text.seat.slice(cut + 3)] : [text.seat];
  const body = { font: `400 {s} ${SANS}`, size: 38, color: "rgba(43, 26, 30, 0.78)" };
  const rows = [
    { text: text.title, font: `600 {s} ${SERIF}`, size: 78, color: match.final ? "#8e6e3c" : INK, gap: 10 },
    text.teams && { text: text.teams, font: `600 {s} ${SANS}`, size: 38, color: INK },
    ...text.lines.map((line) => ({ ...body, text: line })),
    text.note && { ...body, text: text.note, font: `italic 600 {s} ${SANS}`, size: 34 },
    ...seat.map((line, k) => ({ text: line, font: `600 {s} ${SANS}`, size: 38, color: "#7a1733", rule: k === 0 })),
  ].filter(Boolean);
  // fewer rows: a little more air between them, the block stays centred
  const lead = rows.length > 6 ? 1.2 : 1.3;
  const heights = rows.map((r) => r.size * lead + (r.gap || 0) + (r.rule ? 22 : 0));
  let y = (H - heights.reduce((a, b) => a + b, 0)) / 2;
  g.textBaseline = "top";
  g.textAlign = "left";
  rows.forEach((r, k) => {
    if (r.rule) {
      g.fillStyle = "rgba(43, 26, 30, 0.12)";
      g.fillRect(pad, y + 6, max, 2);
      y += 22;
    }
    fit(g, r.text, r.font, r.size, max);
    g.fillStyle = r.color;
    g.fillText(r.text, pad, y);
    y += heights[k] - (r.rule ? 22 : 0);
  });
  return c;
}

// ── Materials ──

/** Light oak in herringbone (point de Hongrie), 1024 × 1024, seamless. Planks 4:1, drawn axis-aligned:
 *  the room rotates the texture by 45°. Each chain of planks staircases down-right; chains repeat every 2n planks. */
export function parquetCanvas() {
  const S = 1024;
  const u = 32; // plank width
  const n = 4; // plank length / width
  const period = 2 * n * u; // 256: divides 1024, so the pattern wraps seamlessly
  const c = canvas(S, S);
  const g = c.getContext("2d");
  g.fillStyle = "#d9c09a";
  g.fillRect(0, 0, S, S);
  const hash = (x, y) => {
    const v = Math.sin((((x % S) + S) % S) * 12.9898 + (((y % S) + S) % S) * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const plank = (x, y, w, h) => {
    const r = hash(x, y);
    g.fillStyle = `hsl(${33 + r * 6}, ${40 + r * 10}%, ${70 + (r - 0.5) * 9}%)`;
    g.fillRect(x, y, w, h);
    // grain along the plank
    g.strokeStyle = `rgba(120, 82, 44, ${0.08 + r * 0.07})`;
    g.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      g.beginPath();
      if (w > h) {
        const gy = y + (h * k) / 4 + (hash(x + k, y) - 0.5) * 4;
        g.moveTo(x + 4, gy);
        g.bezierCurveTo(x + w * 0.3, gy + 3, x + w * 0.7, gy - 3, x + w - 4, gy);
      } else {
        const gx = x + (w * k) / 4 + (hash(x, y + k) - 0.5) * 4;
        g.moveTo(gx, y + 4);
        g.bezierCurveTo(gx + 3, y + h * 0.3, gx - 3, y + h * 0.7, gx, y + h - 4);
      }
      g.stroke();
    }
    g.strokeStyle = "rgba(92, 60, 30, 0.32)";
    g.lineWidth = 1.5;
    g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  };
  // chain j starts at x = 2n·j·u on row 0 and drifts right as it goes down: start far enough left to fill the bottom-left
  for (let j = -(S / period) - 2; j <= S / period + 1; j++) {
    for (let k = -2 * n; k <= S / u + n; k++) {
      const x = (k + 2 * n * j) * u;
      const y = k * u;
      plank(x, y, n * u, u); // horizontal
      plank(x + n * u, y - (n - 1) * u, u, n * u); // vertical
    }
  }
  // the wax: a soft sheen
  const sheen = g.createLinearGradient(0, 0, S, S);
  sheen.addColorStop(0, "rgba(255, 250, 240, 0.08)");
  sheen.addColorStop(0.5, "rgba(255, 250, 240, 0)");
  sheen.addColorStop(1, "rgba(255, 250, 240, 0.08)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, S, S);
  return c;
}

/** White plaster, 512 × 512, seamless: a very soft grain. */
export function plasterCanvas() {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  const img = g.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = 244 + Math.round((Math.random() - 0.5) * 7);
    img.data[i * 4] = v + 2;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v - 4;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** A spot's pool of warm light on the wall, 256 × 256, transparent around it. */
export function haloCanvas() {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  g.translate(S / 2, S * 0.42);
  g.scale(1, 1.25);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.42);
  grad.addColorStop(0, "rgba(255, 236, 200, 0.75)");
  grad.addColorStop(0.55, "rgba(255, 236, 200, 0.28)");
  grad.addColorStop(1, "rgba(255, 236, 200, 0)");
  g.fillStyle = grad;
  g.fillRect(-S, -S, S * 2, S * 2);
  return c;
}

/** A soft round shadow under each visitor, 128 × 128. */
export function shadowCanvas() {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, "rgba(43, 26, 30, 0.42)");
  grad.addColorStop(1, "rgba(43, 26, 30, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

/** Lines of text on a transparent 2048 × 1024 canvas (the entrance's title, the end wall). */
export function wallTextCanvas(lines) {
  const W = 2048;
  const H = 1024;
  const c = canvas(W, H);
  const g = c.getContext("2d");
  g.textAlign = "center";
  g.textBaseline = "middle";
  const sizes = lines.map((l) => Number(/(\d+)px/.exec(l.font)?.[1] || 64));
  const total = sizes.reduce((a, s) => a + s * 1.25, 0);
  let y = (H - total) / 2;
  lines.forEach((l, k) => {
    fit(g, l.text, l.font.replace(/\d+px/, "{s}"), sizes[k], W - 160);
    g.fillStyle = l.color;
    g.fillText(l.text, W / 2, y + (sizes[k] * 1.25) / 2);
    y += sizes[k] * 1.25;
  });
  return c;
}
