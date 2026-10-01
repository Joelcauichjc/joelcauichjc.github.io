-- Ejecutar una sola vez en Supabase > SQL Editor.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  tour text not null check (tour in ('Isla Mujeres Familiar', 'Isla Mujeres Solo Adultos', 'Chichén Itzá', 'Tulum', 'El Cielo, Cozumel', 'Coco Bongo')),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 15 and 1000),
  photos_data text[] not null default '{}'::text[]
    check (cardinality(photos_data) <= 5 and octet_length(array_to_string(photos_data, '')) <= 900000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía antes de agregar fotos, incorpora la columna.
alter table public.reviews add column if not exists photos_data text[] not null default '{}'::text[];
alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select (name, tour, rating, comment, photos_data, created_at) on public.reviews to anon;
grant insert (name, tour, rating, comment, photos_data) on public.reviews to anon;

create policy "Visitors read approved reviews"
  on public.reviews for select to anon using (approved = true);
create policy "Visitors submit pending reviews"
  on public.reviews for insert to anon with check (approved = false);

create index if not exists reviews_approved_recent
  on public.reviews (created_at desc) where approved = true;

-- Aprobar una reseña desde Table Editor cambiando approved a true.
-- Nunca expongas la secret key o service_role key en el sitio web.
