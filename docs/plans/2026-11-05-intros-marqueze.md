# L'intro de Marquèze : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :** `#/aventures/marqueze` joue la vraie intro de Marquèze, environ 36 s en papier découpé, en 10 temps :
- la carte (la C3 de Bordeaux à la gare de Sabres, vers le sud) ;
- la gare de Sabres, le petit train dehors puis dedans, le pique-nique à l'airial, le village, les cochons noirs, le train du retour ;
- la route de Biscarrosse, le coucher de soleil sur l'océan ;
- l'affiche « MARQUÈZE ».

**Architecture :**
- **Le scénario** `intros/marqueze.js` suit le modèle de `intros/ile-de-re.js`.
- **La boîte à outils `js/aventures/scene/` gagne :**
  - la recette du train (`recipes-train.js`) ;
  - de nouveaux `props-*.js`, un par famille de décor (la forêt et le wagon, l'airial, Biscarrosse) ;
  - les cochons noirs (`props-animaux.js`) ;
  - trois sons.
- **Elle réutilise ce qui existe :**
  - les acteurs : `sceneActor` (`show`, `flip`, `pop`), `person` (`turn` en carte, `into`, `hop`), `vehicle` ;
  - les recettes : `carte`, `plonge`, `marche`, `affiche`, `velo.defile` ;
  - les morceaux de carte (`land`, `ocean`, `landes`) et les décors existants (`roundTrees`, `pine`, `forest`, `panneau`, la mer et le ciel doré, la plage, les vaguelettes, le soleil, la dune) ;
  - le son : `stage.sound(…, until)`.
- **La suite du navigateur** `tests/e2e/intros-marqueze.mjs` s'appuie sur le kit `tests/e2e/intro-kit.mjs`, comme celle de l'Île de Ré.

**Stack :** vanilla, modules natifs, GSAP global (`window.gsap`), SVG et CSS, WebAudio, `node --test`, banc CDP maison (`tests/e2e/`).

**Spec :** `docs/specs/2026-11-05-intros-marqueze-design.md`, en entier. Elle suit les specs de l'Île de Ré, du canoë et de la tranche 3a, dont les règles s'appliquent là où elle ne dit pas autre chose.

**Modèle et références :**
- **le code de l'Île de Ré :** `js/aventures/intros/ile-de-re.js`, la suite `tests/e2e/intros-ile-de-re.mjs`, et la partie « intros » du README, qui décrit la boîte à outils et ses recettes ;
- **les planches de Kevin**, dans `planches/voyages/marqueze/` (hors git) ;
- **les lieux réels :**
  - l'écomusée de Marquèze, à Sabres, dans la Grande Lande. On n'y va qu'en train, depuis la gare de Sabres : 10 minutes à travers la forêt de pins maritimes ;
  - la forêt : de grands pins droits, avec la cicatrice du gemmage et le petit pot de résine accroché au tronc, des fougères et le sable ;
  - l'airial : une grande clairière d'herbe sous de grands chênes. On y voit la maison de maître et les maisons landaises à colombages, avec leur grand toit bas et leur façade sous l'auvent, le poulailler perché sur ses pilotis, les moutons, et les cochons noirs gascons dans leur enclos ;
  - Biscarrosse-Plage : la dune, l'océan et ses rouleaux, et le soleil qui se couche dans la mer.

## Contraintes globales
- **Les règles du projet :**
  - jamais de `transition` CSS sur `opacity` ou `transform` d'une cible GSAP, ni de `@keyframes` sur une cible GSAP ;
  - `const reduced = false` ;
  - aucune dépendance ajoutée ;
  - aucune clé de stockage ajoutée ;
  - commentaires courts, en anglais, à la densité des fichiers voisins ;
  - les textes affichés vont dans `js/content.js` (`content.aventures.intros.marqueze`), les noms de la carte dans `js/aventures/data.js`.
- **La fluidité :**
  - chaque couche de décor est dessinée une fois et ne fait que se déplacer (`transform`) ;
  - on n'anime jamais les paramètres d'un filtre SVG ;
  - une lumière qui change vit sur sa propre couche, et on n'anime que son opacité ;
  - chaque décor n'est affiché que pendant son temps.
- **La lecture :**
  - tout tient sous `?demo&t=` : des tweens et des `set` de la timeline, des `fromTo` avec un départ explicite (`immediateRender: false`), et aucun effet de bord en `onUpdate` ;
  - toutes les répétitions sont finies et se terminent dans la timeline (`Math.max(0, …)` sur tout compte calculé).
- **Les leçons du canoë et de l'Île de Ré**, à regarder sur ses propres captures (393 × 852, 852 × 393, 1920 × 947) avant de rendre une tâche :
  - aucun texte, panneau ni sticker coupé par le bord de l'écran ;
  - les pieds au-dessus de « Passer ▸ » sur un téléphone ;
  - un décor lointain n'est jamais dessiné devant un décor proche (l'ordre des couches) ;
  - deux personnes côte à côte sont à la même échelle : leurs têtes ont la même taille, comme à La Rochelle (`STROLLERS` de `ile-de-re.js`) ;
  - une lumière dorée se lit dorée, pas grise ;
  - pas de logique recopiée : on partage l'aide existante au lieu de la copier. Si une aide de `ile-de-re.js` sert ici (`prop`, `across`, `sprint`, `setOff`), on la déplace dans la boîte à outils et les deux scénarios l'importent.
- **Ce qui ne change pas de comportement :**
  - les intros du bivouac, du canoë et de l'Île de Ré, le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - `tests/e2e/intros.mjs`, `intros-canoe.mjs`, `intros-ile-de-re.mjs`, `hub.mjs` et `aventures.mjs` restent verts.
- **La scène :**
  - 390 × 760 unités, zone sûre de x = 25 à x = 365 ;
  - chaque décor couvre 800 unités de chaque côté du milieu de la scène, ciels compris, déplacements de la caméra compris (`WIDEST` et `across` de `ile-de-re.js`) ;
  - un décor qui défile couvre aussi toute sa course.
- **Les durées :**
  - l'intro de Marquèze dure entre 35 et 37 s, avec les temps de `SCENARIOS.marqueze.beats` (tâche 2) ;
  - la fin vient toujours de la timeline.
- **Les stickers :**
  - planches hors git ;
  - standards à 300 px, scènes à 600 px ;
  - l'intro ne charge que ceux de `intros/marqueze.stickers.js`, qui contient exactement ce que le scénario monte à la fin de chaque tâche.
- **Les sons :** `whistle`, `rails` et `oink`. Chaque nom se vérifie dans `js/audio.js` avant d'être pris. S'il existe déjà, on prend un nom libre et on le dit.
- **Le serveur de test :** http://localhost:5173. S'il ne répond pas, lance `node tests/e2e/serve.mjs` en arrière-plan, sans en relancer un deuxième.
- **Les commits :** avec pathspec, un message en français « Intros : … » qui se termine par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pas de push, ni merge, ni `--force`.

## Points à surveiller (Review Focus)
1. **Le passeport qui précharge Marquèze.** L'Île de Ré est tamponnée et le livre est posé : le module `intros/marqueze.js` et ses stickers sont déjà demandés, et le toucher sur Marquèze ne les retélécharge pas (`transferSize` 0, `warmedOnPassport` du kit). Testé en tâche 2.
2. **Un `?demo&t=` au milieu d'un changement de vue du train,** dehors ↔ dedans ou d'un sticker à l'autre. Le duo montre exactement une vue, en avançant comme en reculant : un balayage toutes les 0,1 s, de 7,5 à 13,5 s et de 24,5 à 27,5 s. Testé en tâche 3.
3. **Tourner le téléphone pendant le petit train** (portrait → paysage, puis 1 s plus tard → portrait). La timeline avance d'au moins 0,7 fois l'horloge, et le wagon reste entier dans l'écran. Testé en tâche 3.
4. **Entrer et sortir trois fois de suite,** dont une fois dans le train et une fois au coucher de soleil. `gsap.globalTimeline.getChildren()` revient à son compte de départ, et aucune `.st-stage` ne reste (`inAndOut` du kit). Testé en tâche 5.
5. **Un PC en 1920 × 1080 et en 1920 × 947** à la gare, dans le train (dehors, et la forêt derrière les fenêtres), au village et au coucher de soleil. Chaque couche visible couvre toute la largeur, y compris au bout de sa course, et le bord de la forêt n'entre jamais dans une fenêtre. Testé en tâches 2, 3, 4 et 5.

---

### Tâche 1 : les 72 stickers de Marquèze

**Fichiers :**
- Créer : `assets/aventures/marqueze/*.webp` (48 + 12 + 12)

**Interfaces :**
- Produit :
  - les fichiers de la spec, § 3 ;
  - **dans le rapport :**
    - la correspondance réelle de chaque numéro des deux planches de scène avec ce qu'il montre ;
    - la pente du bas du wagon (la ligne de ses roues), en degrés, sur *dans 02* et *dans 03* ;
    - la hauteur de cette ligne, en part de la hauteur du sticker.

- [ ] **Étape 1 : lancer l'outil.**
  - les commandes :
    ```
    node tools/decoupe/decoupe.mjs planches/voyages/marqueze
    node tools/decoupe/decoupe.mjs "planches/voyages/marqueze/Cycy et Kevin dans le train.png" --scene   (ajouter --count 12 si elle ne donne pas 12 stickers)
    node tools/decoupe/decoupe.mjs "planches/voyages/marqueze/Cycy et Kevin devant le train.png" --scene  (idem)
    ```
  - résultat attendu : 48 + 12 + 12 fichiers, les standards entre 10 et 60 Ko, les scènes entre 30 et 180 Ko. Les scènes s'appellent `scene-cycy-et-kevin-dans-le-train-NN.webp` et `scene-cycy-et-kevin-devant-le-train-NN.webp`.
- [ ] **Étape 2 : le contrôle à l'œil.**
  - Ouvre chaque planche de contrôle (capture), et vérifie :
    - que les noms correspondent ;
    - que les contours blancs sont entiers ;
    - qu'il n'y a ni morceau voisin ni tache. Sur « devant le train », les wagons de deux stickers voisins peuvent se toucher.
  - Écris ce que montre chaque numéro des deux planches de scène, comparé à l'ordre attendu de la spec (§ 3).
  - Mesure la pente et la hauteur des roues du wagon sur *dans 02* et *dans 03*.
  - Vérifie que les positions 9 et 11 des planches de face sont bien « surprise » (avec le petit train vert) et « thème » (le dépliant).
- [ ] **Étape 3 :** `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 4 : commit.** `git commit -m "Intros : les stickers de Marquèze" -- assets/aventures/marqueze`

### Tâche 2 : les données, la carte vers le sud, la gare de Sabres, l'affiche, et Marquèze qui monte son scénario

**Fichiers :**
- Créer :
  - `js/aventures/intros/marqueze.js`, `js/aventures/intros/marqueze.stickers.js` ;
  - `js/aventures/scene/props-foret.js` (pour l'instant : les pins des Landes, le quai et le panneau de la gare de Sabres, avec leur version affiche) ;
  - `tests/e2e/intros-marqueze.mjs`.
- Modifier :
  - `js/aventures/data.js`, `tests/intros.test.mjs` ;
  - `js/aventures/intros/index.js` ;
  - `js/audio.js` (`whistle`), `js/content.js`, `css/intros.css` ;
  - `tests/e2e/aventures.mjs` (l'exemple d'intro provisoire passe de Marquèze au Premier Airbnb) ;
  - `js/aventures/intros/ile-de-re.js`, seulement pour déplacer une aide partagée (contraintes globales).

**Interfaces :**
- Consomme : la tâche 1 (les fichiers et la correspondance des numéros).
- Produit :
  - **la sortie `marqueze` dans `AVENTURES`**, avec exactement (les `transports` restent `["c3", "train"]`, `people: []`) :
    ```js
    lieu: "Marquèze",
    trajet: {
      depart: "Bordeaux",
      etapes: [],
      etapesAt: [],
      // [lat, lon]: Bordeaux, Le Barp, Belin-Béliet, Liposthey, Labouheyre (the A63, its exit), Sabres' station (the D626)
      points: [[44.837, -0.579], [44.627, -0.768], [44.5, -0.788], [44.312, -0.884], [44.213, -0.921], [44.148, -0.744]],
    },
    ```
    Il n'y a ni `arrivee` ni `relais` : l'épingle porte le `lieu`, « Marquèze » ;
  - **`SCENARIOS.marqueze`**, avec exactement ces `beats` :
    ```js
    [{ name: "La carte", at: 0 }, { name: "La gare de Sabres", at: 4.5 }, { name: "Le petit train", at: 7.5 }, { name: "Le pique-nique", at: 13.5 },
     { name: "Le village", at: 17 }, { name: "Les cochons noirs", at: 21.5 }, { name: "Le train du retour", at: 24.5 },
     { name: "La route de Biscarrosse", at: 27.5 }, { name: "Le coucher de soleil", at: 29.5 }, { name: "L'affiche", at: 33.5 }]
    ```
  - **la carte :** `projection({ origin: trajet.points[0], at: { x: 250, y: 200 }, unitsPerDegree: 520 })` ;
  - **les textes :** `content.aventures.intros.marqueze = { gare: "Sabres", panneau: "Biscarrosse-Plage" }` ;
  - **`whistle`** : un coup de sifflet de train, environ 0,6 s ;
  - **en attendant les tâches 3 à 5,** la scène de la gare se montre sans personne de 7,5 à 33,5 s ;
  - **la scène de la gare, en papier et en affiche, sert à l'affiche.**

- [ ] **Étape 1 : écrire les tests unitaires qui échouent** (`tests/intros.test.mjs`).
  - `intros: Marquèze goes by C3 down the Landes to Sabres' station`, avec `MARQUEZE_MAP = { origin: [44.837, -0.579], at: { x: 250, y: 200 }, unitsPerDegree: 520 }` :
    - `byId("marqueze").lieu` vaut `"Marquèze"`, et ses `transports` valent `["c3", "train"]` ;
    - `trajet.arrivee` et `trajet.relais` valent `undefined` ;
    - le dernier point est `[44.148, -0.744]` ;
    - chaque point projeté est dans x 25 à 365 et y 120 à 700 ;
    - l'arrivée est au sud du départ ;
    - `stops(...)` donne `["Bordeaux", "Marquèze"]`, et la boîte de chaque nom tient dans x 25 à 365 ;
    - le bassin d'Arcachon `[44.66, -1.15]` se projette en x ≥ 25 : la carte le montre.
  - Le test « every stage of a trip has its point on the road » passe tel quel, avec `etapes: []` et `etapesAt: []`.
- [ ] **Étape 2 : écrire la suite qui échoue** (`tests/e2e/intros-marqueze.mjs`, sur les écrans de `VIEWPORTS` et 852 × 393, avec le kit `intro-kit.mjs`).
  - **`?demo#/aventures/marqueze`** (`playedThrough`) :
    - `data-length` entre 35000 et 37000 ms (la constante `LENGTH` de la suite) ;
    - l'intro est jouée en entier ;
    - l'affiche dit exactement « MARQUÈZE » et « Marquèze · 22 août 2025 », avec son cadre et son lettrage dans l'écran ;
    - puis on revient au passeport.
  - **La carte**, à ?t= 0,3, 2 et 3,9 :
    - la C3 est dans l'écran ;
    - à 0,3 s, « Bordeaux » est entièrement dans l'écran ;
    - ensuite, l'épingle « Marquèze » et son nom sont entièrement dans l'écran quand ils sont écrits ;
    - aucun nom n'est caché par la C3, et aucun nom n'en chevauche un autre.
  - **`CAST` :** « La gare de Sabres » : duo ; « L'affiche » : duo. Chacun est entièrement dans l'écran au milieu de son temps, sur tous les écrans et en 852 × 393.
  - **La gare,** au milieu de son temps : le panneau « Sabres » est entier dans l'écran.
  - **Les stickers** demandés sous `/assets/aventures/` sont exactement ceux de `marqueze.stickers.js`.
  - **Un sticker de scène bloqué** (celui de l'affiche, *devant 12*) passe sur son remplaçant `assets/cyrielle/joy.webp`, et l'intro se termine (`blockedScene`).
  - **La règle de passage :**
    - la première fois (l'Île de Ré tamponnée, hors démo), un toucher au milieu ne passe pas l'intro (`firstTime`) ;
    - en `?demo`, « Passer ▸ » la termine (`skipped`) ;
    - le retour du navigateur vers 10 s : pas d'erreur, et la sortie n'est pas marquée vue.
  - **Point 1 du Review Focus.**
  - **Point 5 (la gare) :** en 1920 × 1080 et 1920 × 947, à 5, 6 et 7,3 s, chaque couche visible couvre toute la largeur.
  - **Aucune erreur** dans la console.
- [ ] **Étape 3 :** `npm test` et `node tests/e2e/intros-marqueze.mjs`. Résultat attendu : ÉCHEC sur ces vérifications.
- [ ] **Étape 4 : implémenter les temps 1, 2 et 10 de la spec.**
  - **Enregistrement :** `SCENARIOS.marqueze`, puis `marqueze.js` sur le modèle de `ile-de-re.js`.
  - **La carte (0 → 4,5 s) :**
    - `recipes.carte`, vers le sud. La terre, l'océan, le bassin d'Arcachon et les pins des Landes viennent de `props-carte.js` (`land`, `ocean`, `landes` avec la route et les noms dégagés) ;
    - la C3 (« roule ») reste visible jusqu'au bout de son trajet, et l'épingle « Marquèze » se pose à Sabres.
    - Si la caméra de `carte` coupe un nom ou l'épingle pour ce trajet court, corrige-la pour les trajets vers le sud, sans changer la carte du bivouac. Les tests du bivouac le vérifient.
  - **La gare de Sabres (4,5 → 7,5 s) :**
    - `plonge` de l'épingle vers le quai ;
    - le décor : le ciel, les pins des Landes en plusieurs profondeurs, le quai, et le panneau de gare au texte `content.aventures.intros.marqueze.gare` ;
    - un coup de `whistle` ;
    - vous deux devant le wagon, main dans la main (*devant 01*, `sceneActor`, `who: "duo"`, `wide`, avec `pop`), puis `flip` vers *devant 05*, en montant le marchepied ;
    - les stickers contiennent le wagon : on ne dessine pas de train. Le bas du sticker est posé sur le quai.
  - **De 7,5 à 33,5 s :** la scène de la gare se montre, sans personne.
  - **L'affiche (33,5 s) :** `recipes.affiche` sur la scène de la gare (ses couches en version affiche), avec vous deux pouces levés devant (*devant 12*).
  - **`marqueze.stickers.js`** contient alors `vehicules/c3-roule` et *devant 01*, *05* et *12*.
- [ ] **Étape 5 :** `npm test` et `node tests/e2e/intros-marqueze.mjs`. Résultat attendu : tout est vert.
- [ ] **Étape 6 :** `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs` et `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : tout est vert, et les cartes du bivouac, du canoë et de l'Île de Ré n'ont pas bougé.
- [ ] **Étape 7 : `node tests/e2e/aventures.mjs`.**
  - Les vérifications qui jouaient Marquèze comme intro provisoire (le toucher sur l'emplacement de Marquèze vers la ligne 1056, et le tampon vers la ligne 1239) passent sur **le Premier Airbnb** (`airbnb`), avec leur sauvegarde adaptée. Ce qu'elles vérifient ne change pas.
  - Résultat attendu : tout est vert. Un rouge de temps de réponse déjà connu (le passeport, ou la bulle de Mini Cycy en 375 × 667) se relance une fois, et le rapport le dit.
- [ ] **Étape 8 : commit.** `git commit -m "Intros : Marquèze monte son scénario (la carte vers le sud, la gare de Sabres, et l'affiche « MARQUÈZE »)" -- <les fichiers de la tâche>`

### Tâche 3 : le petit train, dehors et dedans, et le train du retour

**Fichiers :**
- Créer : `js/aventures/scene/recipes-train.js`
- Modifier :
  - `js/aventures/scene/props-foret.js` : les pins gemmés et leurs pots de résine, les fougères, le sable, les rails, et la paroi en bois du wagon percée de fenêtres ;
  - `js/audio.js` (`rails`), `css/intros.css` ;
  - `marqueze.js`, `marqueze.stickers.js`, `tests/e2e/intros-marqueze.mjs`.

**Interfaces :**
- Consomme :
  - `velo.defile` (importé de `recipes-velo.js`, jamais recopié ; si une distance ou une forme lui manque, on le généralise) ;
  - `sceneActor` (`show`, `flip`), `stage.pan`, `stage.sound(…, until)` ;
  - la pente et la hauteur des roues du wagon (tâche 1).
- Produit :
  - **`cahote(tl, at, { actor, duration, every = 0.45, lift = 3 }) → fin`**, dans `recipes-train.js` :
    - le petit cahot du wagon à chaque joint de rail : il monte de `lift` unités et redescend en environ 0,12 s, avec un soupçon de rotation ;
    - un cahot toutes les `every` s, `Math.max(0, Math.floor(duration / every))` en tout ;
    - à plat à la fin, et tout tient sous `seek` ;
  - **`secoue(tl, at, { actor, duration, angle = 3 }) → fin`**, dans `recipes-train.js` : le sticker de la banquette secoué dans le virage, quelques à-coups de rotation et de côté, d'abord forts puis plus faibles, droit à la fin ;
  - **`rails`** : le tac-tac des rails, environ 3,2 s de « ta-tac, ta-tac », qu'on peut arrêter (il rend son arrêt, comme `engine`) ;
  - **la scène du wagon, dedans,** partagée par « Le petit train » et « Le train du retour ».

- [ ] **Étape 1 : écrire les vérifications qui échouent.**
  - **`CAST`** ajoute « Le petit train » : duo ; « Le train du retour » : duo. Chacun est entièrement dans l'écran au milieu de son temps, et dehors à 8,5 s, sur tous les écrans et en 852 × 393.
  - **Dehors (7,5 → 10,8 s) :** le sticker du wagon est dans l'écran à chaque relevé (toutes les 0,25 s), et la couche des pins proches se déplace vers la droite entre 8 et 10,5 s.
  - **Dedans (10,8 → 13,5 s, et 24,5 → 27,5 s) :**
    - la forêt derrière les fenêtres se déplace ;
    - la paroi ne bouge pas ;
    - le sticker de la banquette est entier dans l'écran.
  - **Point 2** (7,5 → 13,5 s et 24,5 → 27,5 s).
  - **Point 3,** pendant le petit train dehors.
  - **Point 5 (le train) :** en 1920 × 1080 et 1920 × 947, à 8, 10,6, 11, 13,3, 25 et 27,3 s :
    - chaque couche visible couvre toute la largeur ;
    - chaque fenêtre de la paroi ne montre que de la forêt : le bord de sa couche n'y entre jamais.
- [ ] **Étape 2 :** `node tests/e2e/intros-marqueze.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 3 et 7 de la spec.**
  - **Le petit train, dehors (7,5 → 10,8 s) :**
    - **le décor :** le ciel, les pins lointains, les pins gemmés avec leurs pots de résine, les rails, et les fougères devant ;
    - **le wagon :** le sticker *dans 02* (accoudés à la fenêtre), `sceneActor` `wide`. Il est posé sur les rails, et leur pente suit celle de ses roues (tâche 1). Il reste au centre, la caméra le laisse, et `cahote` l'agite ;
    - **le défilement :** le décor défile vers la droite (`defile`, distance négative), puisque le wagon roule vers la gauche ;
    - vers 9,2 s, `flip` vers *dans 03* (coucou à la fenêtre) ;
    - **le son :** `rails`, arrêté à la fin du temps (`until`).
  - **Le petit train, dedans (10,8 → 13,5 s) :**
    - la paroi en bois, en papier, sur toute la largeur, percée d'une rangée de fenêtres ;
    - derrière, sur sa propre couche, la forêt défile vers la droite ;
    - devant, le sticker de la banquette : *dans 06* (le dépliant), puis vers 12,3 s `flip` vers *dans 09* (secoués), avec `secoue` ;
    - `rails` continue.
  - **Le train du retour (24,5 → 27,5 s) :**
    - la même scène du wagon, dedans, partagée et non recopiée ;
    - la forêt défile un peu plus lentement ;
    - le sticker *dans 05* (endormis), qui respire doucement (une échelle qui monte et redescend, finie) ;
    - `rails`, arrêté à la fin du temps (`until`).
  - **`marqueze.stickers.js`** ajoute *dans 02*, *03*, *05*, *06* et *09*.
  - **Entre les deux**, la scène de la gare en attente reste montrée de 13,5 à 24,5 s et de 27,5 à 33,5 s.
  - **Avant de rendre la tâche, regarde tes captures** en 393 × 852, 852 × 393 et 1920 × 947, à 8, 9,5, 11, 12,8, 25 et 27 s :
    - les roues sont posées sur les rails, jamais en l'air ni enfoncées ;
    - le wagon a l'air de rouler, pas de glisser ;
    - rien n'est coupé par le bord ;
    - les fougères proches ne cachent ni vos visages ni les fenêtres du wagon.
- [ ] **Étape 4 :** `node tests/e2e/intros-marqueze.mjs`, `node tests/e2e/intros-ile-de-re.mjs` et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : le petit train de Marquèze, dehors dans les pins et dedans sur la banquette, à l'aller et au retour" -- <les fichiers de la tâche>`

### Tâche 4 : l'airial : le pique-nique, le village et les cochons noirs

**Fichiers :**
- Créer : `js/aventures/scene/props-airial.js` : les grands chênes, l'herbe, le panier et les sandwichs, les maisons landaises à colombages, le poulailler perché, les moutons et l'enclos en bois
- Modifier :
  - `js/aventures/scene/props-animaux.js` (les cochons noirs) ;
  - `js/audio.js` (`oink`), `css/intros.css` ;
  - `marqueze.js`, `marqueze.stickers.js`, `tests/e2e/intros-marqueze.mjs`.

**Interfaces :**
- Consomme : `person` (`turn` en carte, `into`, `hop`), `marche`, `sceneActor` (`pop`), `roundTrees`.
- Produit :
  - **`pig({ layer, x, y, size = 1, facing = "left" }) → Pig = { el, root, oink }`**, dans `props-animaux.js`, sur le modèle de `cow` :
    - un cochon noir gascon en papier, d'environ `size` × 90 unités de large ;
    - `root(tl, at, duration)` : il fouine, le groin vers le sol et retour, un nombre fini de fois ;
    - `oink(tl, at)` : la tête sursaute, avec le son `oink` ;
  - **`oink`** : « groin groin », deux grognements courts et nasillards, environ 0,5 s.

- [ ] **Étape 1 : écrire les vérifications qui échouent.**
  - **`CAST`** ajoute « Le pique-nique » : duo ; « Le village » : cycy, kevin ; « Les cochons noirs » : cycy, kevin. Chacun est entièrement dans l'écran au milieu de son temps, sur tous les écrans et en 852 × 393.
  - **Le village :** au milieu du retournement, le `scaleX` des boîtes de retournement est inférieur à 0,6. À la fin du temps, il vaut ±1, et Cycy et Kevin sont de face en « thème ».
  - **Les cochons :** au milieu du temps, au moins deux cochons sont entièrement dans l'écran, sur tous les écrans.
  - **L'échelle :** au village et aux cochons, les têtes de Cycy et de Kevin ont la même hauteur à 10 % près.
  - **Point 5 (l'airial) :** en 1920 × 1080 et 1920 × 947, à 14, 18, 21 et 24 s, chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `node tests/e2e/intros-marqueze.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 4 à 6 de la spec.**
  - **Le pique-nique (13,5 → 17 s) :**
    - l'airial : le ciel, de grands chênes ronds, l'herbe ;
    - vous deux sur le banc (*devant 10*, `pop`), avec le panier et les sandwichs en papier posés à côté ;
    - la caméra s'approche un peu.
  - **Le village (17 → 21,5 s) :**
    - les maisons landaises à colombages (un grand toit bas, la façade sous l'auvent), le poulailler perché sur ses pilotis, et des moutons dans l'herbe, sous les chênes ;
    - vous deux de dos (`person`, `side: "dos"`, « joie ») avec `marche` dans l'airial ;
    - puis vous vous retournez en carte (`turn`), de face en « thème », avec le dépliant.
  - **Les cochons noirs (21,5 → 24,5 s) :**
    - l'enclos en bois, et trois cochons (`pig`) qui fouinent, avec deux ou trois `oink` ;
    - vous deux de face, en « question » (`into`), puis en « joie » avec un `hop`.
  - **`marqueze.stickers.js`** ajoute *devant 10* et Cycy et Kevin de dos en « joie », de face en « thème », en « question » et en « joie ».
  - **Avant de rendre la tâche, regarde tes captures** en 393 × 852, 852 × 393 et 1920 × 947, au milieu de chaque temps :
    - rien n'est coupé par le bord ;
    - les pieds sont au-dessus de « Passer ▸ » sur le téléphone ;
    - les chênes lointains ne passent pas devant les maisons proches.
- [ ] **Étape 4 :** `node tests/e2e/intros-marqueze.mjs`, `node tests/e2e/intros.mjs` (les cartes retournées du bivouac) et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : l'airial de Marquèze (le pique-nique, le village et les cochons noirs)" -- <les fichiers de la tâche>`

### Tâche 5 : Biscarrosse, et Marquèze en entier

**Fichiers :**
- Créer : `js/aventures/scene/props-biscarrosse.js` (la route dans les pins, le panneau, la dune, l'océan au coucher du soleil)
- Modifier : `js/content.js` seulement si un texte manque, `css/intros.css`, `marqueze.js`, `marqueze.stickers.js`, `tests/e2e/intros-marqueze.mjs`

**Interfaces :**
- Consomme :
  - `vehicle` (`drive`, `bounce`, `view`), `velo.defile`, `person`, `stage.sound(…, until)` ;
  - les pins de `props-foret.js` ;
  - la mer et `pont.SOIR`, le ciel doré (`riviere.cielDore`), le voile `st-veil--soir`, et `cote.plage`, `cote.vaguelettes`, `cote.soleil`, `ile.dune`. Tout est partagé, rien n'est recopié.

- [ ] **Étape 1 : écrire les vérifications qui échouent.**
  - **`CAST` complet** des 9 temps après la carte, avec « La route de Biscarrosse » : c3 et « Le coucher de soleil » : cycy, kevin, sur les 4 écrans et en 852 × 393.
  - **La C3 :** après la carte, elle ne se montre qu'à « La route de Biscarrosse » (un relevé toutes les 0,25 s, de 4,5 à 36 s).
  - **Le panneau** « Biscarrosse-Plage » est entier dans l'écran quand il se montre.
  - **Le soleil** descend : son haut est plus bas à 33,3 s qu'à 30 s.
  - **Point 4 :** entrer et sortir trois fois par le retour du navigateur, à `?demo&t=` 5, 11 et 31.
  - **Point 5 (Biscarrosse) :** en 1920 × 1080 et 1920 × 947, à 28, 29,3, 30 et 33,3 s, chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `node tests/e2e/intros-marqueze.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 8 et 9 de la spec.**
  - **La route de Biscarrosse (27,5 → 29,5 s) :**
    - la C3 (« roule ») file vers la gauche sur une route entre les pins, pendant que le décor défile vers la droite, comme « La côte » de l'Île de Ré ;
    - un panneau au texte `content.aventures.intros.marqueze.panneau` passe ;
    - `engine` s'arrête à 29,5 s (`until`).
  - **Le coucher de soleil (29,5 → 33,5 s) :**
    - le ciel doré, l'océan au soir avec ses vaguelettes, la plage, la dune ;
    - le soleil descend vers l'horizon ;
    - la lumière dorée vit sur sa propre couche (opacité seulement), et elle doit se lire dorée, pas grise ;
    - vous deux de dos sur le sable (`person`, `side: "dos"`, « joie »), face au soleil, à la même échelle ;
    - quelques mouettes (`gulls`).
  - **À 33,5 s,** retour sur la scène de la gare pour l'affiche (tâche 2). La scène de la gare n'est plus montrée en attente.
  - **`marqueze.stickers.js`** contient exactement les 18 stickers de la spec (§ 3).
- [ ] **Étape 4 : les vérifications.**
  - `node tests/e2e/intros-marqueze.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs`, `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/aventures.mjs`, `node tests/e2e/hub.mjs` et `npm test` ;
  - résultat attendu : tout est vert ;
  - `data-length` reste entre 35000 et 37000 ms.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : la route de Biscarrosse et le coucher de soleil sur l'océan : Marquèze en entier" -- <les fichiers de la tâche>`

### Tâche 6 : le README, et le contrôle à l'œil

**Fichiers :**
- Modifier : `README.md` (la partie sur les intros, et le journal)
- Modifier : `tests/e2e/intros-marqueze.mjs` (le mode `SHOTS`, comme `intros-ile-de-re.mjs`)

- [ ] **Étape 1 :** capture de la page `?test`, section « Les intros » : Marquèze est marquée « nouvelle », avec ses 10 liens.
- [ ] **Étape 2 : le README.** Ajoute en quelques lignes, au même ton :
  - la recette du train (`cahote`, `secoue`, et `defile` réutilisé) ;
  - les cochons noirs ;
  - l'entrée de Marquèze dans le journal ;
  - « 11 sorties provisoires ».

  Mets aussi à jour la ligne « Dernière mise à jour ».
- [ ] **Étape 3 : le contrôle à l'œil.**
  - `SHOTS=<dossier> node tests/e2e/intros-marqueze.mjs` prend une capture au milieu de chaque temps sur chaque écran, plus la carte à 2 s et le train dehors à 9,5 s ;
  - regarde chaque capture et écris dans le rapport ce qui accroche ;
  - ne corrige pas le scénario dans cette tâche.
- [ ] **Étape 4 : commit.** `git commit -m "Intros : le README explique Marquèze (le train, les cochons noirs)" -- README.md tests/e2e/intros-marqueze.mjs`
