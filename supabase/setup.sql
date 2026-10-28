-- Souvenirs partagés du Swap de Cyrielle : à coller une fois dans Supabase → SQL Editor → Run.
-- On peut le relancer sans risque : chaque étape vérifie ce qui existe déjà.
-- Seul le compte partagé (connecté avec le code) peut lire, ajouter ou supprimer. Les visiteurs sans code : rien.

-- ── La table des souvenirs : une ligne par photo, vidéo ou note ──
create table if not exists public.souvenirs (
  id uuid primary key default gen_random_uuid(),
  match_date text not null,                -- "2026-03-22" : la date du match, sa clé dans le site
  kind text not null check (kind in ('photo', 'video', 'note')),
  path text,                               -- le fichier en grand, dans le stockage
  thumb text,                              -- la vignette
  text text,                               -- la note
  author text not null check (char_length(author) between 1 and 40),
  device text not null,                    -- le téléphone qui l'a ajouté (pour sa petite ×)
  width int,
  height int,
  created_at timestamptz not null default now(),
  constraint note_text check (kind <> 'note' or (text is not null and char_length(text) between 1 and 500)),
  constraint media_files check (kind = 'note' or path is not null)
);
create index if not exists souvenirs_match on public.souvenirs (match_date, created_at);

alter table public.souvenirs enable row level security;
revoke all on public.souvenirs from anon;

drop policy if exists "souvenirs lecture" on public.souvenirs;
create policy "souvenirs lecture" on public.souvenirs for select to authenticated using (true);
drop policy if exists "souvenirs ajout" on public.souvenirs;
create policy "souvenirs ajout" on public.souvenirs for insert to authenticated with check (true);
drop policy if exists "souvenirs suppression" on public.souvenirs;
create policy "souvenirs suppression" on public.souvenirs for delete to authenticated using (true);

-- ── Le stockage des fichiers : privé, 50 Mo par fichier, photos JPEG et vidéos MP4 / MOV ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('souvenirs', 'souvenirs', false, 52428800, array['image/jpeg', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "souvenirs fichiers lecture" on storage.objects;
create policy "souvenirs fichiers lecture" on storage.objects for select to authenticated using (bucket_id = 'souvenirs');
drop policy if exists "souvenirs fichiers ajout" on storage.objects;
create policy "souvenirs fichiers ajout" on storage.objects for insert to authenticated with check (bucket_id = 'souvenirs');
drop policy if exists "souvenirs fichiers suppression" on storage.objects;
create policy "souvenirs fichiers suppression" on storage.objects for delete to authenticated using (bucket_id = 'souvenirs');

-- ── En direct : les ajouts et suppressions arrivent tout seuls sur les autres téléphones ──
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'souvenirs') then
    alter publication supabase_realtime add table public.souvenirs;
  end if;
end $$;
