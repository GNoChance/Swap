// The stamps of « Nos aventures »: one SVG per outing in assets/aventures/tampons/, drawn like a rubber-stamp imprint
// (one ink, double border, name, dates, pictogram, irregular ink). Text is turned into paths with the fonts in
// ./fonts (OFL), so a stamp looks the same everywhere. The passport tilts them (`tilt`, mirrored in its data).
// Run: node tools/tampons/generate.mjs   ·   see them all: tools/tampons/apercu.html
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadFont } from "./ttf.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = here("../../assets/aventures/tampons/");
const bebas = loadFont(here("./fonts/BebasNeue-Regular.ttf"));
const courier = loadFont(here("./fonts/CourierPrime-Bold.ttf"));

const num = (v) => String(Math.round(v * 10) / 10);
const C = 200; // the centre of the 400 × 400 canvas

// ── Text ────────────────────────────────────────────────────

/** The glyphs of a text; « → » is drawn here (neither font has it). */
function glyphs(font, text) {
  return [...text].map((ch) => {
    if (ch === "→") return arrowGlyph(font);
    const g = font.glyph(ch);
    if (g.missing && ch !== " ") throw new Error(`« ${ch} » manque dans la police`);
    return g;
  });
}

function arrowGlyph(font) {
  const u = font.unitsPerEm;
  const mid = font.capHeight / 2;
  const pts = [
    [0.08, mid - 0.05 * u],
    [0.5, mid - 0.05 * u],
    [0.5, mid - 0.17 * u],
    [0.78, mid],
    [0.5, mid + 0.17 * u],
    [0.5, mid + 0.05 * u],
    [0.08, mid + 0.05 * u],
  ].map(([x, y]) => [x * u, y]);
  return { advance: 0.86 * u, path: (map) => `M${pts.map((p) => map(p).map(num).join(" ")).join("L")}Z` };
}

const width = (gs, s, spacing) => gs.reduce((w, g) => w + g.advance * s, 0) + spacing * (gs.length - 1);

/** Straight text as a path; y is the baseline. Shrinks to maxWidth if needed. */
function line(text, { font = bebas, size, x = C, y, anchor = "middle", spacing = 0, maxWidth = Infinity }) {
  const gs = glyphs(font, text);
  let s = size / font.unitsPerEm;
  if (width(gs, s, spacing) > maxWidth) s *= maxWidth / width(gs, s, spacing);
  const w = width(gs, s, spacing);
  let at = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  let d = "";
  for (const g of gs) {
    const left = at;
    d += g.path(([gx, gy]) => [left + gx * s, y - gy * s]);
    at += g.advance * s + spacing;
  }
  return `<path d="${d}"/>`;
}

/** Text along a circle: on top it reads clockwise with letters pointing out (r = baseline, the inner edge); at the
 *  bottom it reads left to right with letters pointing in (r = baseline, the outer edge). */
function arc(text, { font = bebas, size, r, side = "top", spacing = 2, maxSpan = 150 }) {
  const gs = glyphs(font, text);
  let s = size / font.unitsPerEm;
  const longest = (maxSpan * Math.PI * r) / 180;
  if (width(gs, s, spacing) > longest) s *= longest / width(gs, s, spacing);
  const span = width(gs, s, spacing) / r;
  let d = "";
  let along = 0;
  for (const g of gs) {
    const half = (g.advance * s) / 2;
    const t = (along + half) / r;
    const theta = side === "top" ? -Math.PI / 2 - span / 2 + t : Math.PI / 2 + span / 2 - t;
    const [cos, sin] = [Math.cos(theta), Math.sin(theta)];
    const [px, py] = [C + r * cos, C + r * sin];
    const [tx, ty] = side === "top" ? [-sin, cos] : [sin, -cos]; // reading direction
    const [ux, uy] = side === "top" ? [cos, sin] : [-cos, -sin]; // up, for the letter
    d += g.path(([gx, gy]) => {
      const [lx, ly] = [gx * s - half, gy * s];
      return [px + lx * tx + ly * ux, py + lx * ty + ly * uy];
    });
    along += g.advance * s + spacing;
  }
  return `<path d="${d}"/>`;
}

const cap = (font, size) => (font.capHeight / font.unitsPerEm) * size;

// ── Shapes and ornaments ────────────────────────────────────

const stroke = (w, extra = "") => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linejoin="round"${extra}`;
const circle = (r, w, extra = "") => `<circle cx="${C}" cy="${C}" r="${r}" ${stroke(w, extra)}/>`;
const dotted = ` stroke-dasharray="0.1 7" stroke-linecap="round"`;

/** A four-pointed sparkle. */
const sparkle = (x, y, r) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z"/>`;
const heart = (x, y, s) => `<path d="M${x} ${y + 3 * s}C${x - 6 * s} ${y - 3 * s} ${x - 3 * s} ${y - 8 * s} ${x} ${y - 4 * s}C${x + 3 * s} ${y - 8 * s} ${x + 6 * s} ${y - 3 * s} ${x} ${y + 3 * s}Z"/>`;

/** A closed polygon as path data. */
const poly = (pts) => `M${pts.map((p) => p.map(num).join(" ")).join("L")}Z`;
const scaled = (pts, k, [cx, cy]) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

/** Edge of a perforated postage stamp: inward half-circle bites along each side. */
function perforated(x0, y0, x1, y1, bite = 7.5, pitch = 26) {
  const edge = ([ax, ay], [bx, by]) => {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.round(len / pitch);
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
    let d = "";
    for (let k = 0; k < n; k++) {
      const c = (len / n) * (k + 0.5);
      d += `L${num(ax + ux * (c - bite))} ${num(ay + uy * (c - bite))}A${bite} ${bite} 0 0 0 ${num(ax + ux * (c + bite))} ${num(ay + uy * (c + bite))}`;
    }
    return `${d}L${bx} ${by}`;
  };
  const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  return `M${x0} ${y0}${corners.map((p, i) => edge(p, corners[(i + 1) % 4])).join("")}Z`;
}

/** A circle with rounded scallops all around. */
function scalloped(r, n) {
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  });
  const bump = num((Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / 2) * 1.05);
  return `M${pts[0].map(num).join(" ")}${pts.map((_, k) => `A${bump} ${bump} 0 0 1 ${pts[(k + 1) % n].map(num).join(" ")}`).join("")}Z`;
}

// ── Pictograms (drawn in a 100 × 100 box) ───────────────────

const S = (w) => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const P = {
  tente: `<path fill-rule="evenodd" d="M12 84L50 18L88 84ZM50 42L38 84H62Z"/><path ${S(4)} d="M50 18V9M50 18L43 10M3 88H97"/>`,
  lune: `<path d="M49.5 6A44 44 0 1 0 92.1 62.8A36 36 0 1 1 49.5 6Z"/>`,
  canoe: `<path d="M3 44C24 54 76 54 97 44L91 57C70 69 30 69 9 57Z"/><path ${S(4.5)} d="M62 6L44 74M56 6H68"/><ellipse cx="42" cy="82" rx="5.5" ry="11" transform="rotate(15 42 82)"/><path ${S(3.5)} d="M4 88q8-5 16 0t16 0M58 88q8-5 16 0t16 0"/>`,
  velo: `<g ${S(4.5)}><circle cx="23" cy="64" r="17"/><circle cx="77" cy="64" r="17"/><path d="M23 64H48L40 38ZM40 38H68L48 64M68 38L77 64M33 34H46M68 38L65 29L74 28"/></g><circle cx="23" cy="64" r="3"/><circle cx="77" cy="64" r="3"/>`,
  train: `<rect x="12" y="44" width="46" height="26" rx="6"/><path fill-rule="evenodd" d="M56 28H88V70H56ZM63 35H81V50H63Z"/><rect x="52" y="23" width="40" height="7" rx="2"/><path d="M20 44V32H30V44ZM15 26H35L31 33H19Z"/><path d="M12 60L3 74H14Z"/><g ${S(4)}><circle cx="26" cy="77" r="7.5"/><circle cx="46" cy="77" r="7.5"/><circle cx="73" cy="75" r="10"/><circle cx="34" cy="17" r="4.5"/><circle cx="44" cy="9" r="5.5"/><path d="M2 89H98"/></g>`,
  cle: `<circle cx="27" cy="50" r="15" ${S(8)}/><path fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="square" d="M43 50H90M77 50V64M88 50V60"/>`,
  hockey: `<g ${S(7)}><path d="M22 6L57 72"/><path d="M78 6L43 72"/></g><g ${S(9)}><path d="M57 72Q61 81 72 81H85"/><path d="M43 72Q39 81 28 81H15"/></g><ellipse cx="50" cy="93" rx="12" ry="5"/>`,
  eiffel: `<path d="M50 0L53 20H47Z"/><path d="M47 20H53L57 40H43Z"/><rect x="40" y="40" width="20" height="5" rx="1"/><path d="M42 45H58L64 60H36Z"/><rect x="32" y="60" width="36" height="5" rx="1"/><path d="M34 65H66L83 98H67Q50 72 33 98H17Z"/>`,
  pyramide: `<path ${S(5)} d="M50 14L92 84H8Z"/><path ${S(2.5)} d="M36 37.3H64M22 60.7H78M36 84L64 37.3M64 84L36 37.3M22 84L57 25.7M78 84L43 25.7M50 84L71 49M50 84L29 49"/><path ${S(3)} d="M2 89H98"/>`,
  avion: `<g transform="rotate(40 50 50)"><path d="M50 4C54 4 56 11 56 19V39L95 58V66L56 56V77L69 86V92L50 87L31 92V86L44 77V56L5 66V58L44 39V19C44 11 46 4 50 4Z"/></g><path ${S(3)} stroke-dasharray="5 6" d="M4 97Q10 80 24 74"/>`,
  yak: `<path d="M32 40C15 41 7 27 13 13C18 25 26 30 37 31Z"/><path d="M68 40C85 41 93 27 87 13C82 25 74 30 63 31Z"/><path fill-rule="evenodd" d="M34 29C41 22 59 22 66 29C73 38 71 55 65 65L61 80Q50 89 39 80L35 65C29 55 27 38 34 29ZM45.5 47A3.5 3.5 0 1 0 38.5 47A3.5 3.5 0 1 0 45.5 47ZM61.5 47A3.5 3.5 0 1 0 54.5 47A3.5 3.5 0 1 0 61.5 47ZM58 73A8 5.5 0 1 0 42 73A8 5.5 0 1 0 58 73Z"/><path d="M34 50L24 57L35 60L27 69L38 69ZM66 50L76 57L65 60L73 69L62 69Z"/><circle cx="46.5" cy="73" r="1.7"/><circle cx="53.5" cy="73" r="1.7"/>`,
  parasol: `<path d="M8 46A42 42 0 0 1 92 46Q81.5 38 71 46Q60.5 38 50 46Q39.5 38 29 46Q18.5 38 8 46Z"/><circle cx="50" cy="3" r="3"/><path ${S(4)} d="M50 44L58 90M4 93Q30 86 50 90T96 88"/>`,
  soleil: `<circle cx="50" cy="50" r="20"/><path ${S(7)} d="M50 8V20M50 80V92M8 50H20M80 50H92M20 20L28 28M72 72L80 80M80 20L72 28M28 72L20 80"/>`,
  kangoo: `<path fill-rule="evenodd" d="M6 72V50Q6 42 14 40L26 38L36 24Q38 20 44 20H88Q94 20 94 26V72H86A12 12 0 0 0 62 72H40A12 12 0 0 0 16 72ZM38 26L30 37H50V26ZM54 26H70V37H54ZM74 26H90V37H74ZM8 47H15V53H8Z"/><path fill-rule="evenodd" d="M37 72A9 9 0 1 0 19 72A9 9 0 1 0 37 72ZM31 72A3 3 0 1 0 25 72A3 3 0 1 0 31 72ZM83 72A9 9 0 1 0 65 72A9 9 0 1 0 83 72ZM77 72A3 3 0 1 0 71 72A3 3 0 1 0 77 72Z"/><path ${S(3.5)} d="M46 13H88M52 13V20M82 13V20M2 88H98"/>`,
  piment: `<path fill-rule="evenodd" d="M38 30C26 46 28 72 82 93C66 78 56 58 58 32C52 26 44 26 38 30ZM43 40C39 52 43 64 57 74C47 62 45 52 47 40Z"/><path d="M33 33C37 22 54 22 63 33C56 28 50 30 48 35C46 30 40 28 33 33Z"/><path ${S(4.5)} d="M48 25C48 15 55 9 65 7"/>`,
};
const picto = (name, cx, cy, size) => `<g transform="translate(${num(cx - size / 2)} ${num(cy - size / 2)}) scale(${num(size / 100)})">${P[name]}</g>`;

// ── Layouts ─────────────────────────────────────────────────

/** Round stamp: double ring, a name over the top, the dates under the bottom, sparkles between them. */
function round({ top, bottom, body, scallop = false }) {
  const size = scallop ? 29 : 32;
  const border = scallop ? `<path d="${scalloped(176, 30)}" ${stroke(8)}/>` : circle(182, 9);
  const [inner, band] = scallop ? [136, 170] : [146, 176]; // the text sits between the inner ring and the border
  const gap = (band - inner - cap(bebas, size)) / 2;
  return [
    border,
    circle(inner, 3.5),
    circle(inner - 8, 2, dotted),
    arc(top, { size, r: inner + gap, side: "top", spacing: 2.5 }),
    arc(bottom, { size, r: band - gap, side: "bottom", spacing: 2.5 }),
    sparkle(C - (inner + band) / 2, C, 7),
    sparkle(C + (inner + band) / 2, C, 7),
    body,
  ].join("");
}

const oval = (body) => `<ellipse cx="${C}" cy="${C}" rx="188" ry="128" ${stroke(9)}/><ellipse cx="${C}" cy="${C}" rx="175" ry="115" ${stroke(3)}/>${body}`;
const date = (text, y, size = 28, extra = {}) => line(text, { font: courier, size, y, ...extra });
/** A short word in small capitals (Bebas stays legible once the stamp is phone-sized; Courier would not). */
const small = (text, y, size = 28, extra = {}) => line(text, { size, y, spacing: 2.5, ...extra });

// ── The stamps (in the order of the outings) ────────────────

const STAMPS = [
  {
    id: "bivouac-1",
    name: "Premier bivouac",
    ink: "#2E5E3E",
    tilt: -8,
    body: round({
      top: "PREMIER BIVOUAC",
      bottom: "17–18.05.2025",
      body: picto("tente", C, 206, 140) + picto("lune", 136, 126, 40) + sparkle(270, 128, 9) + sparkle(244, 104, 5),
    }),
  },
  {
    id: "canoe",
    name: "Premier canoë · Dordogne",
    ink: "#1E6E9E",
    tilt: 6,
    body: oval(
      line("PREMIER CANOË", { size: 44, y: 146, maxWidth: 212, spacing: 1.5 }) +
        picto("canoe", C, 200, 100) +
        small("DORDOGNE", 274, 32) +
        date("11.08.2025", 302, 24),
    ),
  },
  {
    id: "ile-de-re",
    name: "Île de Ré",
    ink: "#1B4F8A",
    tilt: -4,
    body:
      `<rect x="18" y="70" width="364" height="260" rx="18" ${stroke(9)}/><rect x="31" y="83" width="338" height="234" rx="10" ${stroke(3)}/>` +
      line("ÎLE DE RÉ", { size: 66, y: 158, spacing: 3 }) +
      picto("velo", C, 220, 104) +
      date("17–18.08.2025", 300),
  },
  {
    id: "marqueze",
    name: "Marquèze",
    ink: "#7B4A24",
    tilt: 9,
    body:
      `<path d="M36 86H364A20 20 0 0 0 384 106V294A20 20 0 0 0 364 314H36A20 20 0 0 0 16 294V106A20 20 0 0 0 36 86Z" ${stroke(9)}/>` +
      `<rect x="32" y="102" width="336" height="196" rx="4" ${stroke(2.5, ' stroke-dasharray="7 6"')}/>` +
      `<path ${stroke(3, ' stroke-dasharray="2 7" stroke-linecap="round"')} d="M298 104V296"/>` +
      small("ÉCOMUSÉE DE", 136, 26, { x: 165 }) +
      line("MARQUÈZE", { size: 58, y: 186, x: 165, spacing: 2 }) +
      picto("train", 165, 230, 72) +
      date("22.08.2025", 290, 26, { x: 165 }) +
      `<g transform="rotate(-90 336 200)">${line("ALLER · RETOUR", { size: 30, x: 336, y: 211, spacing: 2 })}</g>`,
  },
  {
    id: "airbnb",
    name: "Premier Airbnb",
    ink: "#D2553F",
    tilt: -6,
    body: (() => {
      const house = [[200, 26], [372, 152], [372, 370], [28, 370], [28, 152]];
      return (
        `<path d="${poly(house)}" ${stroke(9)}/><path d="${poly(scaled(house, 0.9, [200, 236]))}" ${stroke(3)}/>` +
        picto("cle", C, 122, 76) +
        line("PREMIER", { size: 40, y: 212, spacing: 4 }) +
        line("AIRBNB", { size: 78, y: 284, spacing: 3 }) +
        date("21.09.2025", 334)
      );
    })(),
  },
  {
    id: "boxers",
    name: "Boxers de Bordeaux",
    ink: "#2F7FB5",
    tilt: 7,
    body: round({
      top: "BOXERS DE BORDEAUX",
      bottom: "03.10.2025",
      body: picto("hockey", C, 184, 120) + small("HOCKEY SUR GLACE", 292),
    }),
  },
  {
    id: "paris-1",
    name: "Paris",
    ink: "#1F2C5C",
    tilt: -3,
    body:
      `<path d="${perforated(68, 26, 332, 374)}" ${stroke(6)}/><rect x="88" y="46" width="224" height="308" ${stroke(3)}/>` +
      line("PARIS", { size: 72, y: 122, spacing: 6 }) +
      picto("eiffel", C, 228, 150) +
      date("11.11.2025", 336),
  },
  {
    id: "paris-2",
    name: "Paris, le retour",
    ink: "#B42A24",
    tilt: 5,
    body:
      `<path d="${perforated(68, 26, 332, 374)}" ${stroke(6)}/><rect x="88" y="46" width="224" height="308" ${stroke(3)}/>` +
      line("PARIS", { size: 64, y: 112, spacing: 6 }) +
      line("LE RETOUR", { size: 30, y: 146, spacing: 4 }) +
      picto("pyramide", C, 222, 112) +
      small("2E VISITE", 306, 26) +
      date("09.12.2025", 338, 26),
  },
  {
    id: "sardaigne",
    name: "Sardaigne",
    ink: "#0F8C8A",
    tilt: -9,
    body: round({
      top: "SARDAIGNE",
      bottom: "29.12.25 – 05.01.26",
      body: picto("avion", C, 180, 124) + line("ARRIVÉE", { size: 36, y: 296, spacing: 4 }),
    }),
  },
  {
    id: "dordogne-1-an",
    name: "Nos 1 an en Dordogne",
    ink: "#7A1F35",
    tilt: 4,
    body: (() => {
      const shape = "M200 354C120 298 28 238 28 150C28 92 72 50 126 50C160 50 186 68 200 96C214 68 240 50 274 50C328 50 372 92 372 150C372 238 280 298 200 354Z";
      return (
        `<path d="${shape}" ${stroke(9)}/><path d="${shape}" transform="translate(200 196) scale(0.86) translate(-200 -196)" ${stroke(3)}/>` +
        line("NOS", { size: 30, y: 136, spacing: 5 }) +
        line("1 AN", { size: 92, y: 212, spacing: 4 }) +
        small("DORDOGNE", 246, 28) +
        small("17–19.04.2026", 274, 24, { spacing: 1.5 }) +
        heart(112, 128, 2.2) +
        heart(288, 128, 2.2)
      );
    })(),
  },
  {
    id: "bivouac-2",
    name: "Deuxième bivouac",
    ink: "#4A7A2E",
    tilt: 8,
    body: round({
      top: "DEUXIÈME BIVOUAC",
      bottom: "04–05.07.2026",
      body: picto("tente", 158, 192, 104) + picto("yak", 252, 186, 82) + small("AVEC NINI", 292, 30),
    }),
  },
  {
    id: "royan-1",
    name: "Royan",
    ink: "#2A66A8",
    tilt: -5,
    body: oval(line("ROYAN", { size: 64, y: 150, spacing: 6 }) + picto("parasol", 190, 214, 92) + picto("soleil", 262, 180, 34) + date("12.07.2026", 298, 26)),
  },
  {
    id: "royan-2",
    name: "Royan, la bande",
    ink: "#D97A1E",
    tilt: 6,
    body: oval(
      line("ROYAN", { size: 56, y: 136, spacing: 6 }) +
        line("LA BANDE", { size: 28, y: 166, spacing: 4 }) +
        picto("parasol", 176, 226, 82) +
        line("×8", { size: 46, y: 248, x: 248 }) +
        date("01.08.2026", 300, 24),
    ),
  },
  {
    id: "roadtrip",
    name: "Roadtrip catalan",
    ink: "#C8102E",
    tilt: -7,
    body: (() => {
      // the senyera, a small flag before the route: 9 stripes, yellow and red
      const flag = Array.from({ length: 9 }, (_, i) => `<rect x="44" y="${num(260 + i * 3.4)}" width="46" height="3.4" fill="${i % 2 ? "currentColor" : "#E5A800"}"/>`).join("");
      return (
        `<rect x="14" y="64" width="372" height="272" rx="28" ${stroke(9)}/><rect x="28" y="78" width="344" height="244" rx="18" ${stroke(3)}/>` +
        line("ROADTRIP CATALAN", { size: 46, y: 132, spacing: 2, maxWidth: 312 }) +
        picto("kangoo", C, 196, 104) +
        flag +
        line("BORDEAUX → BARCELONE", { size: 30, y: 288, x: 100, anchor: "start", spacing: 1.5, maxWidth: 256 }) +
        date("10–14.08.2026", 312, 24)
      );
    })(),
  },
  {
    id: "espelette",
    name: "Fête du piment · Espelette",
    ink: "#C0151F",
    tilt: 5,
    body: round({
      top: "FÊTE DU PIMENT",
      bottom: "ESPELETTE · 23–25.10.2026",
      scallop: true,
      body: picto("piment", C, 198, 150) + sparkle(130, 140, 8) + sparkle(272, 250, 7) + sparkle(150, 262, 5),
    }),
  },
];

// ── Ink and files ───────────────────────────────────────────

/** Rubber-stamp ink: speckled holes, uneven density, slightly ragged edges. Seeded per stamp. */
const ink = (seed) => `<filter id="encre" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${seed}" result="grain"/>
<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -10 0 0 0 7" result="trous"/>
<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="${seed + 7}" result="nappe"/>
<feColorMatrix in="nappe" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 0 0 0 2.5" result="densite"/>
<feComposite in="trous" in2="densite" operator="in" result="masque"/>
<feComposite in="SourceGraphic" in2="masque" operator="in" result="encre"/>
<feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="1" seed="${seed + 13}" result="bord"/>
<feDisplacementMap in="encre" in2="bord" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

mkdirSync(OUT, { recursive: true });
STAMPS.forEach((stamp, i) => {
  const file = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" color="${stamp.ink}" fill="currentColor">
<title>${stamp.name}</title>
<defs>${ink(11 + i * 17)}</defs>
<g filter="url(#encre)">${stamp.body}</g>
</svg>
`;
  writeFileSync(`${OUT}${stamp.id}.svg`, file);
});
writeFileSync(
  `${OUT}tampons.json`,
  `${JSON.stringify(STAMPS.map(({ id, name, ink: color, tilt }) => ({ id, name, ink: color, tilt })), null, 2)}\n`,
);
// a contact sheet on passport paper, tilted as in the passport (open it straight from the folder)
const cards = STAMPS.map((s) => `<figure><img src="../../assets/aventures/tampons/${s.id}.svg" alt="" style="transform: rotate(${s.tilt}deg)"><figcaption>${s.name}</figcaption></figure>`);
writeFileSync(
  here("./apercu.html"),
  `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<title>Tampons · aperçu</title>
<style>
  body { margin: 0; padding: 32px; background: #F3EBDD; font: 14px/1.4 system-ui, sans-serif; color: #2B1A1E; }
  h1 { font: 600 22px Georgia, serif; margin: 0 0 24px; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px 20px; }
  figure { margin: 0; text-align: center; }
  img { width: 100%; max-width: 280px; aspect-ratio: 1; }
  figcaption { margin-top: 4px; opacity: 0.7; }
</style>
<h1>Nos aventures · les ${STAMPS.length} tampons</h1>
<main>
${cards.join("\n")}
</main>
</html>
`,
);
console.log(`${STAMPS.length} tampons → ${OUT}`);
