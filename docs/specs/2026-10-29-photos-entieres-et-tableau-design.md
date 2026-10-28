# Photos entières, zoom, et photo sur le tableau : design

Validé par Kevin (questions, design, puis son croquis du tableau). Prolonge `2026-10-28-souvenirs-partages-design.md`.

## 1. Polaroïds à la forme de la photo
- Chaque polaroïd d'une photo ou d'une vidéo prend les proportions de son souvenir (`width` / `height` enregistrés), bornées entre 9:16 et 16:9. Tous ont la même hauteur de tirage : `min(21dvh, 170px)`.
- L'image est entière (`object-fit: contain`), sans rognage.
- Les polaroïds vides, « + Ajouter » et en cours d'envoi gardent le format 3:4.
- Nouvelles tailles des envois : grande **3072 px**, vignette **768 px**, JPEG 0,82. Les souvenirs déjà envoyés gardent leurs fichiers.

## 2. Plein écran : zoom et déplacement
- **Pincer à deux doigts** zoome de 1× à 4×, autour du point entre les doigts. **Glisser à un doigt** déplace la photo une fois zoomée. Le déplacement est borné : la photo ne quitte jamais l'écran.
- **Double toucher** zoome à 2,5× sur le point touché ; un second double toucher revient à 1×.
- **Glisser sur le côté** ne passe au souvenir suivant que si la photo est à 1×. Un glisser qui commence sur une vidéo ne compte pas (c'est son curseur).
- **Sur PC** : la molette zoome, la souris déplace, le double clic bascule.
- Le zoom revient à 1× quand on change de souvenir.
- Pour les tests : `data-zoom` sur `.g3d-viewer`.

## 3. La photo sur le tableau
- **Rendu** (le croquis de Kevin) : le tableau reste tel quel (aplats, date, deux médaillons). Un petit tirage carré est posé dans le **coin en bas à droite** de la toile :
  - environ 24 % de la largeur de la toile ;
  - il chevauche un peu l'aplat de l'adversaire et le passe-partout ;
  - fine bordure blanche et légère ombre ;
  - la photo est recadrée en carré, centrée.
- **Quelle photo :**
  - celle choisie pour le match, sinon la **première photo ajoutée** (par `created_at`), sinon aucune ;
  - les vidéos ne vont pas sur le tableau ;
  - si la photo choisie est supprimée, on revient à la première.
- **Choisir** : dans le plein écran d'une photo, le bouton « ⭐ Mettre sur le tableau ». Il devient « ⭐ Sur le tableau » (désactivé) quand c'est déjà la photo du tableau. Le choix vaut pour tout le monde.
- **Qui la voit** : seulement un téléphone où le code a été tapé. Sinon, ou en cas d'erreur, le tableau actuel.
- **Matchs à venir** : pas de photo, ils gardent leur drap.
- **Mise à jour** : à l'ouverture de la galerie (si déverrouillé) et à la fermeture d'un panneau. Rien n'est redessiné si la photo n'a pas changé.
- Pour les tests : `data-covers` sur `.screen-g3d`, la liste des dates de match dont le tableau porte une photo.

## 4. Données
- Nouvelle table `public.covers` :
  - `match_date text primary key` ;
  - `souvenir_id uuid not null references public.souvenirs(id) on delete cascade` ;
  - `updated_at timestamptz default now()`.
- Droits `select, insert, update, delete` pour `authenticated`, et règles réservées à `famille@swap-cyrielle.app`, comme pour `souvenirs`.
- `supabase/setup.sql` reste à relancer en entier, sans risque. Kevin le relance une fois.
- Le store gagne deux méthodes :
  - `paintingPhotos()` : pour chaque match qui a une photo, `{ id, url }`, où `url` est le lien signé de la vignette 768 px ;
  - `setCover(matchDate, id)`.

## 5. Vérifications
- **Tests unitaires** :
  - `pickCover` : la photo choisie, sinon la première, sinon aucune ; une vidéo est ignorée ; si le choix pointe sur une photo supprimée, on revient à la première ;
  - `shotRatio`, qui borne les proportions ;
  - le SQL de `covers`.
- **De bout en bout**, sur le faux serveur :
  - un polaroïd paysage est plus large qu'un portrait, et l'image est entière ;
  - un pincer et un double toucher changent `data-zoom` ;
  - glisser zoomé ne change pas de souvenir ;
  - « ⭐ » met la photo sur le tableau (`data-covers`) et change le tableau chez l'autre téléphone à sa prochaine fermeture de panneau ;
  - sans code, pas de photo sur les tableaux ;
  - photo de 48 Mpx → grande ≤ 3072 px, vignette ≤ 768 px.
- **Ensuite** : tous les anciens scripts, une relecture indépendante, puis l'essai sur le vrai projet.
