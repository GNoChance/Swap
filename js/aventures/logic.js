// The passport's rules (spec § 4): the outings' states, the pages, the dates. Pure: no DOM, no storage, runs under Node.
// progress (saved as swap-cyrielle:aventures): { stamped: [ids], pending: [ids], welcomed, known: [ids], page }
// pending = lived, its stamp still to set; known = the outings already shown, to spot the ones added since.

const PER_PAGE = 2; // stamps per passport page
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function initialProgress() {
  return { stamped: [], pending: [], welcomed: false, known: [], page: 0 };
}

/** Repair a save (damaged, old, or from before an outing was added or removed): known ids only, no duplicates. */
export function sanitizeProgress(raw, ids) {
  const valid = new Set(ids);
  const list = (value) => (Array.isArray(value) ? [...new Set(value.filter((id) => valid.has(id)))] : []);
  const stamped = list(raw?.stamped);
  const page = raw?.page;
  return {
    stamped,
    pending: list(raw?.pending).filter((id) => !stamped.includes(id)), // both: the stamp is on
    welcomed: raw?.welcomed === true,
    known: list(raw?.known),
    page: Number.isInteger(page) && page >= 0 ? page : 0,
  };
}

const compare = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/** The outings by start date, then by id (a sorted copy: the list passed in is left as it is). */
function ordered(aventures) {
  return [...aventures].sort((x, y) => compare(x.from, y.from) || compare(x.id, y.id));
}

/** [id, status] in passport order. One thing at a time: the oldest outing without a stamp is open,
 *  unless a stamp is waiting. */
function rows(aventures, progress) {
  const stamped = new Set(progress.stamped);
  const pending = new Set(progress.pending);
  const list = ordered(aventures).map((x) => [x.id, stamped.has(x.id) ? "stamped" : pending.has(x.id) ? "pending" : "locked"]);
  if (!list.some(([, status]) => status === "pending")) {
    const first = list.find(([, status]) => status === "locked");
    if (first) first[1] = "open";
  }
  return list;
}

/** { id: "stamped" | "pending" (lived, stamp to set) | "open" (the next one to live) | "locked" }. */
export function statuses(aventures, progress) {
  return Object.fromEntries(rows(aventures, progress));
}

/** The outing to deal with now: the one whose stamp waits, else the open one; null once every stamp is on. */
export function nextToLive(aventures, progress) {
  const list = rows(aventures, progress);
  const row = list.find(([, status]) => status === "pending") || list.find(([, status]) => status === "open");
  return row ? row[0] : null;
}

/** Its intro seen through: the open outing waits for its stamp. Anything else: unchanged, same object. */
export function live(aventures, progress, id) {
  if (statuses(aventures, progress)[id] !== "open") return progress;
  return { ...progress, pending: [...progress.pending, id] };
}

/** The stamp is on: the waiting outing is stamped, which opens the next one. Anything else: unchanged, same object. */
export function stamp(aventures, progress, id) {
  if (statuses(aventures, progress)[id] !== "pending") return progress;
  return { ...progress, stamped: [...progress.stamped, id], pending: progress.pending.filter((x) => x !== id) };
}

/** Every outing stamped: the passport is free. */
export function isComplete(aventures, progress) {
  return rows(aventures, progress).every(([, status]) => status === "stamped");
}

/** Whether an outing's intro can play: the open one and the stamped ones. */
export function openable(aventures, progress, id) {
  const status = statuses(aventures, progress)[id];
  return status === "open" || status === "stamped";
}

/** The outings added since the last visit (not in known), once Mini Cycy has welcomed us. */
export function addedSince(aventures, progress) {
  if (!progress.welcomed) return [];
  const seen = new Set([...progress.known, ...progress.stamped, ...progress.pending]); // a lived outing is never "new"
  return ordered(aventures)
    .map((x) => x.id)
    .filter((id) => !seen.has(id));
}

/** ?demo: every outing stamped; with ?tampon=<id>, those before it stamped and its stamp waiting (unknown id: all stamped);
 *  with &accueil (welcome), a first visit, whatever the ?tampon. */
export function demoProgress(aventures, tamponId = null, welcome = false) {
  if (welcome) return initialProgress();
  const ids = ordered(aventures).map((x) => x.id);
  const at = ids.indexOf(tamponId);
  return {
    ...initialProgress(),
    stamped: at < 0 ? ids : ids.slice(0, at),
    pending: at < 0 ? [] : [tamponId],
    welcomed: true,
    known: [...ids],
  };
}

/** The identity page, two stamps a page in date order, then « Prochaine destination ? ». */
export function passportPages(aventures) {
  const ids = ordered(aventures).map((x) => x.id);
  const stamps = [];
  for (let i = 0; i < ids.length; i += PER_PAGE) stamps.push({ kind: "stamps", ids: ids.slice(i, i + PER_PAGE) });
  return [{ kind: "identity" }, ...stamps, { kind: "next" }];
}

/** The page an outing's stamp is on; 0 (the identity page) for an unknown id. */
export function pageOf(aventures, id) {
  const index = ordered(aventures).findIndex((x) => x.id === id);
  return index < 0 ? 0 : 1 + Math.floor(index / PER_PAGE);
}

// ── Dates: "YYYY-MM-DD" is split by hand, no Date, so no timezone can shift the day ──

function parts(iso) {
  const [year, month, day] = iso.split("-");
  return { year, month: MONTHS[Number(month) - 1], day: Number(day) === 1 ? "1er" : Number(day) }; // « 1er août »
}

/** "17–18 mai 2025", "30 avril – 2 mai 2026", "29 décembre 2025 – 5 janvier 2026"; one day: "11 août 2025". */
export function formatRange(from, to) {
  const f = parts(from);
  const t = parts(to);
  if (f.year !== t.year) return `${f.day} ${f.month} ${f.year} – ${t.day} ${t.month} ${t.year}`;
  if (f.month !== t.month) return `${f.day} ${f.month} – ${t.day} ${t.month} ${t.year}`;
  if (f.day !== t.day) return `${f.day}–${t.day} ${t.month} ${t.year}`;
  return `${t.day} ${t.month} ${t.year}`;
}

/** "2025-05-17" → "17/05/2025". */
export function shortDate(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** "2025-05-17" → "mai 2025". */
export function monthYear(iso) {
  const { year, month } = parts(iso);
  return `${month} ${year}`;
}
