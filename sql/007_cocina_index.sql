-- Índice parcial para cocina: solo items pendientes (100+ pedidos/día)
create index if not exists idx_pedido_items_pendientes
  on public.pedido_items_caja (creado_en)
  where estado_cocina = 'pendiente';
