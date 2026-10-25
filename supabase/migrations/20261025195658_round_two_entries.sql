-- Additive Round 2 ledger. Never reprice or overwrite Round 1 records/files.
create schema if not exists round_two_private;
revoke all on schema round_two_private from public, anon, authenticated;

create table public.round_two_entries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id),
  user_id uuid not null references auth.users(id),
  event_id text not null references public.events(id),
  fee integer not null check (fee > 0),
  payment_status text not null default 'draft' check (payment_status in ('draft','under_review','approved','rejected')),
  submission_status text not null default 'draft' check (submission_status in ('draft','under_review','approved','rejected')),
  created_at timestamptz not null default now()
);
create table public.round_two_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_number bigint generated always as identity unique,
  entry_id uuid not null references public.round_two_entries(id),
  abstract_path text not null,
  abstract_name text not null,
  proof_path text not null,
  payment_status text not null check (payment_status in ('under_review','approved','rejected')),
  submission_status text not null check (submission_status in ('under_review','approved','rejected')),
  payment_reason text,
  submission_reason text,
  payment_reviewed_by uuid references auth.users(id),
  submission_reviewed_by uuid references auth.users(id),
  payment_reviewed_at timestamptz,
  submission_reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);
-- A retained, approved abstract may be reused after a payment rejection.
create index round_two_entries_user_idx on public.round_two_entries(user_id);
create index round_two_entries_event_idx on public.round_two_entries(event_id);
create index round_two_attempts_entry_idx on public.round_two_attempts(entry_id, submitted_at desc);
alter table public.round_two_entries enable row level security;
alter table public.round_two_attempts enable row level security;
revoke all on public.round_two_entries, public.round_two_attempts from anon, authenticated;
grant select on public.round_two_entries, public.round_two_attempts to authenticated;
create policy round_two_entries_read on public.round_two_entries for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy round_two_attempts_read on public.round_two_attempts for select to authenticated
  using (exists (select 1 from public.round_two_entries e where e.id = entry_id));

create function round_two_private.fee(p_event text, p_participation text)
returns integer language sql immutable set search_path = '' as $$
  select case p_event when 's4-14' then 400 when 's4-15' then 400
    when 's4-16' then case when p_participation = 'team' then 400 else 300 end
    when 's4-17' then case when p_participation = 'team' then 400 else 300 end
    when 's4-18' then 500 when 's4-19' then 300 end;
$$;

-- New participants get a registration anchor, not a fabricated Round 1 payment
-- or abstract. Existing participants pass their original registration ID.
create function public.start_round_two(p_event_id text, p_registration_id uuid default null, p_team jsonb default null)
returns public.round_two_entries language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); e public.events; r public.registrations;
  result public.round_two_entries; oid uuid; lid uuid; part text; n int;
begin
  if uid is null then raise exception 'Not authenticated' using errcode='28000'; end if;
  if round_two_private.fee(p_event_id, 'individual') is null then raise exception 'Round 2 is not available for this event'; end if;
  -- Serialises duplicate starts and capacity checks for the same event.
  select * into strict e from public.events where id=p_event_id for update;
  if p_registration_id is not null then
    select * into r from public.registrations where id=p_registration_id and user_id=uid and event_id=p_event_id;
    if not found then raise exception 'Registration not found' using errcode='42501'; end if;
  else
    if not e.registerable or e.status <> 'open' then raise exception 'Registration is closed'; end if;
    if exists(select 1 from public.registrations where user_id=uid and event_id=p_event_id) then
      raise exception 'Already registered. Continue Round 2 from My Events.';
    end if;
    if exists(select 1 from public.order_lines l join public.orders o on o.id=l.order_id
      where l.event_id=p_event_id and o.user_id=uid and o.status in ('awaiting_payment','payment_submitted','under_review')
      and public.order_hold_expires_at(o.status,o.created_at,o.submitted_at)>now()) then
      raise exception 'Finish your existing registration in My Events first.';
    end if;
    if e.slots is not null and public.event_seats_taken(e.id) >= e.slots then raise exception 'No places left'; end if;
    if e.delegate_pass_requirement='required' and not public.has_active_delegate_pass(uid) then raise exception 'Delegate pass required'; end if;
    if p_team is null or jsonb_typeof(p_team->'participants') is distinct from 'array' then raise exception 'Participant details required'; end if;
    perform public.validate_roster(e.id,p_team,e.name);
    n := jsonb_array_length(p_team->'participants');
    if n<1 or (e.id in ('s4-15','s4-16','s4-17') and n>2) or (e.id='s4-19' and n<>1)
      or (e.id='s4-14' and n not between 2 and 6) or (e.id='s4-18' and n>3) then raise exception 'Invalid team size'; end if;
    part := case when n>1 then 'team' else 'individual' end;
    insert into public.orders(reference,user_id,subtotal,total,pricing_phase,status)
      values ('S4 / '||lpad(nextval('public.order_reference_seq')::text,4,'0'),uid,0,0,'round2','approved') returning id into oid;
    insert into public.order_lines(order_id,event_id,event_name,event_code,context,category,participation,unit_price,price_basis,event_date,start_time)
      values (oid,e.id,e.name,e.code,'Round 2 registration',e.category,part,0,'Round 2 fee tracked separately',e.event_date,e.start_time) returning id into lid;
    insert into public.order_line_participants(order_line_id,order_id,event_id,team_index,position,role,name,year_of_study,college,phone,email,linked_user_id)
      select lid,oid,e.id,1,idx::int,case when idx=1 then 'captain' else 'member' end,
        btrim(p->>'name'),p->>'year_of_study',p->>'college',p->>'phone',p->>'email',case when idx=1 then uid else null end
      from jsonb_array_elements(p_team->'participants') with ordinality as people(p,idx);
    insert into public.registrations(order_id,user_id,event_id,participation) values(oid,uid,e.id,part) returning * into r;
  end if;
  if not exists(select 1 from public.orders where id=r.order_id and status='approved') then raise exception 'Original registration is not confirmed'; end if;
  -- Bulk Round 1 lines may contain a solo entry and a two-person entry.
  -- Their shared line participation is not a reliable price for each team.
  select count(*) into n from public.order_line_participants p
    where p.order_id=r.order_id and p.event_id=r.event_id and p.team_index=r.team_index;
  part := case when n>1 then 'team' when n=1 then 'individual' else r.participation end;
  insert into public.round_two_entries(registration_id,user_id,event_id,fee)
    values(r.id,uid,r.event_id,round_two_private.fee(r.event_id,part))
    on conflict (registration_id) do nothing;
  select * into strict result from public.round_two_entries where registration_id=r.id;
  return result;
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('round-two-abstracts','round-two-abstracts',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']),
 ('round-two-payments','round-two-payments',false,5242880,array['image/jpeg','image/png','application/pdf']);
create policy round_two_files_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('round-two-abstracts','round-two-payments') and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.round_two_entries e where e.id::text=(storage.foldername(name))[2]
    and e.user_id=(select auth.uid()) and (e.payment_status='draft' or e.payment_status='rejected' or e.submission_status='rejected'))
);
-- No UPDATE/DELETE policies: past evidence cannot be replaced or erased.
create policy round_two_files_read on storage.objects for select to authenticated using (
  (bucket_id='round-two-abstracts' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin())))
  or (bucket_id='round-two-payments' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_finance_admin())))
);

create function public.round_two_roster()
returns table(entry_id uuid, name text, college text, email text, team_index int)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated' using errcode='28000'; end if;
  return query select e.id,p.name,p.college,p.email,r.team_index
    from public.round_two_entries e join public.registrations r on r.id=e.registration_id
    join public.order_line_participants p on p.order_id=r.order_id and p.event_id=r.event_id and p.team_index=r.team_index
    where e.user_id=auth.uid() or public.is_admin()
    order by e.id,p.position;
end; $$;

create function public.submit_round_two(p_entry_id uuid, p_abstract_path text default null, p_abstract_name text default null, p_proof_path text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare e public.round_two_entries; previous public.round_two_attempts; ap text; pp text; an text;
begin
  select * into e from public.round_two_entries where id=p_entry_id and user_id=auth.uid() for update;
  if not found then raise exception 'Entry not found' using errcode='42501'; end if;
  if not (e.payment_status='draft' or e.payment_status='rejected' or e.submission_status='rejected') then raise exception 'Entry is already submitted'; end if;
  select * into previous from public.round_two_attempts where entry_id=e.id order by attempt_number desc limit 1;
  ap := case when e.submission_status='approved' then previous.abstract_path else p_abstract_path end;
  an := case when e.submission_status='approved' then previous.abstract_name else left(btrim(p_abstract_name),240) end;
  pp := case when e.payment_status='approved' then previous.proof_path else p_proof_path end;
  if ap is null or pp is null or an is null or an='' then raise exception 'Abstract and payment proof required'; end if;
  if split_part(ap,'/',1)<>e.user_id::text or split_part(ap,'/',2)<>e.id::text
    or split_part(pp,'/',1)<>e.user_id::text or split_part(pp,'/',2)<>e.id::text then raise exception 'Invalid file path'; end if;
  if not exists(select 1 from storage.objects where bucket_id='round-two-abstracts' and name=ap
    and (metadata->>'size')::bigint between 1 and 10485760 and metadata->>'mimetype' in
      ('application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'))
    or not exists(select 1 from storage.objects where bucket_id='round-two-payments' and name=pp
    and (metadata->>'size')::bigint between 1 and 5242880 and metadata->>'mimetype' in ('image/jpeg','image/png','application/pdf')) then
    raise exception 'Upload valid files before submitting';
  end if;
  insert into public.round_two_attempts(entry_id,abstract_path,abstract_name,proof_path,payment_status,submission_status)
    values(e.id,ap,an,pp,case when e.payment_status='approved' then 'approved' else 'under_review' end,
      case when e.submission_status='approved' then 'approved' else 'under_review' end);
  update public.round_two_entries set payment_status=case when payment_status='approved' then 'approved' else 'under_review' end,
    submission_status=case when submission_status='approved' then 'approved' else 'under_review' end where id=e.id;
end; $$;

create function public.review_round_two(p_attempt_id uuid, p_kind text, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.round_two_attempts; eid uuid; latest uuid; decision text;
begin
  if auth.uid() is null or p_kind not in ('payment','submission') or p_kind is null or p_approve is null then raise exception 'Invalid review'; end if;
  if (p_kind='payment' and not public.is_finance_admin()) or (p_kind='submission' and not public.is_admin()) then
    raise exception 'Not authorised' using errcode='42501'; end if;
  if not p_approve and nullif(btrim(p_reason),'') is null then raise exception 'A reason is required'; end if;
  select entry_id into eid from public.round_two_attempts where id=p_attempt_id;
  perform 1 from public.round_two_entries where id=eid for update;
  select id into latest from public.round_two_attempts where entry_id=eid order by attempt_number desc limit 1;
  if latest is distinct from p_attempt_id then raise exception 'Review is stale. Refresh the entry.'; end if;
  select * into strict a from public.round_two_attempts where id=p_attempt_id;
  decision := case when p_approve then 'approved' else 'rejected' end;
  if p_kind='payment' then
    if a.payment_status<>'under_review' then raise exception 'Payment already reviewed'; end if;
    update public.round_two_attempts set payment_status=decision,payment_reason=case when not p_approve then left(btrim(p_reason),2000) end,
      payment_reviewed_by=auth.uid(),payment_reviewed_at=now() where id=a.id;
    update public.round_two_entries set payment_status=decision where id=eid;
  else
    if a.submission_status<>'under_review' then raise exception 'Submission already reviewed'; end if;
    update public.round_two_attempts set submission_status=decision,submission_reason=case when not p_approve then left(btrim(p_reason),2000) end,
      submission_reviewed_by=auth.uid(),submission_reviewed_at=now() where id=a.id;
    update public.round_two_entries set submission_status=decision where id=eid;
  end if;
end; $$;

-- Keep the mature Round 1 implementation for other events, and block old clients
-- from creating free/incorrectly priced registrations for these six events.
alter function public.create_order(jsonb) rename to create_round_one_order;
revoke all on function public.create_round_one_order(jsonb) from public,anon,authenticated;
create function public.create_order(p_items jsonb) returns public.orders
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated' using errcode='28000'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i where round_two_private.fee(i->>'event_id','individual') is not null) then
    raise exception 'Round 2 registration is open. Remove these events from the cart and register from their event page.';
  end if;
  return public.create_round_one_order(p_items);
end; $$;

revoke all on function public.start_round_two(text,uuid,jsonb), public.submit_round_two(uuid,text,text,text),
  public.review_round_two(uuid,text,boolean,text), public.create_order(jsonb), public.round_two_roster() from public,anon;
grant execute on function public.start_round_two(text,uuid,jsonb), public.submit_round_two(uuid,text,text,text),
  public.review_round_two(uuid,text,boolean,text), public.create_order(jsonb), public.round_two_roster() to authenticated;
revoke all on all functions in schema round_two_private from public,anon,authenticated;
