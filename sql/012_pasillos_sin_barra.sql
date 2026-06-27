-- ============================================
-- Pasillos (ex bancos), sin barra, pedidos cancelados
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- 1) Quitar constraint ANTES de cambiar tipos (si no, 'pasillo' falla)
alter table public.ubicaciones drop constraint if exists ubicaciones_tipo_check;

-- 2) Renombrar bancos → pasillos
update public.ubicaciones
set tipo = 'pasillo', label = 'Pasillo ' || numero::text
where tipo = 'banco';

-- 3) Quitar barra
delete from public.ubicaciones where tipo = 'barra';

-- 4) Nuevo constraint
alter table public.ubicaciones
  add constraint ubicaciones_tipo_check
  check (tipo in ('mesa', 'pasillo'));

-- 5) Estado cancelado en pedidos de caja
alter table public.pedidos_caja drop constraint if exists pedidos_caja_estado_check;
alter table public.pedidos_caja
  add constraint pedidos_caja_estado_check
  check (estado in ('abierto', 'cerrado', 'cancelado'));
