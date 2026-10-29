// The hub's worlds and the carousel's maths: pure, so it runs under Node.
import { fill } from "./logic.js";

/** The three worlds, in carousel order, with their colours (the card, and the plate that grows out of it). */
export const WORLDS = [
  { id: "swap", color: "#7A1F35", ink: "#F6EFE6" },
  { id: "ubb", color: "#ECE7DF", ink: "#7A1733" },
  { id: "aventures", color: "#0F8C8A", ink: "#FFF8E7" },
];

/** The cards: each world with its title and its count, taken from the data. */
export function hubWorlds(content, aventuresCount) {
  const counts = { swap: content.gifts.length, ubb: content.museum.matches.length, aventures: aventuresCount };
  return WORLDS.map((w) => {
    const text = content.hub.worlds[w.id];
    return { ...w, title: text.title, note: fill(text.note, { n: counts[w.id] }) };
  });
}

/** The index of the centre nearest to viewCenter. */
export function closestIndex(centers, viewCenter) {
  let best = 0;
  centers.forEach((c, i) => {
    if (Math.abs(c - viewCenter) < Math.abs(centers[best] - viewCenter)) best = i;
  });
  return best;
}

const round = (v) => Math.round(v * 1e4) / 1e4;
const reach = (distance, cardWidth) => Math.min(1, Math.abs(distance) / cardWidth);

/** A card's scale at `distance` px from the middle: 1 in the centre, 0.88 from one card width away. */
export const cardScale = (distance, cardWidth) => round(1 - 0.12 * reach(distance, cardWidth));

/** A card's opacity (as a filter) at `distance` px from the middle: 1 in the centre, 0.55 from one card width away. */
export const cardFade = (distance, cardWidth) => round(1 - 0.45 * reach(distance, cardWidth));
