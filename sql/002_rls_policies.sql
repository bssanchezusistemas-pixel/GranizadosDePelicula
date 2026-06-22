-- ============================================
-- RLS: acceso panel admin (usuarios autenticados)
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- Domiciliarios
drop policy if exists "authenticated_select_domiciliarios" on public.domiciliarios;
drop policy if exists "authenticated_insert_domiciliarios" on public.domiciliarios;
drop policy if exists "authenticated_update_domiciliarios" on public.domiciliarios;
drop policy if exists "authenticated_delete_domiciliarios" on public.domiciliarios;

create policy "authenticated_select_domiciliarios"
  on public.domiciliarios for select to authenticated using (true);
create policy "authenticated_insert_domiciliarios"
  on public.domiciliarios for insert to authenticated with check (true);
create policy "authenticated_update_domiciliarios"
  on public.domiciliarios for update to authenticated using (true) with check (true);
create policy "authenticated_delete_domiciliarios"
  on public.domiciliarios for delete to authenticated using (true);

-- Turnos
drop policy if exists "authenticated_select_turnos" on public.turnos;
drop policy if exists "authenticated_insert_turnos" on public.turnos;
drop policy if exists "authenticated_update_turnos" on public.turnos;
drop policy if exists "authenticated_delete_turnos" on public.turnos;

create policy "authenticated_select_turnos"
  on public.turnos for select to authenticated using (true);
create policy "authenticated_insert_turnos"
  on public.turnos for insert to authenticated with check (true);
create policy "authenticated_update_turnos"
  on public.turnos for update to authenticated using (true) with check (true);
create policy "authenticated_delete_turnos"
  on public.turnos for delete to authenticated using (true);

-- Pedidos
drop policy if exists "authenticated_select_pedidos" on public.pedidos_domicilio;
drop policy if exists "authenticated_insert_pedidos" on public.pedidos_domicilio;
drop policy if exists "authenticated_update_pedidos" on public.pedidos_domicilio;
drop policy if exists "authenticated_delete_pedidos" on public.pedidos_domicilio;

create policy "authenticated_select_pedidos"
  on public.pedidos_domicilio for select to authenticated using (true);
create policy "authenticated_insert_pedidos"
  on public.pedidos_domicilio for insert to authenticated with check (true);
create policy "authenticated_update_pedidos"
  on public.pedidos_domicilio for update to authenticated using (true) with check (true);
create policy "authenticated_delete_pedidos"
  on public.pedidos_domicilio for delete to authenticated using (true);

-- Datos de ejemplo (solo si la tabla está vacía)
insert into public.domiciliarios (nombre, telefono, activo)
select 'Pedro', '3001112222', true
where not exists (select 1 from public.domiciliarios where nombre = 'Pedro');

insert into public.domiciliarios (nombre, telefono, activo)
select 'Luis', '3003334444', true
where not exists (select 1 from public.domiciliarios where nombre = 'Luis');
