# Nos aventures, le passeport (sous-projet 2a) : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:executing-plans (choisi par Kevin pour le sous-projet 1) ou superpowers:subagent-driven-development. Les étapes se cochent (`- [ ]`).

**Objectif :** `#/aventures` devient le passeport de la spec : Mini Cycy accueille, le passeport arrive et s'ouvre en 3D, les 15 aventures se vivent dans l'ordre, et chaque tampon se pose d'un toucher sur le tampon encreur. Chaque aventure a une intro provisoire, son panneau-titre animé, en attendant les recettes du sous-projet 3.

**Architecture :**
- La logique pure (états, pages, dates, progression) vit dans `js/aventures/logic.js`, testée sous Node ; la sauvegarde dans `js/state.js`.
- L'interface est découpée par rôle : `passport.js` (le livre 3D), `stamper.js` (le tampon encreur), `intro.js` (le panneau-titre), `screen.js` (l'orchestration avec Mini Cycy).
- `main.js` ne fait que router : `#/aventures` = le passeport, `#/aventures/<id>` = l'intro de cette aventure.

**Stack :** vanilla, modules natifs, GSAP global, CSS 3D (`perspective`, `rotateY`, `backface-visibility`), `node --test`, banc CDP maison (`tests/e2e/`).

**Spec :** `docs/specs/2026-10-29-portail-cycy-et-kevin-design.md` : § 4 en entier, § 5 (le panneau-titre seulement), § 8 (adresses du passeport).

## Contraintes globales
- **Hors du 2a :** le carnet, les étapes et Supabase (2b), les recettes d'intro et le kit de décor (3). Toucher un tampon posé lance l'intro, puis revient au passeport.
- **Rendu riche** (Kevin a trouvé le hub trop simple) :
  - **la couverture :** cuir bordeaux grainé (`#5E1628`, grain `feTurbulence` en image de fond), surpiqûre dorée en pointillés, titre en dorure avec un reflet qui balaie (`background-clip: text`, `background-position` animé par GSAP), globe doré en relief ;
  - **les pages :** papier `#FBF5EA` avec fibres, guillochis en rosace (SVG en fond, trait `rgba(122,31,53,0.07)`), ombre de reliure, tranche des pages visible, ombre qui suit l'angle pendant qu'une page tourne ;
  - **les tampons :** posés en `mix-blend-mode: multiply` ;
  - **le tampon encreur :** dessiné en SVG (manche en bois veiné, virole métal, caoutchouc à l'encre de l'aventure), avec une ombre qui grandit à l'approche du papier ;
  - **le fond du monde :** turquoise pâle (`#E3F4F2` → `#CDEBE7`), une carte routière en filigrane et un halo de soleil `#F2B134` en haut à droite.
- **Règles du projet :** pas de transition CSS sur `opacity` ou `transform` d'un élément animé par GSAP (les états estompés passent par `filter`) ; `const reduced = false` ; clés de stockage `swap-cyrielle:` dans un `try/catch` ; aucune dépendance ajoutée au site.
- **Sauvegarde :** `swap-cyrielle:aventures` = `{ stamped: [ids], pending: [ids], welcomed: bool, known: [ids], page: number }`.
  - `?demo` : tout est tamponné, rien n'est enregistré ;
  - `?demo&tampon=<id>` : les aventures d'avant sont tamponnées, `<id>` est à tamponner ;
  - `?reset` efface aussi cette clé.
- **Tampons :** `assets/aventures/tampons/<id>.svg` et `tampons.json` (`{ id, name, ink, tilt }`), lu au chargement du monde par `fetch`. S'il manque : encre `#7A1F35`, inclinaison 0.
- **Pages :** la page d'identité (0), puis 2 tampons par page (pages 1 à 8 pour 15 sorties), puis la page « Prochaine destination ? » (9).
  - **Sur téléphone**, une page de droite à la fois, et la reliure sort de l'écran à gauche.
  - **Sur PC**, le livre est ouvert au centre ; la page de gauche est le dos de la page tournée (papier et filigrane).
- **Mini Cycy :** les stickers du swap (`assets/cyrielle/`), avec `createAvatar` et `createBubble` (de `js/scenes.js`) ; un toucher termine la bulle en cours, un second passe à la suivante.
- **Textes**, dans `js/content.js`, qui remplacent `content.aventures` du sous-projet 1 (copie exacte de la spec). `{since}` est le mois et l'année de la première sortie (« mai 2025 ») ; `{next}` est le nom de l'aventure à vivre ; `{name}` celui d'une sortie ajoutée.
  ```js
  aventures: {
    title: "Nos aventures",
    back: "‹ Accueil",
    cover: { title: "Passeport des aventures", holders: "Cycy & Kevin" },
    identity: { title: "Passeport", holders: "Titulaires : Cycy & Kevin", since: "Depuis le {date}", count: "Aventures : {n} / {total}", mrz: "P<CYCY<<KEVIN<<<<<<<<<<<<<<<<<<" },
    slot: { open: "À vivre ✦", next: "Prochaine destination ?" },
    welcome: [
      "Coucou ! Bienvenue dans nos aventures ✨",
      "Ici, il y a tout ce que Kevin et moi, on a vécu depuis {since}. {n} sorties, du premier bivouac à la fête du piment !",
      "Mais pas de triche : on les revit dans l'ordre. Chaque aventure terminée = un tampon sur ton passeport.",
      "Tiens, le voilà ! Première destination… 🥁",
    ],
    welcomeFaces: ["joy", "wink", "smirk", "surprised"],
    locked: ["Eh, pas si vite ! Une aventure à la fois 😤", "Celle-là, elle se mérite. Termine d'abord {next} !", "Pas de triche, j'ai dit ! 🙈"],
    nudge: ["Allez, tamponne ! 👀", "Qu'est-ce que t'attends ?"],
    stamped: ["Et un tampon de plus ! 💥", "Validé ! Prochaine destination : {next}", "Ça, c'était quelque chose… On continue ?"],
    complete: ["Passeport complet ! 🎉 Maintenant, tu peux repartir où tu veux.", "Et la prochaine aventure, on la vit quand ? 😏"],
    again: { progress: "Re ! On en était à {next} 👀", complete: "On repart où aujourd'hui ?", added: "Oh, un nouveau tampon à gagner : {name} ✨" },
    stampHint: "Touche pour tamponner",
    skip: "Passer ▸",
    prev: "Page précédente",
    nextPage: "Page suivante",
  },
  ```
  `stamped[1]` n'est tirée que s'il reste une aventure à vivre.
- **Classes conservées** pour les tests du hub : l'écran du passeport garde `screen-aventures` (plus `screen-passport`), et son bouton retour garde `.world-back`.
- **Méthode :** TDD, chaque test vu en échec d'abord. Branche `portail`, commits avec `-- <chemins>`, pas de push sans Kevin.
- **Vérifier :**
  - `npm test` ;
  - de bout en bout : `node tests/e2e/serve.mjs` à côté, puis `node tests/e2e/aventures.mjs` (nouveau) et `node tests/e2e/hub.mjs` (doit rester vert), sur 393 × 852, 375 × 667 et 1440 × 900 ;
  - sur 375 × 667, tout le passeport tient sans défilement.

## Points à surveiller
1. **Recharger ou fermer pendant l'intro de la première fois :** l'aventure reste `open`, et l'intro se rejoue en entier à la prochaine ouverture. Après la fin de l'intro, le tampon attend (`pending`), même après un rechargement. *(Tâches 3 et 5)*
2. **Le retour du navigateur pendant l'intro de la première fois :** on retrouve le passeport, et l'aventure n'est pas marquée vécue. *(Tâche 3)*
3. **Double toucher sur l'emplacement à vivre :** une seule intro, une seule entrée d'historique. *(Tâche 3)*
4. **Une sauvegarde abîmée ou ancienne** (ids inconnus, doublons, champs manquants, ou une sortie retirée des données) : nettoyée sans erreur. *(Tâche 1)*
5. **Stockage bloqué :** le passeport marche, il ne retient simplement rien. *(Tâche 4)*

---

### Tâche 1 : la logique des aventures et leur sauvegarde
**Fichiers :**
- Créer : `js/aventures/logic.js`
- Modifier : `js/state.js`
- Tests : `tests/aventures.test.mjs`

**Interfaces :**
- Produit (`js/aventures/logic.js`, pur) :
  - `initialProgress() → { stamped: [], pending: [], welcomed: false, known: [], page: 0 }` ;
  - `sanitizeProgress(raw, ids) → progress` : ne garde que des ids connus, sans doublon ; un id à la fois `pending` et `stamped` reste `stamped` ; `welcomed` booléen ; `page` entier ≥ 0 ; tout le reste prend les valeurs de départ ;
  - `statuses(aventures, progress) → { [id]: "stamped" | "pending" | "open" | "locked" }` (les règles du § 4 : par date de début puis par id ; au plus une `open`, aucune s'il y a une `pending`) ;
  - `nextToLive(aventures, progress) → id | null` (la `pending`, sinon la `open`) ;
  - `live(aventures, progress, id) → progress` (`open` → `pending`, sinon inchangé) ;
  - `stamp(aventures, progress, id) → progress` (`pending` → `stamped`, sinon inchangé) ;
  - `isComplete(aventures, progress) → boolean` ;
  - `openable(aventures, progress, id) → boolean` (vrai pour `open` et `stamped`) ;
  - `addedSince(aventures, progress) → id[]` (les ids absents de `known`, seulement si `welcomed`) ;
  - `demoProgress(aventures, tamponId = null) → progress` (tout tamponné, ou tout ce qui précède `tamponId` tamponné et `tamponId` en attente ; `welcomed: true` ; `known` = tous les ids) ;
  - `passportPages(aventures) → [{ kind: "identity" } | { kind: "stamps", ids: [id, id?] } | { kind: "next" }]` ;
  - `pageOf(aventures, id) → number` ;
  - `formatRange(from, to) → string` ; `shortDate(iso) → "JJ/MM/AAAA"` ; `monthYear(iso) → "mai 2025"`.
- Produit (`js/state.js`) :
  - `loadAventures(aventures) → progress` (`?demo` → `demoProgress(aventures, ?tampon)`) ;
  - `saveAventures(progress)` (rien en `?demo`) ;
  - `?reset` efface aussi `swap-cyrielle:aventures`.

- [ ] **Tests** (`tests/aventures.test.mjs`), avec `AVENTURES` et des listes courtes `a` (2025-01-01), `b` (2025-02-01), `c` (2025-03-01) :
  ```js
  const s0 = statuses(AVENTURES, initialProgress());
  assert.equal(s0["bivouac-1"], "open");
  assert.ok(AVENTURES.slice(1).every((x) => s0[x.id] === "locked"));
  const p1 = live(AVENTURES, initialProgress(), "bivouac-1");
  assert.deepEqual(p1.pending, ["bivouac-1"]);
  assert.ok(Object.values(statuses(AVENTURES, p1)).every((v) => v !== "open"));
  assert.deepEqual(live(AVENTURES, initialProgress(), "canoe"), initialProgress()); // locked: unchanged
  const p2 = stamp(AVENTURES, p1, "bivouac-1");
  assert.deepEqual([p2.stamped, p2.pending], [["bivouac-1"], []]);
  assert.equal(statuses(AVENTURES, p2).canoe, "open");
  assert.equal(nextToLive(AVENTURES, p1), "bivouac-1");
  assert.equal(stamp(AVENTURES, p2, "canoe"), p2); // not pending: unchanged, same object
  const later = statuses([a, b, c], { ...initialProgress(), stamped: ["a", "c"] }); // a sortie added in the middle
  assert.deepEqual(later, { a: "stamped", b: "open", c: "stamped" });
  const all = demoProgress(AVENTURES);
  assert.ok(isComplete(AVENTURES, all) && nextToLive(AVENTURES, all) === null);
  const t = demoProgress(AVENTURES, "canoe");
  assert.deepEqual([t.stamped, t.pending], [["bivouac-1"], ["canoe"]]);
  assert.ok(openable(AVENTURES, p2, "bivouac-1") && openable(AVENTURES, p2, "canoe") && !openable(AVENTURES, p2, "royan-1") && !openable(AVENTURES, p1, "bivouac-1"));
  assert.deepEqual(sanitizeProgress({ stamped: ["a", "a", "zzz"], pending: ["a", "b"], welcomed: "oui", page: -3, known: 4 }, ["a", "b", "c"]),
    { stamped: ["a"], pending: ["b"], welcomed: false, known: [], page: 0 });
  assert.deepEqual(sanitizeProgress(null, ["a"]), initialProgress());
  assert.deepEqual(addedSince([a, b, c], { ...initialProgress(), welcomed: true, known: ["a", "c"] }), ["b"]);
  assert.deepEqual(addedSince([a, b, c], initialProgress()), []);
  const pages = passportPages(AVENTURES);
  assert.equal(pages.length, 10);
  assert.deepEqual([pages[0].kind, pages[9].kind], ["identity", "next"]);
  assert.deepEqual(pages[1].ids, ["bivouac-1", "canoe"]);
  assert.deepEqual(pages[8].ids, ["espelette"]);
  assert.equal(pageOf(AVENTURES, "espelette"), 8);
  assert.equal(formatRange("2025-05-17", "2025-05-18"), "17–18 mai 2025");
  assert.equal(formatRange("2025-08-11", "2025-08-11"), "11 août 2025");
  assert.equal(formatRange("2026-04-30", "2026-05-02"), "30 avril – 2 mai 2026");
  assert.equal(formatRange("2025-12-29", "2026-01-05"), "29 décembre 2025 – 5 janvier 2026");
  assert.equal(shortDate("2025-05-17"), "17/05/2025");
  assert.equal(monthYear("2025-05-17"), "mai 2025");
  ```
- [ ] `npm test` : échec (module absent).
- [ ] Écrire `js/aventures/logic.js`, puis `loadAventures` / `saveAventures` et le `?reset` dans `state.js`. Dans `state.js`, lire `?tampon` à côté de `?demo`.
- [ ] `npm test` : tout passe.
- [ ] Commit : `-- js/aventures/logic.js js/state.js tests/aventures.test.mjs`

### Tâche 2 : le passeport en 3D (le livre seul)
**Fichiers :**
- Créer : `js/aventures/passport.js`, `tests/e2e/check.mjs`, `tests/e2e/aventures.mjs`
- Modifier :
  - `js/aventures/screen.js` (remplace la coquille) ;
  - `js/main.js` (`worldScreen` pour les aventures) ;
  - `js/content.js` (le bloc `aventures` des contraintes globales) ;
  - `css/style.css` ;
  - `tests/e2e/hub.mjs` (utilise `check.mjs`).

**Interfaces :**
- Consomme : `passportPages`, `pageOf`, `statuses`, `shortDate`, `formatRange` (tâche 1).
- Produit :
  - **`createPassport({ aventures, stamps, statuses, onSlot(id, slotEl) })`** dans `passport.js`, où `stamps` = `{ [id]: { ink, tilt } }`. Il renvoie :
    - `el` ;
    - `arrive() → Promise` : il monte en tournoyant, se pose, la couverture s'ouvre ;
    - `openAt(page)` : ouvert sans animation ;
    - `goTo(page) → Promise` : tourne les pages une à une, 0,45 s chacune ;
    - `page() → number` ;
    - `slotOf(id) → HTMLElement` ;
    - `refresh(statuses)` : redessine les états des emplacements ;
    - `press() → Promise` : la page s'enfonce un instant (pour la tâche 5) ;
    - `dispose()`.
  - **Repères pour les tests** :
    - `.pp-book[data-open="true"]` et `[data-page="N"]` ;
    - `.pp-slot[data-id][data-status]` ;
    - `.pp-stamp[data-id]` (l'image du tampon posé) ;
    - les boutons `.pp-prev` et `.pp-next` (avec les `aria-label` `prev` et `nextPage`).
  - **`aventuresWorld({ id, from, open(id), done(), back() }) → Promise<screen>`** dans `screen.js`. Dans cette tâche : charge `tampons.json`, puis renvoie l'écran du passeport (`screen screen-aventures screen-passport`) ouvert sur `nextToLive` (ou `progress.page` si tout est tamponné). La page affichée est enregistrée dans `progress.page`.
  - **`check(page)` dans `tests/e2e/check.mjs`** → `(name, fn, { allowErrors }) => Promise` : le `check` de `hub.mjs`, sorti pour être partagé.

**Le livre :**
- **Les feuilles** sont posées sur la moitié droite du livre, avec `transform-origin` à gauche. Une feuille tournée est à `rotateY(-180deg)` ; son dos (papier et filigrane) devient la page de gauche.
- **Le glisser** suit le doigt : l'angle vaut `dx / largeur × 180`. Au lâcher, la page finit de tourner au-delà de 60° ou si le geste est rapide ; sinon elle revient.
- **Les bornes :** impossible d'aller avant la page 0 ou après la page 9.
- **Un emplacement verrouillé** : pointillés, cadenas et date courte, sans le nom.
- **L'emplacement à vivre** : pointillés dorés qui pulsent (GSAP sur `filter: drop-shadow`) et « À vivre ✦ ».
- **Un tampon posé** : son SVG, incliné de `tilt`.
- **La page 0** montre les deux photos (stickers `wink` et `kevin-joy`), les titulaires, `since` (avec `shortDate` de la première sortie), le compte et la ligne `mrz`.
- **La page 9** montre un tampon en pointillés avec « ? ».

- [ ] **Vérifications** (`tests/e2e/aventures.mjs`, trois écrans) :
  - `?demo#/aventures` : `.screen-passport` ; au bout de 4 s, `data-open="true"` ; 15 `.pp-stamp`, toutes chargées (`naturalWidth > 0`) ;
  - `.pp-next` → `data-page` +1 ; glisser vers la gauche → +1 ; vers la droite → −1 ;
  - à la page 0, `.pp-prev` reste à 0 ; à la page 9, `.pp-next` reste à 9 ;
  - dans un profil neuf, sur `#/aventures` : `.pp-slot[data-id="bivouac-1"][data-status="open"]`, `[data-id="canoe"][data-status="locked"]`, et aucun `.pp-slot-name` dans un emplacement verrouillé ;
  - en 375 × 667 : le bas de `.pp-book` est au-dessus de `innerHeight` ;
  - `node tests/e2e/hub.mjs` reste à 60/60.
- [ ] Lancer `node tests/e2e/aventures.mjs` : échec.
- [ ] Écrire `passport.js`, le nouvel écran, le CSS (rendu riche des contraintes globales) et les textes.
- [ ] `npm test`, `aventures.mjs` puis `hub.mjs` : tout est vert. Prendre des captures des trois écrans (couverture, page 0, page de tampons) et les regarder.
- [ ] Commit : `-- js/aventures/passport.js js/aventures/screen.js js/main.js js/content.js css/style.css tests/e2e/check.mjs tests/e2e/aventures.mjs tests/e2e/hub.mjs`

### Tâche 3 : vivre une aventure (l'intro provisoire et le déblocage)
**Fichiers :**
- Créer : `js/aventures/intro.js`
- Modifier : `js/aventures/screen.js`, `js/main.js`, `js/router.js`, `css/style.css`
- Tests : `tests/e2e/aventures.mjs`

**Interfaces :**
- Consomme : `openable`, `live`, `statuses`, `formatRange` (tâche 1) ; `aventuresWorld` et `createPassport` (tâche 2).
- Produit :
  - **`router.replace(route)`** : `history.replaceState({ portail: history.state?.portail ?? false }, "", routeHash(route))`, puis `onRoute`.
  - **`introScreen({ aventure, ink, skippable, onDone }) → screen`** (`screen screen-aventures screen-intro`, avec `data-id` et `data-skippable`) :
    - fond dégradé de l'encre de l'aventure ;
    - un panneau qui tombe en se balançant, avec le nom (Cormorant) et `formatRange` ;
    - les deux chibis provisoires (`wink`, `kevin-joy`) qui sautent de chaque côté ;
    - des confettis de l'encre ;
    - 4,5 s en tout, puis `onDone()`.
    - Si `skippable` : bouton `.intro-skip` (« Passer ▸ »), et un toucher n'importe où termine l'intro. Sinon, un toucher ne fait rien.
  - **Dans `main.js` :**
    - avant d'afficher `#/aventures/<id>` qui n'est pas `openable` (verrouillée, à tamponner ou inconnue) : `router.replace({ world: "aventures", id: null })` ;
    - `open(id)` = `router.go(...)`, ignoré pendant une transition ;
    - `done()` = `router.back()` si `history.state?.portail`, sinon `router.replace({ world: "aventures", id: null })`.
  - **Dans `screen.js` :**
    - toucher un emplacement `open` ou `stamped` → `open(id)` ;
    - toucher un `locked` : il tremble (`shake`), la réaction de Mini Cycy vient à la tâche 4 ;
    - à la fin d'une intro de statut `open` : `live`, sauvegarde, puis `done()` ;
    - de retour d'une intro (`from.world === "aventures"` avec un id), le passeport est déjà ouvert sur la page de cette aventure (`openAt`), sans arrivée.

- [ ] **Vérifications** :
  - profil neuf : toucher `bivouac-1` → `#/aventures/bivouac-1`, `.screen-intro[data-skippable="false"]`, pas de `.intro-skip` ; un toucher au milieu de l'écran ne change rien ; en moins de 7 s, retour sur `#/aventures` ; le `pending` sauvegardé contient `bivouac-1` ; l'emplacement est `pending` ;
  - toucher un emplacement verrouillé : l'adresse ne change pas ;
  - `?demo#/aventures/roadtrip` : `.intro-skip` présent ; le toucher → retour au passeport en moins de 1,5 s ;
  - profil neuf, `/#/aventures/espelette` : on arrive sur `#/aventures` et le passeport ; `/#/aventures/inconnue` : pareil ;
  - recharger pendant l'intro de la première fois : l'intro repart, impossible à passer, et le statut est toujours `open` *(point 1)* ;
  - `history.back()` pendant l'intro de la première fois : le passeport, et le statut est toujours `open` *(point 2)* ;
  - deux touchers à 50 ms sur l'emplacement à vivre : une seule intro et `history.length` +1 *(point 3)*.
- [ ] Lancer les vérifications : échec.
- [ ] Écrire l'intro, `replace`, le branchement et le CSS.
- [ ] `npm test`, `aventures.mjs`, `hub.mjs` : tout est vert.
- [ ] Commit : `-- js/aventures/intro.js js/aventures/screen.js js/main.js js/router.js css/style.css tests/e2e/aventures.mjs`

### Tâche 4 : Mini Cycy (l'accueil, les visites suivantes, les réactions)
**Fichiers :**
- Modifier : `js/aventures/screen.js`, `css/style.css`
- Tests : `tests/e2e/aventures.mjs`

**Interfaces :**
- Consomme : `createAvatar` (`js/avatar.js`), `createBubble` (`js/scenes.js`), `pick` et `fill` (`js/logic.js`), `addedSince`, `monthYear` (tâche 1), `arrive` et `goTo` (tâche 2).
- Produit, dans l'écran du passeport : `.aventures-buddy` (Mini Cycy, `size` 80, `tappable`) et sa bulle `.bubble`.
  - **Première visite** (`!welcomed`) :
    - le passeport est caché ; Mini Cycy arrive d'un saut ;
    - les 4 bulles `welcome`, avec les visages `welcomeFaces` ;
    - pendant la 4e, `arrive()` : on voit la page 0 ;
    - 1,5 s après, `goTo(page de la prochaine aventure)` ;
    - enregistrer `welcomed: true` et `known` = tous les ids.
  - **Visites suivantes** :
    - une bulle `again.added` s'il y a des sorties ajoutées (la première), sinon `again.complete` si tout est tamponné, sinon `again.progress` ;
    - le passeport arrive vite (0,6 s) déjà ouvert sur la bonne page ;
    - `known` est mis à jour.
  - **Retour d'une intro :** aucune bulle.
  - **Toucher un emplacement verrouillé :** `pick(locked, précédente)` et le visage `pout`.
  - **Un toucher n'importe où** pendant une arrivée la termine (`timeline.progress(1)`).

- [ ] **Vérifications** :
  - profil neuf : `.bubble` affiche `welcome[0]` ; trois fois deux touchers → `welcome[3]` ; puis `.pp-book[data-open="true"]` et `data-page="1"` ; la sauvegarde a `welcomed: true` ;
  - rechargement : une seule bulle, `Re ! On en était à Premier bivouac 👀`, et le passeport est ouvert sur la page 1 en moins de 1,5 s ;
  - toucher un emplacement verrouillé : la bulle est l'une des trois répliques `locked` (avec `Premier bivouac` pour `{next}`) ;
  - avec une sauvegarde `{ welcomed: true, known: [tous sauf "royan-1"] }` : `Oh, un nouveau tampon à gagner : Royan ✨` ;
  - `?demo#/aventures` : `On repart où aujourd'hui ?` ;
  - stockage bloqué (`beforeLoad` qui fait échouer `localStorage`) : l'accueil se déroule, le passeport s'ouvre, aucune erreur *(point 5)*.
- [ ] Échec, puis écrire, puis tout est vert (`npm test`, `aventures.mjs`, `hub.mjs`).
- [ ] Commit : `-- js/aventures/screen.js css/style.css tests/e2e/aventures.mjs`

### Tâche 5 : tamponner, et le passeport complet
**Fichiers :**
- Créer : `js/aventures/stamper.js`
- Modifier : `js/aventures/screen.js`, `js/audio.js`, `css/style.css`
- Tests : `tests/e2e/aventures.mjs`

**Interfaces :**
- Consomme : `stamp`, `isComplete`, `nextToLive`, `pageOf` (tâche 1) ; `slotOf`, `press`, `refresh`, `goTo` (tâche 2) ; la bulle (tâche 4) ; `goldDust`, `fireworks` (`js/effects.js`) ; `shake` (`js/dom.js`).
- Produit :
  - **`createStamper({ slot, ink, onPress }) → { el, dispose() }`** dans `stamper.js` (`.pp-tool`) :
    - le tampon encreur descend au-dessus de l'emplacement, puis flotte (aller-retour de 6 px) ;
    - en dessous, `.pp-tool-hint` affiche « Touche pour tamponner » ;
    - au toucher (de l'outil ou de l'emplacement), une seule fois : élan (−30 px, 0,25 s), écrasement (aplatissement `scaleY` 0,88, 0,12 s, `power4.in`), puis `onPress()` au contact ;
    - ensuite, 12 éclats d'encre partent autour, l'outil remonte et s'envole (0,5 s) ;
    - `dispose` retire tout.
  - **`sfx("stamp")`** dans `audio.js` : un « TCHAC », bruit filtré court plus un son grave qui descend ; vibration `[25]`.
- **Dans `screen.js`** :
  - une aventure `pending` (à l'ouverture, ou de retour de l'intro) : `goTo(sa page)`, puis l'outil ;
  - sans toucher pendant 6 s : `pick(nudge)` ;
  - au contact :
    - `stamp`, puis sauvegarde ;
    - `press()`, `sfx("stamp")`, `shake(livre, 6)` ;
    - l'emplacement devient le tampon (fondu de 1,06 à 1) ;
    - Mini Cycy dit une réplique `stamped` (avec `{next}`), ou les deux répliques `complete` à la suite au dernier tampon, avec `goldDust` et `fireworks(5)` ;
    - l'emplacement suivant se met à briller ; s'il est sur une autre page, `goTo` 0,8 s plus tard.

- [ ] **Vérifications** :
  - profil neuf, après l'intro de `bivouac-1` : `.pp-tool` au-dessus de son emplacement, `.pp-tool-hint` = « Touche pour tamponner », pas encore de `.pp-stamp[data-id="bivouac-1"]` ;
  - au bout de 6,5 s, la bulle est l'une des deux répliques `nudge` ;
  - rechargement : `.pp-tool` est toujours là *(point 1)* ;
  - toucher `.pp-tool` : en moins de 1,5 s, `.pp-stamp[data-id="bivouac-1"]`, plus de `.pp-tool`, la sauvegarde a `stamped: ["bivouac-1"]`, `canoe` est `open`, la bulle est une réplique `stamped` ;
  - `?demo&tampon=canoe#/aventures` : l'outil est sur `canoe` et `bivouac-1` est tamponné ; après le toucher, `data-page` passe à 2 en moins de 2,5 s ;
  - `?demo&tampon=espelette#/aventures` : après le toucher, la bulle dit `complete[0]` puis `complete[1]`, et toutes les aventures sont `stamped`.
- [ ] Échec, puis écrire, puis tout est vert (`npm test`, `aventures.mjs`, `hub.mjs`).
- [ ] Commit : `-- js/aventures/stamper.js js/aventures/screen.js js/audio.js css/style.css tests/e2e/aventures.mjs`

### Tâche 6 : page de test, README, contrôle à l'œil
**Fichiers :**
- Modifier : `js/testpage.js`, `README.md`
- Tests : `tests/e2e/aventures.mjs`, `tests/e2e/hub.mjs`

- [ ] **Page de test**, groupe « Nos aventures » :
  - `./#/aventures` (la vraie progression) ;
  - `?demo#/aventures` (tout tamponné) ;
  - `?demo&tampon=bivouac-1#/aventures` (le moment du tampon) ;
  - `?demo#/aventures/roadtrip` (une intro) ;
  - `?reset#/aventures` (« remet le passeport à zéro »).
- [ ] **README** : la section « Nos aventures » (fichiers, sauvegarde, adresses de test, `content.aventures` à modifier si on ajoute des sorties : la phrase « du premier bivouac à la fête du piment »), une ligne dans « Avancement » et dans le « Journal ».
- [ ] **Les trois écrans :** `aventures.mjs` et `hub.mjs` passent sur les trois. Captures de la couverture, de la page d'identité, d'une page de tampons, du tampon encreur et de l'intro, à regarder, puis le lien `http://localhost:5173/#/aventures` pour Kevin.
- [ ] Commit : `-- js/testpage.js README.md`
- [ ] **Fin :** relecture indépendante de la branche depuis le commit de ce plan, la passe de corrections, puis le bilan pour Kevin.
