-- ============================================
-- CMS de menú: categorías, productos, tamaños
-- Ejecutar en Supabase SQL Editor del proyecto en .env.local
-- Luego: npm run menu:seed
-- ============================================

create table if not exists public.menu_categories (
  id text primary key,
  label text not null,
  tagline text not null default '',
  accent_color text,
  sort_order integer not null default 0
);

create table if not exists public.menu_items (
  id text primary key,
  category_id text not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10, 0),
  badge text,
  image_url text,
  public_only boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_item_sizes (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.menu_items(id) on delete cascade,
  label text not null,
  price numeric(10, 0) not null,
  sort_order integer not null default 0,
  unique (item_id, label)
);

create index if not exists menu_items_category_idx on public.menu_items(category_id);
create index if not exists menu_items_active_idx on public.menu_items(active);
create index if not exists menu_item_sizes_item_idx on public.menu_item_sizes(item_id);

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_sizes enable row level security;

-- Lectura pública (sitio web)
drop policy if exists menu_categories_public_read on public.menu_categories;
create policy menu_categories_public_read on public.menu_categories
  for select to anon, authenticated using (true);

drop policy if exists menu_items_public_read on public.menu_items;
create policy menu_items_public_read on public.menu_items
  for select to anon, authenticated using (active = true);

drop policy if exists menu_item_sizes_public_read on public.menu_item_sizes;
create policy menu_item_sizes_public_read on public.menu_item_sizes
  for select to anon, authenticated using (true);

-- Admin autenticado: lectura de inactivos + escritura vía app (service role en server actions)
drop policy if exists menu_categories_auth_all on public.menu_categories;
create policy menu_categories_auth_all on public.menu_categories
  for all to authenticated using (true) with check (true);

drop policy if exists menu_items_auth_all on public.menu_items;
create policy menu_items_auth_all on public.menu_items
  for all to authenticated using (true) with check (true);

drop policy if exists menu_item_sizes_auth_all on public.menu_item_sizes;
create policy menu_item_sizes_auth_all on public.menu_item_sizes
  for all to authenticated using (true) with check (true);

-- Bucket para fotos subidas desde el panel (público lectura)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set public = true;

drop policy if exists menu_images_public_read on storage.objects;
create policy menu_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists menu_images_auth_upload on storage.objects;
create policy menu_images_auth_upload on storage.objects
  for all to authenticated
  using (bucket_id = 'menu-images')
  with check (bucket_id = 'menu-images');
