// Shared souvenirs (« En savoir plus »): the rules, pure so they run under Node. What may be sent, how big, where it
// goes in the storage, in which order it shows.

export const MAX_BYTES = 52428800; // 50 MB: Supabase's free plan, per file
export const NOTE_MAX = 500;
export const NAME_MAX = 40;
const VIDEO_TYPES = { "video/mp4": "mp4", "video/quicktime": "mov" };

/** A photo (any image: it is shrunk to a JPEG before sending), a video up to 50 MB, or an error. */
export function checkFile({ type, size }) {
  if (/^image\//.test(type)) return { kind: "photo" };
  if (!VIDEO_TYPES[type]) return { error: "not-media" };
  return size > MAX_BYTES ? { error: "too-big" } : { kind: "video" };
}

/** Characters as she sees them: an emoji counts for one. */
export const noteLength = (text) => [...text].length;

export function checkNote(raw) {
  const text = String(raw).trim();
  if (!text) return { error: "empty" };
  return noteLength(text) > NOTE_MAX ? { error: "too-long" } : { text };
}

export function checkName(raw) {
  const name = String(raw).trim();
  if (!name) return { error: "empty" };
  return noteLength(name) > NAME_MAX ? { error: "too-long" } : { name };
}

/** w × h shrunk to fit max on its longest side; never enlarged. */
export function fitWithin(w, h, max) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

/** Where a souvenir's files go in the storage bucket (a note has none). */
export function storagePaths(matchDate, id, kind, type) {
  if (kind === "note") return { path: null, thumb: null };
  const thumb = `${matchDate}/${id}-thumb.jpg`;
  if (kind === "photo") return { path: `${matchDate}/${id}-full.jpg`, thumb };
  return { path: `${matchDate}/${id}.${VIDEO_TYPES[type] || "mp4"}`, thumb };
}

/** Oldest first; same instant: by id, so every phone shows the same order. */
export function sortItems(items) {
  return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

/** Added from this phone (its random device id): only then can it be deleted here. */
export const isMine = (item, deviceId) => Boolean(deviceId) && item.device === deviceId;

/** Photos and videos per match, for « En savoir plus · n » (notes don't count). */
export function countByMatch(rows) {
  const counts = {};
  for (const row of rows) if (row.kind !== "note") counts[row.match_date] = (counts[row.match_date] || 0) + 1;
  return counts;
}
