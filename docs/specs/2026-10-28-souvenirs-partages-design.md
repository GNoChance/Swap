# Souvenirs partagés : design

Validé par Kevin le 2026-10-28 (questions puis design dans la conversation). Le panneau « En savoir plus » de la galerie 3D (`js/gallery3d/souvenirs.js`) cesse de lire `content.js`. Photos, vidéos et notes sont envoyées et lues dans Supabase, et partagées en direct avec tous ceux qui ont le code.

## Choix de Kevin

| Sujet | Choix |
|---|---|
| Back-end | Supabase (offre gratuite : 1 Go de fichiers, 50 Mo max par fichier, direct) |
| Ajouter | Code secret partagé, tapé une fois par téléphone ; prénom demandé au premier ajout |
| Voir | Code demandé aussi : souvenirs privés, flou et 🔒 sans le code |
| Interface d'ajout | Polaroïd « + Ajouter » au bout de la rangée ; glisser-déposer sur PC |
| Vidéos | Jusqu'à 50 Mo ; au-delà, message « Vidéo trop lourde » |
| Suppression | Par son auteur, c'est-à-dire « ajouté depuis ce téléphone » (confiance) ; tout le reste depuis le tableau de bord Supabase |
| Notes | Cartes signées, 500 caractères max, dans l'ordre d'écriture, pas de modification |
| Compte Supabase | Kevin le crée avec ce guide ; il choisit le code dans Supabase, jamais dans le code du site |

À garder tel quel (déjà en place) : avatars à environ un quart de l'écran, zoom discret en portrait, cartels sur deux lignes, marge sous « ← Accueil », toiles en couleurs exactes, cimaise en haut, mobilier qui ne cache pas les cartels, logos de Castres et Pau en PNG.

## Expérience

### Panneau verrouillé (pas encore de code sur ce téléphone)
- Trois polaroïds floutés, 🔒 « Souvenirs privés » et un bouton « Entrer le code ».
- Le bouton ouvre un petit formulaire dans le panneau : champ code (masqué), « Valider ».
- Erreurs : « Code incorrect », « Pas de réseau, réessaie ».
- Une fois validé, le téléphone reste connecté (session Supabase gardée).

### Panneau déverrouillé
- **Les photos et vidéos** forment une rangée de polaroïds, triés par date d'ajout (le plus ancien d'abord), avec le prénom de l'auteur en légende. Les vidéos ont un ▶ sur leur vignette.
- **Les notes** sont en dessous, en citations signées (« ❝ … ❞ — Cyrielle »), dans l'ordre d'écriture.
- **Sans aucun souvenir**, le panneau affiche le texte actuel (« Souvenirs à venir », et « Rendez-vous le … » pour un match à venir), avec le polaroïd « + ».
- **Le polaroïd « + Ajouter »** est toujours en dernier dans la rangée. Un toucher ouvre un petit menu :
  - 📷 « Photo ou vidéo » ouvre le sélecteur de l'iPhone (galerie ou appareil photo), avec plusieurs fichiers possibles ;
  - ✎ « Écrire une note » ouvre un champ de 500 caractères avec compteur, et un bouton « Publier ».
- **Au premier ajout** sur ce téléphone, le site demande « Ton prénom ? », puis le retient.
- **Sur PC**, on peut glisser-déposer des fichiers sur le panneau.
- **Pendant l'envoi**, le polaroïd apparaît tout de suite avec une jauge de progression. S'il échoue, il affiche « Échec · Réessayer ». Une vidéo de plus de 50 Mo, ou un fichier qui n'est ni une image ni une vidéo, est refusé avec un message clair et n'est pas envoyé.
- **Voir en grand** : un toucher sur un polaroïd ouvre la photo ou la vidéo en plein écran, avec le prénom et la date. On glisse ou on utilise les flèches pour passer d'un souvenir à l'autre. Les vidéos se lisent dans la page, avec le son. « × » ou Échap pour fermer.
- **Suppression** : une petite × sur ce qui a été ajouté depuis ce téléphone (polaroïd ou note), puis « Supprimer ce souvenir ? ». La suppression retire la ligne et ses fichiers.
- **En direct** : un ajout ou une suppression faits sur un autre téléphone s'appliquent tout seuls dans un panneau ouvert.
- **Compteur** : une fois le code entré, le bouton devient « En savoir plus · 3 » si le match a des souvenirs.

### Avant que Supabase soit configuré
Le site se comporte exactement comme aujourd'hui (« Souvenirs à venir », pas de « + », pas de code).

## Médias

- **Photos** :
  - réduites sur le téléphone avant l'envoi, à 2 048 px pour la version grande et 512 px pour la vignette, en JPEG qualité 0,82 ;
  - l'orientation de la photo est respectée ;
  - les photos HEIC de l'iPhone sont décodées par Safari, puis réencodées en JPEG.
- **Vidéos** :
  - envoyées telles quelles si elles font 50 Mo ou moins (MP4 ou MOV) ;
  - une vignette JPEG de 512 px est extraite d'une image du début de la vidéo ;
  - si l'extraction échoue, la vignette est une carte ▶ neutre.
- **Types acceptés** : `image/*` et `video/mp4`, `video/quicktime`.

## Données (Supabase)

### Table `souvenirs`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `uuid`, par défaut `gen_random_uuid()` | identifiant |
| `match_date` | `text` | `"2026-03-22"`, la clé du match dans `content.museum.matches` |
| `kind` | `text` | `photo`, `video` ou `note` |
| `path` | `text` | fichier grand dans le stockage, null pour une note |
| `thumb` | `text` | vignette dans le stockage, null pour une note |
| `text` | `text` | la note, null sinon |
| `author` | `text` | prénom, 40 caractères max |
| `device` | `text` | identifiant aléatoire du téléphone qui a ajouté |
| `width`, `height` | `int` | dimensions de la photo ou de la vidéo |
| `created_at` | `timestamptz`, par défaut `now()` | date d'ajout |

### Contraintes de la table
- `kind` vaut `photo`, `video` ou `note`.
- Une note a un texte de 1 à 500 caractères.
- Une photo ou une vidéo a `path` et `thumb`.

### Stockage
- Bucket privé `souvenirs`, avec une limite de 50 Mo par fichier.
- Types autorisés : `image/jpeg`, `video/mp4`, `video/quicktime`.
- Chemins : `<match_date>/<id>-full.jpg`, `<match_date>/<id>-thumb.jpg`, `<match_date>/<id>.mp4` ou `.mov`.

### Règles d'accès (RLS)
- Seul le rôle `authenticated` peut lire, ajouter et supprimer, que ce soit dans la table ou dans le bucket.
- Le rôle `anon` n'a aucun accès.

### Direct et inscriptions
- **Direct** : la table est ajoutée à la publication `supabase_realtime`.
- **Inscriptions** désactivées par Kevin, qui crée lui-même un seul compte partagé :
  - e-mail `famille@swap-cyrielle.app` (une adresse factice, rien n'y est jamais envoyé) ;
  - mot de passe = le code.

## Sécurité

- **Le code** :
  - c'est le mot de passe du compte partagé ;
  - le site le tape via `signInWithPassword` ;
  - il n'est jamais écrit dans le dépôt ;
  - Supabase limite les tentatives.
- **La clé dans le site** : l'adresse du projet et la clé publique (`anon`) sont dans `js/souvenirs-config.js`. C'est prévu ainsi : la protection vient des règles d'accès.
- **Affichage** : les fichiers s'affichent par liens signés, valables 1 h, rafraîchis à chaque ouverture du panneau.
- **Suppression par « l'auteur »** : elle est vérifiée sur le téléphone seulement (`device`). C'est de la confiance, comme convenu. La base autorise toute suppression à qui a le code.
- **Aucune donnée de billet n'entre dans la base.**

## Architecture

| Fichier | Rôle |
|---|---|
| `js/souvenirs/logic.js` | Fonctions pures, testées sous Node : valider un fichier ou une note, dimensions de réduction, chemins, tri, « ajouté ici », comptes par match |
| `js/souvenirs/media.js` | Navigateur : réduire une photo, extraire la vignette d'une vidéo |
| `js/souvenirs/store.js` | `createStore()` : choisit le branchement selon la config et l'adresse ; interface commune |
| `js/souvenirs/supabase.js` | Branchement réel (supabase-js 2.117.3 copié dans `js/vendor/supabase.js`, chargé à la demande ; envoi par XHR pour la progression) |
| `js/souvenirs/fake.js` | Faux branchement local pour les tests et la démo (`?souvenirs=fake`) : code `test-code`, données dans `localStorage`, direct par `BroadcastChannel` |
| `js/souvenirs-config.js` | `{ url, anonKey, email }`, vide tant que Kevin n'a pas configuré |
| `js/gallery3d/souvenirs.js` | Le panneau : verrou, rangée, notes, « + », envoi, suppression, direct |
| `js/gallery3d/viewer.js` | Plein écran photo et vidéo |
| `supabase/setup.sql` | Table, contraintes, bucket, règles, direct ; à coller une fois |

**Interface du store** (les deux branchements)

| Méthode | Rôle |
|---|---|
| `isUnlocked()` | `Promise<boolean>` |
| `unlock(code)` | `Promise<void>` ; rejette `"bad-code"` ou `"network"` |
| `list(matchDate)` | `Promise<Item[]>`, avec `url` et `thumbUrl` signés |
| `counts()` | `Promise<Record<matchDate, number>>` |
| `addMedia(matchDate, file, { author, onProgress })` | `Promise<Item>` |
| `addNote(matchDate, text, { author })` | `Promise<Item>` |
| `remove(item)` | `Promise<void>` |
| `subscribe(matchDate, onChange)` | renvoie `unsubscribe()` |
| `deviceId` | identifiant du téléphone |

**Choix du branchement**
- `?souvenirs=fake` donne le faux. En faux, `&device=x` simule un autre téléphone.
- Sinon, si `url` et `anonKey` sont renseignés, c'est Supabase.
- Sinon `null`, et le panneau reste comme aujourd'hui.

**`content.js`** : les champs `photos` et `story` des matchs disparaissent (ils étaient vides). Les nouveaux textes vont dans `content.museum.souvenirsUi`.

## Bugs corrigés dans la même série

1. **À-coup au premier tableau.** Le spot reste toujours visible, et on l'« éteint » avec `intensity = 0`. Le nombre de programmes de shaders ne change plus à la première arrivée.
2. **Erreurs console si on quitte pendant la fermeture du panneau.** Plus de rendu après le départ : `renderNow` et `closeSouvenirs` vérifient `left`.
3. **Double toucher sur le bouton de la galerie.** `openMuseum` ignore un second appel tant que le premier est en cours, et la sonde WebGL libère son contexte.
4. **Échange de places trop rapide sur un écran à 120 Hz.** L'échange dure 0,35 s quelle que soit la fréquence d'images.
5. **Applaudissements après avoir quitté.** Les minuteurs de son sont suivis et annulés dans `leave()`.
6. **La sieste ne se relance pas.** Elle est réarmée à la fermeture du panneau.

## Vérifications

**Tests unitaires** (`tests/souvenirs.test.mjs`)
- Types et tailles de fichiers, jusqu'à 50 Mo inclus, 50 Mo + 1 octet refusé.
- Dimensions de réduction : paysage, portrait, petite image non agrandie.
- Notes vides, de 500 caractères, de 501 caractères.
- Chemins de stockage, tri, « ajouté ici », comptes par match.
- Échange de places indépendant de la fréquence d'images.

**De bout en bout** (`souvenirs.mjs`, faux branchement, deux pages = deux téléphones)
- Verrou, code faux puis code juste.
- Prénom demandé une fois.
- Une note sur A apparaît en direct sur B.
- Photo envoyée avec progression, puis visible sur B.
- Vidéo de test envoyée avec sa vignette.
- Fichier de 60 Mo refusé.
- × visible seulement chez l'auteur, suppression propagée à B.
- Plein écran et défilement.
- Compteur « · n ».
- Sans configuration : le panneau comme aujourd'hui.

**Bugs** (`fixes2.mjs`) : un test qui échoue d'abord pour chacun des 6.

**Non-régression** : tous les anciens scripts de bout en bout.

**Vrai Supabase**, une fois configuré : un script d'essai qui ajoute, lit et supprime une note test avec le code (tapé par Kevin, ou fourni à la volée et jamais enregistré).

## Hors périmètre

- Modifier une note : on supprime et on réécrit.
- Comptes individuels, modération.
- Compresser les vidéos dans le navigateur.
- Envoi reprenable pour les gros fichiers.
- Garder des souvenirs hors ligne.
