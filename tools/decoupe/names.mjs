// What the cut stickers are called (spec § 7): the 12 poses of a person, the 12 views of a vehicle, the board file names.
// Pure: no files, runs under Node.

/** The 12 poses of a person's board, in the order of the board. */
export const POSES = ["joie", "colere", "pleurs", "boude", "question", "sommeil", "bisou", "peace", "surprise", "pouces", "theme", "saut"];

/** The 12 views of a vehicle's board, in the order of the board. */
export const VIEWS = ["trois-quarts", "face", "trois-quarts-pleurs", "arriere", "profil", "arriere-dodo", "coeurs", "phares", "alerte", "roule", "brille", "paysage"];

/** Vehicle boards (file name without .png) and the name their stickers carry. */
export const VEHICLES = { "Seat Ibiza": "seat", "C3": "c3", "308": "308", Kangoo: "kangoo", Flixbus: "flixbus", "Avion Volotea": "avion" };

/** Boards folders that do not carry the id of their outing. */
export const FOLDERS = { hockey: "boxers", "airbnb-1": "airbnb", paris: "paris-1" };

/** The outing id of a boards folder. */
export const outingOf = (folder) => FOLDERS[folder] ?? folder;

/** Lowercase, no accents, anything else but letters and digits turned into single hyphens. */
export const slug = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** « Cycy de face.png » → { who: "cycy", side: "face" }. A variant, a scene board or any other name → null. */
export function boardOf(fileName) {
  const m = /^([\p{L}\p{N}][\p{L}\p{N} ]*) de (face|dos)\.png$/u.exec(fileName);
  return m ? { who: slug(m[1]), side: m[2] } : null;
}

/** The 12 files of a board, in the order of the board, relative to assets/aventures/. A person's board is
 *  { outing, who, side }; a vehicle's is { vehicle }. */
export function fileNames(board) {
  if (board.vehicle) return VIEWS.map((view) => `vehicules/${board.vehicle}-${view}.webp`);
  return POSES.map((pose) => `${board.outing}/${board.who}-${board.side}-${pose}.webp`);
}
