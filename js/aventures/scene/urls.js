// Where an intro's stickers are (spec § 7), and their stand-ins if one does not load (the portal's spec, § 7): the
// site's own stickers of Cycy and Kevin, or a plain silhouette for a vehicle. Pure: runs under Node.

/** stickerUrl("bivouac-1", "kevin", "dos", "joie") → "assets/aventures/bivouac-1/kevin-dos-joie.webp". */
export const stickerUrl = (outing, who, side, pose) => `assets/aventures/${outing}/${who}-${side}-${pose}.webp`;

/** vehicleUrl("seat", "roule") → "assets/aventures/vehicules/seat-roule.webp". */
export const vehicleUrl = (name, view) => `assets/aventures/vehicules/${name}-${view}.webp`;

// each pose's stand-in in assets/cyrielle/: Cycy from the front, Kevin from the front, Cycy from the back, Kevin from the back
const FALLBACK = {
  joie: ["joy", "kevin-joy", "dos-cycy-joy", "dos-kevin-joy"],
  colere: ["angry", "kevin-angry", "dos-cycy-angry", "dos-kevin-angry"],
  pleurs: ["cry", "kevin-cry", "dos-cycy-cry", "dos-kevin-cry"],
  boude: ["pout", "kevin-pout", "dos-cycy-pout", "dos-kevin-pout"],
  question: ["think", "kevin-think", "dos-cycy-think", "dos-kevin-think"],
  sommeil: ["cosy", "kevin-sleep", "dos-cycy-sleep", "dos-kevin-sleep"],
  bisou: ["wink", "kevin-kiss", "dos-cycy-kiss", "dos-kevin-kiss"],
  peace: ["cool", "kevin-wink", "dos-cycy-cheer", "dos-kevin-wink"],
  surprise: ["joy2", "kevin-surprised", "dos-cycy-surprised", "dos-kevin-shock"],
  pouces: ["cool", "kevin-smug", "dos-cycy-thumbs", "dos-kevin-thumbs"],
  theme: ["joy", "kevin-cheer", "dos-cycy-shy", "dos-kevin-glasses"],
  saut: ["joy2", "kevin-cheer", "dos-cycy-cheer", "dos-kevin-cheer"],
};

/** The stand-in of Cycy's or Kevin's sticker (null for anyone else). */
export function fallbackUrl(who, side, pose) {
  if (who !== "cycy" && who !== "kevin") return null;
  return `assets/cyrielle/${FALLBACK[pose][(who === "kevin" ? 1 : 0) + (side === "dos" ? 2 : 0)]}.webp`;
}

// a small car seen from the side, in the paper's colours, with its white sticker edge
const CAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><g stroke="#fff" stroke-width="10" stroke-linejoin="round"><path d="M18 108c0-22 10-30 34-34l40-34c10-8 22-12 38-12h62c22 0 38 10 52 30l18 18c16 2 22 12 22 32v8H18z" fill="#e7e1d6"/><circle cx="82" cy="116" r="22" fill="#4a4f5f"/><circle cx="226" cy="116" r="22" fill="#4a4f5f"/></g><path d="M104 48h40v30H76zM160 48h30c12 0 22 8 30 30h-60z" fill="#9fb6c8"/></svg>`;

/** A vehicle's stand-in: a plain silhouette (data:image/svg+xml). */
export const vehicleFallback = () => `data:image/svg+xml,${encodeURIComponent(CAR)}`;
