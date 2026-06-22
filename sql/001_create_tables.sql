-- ============================================
-- Granizados de Película — Sistema de domicilios
-- Tablas para Supabase (PostgreSQL)
-- ============================================

-- 1. Domiciliarios
create table domiciliarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- 2. Turnos (un domiciliario puede tener varios turnos, uno por día)
create table turnos (
  id uuid primary key default gen_random_uuid(),
  domiciliario_id uuid not null references domiciliarios(id),
  fecha date not null default current_date,
  hora_inicio timestamptz not null default now(),
  hora_fin timestamptz,
  efectivo_entregado numeric(10,0) default 0,
  cuadrado boolean not null default false,
  creado_en timestamptz not null default now()
);

-- 3. Pedidos de domicilio
create table pedidos_domicilio (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null,
  domiciliario_id uuid references domiciliarios(id),
  turno_id uuid references turnos(id),
  canal text not null check (canal in ('local', 'whatsapp', 'web')),
  items text,
  direccion text,
  valor_pedido numeric(10,0) not null,
  forma_pago text not null check (forma_pago in ('efectivo', 'transferencia')),
  paga_con numeric(10,0),
  devuelta numeric(10,0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_camino', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now(),
  entregado_en timestamptz
);

-- Índices útiles para las consultas del panel (filtrar por día y domiciliario)
create index idx_pedidos_domiciliario on pedidos_domicilio(domiciliario_id);
create index idx_pedidos_turno on pedidos_domicilio(turno_id);
create index idx_pedidos_creado_en on pedidos_domicilio(creado_en);
create index idx_turnos_fecha on turnos(fecha);

-- ============================================
-- Datos de ejemplo para probar el panel
-- ============================================
insert into domiciliarios (nombre, telefono, activo) values
  ('Pedro', '3001112222', true),
  ('Luis', '3003334444', true);
