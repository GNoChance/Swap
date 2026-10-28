// Progress storage. ?demo → nothing is saved; ?reset → saved progress is wiped.
import { initialProgress, sanitize } from "./logic.js";

const KEY = "swap-cyrielle:v1";
const SOUND_KEY = "swap-cyrielle:muted";
const DEBRIEF_KEY = "swap-cyrielle:debrief";

const params = new URLSearchParams(location.search);
export const isDemo = params.has("demo");
// ?rejouer (« Tout rejouer depuis le début » on the home page): the swap from the start, gifts unlocking one by one
// as the first time, but nothing is saved: her progress and her debrief answers stay as they were.
export const isReplay = params.has("rejouer");
const transient = isDemo || isReplay;
let replayDebrief = { runs: [], found: [] }; // in replay, the debrief keeps its endings for the session only

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: progress just won't survive a reload */
  }
}

if (params.has("reset")) {
  write(KEY, null);
  write(DEBRIEF_KEY, null);
  params.delete("reset");
  const query = params.toString();
  history.replaceState(null, "", location.pathname + (query ? `?${query}` : "") + location.hash);
}

export function loadProgress() {
  if (transient) return initialProgress();
  try {
    return sanitize(JSON.parse(read(KEY)));
  } catch {
    return initialProgress();
  }
}

export function saveProgress(progress) {
  if (!transient) write(KEY, JSON.stringify(progress));
}

export function loadMuted() {
  return read(SOUND_KEY) === "1";
}

export function saveMuted(muted) {
  write(SOUND_KEY, muted ? "1" : "0");
}

/** Her debrief answers ({ runs, found }), kept for you to read at ?debrief. Nothing is saved in ?demo. */
export function loadDebrief() {
  if (isReplay) return replayDebrief;
  try {
    return JSON.parse(read(DEBRIEF_KEY)) || { runs: [], found: [] };
  } catch {
    return { runs: [], found: [] };
  }
}

export function saveDebrief(store) {
  if (isReplay) replayDebrief = store;
  else if (!isDemo) write(DEBRIEF_KEY, JSON.stringify(store));
}
