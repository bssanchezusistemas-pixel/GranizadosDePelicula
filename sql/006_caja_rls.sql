-- ============================================
-- RLS: caja, meseros, cocina
-- Ejecutar después de 005_caja_cocina.sql
-- ============================================

alter table public.meseros enable row level security;
alter table public.ubicaciones enable row level security;
alter table public.pedidos_caja enable row level security;
alter table public.pedido_items_caja enable row level security;

-- Admin autenticado: acceso total
do $$ declare t text; begin
  foreach t in array array['meseros','ubicaciones','pedidos_caja','pedido_items_caja'] loop
    execute format('drop policy if exists auth_all_%I on public.%I', t, t);
    execute format(
      'create policy auth_all_%I on public.%I for all to authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- Lectura pública para cocina (realtime en tablet) y login meseros
do $$ declare t text; begin
  foreach t in array array['meseros','ubicaciones','pedidos_caja','pedido_items_caja'] loop
    execute format('drop policy if exists anon_select_%I on public.%I', t, t);
    execute format(
      'create policy anon_select_%I on public.%I for select to anon using (true)',
      t, t
    );
  end loop;
end $$;

-- Escrituras de mesero/caja vía server actions (service role) o admin autenticado.
-- Si usas solo anon key en server actions, añade SUPABASE_SERVICE_ROLE_KEY en .env.local
