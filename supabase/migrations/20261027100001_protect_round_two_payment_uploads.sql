-- No participant/order/file data is deleted or repriced by this migration.
update public.events set team_max=4 where id='s4-18' and team_max=3;

-- Storage INSERT and draft REMOVE serialize on the same entry. A signed
-- upload is a capability: its final insert can bypass RLS after URL issuance.
-- Enforce the entry/path invariant in a private trigger, including that route.
-- This never edits Storage metadata or bytes; it only accepts/rejects INSERT.
create or replace function round_two_private.guard_file_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.round_two_entries;
begin
  select * into e from public.round_two_entries
    where id::text=split_part(new.name,'/',2) and user_id::text=split_part(new.name,'/',1) for key share;
  if not found or not (e.payment_status='draft' or e.payment_status='rejected' or e.submission_status='rejected') then
    raise exception 'Round 2 entry no longer accepts uploads. Refresh My Events.' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function round_two_private.guard_file_insert() from public, anon, authenticated;

drop trigger if exists round_two_file_insert_guard on storage.objects;
create trigger round_two_file_insert_guard before insert on storage.objects
  for each row when (new.bucket_id in ('round-two-abstracts','round-two-payments'))
  execute function round_two_private.guard_file_insert();

create or replace function public.remove_draft_round_two(p_entry_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.round_two_entries; r public.registrations; o public.orders;
begin
  if auth.uid() is null then raise exception 'Sign in to continue' using errcode='28000'; end if;
  select * into e from public.round_two_entries where id=p_entry_id and user_id=auth.uid() for update;
  if not found then raise exception 'Round 2 entry not found' using errcode='42501'; end if;
  if e.payment_status<>'draft' or e.submission_status<>'draft'
     or exists(select 1 from public.round_two_attempts where entry_id=e.id) then
    raise exception 'Submitted entries cannot be removed. Contact the organisers.';
  end if;
  if exists(select 1 from storage.objects where bucket_id='round-two-payments'
    and split_part(name,'/',1)=e.user_id::text and split_part(name,'/',2)=e.id::text) then
    raise exception 'Payment proof is already uploaded. Keep this entry and contact the organisers.';
  end if;
  select * into strict r from public.registrations where id=e.registration_id;
  select * into strict o from public.orders where id=r.order_id for update;
  delete from public.round_two_entries where id=e.id;
  if o.pricing_phase='round2' and o.status='approved' and o.total=0
     and (select count(*) from public.registrations where order_id=o.id)=1
     and (select count(*) from public.order_lines where order_id=o.id)=1
     and exists(select 1 from public.order_lines where order_id=o.id and event_id=e.event_id and context='Round 2 registration') then
    delete from public.orders where id=o.id;
  end if;
end;
$$;
revoke all on function public.remove_draft_round_two(uuid) from public, anon;
grant execute on function public.remove_draft_round_two(uuid) to authenticated;
