// Just enough of a TrueType reader for the stamp generator: cmap (format 4), hmtx, loca and glyf (simple and
// composite glyphs, so accented capitals work). Text becomes SVG paths: a stamp looks the same on every phone.
import { readFileSync } from "node:fs";

export function loadFont(file) {
  const buf = readFileSync(file);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tables = {};
  for (let i = 0; i < dv.getUint16(4); i++) {
    const rec = 12 + i * 16;
    tables[String.fromCharCode(...buf.subarray(rec, rec + 4))] = dv.getUint32(rec + 8);
  }
  if (!tables.glyf) throw new Error(`${file}: pas de table glyf (les polices CFF ne sont pas prises en charge)`);

  const unitsPerEm = dv.getUint16(tables.head + 18);
  const longLoca = dv.getInt16(tables.head + 50) === 1;
  const metrics = dv.getUint16(tables.hhea + 34);
  const os2 = tables["OS/2"];
  const capHeight = os2 && dv.getUint16(os2) >= 2 ? dv.getInt16(os2 + 88) : unitsPerEm * 0.7;

  const loca = (i) => (longLoca ? dv.getUint32(tables.loca + i * 4) : dv.getUint16(tables.loca + i * 2) * 2);
  const advance = (i) => dv.getUint16(tables.hmtx + Math.min(i, metrics - 1) * 4);

  // cmap: the Unicode BMP subtable (format 4)
  let sub = 0;
  for (let i = 0; i < dv.getUint16(tables.cmap + 2); i++) {
    const rec = tables.cmap + 4 + i * 8;
    const platform = dv.getUint16(rec);
    const offset = tables.cmap + dv.getUint32(rec + 4);
    if (dv.getUint16(offset) === 4 && (platform === 0 || (platform === 3 && dv.getUint16(rec + 2) === 1))) {
      sub = offset;
      break;
    }
  }
  if (!sub) throw new Error(`${file}: pas de table cmap Unicode`);
  const segX2 = dv.getUint16(sub + 6);
  const ends = sub + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  function glyphIndex(code) {
    for (let i = 0; i < segX2; i += 2) {
      if (code > dv.getUint16(ends + i)) continue;
      const start = dv.getUint16(starts + i);
      if (code < start) return 0;
      const delta = dv.getInt16(deltas + i);
      const range = dv.getUint16(ranges + i);
      if (!range) return (code + delta) & 0xffff;
      const g = dv.getUint16(ranges + i + range + (code - start) * 2);
      return g && (g + delta) & 0xffff;
    }
    return 0;
  }

  // glyf: contours of { x, y, on } points, font units, y up
  function simple(at, count) {
    const endPts = Array.from({ length: count }, (_, i) => dv.getUint16(at + 10 + i * 2));
    const total = endPts[count - 1] + 1;
    let p = at + 10 + count * 2;
    p += 2 + dv.getUint16(p); // skip the hinting instructions
    const flags = [];
    while (flags.length < total) {
      const f = buf[p++];
      flags.push(f);
      if (f & 8) for (let r = buf[p++]; r > 0; r--) flags.push(f);
    }
    const coords = (short, same) => {
      let v = 0;
      return flags.map((f) => {
        if (f & short) {
          const d = buf[p++];
          v += f & same ? d : -d;
        } else if (!(f & same)) {
          v += dv.getInt16(p);
          p += 2;
        }
        return v;
      });
    };
    const xs = coords(2, 16);
    const ys = coords(4, 32);
    let first = 0;
    return endPts.map((last) => {
      const contour = [];
      for (let i = first; i <= last; i++) contour.push({ x: xs[i], y: ys[i], on: Boolean(flags[i] & 1) });
      first = last + 1;
      return contour;
    });
  }

  function composite(at, depth) {
    const out = [];
    let p = at + 10;
    let flags;
    do {
      flags = dv.getUint16(p);
      const part = dv.getUint16(p + 2);
      p += 4;
      if (!(flags & 2)) throw new Error("glyphe composé par points d'ancrage : non pris en charge");
      let dx, dy;
      if (flags & 1) {
        dx = dv.getInt16(p);
        dy = dv.getInt16(p + 2);
        p += 4;
      } else {
        dx = dv.getInt8(p);
        dy = dv.getInt8(p + 1);
        p += 2;
      }
      let [a, b, c, d] = [1, 0, 0, 1];
      if (flags & 8) {
        a = d = dv.getInt16(p) / 16384;
        p += 2;
      } else if (flags & 0x40) {
        a = dv.getInt16(p) / 16384;
        d = dv.getInt16(p + 2) / 16384;
        p += 4;
      } else if (flags & 0x80) {
        [a, b, c, d] = [0, 2, 4, 6].map((o) => dv.getInt16(p + o) / 16384);
        p += 8;
      }
      for (const contour of contours(part, depth + 1)) out.push(contour.map(({ x, y, on }) => ({ x: a * x + c * y + dx, y: b * x + d * y + dy, on })));
    } while (flags & 0x20);
    return out;
  }

  function contours(index, depth = 0) {
    if (depth > 8) throw new Error("glyphe composé trop profond");
    const start = loca(index);
    if (start === loca(index + 1)) return []; // a space
    const at = tables.glyf + start;
    const count = dv.getInt16(at);
    return count >= 0 ? simple(at, count) : composite(at, depth);
  }

  return {
    unitsPerEm,
    capHeight,
    /** { advance, missing, path(map) }: map turns a font point [x, y] (y up) into an SVG point [x, y]. */
    glyph(char) {
      const index = glyphIndex(char.codePointAt(0));
      const outline = contours(index);
      return { advance: advance(index), missing: index === 0, path: (map) => outline.map((c) => contourPath(c, map)).join("") };
    },
  };
}

const num = (v) => String(Math.round(v * 10) / 10);
const point = (map, p) => map([p.x, p.y]).map(num).join(" ");
const middle = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });

/** A quadratic TrueType contour as SVG path data (off-curve neighbours imply an on-curve point between them). */
function contourPath(points, map) {
  if (points.length < 2) return "";
  const k = points.findIndex((p) => p.on);
  let list = k === -1 ? [middle(points[0], points[1]), ...points] : [...points.slice(k), ...points.slice(0, k)];
  list = [...list, list[0]]; // back to the start, which is on the curve
  let d = `M${point(map, list[0])}`;
  for (let i = 1; i < list.length; i++) {
    const p = list[i];
    if (p.on) {
      d += `L${point(map, p)}`;
      continue;
    }
    const next = list[i + 1]; // always there: the list ends on its on-curve start
    if (next.on) {
      d += `Q${point(map, p)} ${point(map, next)}`;
      i++;
    } else d += `Q${point(map, p)} ${point(map, middle(p, next))}`;
  }
  return `${d}Z`;
}
