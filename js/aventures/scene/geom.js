// The props' shared geometry (props*.js): path data in stage units, rounded to a tenth. Pure: the same markup for the
// same arguments.

export const n = (v) => Math.round(v * 10) / 10;
export const xy = ([x, y]) => `${n(x)} ${n(y)}`;
export const path = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
/** A closed polygon. */
export const poly = (list) => `M${list.map(xy).join("L")}Z`;

/** A smooth line through the points (Catmull-Rom), as path data from its first point. */
export function curve(list) {
  let d = `M${xy(list[0])}`;
  for (let i = 0; i < list.length - 1; i++) {
    const [p0, p1, p2, p3] = [list[i - 1] ?? list[i], list[i], list[i + 1], list[i + 2] ?? list[i + 1]];
    d += `C${xy([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${xy([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${xy(p2)}`;
  }
  return d;
}
/** A sheet's outline: a smooth top edge through the points, down to `bottom`. */
export const sheet = (list, bottom = 790) => `${curve(list)}V${bottom}H${n(list[0][0])}Z`;
/** A closed smooth blob through the points. */
export function blob(list) {
  const k = list.length;
  let d = `M${xy(list[0])}`;
  for (let i = 0; i < k; i++) {
    const [p0, p1, p2, p3] = [list[(i - 1 + k) % k], list[i], list[(i + 1) % k], list[(i + 2) % k]];
    d += `C${xy([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${xy([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${xy(p2)}`;
  }
  return `${d}Z`;
}
/** The edges of a polygon that face up, moved half a light edge inside it (path data for its light edge). */
export function topEdge(list, w = 1.3) {
  let area = 0;
  list.forEach((a, i) => {
    const b = list[(i + 1) % list.length];
    area += a[0] * b[1] - b[0] * a[1];
  });
  const s = Math.sign(area);
  let d = "";
  let open = false;
  list.forEach((a, i) => {
    const b = list[(i + 1) % list.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [nx, ny] = [((b[1] - a[1]) / len) * s, (-(b[0] - a[0]) / len) * s]; // outward
    const inside = ([x, y]) => [x - (nx * w) / 2, y - (ny * w) / 2];
    if (ny < -0.3) d += open ? `L${xy(inside(b))}` : `M${xy(inside(a))}L${xy(inside(b))}`;
    open = ny < -0.3;
  });
  return d;
}
/** The y of a line of points (sorted by x) at x. */
export function edgeAt(list, x) {
  for (let i = 1; i < list.length; i++)
    if (x <= list[i][0]) {
      const [a, b] = [list[i - 1], list[i]];
      return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
    }
  return list.at(-1)[1];
}
/** A seeded random in [0, 1): the same scatter every time. */
export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Points mirrored in the water line `y0`, squashed by `k` (a reflection seen from the shore). */
export const mirror = (list, y0, k) => list.map(([x, y]) => [x, y0 + Math.max(0, y0 - y) * k]);
export const dot = (x, y, r) => `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`;
/** A speck (a flower far off): four points, cheaper to draw than a disc. */
export const speck = (x, y, r) => poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]]);
/** A thin lens (a ripple, a glint, a wisp), `w` long from x, y. */
export const lens = (x, y, w, h = 1.2) => blob([[x, y], [x + w * 0.5, y - h], [x + w, y], [x + w * 0.5, y + h * 0.7]]);
/** A tuft of grass, its base at x, y. */
export const tuft = (x, y, s) =>
  poly([[x - s, y], [x - 0.7 * s, y - 1.1 * s], [x - 0.4 * s, y - 0.3 * s], [x - 0.1 * s, y - 1.6 * s], [x + 0.15 * s, y - 0.35 * s], [x + 0.45 * s, y - 1.25 * s], [x + 0.6 * s, y - 0.25 * s], [x + s, y - 0.8 * s], [x + 0.9 * s, y]]);
