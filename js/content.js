// ─────────────────────────────────────────────────────────────
//  TOUS LES TEXTES DU SITE SONT ICI.
//  Tu peux modifier librement ce qui est entre guillemets.
//  ⚠️ Garde les guillemets, les virgules et les crochets.
//
//  {n} est remplacé automatiquement par le numéro du cadeau,
//  {score} par le nombre d'énigmes trouvées toute seule.
// ─────────────────────────────────────────────────────────────

export const content = {
  siteTitle: "Le Swap de Cyrielle",

  welcome: {
    // Petite ligne au-dessus du titre (ex : "Joyeux Noël 🎄"). Laisse "" pour ne rien afficher.
    occasion: "",
    title: "Bonjour Cyrielle ✨",
    signature: "",
    button: "Je suis prête ♥",
  },

  // Accueil animé : Mini Cyrielle arrive, se présente bulle par bulle, puis ouvre ses Monster Munch.
  // face = l'expression du sticker pendant la bulle (noms dans assets/cyrielle/, sans « .webp »).
  intro: {
    tap: "Touche l'écran pour commencer ✨",
    skip: "Passer l'intro",
    lines: [
      { face: "wink", text: "Coucou Cyrielle ! C'est moi… enfin, c'est toi 👋" },
      { face: "think", text: "Aujourd'hui, 7 cadeaux t'attendent. Chacun est caché derrière une énigme." },
      { face: "smirk", text: "On les ouvre dans l'ordre. Il y a des indices… mais je compte les points 😏" },
      { face: "surprised2", text: "Mais avant de commencer… il te faut des forces !" },
    ],
    // La bulle qui suit l'ouverture du paquet
    snack: { face: "munch-eat", text: "Ton paquet de Monster Munch t'attend, sers-toi 😋" },
  },

  timeline: {
    title: "Le Swap de Cyrielle",
    progress: "{done} / 7 cadeaux ouverts",
    active: "À toi de jouer",
    toOpen: "Ouvre ton paquet !",
    finalNode: "Un dernier mot",
  },

  ui: {
    // Messages quand la réponse est fausse (un au hasard à chaque fois)
    wrong: ["Presque… mais non 😏", "Tu chauffes ? Même pas.", "Essaie encore, je crois en toi."],
    // Messages quand elle trouve toute seule
    foundSelf: ["Trouvé toute seule, bravo !", "Rien ne t'échappe 👀"],
    // Message quand elle a cliqué sur « Voir la réponse »
    revealed: "La réponse était…",
    gift: "Cadeau n°{n}",
    hint: "Besoin d'un indice ? 👀",
    hintTitle: "Indice",
    showAnswer: "Voir la réponse",
    // Deuxième toucher demandé, pour ne pas dévoiler la réponse par erreur
    showAnswerConfirm: "Sûre ? Touche encore pour voir",
    submit: "Valider",
    across: "Horizontalement",
    down: "Verticalement",
    placeholder: "Ta réponse…",
    goOpen: "Allez, file ouvrir le paquet n°{n} !",
    opened: "J'ai ouvert mon cadeau ♥",
    close: "Fermer",
    soundOn: "Couper le son",
    soundOff: "Activer le son",
  },

  gifts: [
    {
      type: "free",
      title: "La Charade",
      lines: [
        "Mon premier peut faire beaucoup de bruit et exploser à tout moment.",
        "Mon deuxième est une préposition de deux lettres.",
        "Mon troisième est l'endroit parfait pour se détendre avec de l'eau chaude.",
        "Mon tout va transformer ta soirée.",
      ],
      // Réponses acceptées. Majuscules, accents et espaces sont ignorés.
      // Une liste entre crochets = tous ces mots doivent être présents.
      accept: ["bombe de bain", "lush", ["bombe", "bain"]],
      answer: "Un coffret Lush 🛁",
      reveal: "Une bombe de bain… et un pain moussant en bonus. Ce soir, c'est bain moussant !",
      short: "Coffret Lush",
      effect: "bubbles",
    },
    {
      type: "anagram",
      title: "L'Anagramme",
      lines: ["Remets ces lettres dans l'ordre pour découvrir ce qui t'attend :"],
      letters: ["A", "A", "J", "M", "P", "Y"],
      solution: "PYJAMA",
      hint: "C'est de loin notre tenue préférée pour chiller à la maison.",
      answer: "Un pyjama",
      reveal: "Le dress code officiel de nos soirées.",
      short: "Pyjama",
      effect: "moons",
    },
    {
      type: "crossword",
      title: "Les Mots Croisés",
      lines: ["Remplis la grille. Le mot doré, c'est ton cadeau ✨"],
      // Chaque mot : sa définition, sa case de départ (ligne et colonne, en comptant à partir de 0)
      // et son sens. Les définitions se modifient librement.
      // ⚠️ Si tu changes un MOT, les croisements ne tomberont plus juste : demande-moi de refaire
      // la grille (ou lance `npm test`, qui signale les erreurs).
      words: [
        { word: "CHOCOLAT", clue: "Ce qui fond à l'intérieur", row: 0, col: 0, dir: "horizontal" },
        { word: "COULEURS", clue: "Rouge, jaune, vert, bleu… j'en ai plein", row: 0, col: 0, dir: "vertical" },
        { word: "LETTRE", clue: "D'habitude, je n'en porte qu'une sur ma coquille", row: 0, col: 5, dir: "vertical" },
        { word: "ROND", clue: "Ma forme", row: 4, col: 5, dir: "horizontal" },
        { word: "NOUS", clue: "Cette fois, je suis à l'image de…", row: 4, col: 7, dir: "vertical" },
        { word: "UNIQUE", clue: "Dans cette boîte, je le suis au monde", row: 5, col: 0, dir: "horizontal" },
        { word: "MMS", clue: "Petit, croustillant et coloré, sans « & » ni apostrophe : qui suis-je ?", row: 7, col: 5, dir: "horizontal", golden: true },
      ],
      answer: "Nos M&M's personnalisés",
      reveal: "Uniques au monde, comme nous.",
      short: "M&M's personnalisés",
      effect: "candies",
    },
    {
      type: "free",
      title: "La Devinette",
      lines: [
        "À la base, je pousse sous terre.",
        "Les gens m'adorent en purée, en gratin ou en frites.",
        "Mais aujourd'hui, je suis toute douce et je suis là pour te donner le sourire et de la motivation tous les jours.",
        "Qui suis-je ?",
      ],
      accept: ["patate", "pomme de terre", "potato"],
      answer: "Une patate positive",
      reveal: "Ta dose de sourire et de motivation quotidienne 🥔",
      short: "Patate positive",
      effect: "potatoes",
    },
    {
      type: "blanks",
      title: "Le texte à trous",
      lines: ["Complète cette phrase avec les mots manquants :"],
      // Les mots à deviner sont écrits entre [crochets].
      // La première et la dernière lettre sont affichées, le reste est à trouver.
      sentence:
        "« Prépare tes talents de maquilleuse ! Tu vas devoir utiliser ces petits [STRASS] pour me les coller sur le visage et reproduire notre prochaine trend [TIKTOK] ! »",
      answer: "Des strass pour notre trend TikTok",
      reveal: "À tes pinceaux, artiste ✨",
      short: "Strass & trend TikTok",
      effect: "sparkles",
    },
    {
      type: "qcm",
      title: "Le QCM",
      lines: ["Que se cache-t-il dans ce (très) gros paquet ?"],
      options: [
        {
          label: "Un nouveau réchaud ultra-léger pour nos prochains bivouacs.",
          tease: "Un réchaud ? Je ne suis pas romantique à ce point-là ⛺",
        },
        {
          label: "Un énième pot de whey pour ma prise de masse.",
          tease: "Ça, c'est MON cadeau de rêve, pas le tien 💪😏",
        },
        {
          label: "Le graal absolu de la coiffure qui a retourné tous les réseaux sociaux.",
          correct: true,
        },
      ],
      answer: "Réponse C : une brosse soufflante Air Styler !",
      reveal: "Le graal de la coiffure 💨",
      short: "Brosse soufflante Air Styler",
      effect: "wind",
    },
    {
      type: "acrostic",
      title: "Le Code Secret",
      lines: [
        "Prends la toute première lettre de chaque mot de cette phrase pour découvrir ce que tu vas pouvoir enfiler :",
      ],
      phrase: "Même Avec Intensité, Les Lions Osent Triompher !",
      solution: "MAILLOT",
      hint: "Rassure-toi, ce n'est pas pour aller pousser en 2ème ligne sur le terrain le dimanche matin. C'est aux couleurs de l'UBB et ça a (presque) mon odeur.",
      answer: "Mon maillot de l'UBB !",
      reveal: "Rouge et bleu… et avec (presque) mon odeur 😏",
      short: "Maillot de l'UBB",
      effect: "rugby",
      // Mini Cyrielle sort son drapeau à la révélation
      revealFace: "ubb-flag",
    },
  ],

  // Coupure pub (téléachat parodique), une seule fois, juste après le cadeau n° afterGift.
  // ⚠️ Les arguments ne doivent pas dévoiler les cadeaux suivants.
  pub: {
    afterGift: 4,
    card: "Publicité",
    problem: "Marre des cadeaux banals ?",
    problem2: "Des chaussettes… ENCORE ? 🧦",
    badge: "Nouveau !",
    product: "Le Swap™",
    features: [
      "7 cadeaux surprises",
      "7 énigmes (pas trop dures… enfin presque)",
      "Monster Munch inclus",
      "Déjà livrés : coffret Lush, pyjama, M&M's, patate positive",
      "3 surprises encore à venir 👀",
    ],
    quote: "« J'ai pleuré de joie. »",
    quoteBy: "— Cyrielle, cliente 100 % satisfaite",
    wait: "Mais attendez…",
    wait2: "… ce n'est pas tout !",
    offer: "Pour toute commande aujourd'hui : un copain OFFERT !",
    prices: ["999 €", "99 €", "9,99 €"],
    free: "Gratuit ♥",
    fine: "*Offre réservée à Cyrielle. Câlins non remboursables. Bisous non échangeables. Voir conditions auprès du vendeur.",
    cta: "☎ Je commande !",
    ordered: "Commande validée ✔",
    back: "▶ Reprise du programme",
    skipIn: "Passer la pub dans {s}",
    skip: "Passer la pub ▸",
    skipNope: "Bien essayé 😏",
    play: "▶ Lancer la pub",
  },

  // Bonus après le 7e cadeau, juste avant le mot final (une seule fois)
  bonus: {
    eyebrow: "Bonus",
    wait: "Attends… il en reste un !",
    tap: "Secoue la boîte : touche-la 3 fois",
    answer: "Des Nerds ! 🍬",
    reveal: "Pour finir sur une note sucrée (et qui croustille).",
    go: "Va vite chercher ton dernier paquet !",
    button: "Lire mon dernier mot ♥",
  },

  // Débrief à embranchements (bouton sur l'écran final) : chaque réponse change la suite.
  // nodes = les questions ; next = l'id de la question suivante OU d'une fin (endings).
  // face = sticker de Mini Cyrielle (noms dans assets/cyrielle/).
  // effect = bubbles, moons, candies, sparkles, wind, rugby, hearts ou confetti.
  debrief: {
    button: "🎙 Le débrief de Mini Cyrielle ▸",
    intro: { face: "wink", text: "Petit débrief avant de se quitter ? Réponds franchement : chaque réponse change la suite…" },
    pathChosen: "Chemin choisi",
    endLabel: "Fin {n} / {total}",
    found: "Fins découvertes : {found} / {total}",
    replay: "Rejouer le débrief",
    back: "Revoir le parcours",
    start: "verdict",
    nodes: {
      verdict: {
        face: "think",
        text: "Alors, verdict de ce swap ?",
        choices: [
          { label: "Génial, j'ai adoré !", next: "favorite" },
          { label: "Bien… mais j'ai des remarques", next: "remarks" },
        ],
      },
      favorite: {
        face: "joy2",
        text: "Trop bien ! Et ton cadeau préféré, c'est lequel ?",
        choices: [
          { label: "Le coffret Lush et le pyjama", next: "tonight" },
          { label: "Le maillot de l'UBB", next: "match" },
          { label: "Les M&M's perso", next: "gourmande" },
        ],
      },
      tonight: {
        face: "smirk",
        text: "Je m'en doutais… Alors ce soir : bain ou film ?",
        choices: [
          { label: "Les deux, évidemment", next: "cocooning" },
          { label: "Dodo direct", next: "marmotte" },
        ],
      },
      match: {
        face: "ubb-cap",
        text: "Tu le portes au prochain match ?",
        choices: [
          { label: "Évidemment, allez l'UBB !", next: "supportrice" },
          { label: "Je vais surtout dormir dedans", next: "pyjama-ubb" },
        ],
      },
      remarks: {
        face: "pout2",
        text: "Ah… Dis-moi tout : qu'est-ce qui t'a le moins plu ?",
        choices: [
          { label: "Les énigmes, trop dures !", next: "difficulty" },
          { label: "La pub, trop longue", next: "premium" },
          { label: "Rien, je te taquine 😏", next: "taquine" },
        ],
      },
      difficulty: {
        face: "think2",
        text: "La prochaine fois, je les fais plus faciles ou plus dures ?",
        choices: [
          { label: "Plus faciles, pitié", next: "facile" },
          { label: "Plus dures : je veux ma revanche", next: "revanche" },
        ],
      },
    },
    // n = numéro affiché (« Fin 3 / 9 »)
    endings: {
      cocooning: {
        n: 1,
        title: "Cocooning total",
        face: "kiss2",
        effect: "bubbles",
        text: "Bain moussant avec ton coffret Lush, pyjama tout doux, un film sous le plaid et les M&M's à portée de main. Programme validé ♥",
      },
      marmotte: {
        n: 2,
        title: "La marmotte",
        face: "sleep2",
        effect: "moons",
        text: "Pyjama enfilé, lumière éteinte, dodo bien mérité. Les énigmes, ça fatigue 😴",
      },
      supportrice: {
        n: 3,
        title: "Supportrice officielle",
        face: "ubb-flag",
        effect: "rugby",
        text: "Maillot sur le dos, drapeau à la main : l'UBB a une nouvelle supportrice. Allez l'UBB !",
      },
      "pyjama-ubb": {
        n: 4,
        title: "Le pyjama UBB",
        face: "ubb-cap-scarf",
        effect: "moons",
        text: "Un maillot qui sent (presque) moi, pour dormir : c'est encore mieux qu'un pyjama 💤",
      },
      gourmande: {
        n: 5,
        title: "La gourmande",
        face: "munch-eat",
        effect: "candies",
        text: "M&M's, Monster Munch, Nerds… On sait maintenant ce que tu préfères vraiment 🍬",
      },
      facile: {
        n: 6,
        title: "Mode facile activé",
        face: "sushi-happy",
        effect: "sparkles",
        text: "Promis, le prochain swap sera en mode facile. Avec des indices partout. Et des sushis.",
      },
      revanche: {
        n: 7,
        title: "La revanche",
        face: "angry2",
        effect: "wind",
        text: "Défi accepté. Le prochain swap sera bien plus corsé… Prépare-toi ⚔️",
      },
      premium: {
        n: 8,
        title: "Abonnement Premium",
        face: "surprised3",
        effect: "confetti",
        text: "Trop tard : tu viens de souscrire à LE SWAP™ Premium. Publicités illimitées, à vie 📺",
      },
      taquine: {
        n: 9,
        title: "La taquine",
        face: "smirk",
        effect: "hearts",
        text: "Je le savais : tu as adoré du début à la fin. Et moi, je t'aime 😏♥",
      },
    },
    // Page ?debrief (pour toi)
    report: {
      title: "Le débrief de Cyrielle",
      empty: "Pas encore de débrief : il apparaîtra ici quand elle aura joué.",
      run: "Partie {n}",
      ending: "Fin obtenue",
      endings: "Fins découvertes",
      play: "▶ Lancer le débrief",
    },
  },

  final: {
    eyebrow: "7 cadeaux ouverts",
    title: "Et voilà 🎉",
    body: [
      "Coffret Lush, pyjama, M&M's, patate positive, strass, brosse soufflante et maillot de l'UBB : tu as maintenant tout ce qu'il faut pour une soirée parfaite… avec moi, évidemment.",
      "Merci d'être toi. Je t'aime.",
    ],
    signature: "",
    recapTitle: "Tes 7 cadeaux",
    foundBadge: "trouvé seule",
    // Phrase de score selon le nombre d'énigmes trouvées sans « Voir la réponse »
    score: {
      all: "7 sur 7 toute seule. Impossible de te cacher quoi que ce soit, tu me connais par cœur.",
      high: "{score} énigmes sur 7 trouvées toute seule. Pas mal du tout ✨",
      low: "{score} sur 7… Disons que mes énigmes étaient très (trop ?) bien ficelées 😏",
      none: "0 sur 7 ? Pas grave, l'important c'est les cadeaux 😇",
    },
    replay: "Revoir le parcours",
  },
};
