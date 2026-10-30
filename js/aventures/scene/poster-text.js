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
