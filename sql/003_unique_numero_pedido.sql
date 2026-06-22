-- Evita números de pedido duplicados (comanda POS única)
create unique index if not exists idx_pedidos_numero_pedido_unique
  on public.pedidos_domicilio (numero_pedido);
