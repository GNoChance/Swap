// The intros' maps (spec § 5, moment 1): real coordinates on the stage, in a simple projection. Pure: runs under Node.

/** projection({ origin: [lat, lon], at: { x, y }, unitsPerDegree }) → ([lat, lon]) → { x, y }: equirectangular,
 *  `origin` drawn at `at`, the degrees of longitude shortened by the cosine of its latitude. */
export function projection({ origin: [lat0, lon0], at, unitsPerDegree }) {
  const across = unitsPerDegree * Math.cos((lat0 * Math.PI) / 180);
  return ([lat, lon]) => ({ x: at.x + (lon - lon0) * across, y: at.y + (lat0 - lat) * unitsPerDegree });
}
