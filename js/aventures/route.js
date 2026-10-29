// The rule of an outing's address (#/aventures/<id>), in one place. main.js imports it statically, to put a refused
// address back on #/aventures before screen.js is loaded; the passport's screen, to stay on screen for it.
import { loadAventures } from "../state.js";
import { AVENTURES } from "./data.js";
import { openable } from "./logic.js";

/** An outing's address whose intro cannot play (locked, its stamp waiting, unknown). */
export function refused(route) {
  return route.world === "aventures" && Boolean(route.id) && !openable(AVENTURES, loadAventures(AVENTURES), route.id);
}
