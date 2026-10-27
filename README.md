# Swap de Cyrielle

Petit site interactif pour un swap de 9 cadeaux. Chaque cadeau est caché derrière un mini-jeu ; on débloque les étapes dans l'ordre.

- Dossier : `C:\Users\eliott.colin\swap-cyrielle`
- Stack : HTML/CSS/JS vanilla (modules natifs), GSAP 3.12.5 copié dans `js/vendor/`, pas de build
- Hébergement prévu : Vercel (repo git créé par l'utilisateur, URL pas encore fournie ; ne rien pousser sans son accord)
- Appareil de jeu : iPhone 17 (Safari) de l'utilisateur. Cyrielle a un Android mais jouera sur l'iPhone
- Lancer en local : `npm run dev` puis http://localhost:5173 (tests : `npm test`). Pour refaire la grille de mots croisés si l'utilisateur change les mots : chercher une disposition compacte (script de recherche à réécrire, il était dans le scratchpad), puis vérifier avec `npm test`
- Adresses spéciales : `?demo` débloque tout sans rien enregistrer, `?reset` efface la progression, `?pub` = la pub, `?debrief` = ses réponses au débrief, `?secret` = la fin secrète (rien n'est enregistré), **`?test` = page de test avec un raccourci vers chaque scène** (`?demo&scene=intro|gift-1…9|bonus|final|debrief|map`, `&snack=brets` possible)
- Le réglage iPhone « Réduire les animations » est volontairement ignoré (`const reduced = false` dans les scripts) : avec lui, Mini Cyrielle revenait avec ses chips en un clin d'œil

> **Pour Claude, si la session crashe :** lis d'abord la section « Avancement » ci-dessous, puis `git status` / `git log`. Mets cette section à jour après chaque étape terminée.

## Avancement

Dernière mise à jour : 2026-10-27 (passage à 9 cadeaux, swap le soir même)

### Fait
- [x] `js/content.js` : tous les textes (version A provisoire) + réponses acceptées. **Seul fichier que l'utilisateur doit modifier**
- [x] `js/logic.js` : normalisation et vérification des réponses (accents, majuscules, pluriels) + `tests/logic.test.mjs` (13 tests OK)
- [x] `js/state.js` : progression, sauvegarde localStorage, modes `?demo` / `?reset`
- [x] `js/audio.js` : sons générés en WebAudio + bouton muet
- [x] `js/effects.js` : effets de révélation sur canvas (un par cadeau + feu d'artifice final)
- [x] `js/dom.js` : helpers DOM et animations GSAP communes
- [x] `js/vendor/gsap.min.js` : GSAP 3.12.5 en local (pas de CDN le jour J)
- [x] `js/games/` : free (réponse libre), anagram, blanks (texte à trous), qcm, acrostic (code secret), crossword (mots croisés)

- [x] `index.html` : coquille (polices, CSS, GSAP, `main.js`) ; les écrans sont générés en JS depuis `content.js`
- [x] `css/style.css`
- [x] `js/main.js` : écrans accueil / timeline (chemin SVG dessiné) / panneau d'étape / final, bouton son, badge démo, clavier iPhone (`--vvh`, `--kb`)
- [x] Ajout `ui.showAnswerConfirm` dans `content.js` : « Voir la réponse » demande un 2e toucher

- [x] Parcours complet testé en Chrome automatisé (puppeteer-core, script dans le scratchpad de la session, pas dans le repo), taille iPhone 393×852 et PC 1440×900 : les 7 jeux, mauvaise réponse, indice, « Voir la réponse », écran final, sauvegarde après rechargement. 0 erreur console
- [x] Bug corrigé : transitions CSS sur `opacity` en conflit avec les `gsap.from` (tuiles et options figées à moitié transparentes). Règle : **jamais de transition CSS sur opacity/transform d'un élément animé par GSAP** ; les états estompés utilisent `filter: opacity()`, et les intros ont `clearProps`

- [x] Timeline progressive : les cadeaux verrouillés sont masqués et apparaissent un par un (clé `timeline.locked` retirée de `content.js`). Testé, 0 erreur

- [x] Cadeau 3 : « Qui suis-je ? » remplacé par des mots croisés (`js/games/crossword.js`, `crosswordGrid`/`crosswordErrors` dans `logic.js`, 3 tests). Une seule `<input>` invisible suit la case courante (sentinelle « - » pour capter l'effacement sur iOS). Testé : erreur, effacement, enchaînement des mots, mot doré, changement de sens. 0 erreur
- [x] `api.onProgress()` (main.js) : un mot juste efface le message « faux » resté affiché (mots croisés, texte à trous)

- [x] Mini Cyrielle animée (voir « Mini Cyrielle » plus bas) : 12 stickers dans `assets/cyrielle/*.webp` (fond retiré par remplissage depuis les bords, seuil 246, recadrés, 300 px de large, WebP via canvas de Chrome, ~30 Ko chacun) ; `js/avatar.js` (createAvatar : set / react / setBase / jump, préchargement) ; branchée sur accueil, timeline (`placeBuddy`, `drawTo(reach, durée, walk)`), panneau (dock sticky en bas à droite) et final. `.gitignore` exclut la planche source. Testé iPhone + PC : marche le long du chemin, toucher, sommeil à 30 s, réactions aux erreurs. 0 erreur

- [x] Intro Monster Munch + bonus Nerds (voir « Intro & bonus » plus bas) : 24 stickers en plus (36 au total, ~1,1 Mo), découpe propre (bavures retirées + contour blanc régénéré 6 px, script dans le scratchpad de la session) ; `js/scenes.js` (welcomeScreen + bonusScreen) ; `crisps()` / `nerds()` avec rebonds dans `effects.js` ; sons pop / whoosh / rip / crunch / rattle ; `progress.bonus` + `seeBonus()` + test ; `variant()` (expressions tirées au hasard) ; UBB seulement après la révélation du cadeau 7 (`revealFace` dans content.js, `ubbUnlocked()` dans main.js). `welcome.body` supprimé de content.js (remplacé par `intro.lines`). Testé iPhone + PC, intro en vitesse réelle (~22 s, toucher pour accélérer), 16 tests OK, 0 erreur

- [x] Coupure pub téléachat « LE SWAP™ » après le cadeau 4 (voir « Coupure pub » plus bas) : `js/pub.js` (une timeline GSAP, pause sur « Je commande ! »), textes `content.pub`, sons static / jingle / sadTrombone / ding / dingHigh / drumroll / kaching / ring, `confetti()` dans effects.js, `progress.pub` + `seePub()` + 2 tests, `timelineScreen({ walkFrom })` pour reprendre la marche vers le cadeau 5 après la pub, `?pub` = aperçu (bouton ▶, rien n'est enregistré, la page se recharge à la fin). Rechargement pendant la pub : elle repasse (avec ▶). Bugs trouvés en test et corrigés : flash blanc rendu trop tôt (`immediateRender: false`), coins du fond qui tourne, bouton ▶ absent qui bloquait le démarrage dans le vrai parcours. Testé iPhone + PC, 18 tests OK, 0 erreur

- [x] Débrief à embranchements façon The Quarry (voir « Débrief » plus bas), qui REMPLACE le générique (supprimé : credits.js, son CSS, content.credits, son clap ; startMusic/stopMusic gardés pour l'ambiance). `js/debrief.js` (debriefScreen + debriefReport), arbre dans `content.debrief` (6 questions, 9 fins, chaque fin avec sticker + effet), `debriefErrors` + `addDebriefRun` dans logic.js (3 tests), réponses dans localStorage `swap-cyrielle:debrief` (rien en ?demo, effacé par ?reset), `createBubble` exporté de scenes.js. `?debrief` = page récap de ses réponses + bouton pour lancer. Testé : 2 branches + récap, et depuis l'écran final dans le vrai parcours, iPhone + PC, 21 tests OK, 0 erreur

- [x] Logo « Mini Cyrielle en badge » : `assets/logo/` (badge.webp transparent pour le site, favicon-32/64.png = visage zoomé, apple-touch-icon.png 180 + icon-192/512.png = pleine tuile bordeaux), `manifest.webmanifest` (plein écran, « Swap de Cyrielle »), liens dans index.html. Sur l'écran « Touche l'écran » à la place du cachet « C », et au-dessus du titre de la timeline. Source : sticker wink redécoupé SANS contour blanc (cut3.cjs avec R=0 PEEL=40 PEEL_MIN=165 DROP_LIGHT=1), composé dans un canvas Chrome (logo.mjs, scratchpad). Sur iPhone, l'app de l'écran d'accueil et Safari ont des sauvegardes séparées. Pas d'og:image tant que l'URL Vercel n'existe pas

- [x] **Passage à 9 cadeaux (2026-10-27)**, voir « Mini-jeux » : nouvel ordre, fondue (`js/games/camp.js`), mots mêlés (`js/games/wordsearch.js`, `wordsearch*` dans logic.js), équation Rituals (`equation` dans free.js), `STEP_COUNT = 9`, `step.choice` (camp fondue) et `progress.snack` (Monster Munch / Brets) + `choose` / `pickSnack`. Intro : choix Monster Munch ou Brets (aussi posé si elle passe l'intro). Effets `fondue` / `cheese` / `chocolate` / `foam` et chips Brets. 12 stickers de la planche « kawaii gourmande et cosy » (cosy, bath, fondue-cheese, fondue-choc, hike, gym, mms, brets-hold, brets-eat, pj-sleep, pj-angry, pj-think). Débrief : 9 cadeaux en grille, une fin chacun (13 fins). Testé en Chrome automatisé iPhone 393×852 et PC 1440×900 : parcours complet (Brets, changement de camp, glisser + toucher-toucher aux mots mêlés, pub, bonus, final 7/9, fins Team chocolat et La gourmande), saut d'intro. 27 tests OK, 0 erreur

- [x] **Fin secrète + 72 stickers (2026-10-27)** : 6 nouvelles planches découpées (Kevin, Brets, Monster Munch, 7MAGIC, Nerds, patate positive ; 120 stickers, ~4 Mo, chargés par série avec `preloadFaces(liste)`). Intro : câlin au paquet, ouverture, « !! », croc, miettes (champs `hug / tear / wow / bite / eat` des `intro.snacks`). Chemin : toutes les 12 s sans toucher, elle grignote (`nibble`) ou joue avec un cadeau déjà ouvert (`playFaces` des cadeaux et du paquet) ; patate (cadeau 3) et 7MAGIC (cadeau 8) ajoutent aussi des variantes d'émotions (`unlocksFaces`, tableaux acceptés). Bonus : paquet vide (`empty`) puis Nerds (`bonus.faces`). Fin secrète : `js/secret.js`, `content.debrief.secret`, `secretUnlocked` / `seeSecret` dans logic.js. Testé en Chrome automatisé iPhone (parcours complet, fin secrète depuis 12 fins trouvées, `?secret`, stickers), 29 tests OK, 0 erreur

- [x] **Retours du 2026-10-27 après-midi** : intro « On ouvre ? 😋 » (bouton, puis PAFF : flash, écran qui tremble, 3× plus de chips + pluie du haut, elles restent en tas jusqu'à « Je suis prête » : `crisps({ amount, rain, stay })`, `clearEffects()`). « Voir la réponse » : « La réponse était… / Ouvre ton cadeau et tu verras bien ! 🎁 » (`ui.openToSee`), rien n'est dévoilé dans le jeu ni par le sticker ; après « J'ai ouvert mon cadeau », la carte se retourne, réponse + effet, puis « Suite ▸ » (`ui.next`) ; fermer la feuille à ce moment-là fait aussi avancer le chemin. Débrief : carte de toutes les fins (`debriefTree` dans logic.js, `completionMap` dans debrief.js) sur chaque écran de fin et dans `?debrief`, fins trouvées en doré, la nouvelle qui brille, 🔒 pour la fin secrète. `flash()` déplacé dans dom.js. Testé : parcours complet iPhone, tous les raccourcis de `?test`, 30 tests OK, 0 erreur

### Reste à faire
- [ ] Test sur le vrai iPhone (clavier, sons en mode silencieux, safe areas) : pas vérifiable en headless
- [x] Premier commit `d7d0d4c` (identité locale au repo : GNoChance / 183079883+GNoChance@users.noreply.github.com)
- [x] Dépôt GitHub `GNoChance/Swap` (remote `origin`), branché sur Vercel par l'utilisateur : un push sur `main` met le site en ligne. Ne pousser qu'avec son accord
- [ ] Remplacer les textes provisoires par ceux de l'utilisateur : `welcome.signature` et `final.signature` vides, mot doux final en version A

## Design validé

### Palette « Bordeaux & crème »
| Rôle | Couleur |
|---|---|
| Fond | `#F6EFE6` crème papier |
| Surface | `#FFFDF9` ivoire |
| Accent | `#7A1F35` bordeaux |
| Détail | `#B8935A` or vieilli |
| Texte | `#2B1A1E` quasi noir |

Typo : Cormorant Garamond (titres, énigmes) + Inter (boutons, petits textes), via Google Fonts.
Ton des textes d'interface : complice et taquin.

### Déroulé
- **Accueil** : fond crème papier légèrement texturé, message, bouton pour commencer (ce premier toucher active les sons sur iPhone).
- **Timeline** : chemin vertical qui serpente. **Seuls les cadeaux débloqués sont affichés** (demande de l'utilisateur, 2026-10-26) : au départ on ne voit que le cadeau 1. Après « J'ai ouvert mon cadeau », le chemin se dessine vers un emplacement vide, puis le cadeau suivant apparaît (fondu + cachet qui éclate). États visibles : en cours (pulse doré), terminé (✦ + nom du cadeau). Le jalon final « Un dernier mot » n'apparaît qu'une fois les 9 ouverts. En `?demo` tout est débloqué donc tout est visible : tester l'apparition progressive sur l'adresse normale (+ `?reset`).
- **Étape** : panneau qui monte du bas sur mobile, fenêtre centrée sur PC. « Cadeau n°X — titre », énigme, jeu, « Besoin d'un indice ? » si l'étape en a un, « Voir la réponse » toujours disponible mais discret. Après réponse trouvée ou dévoilée : animation, phrase de révélation, « file ouvrir le paquet n°X », puis bouton « J'ai ouvert mon cadeau ♥ » qui valide et débloque la suite. Une étape terminée peut être rouverte pour revoir la réponse.
- **Final** : mot doux, récap des 9 cadeaux, score « trouvé toute seule » en clin d'œil, grand feu d'artifice puis pluie de cœurs.

Une énigme compte comme « trouvée toute seule » si elle est résolue avant d'appuyer sur « Voir la réponse ».

### Mini-jeux
Ordre et textes donnés par l'utilisateur le 2026-10-27 (9 cadeaux).

| # | Cadeau | Interaction |
|---|---|---|
| 1 | Charade → coffret Lush (bombe de bain + pain moussant) | Les lignes apparaissent une à une, puis réponse libre. Sticker bath |
| 2 | Anagramme → pyjama | Tuiles A A J M P Y à toucher pour remplir 6 cases ; toucher une case retire la lettre. Indice derrière un bouton. Sticker cosy ; ensuite pj-think / pj-sleep / pj-angry rejoignent les variantes (`unlocksFaces`) |
| 3 | Devinette douce → patate positive | Réponse libre (« patate » ou « pomme de terre » suffisent) |
| 4 | Texte à trous gourmand → tasse à fondue | Deux cartes `F _ _ _ _ G E fondu` 🧀 / `C _ _ _ O L A T fondu` 🍫 ; elle en touche une (camp enregistré, changeable tant que ce n'est pas trouvé) et complète les lettres. Phrase, effet et sticker (fondue-cheese / fondue-choc) suivent son camp |
| 5 | Mots mêlés → strass + trend TikTok | Grille 7×7 (`grid` dans content.js), STRASS horizontal, TIKTOK vertical, croisés sur le T. Glisser du début à la fin du mot, ou toucher la 1re puis la dernière lettre ; anneau doré. `npm test` vérifie que chaque mot est caché une seule fois. Indice derrière un bouton |
| 6 | Mots croisés → M&M's perso | Grille 8×9, 7 mots (CHOCOLAT, COULEURS, LETTRE, ROND, NOUS, UNIQUE + MMS en doré). Gardés à la place du « Qui suis-je ? » (choix de l'utilisateur). Sticker mms |
| 7 | Équation mystère → 2 mousses de douche Rituals | Tuiles ( 🧖‍♀️ + 🚿 ) × 2 = ☁️ qui apparaissent une à une, puis réponse libre (« mousse », « Rituals », « gel douche »). Effet nuages de mousse en 2 vagues |
| 8 | QCM → brosse soufflante Air Styler | 3 cartes ; A (bivouac) → sticker hike, B (whey) → sticker gym, avec la pique ; C : révélation |
| 9 | Code secret → maillot UBB | Elle touche les mots, la 1re lettre s'envole dans les cases, M-A-I-L-L-O-T se forme. Indice derrière un bouton |

### Révélations
Base commune : halo doré autour de la réponse, puis l'effet du cadeau.
1. Bulles irisées · 2. Lunes et étoiles · 3. Patates souriantes et cœurs · 4. Coulures de fromage (+ cubes de pain) ou de chocolat (+ fraises) depuis le haut de l'écran · 5. Éclats de strass prismatiques · 6. Pluie de M&M's qui rebondissent · 7. Deux vagues de nuages de mousse + bulles nacrées · 8. Rafale de vent, mèches ondulées · 9. Confettis rouge et bleu (couleurs du maillot) avec éclat doré · Final : feu d'artifice doré et bordeaux puis pluie de cœurs.
Si « réduire les animations » est activé : versions douces.

### Spécificités iPhone
- Pas de vibrations (Safari ne les gère pas) : à la place, tremblement d'écran à l'erreur, rebond, flash à la révélation.
- Sons joués même en mode silencieux ; bouton muet en haut à droite.
- Contenu hors Dynamic Island et barre du bas (`env(safe-area-inset-*)`), champs en 16px minimum pour éviter le zoom.

## Mini Cyrielle (design validé)
Stickers : joy (fou rire), angry (bras croisés), cry (pleure), pout (moue), think (« ? »), sleep (zzz), kiss (bisou ♥), wink (clin d'œil ✨), surprised (mains sur les joues), smirk (clin d'œil malicieux), cool (lunettes de soleil), peace (peace + cœurs).
- **Timeline** : debout sur le cachet en cours, flotte doucement, ombre. Déblocage : saute le long du chemin pendant qu'il se dessine (surprised), atterrit en peace. Toucher : kiss / cool / smirk / joy. 30 s sans rien faire : sleep, réveil au toucher.
- **Panneau d'énigme** : petite Cyrielle collée en bas à droite du panneau (sticky). think pendant la recherche ; erreurs : 1re pout, 2e angry, 3e+ cry ; indice : smirk ; trouvé seule : joy ; « Voir la réponse » : surprised ; « J'ai ouvert » : kiss puis fermeture.
- **Accueil** : remplace le cachet « C » (wink). **Final** : peace, ou cool si 7/7.
- Changement d'expression : le sticker se retourne (scaleX) avec un rebond.

## Intro & bonus (design validé)
- **Choix des chips (2026-10-27)** : après « il te faut des forces ! », « Plutôt Monster Munch ou Brets ? » + deux boutons (`content.intro.snacks`). Puis « Ok ça marche, je reviens ! » (`content.intro.fetch`) : elle sort de l’écran à droite en sautillant, on l’entend fouiller, elle revient en courant avec le paquet (sticker munch-hold ou brets-hold) et dit « Et voilà ! » ; le paquet qui tombait du ciel n’existe plus. Chips : petits fantômes souriants (yeux et sourire découpés, d’après la photo de l’utilisateur) pour les Monster Munch, chips classiques dorées pour les Brets (stickers brets-hold puis brets-eat). Aussi demandé si elle passe l'intro. Enregistré dans `progress.snack` ; `{snack}` dans les textes de la pub et du débrief.
- **Accueil** = scène animée. « Touche l'écran pour commencer ✨ » (débloque le son iPhone) → Mini Cyrielle entre en sautillant → bulles tapées lettre par lettre (textes dans `content.intro`, une expression par bulle) → un paquet tombe, elle l'attrape (sticker munch-hold) → le paquet tremble → se déchire (munch-open, son rip) → chips Monster Munch en particules qui volent et rebondissent sur le bas de l'écran (croc-croc) → munch-eat + dernière bulle → titre + « Je suis prête ♥ ». Toucher = bulle suivante ; lien « Passer l'intro ».
- **Bonus Nerds** entre le dernier cadeau et l'écran final, une seule fois (`progress.bonus`) : « Attends… il en reste un ! », boîte mystère (SVG) à toucher 3 fois, elle explose en pluie de Nerds qui rebondissent, puis bouton vers le mot final.
- **Stickers UBB** seulement à partir de la révélation du cadeau 9 (pas de spoil) ; sushis en réactions au toucher ; variantes d'expressions (pout2, cry2…) tirées au hasard.

## Coupure pub (design validé)
~35 s, une seule fois, juste après « J'ai ouvert mon cadeau » du cadeau 4 (`content.pub.afterGift`). Friture télé → carton « PUBLICITÉ » + jingle → problème (gris, pout2, « Marre des cadeaux banals ? », chaussettes, trompette triste) → « NOUVEAU ! LE SWAP™ » (surprised3) → arguments cochés avec ding (cool/smirk), sans dévoiler les cadeaux 5-7 → témoignage (cry2 puis joy, 5 étoiles) → « MAIS ATTENDEZ… CE N'EST PAS TOUT ! » + copain offert (kiss) → prix barrés 999 € / 99 € / 9,99 € → tampon GRATUIT ♥ + ka-ching + confettis (peace) + petites lignes qui défilent → bouton « ☎ Je commande ! » (sonnerie, « Commande validée ✔ ») → « ▶ Reprise du programme » → chemin, marche vers le cadeau 5. Bouton façon YouTube « Passer la pub dans 5… » : 1er toucher « Bien essayé 😏 », 2e toucher passe. `?pub` = aperçu direct.

## Fin secrète (design validé le 2026-10-27)
- Tant que les 13 fins ne sont pas trouvées : « 🔒 Une fin secrète t'attend à 13 / 13 » sous le compteur.
- 4,5 s après la 13e fin : grésillement télé + « FIN SECRÈTE DÉBLOQUÉE », puis l'écran de la fin secrète (fond étoilé doré). Ensuite, bouton « ✦ Revoir la fin secrète » sur les écrans de fin, et « Fin secrète : trouvée ✔ » dans `?debrief`.
- Dialogue « Les coulisses du swap » (`content.debrief.secret.script`) : Mini Cycy raconte (hier, 9 énigmes, l'ordi qui plante, 120 stickers, 8 000 lignes, 7 → 9 cadeaux, la pub), Cyrielle répond avec des boutons, roulement de tambour, Kevin entre par la droite (chibi `kevin-*`), la queue de la bulle pointe vers celui qui parle. Fin : « Fin secrète · 14 / 13 — Les coulisses », les deux chibis qui envoient un bisou, feu d'artifice + cœurs. Pas de mention d'IA (l'utilisateur n'a pas demandé).
- **Mis à jour le 2026-10-27 (fin d'après-midi)** : Kevin garde ses stickers de base (`kevin-*`, demande de l'utilisateur) et ne passe en version biceps (`kevin-flex-joy`, agrandi ×1,35 via `grow` : bras écartés, sinon il paraît tout petit) que pour « … admire ces biceps 💪 ». Les `kevin-back-*` ne servent pas. Plus de sticker qui pleure (l'utilisateur n'aimait pas). Après « Moi aussi ♥ » : « Et maintenant… admire ces biceps », puis les stickers à deux (`duo-look`, `duo-admire`, `duo-eye`), un silence, et d'un coup la morsure (`duo-bite` puis `duo-bite-hard`, croc, flash rouge, écran qui tremble, « AÏEEE ! »), « Pardon… c'était plus fort que moi 😋 ». Écran final : le sticker `duo-bite`. Champs du script : `enter` (sticker de dos), `react`, `duo`, `bite`. 141 stickers au total.
- L'utilisateur s'appelle Kevin.

## Débrief (design validé, remplace le générique)
**Mis à jour le 2026-10-27** : « ton cadeau préféré » propose les 9 cadeaux en grille 3×3, chacun mène à sa fin (Cocooning total, La marmotte, Good vibes only, Team fondue → Team fromage / Team chocolat selon son camp, Star de TikTok, La gourmande, Spa à la maison, Brushing de star, Supportrice officielle) ; branche « remarques » inchangée ; 13 fins. Les questions « bain ou film » / « au prochain match » et la fin « Le pyjama UBB » ont disparu. Description d'origine :
Bouton « 🎙 Le débrief de Mini Cyrielle ▸ » sur l'écran final. Écran sombre façon ciné, chemin doré qui se dessine et se sépare à chaque question (branches non choisies qui s'éteignent), notification « ⑂ CHEMIN CHOISI » comme dans The Quarry, Mini Cyrielle qui pose les questions. Pas de chrono. Arbre : verdict → (génial → cadeau préféré → Lush/pyjama → bain ou film / maillot → match / M&M's) ou (remarques → moins aimé → énigmes → plus faciles/plus dures / pub / je te taquine). 9 fins (FIN n / 9 : Cocooning total, La marmotte, Supportrice officielle, Le pyjama UBB, La gourmande, Mode facile activé, La revanche, Abonnement Premium, La taquine), chacune avec sticker + animation. « Fins découvertes : x / 9 » + « Rejouer le débrief ». Réponses enregistrées sur le téléphone, `?debrief` = récap pour l'utilisateur.

## Journal
- **2026-10-26 matin** : design validé, code de logique, état, sons, effets et jeux écrit. Crash du terminal pendant l'écriture des jeux (après `acrostic.js`).
- **2026-10-26** : reprise, création de ce README. Écriture de `index.html`, `css/style.css`, `js/main.js`. Tests en local OK, correction du bug d'opacité GSAP. Le site est fonctionnel de bout en bout.
- **2026-10-27 (suite)** : aller-retour pour chercher les chips, chips fantômes souriants (Monster Munch) ; réglage « Réduire les animations » ignoré (bug vu sur l'iPhone) ; fin secrète avec Kevin ; 72 stickers de plus, découpés par un script qui prend le plus gros morceau de chaque case de la grille 4×3 (`cut2.js` dans le scratchpad de la session).
- **2026-10-27** : passage à 9 cadeaux le jour du swap (questions puis design validés par l'utilisateur). Stickers découpés par couleur (le fond de la planche est aussi blanc que le contour : le remplissage depuis les bords fuyait) puis contour blanc régénéré, script `cut.js` dans le scratchpad de la session.
- **2026-10-26 (suite)** : logo Mini Cyrielle en badge ; débrief à embranchements (remplace le générique de fin, que l'utilisateur n'aimait pas) ; coupure pub téléachat ; cadeau 1 = coffret Lush (bombe de bain + pain moussant) ; timeline progressive, mots croisés (cadeau 3), Mini Cyrielle animée, intro Monster Munch, bonus Nerds, stickers UBB/sushi.
