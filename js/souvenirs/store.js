// The souvenirs store: one interface, two backends. Supabase once js/souvenirs-config.js is filled in; a fake local
// one for the tests and demos (?souvenirs=fake, &device=x to play another phone); none before: the panel stays as
// it was.
//
// Store: deviceId · isUnlocked() · unlock(code) (rejects "bad-code" | "network") · list(matchDate) (rejects "locked")
// · counts() · addMedia(matchDate, file, { author, onProgress }) · addNote(matchDate, text, { author })
// · remove(item) · subscribe(matchDate, onChange({ type: "insert", item } | { type: "delete", id })) → unsubscribe
import { config } from "../souvenirs-config.js";

const DEVICE_KEY = "swap-cyrielle:device";

/** "fake", "supabase" or null. */
export function pickBackend({ search, config }) {
  if (new URLSearchParams(search).get("souvenirs") === "fake") return "fake";
  return config.url && config.anonKey ? "supabase" : null;
}

/** This phone's random id: what « added from this phone » means. */
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) localStorage.setItem(DEVICE_KEY, (id = crypto.randomUUID()));
    return id;
  } catch {
    return ""; // storage blocked: nothing can be deleted from here, that's all
  }
}

let store = null; // the promise: two calls at once share one store (one Supabase client per page)

/** The store, built once per page load; null while nothing is configured. A failed build is tried again. */
export function createStore() {
  store ??= build().catch((error) => {
    store = null;
    throw error;
  });
  return store;
}

async function build() {
  const kind = pickBackend({ search: location.search, config });
  if (!kind) return null;
  const device = (kind === "fake" && new URLSearchParams(location.search).get("device")) || deviceId();
  return kind === "fake"
    ? (await import("./fake.js")).createFakeStore({ deviceId: device })
    : (await import("./supabase.js")).createSupabaseStore(config, device);
}
