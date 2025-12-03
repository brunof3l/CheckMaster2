create or replace function public.get_next_checklist_seq() returns bigint language sql volatile as $$
  select nextval('public.checklist_seq');
$$;

create or replace function public.finalize_checklist(cid uuid) returns void language plpgsql security definer as $$
begin
  update public.checklists
  set status = 'finalizado', is_locked = true, updated_at = now()
  where id = cid;
end;
$$;

