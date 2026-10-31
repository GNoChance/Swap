# L'intro du Premier canoë : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :** `#/aventures/canoe` joue la vraie intro du Premier canoë, environ 31 s en papier découpé.
- Elle commence par la carte en deux étapes : la C3 de Bordeaux à Port d'Enveaux, puis le bus jusqu'à Carsac.
- Elle finit sur l'affiche « LA DORDOGNE ».
- Entre les deux, les 10 temps de la spec : les ronds dans l'eau, le burger, le plouf, Sarlat et La Roque-Gageac de nuit.

**Architecture :**
- **Le scénario** `intros/canoe.js` suit le modèle de `intros/bivouac-1.js` : des scènes empilées, cachées jusqu'à leur temps, et une timeline GSAP en pause.
- **La boîte à outils `js/aventures/scene/` gagne :**
  - la carte en deux étapes : `carte` sait nommer son arrivée, et la nouvelle recette `relais` part de la même mécanique de route ;
  - les recettes de l'eau (`recipes-eau.js`) ;
  - un acteur à plusieurs vues pour les stickers de scène, et les bulles (`actors.js`) ;
  - les accessoires de la Dordogne, de Sarlat et de La Roque-Gageac, dans de nouveaux `props-*.js` ;
  - cinq sons.
- **Les tests du navigateur** passent leurs aides communes dans `tests/e2e/intro-kit.mjs`, partagé par la suite du bivouac et par la nouvelle suite `tests/e2e/intros-canoe.mjs`.

**Stack :** vanilla, modules natifs, GSAP global (`window.gsap`), SVG et CSS, WebAudio, `node --test`, banc CDP maison (`tests/e2e/`).

**Spec :** `docs/specs/2026-10-31-intros-canoe-design.md`, en entier. Elle suit `docs/specs/2026-10-30-intros-3a-design.md`, dont les règles s'appliquent là où elle ne dit pas autre chose.

**Références visuelles** (sur le disque, hors git) :
- **les photos de Kevin** (`planches/voyages/canoe/photos/`) :
  - le plan du loueur, de Carsac à Port d'Enveaux ;
  - le selfie dans le canoë, la rivière sous les arbres, l'avant du canoë vert anis ;
  - la rue aux guirlandes de Sarlat, le chevalier ;
  - La Roque-Gageac de nuit, avec la gabare « Norbert » ;
- **ses planches** (`planches/voyages/canoe/`) ;
- **le style papier de la tranche 3a**, dans ses accessoires (`js/aventures/scene/props*.js`) et sa palette d'affiche (`AFFICHE`, `decor.js`).

## Contraintes globales
- **Les règles du projet :**
  - jamais de `transition` CSS sur `opacity` ou `transform` d'une cible GSAP, ni de `@keyframes` sur une cible GSAP ;
  - `const reduced = false` ;
  - aucune dépendance ajoutée ;
  - le stockage passe uniquement par `js/state.js`, et cette tranche n'ajoute aucune clé ;
  - commentaires courts, en anglais, à la densité des fichiers voisins ;
  - les textes affichés vont dans `js/content.js`. Les noms de la carte restent dans `js/aventures/data.js`, comme pour le bivouac.
- **La fluidité (spec 3a, § 4) :**
  - chaque couche de décor est dessinée une fois et ne fait que se déplacer (`transform`) ;
  - on n'anime jamais les paramètres d'un filtre SVG ;
  - une lumière qui change (les reflets de La Roque-Gageac) est sur sa propre couche, et on n'anime que son opacité, comme `.st-glow` au bivouac.
- **Ce qui ne change pas de comportement :**
  - l'intro du bivouac, le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - `tests/e2e/intros.mjs` (35), `tests/e2e/hub.mjs` (60) et `tests/e2e/aventures.mjs` restent verts. Seuls les tests qui jouaient l'intro du canoë comme intro provisoire passent sur l'Île de Ré (tâche 3).
- **La scène :**
  - 390 × 760 unités, zone sûre de x = 25 à x = 365 ;
  - chaque décor couvre au moins 1600 unités de large, déplacements compris (un écran de 1920 × 1080).
- **Les durées :**
  - l'intro du canoë dure entre 30 et 32 s, et ses temps sont ceux de `SCENARIOS.canoe.beats` (tâche 3) ;
  - la fin vient toujours de la timeline, jamais d'une minuterie.
- **Les stickers :**
  - planches hors git (`planches/`) ;
  - les standards à 300 px de large, les scènes à 600 px ;
  - l'intro ne charge que ceux de `intros/canoe.stickers.js`.
- **Le serveur de test :** http://localhost:5173. S'il ne répond pas, lance `node tests/e2e/serve.mjs` en arrière-plan, sans en relancer un deuxième.
- **Les commits :** avec pathspec, un message en français « Intros : … » qui se termine par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pas de push, ni merge, ni `--force`.

## Points à surveiller (Review Focus)
1. **Le passeport qui précharge le canoë.** Le bivouac est tamponné et le livre est posé : le fichier `intros/canoe.js` est déjà demandé, et le toucher sur le Premier canoë ne le redemande pas. Testé en tâche 3.
2. **Un `?demo&t=` au milieu d'un pivot ou d'une bulle.** Le canoë montre exactement une vue, et à la fin des ronds dans l'eau sa largeur est revenue entière (scaleX de ±1), rien n'est resté écrasé. Testé en tâche 4.
3. **Tourner le téléphone pendant les ronds dans l'eau** (portrait → paysage, puis 1 s plus tard → portrait). La timeline avance tout du long, et le canoë et les bulles restent entiers dans l'écran. Testé en tâche 4.
4. **Entrer dans l'intro du canoë et en sortir trois fois de suite,** dont une fois pendant la nuit (les grillons) : `gsap.globalTimeline.getChildren()` revient à son compte de départ et aucune `.st-stage` ne reste. Testé en tâche 6.
5. **Un PC en 1920 × 1080 pendant la descente, Sarlat et La Roque-Gageac** (des décors zoomés) : chaque couche couvre toute la largeur. Testé en tâche 6.

---

### Tâche 1 : les 121 stickers du canoë et de la C3

**Fichiers :**
- Modifier : `tools/decoupe/names.mjs`, `tools/decoupe/decoupe.mjs`
- Créer : `assets/aventures/canoe/*.webp` (48 + 61), `assets/aventures/vehicules/c3-*.webp` (12)
- Test : `tests/decoupe.test.mjs`

**Interfaces :**
- Produit :
  - `stickerWidth({ scene: boolean }) → number`, dans `names.mjs` : 600 pour une scène, 300 sinon ;
  - les fichiers de la spec, § 3, dont `canoe/scene-<planche>-NN.webp` ;
  - **la correspondance réelle** des numéros des scènes avec ce qu'elles montrent, écrite dans le rapport. Les tâches 3 à 6 la suivent.

- [ ] **Étape 1 : écrire le test qui échoue.** `decoupe: a scene sticker is 600 px wide, a standard one 300` vérifie que `stickerWidth({ scene: true }) === 600` et que `stickerWidth({ scene: false }) === 300`.
- [ ] **Étape 2 :** `npm test`. Résultat attendu : ÉCHEC, `stickerWidth` n'existe pas.
- [ ] **Étape 3 : implémenter.**
  - écrire `stickerWidth` ;
  - `decoupe.mjs` remplace `WIDTH` par `stickerWidth({ scene })` pour le recadrage ;
  - la planche de contrôle montre les scènes à leur taille, jusqu'à 300 px de haut.
- [ ] **Étape 4 :** `npm test`. Résultat attendu : tout est vert, avec un test de plus.
- [ ] **Étape 5 : lancer l'outil.**
  - les commandes :
    ```
    node tools/decoupe/decoupe.mjs planches/voyages/canoe
    node tools/decoupe/decoupe.mjs "planches/voyages/canoe/<planche>.png" --scene   (×6 : Cycy en gilet de sauvetage, Kevin en gilet de sauvetage, Cycy qui mange, Kevin qui mange, Cycy et Kevin en canoë, Sarlat le chevalier)
    node tools/decoupe/decoupe.mjs planches/voyages/vehicules/C3.png
    ```
  - résultat attendu :
    - 48 + 61 + 12 fichiers ;
    - les standards entre 10 et 60 Ko, les scènes entre 30 et 180 Ko ;
    - 12 stickers par planche, sauf le chevalier qui en a 1.
  - **si une planche s'arrête** (des stickers collés, par exemple des éclaboussures), ne la règle pas en devinant. Écris-le dans le rapport avec la capture de la planche de contrôle, et marque la tâche DONE_WITH_CONCERNS.
- [ ] **Étape 6 : le contrôle à l'œil.**
  - Ouvre chaque planche de contrôle (capture).
  - Vérifie que les noms des poses et des vues correspondent, que les contours blancs sont entiers et qu'il n'y a ni morceau voisin ni tache.
  - **Écris dans le rapport ce que montre chaque numéro** des 5 planches de scènes. Pour « Cycy et Kevin en canoë », compare avec l'ordre attendu de la spec (§ 3) et signale toute différence.
  - Mets les captures dans le rapport.
- [ ] **Étape 7 : commit.**
  ```
  git add tools/decoupe tests/decoupe.test.mjs assets/aventures/canoe assets/aventures/vehicules
  git commit -m "Intros : les stickers du Premier canoë et de la C3, les scènes à 600 px" -- <les mêmes chemins>
  ```

### Tâche 2 : les données du canoë, et la carte qui nomme son arrivée

**Fichiers :**
- Modifier : `js/aventures/data.js`, `js/aventures/scene/props-carte.js` (`stops`), `js/aventures/scene/urls.js`, `js/content.js`
- Test : `tests/intros.test.mjs`

**Interfaces :**
- Produit :
  - **la sortie `canoe` dans `AVENTURES`**, avec exactement :
    ```js
    transports: ["c3", "bus", "canoe"],
    lieu: "La Dordogne",
    trajet: {
      depart: "Bordeaux",
      etapes: ["Bergerac"],
      etapesAt: [4],
      arrivee: "Port d'Enveaux",
      // [lat, lon]: Bordeaux, Libourne, Castillon-la-Bataille, Sainte-Foy-la-Grande, Bergerac, Lalinde, Le Buisson-de-Cadouin, Siorac-en-Périgord, Saint-Cyprien, Port d'Enveaux
      points: [[44.837, -0.579], [44.915, -0.244], [44.854, -0.042], [44.838, 0.220], [44.853, 0.483], [44.838, 0.742], [44.822, 0.910], [44.822, 0.983], [44.869, 1.042], [44.836, 1.110]],
      relais: { transport: "bus", arrivee: "Carsac", noms: ["Beynac", "Castelnaud", "La Roque-Gageac", "Domme", "Sarlat"] },
    },
    ```
  - **`stops({ trajet, lieu }, project)`** nomme l'arrivée `trajet.arrivee ?? lieu`. Le bivouac ne change pas ;
  - **`sceneUrl(outing, board, k) → string`** : `sceneUrl("canoe", "cycy-et-kevin-en-canoe", 2)` vaut `"assets/aventures/canoe/scene-cycy-et-kevin-en-canoe-02.webp"` ;
  - **`content.aventures.intros.canoe`** = `{ depart: "Carsac · 28 km", arrivee: "28 km !", gabare: "Norbert" }`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`tests/intros.test.mjs`) :
  - `intros: the canoe goes by C3, bus and canoe to La Dordogne` :
    - `byId("canoe").transports` vaut `["c3", "bus", "canoe"]` et `byId("canoe").lieu` vaut `"La Dordogne"` ;
    - avec `CANOE_MAP = { origin: [44.837, -0.579], at: { x: 50, y: 330 }, unitsPerDegree: 230 }`, chaque point projeté est dans x 25 à 365 et y 120 à 700 ;
    - l'arrivée est à l'est du départ ;
  - `intros: a trip's relay is known` : pour chaque sortie qui a un `trajet.relais` :
    - `relais.transport` est dans `TRANSPORTS` et dans les `transports` de la sortie ;
    - `relais.arrivee` est une chaîne non vide ;
    - `relais.noms` est un tableau de chaînes non vides ;
    - et `byId("canoe").trajet.relais.arrivee` vaut `"Carsac"` ;
  - `intros: a trip names its own arrival, else the lieu` :
    - pour le canoë, `stops(...)` donne les noms `["Bordeaux", "Bergerac", "Port d'Enveaux"]` ;
    - le bivouac donne toujours `["Bordeaux", "Pau", "Lacs d'Ayous"]` ;
  - `intros: scene sticker urls` : l'exemple de `sceneUrl` ci-dessus, et `sceneUrl("canoe", "sarlat-le-chevalier", 1)`.
- [ ] **Étape 2 :** `npm test`. Résultat attendu : ÉCHEC sur ces 4 tests.
- [ ] **Étape 3 : implémenter.** Le commentaire d'en-tête de `data.js` dit en une phrase ce que sont `arrivee` et `relais`.
- [ ] **Étape 4 :** `npm test`. Résultat attendu : tout est vert. Le test existant `every stage of a trip has its point on the road` couvre aussi le canoë (`etapesAt: [4]`).
- [ ] **Étape 5 : commit.** `git commit -m "Intros : les données du Premier canoë (C3, bus, canoë ; La Dordogne ; le trajet et son relais)" -- js/aventures/data.js js/aventures/scene/props-carte.js js/aventures/scene/urls.js js/content.js tests/intros.test.mjs`

### Tâche 3 : la carte en deux étapes, l'affiche, et le canoë qui monte son scénario

**Fichiers :**
- Créer :
  - `js/aventures/intros/canoe.js`, `js/aventures/intros/canoe.stickers.js` ;
  - `js/aventures/scene/props-perigord.js` (les vignes et les bois du Périgord sur la carte régionale, la carte illustrée de la vallée, le bus) ;
  - `js/aventures/scene/props-riviere.js` (l'eau, les rives, les falaises, les arbres qui penchent) ;
  - `js/aventures/scene/props-chateaux.js` (pour l'instant Beynac et son village, avec sa version affiche) ;
  - `tests/e2e/intro-kit.mjs`, `tests/e2e/intros-canoe.mjs`.
- Modifier :
  - `js/aventures/intros/index.js` ;
  - `js/aventures/scene/recipes.js` (la mécanique de route sortie de `carte`, et `relais`) ;
  - `js/aventures/scene/actors.js` (`sceneActor`, et `paperVehicle` pour le bus) ;
  - `js/audio.js` (`horn`) ;
  - `css/intros.css` ;
  - `tests/e2e/intros.mjs` (il importe le kit) ;
  - `tests/e2e/aventures.mjs` (si nécessaire, voir l'étape 7) ;
  - `package.json`, si les suites du navigateur y sont listées.

**Interfaces :**
- Consomme : la tâche 2 (`trajet.arrivee`, `trajet.relais`, `sceneUrl`) et la tâche 1 (les fichiers et la correspondance des numéros).
- Produit :
  - **`SCENARIOS.canoe`** = `{ load: () => import("./canoe.js"), beats }`, avec exactement ces `beats` :
    ```js
    [{ name: "La carte", at: 0 }, { name: "La mise à l'eau", at: 5 }, { name: "Les ronds dans l'eau", at: 7 }, { name: "La descente", at: 11 },
     { name: "Le coin perdu", at: 15 }, { name: "Le plouf", at: 18 }, { name: "L'arrivée", at: 21.2 }, { name: "Sarlat", at: 23.2 },
     { name: "La Roque-Gageac", at: 26.2 }, { name: "L'affiche", at: 28.6 }]
    ```
  - **`canoe.stickers.js`**, les 25 stickers de la spec (§ 2), d'après la correspondance de la tâche 1 :
    - `vehicules/c3-roule` et `vehicules/c3-coeurs` ;
    - du canoë à deux : le canoë qui pagaie de face, de dos, l'éclaboussure, Kevin qui aide Cycy, les pouces levés devant le canoë, debout avec les pagaies, le canoë devant la falaise (7) ;
    - en gilet : Cycy « question », Cycy « colère », Cycy en kayak (elle seule dans le canoë), Kevin « pleurs », Kevin « surprise » (5) ;
    - à table : pour chacun, le croc dans le burger, une frite, l'assiette vide avec les pouces levés, la main sur le ventre (8) ;
    - le chevalier (1) ;
    - `canoe/cycy-dos-question` et `canoe/kevin-dos-joie`.
    
    Toutes les tâches suivantes en citent une partie, et la liste se complète au fil des tâches. Le test « seuls ses stickers » exige que la liste soit exactement celle que le scénario affiche ;
  - **`sceneActor({ layer, who, looks, look, x, y, height }) → Actor`** :
    - `looks` = `{ [clé]: { src, fallback } }`, avec `src` = `sceneUrl(...)` et `fallback` = `fallbackUrl(...)` (spec, § 3) :
      - le canoë à deux : Cycy de face en « joie » ;
      - le chevalier : Kevin de face en « surprise » ;
      - une vue en gilet ou à table : la personne de face dans la pose la plus proche (« question », « colere », « pleurs », « surprise », sinon « joie ») ;
    - `el.dataset.who = who` ;
    - `show(tl, at, key)` montre une vue (`wearAt`) ;
    - il a les mêmes boîtes `st-actor` que les autres acteurs, et ses `imgs` vont à `preload` ;
  - **`paperVehicle({ layer, name, markup, x, y, width }) → Actor`** : un véhicule en papier (une image `data:image/svg+xml`) avec `el.dataset.vehicle = name`, `turn`, `bounce(tl, at, d)`. C'est ce que la mécanique de route sait conduire ;
  - **`relais(tl, at, { stage, from, layers, vehicle, route, duration }) → fin (s)`** :
    1. la caméra plonge vers le point de départ du relais sur la carte régionale (`from`, ses couches), et la carte de la vallée (`layers`) apparaît ;
    2. `vehicle` suit `route` (des points [x, y] en unités de scène) avec son pointillé et `stage.sound(..., "horn")` ;
    3. l'épingle du dernier point de `route` fait « plop » ;
  - **`valleyMap({ depart, arrivee, noms })`** (`props-perigord.js`) : le dessin de la carte de la vallée, avec ses noms écrits (ceux des données), et `VALLEY_ROUTE`, le chemin du bus en unités de scène ;
  - **la mécanique de route**, sortie de `carte` sans en changer le comportement : `roadOf({ layer, mover, points }) → { progress, tail, length }` (des getter/setter que GSAP anime, tenus sous `seek`). `carte` et `relais` l'utilisent.

- [ ] **Étape 1 : le kit des tests du navigateur.**
  - Déplacer de `tests/e2e/intros.mjs` vers `tests/e2e/intro-kit.mjs` les aides qui ne dépendent pas du bivouac : `VIEWPORTS`, `SEED`, `REJECT`, `LANDING`, `sleep`, `length`, `loaded`, `timeline`, `playing`, `holdAt`, `lagged`, `sceneBoxes`, `round`, `outside`, `inside`, `skipIs`, `settled`, `atPassport`, et un `beatsOf(id)` qui fait ce que fait `beat` pour une sortie donnée ;
  - `intros.mjs` les importe, et rien d'autre ne change ;
  - `node tests/e2e/intros.mjs`. Résultat attendu : 35 ✔, comme avant.
- [ ] **Étape 2 : écrire la suite qui échoue** (`tests/e2e/intros-canoe.mjs`, sur les 4 écrans de `VIEWPORTS` et 852 × 393), avec ses vérifications :
  - `?demo#/aventures/canoe` :
    - `data-length` est entre 30000 et 32000 ms ;
    - l'intro est jouée en entier ;
    - l'affiche dit exactement « LA DORDOGNE » et « Premier canoë · Dordogne · 11 août 2025 », avec son cadre et son lettrage dans l'écran ;
    - puis on revient au passeport ;
  - **sur la carte**, à ?t= 0,3, 1,5 et 2,6 :
    - la C3 (`data-vehicle="c3"`) est dans l'écran ;
    - « Bordeaux », « Bergerac » et « Port d'Enveaux » sont écrits, jamais coupés par le bord ;
  - **à ?t= 4,6 :**
    - le bus (`data-vehicle="bus"`) est dans l'écran ;
    - « Carsac » et son épingle sont dans l'écran ;
    - les noms du relais sont ceux des données ;
  - **les stickers demandés** sous `/assets/aventures/` sont exactement ceux de `canoe.stickers.js`, sans aucun d'une autre sortie ;
  - **un sticker de scène bloqué** (le canoë qui pagaie de face) passe sur son remplaçant `assets/cyrielle/joy.webp`, et l'intro se termine. Aucune autre erreur que celle du fichier bloqué ;
  - **point 1 du Review Focus :** le passeport posé, le bivouac tamponné : `intros/canoe.js` est déjà demandé une fois le livre arrivé, et le toucher sur le Premier canoë ne le redemande pas ;
  - **le passage :**
    - la première fois (bivouac tamponné, canoë à vivre, hors démo), un toucher au milieu ne passe pas l'intro ;
    - en `?demo`, « Passer ▸ » la termine et ramène au passeport ;
  - **le retour du navigateur** au milieu (vers 10 s, première fois) : pas d'erreur, et le canoë n'est pas marqué vu ;
  - **aucune erreur** dans la console sur toute la suite.
  
  Lancer `node tests/e2e/intros-canoe.mjs`. Résultat attendu : ÉCHEC, il n'y a pas de scénario.
- [ ] **Étape 3 : le scénario.**
  - Enregistrer `SCENARIOS.canoe`, et écrire `canoe.js` sur le modèle de `bivouac-1.js` : `mount(host, { aventure })` → `{ timeline, ready, dispose }` ;
  - **la carte régionale** utilise `projection({ origin: trajet.points[0], at: { x: 50, y: 330 }, unitsPerDegree: 230 })`, avec les pièces de `props-carte.js`, plus les vignes autour de Saint-Émilion et les bois du Périgord de `props-perigord.js` ;
  - `recipes.carte` va de 0 à 2,9 s, puis `recipes.relais` de 2,9 à 5 s, sur la carte illustrée de la vallée :
    - la rivière en méandres d'ouest en est ;
    - les petits châteaux et Domme, d'après le plan du loueur, sans aucun panneau de travaux ;
    - Port d'Enveaux à gauche et Carsac à droite, tous deux entre x = 40 et x = 350 ;
    - les `noms` du relais écrits à leur place ;
  - **de 5 à 28,6 s,** la scène de la rivière, de jour, se montre sans personne : l'eau, les rives, les falaises, Beynac. Les tâches 4 à 6 la remplissent ;
  - **à 28,6 s,** `recipes.affiche` part sur la rivière, avec Beynac sur sa falaise et le canoë devant la falaise (`sceneActor`, `who: "duo"`). Chaque couche a sa version affiche ;
  - **`horn`** dans `audio.js` : un « pouet » de petit bus, deux notes, environ 0,35 s.
- [ ] **Étape 4 :** `node tests/e2e/intros-canoe.mjs`. Résultat attendu : tout est vert.
- [ ] **Étape 5 :** `node tests/e2e/intros.mjs`. Résultat attendu : 35 ✔, le bivouac est inchangé, mécanique de route comprise.
- [ ] **Étape 6 :** `npm test`. Résultat attendu : tout est vert. `every sticker a scenario names exists` et `every outing with a scenario has its lieu` couvrent maintenant le canoë.
- [ ] **Étape 7 : `node tests/e2e/aventures.mjs`.**
  - Une vérification qui échoue parce que l'intro du canoë dure maintenant 31 s au lieu de l'intro provisoire passe sur l'**Île de Ré**, avec sa sauvegarde de départ adaptée pour que l'Île de Ré soit à vivre.
  - Les vérifications qui touchent le canoë **verrouillé** (il tremble, Mini Cycy boude) ne changent pas.
  - Ce qu'elles vérifient ne change pas.
  - Résultat attendu : tout est vert. Un rouge de temps de réponse du passeport déjà connu (profil neuf, rechargement) se relance une fois, et le rapport le dit.
- [ ] **Étape 8 : commit.** `git commit -m "Intros : le Premier canoë monte son scénario (la carte en deux étapes, la C3 puis le bus jusqu'à Carsac, et l'affiche « LA DORDOGNE »)" -- <les fichiers de la tâche>`

### Tâche 4 : l'eau, la mise à l'eau, les ronds dans l'eau, la descente

**Fichiers :**
- Créer : `js/aventures/scene/recipes-eau.js`
- Modifier :
  - `js/aventures/scene/actors.js` (`faceBubble`) ;
  - `js/aventures/scene/props-riviere.js` (la plage de galets, le panneau, les remous en spirale, le tournis, les gouttes) ;
  - `js/aventures/scene/props-chateaux.js` (Montfort, Domme) ;
  - un pont de Vitrac, dans `props-riviere.js` ;
  - `js/audio.js` (`paddle`), `css/intros.css`, `js/aventures/intros/canoe.js`, `canoe.stickers.js` ;
  - `tests/e2e/intros-canoe.mjs`.

**Interfaces :**
- Consomme : `sceneActor` (tâche 3).
- Produit :
  - **`flotte(tl, at, { actor, duration, strokes = true }) → fin`** : un tangage doux, rotation de ±2° et hauteur de ±2 unités, environ 1,2 s par balancement. Si `strokes`, il y a des gouttes de pagaie et `paddle` toutes les 0,45 s ;
  - **`tourne(tl, at, { actor, layer, faces: [cléFace, cléDos], turns = 2.5, duration }) → fin`** :
    - chaque demi-tour écrase l'acteur (`scaleX` vers 0), change de vue (face ↔ dos), puis le rallonge du côté opposé (`scaleX` de 1 à −1 en alternance), sur la boîte `st-actor__turn`, comme `person.turn`. Si cette boîte porte déjà un retournement en CSS (`is-flipped`), le pivot ne doit pas le contredire ;
    - en même temps, les remous en spirale tournent sous lui dans `layer`, le tournis flotte au-dessus, et `whoosh` sonne à chaque tour ;
    - à la fin, `scaleX` vaut exactement ±1 et une seule vue est montrée ;
  - **`rame(tl, at, { stage, actor, layers, duration, focus, zoom = 1.6 }) → fin`** : comme `marche`, mais l'acteur flotte (`flotte`) au lieu de marcher, et les « plic » remplacent les pas ;
  - **`faceBubble({ layer, who, looks, look, x, y, size, tail }) → Actor`** :
    - un disque de papier de `size` unités, avec un liseré blanc, l'ombre des couches et une petite queue vers `tail` ;
    - le sticker y est recadré sur la tête et les épaules (le haut de l'image) ;
    - `el.dataset.who = who` (« bulle-cycy », « bulle-kevin ») ;
    - `pop(tl, at)` le fait sortir en rebondissant avec `pop` ; `show(tl, at, key)` change de visage ; `leave(tl, at)` le fait partir.

- [ ] **Étape 1 : écrire les vérifications qui échouent** (`intros-canoe.mjs`) :
  - **au milieu de chaque temps** (?t=), sur chaque écran : « La mise à l'eau » : duo ; « Les ronds dans l'eau » : duo, bulle-cycy, bulle-kevin ; « La descente » : duo. Chacun est entièrement dans l'écran ;
  - **point 2 :**
    - à ?demo&t= 7,5, 7,9, 8,3 et 10,6, le canoë montre exactement une vue (une seule `.st-actor__img` visible dans `[data-who="duo"]`) ;
    - à ?t= 10,6, sa boîte `turn` a un `scaleX` de 1 ou de −1, à 0,01 près ;
  - **point 3 :** le téléphone tourné pendant les ronds dans l'eau (portrait → paysage vers 8 s, puis 1 s plus tard → portrait) :
    - la timeline avance d'au moins 0,7 fois l'horloge entre les deux arrêts, comme le point 2 du bivouac ;
    - à chaque arrêt, le canoë et les bulles qui se montrent sont entiers dans l'écran.
- [ ] **Étape 2 :** `node tests/e2e/intros-canoe.mjs`. Résultat attendu : ÉCHEC sur ces vérifications.
- [ ] **Étape 3 : implémenter les temps 2 à 4 de la spec.** Les moments à l'intérieur des temps sont indicatifs.
  - **La mise à l'eau (5 → 7 s) :**
    - la caméra plonge de l'épingle de Carsac vers la plage de galets ;
    - le panneau en bois (`content.aventures.intros.canoe.depart`) ;
    - « debout avec les pagaies », puis « Kevin aide Cycy à monter » ;
  - **Les ronds dans l'eau (7 → 11 s) :**
    - le canoë qui pagaie de face part (`flotte`), puis `tourne` de 7,2 à 8,9 s, avec les vues de face et de dos ;
    - de 8,9 à 10,1 s, deux `faceBubble` : Cycy « question » puis « colère », au-dessus de l'avant ; Kevin « pleurs », au-dessus de l'arrière ;
    - le dernier demi-tour, puis le canoë repart droit vers la droite dans ses gouttes ;
  - **La descente (11 → 15 s) :**
    - le canoë de dos, `rame` vers le fond de la rivière ;
    - les arbres qui penchent (profondeur supérieure à 1) passent sur les côtés ;
    - les falaises boisées et Montfort sur son rocher au fond ;
    - le pont de Vitrac s'approche et passe au-dessus du canoë (sa couche devant le canoë, ses arches qui laissent voir la rivière) ;
    - Domme en haut d'une falaise ;
  - **`paddle`** : un « plic » d'eau, du bruit filtré bref et une petite goutte aiguë, environ 0,12 s.
- [ ] **Étape 4 :** `node tests/e2e/intros-canoe.mjs` puis `node tests/e2e/intros.mjs`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : le canoë sur l'eau (la mise à l'eau, les ronds dans l'eau et leurs bulles, la descente sous le pont de Vitrac)" -- <les fichiers de la tâche>`

### Tâche 5 : le coin perdu, le plouf, l'arrivée

**Fichiers :**
- Modifier :
  - `js/aventures/scene/recipes-eau.js` (`plouf`) ;
  - `js/aventures/scene/props-riviere.js` (la rive de graviers, la table sous l'arbre, la gerbe, le canoë de la galerie, l'herbe et le parking, le panneau d'arrivée) ;
  - `js/aventures/scene/props-chateaux.js` (Castelnaud) ;
  - `js/audio.js` (`clink`, `splash`), `css/intros.css`, `canoe.js`, `canoe.stickers.js`, `tests/e2e/intros-canoe.mjs`.

**Interfaces :**
- Consomme : `sceneActor`, `flotte` (tâches 3 et 4), `vehicle` (tâche 3a).
- Produit : **`plouf(tl, at, { jumper, to: { x, y }, layer, duration = 0.6 }) → fin`** :
  - `jumper` (un acteur) saute en arc de son point jusqu'à `to`, en tournant un peu ;
  - à l'arrivée, une gerbe de papier (des gouttes qui montent et retombent) s'ouvre dans `layer`, et on entend `splash` ;
  - le sauteur se cache sous la gerbe.

- [ ] **Étape 1 : écrire les vérifications qui échouent.** Au milieu de chaque temps, sur chaque écran, ces acteurs sont entièrement dans l'écran :
  - « Le coin perdu » : repas-cycy, repas-kevin. En plus, leurs deux nappes vichy se touchent, avec moins de 6 unités d'écart entre les boîtes ;
  - « Le plouf » : duo ;
  - « L'arrivée » : duo, c3.
- [ ] **Étape 2 :** `node tests/e2e/intros-canoe.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 5 à 7 de la spec.**
  - **Le coin perdu (15 → 18 s) :**
    - la rive de graviers, la table en bois sous un arbre et `clink` ;
    - deux `sceneActor` côte à côte (`repas-cycy`, `repas-kevin`). Leurs vues changent ensemble, environ toutes les 0,7 s : le croc, une frite, l'assiette vide avec les pouces levés, la main sur le ventre ;
  - **Le plouf (18 → 21,2 s) :**
    - la lumière dorée (une couche voile, comme `st-veil--chaud` au bivouac) ;
    - Castelnaud et Beynac se font face sur les deux rives ;
    - le canoë devant la falaise flotte ;
    - vers 18,6 s, Kevin en gilet « surprise » (`sceneActor`, `who: "kevin"`) part du canoë, qui passe à « Cycy seule » au même instant, et fait son `plouf` dans l'eau ;
    - sous la gerbe, le canoë passe à « l'éclaboussure » et dérive doucement vers la droite ;
    - à partir de 19,4 s, le canoë de la galerie (en papier, d'une autre couleur, deux silhouettes qui se balancent de rire) traverse au fond, de droite à gauche ;
  - **L'arrivée (21,2 → 23,2 s) :**
    - l'herbe, le parking et le panneau (`content.aventures.intros.canoe.arrivee`) ;
    - les pouces levés devant le canoë ;
    - la C3 en « coeurs » qui rebondit (`pop`) ;
    - à partir de 22,6 s, la C3 passe en « roule » et part vers la droite, avec `engine` ;
  - **`clink`** : deux verres, deux sinus aigus qui s'éteignent en environ 0,4 s ;
  - **`splash`** : un plouf, du bruit grave et un choc sourd, environ 0,5 s.
- [ ] **Étape 4 :** `node tests/e2e/intros-canoe.mjs` puis `node tests/e2e/intros.mjs`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : le coin perdu (burger et frites), le plouf de Kevin devant la galerie, l'arrivée à la C3" -- <les fichiers de la tâche>`

### Tâche 6 : Sarlat, La Roque-Gageac de nuit, et le canoë en entier

**Fichiers :**
- Créer : `js/aventures/scene/props-sarlat.js`, `js/aventures/scene/props-roque.js`
- Modifier : `js/audio.js` (`twinkle`), `css/intros.css`, `canoe.js`, `canoe.stickers.js`, `tests/e2e/intros-canoe.mjs`

**Interfaces :**
- Consomme : `sceneActor`, `person`, `stage.pan` (la glissade de Sarlat : un `focus` au fond de la rue et un `zoom` comme dans `marche`, mais sans pas, puisque personne ne marche), et les étoiles et le ciel de nuit de `props-lac.js`.

- [ ] **Étape 1 : écrire les vérifications qui échouent** :
  - au milieu de chaque temps, sur chaque écran : « Sarlat » : chevalier ; « La Roque-Gageac » : cycy, kevin ; « L'affiche » : duo. Chacun est entièrement dans l'écran ;
  - **le canoë en entier :** au milieu de chacun des 9 temps après la carte, ce qui compte est dans l'écran sur les 4 écrans et en 852 × 393. C'est la liste complète `CAST` de la suite ;
  - **point 4 :** entrer dans l'intro du canoë et en sortir trois fois de suite par le retour du navigateur, à ?demo&t= 5, 15 et 27 (la nuit, les grillons) : `gsap.globalTimeline.getChildren()` revient à son compte de départ et aucune `.st-stage` ne reste ;
  - **point 5 :** en 1920 × 1080, à ?t= 13, 24 et 27,4, chaque couche visible couvre toute la largeur de l'écran.
- [ ] **Étape 2 :** `node tests/e2e/intros-canoe.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 8 et 9 de la spec.**
  - **Sarlat (23,2 → 26,2 s) :**
    - la lumière du soir ;
    - les façades en pierre blonde, avec leurs balcons, leurs volets et leurs vitrines, de part et d'autre de la rue pavée ;
    - les guirlandes de fleurs en papier tendues au-dessus ;
    - la caméra glisse seule dans la rue jusqu'à environ 24,4 s, et les lanternes s'allument ;
    - puis le chevalier (`sceneActor`, `who: "chevalier"`) arrive avec `paper`, et des étincelles en papier scintillent autour avec `twinkle` ;
    - la lanterne du sticker brille, grâce à un halo en papier sur sa propre couche, dont on anime l'opacité ;
  - **La Roque-Gageac (26,2 → 28,6 s) :**
    - le ciel de nuit et les étoiles du bivouac (`props-lac.js`) ;
    - la falaise et ses trous, avec les maisons en bas et leurs fenêtres chaudes ;
    - la gabare amarrée, avec son mât, son auvent et `content.aventures.intros.canoe.gabare` sur la coque ;
    - les reflets des lumières sur l'eau, sur leur propre couche, qui tremblent par l'opacité ;
    - le quai et sa rambarde ;
    - Cycy de dos « question » et Kevin de dos « joie » (`person`, `side: "dos"`) ;
    - `crickets` ;
  - **à 28,6 s,** retour de jour sur la rivière pour l'affiche (tâche 3) ;
  - **`twinkle`** : trois petits « ting » aigus qui montent, environ 0,5 s.
- [ ] **Étape 4 : les vérifications.**
  - `node tests/e2e/intros-canoe.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/aventures.mjs`, `node tests/e2e/hub.mjs` et `npm test` ;
  - résultat attendu : tout est vert ;
  - la durée de `data-length` reste entre 30000 et 32000 ms.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : Sarlat et son chevalier, La Roque-Gageac de nuit : le Premier canoë en entier" -- <les fichiers de la tâche>`

### Tâche 7 : le README, et le contrôle à l'œil

**Fichiers :**
- Modifier : `README.md` (sa partie sur les intros)
- Modifier, si nécessaire : `tests/e2e/intros-canoe.mjs` (le mode `SHOTS`, comme `intros.mjs`)

- [ ] **Étape 1 : la page `?test`.** Elle se remplit d'elle-même depuis `SCENARIOS` : le Premier canoë est marqué « nouvelle », et ses 10 liens mènent à chaque temps. Vérifie-le avec une capture de la section « Les intros ».
- [ ] **Étape 2 : le README.** Il garde le même ton. Il dit en quelques lignes :
  - comment une sortie gagne son intro (son scénario, ses stickers, ses temps dans `intros/index.js`) ;
  - ce que sont un relais sur la carte, les recettes de l'eau, les stickers de scène (`--scene`, 600 px) et les bulles.
- [ ] **Étape 3 : le contrôle à l'œil.**
  - `SHOTS=<dossier> node tests/e2e/intros-canoe.mjs` prend une capture au milieu de chaque temps sur chaque écran, plus la carte à 1,5 et 4,6 s ;
  - regarde chaque capture et écris dans le rapport ce qui accroche :
    - un sticker coupé ;
    - une scène peinte dont l'eau ne rejoint pas celle du décor ;
    - un nom de lieu caché ;
    - un bord de décor visible.
- [ ] **Étape 4 : commit.** `git commit -m "Intros : le README explique le Premier canoë (relais, eau, scènes, bulles)" -- README.md tests/e2e/intros-canoe.mjs`
