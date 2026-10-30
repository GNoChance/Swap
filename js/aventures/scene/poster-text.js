// The words of an intro's closing poster (spec § 5, moment 6), from the outing's data: its place in big capitals, then
// its stamp's name and dates in small, as the passport writes them. Pure: runs under Node.
import { formatRange } from "../logic.js";

/** « Lacs d'Ayous » → « LACS D'AYOUS ». */
export function posterTitle(aventure) {
  return aventure.lieu.toLocaleUpperCase("fr");
}

/** « Premier bivouac · 17–18 mai 2025 ». */
export function posterLine(aventure) {
  return `${aventure.name} · ${formatRange(aventure.from, aventure.to)}`;
}

// Cormorant Garamond 600's advances (em, measured in Chrome); an accented capital is as wide as its letter
const ADVANCE = { A: 0.711, B: 0.582, C: 0.683, D: 0.7, E: 0.547, F: 0.518, G: 0.725, H: 0.762, I: 0.339, J: 0.333, K: 0.653, L: 0.541, M: 0.85, N: 0.732, O: 0.766, P: 0.549, Q: 0.766, R: 0.689, S: 0.507, T: 0.64, U: 0.701, V: 0.662, W: 0.918, X: 0.649, Y: 0.616, Z: 0.602, "'": 0.147, "’": 0.188, " ": 0.234, "-": 0.323, ".": 0.204 };
const WIDE = 0.77; // anything else: as wide as an O

/** The title's lettering (css/intros.css, .af-title): its size (units), its spacing (em), and the room it has (units):
 *  the poster's picture, a margin on each side. It sits below the sound button's corner on a phone (56 px). */
export const TITLE_FIT = { width: 296, size: 26, spacing: 0.13 };

/** How wide the title is (units) at `size`: each character and its spacing; each letter, an inline-block, also takes
 *  the title's text-indent (as much as the spacing) before it. */
export function titleWidth(title, { size, spacing }) {
  let em = 0;
  for (const c of title) em += (ADVANCE[c.normalize("NFD")[0]] ?? WIDE) + spacing + (c === " " ? 0 : spacing);
  return em * size;
}

/** fitTitle(title, { width, size, spacing }) → its size (units): `size`, or smaller (to a tenth) if it would not fit
 *  in `width`. */
export function fitTitle(title, { width, size, spacing }) {
  const wide = titleWidth(title, { size, spacing });
  return wide <= width ? size : Math.floor(((size * width) / wide) * 10) / 10;
}
