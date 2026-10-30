// Progress storage. ?demo → nothing is saved; ?reset → saved progress is wiped.
import { initialProgress, sanitize } from "./logic.js";
import { demoProgress, sanitizeProgress } from "./aventures/logic.js";

const KEY = "swap-cyrielle:v1";
const SOUND_KEY = "swap-cyrielle:muted";
const DEBRIEF_KEY = "swap-cyrielle:debrief";
const AVENTURES_KEY = "swap-cyrielle:aventures";

const params = new URLSearchParams(location.search);
export const isDemo = params.has("demo");
const demoTampon = params.get("tampon"); // ?demo&tampon=<id>: the passport at the moment of that stamp
const demoWelcome = params.has("accueil"); // ?demo&accueil: a first visit, Mini Cycy's welcome
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

/** Whether it was written. */
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch {
    return false; /* private mode or blocked storage: progress just won't survive a reload */
  }
}

if (params.has("reset")) {
  write(KEY, null);
  write(DEBRIEF_KEY, null);
  write(AVENTURES_KEY, null);
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

// The passport's progress when it is not stored (?demo, blocked or full storage): kept as long as the page lives
let memo = null;

/** The passport's progress. ?demo → every outing stamped, or those before ?tampon=<id> whose stamp waits, or (with
 *  &accueil) a first visit; then what the visit has done since. */
export function loadAventures(aventures) {
  const ids = aventures.map((a) => a.id);
  if (memo) return sanitizeProgress(memo, ids);
  if (isDemo) return demoProgress(aventures, demoTampon, demoWelcome);
  try {
    return sanitizeProgress(JSON.parse(read(AVENTURES_KEY)), ids);
  } catch {
    return sanitizeProgress(null, ids);
  }
}

/** Nothing is saved in ?demo; there, or when storage fails, the page keeps it (a reload starts over). */
export function saveAventures(progress) {
  memo = isDemo || !write(AVENTURES_KEY, JSON.stringify(progress)) ? progress : null;
}

const HUB_KEY = "swap-cyrielle:hub";

/** The hub's last card (a world id); the Swap the first time. */
export function loadHubCard() {
  return read(HUB_KEY) || "swap";
}

export function saveHubCard(world) {
  write(HUB_KEY, world);
}

const FOLD_KEY = "swap-cyrielle:fold";

/** Leaving a world by reloading the page (the swap): which card the hub's plate folds back into once reloaded. */
export function setFold(world) {
  try {
    sessionStorage.setItem(FOLD_KEY, world);
  } catch {
    /* blocked storage: the hub simply opens without the fold */
  }
}

/** The world to fold back into, read once (null if none). */
export function takeFold() {
  try {
    const world = sessionStorage.getItem(FOLD_KEY);
    sessionStorage.removeItem(FOLD_KEY);
    return world;
  } catch {
    return null;
  }
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
