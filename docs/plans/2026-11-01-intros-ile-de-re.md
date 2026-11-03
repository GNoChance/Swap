# L'intro de l'Île de Ré : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :** `#/aventures/ile-de-re` joue la vraie intro de l'Île de Ré, environ 33,5 s en papier découpé, en 10 temps :
- la carte (la C3 de Bordeaux à La Rochelle, jusqu'au pied du pont) ;
- en selle, le pont à vélo, la traversée de l'île, le phare des Baleines, la glace, le retour doré ;
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
  - l'intro de l'Île de Ré dure entre 32,5 et 34,5 s, avec les temps de `SCENARIOS["ile-de-re"].beats` (tâche 3, puis les tâches 4a et 5) ;
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
2. **Un `?demo&t=` au milieu d'un changement de vue du vélo.** Les vélos montrent exactement une vue, en avançant comme en reculant (un balayage toutes les 0,1 s, de 4,5 à 15 s). Testé en tâches 4a (4,5 → 9,5 s) et 4b (9,5 → 15 s).
3. **Tourner le téléphone pendant la traversée** (portrait → paysage, puis 1 s plus tard → portrait). La timeline avance d'au moins 0,7 fois l'horloge, et les vélos restent entiers dans l'écran. Testé en tâche 4b.
4. **Entrer et sortir trois fois de suite,** dont une fois à La Rochelle : `gsap.globalTimeline.getChildren()` revient à son compte de départ, et aucune `.st-stage` ne reste. Testé en tâche 6.
5. **Un PC en 1920 × 1080 sur le pont, pendant la traversée et à La Rochelle :** chaque couche couvre toute la largeur de l'écran, y compris au bout de sa course. Testé en tâches 4a, 4b et 6.

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

> Faite. Ses données sont corrigées en tâche 4a (2026-11-02) : le trajet s'arrête à la tête du pont, à La Pallice.

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

> Faite. Corrigée en tâche 4a (2026-11-02) : « En selle » passe avant « Le pont », et la C3 quitte le pont.

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

### Tâche 4a : la correction de Kevin : la C3 s'arrête au pied du pont, en selle, et le pont à vélo

Kevin, le 2026-11-02 : « on a traversé le pont à vélo pas en voiture ». Puis ses réponses du même jour : l'épingle s'appelle « Île de Ré », les vélos sont loués au pied du pont, vous traversez côte à côte et tranquilles, et l'intro garde environ 31 s. La spec (§ 0, § 2 temps 1 à 3, § 4, § 5, § 7) est corrigée en conséquence.

**Fichiers :**
- Créer : `js/aventures/scene/recipes-velo.js`
- Modifier :
  - `js/aventures/data.js`, `tests/intros.test.mjs` ;
  - `js/aventures/intros/index.js` (les `beats`) ;
  - `js/aventures/scene/props-pont.js` (le pied du pont côté La Rochelle, la boutique de location de vélos) ;
  - `js/aventures/scene/props-carte.js`, seulement si l'épingle le demande ;
  - `js/audio.js` (`bell`), `js/content.js` (le texte du panneau de la boutique), `css/intros.css` ;
  - `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`.

**Interfaces :**
- Consomme : `recipes.along`, `recipes.plonge`, `sceneActor` (`show`, `flip`), `stage.pan` et `stage.frame`, `pont.deck(x)`, `gulls` (tâche 3).
- Produit :
  - **les données de l'Île de Ré**, avec exactement ce trajet (`lieu: "Île de Ré"` et les `transports` `["c3", "velo"]` ne changent pas) :
    ```js
    trajet: {
      depart: "Bordeaux",
      etapes: ["Saintes", "La Rochelle"],
      etapesAt: [3, 5],
      // [lat, lon]: Bordeaux, Saint-André-de-Cubzac, Pons, Saintes, Rochefort, La Rochelle, the bridge's head at La Pallice
      points: [[44.837, -0.579], [45.0, -0.445], [45.578, -0.548], [45.746, -0.633], [45.937, -0.962], [46.16, -1.152], [46.172, -1.236]],
    },
    ```
    Il n'y a pas d'`arrivee` : l'épingle porte le `lieu`, « Île de Ré » ;
  - **`SCENARIOS["ile-de-re"].beats`**, avec exactement :
    ```js
    [{ name: "La carte", at: 0 }, { name: "En selle", at: 4.5 }, { name: "Le pont", at: 6.5 }, { name: "La traversée", at: 9.5 },
     { name: "Le phare", at: 15 }, { name: "La glace", at: 18 }, { name: "Le retour", at: 20.5 }, { name: "La Rochelle", at: 23 },
     { name: "La côte", at: 26.5 }, { name: "L'affiche", at: 28.6 }]
    ```
  - **`pedale(tl, at, { actor, duration, speed = 1, lines = false }) → fin`**, dans `recipes-velo.js` : le balancement de pédalage, avec la hauteur et une petite rotation, environ 0,4 s par coup de pédale à `speed` 1. Avec `lines`, des traits de vitesse sortent derrière l'acteur. Tout est fini et tient sous `seek` ;
  - **à 9,5 s,** vous deux arrivez au bout du pont, côté île, et la tâche 4b prend la suite. En attendant, la scène du phare se montre de 9,5 à 28,6 s.

- [ ] **Étape 1 : écrire les tests qui échouent.**
  - **Le test unitaire** devient `intros: the Île de Ré goes by C3 to the foot of Ré's bridge` :
    - `stops(...)` donne `["Bordeaux", "Saintes", "La Rochelle", "Île de Ré"]` ;
    - le dernier point est `[46.172, -1.236]` ;
    - chaque point projeté est dans x 25 à 365 et y 120 à 700 ;
    - l'arrivée est au nord du départ.

    Le test des noms vers le nord garde ses assertions.
  - **La suite du navigateur :**
    - **la carte**, à 0,3, 2 et 3,9 s : les vérifications de la tâche 3, avec l'épingle « Île de Ré ». La C3 est dans l'écran à chacun de ces instants. L'épingle et son nom sont entièrement dans l'écran, et la boîte du nom ne croise pas celle de « La Rochelle » ;
    - **En selle,** au milieu du temps : le panneau de la boutique de location est entier dans l'écran ;
    - **`CAST` :** « En selle » : duo ; « Le pont » : duo ; « L'affiche » : duo. Chacun est entièrement dans l'écran, sur tous les écrans et en 852 × 393 ;
    - **sur le pont,** à 7, 8 et 9,2 s : le duo seul, entièrement dans l'écran, pendant que la caméra le suit ;
    - **aucune C3 de 4,5 à 9,5 s** (un relevé toutes les 0,25 s) ;
    - **point 2 (4,5 → 9,5 s) :** toutes les 0,1 s, en avançant puis en reculant, `[data-who="duo"]` montre exactement une vue ;
    - **point 5 (le pont) :** en 1920 × 1080, à 7, 8, 9,2 et 9,45 s (la fin de la poursuite), chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `npm test` et `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC sur ces vérifications.
- [ ] **Étape 3 : implémenter les temps 1 à 3 de la spec corrigée.**
  - **La carte (0 → 4,5 s) :**
    - la C3 roule, visible, jusqu'au bout de son trajet : elle et son pointillé s'arrêtent à la tête du pont, à La Pallice ;
    - l'épingle « Île de Ré » s'y pose ;
    - le pont et l'île restent dessinés, mais le pointillé ne les traverse plus.
  - **En selle (4,5 → 6,5 s) :**
    - `plonge` de l'épingle vers le pied du pont : un bout de terre côté La Rochelle (de l'herbe, le début de la rampe), d'où la rampe monte vers la droite au-dessus de la mer ;
    - une petite boutique de location de vélos en papier, une cabane avec son panneau et quelques vélos rangés devant. Le texte du panneau va dans `content.aventures.intros.ileDeRe` ;
    - vous deux de face (sticker 02, « de face tous les deux »), avec `bell` ;
    - puis `flip` vers la vue qui roule, et vous partez vers la rampe (`pedale`).
  - **Le pont (6,5 → 9,5 s) :**
    - vous deux roulez sur le tablier avec `along()`, de son pied jusqu'au bout côté île en passant la bosse, avec `pedale` tout du long ;
    - la caméra vous suit, comme elle suivait la C3 ;
    - les voiliers et les mouettes restent, avec `gulls`.
    - Il n'y a plus de `engine` ni de C3 sur le pont.
  - **La vue qui roule :** le sticker 01, « côte à côte », tranquilles. Il n'y a pas de traits de vitesse (`lines`) sur le pont.
    - Retourne-le en miroir s'il roule vers la gauche (les stickers n'ont pas de texte).
    - Garde la même échelle qu'en selle.
    - Écris dans le rapport s'il est retourné et pourquoi.
  - **`bell` :** deux « dring » de sonnette, environ 0,4 s.
  - **La scène du phare,** en attente : elle se montre de 9,5 à 28,6 s (son `stage.frame` passe à 9,5 s).
  - **Avant de rendre la tâche, regarde tes captures** en 393 × 852, 852 × 393 et 1920 × 1080, à 2, 3,9, 5, 6, 7, 8 et 9,2 s :
    - les roues sont posées sur le tablier, jamais en l'air ni enfoncées ;
    - rien n'est coupé par le bord ;
    - le nom de l'épingle se lit et ne chevauche aucun autre nom ;
    - un décor lointain n'est jamais devant un décor proche. Les mouettes, par exemple, ne passent pas derrière la mer qui est devant elles.
- [ ] **Étape 4 : les vérifications.**
  - `npm test`, `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs` et `node tests/e2e/intros-canoe.mjs` ;
  - résultat attendu : tout est vert, et les cartes du bivouac et du canoë n'ont pas bougé.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : l'Île de Ré corrigée : la C3 s'arrête au pied du pont, et vous le traversez à vélo" -- <les fichiers de la tâche>`

### Tâche 4b : la traversée de l'île

**Fichiers :**
- Modifier :
  - `js/aventures/scene/recipes-velo.js` (`defile`) ;
  - `js/aventures/scene/props-ile.js` : les vignes, les marais salants, les maisons rétaises, le clocher d'Ars, les panneaux kilométriques, la piste cyclable ;
  - `js/content.js` (les textes des panneaux), `css/intros.css` ;
  - `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`.

**Interfaces :**
- Consomme : `pedale` et le duo qui arrive au bout du pont à 9,5 s (tâche 4a), `sceneActor` (`show`, `flip`), `stage.pan`.
- Produit : **`defile(tl, at, { stage, layers, distance, duration, ease }) → fin`**. Le décor défile de côté : chaque couche glisse de `distance × sa profondeur` vers la gauche (`stage.pan` avec `x`), et chaque couche est assez large pour sa course.

- [ ] **Étape 1 : écrire les vérifications qui échouent.**
  - au milieu de « La traversée », le duo est entièrement dans l'écran, sur tous les écrans et en 852 × 393 ;
  - **point 2 (9,5 → 15 s) :** toutes les 0,1 s, en avançant puis en reculant, les vélos montrent exactement une vue ;
  - **point 3 :** le téléphone tourné pendant la traversée ;
  - **point 5 (traversée) :** en 1920 × 1080, à 10, 12,5 et 14,8 s, chaque couche visible couvre toute la largeur ;
  - **les panneaux kilométriques** sont entiers dans l'écran quand ils se montrent.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter le temps 4 de la spec, la traversée (9,5 → 15 s).**
  - `defile` fait passer les vignes, puis les marais salants et leurs tas de sel, puis les maisons blanches aux volets verts avec leurs roses trémières, puis le clocher d'Ars.
  - Les vues des vélos s'enchaînent avec `flip` :
    - à fond, Cycy devant puis Kevin devant, avec `lines` ;
    - puis essoufflés sur le guidon à la fin.
  - Les panneaux en bois comptent les kilomètres jusqu'au phare. Leurs textes vont dans `content.aventures.intros.ileDeRe`.
- [ ] **Étape 4 :** `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs` et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : la traversée de l'Île de Ré à vélo (les vignes, les marais salants et Ars)" -- <les fichiers de la tâche>`

### Tâche 5 : le phare, la glace, et le retour sur un pont sans fin

Kevin, le 2026-11-02 : « juste pour le retour j'ai été super lent donc fait le pont comme si il faisait 150000000000000000 metres de long ». Puis ses réponses :
- le retour, c'est le pont seulement ;
- les piles défilent sans fin et un escargot vous double ;
- d'abord Cycy en forme et Kevin à la traîne, puis vous deux essoufflés ;
- le retour dure 5 s au lieu de 2,5 s.

La spec (§ 0, § 2 temps 7 à 10, § 7) est corrigée en conséquence.

**Fichiers :**
- Modifier :
  - `js/aventures/scene/props-ile.js` (le phare des Baleines vu de près) ;
  - `js/aventures/scene/props-pont.js` (le pont du retour sans rive, l'escargot) ;
  - `js/aventures/intros/index.js` (les `beats`) ;
  - `css/intros.css`, `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`.

**Interfaces :**
- Consomme : `pedale` (tâche 4a), `defile` (tâche 4b), `sceneActor` (`show`, `flip`), le pont, la mer et les mouettes de `props-pont.js` (tâches 3 et 4a), et le ciel doré du canoë (`cielDore` dans `props-riviere.js` : on le partage s'il convient, sinon on le généralise sans le copier).
- Produit :
  - **`SCENARIOS["ile-de-re"].beats`**, avec exactement :
    ```js
    [{ name: "La carte", at: 0 }, { name: "En selle", at: 4.5 }, { name: "Le pont", at: 6.5 }, { name: "La traversée", at: 9.5 },
     { name: "Le phare", at: 15 }, { name: "La glace", at: 18 }, { name: "Le retour", at: 20.5 }, { name: "La Rochelle", at: 25.5 },
     { name: "La côte", at: 29 }, { name: "L'affiche", at: 31.1 }]
    ```
  - **Tout ce qui venait après 23 s est décalé de 2,5 s.** L'affiche commence à 31,1 s, et l'intro dure entre 32,5 et 34,5 s. En attendant la tâche 6, la scène du phare se montre de 25,5 à 31,1 s.

- [ ] **Étape 1 : écrire les vérifications qui échouent.**
  - **Au milieu de chaque temps, sur chaque écran et en 852 × 393 :** « Le phare » : duo ; « La glace » : duo ; « Le retour » : duo. Chacun est entièrement dans l'écran.
  - **Le phare** est visible et entier au-dessus d'eux sur le téléphone.
  - **La durée :** `data-length` entre 32500 et 34500 ms (la constante `LENGTH` de la suite).
  - **Le retour sans fin :**
    - de 21 à 25,3 s, un relevé toutes les 0,25 s : aucune des deux rives du pont n'est dans l'écran, et une pile au moins y est ;
    - l'escargot est entièrement dans l'écran au milieu du retour ;
    - il est derrière le duo (à sa droite) au début du retour et devant lui (à sa gauche) à la fin. Il les double.
  - **Point 2 (20,5 → 25,5 s) :** toutes les 0,1 s, en avançant puis en reculant, le duo montre exactement une vue.
  - **Point 5 (le retour) :** en 1920 × 1080, à 21, 23 et 25,3 s, chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 5 à 7 de la spec.**
  - **Le phare (15 → 18 s) :** la grande tour de pierre et sa lanterne, avec la mer derrière. Vous deux devant, bras en l'air (le sticker 12), avec un « pop ». On n'utilise pas le sticker « devant le phare » (il a son propre petit phare).
  - **La glace (18 → 20,5 s) :** au pied du phare, `flip` vers « les glaces ».
  - **Le retour (20,5 → 25,5 s) :**
    - **Le décor :** le pont de l'aller, vu de côté au-dessus de la mer, partagé et non recopié. Vous le retraversez de droite à gauche, vers La Rochelle.
    - **La lumière dorée du soir :** un ciel doré sur sa propre couche (opacité seulement), et un voile léger qui réchauffe la mer et le tablier. Le résultat doit se lire doré, pas gris.
    - **Le pont sans fin :** vous pédalez sur place pendant que le tablier et ses piles défilent vers la droite, avec `defile` et une distance négative. Si `defile` ne prend pas une distance négative, généralise-le sans le recopier.
      - Les couches sont assez larges pour que les rives n'entrent jamais dans l'écran.
      - Les mouettes restent.
    - **Vous deux :**
      - d'abord le sticker 05 (Cycy devant, en forme, Kevin derrière), qui roule déjà vers la gauche sur la planche, avec `pedale` lent ;
      - vers 24 s, `flip` vers le sticker 08 (essoufflés sur le guidon), qui pédale encore plus lentement.
    - **L'escargot :** un petit escargot en papier, posé sur le tablier, avance vers la gauche plus vite que vous et vous double tranquillement.
  - **Le décalage :** les temps suivants, la scène du phare en attente et l'affiche passent après le retour, comme dans les `beats` ci-dessus.
- [ ] **Étape 4 :** `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs` et `npm test`. Résultat attendu : tout est vert.
- [ ] **Étape 5 : commit.** `git commit -m "Intros : le phare des Baleines, la glace, et le retour sur un pont sans fin" -- <les fichiers de la tâche>`

### Tâche 6 : La Rochelle, la côte, et l'Île de Ré en entier

**Fichiers :**
- Créer : `js/aventures/scene/props-rochelle.js` (le Vieux-Port, la tour Saint-Nicolas, la tour de la Chaîne, les mâts, le quai) et `js/aventures/scene/props-cote.js` (la route au bord de la mer, la plage, le soleil)
- Modifier : `css/intros.css`, `ile-de-re.js`, `ile-de-re.stickers.js`, `tests/e2e/intros-ile-de-re.mjs`

**Interfaces :**
- Consomme : `person` (`turn` en carte, tâche 2), `marche`, `vehicle` (`drive`, `bounce`, `view`), `stage.sound(…, until)`.

- [ ] **Étape 1 : écrire les vérifications qui échouent** :
  - au milieu de chaque temps, sur chaque écran : « La Rochelle » : cycy, kevin ; « La côte » : c3. Plus la liste complète `CAST` des 9 temps après la carte, sur les 4 écrans et en 852 × 393 ;
  - **La Rochelle :** au milieu du retournement, le `scaleX` des boîtes de retournement est inférieur à 0,6 ; à la fin, il vaut ±1 ;
  - **point 4 :** entrer et sortir trois fois par le retour du navigateur, à `?demo&t=` 5, 15 et 27 ;
  - **point 5 (La Rochelle) :** en 1920 × 1080, à 26,5 et 28,5 s, chaque couche visible couvre toute la largeur.
- [ ] **Étape 2 :** `node tests/e2e/intros-ile-de-re.mjs`. Résultat attendu : ÉCHEC.
- [ ] **Étape 3 : implémenter les temps 8 et 9 de la spec.**
  - **La Rochelle (25,5 → 29 s) :**
    - la lumière du matin, le Vieux-Port, ses deux tours à l'entrée, les mâts des voiliers et le quai ;
    - vous deux de dos (`person`, `side: "dos"`, « joie ») avec `marche`, puis vous vous retournez en carte (`turn`), de face, en « joie » ;
    - les mouettes (`gulls`) ;
  - **La côte (29 → 31,1 s) :**
    - la C3 (« roule ») longe la mer sur la route, avec la plage, le soleil et des vaguelettes ;
    - `engine` s'arrête à 31,1 s (`until`) ;
  - **À 31,1 s,** retour de jour sur le phare pour l'affiche (tâche 3).
- [ ] **Étape 4 : les vérifications.**
  - `node tests/e2e/intros-ile-de-re.mjs`, `node tests/e2e/intros.mjs`, `node tests/e2e/intros-canoe.mjs`, `node tests/e2e/aventures.mjs`, `node tests/e2e/hub.mjs` et `npm test` ;
  - résultat attendu : tout est vert ;
  - `data-length` reste entre 32500 et 34500 ms.
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
