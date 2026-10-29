// The passport's drawings, as SVG markup (docs/design/passeport/maquette.html): the gold foil, the emblem (a globe in
// the laurel, the hub's sun above, a heart where the branches meet), the cover's stitching, the seals, the small icons.
// `p` prefixes every id, so two passports never share one.

const r1 = (v) => +v.toFixed(1);
const r2 = (v) => +v.toFixed(2);
/** The point of a circle around (100, 100), `deg` clockwise from 3 o'clock. */
const at = (deg, radius) => [100 + radius * Math.cos((deg * Math.PI) / 180), 100 + radius * Math.sin((deg * Math.PI) / 180)];
const MIRROR = "matrix(-1 0 0 1 200 0)";

// the laurel: its stem, an arc of radius 60 every 4°, with a pair of leaves every 12° and one at the tip
const STEM = `M${Array.from({ length: 30 }, (_, i) => at(100 + 4 * i, 60).map(r1).join(" ")).join("L")}`;
const LEAF = "M0 0C3.3-3.5 8.8-3.9 13.4 0C8.8 3.9 3.3 3.5 0 0Z";
const leaf = ([x, y], turn) => `<path d='${LEAF}' transform='translate(${x} ${y}) rotate(${turn})'/>`;
const LEAVES =
  Array.from({ length: 9 }, (_, k) => {
    const deg = 108 + 12 * k;
    const spot = at(deg, 60).map(r1);
    return leaf(spot, deg - 312) + leaf(spot, deg - 228);
  }).join("") + leaf(at(216, 60).map(r1), -54);
const SUN_RAYS = "M100 18.5L100 13M107.4 21.6L111.3 17.7M110.5 29L116 29M107.4 36.4L111.3 40.3M100 39.5L100 45M92.6 36.4L88.7 40.3M89.5 29L84 29M92.6 21.6L88.7 17.7";
const HEART = "M100 173C92 166 87.4 161.4 87.4 157C87.4 153.5 90.1 151.2 93.2 151.2C96 151.2 98.6 153 100 155.6C101.4 153 104 151.2 106.8 151.2C109.9 151.2 112.6 153.5 112.6 157C112.6 161.4 108 166 100 173Z";
// the dry seal's ring: two circles and 90 graduations
const TICKS = Array.from({ length: 90 }, (_, i) => `M${at(4 * i, 84.6).map(r2).join(" ")}L${at(4 * i, 88.2).map(r2).join(" ")}`).join("");

/** The emblem, painted by --p (a colour or the foil); bold: the strokes ×1.4. */
function emblem(id, k) {
  const w = (v) => r2(v * k);
  return `<symbol id="${id}" viewBox="0 0 200 200" overflow="visible"><g fill='none' style='stroke:var(--p)' stroke-linecap='round' stroke-linejoin='round'>
    <circle cx='100' cy='100' r='36' stroke-width='${w(3.2)}'/>
    <ellipse cx='100' cy='100' rx='12.5' ry='36' stroke-width='${w(1.9)}'/><ellipse cx='100' cy='100' rx='25' ry='36' stroke-width='${w(1.9)}'/>
    <path d='M100 64V136M64 100H136M68.8 82H131.2M68.8 118H131.2' stroke-width='${w(1.9)}'/>
    <path d='${STEM}' stroke-width='${w(2.1)}'/><path d='${STEM}' stroke-width='${w(2.1)}' transform='${MIRROR}'/>
    <path d='${SUN_RAYS}' stroke-width='${w(2.3)}'/></g>
    <g style='fill:var(--p)'>${LEAVES}<g transform='${MIRROR}'>${LEAVES}</g><circle cx='100' cy='29' r='6.4'/><path d='${HEART}'/></g></symbol>`;
}

/** Hidden: the gradients and symbols the other drawings use. */
export const defs = (p) => `<svg class="pp-defs" aria-hidden="true" width="0" height="0"><defs>
  <linearGradient id="${p}-foil" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8E6E3C"/><stop offset=".22" stop-color="#D9BF8C"/><stop offset=".4" stop-color="#FFF3CF"/>
    <stop offset=".52" stop-color="#C9A86A"/><stop offset=".72" stop-color="#8E6E3C"/><stop offset=".88" stop-color="#E2C891"/><stop offset="1" stop-color="#A3824A"/>
  </linearGradient>
  <linearGradient id="${p}-thread" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8935A"/><stop offset=".5" stop-color="#F0DBA6"/><stop offset="1" stop-color="#B8935A"/></linearGradient>
  ${emblem(`${p}-emb`, 1)}
  ${emblem(`${p}-emb-bold`, 1.4)}
  <symbol id="${p}-ring" viewBox="0 0 200 200" overflow="visible"><circle cx='100' cy='100' r='91'/><circle cx='100' cy='100' r='83.4'/><path d='${TICKS}'/></symbol>
</defs></svg>`;

const use = (p, id, style, extra = "") => `<use href="#${p}-${id}" width="200" height="200" style="${style}"${extra}/>`;

/** The cover's gold stitching: shadow, thread, highlight. */
export const stitch = (p) => {
  const rect = (attrs) => `<rect x="44" y="44" width="912" height="1332" rx="44" fill="none" ${attrs}/>`;
  return `<svg class="cv-stitch" viewBox="0 0 1000 1420" preserveAspectRatio="none" aria-hidden="true">
    ${rect(`stroke="rgba(18,0,6,.55)" stroke-width="9" stroke-dasharray="21 13" transform="translate(2.5 3.5)"`)}
    ${rect(`stroke="url(#${p}-thread)" stroke-width="5.6" stroke-dasharray="21 13" stroke-linecap="round"`)}
    ${rect(`stroke="rgba(255,246,220,.55)" stroke-width="1.6" stroke-dasharray="15 19" stroke-dashoffset="-3" transform="translate(-.8 -1)"`)}
  </svg>`;
};

/** The cover's emblem: the seal embossed (a dark and a light copy), the emblem hot-foiled. */
export const coverEmblem = (p) => `<svg class="cv-emblem" viewBox="0 0 200 200" aria-hidden="true">
  <g fill="none" stroke-width="1.15">
    <use href="#${p}-ring" width="200" height="200" transform="translate(-.5 1)" stroke="rgba(18,0,6,.6)"/>
    <use href="#${p}-ring" width="200" height="200" transform="translate(.45 -.55)" stroke="rgba(255,196,186,.16)"/>
  </g>
  ${use(p, "emb", "--p:rgba(18,0,6,.62)", ` transform="translate(0 -.9)"`)}${use(p, "emb", "--p:rgba(255,214,170,.2)", ` transform="translate(0 .9)"`)}${use(p, "emb", `--p:url(#${p}-foil)`)}
</svg>`;

export const chip = (p) => {
  const parts = `<rect x="1.5" y="1.5" width="29" height="17" rx="2.4"/><circle cx="16" cy="10" r="4.3"/><path d="M1.5 10H11.7M20.3 10H30.5"/>`;
  return `<svg class="cv-chip" viewBox="0 0 32 20" aria-hidden="true"><g fill="none" stroke-width="1.7">
    <g transform="translate(0 -.5)" stroke="rgba(18,0,6,.6)">${parts}</g><g stroke="url(#${p}-foil)">${parts}</g></g></svg>`;
};

export const idEmblem = (p) => `<svg class="id-emblem" viewBox="0 0 200 200" aria-hidden="true">${use(p, "emb-bold", `--p:url(#${p}-foil)`)}</svg>`;

/** The white dry seal over the photos' corner. */
export const idSeal = (p) => {
  const ring = `<circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="80"/>`;
  const text = `<textPath href="#${p}-sealpath">CYCY ET KEVIN · NOS AVENTURES ·</textPath>`;
  return `<svg class="id-seal" viewBox="0 0 200 200" aria-hidden="true">
  <defs><path id="${p}-sealpath" d="M100 100m-70 0a70 70 0 1 1 140 0a70 70 0 1 1 -140 0"/></defs>
  <g fill="none" stroke-width="2.2"><g transform="translate(1.6 1.8)" stroke="rgba(90,58,36,.30)">${ring}</g><g stroke="rgba(255,255,255,.9)">${ring}</g></g>
  <g font-family="Inter, Arial, sans-serif" font-weight="800" font-size="15.5" letter-spacing="2.2">
    <text transform="translate(1.4 1.6)" fill="rgba(90,58,36,.28)">${text}</text><text fill="rgba(255,255,255,.92)">${text}</text>
  </g>
  <g transform="translate(46 46) scale(.54)">${use(p, "emb-bold", "--p:rgba(90,58,36,.26)", ` transform="translate(2.6 3)"`)}${use(p, "emb-bold", "--p:rgba(255,255,255,.9)")}</g></svg>`;
};

export const heart = `<svg class="id-heart" viewBox="62.6 83.4 9.8 9" aria-hidden="true"><path d="M67.6 85.4c-1.2-2.3-4.6-1.7-4.3 1 .25 2.2 3 3.6 4.5 5.1 1.3-1.7 3.8-3.3 3.8-5.4.1-2.5-3.3-2.8-4-.7" fill="none" stroke="rgba(122,31,53,.78)" stroke-width=".62" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const lock = `<svg class="slot-lock" viewBox="0 0 24 30" aria-hidden="true">
  <path d="M6.5 13V9.2C6.5 5.6 8.9 3 12 3s5.5 2.6 5.5 6.2V13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  <rect x="2.5" y="12.5" width="19" height="15" rx="3.2" fill="currentColor"/>
  <rect x="4.2" y="14.2" width="15.6" height="11.6" rx="2" fill="none" stroke="rgba(251,245,234,.35)" stroke-width=".8"/>
  <path d="M12 17.4a2 2 0 0 1 1.1 3.7l.5 2.6h-3.2l.5-2.6A2 2 0 0 1 12 17.4Z" fill="#FBF5EA"/></svg>`;

export const frame = `<svg class="slot-frame" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="11"/></svg>`;

/** From a stamp (slot A) to the slot to live (slot B): sepia dashes, a departure dot, a small plane. */
export const route = `<svg class="pp-route" viewBox="0 0 100 142" preserveAspectRatio="none" aria-hidden="true">
  <circle class="route-dep" cx="68.6" cy="63.6" r=".9"/>
  <path class="route-trail" d="M70 64.4C77.6 67 84.8 71 83.6 79C82.8 84 79.8 86.8 76.8 88.3"/>
  <g class="route-plane" transform="translate(75.6 88.9) rotate(153)"><path d="M0 0L-4-2.2L-2.8 0L-4 2.2Z"/><path class="fold" d="M0 0L-2.8 0"/></g></svg>`;

/** Page 9: the stamp to come, a dotted ring with its microtext. */
export const nextRing = (p) => `<svg class="nx-ring" viewBox="0 0 200 200" aria-hidden="true">
  <defs><path id="${p}-nxtop" d="M14 100A86 86 0 0 1 186 100"/><path id="${p}-nxbot" d="M6 100A94 94 0 0 0 194 100"/></defs>
  <circle class="nx-r1" cx="100" cy="100" r="97"/><circle class="nx-r2" cx="100" cy="100" r="79"/>
  <text class="nx-micro" text-anchor="middle"><textPath href="#${p}-nxtop" startOffset="50%">CYCY ET KEVIN</textPath></text>
  <text class="nx-micro" text-anchor="middle"><textPath href="#${p}-nxbot" startOffset="50%">NOS AVENTURES</textPath></text>
  <text class="nx-star" x="10" y="103.4" text-anchor="middle">✦</text><text class="nx-star" x="190" y="103.4" text-anchor="middle">✦</text></svg>`;

export const trail = `<svg class="nx-trail" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true"><path d="M8 112C70 104 96 70 150 66C204 62 236 34 272 12"/></svg>`;

export const rose = `<svg class="nx-rose" viewBox="-13 -15 26 28" aria-hidden="true">
  <circle r="6.4" fill="none" stroke="rgba(122,31,53,.42)" stroke-width=".5"/><circle r="4.8" fill="none" stroke="rgba(184,147,90,.75)" stroke-width=".4" stroke-dasharray=".6 .8"/>
  <path d="M0-11L1.6-1.6L0 0L-1.6-1.6ZM0 11L1.6 1.6L0 0L-1.6 1.6Z" fill="rgba(122,31,53,.72)"/><path d="M-11 0L-1.6-1.6L0 0L-1.6 1.6ZM11 0L1.6-1.6L0 0L1.6 1.6Z" fill="rgba(184,147,90,.9)"/>
  <text y="-11.6" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-weight="600" font-size="4.6" fill="rgba(122,31,53,.7)">N</text></svg>`;

export const plane = `<svg class="nx-plane" viewBox="0 0 40 40" aria-hidden="true"><path d="M37 5.5 4.5 18.4c-1 .4-1 1.8 0 2.2l9.2 3.6 3.6 9.2c.4 1 1.8 1 2.2 0L33.5 3.5ZM13.7 24.2 33.5 3.5 17.2 27.1" fill="currentColor"/></svg>`;

export const arrows = {
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
