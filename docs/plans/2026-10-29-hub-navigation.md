# Hub, navigation, nom et icône : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :** le site s'ouvre sur un hub « Cycy et Kevin » (carrousel de trois mondes) ; chaque monde a son adresse en `#` ; on y entre par une carte qui s'agrandit et on en revient par une plaque qui se replie ; l'app s'appelle « Cycy et Kevin », avec une nouvelle icône. Nos aventures n'est qu'une coquille (sous-projet 2).

**Architecture :** un routeur sans DOM (`js/router.js`) traduit l'adresse en monde ; `main.js` garde son `show()` et branche chaque monde dessus. Le hub (`js/hub.js`) et les plaques (`js/plate.js`) sont de nouveaux modules ; leurs calculs purs vont dans `js/hub-logic.js`, testé sous Node. Le swap n'est quitté qu'en rechargeant la page (ses minuteries ne survivent pas à un départ), avec un drapeau qui fait démarrer le hub plaque repliée.

**Stack :** HTML/CSS/JS vanilla, modules natifs, pas de build ; GSAP 3.12.5 global (`window.gsap`) ; tests `node --test` ; de bout en bout, Chrome sans interface piloté par un petit client CDP maison (WebSocket natif de Node 24).

**Spec :** `docs/specs/2026-10-29-portail-cycy-et-kevin-design.md` (§ 0, 1, 2 ; § 8 et 9 pour les vérifications).

## Contraintes globales
- **Aucune dépendance ajoutée au site.** Pas de plugin Flip : les plaques animent `clip-path: inset(… round …)` avec GSAP.
- **Règle du projet** : jamais de transition CSS sur `opacity` ou `transform` d'un élément animé par GSAP ; un état estompé passe par `filter: opacity()`. Les scripts gardent `const reduced = false`.
- **Adresses** : `#/` (hub), `#/swap`, `#/ubb`, `#/aventures`, `#/aventures/<id>` (`id` en `[a-z0-9-]+`). Tout le reste mène au hub. Les majuscules sont ramenées en minuscules.
- **Anciennes adresses** : `?musee` devient `#/ubb` en gardant les autres paramètres (`?musee&css` → `?css#/ubb`). `?demo`, `?test`, `?rejouer`, `?pub`, `?debrief`, `?secret`, `?ubb`, `?souvenirs=fake` ne changent pas.
- **Clés de stockage** (préfixe `swap-cyrielle:`, toujours dans un `try/catch`) : `swap-cyrielle:hub` (localStorage, id de la dernière carte) et `swap-cyrielle:fold` (sessionStorage, monde dont la plaque doit se replier au démarrage).
- **Couleurs des mondes** : swap fond `#7A1F35`, encre `#F6EFE6` ; ubb fond `#ECE7DF` (le plâtre de la galerie), encre `#7A1733` ; aventures fond `#0F8C8A`, encre `#FFF8E7`, soleil `#F2B134`.
- **Nombres affichés** : tirés des données (`content.gifts.length` = 9, `content.museum.matches.length` = 14, `AVENTURES.length` = 15).
- **Textes**, dans `js/content.js` :
  ```js
  hub: {
    title: "Cycy et Kevin",
    hint: "Glisse pour choisir, touche pour entrer",
    worlds: {
      swap: { title: "Le Swap", note: "{n} cadeaux" },
      ubb: { title: "La Galerie UBB", note: "{n} matchs" },
      aventures: { title: "Nos aventures", note: "{n} aventures" },
    },
    dot: "Monde {n} sur 3",
  },
  aventures: { title: "Nos aventures", soon: "Le passeport arrive bientôt ✈️", back: "‹ Accueil" },
  ```
- **Nom** : « Cycy et Kevin » (titre de la page, `apple-mobile-web-app-title`, `name` et `short_name` du manifeste).
- **Méthode** : TDD, chaque test vu en échec d'abord. Branche `portail`, commits avec `-- <chemins>`, pas de push sans Kevin.
- **Vérifier** : `npm test` (unitaires) ; de bout en bout `node tests/e2e/hub.mjs`, avec `npm run dev` lancé à côté (port 5173). Chrome est cherché au chemin standard de Windows ou dans la variable `CHROME`. Écrans : 393 × 852, 375 × 667, 1440 × 900.
- **Ne pas toucher** à l'intérieur du swap ni de la galerie, sauf ce qui est listé ici. Les scripts de bout en bout des sessions précédentes ne sont pas dans le dépôt : `tests/e2e/hub.mjs` fait office de vérification du swap (tâche 3).

## Points à surveiller
1. **Double toucher sur une carte**, ou toucher pendant une transition : on entre une seule fois, une seule entrée d'historique. *(Tâche 4)*
2. **Retour du navigateur pendant une transition** : à la fin, un seul écran, celui qui correspond à l'adresse, et aucune plaque oubliée. *(Tâches 4 et 5)*
3. **Lien direct vers un monde** (`#/ubb`, `#/aventures/roadtrip`) ouvert dans un onglet neuf : le monde s'ouvre ; son bouton retour mène au hub sans quitter le site. *(Tâche 4)*
4. **Stockage bloqué** (navigation privée) : le hub fonctionne, il ne retient simplement pas la carte. *(Tâche 5)*
5. **Téléphone tourné** ou fenêtre redimensionnée sur le hub : la carte du centre reste la même. *(Tâche 5)*

---

### Tâche 1 : le routeur
**Fichiers :**
- Créer : `js/router.js`
- Tests : `tests/router.test.mjs`

**Interfaces :**
- Produit :
  - `parseRoute(hash: string) → { world: "hub" | "swap" | "ubb" | "aventures", id: string | null }` ;
  - `routeHash(route) → string` (l'inverse) ;
  - `legacyRedirect(search: string) → { search: string, hash: string } | null` ;
  - `createRouter(onRoute: (route, previous) => void) → { current(): route, go(route): void, back(): void, start(): void }`.
    - `go` pousse l'adresse (`history.pushState({ portail: true }, "", hash)`) puis appelle `onRoute`.
    - `back()` fait `history.back()` si `history.state?.portail`, sinon remplace l'adresse par `#/` (`replaceState`) et appelle `onRoute`.
    - `start()` écoute `popstate` et appelle `onRoute(parseRoute(location.hash), null)` une première fois.
    - `onRoute` reçoit l'itinéraire précédent (`null` au démarrage).

- [ ] **Tests** (`tests/router.test.mjs`) :
  ```js
  for (const h of ["", "#", "#/"]) assert.deepEqual(parseRoute(h), { world: "hub", id: null });
  assert.deepEqual(parseRoute("#/swap"), { world: "swap", id: null });
  assert.deepEqual(parseRoute("#/ubb/"), { world: "ubb", id: null });
  assert.deepEqual(parseRoute("#/UBB"), { world: "ubb", id: null });
  assert.deepEqual(parseRoute("#/aventures"), { world: "aventures", id: null });
  assert.deepEqual(parseRoute("#/aventures/roadtrip"), { world: "aventures", id: "roadtrip" });
  for (const h of ["#/inconnu", "#/swap/extra", "#/aventures/../x", "#/aventures/%3Cb%3E", "#/aventures/a/b"])
    assert.deepEqual(parseRoute(h), { world: "hub", id: null });
  assert.equal(routeHash({ world: "hub", id: null }), "#/");
  assert.equal(routeHash({ world: "aventures", id: "roadtrip" }), "#/aventures/roadtrip");
  for (const h of ["#/", "#/swap", "#/ubb", "#/aventures", "#/aventures/paris-2"]) assert.equal(routeHash(parseRoute(h)), h);
  assert.deepEqual(legacyRedirect("?musee"), { search: "", hash: "#/ubb" });
  assert.deepEqual(legacyRedirect("?musee&css"), { search: "?css", hash: "#/ubb" });
  assert.deepEqual(legacyRedirect("?css&musee&souvenirs=fake"), { search: "?css&souvenirs=fake", hash: "#/ubb" });
  for (const s of ["", "?demo", "?ubb", "?rejouer"]) assert.equal(legacyRedirect(s), null);
  ```
- [ ] Lancer `npm test` : les nouveaux tests échouent (module absent).
- [ ] Écrire `js/router.js`. Les trois fonctions pures ne touchent ni `window` ni `location` (importables sous Node) ; `createRouter` ne lit `window` qu'à l'appel.
- [ ] `npm test` : tout passe (63 anciens + les nouveaux).
- [ ] Commit : `git commit -m "Portail : le routeur (adresses en #)" -- js/router.js tests/router.test.mjs`

### Tâche 2 : les données du hub et des aventures
**Fichiers :**
- Créer : `js/hub-logic.js`, `js/aventures/data.js`
- Modifier : `js/content.js` (ajouter `hub` et `aventures` ; retirer `home.museum`)
- Tests : `tests/hub.test.mjs`

**Interfaces :**
- Produit :
  - `WORLDS: [{ id: "swap" | "ubb" | "aventures", color, ink }]`, dans cet ordre, avec les couleurs des contraintes globales ;
  - `hubWorlds(content, aventuresCount) → [{ id, title, note, color, ink }]`, les notes remplies avec `fill` (de `js/logic.js`) ;
  - `closestIndex(centers: number[], viewCenter: number) → number` ;
  - `cardScale(distance, cardWidth) → number`, qui vaut `1 − 0,12 × min(1, |distance| / cardWidth)` ;
  - `cardFade(distance, cardWidth) → number`, qui vaut `1 − 0,45 × min(1, |distance| / cardWidth)` ;
  - `AVENTURES: [{ id, name, from: "AAAA-MM-JJ", to: "AAAA-MM-JJ" }]`, les 15 sorties du § 3 de la spec, ordonnées par date, avec les noms de tampon (`name` identique à `tampons.json`).

- [ ] **Tests** (`tests/hub.test.mjs`) :
  ```js
  assert.deepEqual(hubWorlds(content, 15).map((w) => [w.id, w.title, w.note]), [
    ["swap", "Le Swap", "9 cadeaux"], ["ubb", "La Galerie UBB", "14 matchs"], ["aventures", "Nos aventures", "15 aventures"]]);
  assert.equal(hubWorlds(content, 15)[0].color, "#7A1F35");
  assert.equal(closestIndex([100, 400, 700], 390), 1);
  assert.equal(closestIndex([100, 400, 700], 560), 2);
  assert.equal(cardScale(0, 300), 1);
  assert.equal(cardScale(-150, 300), 0.94);
  assert.equal(cardScale(600, 300), 0.88);
  assert.equal(cardFade(300, 300), 0.55);
  const stamps = JSON.parse(readFileSync(new URL("../assets/aventures/tampons/tampons.json", import.meta.url)));
  assert.equal(AVENTURES.length, 15);
  assert.deepEqual(AVENTURES.map((a) => [a.id, a.name]), stamps.map((s) => [s.id, s.name]));
  assert.ok(AVENTURES.every((a) => /^\d{4}-\d{2}-\d{2}$/.test(a.from) && a.from <= a.to));
  assert.ok(AVENTURES.every((a, i) => i === 0 || AVENTURES[i - 1].from <= a.from));
  assert.equal(AVENTURES[0].from, "2025-05-17");
  assert.equal(AVENTURES[14].to, "2026-10-25");
  assert.equal(content.home.museum, undefined);
  ```
  Pour lire `tampons.json`, passer par `fileURLToPath` (le lecteur « c: » en minuscule avait déjà cassé un test).
- [ ] `npm test` : échec.
- [ ] Écrire `js/hub-logic.js` et `js/aventures/data.js` ; ajouter les textes dans `content.js` (copie exacte des contraintes globales) et retirer `home.museum`.
- [ ] `npm test` : tout passe.
- [ ] Commit : `-- js/hub-logic.js js/aventures/data.js js/content.js tests/hub.test.mjs`

### Tâche 3 : le banc de bout en bout
**Fichiers :**
- Créer : `tests/e2e/cdp.mjs`, `tests/e2e/hub.mjs` (hors de `npm test` : le motif `tests/*.test.mjs` ne descend pas dans `e2e/`)

**Interfaces :**
- Produit : `launch({ width, height, mobile }) → Promise<page>`. `page` donne :
  - `goto(url)` (attend `Page.loadEventFired`) ;
  - `eval(expression)` (`Runtime.evaluate`, `awaitPromise`, `returnByValue`) ;
  - `waitFor(expression, timeout = 5000)` ;
  - `tap(selector)` (toucher au centre de l'élément, `Input.dispatchTouchEvent`) ;
  - `swipe(selector, dx)` (`Input.synthesizeScrollGesture`, source `touch`) ;
  - `resize(width, height)` ;
  - `beforeLoad(script)` (`Page.addScriptToEvaluateOnNewDocument`) ;
  - `screenshot(file)` ;
  - `errors: string[]` (exceptions et `console.error`) ;
  - `close()`.
- Chrome est lancé avec `--headless=new --remote-debugging-port=0 --user-data-dir=<dossier temporaire>`. L'adresse WebSocket se lit sur sa sortie d'erreur (« DevTools listening on ws://… ») ; on s'y connecte avec le `WebSocket` natif de Node. Écran mobile : `Emulation.setDeviceMetricsOverride` (`mobile: true`, facteur 3) et `Emulation.setTouchEmulationEnabled`.
- `hub.mjs` enchaîne des vérifications nommées, affiche `✔ nom` ou `✘ nom : détail`, et sort avec le code 1 au premier échec. Une vérification échoue aussi si `page.errors` a grandi pendant qu'elle tournait. Base : `http://localhost:5173/`.

- [ ] **Vérifications sur le site actuel** (avant tout changement de comportement), en 393 × 852 :
  - `/` affiche `.screen-home`, sans erreur ;
  - `?musee&css` affiche `.screen-museum` ;
  - `?demo` : « Redécouvrir le swap » puis « Revoir mon parcours » affichent l'intro du swap (`.screen-welcome`, ou l'écran sur lequel le parcours démo s'ouvre).
- [ ] Lancer `npm run dev` puis `node tests/e2e/hub.mjs` : tout est ✔.
- [ ] Commit : `-- tests/e2e/cdp.mjs tests/e2e/hub.mjs`

### Tâche 4 : brancher les mondes sur le routeur
Un hub encore sobre (trois boutons) et des fondus simples : la tâche 5 apporte le carrousel et les plaques.

**Fichiers :**
- Modifier :
  - `js/main.js` : démarrage, `show()`, bouton ⌂, `openMuseum` ;
  - `js/home.js` : plus de bouton galerie ni de `noHome` ;
  - `js/state.js` : drapeau de repli ;
  - `js/testpage.js` ;
  - `css/style.css`.
- Créer : `js/aventures/screen.js` (la coquille), `js/hub.js` (version minimale).
- Tests : `tests/e2e/hub.mjs`.

**Interfaces :**
- Consomme : `createRouter`, `parseRoute`, `legacyRedirect` (tâche 1) ; `hubWorlds`, `AVENTURES` (tâche 2).
- Produit :
  - `hubScreen({ worlds, start, onEnter(id, cardEl) }) → { el, noHome: true, enter(), leave(), cardOf(id): HTMLElement }`. Ici, une section `.screen-hub` avec un bouton `[data-world=<id>]` par monde ; la tâche 5 garde cette signature.
  - `aventuresScreen({ onBack }) → { el, noHome: true, enter(), leave() }` : section `.screen-aventures` sur fond `#0F8C8A`, titre, phrase `soon`, bouton retour `.world-back`.
  - `setFold(world)` et `takeFold() → string | null` dans `state.js` (le second lit puis efface `swap-cyrielle:fold`).
  - Dans `main.js` :
    - `show(screen, { instant = false } = {})` : `instant` remplace sans fondu ;
    - `museumWorld(onBack) → Promise<screen>`, l'ancien `openMuseum` qui renvoie l'écran au lieu de l'afficher (le secours CSS est gardé tel quel) ;
    - `reloadToHub()` : `setFold("swap")`, `history.replaceState(null, "", location.pathname + "#/")`, `location.reload()`.

**Comportement dans `main.js` :**
- **Au démarrage :** si `legacyRedirect(location.search)` renvoie une adresse, la remplacer (`replaceState`) avant tout le reste. Garder la chaîne des aperçus (`?test`, `?demo&scene`, `?pub`, `?debrief`, `?secret`, `?ubb`, `?rejouer`), sinon `router.start()`.
- **`onRoute(route, previous)` :**
  - si `previous?.world === "swap"` et que l'on va ailleurs : `reloadToHub()` ;
  - hub : `hubScreen` avec `start: previous?.world ?? loadHubCard()` (tâche 5 ; ici, `previous?.world ?? "swap"`) ;
  - swap : `home()` ;
  - ubb : `museumWorld(() => router.back())` ;
  - aventures (avec ou sans id) : la coquille, chargée à la demande (`await import("./aventures/screen.js")`), avec `onBack: () => router.back()`.
- **Pendant une transition** (un drapeau `busy`), un toucher sur une carte est ignoré. Un `popstate` reçu pendant ce temps est gardé (le dernier gagne) et traité à la fin.
- **Bouton ⌂** : `reloadToHub()`. Il apparaît maintenant sur l'accueil du swap (on retire `noHome: true` de `home.js`).
- **Page de test** : un groupe « Portail » (`./#/`, `./#/swap`, `./#/ubb`, `./#/aventures`, `./#/aventures/roadtrip`, `?musee`). Le lien « Galerie des matchs » devient `./#/ubb`.

- [ ] **Vérifications** à ajouter à `hub.mjs` (en remplaçant celle de `/` → `.screen-home`) :
  - `/` affiche `.screen-hub` avec trois `[data-world]` ;
  - toucher `swap` : adresse `#/swap`, `.screen-home` et `.home-button` visibles ;
  - toucher `.home-button` : la page se recharge, adresse `#/`, `.screen-hub` ;
  - toucher `ubb` : `.screen-g3d` (ou `.screen-museum`) ; `history.back()` → `.screen-hub` ;
  - `/#/ubb` dans un onglet neuf, puis `.mu-back` : adresse `#/`, `.screen-hub`, et `history.length` n'a pas bougé *(point 3)* ;
  - `?musee` : `location.search === ""` et `location.hash === "#/ubb"` ; `?musee&css` : `location.search === "?css"` et `.screen-museum` ;
  - `/#/aventures/roadtrip` : `.screen-aventures` ; `.world-back` → `.screen-hub` ;
  - `/#/nimporte` : `.screen-hub` ;
  - deux touchers à 50 ms d'intervalle sur `aventures` : au bout de 2 s, un seul `.screen` dans `#app` et `history.length` +1 *(point 1)* ;
  - toucher `aventures` puis `history.back()` 100 ms après : au bout de 2 s, un seul `.screen`, et il correspond à `location.hash` *(point 2)* ;
  - cinq allers-retours hub ↔ galerie : aucune erreur, plus aucun `<canvas>` une fois revenu sur le hub ;
  - les vérifications `?demo` du swap de la tâche 3 passent toujours (en partant de `?demo#/swap`).
- [ ] `node tests/e2e/hub.mjs` : les nouvelles vérifications échouent.
- [ ] Écrire le branchement. `npm test` puis `node tests/e2e/hub.mjs` : tout est ✔, sans erreur de console.
- [ ] Commit : `-- js/main.js js/home.js js/state.js js/testpage.js js/hub.js js/aventures/screen.js css/style.css tests/e2e/hub.mjs`

### Tâche 5 : le carrousel et les plaques
**Fichiers :**
- Créer : `js/plate.js`
- Modifier : `js/hub.js` (version complète), `js/main.js` (transitions), `js/state.js`, `css/style.css`
- Tests : `tests/e2e/hub.mjs`

**Interfaces :**
- Consomme : `cardScale`, `cardFade`, `closestIndex`, `WORLDS` (tâche 2) ; `takeFold` (tâche 4) ; `createAvatar` (`js/avatar.js`).
- Produit :
  - `coverFrom(rect, color) → Promise<HTMLElement>` : une plaque fixe `.plate` part du rectangle de la carte (`clip-path: inset(t r b l round 28px)`) et remplit l'écran (`inset(0 round 0)`) en 0,55 s, `power3.inOut` ;
  - `coverNow(color) → HTMLElement` : la plaque pleine, tout de suite ;
  - `fadeCover(color) → Promise<HTMLElement>` : la plaque pleine, en fondu de 0,25 s ;
  - `reveal(plate) → Promise<void>` : fondu de sortie de 0,35 s, puis la plaque est retirée ;
  - `collapseInto(plate, rect) → Promise<void>` : de plein écran au rectangle en 0,5 s, puis un fondu, puis la plaque est retirée.
  - `loadHubCard() → id` (`"swap"` par défaut) et `saveHubCard(id)` dans `state.js`.
  - `hubScreen` garde la signature de la tâche 4 et ajoute `current(): id`.

**Le hub :**
- Titre `content.hub.title` ; au-dessus des cartes, Mini Cycy (`face: "wink"`, `tapFaces: ["joy", "kiss", "peace", "cool", "wink"]`) et Kevin (`face: "kevin-joy"`, `tapFaces: ["kevin-wink", "kevin-kiss", "kevin-cheer", "kevin-smug", "kevin-surprised"]`) ; dessous les cartes, trois points (`aria-label` `content.hub.dot`) et la phrase `hint`.
- **La piste** `.hub-track` : défilement horizontal natif, `scroll-snap-type: x mandatory`, cartes `scroll-snap-align: center`, largeur `min(78vw, 340px)`, des marges pour que la première et la dernière puissent se centrer.
- **Au défilement** (un seul `requestAnimationFrame` par image), sur le visage intérieur de chaque carte (`.hub-card-face`, jamais le bouton animé par GSAP) : `transform: scale(cardScale(d, w))` et `filter: opacity(cardFade(d, w))`. La carte la plus proche du centre (`closestIndex`) donne `data-current` sur `.screen-hub` et `aria-current` sur la carte. Quand elle change : `saveHubCard`, les deux chibis sautent et réagissent (`react("joy")`, `react("kevin-cheer")`).
- **Toucher une carte :** si elle n'est pas au centre, elle y défile (`scrollTo`, `behavior: "smooth"`) sans entrer. Si elle est au centre, `onEnter(id, cardEl)`.
- **À l'ouverture**, la piste est positionnée sur `start` sans animation, avant le premier affichage. Au redimensionnement, la carte courante est recentrée *(point 5)*.
- **Chaque carte** porte sa couleur (`--world-bg`, `--world-ink` de `WORLDS`), son titre, sa note et une illustration en SVG dans le fichier : un paquet cadeau avec ruban doré (swap), un ballon de rugby dans un cadre doré (ubb), un passeport bordeaux fermé et un soleil (aventures).

**Les transitions dans `main.js` :**
- **Entrer depuis le hub :** `sfx("tap")` au toucher, puis `sfx("whoosh")` et `coverFrom(carte, couleur du monde)`. Pendant ce temps, les chibis glissent vers le centre de la carte et rapetissent (sous la plaque). Puis `show(monde, { instant: true })`, puis `reveal`.
- **Revenir au hub** depuis la galerie ou les aventures : `fadeCover(couleur du monde quitté)`, `show(hub, { instant: true })` avec `start` = ce monde, puis `collapseInto(plate, hub.cardOf(monde).getBoundingClientRect())`.
- **Démarrage avec `takeFold()`** : `coverNow(couleur)`, le hub sur ce monde, puis `collapseInto`.
- **Lien direct** vers un monde : pas de plaque, le fondu habituel.

- [ ] **Vérifications** à ajouter à `hub.mjs` :
  - `swipe(".hub-track", -260)` : `data-current` passe de `swap` à `ubb` ; après rechargement, toujours `ubb` ;
  - toucher la carte `aventures` quand `ubb` est au centre : l'adresse reste `#/`, `data-current` devient `aventures` ;
  - toucher la carte du centre : un `.plate` existe pendant la transition ; au bout de 1,5 s, plus aucun `.plate`, et le monde est affiché ;
  - `history.back()` : `.screen-hub`, `data-current` égal au monde quitté, plus aucun `.plate` au bout de 1,5 s ;
  - ⌂ depuis le swap : après rechargement, un `.plate` à 100 ms, plus aucun à 1,5 s, `data-current="swap"` ;
  - `resize(852, 393)` puis `resize(393, 852)` : `data-current` inchangé *(point 5)* ;
  - avec `beforeLoad("Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqué'); } })")` : `.screen-hub` s'affiche, on entre dans un monde et on en revient, aucune erreur *(point 4)* ;
  - toutes les vérifications de la tâche 4 passent toujours, sur les trois écrans ;
  - captures du hub sur les trois écrans, dans le scratchpad, pour un contrôle à l'œil.
- [ ] `node tests/e2e/hub.mjs` : les nouvelles vérifications échouent.
- [ ] Écrire `plate.js`, le hub complet, les transitions et le CSS.
- [ ] `npm test` et `node tests/e2e/hub.mjs` : tout est ✔. Regarder les captures, puis donner à Kevin le lien `http://localhost:5173/`.
- [ ] Commit : `-- js/plate.js js/hub.js js/main.js js/state.js css/style.css tests/e2e/hub.mjs`

### Tâche 6 : le nom, l'icône, le README
**Fichiers :**
- Modifier : `index.html`, `manifest.webmanifest`, `README.md`
- Créer : `tools/icone/icone.html`, `tools/icone/render.mjs`
- Remplacer : `assets/logo/apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `favicon-32.png`, `favicon-64.png`
- Tests : `tests/hub.test.mjs`, `tests/e2e/hub.mjs`

**Interfaces :**
- `tools/icone/icone.html?size=N&tile=full|round` dessine les visages de Mini Cycy (`assets/cyrielle/wink.webp`) et de Kevin (`assets/cyrielle/kevin-wink.webp`), cadrés sur la tête et côte à côte, sur une tuile `#7A1F35` : pleine pour l'iPhone et le manifeste (180, 192, 512), arrondie sur fond transparent pour les favicons (32, 64).
- `node tools/icone/render.mjs` lance Chrome sans interface (`--screenshot`, `--window-size=N,N`, `--default-background-color=00000000`) pour chaque taille, et écrit dans `assets/logo/`.

- [ ] **Tests** (`tests/hub.test.mjs`) :
  ```js
  const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url)));
  assert.equal(manifest.name, "Cycy et Kevin");
  assert.equal(manifest.short_name, "Cycy et Kevin");
  const png = (f) => readFileSync(new URL(`../assets/logo/${f}`, import.meta.url));
  const size = (b) => [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (const [f, n] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512], ["favicon-32.png", 32], ["favicon-64.png", 64]])
    assert.deepEqual(size(png(f)), [n, n]);
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Cycy et Kevin<\/title>/);
  assert.match(html, /apple-mobile-web-app-title" content="Cycy et Kevin"/);
  ```
  Les tailles d'icônes passent déjà ; le test sert de garde-fou après le nouveau rendu.
- [ ] `npm test` : échec (nom).
- [ ] Écrire `icone.html` et `render.mjs`, lancer le rendu, regarder les cinq PNG, puis mettre à jour `index.html` et le manifeste.
- [ ] `npm test` : tout passe. Dans `hub.mjs`, ajouter `document.title === "Cycy et Kevin"`, puis le lancer : tout est ✔.
- [ ] **README** :
  - le haut de page devient « Cycy et Kevin » (le swap, la galerie, Nos aventures) ;
  - nouvelles adresses (`#/…`) et adresses spéciales mises à jour ;
  - `tests/e2e/` (comment le lancer) ;
  - `tools/icone/` ;
  - une ligne dans « Avancement » et dans le « Journal ».
- [ ] Commit : `-- index.html manifest.webmanifest assets/logo tools/icone README.md tests/hub.test.mjs tests/e2e/hub.mjs`
- [ ] **Fin du sous-projet** : relecture indépendante de toute la branche, puis essai de Kevin sur l'iPhone (retirer l'ancienne icône de l'écran d'accueil et la rajouter).
