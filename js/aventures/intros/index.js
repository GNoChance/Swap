// The outings that have their own intro (spec § 4): { [id]: { load, beats } }. load() imports its scenario, a module
// with mount(host, { aventure, ink }) → { timeline (paused), ready, dispose }; beats are its moments ({ name, at } in s).
// An outing not listed plays the provisional intro (provisoire.js). No static import: Node reads the list.
export const SCENARIOS = {};
