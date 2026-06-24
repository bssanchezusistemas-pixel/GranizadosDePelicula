-- ============================================
-- Cierre unificado: caja + domicilios en un solo snapshot
-- Ejecutar en Supabase → SQL Editor (después de 010)
-- ============================================

alter table public.cierres_diarios
  drop constraint if exists cierres_diarios_tipo_check;

alter table public.cierres_diarios
  add constraint cierres_diarios_tipo_check
  check (tipo in ('caja', 'domicilios', 'unificado'));
