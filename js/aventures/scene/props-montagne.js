// The mountain path to the Ayous lakes (spec § 5, moments 3 and 5), after Kevin's photos (the névé and the green lake,
// the dog on the path): seen from below, the path climbs the near slope in bends, between big firs, past screes and
// névés, towards a cirque under grey peaks streaked with snow. Its layers, back to front: the peaks under the May sky,
// the cirque, the near slope and its path, the boulders and névés beside it, the big firs. Walked up (recipes.marche:
// the decor glides towards the walkers, the near layers past them) or come down. Paper only: it never becomes the
// poster. Pure: markup only, the same for the same arguments.
import { blob, edgeAt, n, path, poly, random, speck, tuft } from "./geom.js";
import { forest, neve, piece, rock, sheetOf, slab } from "./props.js";
import { sky } from "./props-vallee.js";

const L = -605; // a 1600-wide layer's edges
const R = 995;
const SKIN = "paper";

/** Where the path vanishes up the slope: walking up, the decor glides towards it. */
export const VANISH = { x: 196, y: 388 };
/** The path's long traverse below its upper bend (Kevin's on the way down): its two ends, along its middle. */
export const TRAVERSE = { from: [322, 467], to: [160, 514] };

// ── The peaks ───────────────────────────────────────────────

// the far crest, valleys and summits in turn (the summits at odd indexes), and the nearer cliffs under it
const CREST = [[L, 214], [-500, 170], [-430, 190], [-340, 132], [-270, 166], [-180, 118], [-90, 160], [-10, 104], [60, 146], [128, 96], [188, 134], [244, 84], [300, 128], [368, 96], [436, 142], [516, 108], [596, 154], [690, 116], [790, 162], [890, 128], [R + 10, 176]];
const CLIFFS = [[L, 252], [-520, 226], [-460, 244], [-380, 212], [-300, 240], [-220, 204], [-150, 236], [-70, 208], [10, 244], [80, 214], [150, 238], [196, 226], [250, 246], [320, 210], [400, 236], [470, 206], [560, 234], [650, 212], [740, 240], [840, 214], [R + 10, 236]];

/** The mountains of the cirque under the May sky (Kevin's photo of the névé and the green lake): far summits pale with
 *  the distance, snow capping them and down their couloirs; under them, nearer grey cliffs lit by the morning, their
 *  gullies, snow lying on their ledges. */
export function fond() {
  const far = [...CREST, [R + 10, 330], [L, 330]];
  const near = [...CLIFFS, [R + 10, 380], [L, 380]];
  let farLit = "";
  let snow = "";
  for (let i = 1; i < CREST.length - 1; i += 2) {
    const [[vx, vy], [sx, sy]] = [CREST[i - 1], CREST[i]];
    farLit += poly([[sx, sy], [vx, vy], [vx + 12, vy + 40], [sx + 3, sy + 80]]); // its east face, towards the sun
    snow += poly([[sx, sy], [sx + 9, sy + 11], [sx + 3, sy + 18], [sx - 6, sy + 15], [sx - 11, sy + 9]]); // its cap
    snow += poly([[sx + 2, sy + 18], [sx + 6, sy + 18], [sx + 12, sy + 52], [sx + 18, sy + 80], [sx + 11, sy + 76], [sx + 6, sy + 50]]); // a couloir
  }
  let nearLit = "";
  let gullies = "";
  let ledges = "";
  for (let i = 1; i < CLIFFS.length - 1; i += 2) {
    const [[vx, vy], [sx, sy], [wx, wy]] = [CLIFFS[i - 1], CLIFFS[i], CLIFFS[i + 1]];
    nearLit += poly([[sx, sy], [vx, vy], [vx + (sx - vx) * 0.6, vy + 52]]); // its east face, a buttress
    gullies += `M${n(wx)} ${n(wy + 2)}l${n(-3)} ${n(46)}`;
    ledges += blob([[sx - 18, sy + 44], [sx - 2, sy + 40], [sx + 16, sy + 45], [sx - 2, sy + 48]]);
  }
  return [
    sky(),
    piece(SKIN, poly(far), path(poly(far), "#a6adbd") + path(farLit, "#c4c9d4"), "", 0.6),
    piece(SKIN, snow, path(snow, "#f8f6f1"), "", 0.3),
    piece(SKIN, poly(near), path(poly(near), "#868d9c") + path(nearLit, "#a3a8b5") + `<path d="${gullies}" fill="none" stroke="#6f7686" stroke-width="2" stroke-linecap="round"/>` + path(ledges, "#f3f1ec"), "", 0.8),
  ].join("");
}

// ── The cirque ──────────────────────────────────────────────

const CIRQUE = [[L, 262], [-420, 268], [-240, 284], [-90, 298], [40, 310], [130, 320], [196, 328], [262, 316], [350, 300], [470, 286], [630, 272], [810, 264], [R + 10, 260]];

/** The cirque under the cliffs, a gentle V towards the path: alpine grass gone grey, screes fanning out from the rock,
 *  boulders, névés, a little green lake, and the path going on up in small bends. */
export function cirque() {
  const screes = [
    [[-124, 298], [-108, 298], [-62, 356], [-150, 362], [-160, 348]],
    [[-450, 270], [-434, 271], [-394, 322], [-472, 328], [-484, 314]],
    [[300, 304], [314, 303], [356, 352], [272, 358], [264, 344]],
    [[690, 274], [706, 273], [748, 330], [668, 336], [658, 322]],
  ];
  const r = random(301);
  let stones = "";
  for (const scree of screes)
    for (let k = 0; k < 10; k++) {
      const [x, y] = [scree[3][0] + r() * (scree[2][0] - scree[3][0]), scree[0][1] + 24 + r() * 30];
      const s = 2 + r() * 3;
      stones += poly([[x, y], [x + s, y - s * 0.6], [x + s * 1.6, y + s * 0.2], [x + s * 0.6, y + s * 0.7]]);
    }
  const tarn = blob([[-6, 352], [40, 344], [96, 346], [128, 354], [92, 364], [30, 366]]);
  const ripples = "M14 354h26M60 351h30M48 359h22";
  const bends = "M204 330L246 318L216 307L262 294L232 284L280 271";
  return [
    sheetOf(SKIN, CIRQUE, "#98a184", path(screes.map(poly).join(""), "#c3bdaf") + path(stones, "#9d978b"), 540),
    piece(SKIN, tarn, path(tarn, "#4f9a87") + `<path d="${ripples}" stroke="#8cc4b2" stroke-width="1.4" stroke-linecap="round"/>`, "", 0.2), // the green lake
    `<path d="${bends}" fill="none" stroke="#e3dac2" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`,
    [[-70, 340, 64], [310, 326, 60], [-300, 300, 74], [560, 296, 84], [130, 330, 36], [-520, 296, 60], [820, 280, 72], [-10, 368, 50]].map(([x, y, w]) => neve(x, y, w, SKIN)).join(""),
    [[-240, 330, 30], [240, 346, 24], [470, 330, 30], [-420, 350, 34], [700, 350, 30]].map(([x, y, w]) => rock(x, y, w, SKIN)).join(""),
  ].join("");
}

// ── The near slope and its path ─────────────────────────────

const SLOPE = [[L, 474], [-420, 462], [-220, 450], [-60, 434], [70, 416], [150, 402], [196, 396], [246, 400], [330, 410], [450, 424], [620, 440], [800, 454], [R + 10, 464]];
// the path's middle, from the bottom of the stage up to where it vanishes: its bends, its traverse
const TRAIL = [[196, 820], [206, 740], [198, 672], [176, 614], [152, 564], [146, 534], [164, 513], [240, 491], [318, 469], [334, 456], [306, 441], [248, 425], [208, 411], [196, 400]];
const width = (y) => 6 + 0.29 * (y - 400); // the path narrows with the distance

/** The path's middle as close points (the smooth line of geom.js curve() through TRAIL). */
function along() {
  const out = [];
  for (let i = 0; i < TRAIL.length - 1; i++) {
    const [p0, p1, p2, p3] = [TRAIL[i - 1] ?? TRAIL[i], TRAIL[i], TRAIL[i + 1], TRAIL[i + 2] ?? TRAIL[i + 1]];
    for (let s = 0; s < 8; s++) {
      const t = s / 8;
      const c = (k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t);
      out.push([c(0), c(1)]);
    }
  }
  out.push(TRAIL.at(-1));
  return out;
}

/** The path: a band of gravel narrowing up the slope, its edge darker, stones and steps on it. */
function trail() {
  const mid = along();
  const side = (sign) =>
    mid.map(([x, y], k) => {
      const [ax, ay] = mid[Math.max(0, k - 1)];
      const [bx, by] = mid[Math.min(mid.length - 1, k + 1)];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const half = (width(y) / 2) * sign;
      return [x - ((by - ay) / len) * half, y + ((bx - ax) / len) * half];
    });
  const band = poly([...side(1), ...side(-1).reverse()]);
  const r = random(311);
  let stones = "";
  let steps = "";
  mid.forEach(([x, y], k) => {
    if (k % 3 || y < 470) return;
    const w = width(y);
    const sx = x + (r() - 0.5) * w * 0.7;
    const s = w * 0.05;
    stones += poly([[sx, y], [sx + s * 1.4, y - s * 0.7], [sx + s * 2.4, y + s * 0.2], [sx + s, y + s * 0.8]]);
    if (k % 6 === 0 && y > 600) steps += `M${n(x - w * 0.42)} ${n(y)}Q${n(x)} ${n(y + w * 0.04)} ${n(x + w * 0.42)} ${n(y)}`;
  });
  return (
    `<path d="${band}" fill="none" stroke="#3b2a18" stroke-opacity=".12" stroke-width="5" transform="translate(0 2)"/>` +
    `<path d="${band}" fill="#dacfb3" stroke="#b1a383" stroke-width="2.2" stroke-linejoin="round"/>` +
    path(stones, "#bdb090") +
    `<path d="${steps}" fill="none" stroke="#a8997a" stroke-width="2" stroke-linecap="round"/>`
  );
}

/** The near slope: alpine grass with its streaks and tufts, a few rocks, the path climbing it in bends. */
export function pente() {
  const r = random(321);
  const streaks = Array.from({ length: 16 }, () => {
    const x = L + r() * 1600;
    const y = edgeAt(SLOPE, x) + 20 + r() * 300;
    return blob([[x, y], [x + 40, y - 2.4], [x + 90, y], [x + 40, y + 2]]);
  }).join("");
  let tufts = "";
  const flowers = ["", "", ""];
  for (let i = 0; i < 120; i++) {
    const x = L + r() * 1600;
    const y = edgeAt(SLOPE, x) + 10 + r() ** 0.8 * 350;
    if (Math.abs(x - 200) < 60 + (y - 400) * 0.2 && y > 440) continue; // not on the path
    const s = 1 + (y - 400) * 0.006; // bigger nearer
    if (r() < 0.5) tufts += tuft(x, y, (2.4 + r() * 2) * s);
    else flowers[Math.floor(r() * 3)] += speck(x, y, (1.2 + r() * 0.8) * s);
  }
  return [
    sheetOf(SKIN, SLOPE, "#98ae64", path(streaks, "#a9bd74") + path(tufts, "#7f9a4d") + path(flowers[0], "#fbf6ee") + path(flowers[1], "#f2cf5b") + path(flowers[2], "#b48ad0")),
    trail(),
    rock(-200, 522, 62, SKIN),
    rock(420, 504, 56, SKIN),
    rock(18, 468, 36, SKIN),
    rock(364, 448, 28, SKIN),
    rock(-420, 540, 70, SKIN),
    rock(640, 530, 64, SKIN),
  ].join("");
}

// ── Beside the path ─────────────────────────────────────────

/** A trail sign, its post's foot at x, y: two yellow boards pointing up the path, as on the Pyrenees' paths. */
function signpost(x, y) {
  const post = poly([[x - 2, y], [x - 2, y - 46], [x + 2, y - 47], [x + 2, y]]);
  const boards = poly([[x - 16, y - 44], [x + 14, y - 44], [x + 20, y - 39.5], [x + 14, y - 35], [x - 16, y - 35]]) + poly([[x - 20, y - 31], [x - 14, y - 35.5], [x + 16, y - 35.5], [x + 16, y - 26.5], [x - 14, y - 26.5]]);
  const lines = `M${n(x - 11)} ${n(y - 40)}h20M${n(x - 9)} ${n(y - 31)}h18`;
  return piece(SKIN, post + boards, path(post, "#7a5a3a") + path(boards, "#f2c53d") + `<path d="${lines}" stroke="#a37a1c" stroke-width="1.6" stroke-linecap="round"/>`, "", 0.6);
}

/** The boulders and névés beside the path, half-way, and its trail sign: walking up, they pass on the sides after the
 *  firs, the nearest to the path last. */
export function roches() {
  const snow = [[-150, 570, 96], [-10, 552, 70], [364, 548, 74], [-430, 574, 104], [520, 566, 96], [740, 570, 112], [930, 584, 64]].map(([x, y, w]) => neve(x, y, w, SKIN)).join("");
  const stones = [[24, 612, 62], [74, 604, 40], [-120, 618, 78], [-300, 610, 72], [-540, 604, 72], [292, 610, 58], [338, 618, 50], [440, 612, 76], [620, 610, 80], [860, 606, 72]].map(([x, y, w]) => rock(x, y, w, SKIN)).join("");
  const flat = slab(SKIN, [[112, 640], [138, 632], [160, 638], [146, 646], [116, 646]], "#a39c90", 0.4); // a flat stone by the path
  return snow + stones + flat + signpost(262, 600);
}

/** The big firs in front on both sides, their feet below the stage, and a row of smaller ones nearer the path: walking
 *  up, they pass first. */
export function sapins() {
  return forest(
    [
      [-560, 700, 190],
      [-420, 694, 170],
      [70, 694, 168],
      [338, 700, 176],
      [560, 696, 180],
      [760, 690, 170],
      [-470, 796, 320],
      [-300, 806, 280],
      [-140, 792, 330],
      [-36, 812, 300],
      [24, 830, 236],
      [400, 820, 286],
      [470, 796, 330],
      [610, 806, 300],
      [780, 794, 320],
      [930, 804, 280],
    ],
    SKIN,
  );
}
