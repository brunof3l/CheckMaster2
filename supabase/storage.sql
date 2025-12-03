insert into storage.buckets (id, name, public)
values ('checklists', 'checklists', false)
on conflict (id) do nothing;

create policy storage_checklists_select_authenticated on storage.objects
  for select to authenticated
  using (bucket_id = 'checklists' and auth.uid() is not null);

create policy storage_checklists_insert_authenticated on storage.objects
  for insert to authenticated
  with check (bucket_id = 'checklists' and auth.uid() is not null);

create policy storage_checklists_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'checklists' and public.is_admin());

