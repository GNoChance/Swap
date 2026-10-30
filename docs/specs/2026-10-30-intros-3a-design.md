# Les intros des aventures, tranche 3a : design

Validé par Kevin le 2026-10-30, morceau par morceau : découpage, style, affiche, clin d'œil, durée, moteur, contenu de la tranche, boîte à outils, stickers, scénario, vérifications. Ce document complète la spec du portail (`docs/specs/2026-10-29-portail-cycy-et-kevin-design.md`, § 5 et § 7). Là où il décide autrement (durée, panneau-titre remplacé par l'affiche), c'est lui qui fait foi.

## 0. Vue d'ensemble
- **Le sous-projet 3 se fait en trois tranches**, chacune avec sa spec courte et son plan :
  - **3a**, ce document : l'outil de découpe, le moteur des intros, le décor papier, les recettes route, marche et affiche, et une sortie complète, le **Premier bivouac** ;
  - **3b** : les recettes envol, vélo, train et canoë, la photo de groupe, et l'usage des 11 planches de scènes (Kevin aide à le décider le moment venu) ;
  - **3c** : les scénarios des 14 autres sorties, chacune avec son décor, son lieu et son anecdote.
- **Les décisions de Kevin :**
  - le décor est en **papier découpé** : des couches de papier aux couleurs franches, une ombre sous chacune, du grain, comme un livre animé ;
  - chaque intro se termine par une **affiche de voyage** : le décor passe en aplats et le lieu s'écrit en gros ;
  - **un clin d'œil par sortie** : chaque intro raconte une anecdote vraie de la sortie ;
  - **la durée suit l'histoire**, entre 10 et 18 s (au lieu de 8 à 12 s). Le bivouac dure environ 16 s ;
  - **un scénario par sortie** : un petit fichier par sortie, qui pioche dans une boîte à outils commune.

## 1. Ce que contient la tranche 3a
- L'outil de découpe des planches (`tools/decoupe/`), passé sur les 4 planches du bivouac et sur la Seat : 60 stickers.
- La boîte à outils des intros : la scène, le décor papier qui sait passer en affiche, les accessoires dessinés en code, les stickers acteurs, les recettes.
- Le scénario complet du Premier bivouac, en 6 temps, d'environ 16 s.
- Les nouveaux sons, en WebAudio.
- Les données des 15 sorties : transports et invités. Le lieu n'est rempli que pour le bivouac.
- **Ce qui ne change pas :**
  - les 14 autres sorties gardent l'intro provisoire actuelle jusqu'à leur tranche ;
  - le passeport, le tampon, Mini Cycy, le hub, le Swap et la Galerie UBB ne changent pas de comportement.

## 2. Le style
- **Le papier découpé.** Chaque couche du décor (ciel, montagnes, lac, prairie, accessoires) a :
  - une couleur franche ;
  - une ombre portée douce dessous ;
  - un fin liseré clair sur le bord haut ;
  - le grain du papier sur l'ensemble.
- **La lumière** vient du ciel du moment : jour, couchant ou nuit. Elle teinte le ciel, le soleil et les reflets du lac.
- **Les stickers** gardent leur contour blanc et portent une ombre de la même famille que celle des couches, pour avoir l'air posés dans le décor.
- **L'affiche de fin** reprend le style des affiches touristiques anciennes :
  - 4 à 5 couleurs en aplat, sans ombre ni grain, et un soleil rayé ;
  - un cadre crème ;
  - un lettrage serif en capitales espacées.
  Elle est faite des **mêmes formes** que la scène, avec une autre palette : chaque couche existe en version papier et en version affiche. On ne dessine pas une affiche à part par sortie.
- **L'esquisse de référence** est l'option A du choix de style : le lac d'Ayous, le pic du Midi d'Ossau et ses deux pointes, des sapins, des névés, le refuge et la tente.

## 3. L'écran de l'intro (`#/aventures/<id>`)
- **Le contrat d'écran reste le même** (`{ el, noHome, enter, leave }`), ainsi que les règles actuelles :
  - la première fois, l'intro se regarde en entier, et un toucher ne la passe pas ;
  - une fois la sortie tamponnée, « Passer ▸ » ou un toucher n'importe où la termine ;
  - le retour ou l'avance du navigateur quitte l'intro sans la marquer comme vue ;
  - la fin vient de la timeline, jamais d'une minuterie : un téléphone verrouillé met l'intro en pause, il ne la termine pas ;
  - à la fin, `onDone()` ramène au passeport et au moment du tampon, comme aujourd'hui.
- **Le choix du scénario :** `intro.js` cherche la sortie dans la liste des scénarios. S'il la trouve, il charge le scénario et ses stickers, puis le joue. Sinon, il joue l'intro provisoire actuelle, sans changement.
- **Le chargement :**
  - seuls les stickers cités par le scénario sont chargés, une dizaine pour le bivouac ;
  - pendant le chargement, le ciel du premier décor est déjà affiché ;
  - au bout de 4 s, les stickers qui ne sont pas arrivés sont remplacés par leurs provisoires (spec du portail, § 7), et l'intro démarre ;
  - si le fichier du scénario ne se charge pas, c'est l'intro provisoire qui joue ;
  - aucune erreur dans la console dans tous ces cas.

## 4. La boîte à outils
- **Les fichiers :**
  - `js/aventures/intro.js` : l'écran. Il choisit entre le scénario et l'intro provisoire, charge, joue, gère le passage et la fin ;
  - `js/aventures/intros/index.js` : la liste des scénarios, `{ "bivouac-1": () => import("./bivouac-1.js") }` ;
  - `js/aventures/intros/bivouac-1.js` : le scénario du bivouac. Il exporte la liste des stickers qu'il utilise, et une fonction qui construit sa timeline GSAP sur une scène ;
  - `js/aventures/scene/stage.js` : la scène de 390 × 760 unités, sa mise à l'échelle (§ 6), ses couches avec leur profondeur, et la caméra (déplacement, rapprochement, parallaxe) ;
  - `js/aventures/scene/decor.js` : les couches de papier, avec leur ombre, leur liseré et le grain. Chaque couche a sa version affiche, cachée jusqu'à la recette de l'affiche ;
  - `js/aventures/scene/props.js` : les accessoires en SVG, en unités de scène. Pour la tranche 3a, il y a le pic du Midi d'Ossau, les sapins, les rochers, les névés, le refuge, la tente qui se déplie, la vache (couchée, debout, qui s'en va), le border collie (qui trotte, qui aboie), l'escargot, les nuages, les étoiles, le soleil (papier ou rayé) et les bouffées de fumée ;
  - `js/aventures/scene/actors.js` : les acteurs.
    - Une personne a des stickers de face et de dos par pose. Elle peut changer de pose, se retourner (face ↔ dos), marcher (petit balancement), sautiller, sauter, se pencher, et porter un signe au-dessus d'elle : « … », gouttes de sueur, éclair, « Meuh ! ».
    - Un véhicule a ses vues. Il peut rouler (vue « roule »), rebondir, lâcher de la fumée, freiner (passage en « trois-quarts ») et changer de vue (« trois-quarts-pleurs », « coeurs »…).
    - Un sticker où plusieurs personnes sont dessinées ensemble peut jouer comme un seul acteur ; les planches de scènes de la tranche 3b en auront besoin.
  - `js/aventures/scene/recipes.js` : les recettes réutilisables. Chacune rend un morceau de timeline :
    - `route` : le véhicule traverse, rebondit, fume, freine, et les personnes descendent ;
    - `marche` : les personnes avancent de dos et le décor glisse vers elles ;
    - `affiche` : le cadre, le passage en aplats et le lettrage (§ 5, temps 6) ;
  - `css/intros.css` : les styles des intros, dans une feuille à part, chargée par `index.html` ;
  - `js/audio.js` gagne les nouveaux sons (§ 8).
- **Les règles :**
  - toutes les animations passent par GSAP (`window.gsap`), en unités de scène ;
  - jamais de `transition` CSS sur `opacity` ou `transform` d'une cible GSAP, ni de `@keyframes` sur une cible GSAP ;
  - `const reduced = false` ;
  - aucune dépendance ajoutée ;
  - commentaires courts, en anglais.
- **La fluidité :** chaque couche de décor est un élément à part, que le navigateur dessine une fois (avec son ombre et son grain) et qu'on ne fait que déplacer (`transform`). On n'anime jamais les paramètres d'un filtre SVG.

## 5. Le scénario du Premier bivouac (environ 16 s)
D'après les photos de Kevin (`planches/voyages/bivouac-1/photos/`, hors git) et ses anecdotes. Les temps sont indicatifs : l'ensemble dure entre 15 et 17 s.

1. **La route (0 → 2,6 s).**
   - Le décor : la vallée en V, avec de grandes pentes vertes et rocheuses, des sapins, le chemin dallé dans la prairie et le ciel bleu de mai.
   - La Seat (vue « roule ») traverse de droite à gauche en rebondissant, avec des bouffées de fumée en papier et le son du moteur.
   - Elle freine et passe en « trois-quarts ».
   - Cycy et Kevin sortent en sautillant, de face, en pose « joie ».
2. **La montée (2,6 → 5,6 s).**
   - Cycy et Kevin, de dos avec leurs sacs, marchent vers le fond. Le chemin monte et le décor glisse vers eux.
   - Les grands sapins défilent sur les côtés, puis les pierriers et les névés. Bruit de pas.
   - Le border collie traverse le sentier en trottinant.
3. **En haut (5,6 → 8,6 s).**
   - Le lac d'Ayous et le pic du Midi d'Ossau, avec son reflet dans le lac.
   - La tente beige se déplie comme dans un livre animé, avec un bruit de papier.
   - Cycy et Kevin se retournent, de face, en « joie », puis font un « saut ».
   - En environ 1,5 s :
     - le soleil se couche ;
     - les étoiles s'allument, avec des grillons ;
     - le soleil se lève, avec un oiseau.
4. **La descente (8,6 → 11,6 s).** C'est l'anecdote : Kevin avait le dos bloqué et Cycy n'arrêtait pas de l'attendre.
   - Cycy arrive au premier plan en sautillant, se retourne vers la pente et attend, avec un « … » et en tapant du pied.
   - Kevin, petit là-haut, descend penché, à tout petits pas, avec des gouttes de sueur (pose « pleurs » ou la plus proche) et un éclair dessiné dans le dos.
   - L'escargot le double.
5. **La voiture (11,6 → 14 s).** La deuxième anecdote : au retour, la voiture était encerclée de vaches.
   - Retour dans la vallée. La Seat, en « trois-quarts-pleurs », est entourée de vaches couchées. « Meuh ! »
   - Le border collie arrive en aboyant. Les vaches se lèvent et s'en vont, et la Seat passe en « coeurs ».
6. **L'affiche (14 → 16,5 s).**
   - On revient sur la vue du lac et du pic, avec Cycy et Kevin.
   - Un cadre crème se dessine autour de la scène. Les couches passent une à une en aplats, du fond vers l'avant, et le soleil devient rayé.
   - Le lettrage arrive : **LACS D'AYOUS** lettre par lettre, puis « Premier bivouac · 17–18 mai 2025 ».
   - L'affiche reste un instant, puis `onDone()`.

Les poses exactes se choisissent sur la planche de contrôle de l'outil (§ 7). Les vaches, le chien et l'escargot sont dessinés en code, dans le style papier ; une planche « vaches et berger » pourra les remplacer plus tard. L'affiche écrit le lieu en gros (`lieu` dans les données), puis le nom du tampon et les dates en petit (même format de dates que le passeport).

## 6. Les formats d'écran
- **La scène** fait 390 × 760 unités. Tout ce qui compte (personnes, véhicule, lettrage) reste dans la zone sûre, entre x = 25 et x = 365.
- **Le portrait et le PC** (hauteur d'écran d'au moins 560 px) : la scène prend toute la hauteur (échelle = hauteur / 760), centrée. Le décor déborde sur les côtés, assez large pour l'écran le plus large prévu (1440 × 900) en plus de ses déplacements. Sur PC, l'affiche finale est un portrait au centre, posé sur un fond de papier.
- **Le téléphone en paysage** (hauteur de moins de 560 px) : l'échelle est la hauteur divisée par 480, et la caméra se cadre sur la bande d'action (y de 250 à 730). On perd un peu de ciel et de prairie, mais personne ne sort de l'écran. L'affiche tient dans la hauteur.
- **Une rotation ou un redimensionnement** pendant l'intro recalcule l'échelle sans arrêter la timeline.

## 7. Les stickers et l'outil de découpe
- **La commande :**
  - `node tools/decoupe/decoupe.mjs <dossier ou planche>` découpe une planche, ou toutes les planches standard d'un dossier de sortie (« <Qui> de face.png », « <Qui> de dos.png ») ;
  - une planche de scène se découpe à part, en numérotant les stickers dans l'ordre de lecture (01, 02…).
- **Le fonctionnement :** elle passe par Chrome sans interface, avec le client CDP des tests (`tests/e2e/cdp.mjs`), sans aucune dépendance :
  1. elle repère chaque sticker comme une île de pixels opaques ;
  2. elle retire les petites taches du fond ;
  3. elle rattache au sticker le plus proche les morceaux détachés : « ? », cœurs, « zzz », traits de vitesse ;
  4. elle range les stickers dans l'ordre de lecture, ligne par ligne ;
  5. elle les nomme ;
  6. elle recadre chaque sticker en gardant son contour blanc, le met à 300 px de large et l'exporte en WebP (environ 30 Ko).
- **Les noms :**
  - les personnes : `assets/aventures/<sortie>/<qui>-<face|dos>-<pose>.webp`, avec les 12 poses dans l'ordre de la planche : `joie, colere, pleurs, boude, question, sommeil, bisou, peace, surprise, pouces, theme, saut` ;
  - les véhicules : `assets/aventures/vehicules/<véhicule>-<vue>.webp`, avec les 12 vues : `trois-quarts, face, trois-quarts-pleurs, arriere, profil, arriere-dodo, coeurs, phares, alerte, roule, brille, paysage` ;
  - les noms de véhicules : Seat Ibiza → `seat`, C3 → `c3`, 308 → `308`, Kangoo → `kangoo`, Flixbus → `flixbus`, Avion Volotea → `avion`.
- **Les dossiers de planches qui ne portent pas le nom de leur sortie :** `hockey` → `boxers`, `airbnb-1` → `airbnb`, `paris` → `paris-1`.
- **Le contrôle :**
  - l'outil écrit une planche de contrôle (`tools/decoupe/apercu/`, hors git) qui montre chaque sticker avec son nom ;
  - si une planche standard ne donne pas exactement 12 stickers, il s'arrête et le dit, sans rien écrire pour cette planche ;
  - la partie qui regroupe, nettoie et range les îles est un module pur, testé sous Node.
- **Ce qu'on découpe dans cette tranche :** les 4 planches du bivouac (Cycy et Kevin, de face et de dos) et la Seat, soit 60 stickers, environ 2 Mo dans le dépôt. Les autres planches seront découpées dans leur tranche.

## 8. Les sons
- **Nouveaux, en WebAudio** comme les autres, sans fichier :
  - `engine` : le moteur qui ronronne pendant la traversée ;
  - `brake` : le freinage ;
  - `moo` : « Meuh » ;
  - `bark` : l'aboiement ;
  - `paper` : la tente qui se déplie, le cadre de l'affiche ;
  - `crickets` : les grillons ;
  - `bird` : l'oiseau du matin.
- **Réutilisés :** `step` pour les pas, `letter` pour le lettrage, `pop` et `whoosh`.
- Le son se réveille au premier toucher, comme partout sur le site.

## 9. Les données (`js/aventures/data.js`)
- **Chaque sortie gagne :**
  - `transports` : la liste, dans l'ordre, parmi `seat, c3, 308, kangoo, flixbus, camping-car, avion, bus, pied, velo, canoe, train` ;
  - `people` : ses invités, parmi `nini, dede, caro, marius, manon, noe, fabus, doumi, elodie, paolo, paolina, pierre, paul, jeanne, jennifer` (Cycy et Kevin sont toujours là) ;
  - `lieu` : facultatif, rempli quand la sortie a un scénario. Pour bivouac-1, c'est « Lacs d'Ayous ».
- **Les valeurs**, d'après le tableau de la spec du portail :

| id | transports | people |
|---|---|---|
| `bivouac-1` | seat, pied | — |
| `canoe` | c3, canoe | — |
| `ile-de-re` | c3, velo | — |
| `marqueze` | c3, train | — |
| `airbnb` | c3 | — |
| `boxers` | pied | — |
| `paris-1` | flixbus | — |
| `paris-2` | flixbus | — |
| `sardaigne` | avion, bus | — |
| `dordogne-1-an` | 308 | — |
| `bivouac-2` | 308, pied | nini |
| `royan-1` | 308 | — |
| `royan-2` | 308 | dede, nini, caro, marius, manon, noe |
| `roadtrip` | kangoo | — |
| `espelette` | camping-car | fabus, doumi, elodie, paolo, paolina, pierre, paul, jeanne, jennifer |

- **Les liens** (pour les textes) : Dédé est la mère de Cycy, Nini son frère et Fabus le père de Kevin.
- **Aucun id de sortie ne change** : la sauvegarde du passeport, le fichier du tampon et `known` en dépendent.

## 10. Les adresses de test
- `?demo#/aventures/bivouac-1` : la nouvelle intro.
- **Nouveau :** `?demo&t=<secondes>#/aventures/bivouac-1` démarre l'intro à ce moment. Ça marche seulement avec `?demo`, et l'intro reste passable comme en démo.
- **La page `?test`** : dans « Les intros », le lien du bivouac est marqué « nouvelle », et 6 liens mènent à chacun des temps du § 5.

## 11. Les vérifications
- **Tests unitaires (Node) :**
  - les données : transports et invités connus, `lieu` présent pour chaque sortie qui a un scénario, chaque sticker cité par un scénario existe dans `assets/aventures/` ;
  - l'outil de découpe, sur de petites planches fabriquées :
    - 12 îles donnent 12 stickers dans l'ordre de lecture ;
    - les taches sont retirées et les morceaux détachés rattachés au bon sticker ;
    - il s'arrête quand une planche standard ne donne pas 12 stickers ;
  - les noms : poses, vues, véhicules, dossiers renommés.
- **De bout en bout, en Chrome automatisé** (393 × 852, 375 × 667, 1440 × 900, plus 852 × 393 en paysage) :
  - l'intro du bivouac joue jusqu'au bout, entre 15 et 17 s ;
  - seuls les stickers du scénario sont chargés, et aucun d'une autre sortie ;
  - un sticker bloqué est remplacé par son provisoire, et l'intro se termine quand même ;
  - la première fois, un toucher ne la passe pas ; une fois la sortie tamponnée, « Passer ▸ » et un toucher la terminent ;
  - le retour du navigateur au milieu de l'intro : pas d'erreur, et la sortie n'est pas marquée vue ;
  - après l'affiche, le moment du tampon se passe comme aujourd'hui ;
  - une autre sortie joue toujours l'intro provisoire ;
  - le lettrage de l'affiche dit « LACS D'AYOUS » et « Premier bivouac · 17–18 mai 2025 » ;
  - à chaque temps (avec `?t=`), les personnes, le véhicule et le lettrage sont entièrement dans l'écran ;
  - aucune erreur dans la console ;
  - les scripts existants (hub, passeport) passent tels quels.
- **À l'œil :** des captures de chaque temps sur chaque écran, montrées à Kevin.
- **Ensuite :** une relecture indépendante, puis l'essai sur le vrai iPhone (Safari et l'icône de l'écran d'accueil).

## 12. Risques et parades
- **La fluidité sous Safari.** Le Chrome de test n'a pas de carte graphique, donc seul l'iPhone dira la vérité. Si ça saccade, chaque couche de décor sera transformée en image au chargement, puis seulement déplacée. Le rendu reste le même.
- **Des stickers collés sur une planche** pourraient former une seule île. L'outil s'arrête au lieu de deviner, et on règle la planche à la main.
- **16 s à regarder la première fois.** C'est le choix de Kevin (« on voit ce que ça donne ») ; la durée se règle dans le scénario.

## 13. Hors de cette tranche
- Les recettes envol, vélo, train et canoë, la photo de groupe, les planches de scènes : tranche 3b.
- Les 14 autres scénarios, leurs lieux et leurs anecdotes : tranche 3c.
- Le carnet et les étapes Supabase : sous-projet 2b.
