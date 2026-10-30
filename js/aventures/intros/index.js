// The outings that have their own intro (spec § 4): { [id]: { load, beats } }. load() imports its scenario, a module
// with mount(host, { aventure, ink }) → { timeline (paused), ready, dispose }; ready is a Promise that resolves (never
// rejects) once it can play; beats are its moments ({ name, at } in s).
// An outing not listed plays the provisional intro (provisoire.js). No static import: Node reads the list.
export const SCENARIOS = {
  "bivouac-1": {
    load: () => import("./bivouac-1.js"),
    beats: [
      { name: "La carte", at: 0 },
      { name: "Le parking", at: 3.3 },
      { name: "En haut", at: 4.3 },
      { name: "L'affiche", at: 5.8 },
    ],
  },
};
