# Souvenirs partagés : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**Objectif :** le panneau « En savoir plus » de la galerie 3D lit et écrit photos, vidéos et notes dans Supabase (privé, code partagé, en direct). Les 6 petits bugs de la galerie sont corrigés dans la même série.

**Architecture :**
- `js/souvenirs/` contient :
  - la logique pure ;
  - la réduction des médias ;
  - un `store` commun à deux branchements, Supabase (le vrai) et un faux local pour les tests et la démo.
- Le panneau (`js/gallery3d/souvenirs.js`) et un visualiseur plein écran (`js/gallery3d/viewer.js`) ne parlent qu'au store.
- `supabase/setup.sql` prépare le projet de Kevin.

**Stack :** HTML, CSS et JS natifs (modules ES) sans build ; supabase-js 2.117.3 (paquet UMD copié) ; Three.js r170 et GSAP existants ; `node:test` ; puppeteer-core.

**Spec :** `docs/specs/2026-10-28-souvenirs-partages-design.md`

## Contraintes globales

**Supabase**
- supabase-js **2.117.3**, depuis `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js`, copié en `js/vendor/supabase.js`. Il est chargé à la demande par une balise `<script>` (il expose `window.supabase`), jamais au chargement du site.
- Le code secret n'apparaît **jamais** dans le dépôt, les tests ou les journaux.
- `js/souvenirs-config.js` exporte `{ url: "", anonKey: "", email: "famille@swap-cyrielle.app" }` : vide tant que Kevin n'a pas configuré.
- Limites : fichier ≤ **52 428 800** octets (50 Mo) ; note de 1 à **500** caractères, comptés avec `[...text]` ; prénom de 1 à **40** caractères.
- Photos : grande ≤ **2048** px, vignette ≤ **512** px, JPEG qualité **0,82**. Vidéos : `video/mp4` ou `video/quicktime`, vignette ≤ 512 px.
- Liens signés valables **3600** s.
- Bucket `souvenirs`. Table `souvenirs`. Chemins `<match_date>/<id>-full.jpg`, `<match_date>/<id>-thumb.jpg`, `<match_date>/<id>.mp4` ou `.mov`.
- Faux branchement : activé par `?souvenirs=fake`, code `test-code`, données en `localStorage` (clé `swap-cyrielle:souvenirs-fake`), direct par `BroadcastChannel("souvenirs-fake")`, `&device=x` pour simuler un autre téléphone.

**Textes exacts** (`content.museum.souvenirsUi`)
- Verrou :
  - « Souvenirs privés »
  - « Entrer le code »
  - « Code »
  - « Valider »
  - « Code incorrect »
- Ajout :
  - « + Ajouter »
  - « Photo ou vidéo »
  - « Écrire une note »
  - « Publier »
  - « Ton prénom ? »
  - « Continuer »
- Erreurs :
  - « Pas de réseau, réessaie »
  - « Échec · Réessayer »
  - « Vidéo trop lourde : raccourcis-la dans Photos (50 Mo max) »
  - « Ce fichier n'est ni une photo ni une vidéo »
- Suppression :
  - « Supprimer ce souvenir ? »
  - « Supprimer »
  - « Annuler »
- Bouton du tableau : « En savoir plus · {n} »

**À conserver**
- Les réglages actuels de la galerie : taille des avatars, zoom, cartels sur deux lignes, marges, couleurs exactes des toiles, cimaise, mobilier, logos PNG de Castres et Pau.
- Pas de transition CSS sur `opacity` ou `transform` d'un élément animé par GSAP.
- Style du code : 2 espaces, guillemets doubles, commentaires en anglais, textes affichés en français dans `content.js`.

**Commits et tests**
- Commits : `git commit -m "…" -- <chemins>`, ce qui laisse de côté les PNG que Kevin a ajoutés à l'index. Message en français, terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Travail sur la branche `souvenirs`, sans push sans l'accord de Kevin.
- Tests de bout en bout dans `C:\Users\ELIOTT~1.COL\AppData\Local\Temp\claude\c--Users-eliott-colin-swap-cyrielle\5b2cc178-3c02-4be0-bf7c-18cc1313015a\scratchpad\e2e\` :
  - Chrome lancé avec `--use-angle=swiftshader --enable-unsafe-swiftshader` ;
  - serveur lancé par `npm run dev` (port 5173), à relancer s'il tombe (EMFILE) ;
  - chaque script finit par `errors: none`.

## Points à surveiller

1. **Réseau instable pendant un envoi, ou panneau fermé en plein envoi.** Aucun souvenir à moitié créé : la ligne n'est insérée qu'une fois les fichiers envoyés. En cas d'échec, le polaroïd affiche « Échec · Réessayer » et rien n'apparaît chez les autres. *Test : tâche 6.*
2. **Session expirée, ou code changé par Kevin.** Le panneau revient au verrou « Entrer le code », sans erreur ni panneau vide. *Test : tâche 5.*
3. **Deux personnes qui ajoutent en même temps.** Chaque souvenir apparaît une seule fois chez les deux, dans l'ordre d'ajout ; un ajout local n'est pas doublé par l'écho du direct. *Test : tâche 6.*
4. **Très grande photo (48 Mpx, 8064 × 6048).** Réduite sans faire tomber Safari (décodage déjà réduit via `createImageBitmap` avec `resizeWidth`) : grande ≤ 2048 px, vignette ≤ 512 px. *Test : tâche 3.*
5. **Note avec du HTML, des émojis ou 500 caractères.** Affichée comme du texte (aucune injection), émojis comptés pour un caractère. *Test : tâches 2 et 6.*

---

### Tâche 1 : les 6 bugs de la galerie

**Fichiers :**
- Modifier : `js/museum3d.js`, `js/gallery3d/room.js`, `js/gallery3d/visitors.js`, `js/main.js`
- Test : `tests/rail.test.mjs` ; e2e `fixes2.mjs` (nouveau)

**Interfaces :**
- Produit :
  - `swapStep(x: number, target: 0 | 1, dt: number, duration = 0.35) → number`, exporté par `visitors.js` ;
  - attributs `data-programs` (`renderer.info.programs.length`) et `data-faces` sur `.screen-g3d`.

- [ ] **Étape 1 :** écrire les tests.
  - **Test unitaire de `swapStep`** : de 0 à 1 en 0,35 s à 60 Hz comme à 144 Hz, à une image près. Exemple : `let x = 0; for (let t = 0; t < 0.3; t += 1/144) x = swapStep(x, 1, 1/144); assert.ok(x < 1); …` ; il vaut 1 à 0,36 s dans les deux cas.
  - **Script `fixes2.mjs`** :
    - **B1** : `data-programs` identique avant et après la première arrivée devant un tableau.
    - **B2** : on ouvre le panneau, on le ferme, puis on touche « ← Accueil » dans les 200 ms : aucune erreur console.
    - **B3** : deux touchers sur « Notre galerie » à 50 ms d'écart. On compte les `getContext("webgl2")` (sonde comprise) : 2 au plus, et un seul `.screen-g3d`.
    - **B5** : son débloqué par un toucher, arrêt sur Ulster puis « ← Accueil » en moins de 200 ms. On compte les appels à `AudioContext.prototype.createBufferSource` après le départ : 0 pendant 1 s.
    - **B6** : on ouvre le panneau, on le ferme, on attend 26 s : `data-faces` contient `sleep`.
- [ ] **Étape 2 :** les lancer. Attendu : ils échouent (`swapStep` n'existe pas ; B1, B2, B3, B5 et B6 échouent).
- [ ] **Étape 3 :** corriger.
  - **B1** : le spot est toujours `visible` ; `aimSpot(-1)` met `intensity = 0`.
  - **B2** : `renderNow()` et `closeSouvenirs()` sortent si `left`.
  - **B3** : dans `main.js`, un drapeau `opening` dans `openMuseum`, et la sonde `getExtension("WEBGL_lose_context")?.loseContext()`.
  - **B4** : `swapStep` dans `visitors.update`, avec `dt` calculé depuis l'horloge.
  - **B5** : un `Set` de minuteurs `later(fn, ms)` dans `museum3d.js`, vidé dans `leave()`.
  - **B6** : `closeSouvenirs` réarme la sieste (`armNap(settledAt)` extrait de `react`).
- [ ] **Étape 4 :** relancer → tout passe ; `npm test` aussi.
- [ ] **Étape 5 :** commit « Galerie 3D : les 6 petits bugs (à-coup, console, double toucher, 120 Hz, applaudissements, sieste) ».

### Tâche 2 : la logique des souvenirs et le ménage de `content.js`

**Fichiers :**
- Créer : `js/souvenirs/logic.js`, `tests/souvenirs.test.mjs`
- Modifier :
  - `js/content.js` : retirer `photos` et `story` des 14 matchs, ajouter `museum.souvenirsUi` (textes exacts ci-dessus) et `museum.moreCount: "En savoir plus · {n}"`, mettre à jour le commentaire d'en-tête ;
  - `tests/logic.test.mjs` : retirer les assertions sur `photos` et `story` ;
  - `js/gallery3d/souvenirs.js` : n'utilise plus `match.photos` ni `match.story`.

**Interfaces :**
- Produit, dans `logic.js` :
  - `MAX_BYTES = 52428800`, `NOTE_MAX = 500`, `NAME_MAX = 40` ;
  - `checkFile({ type, size }) → { kind: "photo" | "video" } | { error: "too-big" | "not-media" }` ;
  - `checkNote(text) → { text } | { error: "empty" | "too-long" }`, avec un texte rogné ;
  - `checkName(name) → { name } | { error }` ;
  - `fitWithin(w, h, max) → { w, h }`, qui n'agrandit jamais ;
  - `storagePaths(matchDate, id, kind, type) → { path, thumb }`, ou `{ path: null, thumb: null }` pour une note ;
  - `sortItems(items)`, par `created_at` puis `id` ;
  - `isMine(item, deviceId) → boolean` ;
  - `countByMatch(rows) → Record<string, number>`, qui ne compte que les photos et vidéos.

- [ ] **Étape 1 :** écrire `tests/souvenirs.test.mjs`. Tests à couvrir :
  - **`checkFile`** :
    - `{ type: "video/quicktime", size: 52428800 }` → `video` ;
    - taille `52428801` → `too-big` ;
    - `image/heic` → `photo` ;
    - `application/pdf` → `not-media` ;
    - `video/webm` → `not-media`.
  - **`checkNote`** :
    - `"  "` → `empty` ;
    - `"😀".repeat(500)` → OK ;
    - 501 émojis → `too-long` ;
    - `"<img src=x onerror=alert(1)>"` → OK et inchangé (l'échappement est fait à l'affichage).
  - **`fitWithin`** :
    - `(8064, 6048, 2048)` → `{ w: 2048, h: 1536 }` ;
    - `(3024, 4032, 512)` → `{ w: 384, h: 512 }` ;
    - `(400, 300, 2048)` → `{ w: 400, h: 300 }`.
  - **`storagePaths`** :
    - `("2026-03-22", "ab", "photo", "image/jpeg")` → `{ path: "2026-03-22/ab-full.jpg", thumb: "2026-03-22/ab-thumb.jpg" }` ;
    - `video/quicktime` → `"2026-03-22/ab.mov"`.
  - **Le reste** : `sortItems`, `isMine`, `countByMatch` (une note n'est pas comptée), et l'absence de `photos` et `story` dans `content.museum.matches`.
- [ ] **Étape 2 :** `npm test` → échoue (module introuvable).
- [ ] **Étape 3 :** écrire `logic.js` et faire le ménage de `content.js`. Le panneau garde l'affichage vide actuel.
- [ ] **Étape 4 :** `npm test` → tout passe ; `museum3d.mjs --quick` → `errors: none`.
- [ ] **Étape 5 :** commit « Souvenirs : logique, textes ; content.js sans photos ni story ».

### Tâche 3 : médias et faux branchement

**Fichiers :**
- Créer : `js/souvenirs/media.js`, `js/souvenirs/fake.js`, `js/souvenirs/store.js`
- Test : `tests/souvenirs.test.mjs` (choix du branchement) ; e2e `store.mjs` (nouveau)

**Interfaces :**
- Produit, dans `media.js` :
  - `shrinkPhoto(file) → Promise<{ full: Blob, thumb: Blob, width, height }>`. Il passe par `createImageBitmap(file, { imageOrientation: "from-image", resizeWidth, resizeQuality: "high" })` et `fitWithin`.
  - `videoThumb(file) → Promise<{ thumb: Blob | null, width, height }>`.
- Produit, dans `store.js` :
  - `pickBackend({ search, config }) → "fake" | "supabase" | null` (pur, testé sous Node) ;
  - `createStore() → Promise<Store | null>`, avec l'interface du store décrite dans la spec : `isUnlocked`, `unlock`, `list`, `counts`, `addMedia`, `addNote`, `remove`, `subscribe`, `deviceId`. `unlock` rejette `new Error("bad-code")` ou `new Error("network")` ; `list` rejette `new Error("locked")` si la session a expiré.
- Produit, dans `fake.js` : la même interface, plus des aides de test :
  - `window.__souvenirsFake.failNext()` : le prochain envoi échoue ;
  - `window.__souvenirsFake.expire()` : la session tombe.
  
  `onProgress` est appelé avec 0,25, 0,5, 0,75 puis 1. Les fichiers sont gardés en data URL.

- [ ] **Étape 1 :** écrire les tests.
  - **Test unitaire de `pickBackend`** :
    - `?souvenirs=fake` → `fake` ;
    - config remplie → `supabase` ;
    - config vide → `null`.
  - **Script `store.mjs`**, deux pages de `http://localhost:5173/?souvenirs=fake&device=a` et `…&device=b` :
    - verrouillé, puis `unlock("x")` rejette `bad-code`, puis `unlock("test-code")` passe ;
    - une note ajoutée sur A arrive par `subscribe` sur B en moins d'1 s ;
    - une image de 8064 × 6048 générée en canvas → `shrinkPhoto` donne une grande ≤ 2048 et une vignette ≤ 512 (point 4) ;
    - `addMedia` d'une vidéo de 2 s générée (`MediaRecorder` d'un canvas) donne une vignette ;
    - `failNext` → `addMedia` rejette et `list` sur B ne contient rien de nouveau (point 1) ;
    - `expire()` → `list` rejette `locked` (point 2) ;
    - `remove` sur A → B reçoit la suppression.
- [ ] **Étape 2 :** les lancer → échouent.
- [ ] **Étape 3 :** écrire `media.js`, `fake.js` et `store.js`.
- [ ] **Étape 4 :** relancer → tout passe ; `npm test` passe.
- [ ] **Étape 5 :** commit « Souvenirs : réduction des médias, faux branchement, store ».

### Tâche 4 : le branchement Supabase et le script SQL

**Fichiers :**
- Créer : `js/vendor/supabase.js` (copié), `js/souvenirs/supabase.js`, `js/souvenirs-config.js`, `supabase/setup.sql`
- Test : `tests/souvenirs.test.mjs`

**Interfaces :**
- Produit, dans `supabase.js` : `createSupabaseStore(config, deviceId) → Store`, la même interface que le faux.
  - Connexion : `auth.signInWithPassword({ email: config.email, password: code })`. L'erreur `invalid_credentials` donne `bad-code`, une erreur réseau donne `network`.
  - Lecture : `list` lit la table, filtrée par `match_date` et triée, puis récupère les liens signés en un seul appel (`createSignedUrls`, 3600 s).
  - Envoi d'un fichier : par `XMLHttpRequest` `POST {url}/storage/v1/object/souvenirs/{path}`, avec les en-têtes `Authorization: Bearer <access_token>` et `apikey`. Le XHR donne la progression.
  - Insertion : la ligne n'est insérée qu'après l'envoi des fichiers. En cas d'échec, les fichiers déjà envoyés sont supprimés (point 1).
  - Suppression : `remove` supprime les fichiers, puis la ligne.
  - Direct : `subscribe` passe par `channel().on("postgres_changes", { event: "*", schema: "public", table: "souvenirs", filter: "match_date=eq.<date>" })`.

- [ ] **Étape 1 :** écrire le test unitaire « `supabase/setup.sql` contient la table, les contraintes (`kind in`, `char_length(text) between 1 and 500`), le bucket privé de 52428800 octets, les règles réservées à `authenticated` sur la table et sur `storage.objects` du bucket, et `alter publication supabase_realtime add table` ; aucune règle `anon` ». Il ajoute aussi : `js/souvenirs-config.js` exporte `url` et `anonKey` vides, et aucun fichier du dépôt ne contient le mot `password` en dehors de `supabase.js`.
- [ ] **Étape 2 :** `npm test` → échoue.
- [ ] **Étape 3 :** copier supabase-js 2.117.3, puis écrire `supabase.js`, `setup.sql` (idempotent : `create … if not exists`, `on conflict do nothing` pour le bucket, `drop policy if exists` avant chaque `create policy`) et `souvenirs-config.js`.
- [ ] **Étape 4 :** `npm test` passe. Le vrai projet sera testé en tâche 8.
- [ ] **Étape 5 :** commit « Souvenirs : branchement Supabase et setup.sql ».

### Tâche 5 : le panneau, verrou, rangée, notes, direct et compteur

**Fichiers :**
- Modifier : `js/gallery3d/souvenirs.js`, `js/museum3d.js`, `css/style.css`
- Test : e2e `souvenirs.mjs` (nouveau)

**Interfaces :**
- Utilise : le store (tâche 3), `sortItems` et `isMine` (tâche 2).
- Produit :
  - `souvenirPanel(match, { labels, title, onClose, store }) → { el, open(), close() }`. Avec `store` à `null`, c'est le panneau actuel.
  - Attributs pour les tests : `data-state` sur `.g3d-souvenirs` (`locked`, `loading` ou `ready`), et `data-count` sur `.g3d-more`.

- [ ] **Étape 1 :** écrire `souvenirs.mjs`, avec les deux téléphones `device=a` et `device=b`.
  - **Le verrou** : polaroïds floutés, puis code faux → « Code incorrect », puis code juste → `ready`.
  - **Le direct** : une note ajoutée par `store` sur A apparaît sur B, panneau ouvert, en moins d'1 s.
  - **Le compteur** : après l'ajout d'une photo, le bouton du tableau affiche « En savoir plus · 1 ».
  - **Point 2** : `expire()` → le panneau repasse en `locked` à la prochaine ouverture.
  - **Sans branchement** (sans `?souvenirs=fake`, config vide) : le panneau est identique à aujourd'hui (« Souvenirs à venir », pas de « + »).
- [ ] **Étape 2 :** le lancer → échoue.
- [ ] **Étape 3 :** écrire le verrou, la rangée (vignettes, ▶, prénom), les notes, l'abonnement au direct (désabonnement à la fermeture) et le compteur.
  - Le compteur est appelé une fois dans `museum3d` après le déverrouillage, puis tenu à jour par le direct.
  - Tout texte d'utilisateur passe par `textContent`.
- [ ] **Étape 4 :** relancer → tout passe. Lancer aussi `museum3d.mjs --quick` sur les deux tailles, puis regarder les captures.
- [ ] **Étape 5 :** commit « Souvenirs : panneau verrouillé, rangée, notes, direct, compteur ».

### Tâche 6 : ajouter (photo, vidéo, note) et le prénom

**Fichiers :**
- Modifier : `js/gallery3d/souvenirs.js`, `css/style.css`
- Test : e2e `souvenirs.mjs`

**Interfaces :**
- Produit : le polaroïd `.g3d-add` et son menu `.g3d-add-menu`, le champ fichier `.g3d-file` (`accept="image/*,video/mp4,video/quicktime" multiple`), le formulaire de note `.g3d-note-form`, le formulaire de prénom `.g3d-name-form`. Les envois en cours portent `.g3d-polaroid.is-uploading` avec `--progress`.
- Le prénom est gardé en `localStorage` (`swap-cyrielle:souvenirs-name`).

- [ ] **Étape 1 :** compléter `souvenirs.mjs`.
  - **Le prénom** : demandé au premier ajout seulement.
  - **Une photo** (fichier JPEG de test), envoyée avec `page.waitForFileChooser` : la jauge apparaît, puis la photo est visible sur B.
  - **Une vidéo** de 2 s : vignette et ▶.
  - **Un fichier trop lourd** (un `File` de 52 428 801 octets injecté par `DataTransfer`, en glisser-déposer) → message « Vidéo trop lourde… », rien n'est envoyé.
  - **Un PDF** → « Ce fichier n'est ni une photo ni une vidéo ».
  - **Le glisser-déposer** d'une image sur le panneau fonctionne.
  - **Point 1** : `failNext` → « Échec · Réessayer », puis réessayer → OK, une seule fois sur B.
  - **Point 3** : A et B ajoutent une note en même temps → chacune apparaît une fois, dans l'ordre, des deux côtés.
  - **Point 5** : la note `<img src=x onerror=alert(1)>😀` s'affiche telle quelle (aucun élément `img` créé), et le compteur de caractères tombe à 0 sur 501 émojis (bouton « Publier » désactivé).
- [ ] **Étape 2 :** le lancer → échoue.
- [ ] **Étape 3 :** écrire le polaroïd « + », le menu, le formulaire de prénom, l'envoi de photos et de vidéos (`shrinkPhoto` ou `videoThumb`, puis `store.addMedia` avec `onProgress`), les notes et le glisser-déposer. Les ajouts locaux sont dédoublonnés par `id` contre l'écho du direct.
- [ ] **Étape 4 :** relancer → tout passe. Captures regardées en 393 × 852 et 375 × 667.
- [ ] **Étape 5 :** commit « Souvenirs : ajouter photos, vidéos et notes ».

### Tâche 7 : plein écran et suppression

**Fichiers :**
- Créer : `js/gallery3d/viewer.js`
- Modifier : `js/gallery3d/souvenirs.js`, `css/style.css`
- Test : e2e `souvenirs.mjs`

**Interfaces :**
- Produit :
  - `openViewer(items, index, { labels, onClose }) → { close() }`, placé au-dessus du panneau (`z-index` 47, sous les boutons du haut). Navigation par glisser horizontal, par les flèches et par les touches ←, → et Échap. Une vidéo se lit avec `controls` et `playsinline`.
  - La × de suppression (`.g3d-remove`) n'existe que si `isMine(item, store.deviceId)`. La confirmation se fait dans le panneau (« Supprimer ce souvenir ? », « Supprimer », « Annuler »).

- [ ] **Étape 1 :** compléter `souvenirs.mjs`.
  - **Le plein écran** : un toucher sur la 1re photo ouvre le visualiseur, → passe à la vidéo, Échap ferme.
  - **La ×** : présente sur A pour ses ajouts, absente sur B pour ceux de A.
  - **La suppression** : sur A, « Annuler » ne supprime rien ; « Supprimer » retire le souvenir sur A et sur B, et le compteur baisse.
- [ ] **Étape 2 :** le lancer → échoue.
- [ ] **Étape 3 :** écrire `viewer.js` et la suppression.
- [ ] **Étape 4 :** relancer → tout passe. Captures regardées.
- [ ] **Étape 5 :** commit « Souvenirs : plein écran et suppression ».

### Tâche 8 : guide Supabase, vérification complète et vrai projet

**Fichiers :**
- Modifier : `README.md`, en ajoutant la section « Souvenirs partagés : mise en place ».
- Test : tous les scripts ; `supabase-smoke.mjs` (nouveau).

- [ ] **Étape 1 :** écrire le README.
  - **La mise en place, pas à pas** :
    1. Créer le compte et le projet, région Paris (eu-west-3).
    2. Dans l'éditeur SQL, coller `supabase/setup.sql`, puis « Run ».
    3. Authentication → Sign In / Providers → Email : désactiver « Allow new users to sign up ».
    4. Authentication → Users → Add user : e-mail `famille@swap-cyrielle.app`, mot de passe = le code (8 caractères ou plus), « Auto Confirm User ».
    5. Project Settings → API : copier l'URL et la clé `anon`, puis les envoyer.
  - **Supprimer un souvenir** depuis le tableau de bord.
  - **Le faux branchement** : `?souvenirs=fake`, avec le code `test-code`.
- [ ] **Étape 2 :** `npm test`, puis tous les scripts e2e : `museum3d` (393 et 375), `museum`, `run`, `ubb`, `secret`, `combo`, `testpage`, `fixes`, `fixes2`, `store`, `souvenirs` → tout passe.
- [ ] **Étape 3 :** commit « Souvenirs : guide de mise en place ».
- [ ] **Étape 4 (quand Kevin a envoyé l'URL et la clé) :**
  - Remplir `js/souvenirs-config.js`.
  - Lancer `supabase-smoke.mjs`. Il lit le code dans la variable d'environnement `SOUVENIRS_CODE`, donnée par Kevin à la volée et jamais écrite. Il vérifie que la connexion marche, ajoute une note test, la relit, la supprime, et constate qu'un client anonyme ne lit rien.
  - Commit « Souvenirs : branché sur le projet Supabase ».
  - Push sur accord de Kevin.
