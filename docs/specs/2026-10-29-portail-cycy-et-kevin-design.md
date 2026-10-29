# Portail « Cycy et Kevin » : design

Validé par Kevin le 2026-10-29 (questions de cadrage, design, planches de stickers, liste des sorties). Le swap et la galerie UBB ne changent pas à l'intérieur : ce document décrit ce qui les entoure (le hub, la navigation) et la nouvelle branche « Nos aventures ».

## 0. Vue d'ensemble
- **Trois mondes** derrière un hub : le Swap (les 9 cadeaux), la Galerie UBB (les matchs), Nos aventures (15 sorties, du 17 mai 2025 au 25 octobre 2026).
- **Pour qui** : un espace à deux, que Cycy et Kevin remplissent ensemble ; la famille qui a le code voit aussi les souvenirs.
- **Stack inchangée** : HTML/CSS/JS vanilla, modules natifs, pas de build. GSAP 3.12.5 et Three.js r170 restent dans `js/vendor/` ; Three.js ne sert toujours qu'à la galerie. Pas de React, pas de Spline.
- **Découpage en trois sous-projets**, chacun avec son plan, dans cet ordre :
  1. le hub, la navigation, le nouveau nom et l'icône ;
  2. Nos aventures : le passeport (déblocage, tampons, Mini Cycy), le carnet de cartes postales, les étapes dans Supabase ;
  3. les intros : les recettes animées, le kit de décor, les stickers (avec l'outil de découpe).
  Le 3 avance au rythme des planches ; tant qu'une planche manque, des stickers provisoires la remplacent (§ 7).

## 1. Navigation
- **Une seule page, jamais rechargée** (sauf en quittant le swap, voir plus bas). Chaque monde a son adresse, après un `#` :
  - `#/` : le hub (le site s'ouvre dessus) ;
  - `#/swap` : l'accueil actuel du swap (« Revoir mon parcours » / « Tout rejouer »), puis tout le swap ;
  - `#/ubb` : la galerie des matchs (3D, ou CSS en secours) ;
  - `#/aventures` : le passeport ;
  - `#/aventures/<id>` : une aventure (son intro, puis son carnet).
- Le `#` évite toute règle de réécriture sur Vercel et garde valides tous les chemins relatifs du site (`assets/…`, `js/…`).
- **`js/router.js`** (petit, testé sous Node) : lit l'adresse, choisit le monde, joue la transition. Le bouton retour du navigateur (et le glisser retour de Safari) revient au monde précédent avec la transition inverse. Une adresse inconnue mène au hub.
- **Chaque monde** se charge à la demande (`import()`), comme la galerie 3D aujourd'hui. Il garde le contrat d'écran actuel (`{ el, enter(), leave() }`) ; `leave()` libère tout (la galerie libère déjà son WebGL).
- **Anciennes adresses** :
  - `?musee` devient `#/ubb` (`?musee&css` force toujours la galerie CSS) ;
  - `?demo`, `?test`, `?rejouer`, `?pub`, `?debrief`, `?secret`, `?ubb`, `?souvenirs=fake` gardent leur effet ;
  - `?reset` efface aussi les tampons de Nos aventures.
- **Quitter le swap** recharge la page, comme aujourd'hui, parce que ses minuteries ne sont pas faites pour survivre à un départ. La transition reste continue : la plaque bordeaux recouvre l'écran, la page se recharge sur le hub, puis la plaque se replie dans la carte du Swap (un drapeau en `sessionStorage` dit au hub de commencer replié).
- Le bouton ⌂ des écrans du swap ramène au hub. La galerie et Nos aventures ont leur propre bouton retour, en haut à gauche.
- Le bouton « Notre galerie des matchs » disparaît de l'accueil du swap : la galerie est maintenant une carte du hub.

## 2. Le hub (`#/`)
- **Titre** « Cycy et Kevin » (Cormorant Garamond), sur le fond crème du site.
- **Carrousel de trois cartes**, défilement natif aimanté (une carte par cran). La carte du centre est à taille normale ; les voisines dépassent sur les côtés, plus petites et estompées (`filter`, jamais de transition CSS sur `opacity` ou `transform`, règle du projet). Trois points dessous.
  - **Le Swap** : bordeaux et crème, un paquet cadeau, « 9 cadeaux ».
  - **La Galerie UBB** : les couleurs de la galerie, un ballon, « 14 matchs ».
  - **Nos aventures** : turquoise et soleil, le passeport fermé, « 15 aventures ».
  Les nombres viennent des données (cadeaux, matchs, sorties), pas d'un texte fixe.
- **Les deux chibis** (Mini Cycy et Kevin, stickers du swap) sont posés au-dessus des cartes. À chaque changement de carte, ils sautent sur celle du centre et réagissent. Un toucher sur eux déclenche une réaction, comme ailleurs sur le site.
- **Mémoire** : le hub se rouvre sur la dernière carte visitée (`swap-cyrielle:hub`). Les nouvelles clés gardent le préfixe `swap-cyrielle:` pour ne rien migrer.
- **Entrer dans un monde** : on touche la carte du centre. Une plaque de sa couleur grandit depuis la carte jusqu'à remplir l'écran (`clip-path: inset(… round …)` animé par GSAP, fluide sur Safari). Les chibis sautent dedans, le monde apparaît sous la plaque, puis la plaque s'efface. Le retour fait l'inverse : la plaque recouvre le monde et se replie dans sa carte. Sons : `tap`, puis `whoosh`.
- **Nouveau nom** : « Cycy et Kevin » dans `<title>` et dans `manifest.webmanifest` (`name` et `short_name`). Nouvelle icône : les visages de Mini Cycy et de Kevin sur une tuile bordeaux (`apple-touch-icon`, 192, 512, favicons). Sur l'iPhone, il faut retirer l'ancienne icône de l'écran d'accueil et la rajouter pour voir le nouveau nom.

## 3. Nos aventures : les sorties
- **Les sorties sont décrites dans un fichier de données**, `js/aventures/data.js` : id, nom du tampon, dates, enchaînement des transports, personnes, tampon, décor, étapes de départ éventuelles. Une nouvelle sortie = une fiche + ses planches découpées ; c'est Kevin qui les fournit et Claude qui les ajoute.
- **Les textes** (bulles de Mini Cycy, boutons) vont dans `js/content.js`, sous `content.aventures`, comme tous les textes du site.
- **Les 15 sorties**, dans l'ordre des dates. Les noms de tampon sont des propositions, à corriger dans les données :

| # | id | Tampon | Dates | Transports | Avec Cycy et Kevin |
|---|---|---|---|---|---|
| 1 | `bivouac-1` | Premier bivouac | 17–18/05/2025 | Seat → à pied | — |
| 2 | `canoe` | Premier canoë · Dordogne | 11/08/2025 | C3 → canoë | — |
| 3 | `ile-de-re` | Île de Ré | 17–18/08/2025 | C3 → vélo | — |
| 4 | `marqueze` | Marquèze | 22/08/2025 | C3 → petit train de l'écomusée | — |
| 5 | `airbnb` | Premier Airbnb | 21/09/2025 | C3 | — |
| 6 | `boxers` | Boxers de Bordeaux | 03/10/2025 | à pied | — |
| 7 | `paris-1` | Paris | 11/11/2025 | Flixbus | — |
| 8 | `paris-2` | Paris, le retour | 09/12/2025 | Flixbus | — |
| 9 | `sardaigne` | Sardaigne | 29/12/2025 – 05/01/2026 | avion → bus sur place | — |
| 10 | `dordogne-1-an` | Nos 1 an en Dordogne | 17–19/04/2026 | 308 | — |
| 11 | `bivouac-2` | Deuxième bivouac | 04–05/07/2026 | 308 → à pied | Nini |
| 12 | `royan-1` | Royan | 12/07/2026 | 308 | — |
| 13 | `royan-2` | Royan, la bande | 01/08/2026 | 308 | Dédé, Nini, Caro, Marius, Manon, Noé |
| 14 | `roadtrip` | Roadtrip catalan | 10–14/08/2026 | Kangoo | — |
| 15 | `espelette` | Fête du piment · Espelette | 23–25/10/2026 | camping-car | le père de Kevin, Doumi, Élodie, Paolo, Paolina, Pierre, Paul, Jeanne, Jenifer |

- **Roadtrip catalan** : ses premières étapes sont Collioure, Cadaqués, Lloret de Mar, Barcelone, Empuriabrava et La Jonquera (aller et retour depuis Bordeaux). Elles sont créées par `setup.sql` (§ 6), puis modifiables comme les autres.
- **Paris, le retour** reprend les stickers de Paris tant que les siens n'existent pas.

## 4. Nos aventures : le passeport (`#/aventures`)
**Décor** : le fond reprend l'ambiance de la carte du hub (turquoise pâle et soleil), avec une carte routière en filigrane.

**Première visite**
1. **Mini Cycy** (stickers du swap, ou une tenue de voyageuse si Kevin en fait une) arrive d'un saut. Ses bulles s'écrivent lettre par lettre ; un toucher termine la bulle, un second passe à la suivante. Elle change d'expression à chaque bulle :
   1. « Coucou ! Bienvenue dans nos aventures ✨ »
   2. « Ici, il y a tout ce que Kevin et moi, on a vécu depuis mai 2025. 15 sorties, du premier bivouac à la fête du piment ! »
   3. « Mais pas de triche : on les revit dans l'ordre. Chaque aventure terminée = un tampon sur ton passeport. »
   4. « Tiens, le voilà ! Première destination… 🥁 »
   Le nombre de sorties et les noms viennent des données.
2. **Le passeport** monte du bas en tournoyant légèrement et se pose. La couverture (bordeaux, dorure « Passeport des aventures · Cycy & Kevin ») s'ouvre en 3D.
3. **La page d'identité** : les deux chibis en photo d'identité, « Titulaires : Cycy & Kevin », « Depuis le 17/05/2025 », « Aventures : n / 15 ».
4. **Les emplacements** : celui de la prochaine aventure brille, en pointillés, avec sa date et « À vivre ✦ ». Les suivants sont en pointillés avec un cadenas et seulement la date : le nom ne se découvre qu'avec le tampon.

**Le passeport en 3D CSS**
- Chaque feuille est un élément à deux faces (`backface-visibility: hidden`) qui tourne autour de la reliure (`rotateY`, `perspective`), avec une ombre et un dégradé qui suivent l'angle. Animé par GSAP.
- La page suit le doigt quand on glisse ; au lâcher, elle finit de tourner ou revient en place selon la distance et la vitesse. Deux boutons ‹ › (avec `aria-label`) font la même chose.
- **Sur téléphone**, une page à la fois ; **sur PC**, la double page.
- **2 tampons par page** : la page d'identité, 8 pages pour les 15 sorties, puis la page « Prochaine destination ? » (un tampon en pointillés).

**Les règles de déblocage** (`js/aventures/logic.js`, testé sous Node)
- Chaque sortie a un état : `stamped` (tampon posé), `pending` (vécue, tampon à poser), `open` (la prochaine à vivre) ou `locked`.
- Ordre : par date de début, puis par id.
- Il y a au plus une sortie `open`, et aucune tant qu'une sortie est `pending` : une chose à la fois.
- Les sorties `stamped` restent toujours accessibles. Quand toutes sont `stamped`, le passeport est libre.
- Une sortie ajoutée plus tard se range à sa date et devient la prochaine `open` si c'est la plus ancienne sans tampon ; les tampons déjà posés ne sont pas touchés.
- **Sauvegarde** sur le téléphone, `swap-cyrielle:aventures` : `{ stamped: [ids], pending: [ids], welcomed, page }`. Rien n'est enregistré en `?demo`, où tout est déjà tamponné. `?reset` l'efface.

**Vivre une aventure**
- Toucher l'emplacement `open` lance son intro **en entier** (pas de « passer » la première fois). À la fin, la sortie passe `pending` (enregistré tout de suite) et on revient au passeport, sur sa page.
- Toucher un emplacement `locked` le fait trembler, et Mini Cycy dit une réplique au hasard :
  - « Eh, pas si vite ! Une aventure à la fois 😤 »
  - « Celle-là, elle se mérite. Termine d'abord {aventure précédente} ! »
  - « Pas de triche, j'ai dit ! 🙈 »
- Toucher un tampon posé lance l'intro, passable d'un toucher (« Passer ▸ »), puis le carnet (§ 5).

**Tamponner** (au toucher, jamais tout seul)
- Un tampon encreur (manche en bois verni, base en caoutchouc à la couleur de l'aventure, dessiné en code ; un sticker peut le remplacer) descend au-dessus de l'emplacement et flotte doucement, avec « Touche pour tamponner ».
- Sans toucher pendant 6 s, Mini Cycy relance : « Allez, tamponne ! 👀 » ou « Qu'est-ce que t'attends ? »
- Au toucher :
  1. le tampon se lève un peu pour prendre son élan ;
  2. il s'écrase en s'aplatissant, la page s'enfonce légèrement, avec un « TCHAC » (nouveau son) et une petite secousse ;
  3. il remonte et dévoile l'empreinte (§ 4, « Les tampons ») ;
  4. il s'envole hors de l'écran. La sortie passe `stamped`, Mini Cycy réagit au hasard (« Et un tampon de plus ! 💥 », « Validé ! Prochaine destination : {aventure suivante} », « Ça, c'était quelque chose… On continue ? »), et l'emplacement suivant se met à briller. S'il est sur la page d'après, la page se tourne toute seule.
- Une sortie `pending` garde son tampon en attente : s'il n'a pas été posé, il attend au même endroit à la prochaine ouverture.
- **Au dernier tampon** : pluie dorée (`goldDust` et `fireworks` existent déjà), puis Mini Cycy : « Passeport complet ! 🎉 Maintenant, tu peux repartir où tu veux. », « Et la prochaine aventure, on la vit quand ? 😏 »

**Visites suivantes**
- Une seule bulle : « Re ! On en était à {aventure suivante} 👀 » pendant le parcours, « On repart où aujourd'hui ? » une fois complet, « Oh, un nouveau tampon à gagner : {nom} ✨ » si une sortie a été ajoutée depuis.
- Le passeport arrive et s'ouvre directement à la page de la prochaine aventure, ou à la dernière page consultée une fois le passeport complet. Un toucher accélère tout.

**Les tampons** : chacun est personnalisé et dessiné en SVG (pas d'image à fournir). Forme, encre et pictogramme, légèrement de travers (−12° à 12°, fixé par sortie), double bordure, nom et dates, grain d'encre irrégulier (filtre `feTurbulence` en masque). Propositions, à ajuster dans les données :

| Sortie | Forme | Encre | Pictogramme |
|---|---|---|---|
| Premier bivouac | rond | vert sapin | tente |
| Premier canoë | ovale | bleu rivière | canoë et pagaie |
| Île de Ré | rectangle | bleu océan | vélo |
| Marquèze | billet à coins coupés | brun | petit train |
| Premier Airbnb | maison | corail | clé |
| Boxers de Bordeaux | rond | bleu glace | crosse et palet |
| Paris | timbre dentelé | bleu marine | tour Eiffel |
| Paris, le retour | timbre dentelé | rouge | pyramide du Louvre, « 2e visite » |
| Sardaigne | rond | turquoise | avion |
| Nos 1 an en Dordogne | cœur | bordeaux | « 1 an » |
| Deuxième bivouac | rond | vert | tente et yak |
| Royan | ovale | bleu | parasol |
| Royan, la bande | ovale | orange | parasol, « ×8 » |
| Roadtrip catalan | panneau routier | jaune et rouge | Kangoo |
| Fête du piment | rond dentelé | rouge piment | piment |

## 5. Une aventure (`#/aventures/<id>`)
**L'intro** (sous-projet 3)
- **Une intro est une suite de segments**, un par transport, d'après les données (par exemple C3, puis vélo). Chaque segment suit une recette :
  - **route** (Seat, C3, 308, Kangoo, Flixbus, camping-car) : route en parallaxe, le véhicule arrive de profil en roulant (sticker « roule »), rebondit, quelques nuages de fumée, freine (vue 3/4), et les personnes descendent ;
  - **envol** (avion) : piste, l'avion roule puis décolle (stickers profil et décollage), traverse les nuages, survole la mer, l'île apparaît ;
  - **à pied** : les personnes avancent de dos (stickers de dos), le décor défile, puis elles se retournent avec une réaction ;
  - **vélo**, **canoë**, **train** : une recette chacun, écrite à l'arrivée de leur planche ; d'ici là, **à pied** les remplace.
- **Fin** : un panneau-titre (nom et dates, sur un panneau, une banderole ou une étiquette selon le décor). Le tampon n'est pas dans l'intro : c'est le geste du passeport.
- **Photo de groupe** pour les sorties à plusieurs (Royan, la bande ; Espelette) : chacun apparaît à son tour avec une pose de joie, sur deux rangées sur téléphone, puis flash et « clic ».
- **Kit de décor**, dessiné en code (SVG et CSS, quelques couches en parallaxe), choisi par sortie dans les données :
  - ciel : jour, couchant ou nuit ;
  - relief : collines, montagnes, falaises, ville ou rien ;
  - sol : route, eau, herbe, sable ou glace ;
  - accessoires : arbres, tente, feu de camp, phare, ferme landaise, toits de Paris, tour Eiffel, parasol, maisons basques, guirlandes de piments, panneau routier, patinoire…
- **Durée** : 8 à 12 s selon le nombre de segments. Sons en WebAudio comme les autres (moteur, réacteur, clapotis, sonnette).
- Chargement : les stickers d'une sortie se chargent quand on y entre (environ 30 Ko chacun), jamais tous à la fois.

**Le carnet** (sous-projet 2)
- **Les cartes postales des étapes**, à la suite le long d'un tracé vertical (pointillés d'avion ou route, selon le premier transport), par date puis par ordre d'ajout.
- **Les chibis de la sortie** descendent avec le défilement (stickers de dos, petit balancement de marche), comme Mini Cyrielle sur le chemin du swap. Un toucher les fait se retourner et réagir.
- **Une carte postale** :
  - recto : la photo choisie avec « ⭐ Mettre sur le tableau » (libellé adapté : « ⭐ Mettre sur la carte »), sinon la première photo, sinon une miniature du décor ;
  - verso, au toucher (la carte se retourne) : lieu, date, légende, auteur, un petit timbre ;
  - « Souvenirs · n » ouvre le panneau des souvenirs de la galerie (photos, vidéos, notes, plein écran, zoom, envoi), sur l'album de l'étape.
- **« + Nouvelle étape »** au bout du tracé : lieu (1 à 60 caractères), date (facultative), légende (200 caractères au plus). Le prénom est celui déjà retenu pour les souvenirs.
- **Modifier** une étape (lieu, date, légende) : tous ceux qui ont le code. **Supprimer** : seulement si l'étape n'a aucun souvenir ; sinon, « Vide d'abord ses souvenirs ».
- **Sans le code** : « 🔒 Carnet privé », cartes floutées, et le champ du code (le même que pour les souvenirs). **Sans Supabase configuré** : « Carnet à venir ».
- Le passeport et les intros ne demandent jamais le code : ils sont dans le site.

## 6. Données (Supabase, même projet, même code)
- **Nouvelle table `public.etapes`** :
  - `id uuid primary key default gen_random_uuid()` ;
  - `aventure text not null` (l'id de la sortie dans `data.js`) ;
  - `lieu text not null`, entre 1 et 60 caractères ;
  - `jour date` (facultatif) ;
  - `legende text`, 200 caractères au plus ;
  - `author text not null`, entre 1 et 40 caractères ; `device text not null` ;
  - `created_at`, `updated_at`.
  Droits `select, insert, update, delete` pour `authenticated`, règles réservées à `famille@swap-cyrielle.app`, ajoutée au direct, comme `souvenirs`.
- **Les souvenirs d'une étape** réutilisent les tables actuelles : la colonne `match_date` sert de clé d'album, et une étape prend la clé `etape-<uuid>` (sans deux-points, pour le stockage). Les fichiers vont dans le dossier de cette clé. La photo choisie va dans `covers` avec la même clé. **Aucune donnée existante ne bouge.**
- **Les étapes de départ** du Roadtrip catalan sont insérées par `setup.sql` avec des ids fixes (`on conflict do nothing`).
- `setup.sql` reste relançable en entier, sans risque. Kevin le relance une fois.
- **Le store** gagne `etapes(aventure)`, `addEtape(aventure, champs)`, `updateEtape(id, champs)`, `removeEtape(id)` et `subscribeEtapes(aventure, onChange)`, sur Supabase comme sur le faux serveur. `counts()` et `paintingPhotos()` servent tels quels, par clé d'album.
- **Le panneau des souvenirs** reçoit un album (`{ key, title, subtitle }`) au lieu d'un match. La galerie lui passe `{ key: match.date, … }` : rien ne change pour elle.

## 7. Stickers
- **Planches sources** dans `planches/` (hors git) : `planches/voyages/<sortie>/` (Cycy et Kevin de face et de dos, invités) et `planches/voyages/vehicules/`.
- **Stickers découpés** dans `assets/aventures/<sortie>/<qui>-<face|dos>-<pose>.webp`, et `assets/aventures/vehicules/<véhicule>-<vue>.webp` (300 px de large, WebP, environ 30 Ko).
- **Les 12 poses d'une planche de personnage**, dans l'ordre de la planche : `joie, colere, pleurs, boude, question, sommeil, bisou, peace, surprise, pouces, theme, saut`. Une sortie peut renommer ses poses à thème (Espelette en a quatre).
- **Les 12 vues d'une planche de véhicule** : `trois-quarts, face, trois-quarts-pleurs, arriere, profil, arriere-dodo, coeurs, phares, alerte, roule, brille, paysage`.
- **Invités** : une planche de face suffit ; Nini a aussi la sienne de dos.
- **Stickers provisoires**, tant qu'une planche manque :
  - Cycy et Kevin : les stickers du swap (Mini Cycy, Kevin) de face, et ceux de la galerie (`dos-cycy`, `dos-kevin`) de dos ;
  - un invité : une pastille ronde avec son initiale ;
  - un véhicule : une silhouette simple en SVG.
- **L'outil de découpe est gardé dans le dépôt** cette fois (`tools/`), parce que les planches vont continuer d'arriver. Les nouvelles planches ont un fond transparent : il sépare les stickers par leur transparence, retire les petites taches du fond, garde le contour blanc, recadre et exporte en WebP (Node et Chrome sans interface, comme les tests de bout en bout ; rien n'est ajouté au site).

## 8. Adresses de test
- `?demo#/aventures` : tout est tamponné, rien n'est enregistré.
- `?demo&tampon=<id>#/aventures` : le moment du tampon pour cette sortie.
- `?demo#/aventures/<id>` : l'intro et le carnet d'une sortie.
- `?souvenirs=fake#/aventures/<id>` : le carnet sur le faux serveur (code `test-code`).
- La page `?test` gagne un lien vers le hub, chaque monde, chaque intro, le moment du tampon et l'accueil de Mini Cycy.

## 9. Vérifications
- **Tests unitaires (Node)** :
  - le routeur : lecture des adresses, anciennes adresses, adresse inconnue ;
  - les règles de déblocage : ordre, un seul `open`, `pending` qui bloque, passeport complet, sortie ajoutée plus tard, `?demo` ;
  - les données : 15 sorties, ids uniques, dates valides, transports connus, chaque sticker cité existe ou a un provisoire ;
  - les étapes : vérification des champs, clés d'album `etape-<uuid>` ;
  - le SQL : table `etapes`, règles, direct, étapes de départ.
- **De bout en bout**, en Chrome automatisé (393 × 852, 375 × 667 et 1440 × 900) :
  - le hub : glisser, carte retenue après rechargement, entrée et retour pour chaque monde, par le bouton et par le retour du navigateur ;
  - le swap : les scripts existants passent tels quels, et le ⌂ ramène au hub replié dans la carte ;
  - la galerie : cinq allers-retours sans perte de contexte WebGL ;
  - Nos aventures, première visite : accueil, passeport, toucher verrouillé, intro impossible à passer, tampon qui attend le toucher, `pending` qui survit à un rechargement, sortie suivante qui s'ouvre, page qui se tourne toute seule ;
  - `?demo` : tout est libre ;
  - le carnet, sur le faux serveur : ajouter, modifier, suppression refusée tant qu'il y a des souvenirs, panneau des souvenirs sur une étape ;
  - 0 erreur dans la console.
- **Ensuite** : une relecture indépendante, puis l'essai sur le vrai iPhone (Safari et icône de l'écran d'accueil).

## 10. En attente (ne bloque pas le code)
- **Planches de Cycy et Kevin** : Île de Ré, Marquèze, Premier Airbnb, Boxers, Nos 1 an en Dordogne, Royan, Royan la bande (et Paris, le retour, si elle a les siennes).
- **Invités** : Caro, Marius, Manon, Noé ; le père de Kevin, Doumi, Élodie, Paolo, Paolina, Pierre, Paul, Jeanne, Jenifer (Dédé et Nini ont déjà des planches).
- **Véhicules** : canoë, vélos, petit train de Marquèze, camping-car ; en option, le bus de Sardaigne.
- **À confirmer** : les noms de tampon (§ 3) et leurs formes et couleurs (§ 4).
