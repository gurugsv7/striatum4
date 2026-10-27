-- Extend the existing signed-upload guard only for extra abstracts.
-- Payment proof uploads stay locked after the original submission.
create or replace function round_two_private.guard_file_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.round_two_entries;
begin
 select * into e from public.round_two_entries
 where id::text=split_part(new.name,'/',2) and user_id::text=split_part(new.name,'/',1)
 for key share;
 if not found then
  raise exception 'Round 2 entry no longer accepts uploads. Refresh My Events.' using errcode='42501';
 end if;
 if not (e.payment_status='draft' or e.payment_status='rejected' or e.submission_status='rejected')
    and not (new.bucket_id='round-two-abstracts' and exists(
       select 1 from public.round_two_attempts a where a.entry_id=e.id)) then
  raise exception 'Round 2 entry no longer accepts uploads. Refresh My Events.' using errcode='42501';
 end if;
 return new;
end; $$;
revoke all on function round_two_private.guard_file_insert() from public,anon,authenticated;
