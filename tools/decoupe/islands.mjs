// Finds the stickers on a die-cut board: islands of opaque pixels, specks dropped, stickers whose outlines touch
// told apart, loose bits (« ? », hearts, « zzz », speed lines) joined to the nearest sticker, then put in reading order.
// Pure: runs under Node on a plain alpha array. Box = { x, y, w, h } in board pixels.

/** Islands under this share of the board are specks and dropped. The specks of the real boards are a few pixels, the
 *  loose bits of an emote about 1000 px at the least on a 1448 × 1086 board (0.0006 of it): this keeps both sides clear. */
export const SPECK = 0.0003;

/** A standard board's stickers are about the same size: one is never smaller or bigger than this, in times the median
 *  (the real boards stay within 0.8 to 1.2), or the board was cut wrong. */
const SIZE_RANGE = [0.5, 1.6];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** The 8-connected islands of opaque pixels: { id, x0, y0, x1, y1, area } (inclusive corners), and `labels`, the id of
 *  the island of each pixel (0 for none). Iterative, no recursion. */
function islands(alpha, width, height, threshold) {
  const labels = new Int32Array(width * height);
  const stack = new Int32Array(width * height);
  const found = [];
  for (let start = 0; start < alpha.length; start++) {
    if (labels[start] || alpha[start] <= threshold) continue;
    let top = 0;
    const island = { id: found.length + 1, x0: width, y0: height, x1: 0, y1: 0, area: 0 };
    stack[top++] = start;
    labels[start] = island.id;
    while (top) {
      const at = stack[--top];
      const x = at % width;
      const y = (at - x) / width;
      island.area++;
      if (x < island.x0) island.x0 = x;
      if (x > island.x1) island.x1 = x;
      if (y < island.y0) island.y0 = y;
      if (y > island.y1) island.y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (labels[next] || alpha[next] <= threshold) continue;
          labels[next] = island.id;
          stack[top++] = next;
        }
      }
    }
    found.push(island);
  }
  return { found, labels };
}

/** The pixels of a mask whose whole square neighbourhood (`r` pixels each way) is in the mask. */
function erode(mask, width, height, r) {
  const size = 2 * r + 1;
  const flat = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    let run = 0; // the pixels in a row, in the mask, ending here
    for (let x = 0; x < width + r; x++) {
      run = x < width && mask[y * width + x] ? run + 1 : 0;
      if (x >= r && run >= size) flat[y * width + x - r] = 1;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let x = 0; x < width; x++) {
    let run = 0;
    for (let y = 0; y < height + r; y++) {
      run = y < height && flat[y * width + x] ? run + 1 : 0;
      if (y >= r && run >= size) out[(y - r) * width + x] = 1;
    }
  }
  return out;
}

/** The distance between two islands' boxes: 0 when they touch or overlap. */
function gap(a, b) {
  const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
  const dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
  return Math.hypot(dx, dy);
}

/** Stickers whose outlines touch come out as one island. An island is worth as many stickers as it holds the mean
 *  sticker's area, and is cut into that many. Returns the islands as they are when the counts do not add up to
 *  `expected`, or when an island is no clear number of stickers (1.5 times the mean is no sticker and a half): the
 *  count error follows. */
function unglue(bodies, expected, board) {
  const mean = bodies.reduce((sum, b) => sum + b.area, 0) / expected;
  const times = bodies.map((b) => b.area / mean);
  if (times.some((n) => n >= 1.5 && Math.abs(n - Math.round(n)) > 0.35)) return bodies;
  const counts = times.map((n) => Math.max(1, Math.round(n)));
  if (counts.reduce((sum, n) => sum + n, 0) !== expected) return bodies;
  return bodies.flatMap((body, i) => (counts[i] > 1 ? split(body, counts[i], board) : [body]));
}

/** An island of `k` stickers cut into `k` pieces. The rough cut (`rectangles`) only has to tell the stickers' art apart,
 *  and there is a clear gap between two stickers' art: the outline pixels then go to the nearest art. */
function split(body, k, { labels, piece, art, width, uids }) {
  const pieces = rectangles(body.id, body, k, labels, art, width).map((region) => ({
    id: uids.next++, region, x0: width, y0: Infinity, x1: 0, y1: 0, area: 0,
  }));
  const queue = [];
  for (const { id, region } of pieces) {
    for (let y = region.y0; y <= region.y1; y++) {
      for (let x = region.x0; x <= region.x1; x++) {
        const at = y * width + x;
        if (labels[at] !== body.id || !art[at]) continue;
        piece[at] = id;
        queue.push(at);
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    const x = at % width;
    const y = (at - x) / width;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || x + dx >= width) continue;
        const next = (y + dy) * width + x + dx;
        if (labels[next] !== body.id || piece[next] !== body.id) continue; // an unclaimed pixel of this island
        piece[next] = piece[at];
        queue.push(next);
      }
    }
  }
  const byId = new Map(pieces.map((p) => [p.id, p]));
  for (const at of queue) {
    const p = byId.get(piece[at]);
    const x = at % width;
    const y = (at - x) / width;
    p.x0 = Math.min(p.x0, x);
    p.x1 = Math.max(p.x1, x);
    p.y0 = Math.min(p.y0, y);
    p.y1 = Math.max(p.y1, y);
    p.area++;
  }
  return pieces.filter((p) => p.area);
}

/** The `k` rectangles of island `id` inside the rectangle `r`: cut where its art is narrowest (fewest pixels on a row
 *  or a column), through the middle of that stretch, with about the right share of the art on each side. Fewer than
 *  `k` when no cut is found. */
function rectangles(id, r, k, labels, art, width) {
  const lines = { x: new Array(r.x1 - r.x0 + 1).fill(0), y: new Array(r.y1 - r.y0 + 1).fill(0) };
  let area = 0;
  for (let y = r.y0; y <= r.y1; y++) {
    for (let x = r.x0; x <= r.x1; x++) {
      if (labels[y * width + x] !== id || !art[y * width + x]) continue;
      lines.x[x - r.x0]++;
      lines.y[y - r.y0]++;
      area++;
    }
  }
  const whole = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 };
  if (k === 1) return [whole];

  // How many stickers lie before a cut after each line of an axis: 1 to k - 1 for a cut that can be made.
  const before = (counts) => {
    let sum = 0;
    return counts.map((n) => Math.round(((sum += n) / area) * k));
  };
  let best = null;
  for (const axis of ["x", "y"]) {
    const counts = lines[axis];
    const side = before(counts);
    counts.forEach((n, t) => {
      if (t < counts.length - 1 && side[t] >= 1 && side[t] < k && (!best || n < best.narrow)) best = { axis, t, narrow: n };
    });
  }
  if (!best) return [whole];

  const counts = lines[best.axis];
  const side = before(counts);
  let [lo, hi] = [best.t, best.t];
  while (lo > 0 && counts[lo - 1] <= best.narrow * 1.25 + 2 && side[lo - 1] >= 1) lo--;
  while (hi < counts.length - 2 && counts[hi + 1] <= best.narrow * 1.25 + 2 && side[hi + 1] < k) hi++;
  const t = (lo + hi) >> 1;
  const origin = best.axis === "x" ? r.x0 : r.y0;
  const [low, high] =
    best.axis === "x"
      ? [{ ...whole, x1: origin + t }, { ...whole, x0: origin + t + 1 }]
      : [{ ...whole, y1: origin + t }, { ...whole, y0: origin + t + 1 }];
  return [...rectangles(id, low, side[t], labels, art, width), ...rectangles(id, high, k - side[t], labels, art, width)];
}

/** Row by row, left to right: a sticker starts a new row when its centre is lower than the row's average by more than
 *  half a sticker's height. */
function readingOrder(bodies) {
  const cy = (b) => (b.y0 + b.y1) / 2;
  const cx = (b) => (b.x0 + b.x1) / 2;
  const half = median(bodies.map((b) => b.y1 - b.y0 + 1)) / 2;
  const rows = [];
  for (const body of [...bodies].sort((a, b) => cy(a) - cy(b))) {
    const row = rows[rows.length - 1];
    if (row && cy(body) - row.reduce((sum, b) => sum + cy(b), 0) / row.length <= half) row.push(body);
    else rows.push([body]);
  }
  return rows.flatMap((row) => row.sort((a, b) => cx(a) - cx(b)));
}

/**
 * The stickers of a board, in reading order, with the pixels of each: `boxes` and `owner`, one number per board pixel,
 * the 1-based place of the sticker the pixel belongs to (0 for none: specks and strays). A sticker's crop keeps only
 * its own pixels, so a neighbour whose outline touches it does not show. `alpha` is one byte per pixel, opaque above
 * `threshold`. `white` (optional, 1 for the pixels of a white outline) lets stickers whose outlines touch be cut
 * along the gap between their art. Islands smaller than `speck` of the board are dropped. With `expected` (12 for a
 * standard board) any other count, or stickers of very unequal sizes, throws; with `expected: null` the count is free
 * (a scene board).
 */
export function cutStickers(alpha, width, height, { threshold = 24, speck = SPECK, expected = 12, white = null } = {}) {
  const { found, labels } = islands(alpha, width, height, threshold);
  const kept = found.filter((island) => island.area >= speck * width * height);
  // Bodies are the big islands, the others loose bits: a body is at least a quarter of the mean sticker. A standard
  // board's mean is its islands' area over `expected` (glued stickers make few islands, so no count of islands will do);
  // a scene board has no count, its biggest islands tell.
  const biggest = [...kept].sort((a, b) => b.area - a.area).slice(0, 12);
  const mean = expected != null ? kept.reduce((sum, island) => sum + island.area, 0) / expected : median(biggest.map((island) => island.area));
  const floor = 0.25 * mean;
  // piece: who each pixel goes with, its island until the island is cut; art: the heart of what is not a white outline
  // (eroded: the thin grey rim of an outline is not art).
  const piece = Int32Array.from(labels);
  const colour = labels.map((id, at) => (id && !white?.[at] ? 1 : 0));
  const art = white ? erode(colour, width, height, 3) : colour;
  let bodies = kept.filter((island) => island.area >= floor);
  if (expected != null && bodies.length < expected) bodies = unglue(bodies, expected, { labels, piece, art, width, uids: { next: found.length + 1 } });
  const ordered = bodies.length ? readingOrder(bodies) : []; // by the stickers alone: a loose bit must not shift them
  const boxes = ordered.map((body) => ({ ...body }));
  const places = new Map(ordered.map((body, i) => [body.id, i + 1]));
  for (const bit of kept.filter((island) => island.area < floor)) {
    const at = ordered.reduce((best, body, i) => (gap(bit, body) < gap(bit, ordered[best]) ? i : best), 0);
    if (!ordered.length || gap(bit, ordered[at]) > 0.15 * width) continue; // too far from any sticker: a stray mark
    const box = boxes[at];
    box.x0 = Math.min(box.x0, bit.x0);
    box.y0 = Math.min(box.y0, bit.y0);
    box.x1 = Math.max(box.x1, bit.x1);
    box.y1 = Math.max(box.y1, bit.y1);
    places.set(bit.id, at + 1);
  }
  if (expected != null) {
    if (boxes.length !== expected) throw new Error(`${boxes.length} stickers trouvés, ${expected} attendus`);
    const areas = ordered.map((body) => body.area);
    const [small, big] = [Math.min(...areas), Math.max(...areas)].map((area) => area / median(areas));
    if (small < SIZE_RANGE[0] || big > SIZE_RANGE[1]) {
      throw new Error(`tailles trop inégales entre les stickers (de ${small.toFixed(1)} à ${big.toFixed(1)} fois la médiane) : stickers collés mal séparés, ou des morceaux pris pour des stickers`);
    }
  }
  const owner = piece.map((id) => places.get(id) ?? 0);
  return { boxes: boxes.map((b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 })), owner };
}

/** Just the boxes of `cutStickers`. */
export const findStickers = (alpha, width, height, options) => cutStickers(alpha, width, height, options).boxes;

/** A box widened by `margin` on every side, kept inside the board. */
export function padBox(box, margin, width, height) {
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  return { x, y, w: Math.min(width, box.x + box.w + margin) - x, h: Math.min(height, box.y + box.h + margin) - y };
}
