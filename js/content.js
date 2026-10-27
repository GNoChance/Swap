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
      { face: "think", text: "Aujourd'hui, 9 cadeaux t'attendent. Chacun est caché derrière une énigme." },
      { face: "smirk", text: "On les ouvre dans l'ordre. Il y a des indices… mais je compte les points 😏" },
      { face: "surprised2", text: "Mais avant de commencer… il te faut des forces !" },
    ],
    // Elle choisit son paquet : la suite de l'intro (stickers, chips) suit son choix.
    // Stickers : hold = elle revient avec, hug = câlin au paquet, tear = elle l'ouvre, wow = ouvert,
    // bite = elle croque, eat = pendant la dernière bulle (text).
    // Sur le chemin : nibble = elle grignote quand on ne touche à rien, playFaces = quand on la touche,
    // empty = paquet vide après le dernier cadeau.
    snackQuestion: { face: "think", text: "Plutôt Monster Munch ou Brets ?" },
    // Elle part chercher le paquet (text), sort de l'écran et revient avec (back)
    fetch: { face: "wink", text: "Ok ça marche, je reviens !", back: "Et voilà !" },
    // Le bouton pour ouvrir le paquet (les chips volent partout et restent en tas jusqu'à « Je suis prête »)
    open: "On ouvre ? 😋",
    snacks: [
      {
        id: "munch",
        name: "Monster Munch",
        label: "Monster Munch 🐾",
        hold: "munch-hold",
        hug: "munch-hug",
        tear: "munch-tear",
        wow: "munch-wow",
        bite: "munch-bite",
        eat: "munch-crumbs",
        nibble: ["munch-dig", "munch-taste", "munch-cozy"],
        playFaces: ["munch-taste", "munch-think", "munch-mess"],
        empty: "munch-sad",
        text: "Ton paquet de Monster Munch t'attend, sers-toi 😋",
      },
      {
        id: "brets",
        name: "Brets",
        label: "Brets miel moutarde 🍯",
        hold: "brets-hold",
        hug: "brets-hug",
        tear: "brets-tear",
        wow: "brets-wow",
        bite: "brets-bite",
        eat: "brets-crumbs",
        nibble: ["brets-dig", "brets-taste", "brets-cozy"],
        playFaces: ["brets-offer", "brets-cheer", "brets-think"],
        empty: "brets-empty",
        text: "Ton paquet de Brets t'attend, sers-toi 😋",
      },
    ],
  },

  timeline: {
    title: "Le Swap de Cyrielle",
    progress: "{done} / {total} cadeaux ouverts",
    active: "À toi de jouer",
    toOpen: "Ouvre ton paquet !",
    finalNode: "Un dernier mot",
  },

  ui: {
    // Messages quand la réponse est fausse (un au hasard à chaque fois)
    wrong: ["Presque… mais non 😏", "Tu chauffes ? Même pas.", "Essaie encore, je crois en toi."],
    // Messages quand elle trouve toute seule
    foundSelf: ["Trouvé toute seule, bravo !", "Rien ne t'échappe 👀"],
    // Quand elle a cliqué sur « Voir la réponse » : le cadeau reste une surprise jusqu'à ce qu'elle l'ait ouvert
    revealed: "La réponse était…",
    openToSee: "Ouvre ton cadeau et tu verras bien ! 🎁",
    next: "Suite ▸",
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
      answer: "Une bombe de bain / Coffret Lush 🛁",
      reveal: "Une bombe de bain… et un pain moussant en bonus. Ce soir, c'est bain moussant !",
      short: "Coffret Lush",
      effect: "bubbles",
      // Sticker de Mini Cyrielle à la révélation (noms dans assets/cyrielle/)
      revealFace: "bath",
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
      revealFace: "cosy",
      // Une fois le cadeau révélé : unlocksFaces = stickers en plus pour ses émotions (réfléchir, dormir, râler…),
      // playFaces = stickers en plus quand on la touche ou qu'elle s'occupe sur le chemin.
      unlocksFaces: { think: "pj-think", sleep: "pj-sleep", angry: "pj-angry" },
    },
    {
      type: "free",
      title: "La Devinette douce",
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
      revealFace: "patate-hug",
      unlocksFaces: { joy: "patate-excited", think: "patate-think", sleep: "patate-sleep", angry: "patate-angry", kiss: "patate-love", pout: "patate-shy" },
      playFaces: ["patate-kiss", "patate-peace", "patate-wink", "patate-cuddle", "patate-peek"],
    },
    {
      type: "camp",
      title: "Le texte à trous gourmand",
      lines: [
        "Parce qu'il n'y a rien de mieux pour nos soirées.",
        "À toi de choisir ton camp pour remplir cette petite tasse magique :",
      ],
      // Deux camps : elle en touche un et complète le mot. Les « _ » sont les lettres à trouver.
      // face / reveal / effect remplacent ceux du cadeau selon le camp choisi.
      camps: [
        {
          id: "fromage",
          emoji: "🧀",
          word: "FROMAGE",
          pattern: "F____GE",
          after: "fondu",
          face: "fondue-cheese",
          reveal: "Team fromage : ce soir, ça file ! 🧀",
          effect: "cheese",
        },
        {
          id: "chocolat",
          emoji: "🍫",
          word: "CHOCOLAT",
          pattern: "C___OLAT",
          after: "fondu",
          face: "fondue-choc",
          reveal: "Team chocolat : sors les fraises 🍓",
          effect: "chocolate",
        },
      ],
      or: "ou",
      answer: "Une tasse à fondue !",
      reveal: "Fromage ou chocolat : pas besoin de choisir, on fera les deux 🫕",
      short: "Tasse à fondue",
      effect: "fondue",
      revealFace: "joy2",
    },
    {
      type: "wordsearch",
      title: "Les Mots Mêlés de la Beauté",
      lines: ["Trouve les deux mots cachés (horizontalement ou verticalement) dans cette grille pour découvrir la suite :"],
      // Une ligne = une rangée de la grille, toutes de la même longueur.
      // ⚠️ Si tu changes la grille ou les mots, lance `npm test` : il vérifie que chaque mot y est une seule fois.
      grid: ["MLBUZER", "CSTRASS", "VAIENPH", "ORKLUYG", "JETFDBN", "WQOMHCL", "PUKYEZA"],
      words: ["STRASS", "TIKTOK"],
      // Compteur sous la grille
      progress: "Mots trouvés : {found} / {total}",
      hint: "L'un brille de mille feux, l'autre est l'application où l'on va poster le résultat sur mon visage. Prépare tes talents de maquilleuse !",
      answer: "Des Strass pour une trend TikTok !",
      reveal: "À tes pinceaux, artiste ✨",
      short: "Strass & trend TikTok",
      effect: "sparkles",
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
      revealFace: "mms",
    },
    {
      type: "free",
      title: "L'Équation Mystère",
      lines: [
        "Si tu mélanges l'ambiance d'un spa luxueux avec l'heure de la douche, et que tu multiplies le tout par deux…",
        "Qu'est-ce qui en ressort sous forme de nuage parfumé ?",
      ],
      // Les termes de l'équation, affichés un par un sous l'énigme
      equation: [
        { op: "(" },
        { emoji: "🧖‍♀️", label: "Spa luxueux" },
        { op: "+" },
        { emoji: "🚿", label: "L'heure de la douche" },
        { op: ")" },
        { op: "× 2" },
        { op: "=" },
        { emoji: "☁️", label: "?" },
      ],
      accept: ["mousse", "rituals", "gel douche", "moussant"],
      answer: "2 mousses de douche Rituals",
      reveal: "Ton spa à la maison… en double ☁️",
      short: "Mousses de douche Rituals",
      effect: "foam",
      revealFace: "kiss2",
    },
    {
      type: "qcm",
      title: "Le QCM",
      lines: ["Que se cache-t-il dans ce (très) gros paquet ?"],
      // face = sticker de Mini Cyrielle quand elle choisit cette mauvaise réponse
      options: [
        {
          label: "Un nouveau réchaud ultra-léger pour nos prochains bivouacs.",
          tease: "Un réchaud ? Je ne suis pas romantique à ce point-là ⛺",
          face: "hike",
        },
        {
          label: "Un énième pot de whey pour ma prise de masse.",
          tease: "Ça, c'est MON cadeau de rêve, pas le tien 💪😏",
          face: "gym",
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
      revealFace: "magic-hug",
      unlocksFaces: { joy: "magic-done", think: "magic-think", kiss: "magic-cuddle" },
      playFaces: ["magic-wand", "magic-brush-wink", "magic-smooth", "magic-dry", "magic-curl", "magic-style", "magic-case"],
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
      "9 cadeaux surprises",
      "9 énigmes (pas trop dures… enfin presque)",
      "{snack} inclus",
      "Déjà livrés : coffret Lush, pyjama, patate positive, tasse à fondue",
      "5 surprises encore à venir 👀",
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

  // Bonus après le dernier cadeau, juste avant le mot final (une seule fois)
  bonus: {
    eyebrow: "Bonus",
    // Son paquet de chips est vide (sticker « empty » du paquet choisi), puis la boîte tombe
    empty: "Oh non… mon paquet est vide 😢",
    wait: "Attends… il en reste un !",
    // Stickers quand la boîte explose : wow, puis elle se verse les Nerds dans la bouche (pour), puis after
    faces: { wow: "nerds-wow", pour: "nerds-pour", after: "nerds-mess" },
    tap: "Secoue la boîte : touche-la 3 fois",
    answer: "Des Nerds ! 🍬",
    reveal: "Pour finir sur une note sucrée (et qui croustille).",
    go: "Va vite chercher ton dernier paquet !",
    button: "Lire mon dernier mot ♥",
  },

  // Débrief à embranchements (bouton sur l'écran final) : chaque réponse change la suite.
  // nodes = les questions ; next = l'id de la question suivante OU d'une fin (endings).
  // face = sticker de Mini Cyrielle (noms dans assets/cyrielle/).
  // effect = bubbles, moons, potatoes, candies, sparkles, wind, rugby, fondue, cheese, chocolate, foam, hearts ou confetti.
  // {snack} dans un texte = le paquet choisi dans l'intro.
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
        // grid: les réponses en grille (pour une longue liste)
        grid: true,
        choices: [
          { label: "🛁 Le coffret Lush", next: "cocooning" },
          { label: "🌙 Le pyjama", next: "marmotte" },
          { label: "🥔 La patate positive", next: "goodvibes" },
          { label: "🫕 La tasse à fondue", next: "fondue" },
          { label: "✨ Les strass", next: "tiktok" },
          { label: "🍬 Les M&M's", next: "gourmande" },
          { label: "☁️ Les mousses Rituals", next: "spa" },
          { label: "💨 L'Air Styler", next: "brushing" },
          { label: "🏉 Le maillot UBB", next: "supportrice" },
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
        face: "bath",
        effect: "bubbles",
        text: "Bombe de bain qui pétille, bain moussant, bougie allumée… Ce soir, c'est spa à la maison 🛁",
      },
      marmotte: {
        n: 2,
        title: "La marmotte",
        face: "pj-sleep",
        effect: "moons",
        text: "Pyjama enfilé, lumière éteinte, dodo bien mérité. Les énigmes, ça fatigue 😴",
      },
      goodvibes: {
        n: 3,
        title: "Good vibes only",
        face: "patate-peace",
        effect: "potatoes",
        text: "Une patate positive pour le moral, tous les jours. Interdiction d'être triste, c'est la règle 🥔",
      },
      // Cette fin suit le camp choisi au cadeau 4 (camps.fromage / camps.chocolat remplacent le reste).
      fondue: {
        n: 4,
        title: "Team fondue",
        face: "joy",
        effect: "fondue",
        text: "Fromage ou chocolat ? Pas besoin de choisir : on fera les deux 🫕",
        camps: {
          fromage: {
            title: "Team fromage",
            face: "fondue-cheese",
            effect: "cheese",
            text: "Fromage qui file, pain qui trempe : la fondue, c'est sacré. Prochaine soirée fondue chez nous 🧀",
          },
          chocolat: {
            title: "Team chocolat",
            face: "fondue-choc",
            effect: "chocolate",
            text: "Chocolat fondu et fraises à volonté : la soirée parfaite existe, et elle est chez nous 🍓",
          },
        },
      },
      tiktok: {
        n: 5,
        title: "Star de TikTok",
        face: "cool",
        effect: "sparkles",
        text: "Strass sur le visage, ring light allumée : la trend va exploser. Un million de vues minimum ✨",
      },
      gourmande: {
        n: 6,
        title: "La gourmande",
        face: "mms",
        effect: "candies",
        text: "M&M's, {snack}, Nerds… On sait maintenant ce que tu préfères vraiment 🍬",
      },
      spa: {
        n: 7,
        title: "Spa à la maison",
        face: "kiss2",
        effect: "foam",
        text: "Deux mousses Rituals, une douche qui sent le spa… Tu vas sentir trop bon ☁️",
      },
      brushing: {
        n: 8,
        title: "Brushing de star",
        face: "magic-done",
        effect: "wind",
        text: "Un brushing parfait en dix minutes chrono. Les réseaux avaient raison 💨",
      },
      supportrice: {
        n: 9,
        title: "Supportrice officielle",
        face: "ubb-flag",
        effect: "rugby",
        text: "Maillot sur le dos, drapeau à la main : l'UBB a une nouvelle supportrice. Allez l'UBB !",
      },
      facile: {
        n: 10,
        title: "Mode facile activé",
        face: "sushi-happy",
        effect: "sparkles",
        text: "Promis, le prochain swap sera en mode facile. Avec des indices partout. Et des sushis.",
      },
      revanche: {
        n: 11,
        title: "La revanche",
        face: "angry2",
        effect: "wind",
        text: "Défi accepté. Le prochain swap sera bien plus corsé… Prépare-toi ⚔️",
      },
      premium: {
        n: 12,
        title: "Abonnement Premium",
        face: "surprised3",
        effect: "confetti",
        text: "Trop tard : tu viens de souscrire à LE SWAP™ Premium. Publicités illimitées, à vie 📺",
      },
      taquine: {
        n: 13,
        title: "La taquine",
        face: "smirk",
        effect: "hearts",
        text: "Je le savais : tu as adoré du début à la fin. Et moi, je t'aime 😏♥",
      },
    },
    // Fin secrète : après la dernière fin découverte, l'écran grésille et ce dialogue démarre.
    // who = qui parle (cycy ou kevin), face = son sticker, reply = un bouton de réponse pour Cyrielle,
    // enter = Kevin arrive à ce moment-là (de dos, avec ce sticker, puis il se retourne), react = le sticker
    // de l'autre pendant la réplique, sound = un son en plus (drumroll = roulement de tambour),
    // duo = un sticker où ils sont tous les deux (à la place des deux séparés), bite = la morsure, d'un coup.
    secret: {
      locked: "🔒 Une fin secrète t'attend à {total} / {total}",
      unlocked: "Fin secrète débloquée",
      button: "✦ Revoir la fin secrète",
      label: "Fin secrète · {n} / {total}",
      title: "Les coulisses",
      names: { cycy: "Mini Cycy", kevin: "Kevin" },
      script: [
        { who: "cycy", face: "surprised3", text: "Attends… tu as vraiment trouvé les 13 fins ?!" },
        { who: "cycy", face: "smirk", text: "Bon. Puisque tu es allée jusqu'au bout, je vais te montrer un secret…" },
        { who: "cycy", face: "wink", text: "Bienvenue dans les coulisses du Swap 🎬" },
        { reply: "Raconte !" },
        { who: "cycy", face: "think", text: "Tout a commencé hier. Kevin voulait te faire un swap pas comme les autres." },
        { who: "cycy", face: "think2", text: "9 énigmes, une grille de mots croisés, des mots mêlés… et en plein milieu, l'ordinateur a planté." },
        { reply: "Non ?!" },
        { who: "cycy", face: "surprised", text: "Si. Panique totale. Mais on a tout repris." },
        { who: "cycy", face: "peace", text: "Et moi ? 141 stickers, rien que pour toi : fou rire, bouderie, dodo, fondue, Brets…" },
        { who: "cycy", face: "cool", text: "Le site fait plus de 8 000 lignes de code. Oui, 8 000. Pour toi." },
        { who: "cycy", face: "smirk", text: "Ce matin encore, il y avait 7 cadeaux. Et puis 2 de plus se sont glissés dans le lot." },
        { who: "cycy", face: "joy", text: "Et la pub ? Absolument indispensable. Je ne discute pas." },
        { reply: "J'avoue 😂" },
        { who: "cycy", face: "smirk", text: "Et tu veux savoir qui se cache derrière tout ça ?" },
        { reply: "Dis-moi !" },
        { who: "cycy", face: "surprised2", text: "Le cerveau de l'opération, c'est…", sound: "drumroll" },
        { who: "kevin", face: "kevin-flex-wow", enter: "kevin-back-joy", text: "Euh… surprise ? 😅" },
        { who: "kevin", face: "kevin-flex-cool", text: "Oui, c'est moi. 141 stickers, 8 000 lignes de code… même pas fatigué." },
        { who: "cycy", face: "smirk", react: { kevin: "kevin-flex-tongue" }, text: "Kevin a passé la journée à parler à des stickers." },
        { who: "kevin", face: "kevin-flex-love", text: "Tout ça pour voir ton sourire ce soir." },
        { who: "kevin", face: "kevin-flex-smirk", text: "Je t'aime ♥" },
        { reply: "Moi aussi ♥" },
        { who: "kevin", face: "kevin-flex-joy", text: "Et maintenant… admire ces biceps." },
        { who: "cycy", duo: "duo-look", text: "Oh… 👀" },
        { who: "cycy", duo: "duo-admire", text: "Ils ont l'air… trop bons." },
        { who: "kevin", duo: "duo-eye", text: "Euh… pourquoi tu me regardes comme ça ?" },
        { who: "kevin", bite: ["duo-bite", "duo-bite-hard"], text: "AÏEEE !" },
        { who: "cycy", duo: "duo-bite", text: "Pardon… c'était plus fort que moi 😋" },
      ],
      // Sur l'écran de fin : un sticker à deux (duo), ou les deux séparés (cycy et kevin)
      end: { duo: "duo-bite" },
    },
    // Page ?debrief (pour toi)
    report: {
      title: "Le débrief de Cyrielle",
      empty: "Pas encore de débrief : il apparaîtra ici quand elle aura joué.",
      run: "Partie {n}",
      ending: "Fin obtenue",
      endings: "Fins découvertes",
      play: "▶ Lancer le débrief",
      secret: "Fin secrète",
      secretFound: "trouvée ✔",
      secretNotYet: "pas encore",
    },
  },

  final: {
    eyebrow: "9 cadeaux ouverts",
    title: "Et voilà 🎉",
    body: [
      "Coffret Lush, pyjama, patate positive, tasse à fondue, strass, M&M's, mousses Rituals, brosse soufflante et maillot de l'UBB : tu as maintenant tout ce qu'il faut pour une soirée parfaite… avec moi, évidemment.",
      "Merci d'être toi. Je t'aime.",
    ],
    signature: "",
    recapTitle: "Tes 9 cadeaux",
    foundBadge: "trouvé seule",
    // Phrase de score selon le nombre d'énigmes trouvées sans « Voir la réponse »
    score: {
      all: "9 sur 9 toute seule. Impossible de te cacher quoi que ce soit, tu me connais par cœur.",
      high: "{score} énigmes sur 9 trouvées toute seule. Pas mal du tout ✨",
      low: "{score} sur 9… Disons que mes énigmes étaient très (trop ?) bien ficelées 😏",
      none: "0 sur 9 ? Pas grave, l'important c'est les cadeaux 😇",
    },
    replay: "Revoir le parcours",
  },
};
