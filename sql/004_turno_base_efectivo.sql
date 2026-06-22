-- Base de cambio entregada al domiciliario al iniciar la jornada
alter table public.turnos
  add column if not exists base_efectivo numeric(10,0) not null default 0;
