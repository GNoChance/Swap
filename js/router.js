// The portal's addresses, after a #: #/ the hub, #/swap, #/ubb, #/aventures, #/aventures/<id>. A # needs no rewrite
// rule on Vercel and keeps every relative path of the site valid. The pure part (read, write, the old ?musee link)
// runs under Node; createRouter wires it to the browser's history.
const WORLDS = ["swap", "ubb", "aventures"];
const hub = () => ({ world: "hub", id: null });

/** The world an address opens ({ world, id }); anything unknown is the hub. */
export function parseRoute(hash) {
  const path = hash.replace(/^#\/?/, "").replace(/\/$/, "").toLowerCase();
  if (!path) return hub();
  const [world, id, ...rest] = path.split("/");
  if (!WORLDS.includes(world) || rest.length) return hub();
  if (id === undefined) return { world, id: null };
  return world === "aventures" && /^[a-z0-9-]+$/.test(id) ? { world, id } : hub();
}

/** The address of a route: the inverse of parseRoute. */
export function routeHash({ world, id }) {
  return world === "hub" ? "#/" : `#/${world}${id ? `/${id}` : ""}`;
}

/** ?musee (the gallery's address before the portal) → #/ubb, keeping the other parameters; null otherwise. */
export function legacyRedirect(search) {
  const parts = search.replace(/^\?/, "").split("&").filter(Boolean);
  const kept = parts.filter((p) => p.split("=")[0] !== "musee");
  if (kept.length === parts.length) return null;
  return { search: kept.length ? `?${kept.join("&")}` : "", hash: "#/ubb" };
}

/** onRoute(route, previous) runs at start (previous = null), on go(), replace(), and on the browser's back and forward.
 *  back() steps back in history when we came from inside the portal, or else goes to the hub without leaving the
 *  site (a link opened straight on a world); a second back() before the browser has stepped back (a double tap) is
 *  ignored. replace() rewrites the address in place (no new entry), and the entry stays one of the portal's or not. */
export function createRouter(onRoute) {
  let route = parseRoute(location.hash);
  let stepping = 0; // a history.back() under way, until its popstate (or 1 s, if none ever comes)
  const arrive = (next) => {
    const previous = route;
    route = next;
    onRoute(next, previous);
  };
  return {
    current: () => route,
    go(next) {
      history.pushState({ portail: true }, "", routeHash(next));
      arrive(next);
    },
    replace(next) {
      history.replaceState({ portail: history.state?.portail ?? false }, "", routeHash(next));
      arrive(next);
    },
    back() {
      if (history.state?.portail) {
        if (stepping) return;
        stepping = setTimeout(() => (stepping = 0), 1000);
        return history.back();
      }
      history.replaceState(null, "", routeHash(hub()));
      arrive(hub());
    },
    start() {
      route = parseRoute(location.hash); // the address may have been rewritten since (?musee → #/ubb)
      addEventListener("popstate", () => {
        clearTimeout(stepping);
        stepping = 0;
        arrive(parseRoute(location.hash));
      });
      onRoute(route, null);
    },
  };
}
