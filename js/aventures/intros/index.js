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
      { name: "La montée", at: 4.3 },
      { name: "En haut", at: 7.1 },
      { name: "La descente", at: 10.1 },
      { name: "La voiture", at: 13.1 },
      { name: "L'affiche", at: 15.4 },
    ],
  },
  canoe: {
    load: () => import("./canoe.js"),
    beats: [
      { name: "La carte", at: 0 },
      { name: "La mise à l'eau", at: 5 },
      { name: "Les ronds dans l'eau", at: 7 },
      { name: "La descente", at: 11 },
      { name: "Le coin perdu", at: 15 },
      { name: "Le plouf", at: 18 },
      { name: "L'arrivée", at: 21.2 },
      { name: "Sarlat", at: 23.2 },
      { name: "La Roque-Gageac", at: 26.2 },
      { name: "L'affiche", at: 28.6 },
    ],
  },
  "ile-de-re": {
    load: () => import("./ile-de-re.js"),
    beats: [
      { name: "La carte", at: 0 },
      { name: "Le pont", at: 4.5 },
      { name: "En selle", at: 7.5 },
      { name: "La traversée", at: 9.5 },
      { name: "Le phare", at: 15 },
      { name: "La glace", at: 18 },
      { name: "Le retour", at: 20.5 },
      { name: "La Rochelle", at: 23 },
      { name: "La côte", at: 26.5 },
      { name: "L'affiche", at: 28.6 },
    ],
  },
};
