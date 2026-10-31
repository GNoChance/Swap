# L'intro du Premier canoë : design

Validé par Kevin le 2026-10-31, morceau par morceau : le découpage, la durée, l'histoire, le canoë et les ronds dans l'eau, la carte, le décor, la technique, puis ses nouvelles planches. Ce document suit la spec de la tranche 3a (`docs/specs/2026-10-30-intros-3a-design.md`) et réutilise sa boîte à outils. Là où il décide autrement, c'est lui qui fait foi.

## 0. Vue d'ensemble
- **Une tranche par sortie.** Ce document remplace le découpage 3b et 3c de la spec 3a.
  - Les intros se font désormais une sortie à la fois, dans l'ordre du passeport.
  - Chaque recette arrive avec la première sortie qui en a besoin : ici le canoë, le bus et la carte en deux étapes.
  - Chaque sortie passe en ligne quand elle est finie.
- **La deuxième sortie** est le Premier canoë · Dordogne, le 11 août 2025.
- **La journée vraie**, d'après Kevin et ses photos (`planches/voyages/canoe/photos/`, hors git) :
  - **l'aller :** la C3 de Bordeaux jusqu'au parking de Port d'Enveaux ;
  - **le bus :** il les monte à Carsac, puis ils redescendent la Dordogne en canoë jusqu'à la voiture, 28 km (sans aucun travaux sur la rivière, contrairement au plan du loueur) ;
  - **dans le canoë :** Cycy était devant et Kevin derrière ;
  - **l'anecdote :** au départ, le canoë tournait en rond, parce que Kevin ne savait pas encore pagayer ;
  - **le midi :** ils ont déjeuné dans un coin perdu, à mi-route ;
  - **le plouf :** à un moment, Kevin a sauté à l'eau pour pousser le canoë, pour faire rire la galerie ;
  - **le soir :** ils sont allés à Sarlat (la rue aux guirlandes de fleurs, le chevalier), puis à La Roque-Gageac de nuit, avant de rentrer.
- **Les décisions de Kevin :**
  - **la durée :** environ 30 s. Il veut les prochaines intros « un peu plus longues » que les 18 s du bivouac. L'intro dure entre 30 et 32 s, et la première fois elle se regarde en entier ;
  - **l'histoire :** 10 temps (§ 2), avec « la galerie » (un autre canoë qui rigole) et « La Dordogne » sur l'affiche ;
  - **les transports :** la sortie passe de « C3, canoë » à « C3, bus, canoë » ;
  - **ses nouvelles planches** sont la matière de l'intro : le canoë à deux, les gilets de sauvetage, les repas et le chevalier ;
  - **les ronds dans l'eau :** le sticker du canoë à deux pivote sur lui-même, et des bulles montrent leurs têtes (§ 2, temps 3).
- **Ce qui ne change pas :**
  - l'intro du bivouac et l'écran de l'intro (spec 3a, § 3), avec ses règles de passage, de fin, de chargement et de provisoires ;
  - le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - les 13 autres sorties gardent l'intro provisoire.

## 1. Ce que contient la tranche
- **La découpe des planches de la sortie** et de la C3, soit 121 stickers (§ 3).
- **Le scénario du Premier canoë** (`js/aventures/intros/canoe.js`), en 10 temps, d'environ 31 s.
- **Ce que la boîte à outils gagne** (§ 4) :
  - la carte en deux étapes ;
  - les recettes de l'eau ;
  - les bulles ;
  - les accessoires de la Dordogne, de Sarlat et de La Roque-Gageac ;
  - les nouveaux sons.
- **Les données du canoë** : transports, lieu, trajet (§ 5).
- **La page `?test`** et les vérifications (§ 7 et § 8).

## 2. Le scénario (environ 31 s)
Les temps sont indicatifs. Le canoë file de gauche à droite.

1. **La carte (0 → 5,0 s).**
   - **Le décor :** la carte du Sud-Ouest en papier découpé de la tranche 3a, prolongée vers l'est. On y voit :
     - Bordeaux et la Gironde ;
     - la Dordogne qui serpente de Libourne à Bergerac, puis vers Sarlat ;
     - des rangs de vigne autour de Saint-Émilion ;
     - les bois ronds du Périgord.
   - **La C3** (vue « roule ») part de Bordeaux. Le pointillé se dessine derrière elle le long de la Dordogne, par Libourne et Bergerac, jusqu'au **P** de Port d'Enveaux. On entend le moteur.
   - **Le zoom :** la caméra plonge et la carte devient **la carte illustrée de la vallée**, dans l'esprit du plan du loueur, en papier découpé.
     - La rivière fait ses méandres d'ouest en est : Port d'Enveaux, les Milandes, Beynac face à Castelnaud, Marqueyssac, La Roque-Gageac, Domme sur sa falaise, Vitrac, Montfort, Carsac.
     - Les châteaux sont en petit.
     - Sarlat est en haut, au nord.
     - Il n'y a aucun panneau de travaux.
   - **Le bus :** un petit bus en papier klaxonne (« pouet ») et remonte la route le long de la rivière, de Port d'Enveaux à Carsac, avec son pointillé. L'épingle de Carsac fait « plop ».
2. **La mise à l'eau (5,0 → 7,0 s).**
   - La caméra plonge vers une plage de galets, avec un panneau en bois « Carsac · 28 km ».
   - On voit Cycy et Kevin debout avec leurs pagaies, puis Kevin qui aide Cycy à monter dans le canoë.
3. **Les ronds dans l'eau (7,0 → 11,0 s).** L'anecdote.
   - Le canoë à deux (vue de face) part, puis se met à tourner sur lui-même. Il rétrécit comme une carte qu'on retourne, passe de dos, puis de face, et fait deux tours et demi.
   - Des remous en spirale tournent autour, et une petite spirale de tournis flotte au-dessus. On entend un « whoosh » à chaque tour.
   - Le canoë s'arrête et **deux bulles** sortent au-dessus de lui, avec leurs têtes en gilet de sauvetage :
     - Cycy, devant, fait « ? », puis la colère ;
     - Kevin, derrière, est en larmes.
   - Les bulles s'en vont. Au troisième tour, le canoë repart droit, dans des gouttes de pagaie (« plic »).
4. **La descente (11,0 → 15,0 s).** Le moment « c'était beauuu ».
   - Le canoë, de dos, s'éloigne sur la rivière, et le décor glisse vers lui, comme la montée du bivouac.
   - Les arbres des rives penchent au premier plan et passent sur les côtés. Au fond, les falaises claires sont coiffées de vert, avec Montfort sur son rocher.
   - Le pont de Vitrac et ses arches de pierre s'approchent, et le canoë passe dessous. Domme est tout en haut de sa falaise.
5. **Le coin perdu (15,0 → 18,0 s).**
   - Une petite rive de graviers au milieu de nulle part, et une table en bois sous un arbre. On entend un tintement de verres.
   - Cycy et Kevin sont côte à côte à la table à nappe vichy, avec les stickers de leurs planches « qui mange ».
   - L'un après l'autre, en même temps chez les deux : le croc dans le burger, une frite, l'assiette vide avec les pouces levés, puis la main sur le ventre.
6. **Le plouf (18,0 → 21,2 s).**
   - La lumière devient dorée, et Castelnaud et Beynac se font face, chacun sur sa rive.
   - Le canoë, devant la falaise, avance doucement.
   - Kevin, en gilet et en pose « surprise », saute du canoë en arc de cercle. Pendant le saut, le canoë ne montre plus que Cycy.
   - Il tombe dans l'eau : grosse gerbe de papier et « plouf ».
   - Puis vient la scène de l'éclaboussure, Kevin dans l'eau et Cycy morte de rire, qui dérive doucement.
   - Derrière passe **la galerie** : un autre canoë, d'une autre couleur, avec deux silhouettes de papier qui se tordent de rire.
7. **L'arrivée (21,2 → 23,2 s).**
   - L'herbe et le parking de Port d'Enveaux, avec un panneau « 28 km ! ».
   - Cycy et Kevin lèvent les pouces devant le canoë posé sur les galets. La C3 les attend avec ses cœurs.
   - Puis la C3 (« roule ») repart vers la droite, moteur.
8. **Sarlat (23,2 → 26,2 s).**
   - La lumière du soir. La caméra glisse seule dans la rue, entre les façades en pierre blonde avec leurs balcons, sous les guirlandes de fleurs en papier tendues d'un côté à l'autre. Les lanternes s'allument.
   - Elle arrive sur **le chevalier** : le sticker de Kevin, où Cycy et Kevin, en gilet, le regardent, et Kevin a des étoiles dans les yeux.
   - Des étincelles en papier scintillent autour, avec un « ting », et la lanterne brille.
   - La rue est vide pour qu'on ne les voie pas changer de tenue : le chevalier les montre en gilet.
9. **La Roque-Gageac (26,2 → 28,6 s).**
   - La nuit, avec le bleu nuit et les étoiles de la tranche 3a.
   - La falaise, avec ses maisons éclairées en bas, et les reflets des lumières qui tremblent sur l'eau.
   - La gabare amarrée, avec son mât, son auvent et « Norbert » sur la coque.
   - Cycy et Kevin, de dos, sur le quai, dans leurs tenues du soir comme sur la photo. Cycy a la main dans les cheveux.
   - On entend les grillons.
10. **L'affiche (28,6 → environ 31 s).**
    - On revient de jour sur la rivière, avec Beynac sur sa falaise et le canoë.
    - Puis vient la recette de l'affiche de la tranche 3a : le cadre crème, le passage en aplats, **LA DORDOGNE** lettre par lettre, puis « Premier canoë · Dordogne · 11 août 2025 ».
    - L'affiche reste un instant, puis `onDone()`.

Les stickers exacts de chaque temps se choisissent sur les planches de contrôle de l'outil (§ 3).

## 3. Les stickers
- **Les planches** du dossier `planches/voyages/canoe/` (hors git), plus la C3 :

| Planche | Stickers | Découpe | Noms (`assets/aventures/…`) |
|---|---|---|---|
| Cycy de face, Cycy de dos, Kevin de face, Kevin de dos | 4 × 12 | standard | `canoe/<qui>-<face\|dos>-<pose>.webp` |
| Cycy en gilet de sauvetage, Kevin en gilet de sauvetage | 2 × 12 | scène | `canoe/scene-<qui>-en-gilet-de-sauvetage-NN.webp` |
| Cycy qui mange, Kevin qui mange | 2 × 12 | scène | `canoe/scene-<qui>-qui-mange-NN.webp` |
| Cycy et Kevin en canoë | 12 | scène | `canoe/scene-cycy-et-kevin-en-canoe-NN.webp` |
| Sarlat le chevalier | 1 | scène | `canoe/scene-sarlat-le-chevalier-01.webp` |
| C3 (`vehicules/`) | 12 | standard | `vehicules/c3-<vue>.webp` |

Ça fait 121 stickers, environ 6 Mo dans le dépôt : les 61 scènes à 600 px pèsent plus lourd.

- **L'ordre attendu** des scènes à deux, en lecture ligne par ligne :
  - 01 le selfie, 02 le canoë qui pagaie (de face), 03 debout dans l'eau en riant, 04 l'éclaboussure ;
  - 05 le canoë de dos sur la rivière, 06 assis sur les galets, 07 Kevin aide Cycy à monter, 08 les pouces levés devant le canoë ;
  - 09 le bisou sur les galets, 10 debout avec les pagaies, 11 le canoë devant la falaise, 12 le coucou depuis le canoë.

  Les planches de contrôle le confirment avant que le scénario ne les cite.
- **Les planches en gilet** suivent les 12 poses habituelles pour les 9 premières. Ensuite viennent, dans l'ordre : en kayak qui pagaie, les pouces levés, en kayak de dos.
- **L'outil de découpe :**
  - les scènes sortent à **600 px** de large au lieu de 300, pour rester nettes quand elles occupent une bonne partie de l'écran ;
  - pour le reste, l'outil ne change pas. Il se lance une fois sur le dossier (les 4 planches standard), une fois avec `--scene` sur chacune des 6 autres planches, et une fois sur la C3.
- **Les provisoires.** Chaque sticker de scène a un provisoire, comme les autres stickers (spec du portail, § 7) : le sticker du site de la personne principale, dans la pose la plus proche.
  - Pour les scènes à deux, c'est Cycy en « joie ».
  - Pour le chevalier, c'est Kevin en « surprise ».
- **Ce que l'intro charge :** seulement les stickers cités par le scénario, environ 25.

## 4. La boîte à outils
- **La carte en deux étapes :**
  - `carte` garde son trajet, et l'arrivée peut porter son propre nom (`trajet.arrivee`). Sinon, c'est le `lieu`, comme pour le bivouac ;
  - une nouvelle recette, `relais`, enchaîne après l'épingle. Elle fait la plongée de la caméra, le passage à la carte illustrée de la vallée, le deuxième véhicule en papier sur son chemin avec son pointillé, et l'épingle d'arrivée ;
  - la carte de la vallée est dessinée, pas projetée. Les places y sont dans le bon ordre, pas aux vraies coordonnées.
- **Les recettes de l'eau** (`js/aventures/scene/recipes-eau.js`) :
  - `flotte` : un acteur sur l'eau qui tangue doucement (rotation et hauteur), avec des gouttes de pagaie et des « plic » ;
  - `tourne` : l'acteur pivote comme une carte qu'on retourne. Il rétrécit, change de vue (face ↔ dos), puis se rallonge dans l'autre sens, avec des remous en spirale et un tournis au-dessus ;
  - `rame` : la descente, comme `marche`, mais sur l'eau : le décor glisse vers l'acteur vu de dos, les rives passent sur les côtés, et on entend des « plic » au lieu des pas ;
  - `plouf` : un acteur saute en arc dans l'eau, sous une gerbe de papier.
- **Les bulles** (`actors.js`) : un disque de papier avec un liseré blanc, une ombre douce et une petite queue vers le canoë. Le sticker d'une personne y est recadré sur la tête et les épaules. Une bulle sort en rebondissant (« pop »), change de visage, puis s'en va.
- **Un acteur à plusieurs vues :** le canoë à deux change de sticker comme un véhicule change de vue (face, dos, devant la falaise, Cycy seule).
- **Les accessoires en papier**, en unités de scène, dans de nouveaux fichiers `props-*.js` :
  - **la carte :** la Dordogne et la Garonne, les vignes, les bois du Périgord, la carte illustrée de la vallée (méandres, falaises, petits châteaux) et le bus ;
  - **la rivière :**
    - l'eau en bandes avec ses reflets, les remous et la gerbe ;
    - les arbres qui penchent, les falaises boisées, la plage de galets, la rive de graviers, l'herbe et le parking ;
    - les châteaux : Montfort, Castelnaud, Beynac et son village ;
    - Domme et ses remparts, et le pont de Vitrac ;
    - les panneaux en bois, la table sous l'arbre et le canoë de la galerie ;
  - **Sarlat :** les façades, les balcons et les volets, les pavés, les guirlandes de fleurs, les lanternes et les étincelles ;
  - **La Roque-Gageac :** la falaise et ses maisons éclairées, la gabare, les reflets des lumières et le quai.
- **Chaque couche a sa version affiche,** comme dans la tranche 3a.
- **Les règles de la tranche 3a s'appliquent telles quelles** (§ 4, Les règles et La fluidité). En particulier, les reflets qui tremblent sont sur leur propre couche, dont on n'anime que l'opacité.
- **Les sons**, en WebAudio, sans fichier :
  - nouveaux :
    - `paddle` : le « plic » de la pagaie ;
    - `splash` : le plouf ;
    - `horn` : le klaxon du bus ;
    - `clink` : les verres ;
    - `twinkle` : le « ting » des étincelles ;
  - réutilisés : `engine`, `pop`, `whoosh`, `paper`, `crickets`, `letter` et `step`.

## 5. Les données (`js/aventures/data.js`)
- **Le canoë :**
  - `transports: ["c3", "bus", "canoe"]` ;
  - `lieu: "La Dordogne"` ;
  - `trajet` :
    - `depart: "Bordeaux"` ;
    - `etapes: ["Bergerac"]`, écrite à son point ;
    - `arrivee: "Port d'Enveaux"` ;
    - `points` : les points `[lat, lon]` de Bordeaux [44.837, -0.579], Libourne [44.915, -0.244], Castillon-la-Bataille [44.854, -0.042], Sainte-Foy-la-Grande [44.838, 0.220], Bergerac [44.853, 0.483], Lalinde [44.838, 0.742], Le Buisson-de-Cadouin [44.822, 0.910], Siorac-en-Périgord [44.822, 0.983], Saint-Cyprien [44.869, 1.042] et Port d'Enveaux [44.836, 1.110] ;
    - `relais` : `{ transport: "bus", arrivee: "Carsac", noms: ["Beynac", "Castelnaud", "La Roque-Gageac", "Domme", "Sarlat"] }`. Ce sont les noms écrits sur la carte de la vallée.
- `arrivee` et `relais` sont facultatifs. Le bivouac ne change pas.
- **Aucun id ne change.**

## 6. Les formats d'écran
- **Ce sont ceux de la tranche 3a** (§ 6) : la scène de 390 × 760 unités, le portrait et le PC, le téléphone en paysage cadré sur la bande d'action, la rotation sans arrêter la timeline.
- **Dans chaque temps,** le canoë, les personnes, les bulles, le chevalier, la C3, le bus et le lettrage restent dans la zone sûre.
- **Le décor** déborde assez sur les côtés pour l'écran le plus large prévu et les déplacements de caméra.

## 7. Les adresses de test
- `?demo#/aventures/canoe` : la nouvelle intro.
- `?demo&t=<secondes>#/aventures/canoe` démarre à ce moment, comme pour le bivouac.
- **La page `?test`, section « Les intros » :**
  - le canoë est marqué « nouvelle », avec 10 liens vers chacun des temps du § 2 ;
  - le bivouac garde les siens.

## 8. Les vérifications
- **Tests unitaires (Node) :**
  - les données : `bus` dans les transports du canoë, et un `relais` valide (transport connu, arrivée et noms écrits) ;
  - chaque sticker cité par le scénario du canoë existe dans `assets/aventures/` ;
  - l'outil de découpe : une scène sort à 600 px de large, une planche standard toujours à 300.
- **De bout en bout, en Chrome automatisé**, sur les mêmes écrans que le bivouac (paysage compris) :
  - l'intro du canoë joue jusqu'au bout, entre 30 et 32 s ;
  - seuls ses stickers sont chargés, et aucun d'une autre sortie ;
  - un sticker de scène bloqué est remplacé par son provisoire, et l'intro se termine quand même ;
  - la première fois, un toucher ne la passe pas ; une fois la sortie tamponnée, « Passer ▸ » et un toucher la terminent ;
  - le retour du navigateur au milieu : pas d'erreur, et la sortie n'est pas marquée vue ;
  - l'affiche dit « LA DORDOGNE » et « Premier canoë · Dordogne · 11 août 2025 » ;
  - à chaque temps (avec `?t=`), ce qui compte est entièrement dans l'écran ;
  - sur la carte, la C3, Bordeaux, le **P**, le bus et l'épingle de Carsac sont dans l'écran quand ils comptent ;
  - aucune erreur dans la console ;
  - les vérifications du bivouac passent telles quelles.
- **Les tests qui prenaient le canoë** comme exemple de sortie à intro provisoire (le passeport, le tampon) passent sur l'**Île de Ré**. Ce qu'ils vérifient ne change pas.
- **À l'œil :** les captures de chaque temps sur chaque écran, dans la galerie, montrées à Kevin.
- **Ensuite :** une relecture indépendante, l'essai sur l'iPhone, puis `main` seulement avec l'OK explicite de Kevin.

## 9. Risques et parades
- **La fluidité sous Safari.** Il y a 10 décors et plus de couches que pour le bivouac.
  - Chaque décor n'est affiché que pendant son temps.
  - Si ça saccade, on applique la parade de la tranche 3a : chaque couche transformée en image au chargement, puis seulement déplacée.
- **Le poids.** Environ 25 stickers, dont des scènes à 600 px, soit à peu près 1,5 Mo à charger.
  - Le passeport précharge déjà la sortie suivante une fois le livre posé. Après le bivouac, c'est le canoë.
  - Au-delà de 4 s, les provisoires prennent le relais.
- **Les scènes peintes sur le papier.** Les scènes à deux ont leur propre bout de rivière ou de galets peint autour d'elles. On les pose pour que leur eau ou leurs galets rejoignent ceux du décor. Elles restent des stickers collés dans le livre animé, avec leur contour blanc.
- **Des stickers collés** sur les planches (éclaboussures, pagaies) pourraient former une seule île. L'outil s'arrête au lieu de deviner, et on règle la planche à la main.
- **31 s à regarder la première fois.** C'est le choix de Kevin, et la durée se règle dans le scénario.

## 10. Hors de cette tranche
- **Les sorties suivantes**, dans l'ordre du passeport : l'Île de Ré (vélo), Marquèze (train), etc. Chacune a sa spec courte.
- **Les points de goût restés de la tranche 3a :** le soleil du bivouac, le bouton du son sur l'affiche, une vache sous « Passer ».
- **Les photos de la sortie** dans la page de l'aventure.
