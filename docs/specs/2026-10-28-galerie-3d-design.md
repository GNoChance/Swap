# Galerie des matchs en 3D : design

Validé par Kevin le 2026-10-28 (questions puis design dans la conversation). Remplace le couloir en CSS 3D de `js/museum.js`, qui reste comme version de secours.

## Objectif

Une galerie de musée immersive, en vraie 3D, où Mini Cycy et Kevin, vus de dos, visitent les matchs de l'UBB vus ensemble. Un tableau par match, du plus ancien au plus récent. Sous chaque tableau, « En savoir plus » ouvre un espace souvenirs (photos et anecdote). Le rendu doit être premium et fluide sur iPhone, mobile d'abord, et propre sur PC.

## Choix de Kevin

| Sujet | Choix |
|---|---|
| Stack | Three.js (vraie 3D), dans le site actuel sans étape de build |
| Décor | Lumineux enrichi : murs blancs, moulures, parquet en point de Hongrie ciré qui reflète, spots, bancs en velours bordeaux, plantes, cordon devant la finale |
| Avatars | Stickers de dos (`dos-cycy-*`, `dos-kevin-*`) debout sur le parquet, grands au premier plan, caméra qui les suit de derrière |
| Déplacement | Sur un rail : elle fait défiler, la caméra avance avec un effet ressort et s'arrête devant chaque tableau |
| Objets de décor | Modélisés en code (formes simples), aucun modèle à télécharger |
| « En savoir plus » | La caméra s'approche du tableau, puis un panneau « Souvenirs » monte du bas |
| Photos et anecdotes | Emplacements vides pour l'instant (« Souvenirs à venir »), Kevin les remplira lui-même |
| Titre | « Kevin & Cyrielle · Saison UBB » |

## Données (`content.museum`)

14 matchs, triés par date.

| # | Date | Match | Score | Stade |
|---|---|---|---|---|
| 1 | 2025-04-06 | Ulster (8e Champions Cup) | 43 – 31 | Chaban-Delmas |
| 2 | 2025-12-13 | Scarlets (Champions Cup) | 50 – 21 | Chaban-Delmas |
| 3 | 2026-02-14 | Castres (Top 14 J17) | 57 – 32 | Chaban-Delmas |
| 4 | 2026-03-22 | Toulouse (Top 14 J19) | 44 – 20 | Stade Atlantique |
| 5 | 2026-04-05 | Leicester (8e Champions Cup) | 64 – 14 | Chaban-Delmas |
| 6 | 2026-05-16 | Perpignan (Top 14 J24) | 37 – 32 | Chaban-Delmas |
| 7 | 2026-05-23 | Finale Leinster, sur écran géant | 41 – 19 | Chaban-Delmas |
| 8 | 2026-06-06 | Clermont (Top 14 J26) | 31 – 34 | Chaban-Delmas |
| 9 | 2026-09-05 | Racing 92 (Top 14 J1) | 64 – 5 | Chaban-Delmas |
| 10 | 2026-09-20 | Stade Français (Top 14 J3) | 40 – 10 | Chaban-Delmas |
| 11 | 2026-10-03 | Lyon (Top 14 J5) | 51 – 28 | Chaban-Delmas |
| 12 | 2026-10-31 | Bayonne (Top 14 J8) | à venir | Chaban-Delmas |
| 13 | 2026-12-13 | Stormers (Champions Cup) | à venir | Chaban-Delmas |
| 14 | 2026-12-20 | Pau (Top 14 J12) | à venir | Stade Atlantique |

**Champs ajoutés à chaque match**
- `venue` : `"chaban"` ou `"atlantique"`. Les noms affichés sont dans `museum.venues`.
- `stand` : la tribune, telle que sur le billet. Par exemple « Honneur bas », ou « Tribune Ouest · Bloc 05 » au Stade Atlantique.
- `photos` : noms de fichiers dans `assets/souvenirs/<date>/`, vide par défaut.
- `story` : l'anecdote, vide par défaut.

**Règles d'affichage**
- La place de Cyrielle est la place du billet + 1.
- Le premier match à venir (Bayonne) s'appelle « La prochaine œuvre ». Les suivants s'appellent « Prochainement ».

**Données personnelles**
- Aucun nom, numéro de billet ou code-barres sur la page, et un test le vérifie.
- Seuls les billets de Kevin sont gardés. Ceux de Cyrielle aussi, s'il y en a un jour.

**Logos à ajouter** (Wikipédia, copiés dans `assets/logos/`) : Castres, Toulouse, Pau.

## Le musée

**Le lieu**
- Une longue salle droite, assez large (≈ 8 m) pour que la caméra cadre un tableau entier sur un téléphone tenu droit.
- Les tableaux alternent mur gauche, mur droit, comme aujourd'hui.

**Murs et sols**
- **Murs :** blanc cassé avec une texture de plâtre très légère, et une cimaise à mi-hauteur.
- **Moulures :** une corniche au plafond et des plinthes.
- **Plafond :** blanc, avec une verrière (bandes lumineuses) le long du couloir.
- **Parquet :** en point de Hongrie, chêne clair ciré. Le parquet est légèrement transparent, posé sur un miroir. On y voit donc les reflets des tableaux, des lumières et des avatars.

**Lumière**
- Une lumière douce d'ambiance, plus la lumière du jour qui vient de la verrière.
- Chaque tableau a un spot (petit projecteur au plafond) et un halo chaud peint sur le mur.
- Le tableau devant lequel on s'arrête reçoit en plus une vraie lumière, qui le fait ressortir.

**Mobilier**
- Des bancs en velours bordeaux (assise capitonnée, pieds en bois) entre certains tableaux, le long des murs.
- Des plantes en pot (pot en céramique, feuillage stylisé) aux autres intervalles.
- Un cordon en velours bordeaux sur deux poteaux dorés devant la finale.

**Entrée et fond**
- **Entrée :** un mur d'accueil avec le titre en grandes lettres. Le titre « Kevin & Cyrielle · Saison UBB » et le sous-titre « Exposition permanente · Chaban-Delmas & Stade Atlantique » sont aussi en texte normal par-dessus la 3D, au début.
- **Fond :** au bout de la salle, un mur avec « À suivre… » et « La suite s'écrit ensemble. ».

**Les tableaux**
- **Le tableau :** un vrai cadre en relief, noir, et doré pour la finale.
- **La toile :** deux aplats de couleur (UBB et l'adversaire), la date, et les deux logos dans des médaillons blancs.
- **Matchs à venir :** la toile est couverte d'un drap avec son étiquette.
- **Le cartel :** une carte blanche sous le tableau, avec le score, la compétition, la date et le stade, puis « Tribune · Rang · Places X et X+1 ».

## Mini Cycy et Kevin

**Présence à l'écran**
- Ce sont deux personnages plats (leurs stickers de dos), debout sur le parquet, toujours tournés vers la caméra.
- Ils sont grands au premier plan : environ le bas d'un tiers de l'écran à l'arrêt.
- Chacun a une ombre douce au sol et un reflet dans le parquet.

**En marchant**
- Ils marchent devant la caméra en se balançant (léger saut et inclinaison), avec un bruit de pas.
- Stickers : Mini Cycy a les mains dans le dos, Kevin ajuste ses lunettes.

**Devant un tableau**
- Ils se placent entre la caméra et le mur, face au tableau.
- Réactions (stickers de dos, sons existants) :
  - **entrée :** ils réfléchissent (« ? ») ;
  - **victoire :** ils sautent bras levés, avec des applaudissements ;
  - **finale :** bras écartés, confettis dorés et fanfare ;
  - **défaite (Clermont) :** elle pleure assise, lui a les mains sur la tête (« !!! »), avec une trompette triste ;
  - **à venir :** peace ;
  - **25 s sans bouger :** ils s'assoient et s'endorment ;
  - **bout du couloir :** ils échangent leurs places et s'envoient un bisou (les cœurs se croisent).

## Déplacement

**Le défilement**
- La page défile normalement, avec un arrêt aimanté par étape : l'entrée, puis les 14 tableaux, puis la fin.
- La caméra suit le défilement avec un effet ressort : elle garde un peu d'élan et se pose en douceur.

**Les deux positions de la caméra**
- **En marche :** au centre du couloir, elle regarde vers le fond.
- **À l'arrêt :** elle pivote vers le tableau, puis se place à la bonne distance pour cadrer le tableau et son cartel. Cette distance est calculée selon le format de l'écran.

**À l'arrêt**
- Le bouton HTML « En savoir plus » apparaît sous le cartel.
- Le bouton « ← Accueil » et le bouton du son restent en haut de l'écran.

## « En savoir plus »

**À l'ouverture**
- La caméra s'approche jusqu'à ce que le tableau remplisse l'écran, et le défilement est bloqué.
- Le panneau « Souvenirs » monte ensuite du bas avec un effet ressort.

**Le panneau**
- En-tête : le titre du match et sa date.
- Une rangée de photos qu'on fait défiler au doigt (aimantées, au format polaroïd).
- L'anecdote.

**Quand il n'y a pas encore de souvenirs**
- 3 polaroïds vides avec 📷 et « Souvenirs à venir ».
- Pour un match à venir : « Rendez-vous le 31 octobre » (la date du match).

**À la fermeture**
- « Fermer », un toucher hors du panneau ou un geste vers le bas ferment le panneau.
- La caméra recule et on reprend la visite.

**Pour remplir plus tard (README)**
1. Déposer les photos dans `assets/souvenirs/2026-02-14/`.
2. Écrire leurs noms dans `photos`, et l'anecdote dans `story`, dans `js/content.js`.

## Technique

**Three.js**
- Version r170, copiée dans `js/vendor/` comme GSAP. Le site reste sans étape de build.
- `Reflector.js` (le miroir du parquet) est copié à côté, avec son import qui pointe sur le fichier local.

**Fichiers**
- `js/museum3d.js` : le nouveau moteur. Il garde la même interface que l'ancien : `museumScreen({ onBack })`, avec `enter` et `leave`.
- `main.js` le charge seulement quand on ouvre la galerie : le reste du site ne charge jamais Three.js.

**Version de secours**
- Elle s'active si le téléphone n'a pas WebGL, si le chargement échoue, ou avec `?musee&css`.
- C'est l'ancienne galerie CSS (`js/museum.js`), mise à jour pour les 14 matchs et les stades.

**Textures**
- Elles sont dessinées dans un canvas : toiles, cartels, parquet, plâtre, halos.
- Les polices et les logos sont attendus avant de dessiner.
- Tailles raisonnables : toile 1024 × 768, cartel 1024 × 400.

**Fluidité sur iPhone**
- Densité de pixels limitée à 2.
- Le miroir du parquet est rendu en demi-résolution.
- Les halos sont peints : une seule vraie lumière suit le tableau en cours.
- La géométrie reste légère.
- On ne dessine que si quelque chose bouge (caméra, avatars, animations).
- Tout est libéré en quittant la galerie.

**Chargement**
- Un écran « La galerie ouvre ses portes… » s'affiche pendant la préparation des textures.

**Tests**
- La scène affiche son état sur l'écran, pour les tests automatiques : étape en cours, prête ou non, panneau ouvert ou fermé.

## Vérifications

**Tests unitaires (`npm test`)**
- 14 matchs triés par date.
- Chaque club a un logo existant.
- `venue` est valide.
- `photos` est une liste, et chaque photo existe.
- `story` est un texte.
- Aucun nom ni numéro de billet.
- Le titre « La prochaine œuvre » va bien au premier match à venir.

**De bout en bout (Chrome sans écran, avec WebGL logiciel, en 393 × 852 et 375 × 667)**
- L'accueil mène à la galerie, et l'écran de chargement disparaît.
- Une capture à chaque arrêt, avec le tableau cadré et le bon sticker de réaction.
- La sieste se déclenche après 25 s.
- « En savoir plus » s'ouvre et se ferme, et la visite reprend.
- La fin s'affiche, puis le retour à l'accueil fonctionne.
- `?musee&css` affiche l'ancienne galerie.
- Aucune erreur dans la console.

**Non régression** : le parcours complet du swap, la surprise UBB, la fin secrète et les raccourcis `?test`.

## Hors périmètre

- Ajouter des photos depuis le site lui-même : il faudrait un serveur.
- Mettre à jour les scores automatiquement : Kevin remplace `score: null` après chaque match.
- Des modèles 3D réalistes téléchargés.
