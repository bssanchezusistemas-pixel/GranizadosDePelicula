-- Enlace pedidos de caja con pedidos de domicilios
-- Ejecutar en Supabase → SQL Editor

alter table public.pedidos_domicilio
  add column if not exists pedido_caja_id uuid references public.pedidos_caja(id) on delete set null;

create index if not exists idx_pedidos_domicilio_pedido_caja
  on public.pedidos_domicilio (pedido_caja_id)
  where pedido_caja_id is not null;
