-- Only unfinished Round 2 entries may be removed, matching Workshop's unpaid-entry flow.
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
  select * into strict r from public.registrations where id=e.registration_id;
  select * into strict o from public.orders where id=r.order_id for update;
  delete from public.round_two_entries where id=e.id;
  if o.pricing_phase='round2' and o.status='approved' and o.total=0
    and (select count(*) from public.registrations where order_id=o.id)=1
    and (select count(*) from public.order_lines where order_id=o.id)=1
    and exists(select 1 from public.order_lines where order_id=o.id
      and event_id=e.event_id and context='Round 2 registration')
  then delete from public.orders where id=o.id;
  end if;
end; $$;
revoke all on function public.remove_draft_round_two(uuid) from public,anon;
grant execute on function public.remove_draft_round_two(uuid) to authenticated;
