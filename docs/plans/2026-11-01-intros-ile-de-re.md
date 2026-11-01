# L'intro de l'Île de Ré : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :** `#/aventures/ile-de-re` joue la vraie intro de l'Île de Ré, environ 31 s en papier découpé, en 10 temps :
- la carte (la C3 de Bordeaux à La Rochelle, puis le pont) ;
- le pont, en selle, la traversée de l'île à vélo, le phare des Baleines, la glace, le retour doré ;
- La Rochelle le lendemain, la côte ;
- l'affiche « ÎLE DE RÉ ».

Les retournements des personnes deviennent des cartes retournées, bivouac compris.

**Architecture :**
- **Le scénario** `intros/ile-de-re.js` suit le modèle de `intros/canoe.js`.
- **La boîte à outils `js/aventures/scene/` gagne :**
  - la recette vélo (`recipes-velo.js`) ;
  - la carte vers le nord avec les îles (`props-carte.js`, et la caméra de `carte`) ;
  - de nouveaux `props-*.js`, un par famille de décor ;
  - deux sons.
- **Elle réutilise ce qui existe :** `sceneActor` (`show`, `flip`), `person`, `vehicle`, `marche`, `affiche`, `roundTrees`, `house`, `shingle`, la mer et le ciel doré de `props-riviere.js`, `stage.sound(…, until)`.
- **La suite du navigateur** `tests/e2e/intros-ile-de-re.mjs` s'appuie sur le kit `tests/e2e/intro-kit.mjs`, comme celle du canoë.

**Stack :** vanilla, modules natifs, GSAP global (`window.gsap`), SVG et CSS, WebAudio, `node --test`, banc CDP maison (`tests/e2e/`).

**Spec :** `docs/specs/2026-11-01-intros-ile-de-re-design.md`, en entier. Elle suit `docs/specs/2026-10-31-intros-canoe-design.md` et `docs/specs/2026-10-30-intros-3a-design.md`, dont les règles s'appliquent là où elle ne dit pas autre chose.

**Modèle et références :**
- **le code du canoë :** `js/aventures/intros/canoe.js`, la suite `tests/e2e/intros-canoe.mjs`, et la partie « intros » du README, qui décrit la boîte à outils et ses recettes ;
- **les planches de Kevin**, dans `planches/voyages/ile-de-re/` (hors git) ;
- **les lieux réels :**
  - le pont de l'Île de Ré, long et courbe, avec une bosse au milieu ;
  - les maisons blanches aux volets verts et les roses trémières ;
  - les marais salants et leurs tas de sel ;
  - le clocher noir et blanc d'Ars ;
  - le phare des Baleines, une haute tour de pierre ;
  - le Vieux-Port de La Rochelle, avec la tour Saint-Nicolas, la tour de la Chaîne et les mâts.

## Contraintes globales
- **Les règles du projet :**
  - jamais de `transition` CSS sur `opacity` ou `transform` d'une cible GSAP, ni de `@keyframes` sur une cible GSAP ;
  - `const reduced = false` ;
  - aucune dépendance ajoutée ;
  - aucune clé de stockage ajoutée ;
  - commentaires courts, en anglais, à la densité des fichiers voisins ;
  - les textes affichés vont dans `js/content.js`, les noms de la carte dans `js/aventures/data.js`.
- **La fluidité :**
  - chaque couche de décor est dessinée une fois et ne fait que se déplacer (`transform`) ;
  - on n'anime jamais les paramètres d'un filtre SVG ;
  - une lumière qui change vit sur sa propre couche, et on n'anime que son opacité ;
  - chaque décor n'est affiché que pendant son temps.
- **La lecture :**
  - tout tient sous `?demo&t=` : des tweens et des `set` de la timeline, des `fromTo` avec un départ explicite (`immediateRender: false`), et aucun effet de bord en `onUpdate` ;
  - toutes les répétitions sont finies et se terminent dans la timeline (`Math.max(0, …)` sur tout compte calculé).
- **Les leçons du canoë**, à regarder sur ses propres captures (393 × 852, 852 × 393, 1920 × 1080) avant de rendre une tâche :
  - aucun texte, panneau ni sticker coupé par le bord de l'écran ;
  - un décor lointain n'est jamais dessiné devant un décor proche (l'ordre des couches) ;
  - deux personnes côte à côte sont à la même échelle ;
  - une lumière dorée se lit dorée, pas grise ;
  - pas de logique recopiée : on partage l'aide existante au lieu de la copier.
- **Ce qui ne change pas de comportement :**
  - l'intro du canoë, le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - l'intro du bivouac ne change que par ses retournements, qui deviennent des cartes retournées (tâche 2) ;
  - `tests/e2e/intros.mjs`, `intros-canoe.mjs`, `hub.mjs` et `aventures.mjs` restent verts.
- **La scène :**
  - 390 × 760 unités, zone sûre de x = 25 à x = 365 ;
  - chaque décor couvre au moins 1600 unités de large, déplacements compris (1920 × 1080). Un décor qui défile de côté couvre aussi toute sa course.
- **Les durées :**
  - l'intro de l'Île de Ré dure entre 30 et 32 s, avec les temps de `SCENARIOS["ile-de-re"].beats` (tâche 3) ;
  - la fin vient toujours de la timeline.
- **Les stickers :**
  - planches hors git ;
  - standards à 300 px, scènes à 600 px ;
  - l'intro ne charge que ceux de `intros/ile-de-re.stickers.js`, qui contient exactement ce que le scénario monte à la fin de chaque tâche.
- **Les sons :** un nom se vérifie dans `js/audio.js` avant d'être pris. Si `bell` ou `gulls` existe déjà, on prend un nom libre et on le dit.
- **Le serveur de test :** http://localhost:5173. S'il ne répond pas, lance `node tests/e2e/serve.mjs` en arrière-plan, sans en relancer un deuxième.
- **Les commits :** avec pathspec, un message en français « Intros : … » qui se termine par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pas de push, ni merge, ni `--force`.

## Points à surveiller (Review Focus)
1. **Le passeport qui précharge l'Île de Ré.** Le canoë est tamponné et le livre est posé : le module `intros/ile-de-re.js` et ses stickers sont déjà demandés, et le toucher sur l'Île de Ré ne les retélécharge pas (`transferSize` 0). Testé en tâche 3.
2. **Un `?demo&t=` au milieu d'un changement de vue du vélo.** Les vélos montrent exactement une vue, en avançant comme en reculant (un balayage toutes les 0,1 s sur la traversée). Testé en tâche 4.
3. **Tourner le téléphone pendant la traversée** (portrait → paysage, puis 1 s plus tard → portrait). La timeline avance d'au moins 0,7 fois l'horloge, et les vélos restent entiers dans l'écran. Testé en tâche 4.
4. **Entrer et sortir trois fois de suite,** dont une fois à La Rochelle : `gsap.globalTimeline.getChildren()` revient à son compte de départ, et aucune `.st-stage` ne reste. Testé en tâche 6.
5. **Un PC en 1920 × 1080 pendant la traversée et à La Rochelle :** chaque couche couvre toute la largeur de l'écran, y compris au bout de sa course. Testé en tâches 4 et 6.

---

### Tâche 1 : les 60 stickers de l'Île de Ré

**Fichiers :**
- Créer : `assets/aventures/ile-de-re/*.webp` (48 + 12)

**Interfaces :**
- Produit :
  - les fichiers de la spec, § 3 ;
  - **la correspondance réelle** de chaque numéro de la planche à vélo avec ce qu'il montre, écrite dans le rapport.

- [ ] **Étape 1 : lancer l'outil.**
  - les commandes :
    ```
    node tools/decoupe/decoupe.mjs planches/voyages/ile-de-re
    node tools/decoupe/decoupe.mjs "planches/voyages/ile-de-re/Cycy et Kevin à vélo.png" --scene   (ajouter --count 12 si elle ne donne pas 12 stickers)
    ```
  - résultat attendu : 48 + 12 fichiers, les standards entre 10 et 60 Ko, les scènes entre 30 et 180 Ko.
- [ ] **Étape 2 : le contrôle à l'œil.**
  - Ouvre chaque planche de contrôle (capture), et vérifie que les noms correspondent, que les contours blancs sont entiers et qu'il n'y a ni morceau voisin ni tache.
  - Écris ce que montre chaque numéro de la planche à vélo, comparé à l'ordre attendu de la spec (§ 3).
  - Indique pour les 4 planches standard les poses des positions 9 à 12 (le voilier, le phare, la glace, le saut pour Cycy de face).
- [ ] **Étape 3 :** `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 4 : commit.** `git commit -m "Intros : les stickers de l'Île de Ré" -- assets/aventures/ile-de-re`

### Tâche 2 : les données de l'Île de Ré, et le retournement en carte

**Fichiers :**
- Modifier : `js/aventures/data.js`, `js/aventures/scene/actors.js` (`person.turn`)
- Test : `tests/intros.test.mjs`, `tests/e2e/intros.mjs`

**Interfaces :**
- Produit :
  - **la sortie `ile-de-re` dans `AVENTURES`**, avec exactement :
    ```js
    lieu: "Île de Ré",
    trajet: {
      depart: "Bordeaux",
      etapes: ["Saintes", "La Rochelle"],
      etapesAt: [3, 5],
      // [lat, lon]: Bordeaux, Saint-André-de-Cubzac, Pons, Saintes, Rochefort, La Rochelle, the bridge's head, Rivedoux
      points: [[44.837, -0.579], [45.0, -0.445], [45.578, -0.548], [45.746, -0.633], [45.937, -0.962], [46.16, -1.152], [46.172, -1.236], [46.158, -1.272]],
    },
    ```
    Les `transports` restent `["c3", "velo"]` ;
  - **`person.turn(tl, at, side, pose)`** écrase vraiment la boîte de retournement de la personne. Aujourd'hui, `Object.assign` remplace `self.turn` (la boîte) par la méthode, et `turnOver` anime donc une propriété de la fonction. La méthode garde son nom et sa signature.

- [ ] **Étape 1 : écrire les tests qui échouent.**
  - `intros: the Île de Ré goes by C3 to La Rochelle and over the bridge`, avec `ILE_MAP = { origin: [44.837, -0.579], at: { x: 260, y: 640 }, unitsPerDegree: 258 }` :
    - `byId("ile-de-re").lieu` vaut `"Île de Ré"` ;
    - chaque point projeté est dans x 25 à 365 et y 120 à 700 ;
    - l'arrivée est au nord du départ ;
    - `stops(...)` donne `["Bordeaux", "Saintes", "La Rochelle", "Île de Ré"]` ;
  - dans `tests/e2e/intros.mjs`, la vérification « le bivouac, En haut : Cycy se retourne comme une carte ». À `?demo&t=` au milieu de son retournement (environ « En haut » + 0,8 s, à ajuster sur la timeline réelle), le `scaleX` de la boîte `.st-actor__turn` de Cycy est inférieur à 0,6 ; à « En haut » + 1,5 s, il vaut 1 à 0,01 près.
- [ ] **Étape 2 :** `npm test` et `node tests/e2e/intros.mjs`. Résultat attendu : ÉCHEC sur ces vérifications.
- [ ] **Étape 3 : implémenter.** `person` garde une référence à sa boîte avant d'ajouter ses méthodes, et `turn` la passe à `turnOver`. Le commentaire de `actors.js` qui décrivait le défaut est mis à jour.
- [ ] **Étape 4 : les vérifications.**
  - `npm test`, `node tests/e2e/intros.mjs` et `node tests/e2e/intros-canoe.mjs` ;
  - résultat attendu : tout est vert, et le bivouac garde ses 35 autres vérifications ;
  - capture le bivouac au milieu d'un retournement et mets-la dans le rapport.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : les données de l'Île de Ré, et les personnes qui se retournent comme une carte (bivouac compris)" -- js/aventures/data.js js/aventures/scene/actors.js tests/intros.test.mjs tests/e2e/intros.mjs`

### Tâche 3 : la carte vers le nord, le pont, l'affiche, et l'Île de Ré qui monte son scénario

**Fichiers :**
- Créer :
  - `js/aventures/intros/ile-de-re.js`, `js/aventures/intros/ile-de-re.stickers.js` ;
  - `js/aventures/scene/props-pont.js` (la mer de pleine mer, le pont courbe, les voiliers, les mouettes) ;
  - `js/aventures/scene/props-ile.js` (pour l'instant le phare des Baleines et sa mer, avec leur version affiche) ;
  - `tests/e2e/intros-ile-de-re.mjs`.
- Modifier :
  - `js/aventures/intros/index.js` ;
  - `js/aventures/scene/props-carte.js` (les îles de Ré et d'Oléron, l'anse de La Rochelle, le pont sur la carte) ;
  - `js/aventures/scene/recipes.js` (la caméra de `carte` pour un trajet vers le nord) ;
  - `js/audio.js` (`gulls`), `css/intros.css` ;
  - `tests/e2e/aventures.mjs` (l'exemple d'intro provisoire passe de l'Île de Ré à Marquèze).

**Interfaces :**
- Consomme : la tâche 2 (les données) et la tâche 1 (les fichiers et la correspondance des numéros).
- Produit :
  - **`SCENARIOS["ile-de-re"]`**, avec exactement ces `beats` :
    ```js
    [{ name: "La carte", at: 0 }, { name: "Le pont", at: 4.5 }, { name: "En selle", at: 7.5 }, { name: "La traversée", at: 9.5 },
     { name: "Le phare", at: 15 }, { name: "La glace", at: 18 }, { name: "Le retour", at: 20.5 }, { name: "La Rochelle", at: 23 },
     { name: "La côte", at: 26.5 }, { name: "L'affiche", at: 28.6 }]
    ```
  - **la carte :** `projection({ origin: trajet.points[0], at: { x: 260, y: 640 }, unitsPerDegree: 258 })` ;
  - **la caméra de `carte` pour un trajet vers le nord** regarde vers la route parcourue, en bas, et non au-dessus de l'épingle. Les cartes du bivouac et du canoë ne bougent pas ;
  - **la scène du phare, de jour, sert à l'affiche :** de 7,5 à 28,6 s, elle se montre sans personne en attendant les tâches 4 à 6.

- [ ] **Étape 1 : écrire la suite qui échoue** (`tests/e2e/intros-ile-de-re.mjs`, sur les écrans de `VIEWPORTS` et 852 × 393, avec le kit `intro-kit.mjs`) :
  - `?demo#/aventures/ile-de-re` :
    - `data-length` entre 30000 et 32000 ms ;
    - l'intro est jouée en entier ;
    - l'affiche dit exactement « ÎLE DE RÉ » et « Île de Ré · 17–18 août 2025 », avec son cadre et son lettrage dans l'écran ;
    - puis on revient au passeport ;
  - **la carte**, à ?t= 0,3, 2 et 3,9 :
    - la C3 est dans l'écran ;
    - à 0,3 s, « Bordeaux » est entièrement dans l'écran ;
    - ensuite, « Saintes », « La Rochelle » et l'épingle « Île de Ré » sont entièrement dans l'écran quand ils sont écrits ;
    - aucun nom n'est caché par la C3 ;
  - **le pont**, au milieu de son temps : la C3 est entièrement dans l'écran ;
  - **les stickers** demandés sous `/assets/aventures/` sont exactement ceux de `ile-de-re.stickers.js` ;
  - **un sticker de scène bloqué** (celui de l'affiche) passe sur son remplaçant `assets/cyrielle/joy.webp`, et l'intro se termine ;
  - **la règle de passage :**
    - la première fois (le canoë tamponné, hors démo), un toucher au milieu ne passe pas l'intro ;
    - en `?demo`, « Passer ▸ » la termine ;
    - le retour du navigateur vers 10 s : pas d'erreur, et la sortie n'est pas marquée vue ;
  - **point 1 du Review Focus** ;
  - **aucune erreur** dans la console.
  
  Lancer `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 2 : le scénario.**
  - **Enregistrement :** `SCENARIOS["ile-de-re"]`, puis `ile-de-re.js` sur le modèle de `canoe.js`.
  - **La carte (0 → 4,5 s) :** `recipes.carte`. La carte vers le nord montre l'Île de Ré, l'Île d'Oléron et l'anse de La Rochelle, aux vraies coordonnées. Le pont y est dessiné, et le pointillé le passe jusqu'à l'épingle de Rivedoux.
  - **Le pont (4,5 → 7,5 s) :**
    - la caméra plonge de l'épingle vers la scène du pont (`plonge`) ;
    - le pont courbe en papier, avec sa bosse, ses piles et la mer ;
    - des voiliers sous le pont et des mouettes, avec `gulls` ;
    - la C3 (« roule ») le traverse de gauche à droite, suivie par la caméra, avec `engine` arrêté à la fin du temps (`until`) ;
  - **De 7,5 à 28,6 s :** la scène du phare se montre, de jour et sans personne.
  - **L'affiche (28,6 s) :** `recipes.affiche` sur le phare et la mer, avec vous deux à vélo côte à côte devant (`sceneActor`, `who: "duo"`, le sticker 01 de la planche à vélo).
  - **`gulls` :** deux ou trois cris de mouette, environ 0,8 s.
- [ ] **Étape 3 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : tout est vert.
- [ ] **Étape 4 :** `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs` et `npm test`. Résultat attendu : tout est vert, et les cartes du bivouac et du canoë n'ont pas bougé.
- [ ] **Étape 5 : `node tests/e2e/aventures.mjs`.**
  - La vérification qui jouait l'Île de Ré comme intro provisoire (le toucher sur l'emplacement de l'Île de Ré, vers la ligne 1055) passe sur **Marquèze**, avec sa sauvegarde adaptée. Ce qu'elle vérifie ne change pas.
  - Les vérifications sur le canoë tamponné et sur l'Île de Ré à vivre ne changent pas.
  - Résultat attendu : tout est vert. Un rouge de temps de réponse du passeport déjà connu se relance une fois, et le rapport le dit.
- [ ] **Étape 6 : commit.** `git commit -m "Intros : l'Île de Ré monte son scénario (la carte vers le nord, le pont, et l'affiche « ÎLE DE RÉ »)" -- <les fichiers de la tâche>`

### Tâche 4 : le vélo, en selle, la traversée

**Fichiers :**
- Créer : `js/aventures/scene/recipes-velo.js`
- Modifier : `js/aventures/scene/props-ile.js` (le pied du pont et les vélos, les vignes, les marais salants, les maisons rétaises, le clocher d'Ars, les panneaux kilométriques, la piste cyclable), `js/audio.js` (`bell`), `js/content.js` (les textes des panneaux), `css/intros.css`, `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`

**Interfaces :**
- Consomme : `sceneActor` (`show`, `flip`), `stage.pan`.
- Produit :
  - **`pedale(tl, at, { actor, duration, speed = 1, lines = false }) → fin`** : le balancement de pédalage, avec la hauteur et une petite rotation, environ 0,4 s par coup de pédale à `speed` 1. Avec `lines`, des traits de vitesse sortent derrière l'acteur. Tout est fini et tient sous `seek` ;
  - **`defile(tl, at, { stage, layers, distance, duration, ease }) → fin`** : le décor défile de côté. Chaque couche glisse de `distance × sa profondeur` vers la gauche (`stage.pan` avec `x`), et chaque couche est assez large pour sa course.

- [ ] **Étape 1 : écrire les vérifications qui échouent** :
  - au milieu de chaque temps : « En selle » : duo ; « La traversée » : duo. Chacun est entièrement dans l'écran, sur tous les écrans et en 852 × 393 ;
  - **point 2 :** de 7,5 à 15 s, toutes les 0,1 s en avançant puis en reculant, les vélos (`[data-who="duo"]`) montrent exactement une vue ;
  - **point 3 :** le téléphone tourné pendant la traversée ;
  - **point 5 (traversée) :** en 1920 × 1080, à 10, 12,5 et 14,8 s, chaque couche visible couvre toute la largeur ;
  - **les panneaux kilométriques** sont entiers dans l'écran quand ils se montrent.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 3 et 4 de la spec.**
  - **En selle (7,5 → 9,5 s) :**
    - au pied du pont, vous deux de face (le sticker « de face tous les deux »), avec `bell` ;
    - puis `flip` vers « côte à côte », et vous partez (`pedale`).
  - **La traversée (9,5 → 15 s) :**
    - `defile` : les vignes, puis les marais salants et leurs tas de sel, puis les maisons blanches aux volets verts avec leurs roses trémières, puis le clocher d'Ars ;
    - les vues des vélos s'enchaînent avec `flip` : à fond (Cycy, puis Kevin devant), avec `lines`, puis essoufflés sur le guidon à la fin ;
    - les panneaux en bois comptent les kilomètres jusqu'au phare. Leurs textes vont dans `content.aventures.intros.ileDeRe` ;
  - **`bell` :** deux « dring » de sonnette, environ 0,4 s.
- [ ] **Étape 4 :** `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs` et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : l'Île de Ré à vélo (en selle, la traversée des vignes, des marais salants et d'Ars)" -- <les fichiers de la tâche>`

### Tâche 5 : le phare, la glace, le retour doré

**Fichiers :**
- Modifier : `js/aventures/scene/props-ile.js` (le phare des Baleines vu de près, la piste au bord de l'eau, le ciel doré), `css/intros.css`, `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`

**Interfaces :**
- Consomme : `pedale`, `defile` (tâche 4), `sceneActor`, le ciel doré du canoë (`cielDore` dans `props-riviere.js` : on le partage s'il convient, sinon on le généralise sans le copier).

- [ ] **Étape 1 : écrire les vérifications qui échouent.** Au milieu de chaque temps, sur chaque écran : « Le phare » : duo ; « La glace » : duo ; « Le retour » : duo. Chacun est entièrement dans l'écran, et le phare est visible et entier au-dessus d'eux sur le téléphone.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 5 à 7 de la spec.**
  - **Le phare (15 → 18 s) :** la grande tour de pierre et sa lanterne, avec la mer derrière. Vous deux devant, bras en l'air (le sticker 12), avec un « pop ». On n'utilise pas le sticker « devant le phare » (il a son propre petit phare).
  - **La glace (18 → 20,5 s) :** au pied du phare, `flip` vers « les glaces ».
  - **Le retour (20,5 → 23 s) :**
    - vous deux de dos à vélo (`pedale`) sur la piste au bord de l'eau, et le décor qui défile ;
    - la lumière dorée du soir : un ciel doré sur sa propre couche (opacité seulement), et un voile léger qui réchauffe la terre et l'eau. Le résultat doit se lire doré, pas gris.
- [ ] **Étape 4 :** `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros-canoe.mjs` (si le ciel doré est partagé) et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : le phare des Baleines, la glace, et le retour doré à vélo" -- <les fichiers de la tâche>`

### Tâche 6 : La Rochelle, la côte, et l'Île de Ré en entier

**Fichiers :**
- Créer : `js/aventures/scene/props-rochelle.js` (le Vieux-Port, la tour Saint-Nicolas, la tour de la Chaîne, les mâts, le quai) et `js/aventures/scene/props-cote.js` (la route au bord de la mer, la plage, le soleil)
- Modifier : `css/intros.css`, `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`

**Interfaces :**
- Consomme : `person` (`turn` en carte, tâche 2), `marche`, `vehicle` (`drive`, `bounce`, `view`), `stage.sound(…, until)`.

- [ ] **Étape 1 : écrire les vérifications qui échouent** :
  - au milieu de chaque temps, sur chaque écran : « La Rochelle » : cycy, kevin ; « La côte » : c3. Plus la liste complète `CAST` des 9 temps après la carte, sur les 4 écrans et en 852 × 393 ;
  - **La Rochelle :** au milieu du retournement, le `scaleX` des boîtes de retournement est inférieur à 0,6 ; à la fin, il vaut ±1 ;
  - **point 4 :** entrer et sortir trois fois par le retour du navigateur, à `?demo&t=` 5, 15 et 24 ;
  - **point 5 (La Rochelle) :** en 1920 × 1080, à 24 et 26 s, chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 8 et 9 de la spec.**
  - **La Rochelle (23 → 26,5 s) :**
    - la lumière du matin, le Vieux-Port, ses deux tours à l'entrée, les mâts des voiliers et le quai ;
    - vous deux de dos (`person`, `side: "dos"`, « joie ») avec `marche`, puis vous vous retournez en carte (`turn`), de face, en « joie » ;
    - les mouettes (`gulls`) ;
  - **La côte (26,5 → 28,6 s) :**
    - la C3 (« roule ») longe la mer sur la route, avec la plage, le soleil et des vaguelettes ;
    - `engine` s'arrête à 28,6 s (`until`) ;
  - **À 28,6 s,** retour de jour sur le phare pour l'affiche (tâche 3).
- [ ] **Étape 4 : les vérifications.**
  - `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs`, `node tests/e2e/aventures.mjs`, `node tests/e2e/hub.mjs` et `npm test` ;
  - résultat attendu : tout est vert ;
  - `data-length` reste entre 30000 et 32000 ms.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : La Rochelle le lendemain et le retour par la côte : l'Île de Ré en entier" -- <les fichiers de la tâche>`

### Tâche 7 : le README, et le contrôle à l'œil

**Fichiers :**
- Modifier : `README.md` (la partie sur les intros, et le journal)
- Modifier : `tests/e2e/intros-ile-de-re.mjs` (le mode `SHOTS`, comme `intros-canoe.mjs`)

- [ ] **Étape 1 :** capture de la page `?test`, section « Les intros » : l'Île de Ré est marquée « nouvelle », avec ses 10 liens.
- [ ] **Étape 2 : le README.** Ajoute en quelques lignes, au même ton, la recette vélo (`pedale`, `defile`), le retournement en carte, et l'entrée de l'Île de Ré dans le journal. Mets aussi à jour la ligne « Dernière mise à jour ».
- [ ] **Étape 3 : le contrôle à l'œil.**
  - `SHOTS=<dossier> node tests/e2e/intros-ile-de-re.mjs` prend une capture au milieu de chaque temps sur chaque écran, plus la carte à 2 s ;
  - regarde chaque capture et écris dans le rapport ce qui accroche ;
  - ne corrige pas le scénario dans cette tâche.
- [ ] **Étape 4 : commit.** `git commit -m "Intros : le README explique l'Île de Ré (vélo, défilement, retournement en carte)" -- README.md tests/e2e/intros-ile-de-re.mjs`
