-- ============================================
-- Cierres diarios: snapshot al reiniciar operación
-- Ejecutar en Supabase → SQL Editor
-- ============================================

create table if not exists public.cierres_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('caja', 'domicilios')),
  pedidos_caja_count integer not null default 0,
  pedidos_domicilio_count integer not null default 0,
  totales jsonb not null default '{}'::jsonb,
  cerrado_en timestamptz not null default now()
);

create index if not exists idx_cierres_diarios_fecha
  on public.cierres_diarios (fecha desc);

alter table public.cierres_diarios enable row level security;

drop policy if exists auth_all_cierres_diarios on public.cierres_diarios;
create policy auth_all_cierres_diarios on public.cierres_diarios
  for all to authenticated
  using (true) with check (true);
