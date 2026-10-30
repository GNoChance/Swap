// Our outings, in date order: one stamp each in the passport (assets/aventures/tampons/<id>.svg, same name).
// Each says how it was travelled (transports, in order) and who came along (people: Cycy and Kevin are always there);
// an outing with its own intro (intros/index.js) also has its place, written large on the intro's poster (lieu), and if
// its intro opens on a map, its trip (trajet): the names written at the start and on the way, and the road's real
// points [lat, lon] from the start to the arrival (the lieu).
export const TRANSPORTS = ["seat", "c3", "308", "kangoo", "flixbus", "camping-car", "avion", "bus", "pied", "velo", "canoe", "train"];
export const PEOPLE = ["nini", "dede", "caro", "marius", "manon", "noe", "fabus", "doumi", "elodie", "paolo", "paolina", "pierre", "paul", "jeanne", "jennifer"];

export const AVENTURES = [
  {
    id: "bivouac-1",
    name: "Premier bivouac",
    from: "2025-05-17",
    to: "2025-05-18",
    transports: ["seat", "pied"],
    people: [],
    lieu: "Lacs d'Ayous",
    trajet: {
      depart: "Bordeaux",
      etapes: ["Pau"],
      // [lat, lon]: Bordeaux, Langon, Captieux, Roquefort, Aire-sur-l'Adour, Pau, Gan, Rébénacq, Louvie-Juzon, Laruns, Gabas, Bious-Artigues
      points: [[44.837, -0.579], [44.553, -0.249], [44.291, -0.262], [44.034, -0.322], [43.701, -0.263], [43.295, -0.370],
        [43.231, -0.387], [43.158, -0.396], [43.087, -0.420], [42.988, -0.426], [42.889, -0.429], [42.873, -0.466]],
    },
  },
  { id: "canoe", name: "Premier canoë · Dordogne", from: "2025-08-11", to: "2025-08-11", transports: ["c3", "canoe"], people: [] },
  { id: "ile-de-re", name: "Île de Ré", from: "2025-08-17", to: "2025-08-18", transports: ["c3", "velo"], people: [] },
  { id: "marqueze", name: "Marquèze", from: "2025-08-22", to: "2025-08-22", transports: ["c3", "train"], people: [] },
  { id: "airbnb", name: "Premier Airbnb", from: "2025-09-21", to: "2025-09-21", transports: ["c3"], people: [] },
  { id: "boxers", name: "Boxers de Bordeaux", from: "2025-10-03", to: "2025-10-03", transports: ["pied"], people: [] },
  { id: "paris-1", name: "Paris", from: "2025-11-11", to: "2025-11-11", transports: ["flixbus"], people: [] },
  { id: "paris-2", name: "Paris, le retour", from: "2025-12-09", to: "2025-12-09", transports: ["flixbus"], people: [] },
  { id: "sardaigne", name: "Sardaigne", from: "2025-12-29", to: "2026-01-05", transports: ["avion", "bus"], people: [] },
  { id: "dordogne-1-an", name: "Nos 1 an en Dordogne", from: "2026-04-17", to: "2026-04-19", transports: ["308"], people: [] },
  { id: "bivouac-2", name: "Deuxième bivouac", from: "2026-07-04", to: "2026-07-05", transports: ["308", "pied"], people: ["nini"] },
  { id: "royan-1", name: "Royan", from: "2026-07-12", to: "2026-07-12", transports: ["308"], people: [] },
  {
    id: "royan-2",
    name: "Royan, la bande",
    from: "2026-08-01",
    to: "2026-08-01",
    transports: ["308"],
    people: ["dede", "nini", "caro", "marius", "manon", "noe"],
  },
  { id: "roadtrip", name: "Roadtrip catalan", from: "2026-08-10", to: "2026-08-14", transports: ["kangoo"], people: [] },
  {
    id: "espelette",
    name: "Fête du piment · Espelette",
    from: "2026-10-23",
    to: "2026-10-25",
    transports: ["camping-car"],
    people: ["fabus", "doumi", "elodie", "paolo", "paolina", "pierre", "paul", "jeanne", "jennifer"],
  },
];
