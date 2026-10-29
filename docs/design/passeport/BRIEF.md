# Passeport : brief de design (tâche 2)

Maquette de référence : `docs/design/passeport/maquette.html`, à ouvrir dans Chrome avec `?state=cover|identity|stamps|locked|tool|turn|next`. On peut ajouter `&angle=-128` à `turn` pour voir le dos de la feuille. Les valeurs exactes (data URI, dégradés, ombres) se trouvent dans son `<style>` : on les copie, on ne les redessine pas.

## La direction

**« Le vrai passeport »** (la maquette « officiel », retenue avec 24 points contre 20 et 19) traite le passeport comme un objet fabriqué, éclairé par le soleil du coin haut droit.
- **La couverture :** cuir bordeaux grainé, surpiqûre dorée, sceau gaufré à sec, emblème doré à chaud (un globe dans le laurier, le soleil du hub en haut et un cœur à la jonction des branches).
- **L'intérieur :** un papier de sécurité, avec fibres, rosace guillochée irisée, cordons, microtexte, folio en cartouche et filigrane au dos.
- **Les emplacements :** des cases officielles numérotées, avec des repères d'angle.

La richesse vient du métier, jamais d'un empilement d'accessoires. Les greffes ajoutent ce qui manquait, la chaleur et le vécu, sans casser la grille.

**Les greffes retenues :**
- **De « carnet » :** la garde en portulan avec rempliés de cuir (PC) ; la route sépia avec son petit avion ; les valeurs d'identité en italique, à chiffres elzéviriens, avec un cœur tracé à la main ; un seul ruban signet ; l'encre des tampons qui transparaît au dos ; les boutons ‹ › en cuir surpiqué ; une rangée de bulle à hauteur fixe ; la reliure hors écran sur téléphone ; la tranche dont l'épaisseur suit la page.
- **De « lumière » :** la feuille éclairée par derrière (en version économique) ; la poussière d'or ; le reflet holographique qui balaie les photos ; les rayons lents (petits) ; plus de noms sur la carte ; un état « à tamponner » distinct.
- **Corrections propres à « officiel » :** l'irisation enfin visible ; la page « ? » enrichie ; la couture lisible comme du fil ; les planchers de taille à 11 px ; le tampon encreur placé dans sa case.

**Les greffes écartées**, parce qu'elles font scrapbook : l'élastique, le billet de train, le washi, la tache de café, le coin corné, le cuir laqué et les pastilles façon interface.

## Couleurs (jetons)
| Jeton | Valeur | Usage |
|---|---|---|
| `--leather` | `#5E1628` | cuir (plats, boutons ‹ ›) |
| `--wine-deep` | `#4A0E1F` | dos du livre fermé |
| `--wine` | `#7A1F35` | titres, pointillés des verrouillés, guillochis |
| `--gold` / `--gold-soft` / `--gold-text` | `#B8935A` / `#D9BF8C` / `#8E6E3C` | dorures, case à vivre, dates à vivre |
| `--page` | `#FBF5EA` | papier des pages |
| endpaper | `#F3E8D4` | garde portulan |
| `--ivory` | `#FFFDF9` | bulle, pastille d'aide, boutons du site |
| `--ink` | `#2B1A1E` | texte |
| `--sepia` | `rgba(107,79,44,.74)` | route, avion, sentier de la page 9 |
| `--sun` | `#F2B134` | halo du soleil, lueur des cases |
| monde | `#E3F4F2 → #CDEBE7` | dégradé du fond |
| `#foil` (SVG) | `#8E6E3C 0, #D9BF8C .22, #FFF3CF .4, #C9A86A .52, #8E6E3C .72, #E2C891 .88, #A3824A 1` | dorure des emblèmes |
| `.foil` (texte) | `104deg: #8E6E3C 0, #C9A96E 16%, #E9D39F 30%, #FFF6D8 37%, #E4C891 44%, #B8935A 56%, #8E6E3C 70%, #CFAF74 84%, #9C7A43 100%` | titres de couverture |
| `#thread` | `#B8935A → #F0DBA6 → #B8935A` | fil de la surpiqûre |

L'encre de chaque tampon vient de `tampons.json`. Le tampon encreur de la maquette utilise `#1E6E9E` (canoë).

## Polices et tailles
Les polices sont Cormorant Garamond (400 à 600, italiques comprises) et Inter (400 à 800). L'unité de page vaut `--u = pw / 100`. Toutes les tailles intérieures sont en `calc(var(--u) * N)`, avec un plancher pour les petits libellés : `max(11px, …)`.

| Élément | Police | Taille |
|---|---|---|
| Couverture : « CYCY & KEVIN » / « PASSEPORT » / « des aventures » | Cormorant 600 capitales (.3em) / 600 capitales (.17em) / italique 500 | 4,6u / 11,2u / 7,6u |
| « PASSEPORT » (page 0) | Cormorant 600 capitales .2em, vin | 6,9u |
| Libellés (« TITULAIRES », « DEPUIS LE »…) | Inter 600 capitales .18em, `nowrap`, `rgba(122,31,53,.66)` | max(11px, 2,35u) |
| « Cycy & Kevin » | Cormorant 600 ; « & » italique 500 vin | 9,2u |
| Valeurs (date, compte) | Cormorant italique 500, `oldstyle-nums`, ligne pointillée | 7u |
| MRZ | `ui-monospace, "SF Mono", Menlo, Consolas`, 500, .05em | 4,25u |
| Titre courant « NOS AVENTURES » | Inter 600 capitales .34em, `rgba(122,31,53,.6)` | max(11px, 2,3u) |
| Folio, « Nº 01 » | Inter 600, chiffres tabulaires | max(11px, 2,5u) / max(11px, 2,3u) |
| « À vivre ✦ » | Cormorant italique 600 vin ; ✦ en or à .62em | 8u |
| Nom de l'aventure (`.pp-slot-name`) | Cormorant 500 | 4,9u |
| Dates des cases | Inter 600 .14em tabulaire | max(12px, 3,5u) ; verrouillé : max(13px, 3,9u) |
| « Touche pour tamponner » | Inter 600 vin | max(12px, 3,3u) |
| Bulle | Cormorant 500 | 1,12rem/1,26 ; 1rem/1,22 sous 720 px de haut ; 1,28rem sur PC |

## Textures (une variable chacune, écrite une seule fois)
Les valeurs de `--tex-noise`, `--tex-fibers`, `--tex-rosette`, `--tex-leather`, `--tex-rope`, `--tex-micro-h`, `--tex-micro-v`, `--tex-wm`, `--tex-wm-through`, `--tex-portolan`, `--tex-map` (portrait, et paysage au-delà de 760 px) et `--tex-grain` sont à copier depuis le `:root` de la maquette. Leurs sources :
```text
noise    220×220 : feTurbulence fractalNoise .018/2 oct/seed 8 → feColorMatrix (.55 .42 .30, α .10)
                   + feTurbulence fractalNoise .9/3 oct/seed 4 → (.42 .30 .20, α .12), stitchTiles
fibers   280×280 : 18 traits quadratiques (5 à 15 px, graine 11), trait .6, couleurs alternées
                   rgba(122,31,53,.34) · rgba(30,110,158,.30) · rgba(184,147,90,.48) · rgba(15,140,138,.26)
rosette  viewBox -100 -100 200 200, une seule courbe r = R + a·sin(nθ) réutilisée par <use> tournés :
                   (92, 3.6, 44)×8 · (65, 7.5, 18)×10 · (27, 3.4, 12)×6 ; 24 ellipses 47×12.5 tous les 7.5° ;
                   40 cercles r 9.5 sur r 79 ; cercles r 5 / 8.5 / 12.5 / 97 / 98.6 ; trait .3, opacité .25 ;
                   dégradé userSpaceOnUse (-80,-95)→(80,95) : #9A1D45 0 · #C8942F .42 · #B39A4A .62 · #04A3A0 1
                   → en fond à 94% auto, position 50% 54%
leather  300×300 : feTurbulence fractalNoise .46/3 oct/seed 9 → feDiffuseLighting surfaceScale 2.4,
                   feDistantLight azimuth 315 elevation 54 → feColorMatrix
                   ".30 0 0 0 .136  .075 0 0 0 .03  .10 0 0 0 .078  0 0 0 0 1" (sRGB, aucun mode de fusion)
rope     60×12 : 6 sinusoïdes y = 6 + 4.4·sin(4πx/60 + k·π/3), trait .5, alternées
                   rgba(184,147,90,.62) / rgba(122,31,53,.36), filets à y .4 et 11.6 → hauteur affichée 3,2u
micro    240×6 : « CYCY ET KEVIN · NOS AVENTURES · » ×2, Arial 700 4.9px, textLength 238,
                   rgba(122,31,53,.34), version verticale tournée de 90° → hauteur affichée 1u
wm       viewBox 200 : l'emblème (traits ×1.25) + l'anneau du sceau en rgba(255,255,255,.85), copie d'ombre
                   décalée (1.1, 1.5) en rgba(120,86,56,.10), feGaussianBlur .9 → boîte left/right 14%, top 31%, carrée
wm-through : même dessin en rgba(255,250,236,.7), anneau à .62, flou 1.2, affiché en miroir (scaleX(-1))
portolan viewBox 0 0 100 142 slice, groupe à opacité .62 : 32 lignes de rhumb depuis (50,71) (longueur 140, trait .16),
                   8 centres secondaires sur r 42 (angles π/8 + kπ/4) avec 16 lignes chacun (60, trait .12),
                   couleurs en cycle #7A1F35 / #8E6E3C / #2B1A1E ; côte en bas à gauche (#E9D9BC .55, trait vin .35,
                   plus 3 lignes de rivage), île en haut à droite, rose des vents r 15 (#F6EDDD, 16 pointes vin/or/encre),
                   2 petites roses
grain    200×200 : feTurbulence .85/3 oct/seed 2 → (.05 .33 .32, α .07)
```
Le cuir : `#5E1628` + `radial-gradient(130% 90% at 88% -6%, rgba(255,206,186,.17), transparent 56%)` + `linear-gradient(162deg, rgba(255,255,255,.05), transparent 38%, rgba(0,0,0,.26))` + `--tex-leather` à 300 px.
Le papier : `#FBF5EA` + `--tex-fibers` à 280 px + `--tex-noise` à 220 px + `--tex-rosette`. Les dos de feuille utilisent le même papier, sans rosette.

## La couverture
- **Le livre fermé :** un volume 3D, avec perspective 1800px et origine 40% 40%.
  - Pose : `translateX(-2.5%) scale(.9) rotateX(8deg) rotateY(-10deg) rotateZ(-1.6deg)`.
  - Face : `translateZ(7px)`. Dos : `#4A0E1F`, `translateZ(-7px)`, ombre `0 30px 44px -18px rgba(14,58,56,.62), 0 8px 16px -6px rgba(14,58,56,.35)`.
  - Tranches droite (`rotateY(90deg)`) et basse (`rotateX(-90deg)`), de 14 px : `repeating-linear-gradient(#F4ECDD 0 .9px, #D7C8AE .9px 1.25px)`.
  - Rayons : 1,4u côté dos, 3,6u côté libre. Ombres internes : `inset 0 0 0 1px rgba(20,0,6,.55), inset 0 1.5px 0 rgba(255,214,200,.12), inset 0 0 2.4u rgba(20,0,6,.55)`. Pli de charnière : bande de 9u à gauche, dégradé sombre-clair-sombre.
  - Dans le site, la couverture doit être une vraie feuille du livre (recto cuir, verso garde), pour que `arrive()` = monter en tournoyant, puis `rotateY(0 → -180deg)` de cette feuille.
- **La surpiqûre :** un SVG `viewBox 0 0 1000 1420`, `preserveAspectRatio none`, `rect x44 y44 912×1332 rx44` dessiné trois fois :
  - ombre `rgba(18,0,6,.55)`, trait 9, `dasharray 21 13`, décalée (2.5, 3.5) ;
  - fil `url(#thread)`, trait 5.6, mêmes pointillés, bouts ronds ;
  - reflet `rgba(255,246,220,.55)`, trait 1.6, `dasharray 15 19`, `dashoffset -3`.
- **L'emblème :** 62u de large, à 22u du haut.
  - Le sceau gaufré : cercles r 91 et 83,4 plus 90 graduations, en copie sombre `rgba(18,0,6,.6)` (−.5, 1) et copie claire `rgba(255,196,186,.16)` (.45, −.55).
  - L'emblème en `<symbol id="emb">` peint par `--p`, utilisé trois fois : sombre `rgba(18,0,6,.62)` décalé de −.9, clair `rgba(255,214,170,.2)` décalé de +.9, puis `url(#foil)`.
- **Les titres en dorure :** `.foil` avec `background-size: 300%` et `background-clip: text`, et `filter: drop-shadow(0 -.7px 0 rgba(20,0,6,.85)) drop-shadow(0 .8px 0 rgba(255,214,170,.2))`. Il ne faut jamais de `text-shadow`.
- **Le reflet :** `background-position` 28% → −12% (12 % d'un cycle de 7 s), saut à 96 %, retour à 28 % à 30 %. Il est animé par GSAP et coupé une fois le passeport ouvert.
- **La puce** fait 10,4u, à 121u du haut. **Le ruban** sort sous la couverture fermée, à 9u du dos.

## Les pages
- **La géométrie :** pages en 100u × 142u, rayon 2,4u aux coins libres. Le cuir des plats déborde de 5 px (téléphone) ou 8 px (PC) : c'est `.pp-cover-in`, rayon 3,4u, sur lequel les pages sont posées.
- **Le cadre de sécurité** (`.sec`) a un retrait de 3,6u / 4,6u :
  - cordons en haut et en bas ;
  - microtexte à 3,75u ;
  - filets verticaux `rgba(122,31,53,.24)` et microtexte vertical.
- **L'ombre de reliure,** côté reliure : `linear-gradient(90deg, rgba(64,32,18,.34) 0, rgba(64,32,18,.15) 1.8%, rgba(64,32,18,.05) 4.6%, rgba(255,255,255,.34) 7.6%, transparent 12.5%, transparent 95%, rgba(64,32,18,.07) 100%)`. Elle est en miroir (270deg) sur les pages de gauche.
- **La tranche :** quatre `box-shadow` décalées, crème `#F1E8D8` / `#ECE2CF` et brun `rgba(80,50,30,.3)`. Leur décalage vaut `.5px + t·1px`, `.8 + t·1.3`, `1.2 + t·2.2`, `1.5 + t·2.7`, avec `t = page/9` à gauche et `(9 − page)/9` à droite.
- **La couture :** un fil beige `#D9C59B` en points de 2,6u avec leurs trous `rgba(60,30,16,.45)`, espacés de 1,6u, sur 88 % de la hauteur.
- **Le folio :** une pastille couleur papier, entourée de `0 0 0 1px rgba(184,147,90,.5)`, centrée à 5,2u du bas.
- **Le ruban :** une bande de max(9px, 2,5u), qui part à 2,6u à droite de la reliure et pend de 8u sous le livre.
  - Fond : `linear-gradient(90deg, #8F6A35, #E7D2A2 35%, #C8A668 60%, #9C7840)`, queue d'aronde en `clip-path`, `rotate(-6deg)`.
- **Le dos d'une feuille :** papier sans rosette, filigrane `--tex-wm`, et le fantôme de chaque tampon de la face avant.
  - Le fantôme est à la même place, en `scaleX(-1) rotate(tilt)`, avec `mix-blend-mode: multiply`, opacité .075 et `blur(.4px)`.

## La page d'identité (page 0)
Toutes les positions sont exprimées en u, sur une page de 100 × 142.
- **L'en-tête,** à 8,4u du haut, avec 10u de marge de chaque côté : « PASSEPORT » et l'emblème doré (8,4u), puis un filet `rgba(122,31,53,.18)` doublé d'un filet or.
- **Les photos,** à 22,5u du haut et 15u du bord gauche : un bloc de 70 × 43u, gap 3u.
  - Fond `radial-gradient(#F4F7F6, #DCE6E4)`, rayon 1,1u.
  - Stickers `wink` et `kevin-joy` (left −9 %, top 6 %, width 118 %).
  - Film : arc-en-ciel et rosette en `soft-light` (fixe), plus un reflet (`.id-sheen`) qui balaie la photo en 6,5 s, **sans mode de fusion**.
- **Le sceau sec** fait 22u et déborde en bas à droite des photos (−9u, −8,5u) : anneaux et texte « CYCY ET KEVIN · NOS AVENTURES · » en blanc, avec une ombre brune.
- **Les champs,** à 70u : une grille `auto auto 1fr`, gaps 7u / 3,4u.
  - « Titulaires » sur toute la ligne, puis « Depuis le » et « Aventures ».
  - Cœur tracé à la main de 5,4u à côté de « Cycy & Kevin ».
  - Image fantôme des deux chibis (7,4 × 9,6u, grisée, .26) en haut à droite des champs.
- **La bande MRZ,** à 112,5u, haute de 14,5u, avec 6,4u de marge : fond `rgba(255,253,248,.86)` et filet du haut.
- **Les textes :** il faut séparer libellé et valeur dans `content.js` (`holders` / `since` / `count`), en découpant au « : » ou avant le paramètre.

## Les emplacements (pages 1 à 8)
Chaque case mesure 80 × 52u, à 10u du bord gauche. La case A est à 17,5u du haut, la case B à 76,5u.
- **Les repères d'angle :** 8 dégradés de 3,6u × 1,4 px, avec un retrait de −1,6u.
- **« Nº 01 »** est posé sur le bord haut, à 4u du bord gauche, sur un fond couleur papier.
- **Le style dépend uniquement de `[data-status]`.**

| État | Cadre (`rect rx 11`, pointillés ronds) | Contenu |
|---|---|---|
| `locked` | `rgba(122,31,53,.38)`, trait 1.5, `0 5.6` ; repères `rgba(122,31,53,.5)` ; trame 135° `rgba(122,31,53,.05)` 1px/2,2u, masquée en radial | cadenas de 7,2u `rgba(122,31,53,.48)` + date courte. **Ni nom, ni or.** |
| `open` | `#B8935A`, trait 2.6, `0 6.2` ; `drop-shadow(0 0 2.5px rgba(242,190,92,1)) drop-shadow(0 0 10px rgba(242,177,52,.7))` qui pulse jusqu'à `(1.5px, .7) (4px, .3)` en 2,4 s (GSAP, aller-retour) ; halo `radial-gradient(closest-side, rgba(242,177,52,.13), transparent)` | « À vivre ✦ », le nom, la date en `--gold-text` ; 6 grains de poussière d'or (1 à 1,8u, ils montent de 17u en 4,4 à 5,6 s) |
| `pending` | même cadre, pulsation en 1,4 s, halo à .2 | **vide** : le tampon encreur flotte dans la case, et la pastille « Touche pour tamponner » est posée sur le bord bas (à 128,5u) |
| `stamped` | pas de cadre, repères à .22 | SVG du tampon, 55u de large, centré, `translate(dx, dy) rotate(tilt)`, `multiply`, .94 |

**La route** n'apparaît que si la case A est `stamped` et la case B `open` ou `pending`.
- Elle est dessinée dans un SVG `viewBox 0 0 100 142` posé sur toute la page.
- Point de départ : r .9 en (68.6, 63.6).
- Tracé : `M70 64.4C77.6 67 84.8 71 83.6 79C82.8 84 79.8 86.8 76.8 88.3`, trait `--sepia` .52, `dasharray 1.5 1.3`. C'est un tiret sépia, distinct des points vin des cases verrouillées.
- Avion : `M0 0L-4-2.2L-2.8 0L-4 2.2Z` en `translate(75.6 88.9) rotate(153)`.

## La page « Prochaine destination ? » (page 9)
- **L'anneau** de 60u, à 21u du haut et 20u du bord gauche :
  - cercle r 97 en points vin (`0 5.6`) ;
  - cercle r 79 en tirets or (`4 4`) ;
  - microtexte en deux arcs lisibles, « CYCY ET KEVIN » en haut (r 86) et « NOS AVENTURES » en bas (r 94), Inter 700 9px, espacement 3,2, `rgba(122,31,53,.4)` ;
  - un ✦ or à 9 h et à 3 h.
- **Au centre :** « ? » (30u), et en dessous une date à remplir `__/__/____` (`rgba(122,31,53,.42)`).
- **« Prochaine destination ? »** en italique, à 88u.
- **Le sentier sépia** en tirets part d'une rose des vents (12u, à 9u du bord gauche et 115,5u du haut) et arrive à l'avion (7u, à 80u et 98u).

## Le tampon encreur
- **Le dessin :** le SVG `viewBox 0 0 120 150` de la maquette, à reprendre tel quel. Dégradés : `tk` (boule), `tn` (bois tourné), `tb` (virole en laiton), `tt`/`tf`/`ts` (socle), `tr` (caoutchouc), ce dernier `= ink → #0B2236`.
  - Les id doivent être préfixés par instance.
- **La taille et la place :** 34u de large, à 33u du bord gauche et 74,5u du haut, avec `filter: drop-shadow(0 1.2u 1.2u rgba(43,20,26,.28))`.
- **L'ombre :** une ellipse radiale `rgba(40,18,8,.5) → .22 → 0`, placée à 101 % de la hauteur (de −2 % à 18 %), haute de 6,4u.
- **Le flottement :** ±1,6u en 2,6 s, l'ombre passant à `scale(.88)` et .75. À l'approche du papier, l'ombre revient à `scale(1.15)` et 1.
- **Le mouvement** (flottement, descente, TCHAC) est entièrement piloté par GSAP. Les `@keyframes` de la maquette ne servent qu'à la maquette.

## La page qui tourne
- **La feuille :** `transform-origin: 0 50%`, `rotateY(angle)`, `preserve-3d`, deux faces en `backface-visibility: hidden` (avec préfixe `-webkit-`). Le dos est en `rotateY(180deg)` ; chaque face est en `isolation: isolate`.
- **La perspective** vaut 3200px. Son origine est au centre de la page de droite sur téléphone, à 50 % 50 % sur PC.
- **L'ombre sur la face avant :** `90deg, rgba(58,30,14,.6) 0, .42 12%, .3 45%, .2 80%, rgba(255,248,232,.18) 96%, rgba(255,252,244,.75) 99.4%, rgba(120,80,50,.4) 100%`. Opacité = `|a|/90`.
- **L'ombre sur le dos :** `270deg, .36 0, .16 30%, .04 70%, rgba(255,250,240,.14) 96%, rgba(255,252,244,.6) 100%`. Opacité = `(180 − |a|)/90`.
- **L'ombre portée** sur la page du dessous : `90deg, rgba(40,18,8,.55) 0, .5 30%, .34 36%, .14 44%, .04 52%, 0 58%`, avec une opacité `sin|a|`. Au-delà de −90°, elle passe sur la page de gauche (270deg).
- **Le contre-jour :** `.leaf-through` sur la face avant, au-dessus de l'ombre. Il combine un `radial-gradient(85% 60% at 90% 14%, rgba(255,232,178,.4), transparent 70%)` et `--tex-wm-through` en miroir. **Seule son opacité bouge** (`0.6·sin|a|`) : pas de `mix-blend-mode`.

## Le fond du monde
- **Les couches :**
  - un halo `radial-gradient(circle 380px at calc(100% − 26px) 18px, rgba(242,177,52,.58), .30 20%, .10 52%, 0)`, de 560 px et décalé de (40, 26) sur PC ;
  - la carte `--tex-map` en `cover` ;
  - le grain à 200 px ;
  - le dégradé `#E3F4F2 → #CDEBE7`.
- **La carte,** même dessin en deux cadrages :
  - côte, Ré et Oléron, Gironde et Dordogne ;
  - routes bordées, itinéraire vin en pointillés de Bordeaux à Espelette, et départ vers Collioure et « Barcelone › » (visible en paysage) ;
  - rose des vents, noms en Georgia italique.
- **Les rayons :** 460 px (720 sur PC), centrés sur le soleil, en `repeating-conic-gradient` à .17, masqués en radial, avec une rotation de 180 s.
- **`.world-back` et `.mute`** du site passent en ivoire et vin (`.screen-passport .world-back`).

## Téléphone
- **Les variables :** `--band: env(safe-area-inset-top) + 60px` ; `--head: clamp(96px, 13dvh, 118px)` ; `--foot: 76px` ; `--avail: 100dvh − band − head − foot − safe-bottom − 6px` ; `--pw: min(100vw − 24px, (avail − 10px)/1.42, 480px)` ; `--bx: max(7px, (100vw − pw)/2 − 16px)` (la reliure).
- **Mini Cycy** fait 80 × 106 et se tient sur le coin haut droit du livre, 22 px dedans. Elle peut dépasser à droite de `clamp(2px, …, 26px)`.
- **La bulle :**
  - ancrée par le bas, elle grandit vers le haut ;
  - sa pointe est à 18 px de son bas (26 px sous 720 px de haut) ;
  - sa largeur : `max-content`, au plus `min(330px, largeur − 92px)`.

| | 393 × 852 | 375 × 667 |
|---|---|---|
| Page | 369 × 524 (u = 3,69), reliure hors écran (7 px) | 295 × 419 (u = 2,95), reliure visible (~19 px de page gauche) |
| Rangée de la bulle | 111 px ; bas de la bulle à 8 px au-dessus du livre | 96 px ; la bulle peut couvrir 12 px du bord du livre (cuir et cordon seulement) |
| Bulle | jusqu'à 293 px de large, 4 lignes max (welcome[1]) : 31 px sous « ‹ Accueil » | 258 px de large, 16 px, 4 lignes : 20 px sous « ‹ Accueil », 24 px au-dessus du titre courant |
| Boutons ‹ › | 50 px, gap 24 px, centrés sous la page | idem ; leur bas est à 16 px du bas de l'écran |

## PC (1440 × 900)
- **Le livre :** `--head: 84px` ; `--rim: 8px` ; `--pw: min((100vw − 160px)/2, (avail − 16px)/1.42, 480px)`, soit 463 px ; reliure à 50vw. Le livre est ouvert au centre (942 × 674) ; on voit une seule page de contenu à la fois.
- **La page de gauche** dépend de la page affichée :
  - page 0 : l'intérieur de la couverture, c'est-à-dire des rempliés de cuir (1,8u + 8 px) et la garde portulan (filet vin, double filet or à 3,4u, ombre de charnière) ;
  - ensuite : le dos de la feuille tournée (filigrane et fantômes de tampons).
- **Mini Cycy** se tient sur le coin de la page de droite. La bulle va jusqu'à 440 px de large (3 lignes au plus).
- **Les boutons ‹ ›** sont espacés de 76 px pour laisser passer le ruban.
- **Le livre fermé** est centré.

## Pièges iPhone
1. **La mémoire GPU :** chaque face 3D est une texture d'environ 7 Mo en DPR 3. Il ne faut monter que la feuille courante, la précédente et celle qui tourne, les autres en `display: none` (`is-current` / `is-turned` / `is-turning`). Ajouter `will-change: transform` seulement pendant le glisser, puis le retirer.
2. **`preserve-3d` est aplati** par `overflow`, `filter`, `opacity < 1`, `mix-blend-mode`, `clip-path` ou `mask` posés sur `.pp-leaf` ou sur ses parents. Ces effets vont sur les faces.
3. **Les fuites de `backface-visibility` :** les enfants animés d'une face retournée (poussière, reflet, pulsation) peuvent rester visibles. Il faut couper leurs animations hors de la page affichée et garder `-webkit-backface-visibility`.
4. **Le `multiply` des tampons** dans une face 3D peut s'afficher en mode normal pendant l'animation. C'est acceptable à .94 ; `isolation: isolate` est posé sur chaque face.
5. **L'empilement :** chaque page est en `position + z-index: 1`, la feuille en 3, les boutons au-dessus de la feuille. À −70°, la feuille dépasse d'environ 6 % en haut et en bas.
6. **Les textures à filtres SVG** sont rasterisées une fois par taille : prévoir 50 à 100 ms au premier affichage, et Safari peut les rendre en 1x (grain plus doux). Ne jamais animer leur taille ni leur échelle.
7. **La dorure** (`background-position` + `drop-shadow`) se repeint à chaque image. Elle ne doit tourner que pendant que la couverture est visible.
8. **La pulsation en `drop-shadow`** est prévue par le plan, et la case est petite. Si ça saccade sur l'iPhone, il faut plutôt faire pulser l'opacité d'un halo déjà flou.
9. **Aucun `@keyframes` CSS** ne doit viser une cible GSAP (`.pp-tool`, `.foil`, cadre de case), sinon il écrase le style inline de GSAP.
10. **Les rayons :** 460 px au plus, jamais 240vmax. On les met en pause quand l'écran est caché. Six grains de poussière au plus, et seulement sur la case visible.
11. **`100dvh`** demande iOS 15.4 ou plus. On garde `--u` plutôt que `cqw` (iOS 16).
12. **La MRZ** s'affiche en SF Mono sur l'iPhone et en Consolas sous Windows, donc sa largeur varie : à vérifier sur le vrai iPhone, ou à passer en SVG avec `textLength`.
13. **Avec `background-clip: text`,** jamais de `text-shadow` : on utilise des `drop-shadow` ou des copies décalées.
14. **Le texte des bulles :** des espaces insécables avant « : ! ? » et dans `{next}`/`{name}` (« Île de Ré »). `text-wrap: pretty` est ignoré avant Safari 17.4.
15. **Le geste retour de Safari :** la reliure est à 7 px du bord. Un glisser qui part du bord gauche déclenche le retour arrière, donc le glisser de page doit commencer dans la page (au-delà de 24 px).
16. **Les `<use>` peints par `--p`** (variable CSS dans l'arbre fantôme) fonctionnent dans WebKit. Si un emblème sort noir, il faut revenir à des copies inline.
17. **Le contrôle à prévoir** (tâche 6) : sur 375 × 667, tester les bulles welcome[1], welcome[2] et locked[1] avec le nom d'aventure le plus long, sans collision avec « ‹ Accueil ».
