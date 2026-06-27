-- ============================================
-- Caja, meseros, ubicaciones y cocina
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- Meseros
create table if not exists public.meseros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Ubicaciones: mesas y pasillos
create table if not exists public.ubicaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('mesa', 'pasillo')),
  numero integer,
  label text not null unique,
  estado text not null default 'libre' check (estado in ('libre', 'ocupada')),
  pedido_abierto_id uuid,
  creado_en timestamptz not null default now()
);

-- Pedidos de caja
create table if not exists public.pedidos_caja (
  id uuid primary key default gen_random_uuid(),
  numero_pedido integer not null,
  mesero_id uuid references public.meseros(id),
  tipo_entrega text not null check (tipo_entrega in ('mesa', 'recoger', 'domicilio')),
  ubicacion_id uuid references public.ubicaciones(id),
  nombre_recoge text,
  direccion text,
  forma_pago text not null check (forma_pago in ('efectivo', 'transferencia')),
  total numeric(10,0) not null default 0,
  estado text not null default 'abierto' check (estado in ('abierto', 'cerrado', 'cancelado')),
  paga_con numeric(10,0),
  devuelta numeric(10,0),
  comision_pagada_por text check (comision_pagada_por in ('cliente', 'restaurante')),
  creado_en timestamptz not null default now(),
  cerrado_en timestamptz
);

alter table public.ubicaciones
  drop constraint if exists ubicaciones_pedido_abierto_id_fkey;

alter table public.ubicaciones
  add constraint ubicaciones_pedido_abierto_id_fkey
  foreign key (pedido_abierto_id) references public.pedidos_caja(id) on delete set null;

-- Items del pedido
create table if not exists public.pedido_items_caja (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_caja(id) on delete cascade,
  producto_id text not null,
  nombre text not null,
  cantidad integer not null default 1 check (cantidad > 0),
  precio_unitario numeric(10,0) not null,
  categoria_id text,
  sin_ingredientes text[] not null default '{}',
  notas_extra text,
  estado_cocina text not null default 'pendiente' check (estado_cocina in ('pendiente', 'listo')),
  creado_en timestamptz not null default now()
);

create index if not exists idx_pedidos_caja_creado on public.pedidos_caja(creado_en);
create index if not exists idx_pedidos_caja_estado on public.pedidos_caja(estado);
create index if not exists idx_pedido_items_pedido on public.pedido_items_caja(pedido_id);
create index if not exists idx_ubicaciones_estado on public.ubicaciones(estado);

-- Secuencia diaria de número de pedido (por fecha en app)
create sequence if not exists public.pedidos_caja_numero_seq start 5750;

-- Meseros iniciales
insert into public.meseros (nombre) values ('Estefani'), ('Andrea')
on conflict (nombre) do nothing;

-- 16 mesas
insert into public.ubicaciones (tipo, numero, label)
select 'mesa', n, 'Mesa ' || n
from generate_series(1, 16) as n
on conflict (label) do nothing;

-- 3 pasillos
insert into public.ubicaciones (tipo, numero, label)
select 'pasillo', n, 'Pasillo ' || n
from generate_series(1, 3) as n
on conflict (label) do nothing;

-- Realtime para cocina
alter publication supabase_realtime add table public.pedidos_caja;
alter publication supabase_realtime add table public.pedido_items_caja;
alter publication supabase_realtime add table public.ubicaciones;
