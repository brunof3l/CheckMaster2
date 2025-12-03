create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.suppliers enable row level security;
alter table public.checklists enable row level security;

create policy users_select_authenticated on public.users
  for select to authenticated
  using (auth.uid() is not null);

create policy users_write_admin on public.users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vehicles_select_authenticated on public.vehicles
  for select to authenticated
  using (auth.uid() is not null);

create policy vehicles_write_admin on public.vehicles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy suppliers_select_authenticated on public.suppliers
  for select to authenticated
  using (auth.uid() is not null);

create policy suppliers_write_admin on public.suppliers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy checklists_select_authenticated on public.checklists
  for select to authenticated
  using (auth.uid() is not null);

create policy checklists_insert_owner on public.checklists
  for insert to authenticated
  with check (new.created_by = auth.uid());

create policy checklists_update_unlocked on public.checklists
  for update to authenticated
  using (not is_locked)
  with check (not is_locked);

create policy checklists_delete_admin on public.checklists
  for delete to authenticated
  using (public.is_admin());

