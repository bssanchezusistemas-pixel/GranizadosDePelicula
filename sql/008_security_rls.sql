-- ============================================
-- Seguridad: RLS más restrictivo + RPC atómico
-- Ejecutar en Supabase → SQL Editor después de 006
-- ============================================

-- Quitar lectura pública de pedidos (PII: direcciones, pagos)
drop policy if exists anon_select_pedidos_caja on public.pedidos_caja;
drop policy if exists anon_select_pedido_items_caja on public.pedido_items_caja;
drop policy if exists anon_select_ubicaciones on public.ubicaciones;

-- Meseros: solo activos (para pantalla de login)
drop policy if exists anon_select_meseros on public.meseros;
create policy anon_select_meseros_active on public.meseros
  for select to anon
  using (activo = true);

-- Incremento atómico del total (evita condición de carrera en mesa)
create or replace function public.increment_pedido_total(
  p_pedido_id uuid,
  p_amount numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total numeric;
begin
  update public.pedidos_caja
  set total = total + p_amount
  where id = p_pedido_id
  returning total into new_total;

  if new_total is null then
    raise exception 'Pedido no encontrado';
  end if;

  return new_total;
end;
$$;

revoke all on function public.increment_pedido_total(uuid, numeric) from public;
grant execute on function public.increment_pedido_total(uuid, numeric) to service_role;

-- Índice cocina (por si 007 no se ejecutó)
create index if not exists idx_pedido_items_pendientes
  on public.pedido_items_caja (creado_en)
  where estado_cocina = 'pendiente';

create index if not exists idx_pedidos_caja_dia_numero
  on public.pedidos_caja (creado_en, numero_pedido desc);
