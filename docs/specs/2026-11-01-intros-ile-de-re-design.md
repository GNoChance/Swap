# L'intro de l'Île de Ré : design

Validé par Kevin le 2026-11-01 : la journée, l'histoire en 10 temps, la technique, et pas de Fort Boyard. Corrigé avec Kevin le 2026-11-02 : « on a traversé le pont à vélo pas en voiture ». La C3 s'arrête au pied du pont, et « En selle » passe avant le pont. Ce document suit la spec du Premier canoë (`docs/specs/2026-10-31-intros-canoe-design.md`) et celle de la tranche 3a (`docs/specs/2026-10-30-intros-3a-design.md`). Il réutilise leur boîte à outils, et leurs règles s'appliquent là où il ne dit pas autre chose.

## 0. Vue d'ensemble
- **La troisième sortie du passeport :** l'Île de Ré, les 17 et 18 août 2025, en C3 puis à vélo. Une tranche par sortie, comme le canoë.
- **La journée vraie, d'après Kevin :**
  - **le premier jour :** la C3 jusqu'à La Rochelle, au pied du pont. Ils ont pris les vélos là, traversé le pont à vélo et fait toute l'île jusqu'au phare des Baleines. Ils ont mangé une glace, puis ils sont rentrés à vélo ;
  - **le soir :** ils ont dormi à La Rochelle ;
  - **le lendemain :** une balade sur le Vieux-Port de La Rochelle, puis le retour en longeant la côte, par Rochefort et Royan.
  - Il n'y a pas d'anecdote à part : le clin d'œil, c'est **le phare et la glace**.
- **Les décisions de Kevin :**
  - environ 30 s : l'intro dure entre 30 et 32 s, et la première fois elle se regarde en entier ;
  - l'histoire du § 2 ;
  - pas de Fort Boyard ;
  - le pont se traverse à vélo, jamais en C3.
- **Ce qui ne change pas :**
  - les intros du bivouac et du canoë, l'écran de l'intro, le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - les 12 autres sorties gardent l'intro provisoire.
  - Une seule exception, validée par Kevin à la relecture de cette spec (§ 4) : le retournement des personnes, bivouac compris.

## 1. Ce que contient la tranche
- **La découpe** des 5 planches de la sortie : 60 stickers (§ 3). La C3 est déjà découpée.
- **Le scénario** `js/aventures/intros/ile-de-re.js`, en 10 temps, d'environ 31 s.
- **Ce que la boîte à outils gagne** (§ 4) :
  - la recette vélo ;
  - la carte vers le nord avec les îles ;
  - les accessoires de l'île et de La Rochelle ;
  - deux sons.
- **Les données de l'Île de Ré :** le lieu et le trajet (§ 5).
- **La page `?test`** et les vérifications (§ 7).

## 2. Le scénario (environ 31 s)
Les temps sont indicatifs.

1. **La carte (0 → 4,5 s).**
   - La carte du Sud-Ouest en papier, cette fois vers le nord, avec l'Île de Ré, l'Île d'Oléron et l'anse de La Rochelle.
   - La C3 (vue « roule ») part de Bordeaux. Son pointillé remonte par Saintes et Rochefort jusqu'à La Rochelle, et s'arrête au pied du pont, côté La Rochelle (La Pallice).
   - L'épingle « Pont de l'Île de Ré » se pose là. Le pont et l'île restent dessinés sur la carte, mais le pointillé ne les traverse pas.
2. **En selle (4,5 → 6,5 s).**
   - La caméra plonge de l'épingle vers le pied du pont : un bout de terre côté La Rochelle, d'où la rampe du pont monte au-dessus de la mer.
   - Vous deux de face, sur vos vélos, avec un « dring » de sonnette.
   - Puis vous partez côte à côte vers la rampe.
3. **Le pont (6,5 → 9,5 s).**
   - Vu de côté, le grand pont courbe de l'île, en papier, au-dessus de la mer, avec sa bosse au milieu.
   - Des voiliers passent dessous et des mouettes volent, avec leur cri.
   - Vous le traversez à vélo de gauche à droite, en pédalant, suivis par la caméra.
   - La C3 n'est pas sur le pont : après la carte, on ne la revoit que sur la route du retour (temps 9).
4. **La traversée (9,5 → 15 s).**
   - Le décor défile de côté, en plusieurs profondeurs : les vignes, puis les marais salants et leurs tas de sel, puis les maisons blanches aux volets verts avec leurs roses trémières, puis le clocher noir et blanc d'Ars.
   - Vous filez à fond, avec des traits de vitesse (les deux stickers à fond), puis vous arrivez essoufflés sur le guidon.
   - Des panneaux en bois comptent les kilomètres jusqu'au phare.
5. **Le phare (15 → 18 s).**
   - Le phare des Baleines, sa grande tour de pierre et sa lanterne, avec la mer derrière.
   - Vous deux devant, bras en l'air.
   - On n'utilise pas le sticker « devant le phare » : il a son propre petit phare rouge et blanc, qui ferait doublon.
6. **La glace (18 → 20,5 s).** Au pied du phare, vous deux avec vos glaces.
7. **Le retour (20,5 → 23 s).**
   - Vous deux à vélo, de dos, sur la piste au bord de l'eau.
   - La lumière dorée du soir, sur sa propre couche de ciel, comme au plouf du canoë.
8. **La Rochelle (23 → 26,5 s).**
   - Le lendemain matin : le Vieux-Port, avec ses deux tours à l'entrée (Saint-Nicolas et la tour de la Chaîne) et les mâts des voiliers.
   - Vous marchez de dos sur le quai (la marche du bivouac), puis vous vous retournez, de face, en « joie ».
9. **La côte (26,5 → 28,6 s).** La C3 (« roule ») longe la mer sur la route du retour, avec la plage et le soleil.
10. **L'affiche (28,6 → environ 31 s).**
    - Le retour sur le phare et la mer, avec vous deux à vélo, côte à côte, devant.
    - Puis la recette de l'affiche : **ÎLE DE RÉ**, et « Île de Ré · 17–18 août 2025 ».

Les stickers exacts se choisissent sur les planches de contrôle (§ 3).

## 3. Les stickers
- **Les planches** du dossier `planches/voyages/ile-de-re/` (hors git) :

| Planche | Stickers | Découpe | Noms (`assets/aventures/…`) |
|---|---|---|---|
| Cycy de face, Cycy de dos, Kevin de face, Kevin de dos | 4 × 12 | standard | `ile-de-re/<qui>-<face\|dos>-<pose>.webp` |
| Cycy et Kevin à vélo | 12 | scène (`--scene --count 12` si des stickers se touchent) | `ile-de-re/scene-cycy-et-kevin-a-velo-NN.webp` |

- **L'ordre attendu** des scènes à vélo, en lecture ligne par ligne. La planche de contrôle le confirme.
  - 01 côte à côte (de trois quarts), 02 de face tous les deux, 03 de dos, 04 en riant ;
  - 05 Cycy à fond (traits de vitesse), 06 Kevin devant à fond, 07 le bisou, 08 essoufflés sur le guidon ;
  - 09 devant le phare, 10 en montrant un voilier, 11 les glaces, 12 les bras en l'air.
- **Les remplaçants** suivent les règles du canoë : pour les scènes à deux, Cycy de face en « joie ».
- **Ce que l'intro charge :** seulement les stickers cités par son scénario, une quinzaine, dont `vehicules/c3-roule`.
- Le passeport les précharge déjà quand l'Île de Ré est la sortie suivante.

## 4. La boîte à outils
- **La recette vélo** (`pedale`, dans un nouveau fichier `js/aventures/scene/recipes-velo.js`) :
  - un sticker de scène à vélo, avec un petit balancement de pédalage (la hauteur et une légère rotation) ;
  - des traits de vitesse quand il file ;
  - le décor qui défile de côté, chaque couche à la vitesse de sa profondeur ;
  - tout tient sous `?demo&t=`.
- **La carte vers le nord :**
  - les îles de Ré et d'Oléron, l'anse de La Rochelle et le pont, dessinés en papier, aux vraies coordonnées ;
  - les noms au bon endroit pour un trajet qui monte. La carte du bivouac et celle du canoë ne bougent pas.
- **Les accessoires, en papier, un fichier par famille :**
  - **le pont :** la mer, les voiliers, les mouettes, et son pied côté La Rochelle ;
  - **l'île :** les vignes, les marais salants, les maisons rétaises, le clocher d'Ars, les panneaux kilométriques, la piste cyclable et le phare des Baleines ;
  - **La Rochelle :** les deux tours, les mâts et le quai ;
  - **la côte :** la route, la plage et le soleil.
  - Ils réutilisent ce qui existe : `roundTrees`, `house`, `shingle`, la mer et les reflets du canoë, le ciel doré.
- **Le retournement des personnes (Kevin a dit oui) :** le retournement de dos à face devait écraser le sticker puis le faire revenir, comme une carte. À cause d'un défaut de la tranche 3a (`person.turn` reçoit la méthode au lieu de sa boîte), il change d'un coup. On le corrige dans `person.turn`, et le bivouac en profite aussi : ses retournements « En haut » et « La descente » deviennent des cartes retournées. Les suites du bivouac doivent rester vertes.
- **Les sons**, en WebAudio, sans fichier :
  - nouveaux : `bell`, le « dring » de la sonnette, et `gulls`, les cris des mouettes ;
  - réutilisés : `engine`, `pop`, `step`, `paper`, `letter`, `whoosh` ;
  - les noms se vérifient dans `js/audio.js` avant d'être pris.
- **Les leçons du canoë,** à appliquer dès la première version :
  - aucun texte ni sticker coupé par le bord de l'écran ;
  - un décor lointain n'est jamais dessiné devant un décor proche ;
  - deux personnes côte à côte sont à la même échelle ;
  - une lumière qui change vit sur sa propre couche ;
  - toutes les répétitions sont finies ;
  - pas de logique recopiée : les aides existantes sont partagées, pas copiées.

## 5. Les données (`js/aventures/data.js`)
- **L'Île de Ré :**
  - `lieu: "Île de Ré"` ;
  - `trajet` :
    - `depart: "Bordeaux"` ;
    - `etapes: ["Saintes", "La Rochelle"]`, chacune écrite à son point ;
    - `arrivee: "Pont de l'Île de Ré"`, le nom de l'épingle ;
    - `points` : Bordeaux [44.837, -0.579], Saint-André-de-Cubzac [45.000, -0.445], Pons [45.578, -0.548], Saintes [45.746, -0.633], Rochefort [45.937, -0.962], La Rochelle [46.160, -1.152] et la tête du pont à La Pallice [46.172, -1.236]. Le trajet de la C3 s'arrête là : Rivedoux n'en fait plus partie.
- Il n'y a pas de `relais` : le vélo se raconte dans les scènes, pas sur la carte.
- Les transports restent « C3, vélo ».
- **Aucun id ne change.**

## 6. Les formats d'écran
- **Ce sont ceux de la tranche 3a :** le portrait, le PC, le téléphone en paysage cadré sur la bande d'action, et la rotation pendant l'intro.
- À chaque temps, ce qui compte reste dans la zone sûre.

## 7. Les adresses de test et les vérifications
- **Les adresses :**
  - `?demo#/aventures/ile-de-re` ;
  - `?demo&t=<secondes>#/aventures/ile-de-re` ;
  - la page `?test` marque l'Île de Ré « nouvelle », avec 10 liens, un par temps.
- **Tests unitaires :**
  - les données de l'Île de Ré (lieu, trajet, étapes à leur point) ;
  - le trajet tient sur la carte ;
  - chaque sticker cité existe.
- **De bout en bout, en Chrome automatisé** (les mêmes écrans que le canoë, paysage compris), une suite `tests/e2e/intros-ile-de-re.mjs` sur le kit `intro-kit.mjs` :
  - l'intro dure entre 30 et 32 s ;
  - seuls ses stickers sont chargés ;
  - un sticker de scène bloqué passe sur son remplaçant, et l'intro se termine ;
  - la règle de passage de la première fois, « Passer ▸ » en démo, et le retour du navigateur au milieu ;
  - l'affiche dit « ÎLE DE RÉ » et « Île de Ré · 17–18 août 2025 » ;
  - à chaque temps, ce qui compte est entièrement dans l'écran ;
  - sur la carte, la C3, « Bordeaux », « Saintes », « La Rochelle » et l'épingle « Pont de l'Île de Ré » sont dans l'écran quand ils comptent, et aucun nom n'en chevauche un autre ;
  - après la carte, la C3 ne se montre qu'à « La côte » ;
  - aucune erreur dans la console ;
  - entrer et sortir trois fois : la timeline de GSAP revient à son compte de départ ;
  - les suites du bivouac, du canoë, du passeport et du hub passent telles quelles.
- **Les tests qui prenaient l'Île de Ré** comme exemple de sortie à intro provisoire passent sur **Marquèze**.
- **À l'œil :** les captures de chaque temps sur chaque écran, montrées à Kevin par un lien `localhost`, puisque la galerie a été supprimée.
- **Ensuite :** une relecture indépendante, l'essai sur l'iPhone, puis `main` seulement avec l'OK de Kevin.

## 8. Risques et parades
- **La fluidité sous Safari :** c'est la même parade que pour le canoë. Chaque décor n'est affiché que pendant son temps et, si ça saccade, chaque couche est transformée en image.
- **Le défilement de côté du décor** pendant la traversée demande des couches larges. Elles restent dessinées une fois et ne font que glisser.
- **31 s à regarder la première fois :** c'est le choix de Kevin, comme pour le canoë.

## 9. Hors de cette tranche
- Les sorties suivantes : Marquèze (train), etc.
- Les points de goût restés du canoë et du bivouac.
