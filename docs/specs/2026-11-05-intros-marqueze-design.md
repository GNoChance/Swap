# L'intro de Marquèze : design

Validé par Kevin le 2026-11-05 : la journée, l'histoire en 10 temps (« parfait ! ») et la technique (« tout me va »). Ce document suit la spec de l'Île de Ré (`docs/specs/2026-11-01-intros-ile-de-re-design.md`), celle du Premier canoë (`docs/specs/2026-10-31-intros-canoe-design.md`) et celle de la tranche 3a (`docs/specs/2026-10-30-intros-3a-design.md`). Il réutilise leur boîte à outils, et leurs règles s'appliquent là où il ne dit pas autre chose.

## 0. Vue d'ensemble
- **La quatrième sortie du passeport :** Marquèze, le 22 août 2025, en C3 puis en train. Une tranche par sortie, comme le canoë et l'Île de Ré.
- **La journée vraie, d'après Kevin :**
  - **l'arrivée :** la C3 jusqu'à la gare de Sabres, en fin de matinée, puis le petit train jusqu'au village de l'écomusée (l'airial) ;
  - **là-bas :** le pique-nique au village, après le train, puis la visite des vieilles maisons, et les cochons noirs ;
  - **le retour :** le train jusqu'à Sabres ;
  - **avant de rentrer à l'appart :** la plage de Biscarrosse, pour le coucher de soleil sur l'océan.
  - **Le clin d'œil, c'est le petit train.**
- **Les décisions de Kevin :**
  - environ 36 s : l'intro dure entre 35 et 37 s, et la première fois elle se regarde en entier ;
  - l'histoire du § 2 ;
  - la carte ne montre que l'aller à Sabres, et Biscarrosse se raconte en scène de route.
- **Ce qui ne change pas :**
  - les intros du bivouac, du canoë et de l'Île de Ré ;
  - l'écran de l'intro, le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ;
  - les 11 autres sorties gardent l'intro provisoire.

## 1. Ce que contient la tranche
- **La découpe** des 6 planches de la sortie : 72 stickers (§ 3). La C3 est déjà découpée.
- **Le scénario** `js/aventures/intros/marqueze.js`, en 10 temps, d'environ 36 s.
- **Ce que la boîte à outils gagne** (§ 4) :
  - la recette du train ;
  - la carte rapprochée sur les Landes ;
  - les décors de la forêt, de l'airial et de Biscarrosse ;
  - les cochons noirs ;
  - trois sons.
- **Les données de Marquèze :** le lieu et le trajet (§ 5).
- **La page `?test`** et les vérifications (§ 7).

## 2. Le scénario (environ 36 s)
Les temps sont indicatifs. *dans NN* et *devant NN* renvoient aux stickers des deux planches de scène (§ 3).

1. **La carte (0 → 4,5 s).**
   - La carte du Sud-Ouest en papier, cette fois vers le sud et rapprochée sur les Landes : la forêt de pins, le bassin d'Arcachon et l'océan.
   - La C3 (vue « roule ») part de Bordeaux. Son pointillé descend par l'autoroute des Landes jusqu'à la gare de Sabres.
   - La C3 reste visible tout le long de la carte.
   - L'épingle « Marquèze » se pose à Sabres.
2. **La gare de Sabres (4,5 → 7,5 s).**
   - La caméra plonge de l'épingle vers le quai de la gare de Sabres : le quai, son panneau « Sabres » et les pins.
   - Le wagon vert attend, avec un coup de sifflet. On ne le dessine pas : il est dans les stickers.
   - Vous deux devant, main dans la main (*devant 01*), puis vous montez le marchepied (*devant 05*).
3. **Le petit train, le clin d'œil (7,5 → 13,5 s).**
   - **Dehors :**
     - le wagon, vu de trois quarts, roule dans la forêt de pins avec le tac-tac des rails ;
     - le décor défile de côté, en plusieurs profondeurs : les pins et leurs pots de résine, les fougères, le sable ;
     - vous êtes aux fenêtres, accoudés (*dans 02*), puis vous faites coucou (*dans 03*).
   - **Dedans :** sur la banquette en bois, avec le dépliant (*dans 06*), puis secoués dans un virage (*dans 09*).
4. **Le pique-nique (13,5 → 17 s).** À l'airial, sous les grands chênes, vous deux sur le banc (*devant 10*), à côté d'un panier et des sandwichs en papier.
5. **Le village (17 → 21,5 s).**
   - Le décor : les maisons landaises à colombages, le poulailler perché et les moutons.
   - Vous marchez de dos dans l'airial (la marche du bivouac). Puis vous vous retournez, comme une carte, de face avec le dépliant (la pose « thème »).
6. **Les cochons noirs (21,5 → 24,5 s).**
   - Les cochons noirs fouinent dans leur enclos en bois, avec des « groin groin ».
   - Vous deux de face, d'abord intrigués (« question »), puis en « joie ».
   - On ne prend pas la pose « surprise » : elle porte un petit train vert, qui n'a rien à faire devant les cochons.
7. **Le train du retour (24,5 → 27,5 s).** Dedans, la forêt défile derrière les fenêtres, et vous vous êtes endormis sur la banquette (*dans 05*).
8. **La route de Biscarrosse (27,5 → 29,5 s).** La C3 (« roule ») file à travers les pins, et passe un panneau « Biscarrosse-Plage ».
9. **Le coucher de soleil (29,5 → 33,5 s).**
   - La dune, l'océan et ses vagues, et le soleil qui descend vers l'horizon. La lumière dorée vit sur sa propre couche de ciel, comme au plouf du canoë.
   - Vous deux de dos, sur le sable, face au soleil.
10. **L'affiche (33,5 → environ 36 s).**
    - Le retour sur le wagon vert, avec vous deux pouces levés (*devant 12*).
    - Puis la recette de l'affiche : **MARQUÈZE**, et « Marquèze · 22 août 2025 ».

Les stickers exacts se confirment sur les planches de contrôle (§ 3).

## 3. Les stickers
- **Les planches** du dossier `planches/voyages/marqueze/` (hors git) :

| Planche | Stickers | Découpe | Noms (`assets/aventures/…`) |
|---|---|---|---|
| Cycy de face, Cycy de dos, Kevin de face, Kevin de dos | 4 × 12 | standard | `marqueze/<qui>-<face\|dos>-<pose>.webp` |
| Cycy et Kevin dans le train | 12 | scène (`--scene --count 12` si des stickers se touchent) | `marqueze/scene-cycy-et-kevin-dans-le-train-NN.webp` |
| Cycy et Kevin devant le train | 12 | scène (idem) | `marqueze/scene-cycy-et-kevin-devant-le-train-NN.webp` |

- **L'ordre attendu, ligne par ligne.** La planche de contrôle le confirme.
  - **Dans le train :**
    - 01 sur la banquette en riant, 02 accoudés à la fenêtre, 03 coucou à la fenêtre, 04 étonnés à la fenêtre ;
    - 05 endormis sur la banquette, 06 avec le dépliant, 07 bisous soufflés à la fenêtre, 08 le V à la fenêtre ;
    - 09 secoués sur la banquette, 10 le selfie, 11 la tête sur l'épaule, 12 grands coucous à la fenêtre.
  - **Devant le train :**
    - 01 main dans la main, 02 de dos à montrer le wagon, 03 le V, 04 Cycy qui montre du doigt ;
    - 05 en montant le marchepied, 06 coucou sur la plateforme arrière, 07 avec le dépliant, 08 le selfie ;
    - 09 le câlin, 10 sur le banc, 11 assis dans l'herbe, de dos, 12 pouces levés.
- **Ce que l'intro charge :** seulement les stickers cités par son scénario, 18 :
  - la C3 : `vehicules/c3-roule` ;
  - « devant le train » : 01, 05, 10 et 12 ;
  - « dans le train » : 02, 03, 05, 06 et 09 ;
  - Cycy et Kevin de dos en « joie », de face en « thème », en « question » et en « joie ».
- Le passeport les précharge déjà quand Marquèze est la sortie suivante.
- **Les remplaçants** suivent les règles du canoë : pour les scènes à deux, Cycy de face en « joie ».
- **À savoir :** sur « devant le train », Kevin a les cheveux plus bouclés et des lunettes claires. Kevin le sait et l'accepte.

## 4. La boîte à outils
- **La recette du train** (dans un nouveau fichier `js/aventures/scene/recipes-train.js`) :
  - **dehors :**
    - un sticker du wagon reste au centre, posé sur des rails en papier ;
    - il prend un petit cahot à chaque joint de rail, et le tac-tac des rails l'accompagne ;
    - le décor défile de côté, chaque couche à la vitesse de sa profondeur : c'est `defile` de `recipes-velo.js`, réutilisé et pas recopié ;
    - le sens du défilement suit le wagon de la planche : sa plateforme d'about est à l'arrière, sur la droite. Le wagon roule donc vers la gauche, et le décor défile vers la droite ;
  - **dedans :**
    - une paroi en bois, en papier, percée de fenêtres où la forêt défile ;
    - le sticker de la banquette devant, avec une secousse pour le virage ;
  - tout tient sous `?demo&t=`.
- **La carte rapprochée sur les Landes :**
  - celle du Sud-Ouest, avec plus d'unités par degré que les autres : le trajet Bordeaux → Sabres est court (environ 0,7° de latitude), et il doit remplir la carte ;
  - elle réutilise la terre, l'océan, le bassin d'Arcachon et les pins des Landes (`props-carte.js`) ;
  - les noms sont placés pour un trajet qui descend, comme pour le bivouac ;
  - les cartes du bivouac, du canoë et de l'Île de Ré ne bougent pas.
- **Les décors, en papier, un fichier par famille :**
  - **la forêt :** les pins des Landes et leurs pots de résine, les fougères, le sable, les rails, et la gare de Sabres avec son quai et son panneau ;
  - **le wagon :** sa paroi en bois et ses fenêtres ;
  - **l'airial :** les grands chênes, l'herbe, le panier et les sandwichs du pique-nique, les maisons landaises à colombages, le poulailler perché, les moutons et l'enclos en bois ;
  - **Biscarrosse :** la route dans les pins, le panneau « Biscarrosse-Plage », la dune, l'océan au coucher du soleil.
  - Ils réutilisent ce qui existe : `pine`, `forest`, `roundTrees`, `house`, `panneau`, la mer, la plage, les vaguelettes, le soleil et la dune de l'Île de Ré, le ciel doré.
- **Les cochons noirs :** un nouvel animal en papier dans `props-animaux.js`, à côté de la vache, du chien et de l'escargot.
- **Le retournement** de dos à face est la carte retournée de `person.turn`, corrigée par l'Île de Ré.
- **Les sons**, en WebAudio, sans fichier :
  - nouveaux : `whistle`, le coup de sifflet du train ; `rails`, le tac-tac des rails ; `oink`, le groin des cochons ;
  - réutilisés : `engine`, `pop`, `step`, `paper`, `letter`, `whoosh`, `gulls` ;
  - les noms se vérifient dans `js/audio.js` avant d'être pris.
- **Les leçons du canoë et de l'Île de Ré,** à appliquer dès la première version :
  - aucun texte ni sticker coupé par le bord de l'écran ;
  - un décor lointain n'est jamais dessiné devant un décor proche ;
  - deux personnes côte à côte sont à la même échelle ;
  - une lumière qui change vit sur sa propre couche ;
  - toutes les répétitions sont finies ;
  - le décor couvre 800 unités de chaque côté, ciels compris, déplacements de la caméra compris, pour un navigateur agrandi sur un écran 1080p ;
  - pas de logique recopiée : les aides existantes sont partagées, pas copiées.

## 5. Les données (`js/aventures/data.js`)
- **Marquèze :**
  - `lieu: "Marquèze"` ;
  - `trajet` :
    - `depart: "Bordeaux"` ;
    - `etapes: []` : le trajet est court, aucun nom au milieu ;
    - `points` : les vrais points de la route, [lat, lon], de Bordeaux [44.837, -0.579] par l'A63 (Le Barp, Belin-Béliet, Liposthey) jusqu'à Labouheyre, puis la D626 jusqu'à la gare de Sabres [44.148, -0.744]. Le plan les vérifie.
- L'épingle porte le `lieu`, « Marquèze ». Il n'y a ni `arrivee` ni `relais` : le train et Biscarrosse se racontent dans les scènes, pas sur la carte.
- Les transports restent « C3, train ».
- **Aucun id ne change.**

## 6. Les formats d'écran
- **Ce sont ceux de la tranche 3a :** le portrait, le PC, le téléphone en paysage cadré sur la bande d'action, et la rotation pendant l'intro.
- S'y ajoute le navigateur agrandi sur un écran 1080p (1920 × 1080 et 1920 × 947), vérifié depuis l'Île de Ré.
- À chaque temps, ce qui compte reste dans la zone sûre.

## 7. Les adresses de test et les vérifications
- **Les adresses :**
  - `?demo#/aventures/marqueze` ;
  - `?demo&t=<secondes>#/aventures/marqueze` ;
  - la page `?test` marque Marquèze « nouvelle », avec 10 liens, un par temps.
- **Tests unitaires :**
  - les données de Marquèze (lieu, trajet sans étape) ;
  - le trajet tient sur la carte ;
  - chaque sticker cité existe.
- **De bout en bout, en Chrome automatisé** (les mêmes écrans que l'Île de Ré, paysage et 1080p compris), une suite `tests/e2e/intros-marqueze.mjs` sur le kit `intro-kit.mjs` :
  - l'intro dure entre 35 et 37 s ;
  - dans le train, dehors comme dedans, le décor défile sans que son bord n'entre dans l'écran ;
  - seuls ses stickers sont chargés ;
  - un sticker de scène bloqué passe sur son remplaçant, et l'intro se termine ;
  - la règle de passage de la première fois, « Passer ▸ » en démo, et le retour du navigateur au milieu ;
  - l'affiche dit « MARQUÈZE » et « Marquèze · 22 août 2025 » ;
  - à chaque temps, ce qui compte est entièrement dans l'écran ;
  - sur la carte, la C3, « Bordeaux » et l'épingle « Marquèze » sont dans l'écran quand ils comptent, et aucun nom n'en chevauche un autre ;
  - après la carte, la C3 ne se montre qu'à « La route de Biscarrosse » ;
  - aucune erreur dans la console ;
  - entrer et sortir trois fois : la timeline de GSAP revient à son compte de départ ;
  - les suites du bivouac, du canoë, de l'Île de Ré, du passeport et du hub passent telles quelles.
- **Les tests qui prenaient Marquèze** comme exemple de sortie à intro provisoire (`tests/e2e/aventures.mjs`) passent sur le **Premier Airbnb**.
- **À l'œil :** les captures de chaque temps sur chaque écran, montrées à Kevin sur `http://localhost:5180`, puisque la galerie a été supprimée.
- **Ensuite :** une relecture indépendante, l'essai sur l'iPhone, puis `main` seulement avec l'OK de Kevin.

## 8. Risques et parades
- **La fluidité sous Safari :** c'est la même parade que pour le canoë et l'Île de Ré. Chaque décor n'est affiché que pendant son temps et, si ça saccade, chaque couche est transformée en image.
- **Le défilement dans le train** demande des couches larges, dehors et derrière les fenêtres. Elles restent dessinées une fois et ne font que glisser.
- **Le wagon de trois quarts sur un décor qui défile de côté :** le sens et la hauteur des rails se calent sur la planche de contrôle, pour que le wagon ait l'air de rouler et pas de glisser.
- **36 s à regarder la première fois :** c'est le choix de Kevin, comme pour le canoë et l'Île de Ré.

## 9. Hors de cette tranche
- Les sorties suivantes : le Premier Airbnb, etc.
- Les points de goût restés de l'Île de Ré, du canoë et du bivouac.
