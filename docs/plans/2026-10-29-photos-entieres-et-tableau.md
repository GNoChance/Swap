# Photos entières, zoom, photo sur le tableau : plan de travail

> **Pour les agents :** sous-skill requis : superpowers:executing-plans. Les étapes se cochent (`- [ ]`).

**Objectif :**
- Des polaroïds à la forme de la photo, avec l'image entière.
- Le zoom et le déplacement en plein écran.
- Une petite photo carrée dans le coin bas droit du tableau, choisie avec « ⭐ » ou, à défaut, la première du match, visible seulement avec le code.

**Spec :** `docs/specs/2026-10-29-photos-entieres-et-tableau-design.md`

## Contraintes globales
- **Tailles** : `FULL = 3072` et `THUMB = 768` (`js/souvenirs/media.js`). Hauteur de tirage `min(21dvh, 170px)`. Proportions bornées à `[9/16, 16/9]`.
- **Zoom** : de 1 à 4, double toucher à 2,5.
- **Textes** dans `content.museum.souvenirsUi` :
  - `cover: "⭐ Mettre sur le tableau"` ;
  - `isCover: "⭐ Sur le tableau"`.
- **Méthode** : TDD, chaque test vu en échec d'abord. Les scripts e2e sont dans le scratchpad, avec le serveur `serve.mjs` sur le port 5173. Commits avec `-- <chemins>`, branche `photos`, pas de push sans Kevin. `npm test` garde son journal complet.
- **Ne pas toucher** : tout ce qui a déjà été validé (avatars, cartels, couleurs, cimaise, mobilier, verrou, file d'envoi…).

## Points à surveiller
1. **Une image du tableau qui ne charge pas** (lien expiré, réseau) : le tableau actuel reste, aucune erreur. *(Tâche 4)*
2. **Pincer qui démarre sur une vidéo** : le lecteur garde la main, rien ne zoome et on ne change pas de souvenir. *(Tâche 2)*
3. **Supprimer la photo du tableau** : le tableau passe à la première photo restante à la prochaine mise à jour, ou revient aux logos. *(Tâches 3 et 4)*
4. **Une photo très étroite** (panorama 32:9, ou capture d'écran haute) : polaroïd borné, image entière visible. *(Tâche 1)*
5. **Le tableau d'un match à venir** n'a jamais de photo, même si quelqu'un en ajoute. *(Tâche 4)*

### Tâche 1 : polaroïds à la forme de la photo, tailles 3072 / 768
**Fichiers :**
- `js/souvenirs/logic.js` : `shotRatio(w, h) → number`, borné ; 0,75 si inconnu.
- `js/souvenirs/media.js` : `FULL`, `THUMB`.
- `js/gallery3d/souvenirs.js` : `--ratio` sur les polaroïds de photos et de vidéos.
- `css/style.css`.
- Tests : `tests/souvenirs.test.mjs`, et dans les e2e `store.mjs` (tailles 3072 / 768) et `souvenirs.mjs` (formes).

**Étapes :**
- [ ] **Tests** :
  - `shotRatio(4032, 3024) = 4/3` ;
  - `shotRatio(1000, 4000) = 9/16` ;
  - `shotRatio(4000, 500) = 16/9` ;
  - `shotRatio(0, 0) = 0.75` ;
  - e2e : 48 Mpx → grande `[3072, 2304]`, vignette `[768, 576]` ;
  - e2e : la photo paysage 1600 × 1200 → polaroïd plus large que haut, image entière (`object-fit: contain`, rapport de la boîte de l'image = rapport naturel à 2 % près) ;
  - e2e (point 4) : une photo 3200 × 900 → polaroïd au plus 16:9, image entière.

  On les lance, ils échouent.
- [ ] **Code**, puis on relance les tests : ils passent.
- [ ] **Commit** « Souvenirs : polaroïds à la forme de la photo, photos plus nettes ».

### Tâche 2 : zoom en plein écran
**Fichiers :**
- `js/gallery3d/viewer.js` : état `{ scale, x, y }`, `transform` sur l'image, `data-zoom`, `touch-action: none`.
- `css/style.css`.
- Test : e2e `viewer.mjs`.

**Étapes :**
- [ ] **Test** `viewer.mjs` :
  - un pincer simulé (deux `Touch`, écart ×2) → `data-zoom` ≈ 2 ;
  - zoomé, un glisser horizontal de 200 px → même souvenir, l'image a bougé ;
  - double toucher → retour à 1, puis un nouveau double toucher → 2,5 ;
  - à 1×, un glisser → souvenir suivant ;
  - point 2 : un pincer sur la vidéo → `data-zoom` reste 1 ;
  - molette sur PC → zoom > 1.

  On le lance, il échoue.
- [ ] **Code** : gestes, bornage du déplacement, remise à 1 à chaque changement de souvenir. On relance le test : il passe.
- [ ] **Commit** « Souvenirs : zoom et déplacement en plein écran ».

### Tâche 3 : photo du tableau, données et store
**Fichiers :**
- `supabase/setup.sql` : la table `covers`.
- `js/souvenirs/logic.js` : `pickCover(items, coverId) → item | null`.
- `js/souvenirs/fake.js` et `js/souvenirs/supabase.js` : `paintingPhotos()` et `setCover()`.
- Tests : `tests/souvenirs.test.mjs` ; e2e `store.mjs`.

**Étapes :**
- [ ] **Tests** :
  - `pickCover` : la photo choisie, sinon la première photo (une vidéo plus ancienne est ignorée), sinon `null` ; un choix qui pointe sur un id absent → la première ;
  - SQL : `create table if not exists public.covers`, `references public.souvenirs(id) on delete cascade`, le grant, 4 règles avec l'e-mail ;
  - e2e : `setCover` sur A, puis `paintingPhotos()` sur B → l'id choisi ; suppression de cette photo → retour à la première.

  On les lance, ils échouent.
- [ ] **Code** :
  - Supabase : `upsert({ match_date, souvenir_id }, { onConflict: "match_date" })` ;
  - `paintingPhotos` lit les photos (`kind = photo`) et `covers`, choisit avec `pickCover`, puis signe les vignettes en un seul appel.

  On relance les tests : ils passent.
- [ ] **Commit** « Souvenirs : photo du tableau (données) ».

### Tâche 4 : la photo sur le tableau, et le bouton ⭐
**Fichiers :**
- `js/gallery3d/textures.js` : `paintingCanvas(match, ctx, photo = null)`.
- `js/gallery3d/room.js` : `setPainting(i, canvas)`.
- `js/museum3d.js` : `refreshPaintings()`, appelé à la fin du chargement et à la fermeture d'un panneau, avec `data-covers`.
- `js/gallery3d/viewer.js` et `js/gallery3d/souvenirs.js` : le bouton ⭐.
- `js/content.js` : les textes.
- Tests : e2e `covers.mjs` ; `textures.mjs`, avec une capture du rendu.

**Étapes :**
- [ ] **Test** `covers.mjs`, sur le faux serveur, avec deux téléphones :
  - A déverrouillé ajoute deux photos au match de Toulouse → à la fermeture, `data-covers` contient `2026-03-22` ;
  - dans le plein écran de la 2e photo : « ⭐ Mettre sur le tableau » → le bouton devient « ⭐ Sur le tableau » ;
  - B déverrouillé ouvre puis ferme un panneau → `data-covers` contient la date ;
  - un 3e téléphone sans code → `data-covers` vide ;
  - point 5 : une photo ajoutée à Bayonne → pas dans `data-covers` ;
  - point 1 : le lien de la vignette renvoie une erreur (requête bloquée) → aucune erreur, pas dans `data-covers` ;
  - point 3 : la photo du tableau supprimée → après fermeture, le tableau montre l'autre photo.

  On le lance, il échoue.
- [ ] **Code** :
  - l'image est chargée avec `crossOrigin = "anonymous"`, avant de la dessiner dans la toile ;
  - `setPainting` remplace la texture et libère l'ancienne ;
  - le bouton ⭐ n'apparaît que pour les photos.

  On relance le test : il passe. On regarde la capture du tableau.
- [ ] **Commit** « Galerie 3D : la photo du match sur le tableau ».

### Tâche 5 : README, vérification, relecture, mise en ligne
- [ ] **README** : la photo du tableau, ⭐, le zoom, et qu'il faut relancer `setup.sql`.
- [ ] **Vérification** : `npm test`, puis tous les scripts e2e.
- [ ] **Relecture** indépendante, puis on corrige ce qui est important.
- [ ] **Avec Kevin** : il relance le SQL, puis on fait l'essai réel (`supabase-smoke.mjs` avec `paintingPhotos`), et on pousse avec son accord.
