-- Every additional Round 2 abstract is a separately paid entry.
-- Snapshot the ORIGINAL entry fee per new abstract, but never reuse its proof.
alter table public.round_two_extra_abstracts
 add column if not exists fee integer,
 add column if not exists payment_path text,
 add column if not exists payment_status text not null default 'under_review',
 add column if not exists payment_reason text,
 add column if not exists payment_reviewed_by uuid references auth.users(id),
 add column if not exists payment_reviewed_at timestamptz;
alter table public.round_two_extra_abstracts
 add constraint extra_abstract_fee_positive check(fee>0),
 add constraint extra_abstract_payment_status_valid check(payment_status in ('under_review','approved','rejected')),
 add constraint extra_abstract_payment_path_unique unique(payment_path);
-- Existing extra count was verified as zero before applying this change.
alter table public.round_two_extra_abstracts alter column fee set not null;
alter table public.round_two_extra_abstracts alter column payment_path set not null;
drop policy if exists round_two_extra_abstracts_read on public.round_two_extra_abstracts;
create policy round_two_extra_abstracts_read on public.round_two_extra_abstracts
 for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()) or (select public.is_finance_admin()));
create policy round_two_extra_payment_file_insert on storage.objects for insert to authenticated with check(
 bucket_id='round-two-payments'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.round_two_entries e where e.id::text=(storage.foldername(objects.name))[2]
 and e.user_id=(select auth.uid())
 and exists(select 1 from public.round_two_attempts a where a.entry_id=e.id))
);
-- Existing three-argument RPC must not accept unpaid uploads from older clients.
create or replace function public.submit_extra_round_two_abstract(p_entry_id uuid,p_abstract_path text,p_abstract_name text)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 raise exception 'This version is outdated. Refresh the page and upload separate payment proof for each additional abstract.';
end; $$;
revoke all on function public.submit_extra_round_two_abstract(uuid,text,text) from public,anon,authenticated;
create or replace function public.submit_extra_round_two_abstract(
 p_entry_id uuid,p_abstract_path text,p_abstract_name text,p_payment_path text)
returns uuid language plpgsql security definer set search_path='' as $$
declare e public.round_two_entries; result uuid;
begin
 select * into e from public.round_two_entries where id=p_entry_id and user_id=auth.uid() for update;
 if not found then raise exception 'Round 2 entry not found' using errcode='42501'; end if;
 if not exists(select 1 from public.round_two_attempts where entry_id=e.id) then
  raise exception 'Submit the first Round 2 abstract and payment before adding another';
 end if;
 if nullif(btrim(p_abstract_name),'') is null or length(p_abstract_name)>240 then raise exception 'Invalid file name'; end if;
 if split_part(p_abstract_path,'/',1)<>e.user_id::text
 or split_part(p_abstract_path,'/',2)<>e.id::text
 or split_part(p_payment_path,'/',1)<>e.user_id::text
 or split_part(p_payment_path,'/',2)<>e.id::text
 or array_length(string_to_array(p_abstract_path,'/'),1)<>3
 or array_length(string_to_array(p_payment_path,'/'),1)<>3
 or p_abstract_path=p_payment_path then raise exception 'Invalid evidence paths'; end if;
 -- A proof must be NEW and not previously used by the first or another abstract.
 if exists(select 1 from public.round_two_attempts a where a.entry_id=e.id and a.proof_path=p_payment_path)
 or exists(select 1 from public.round_two_extra_abstracts x where x.entry_id=e.id and x.payment_path=p_payment_path and x.abstract_path<>p_abstract_path) then
  raise exception 'Each additional abstract requires its own NEW payment proof';
 end if;
 if not exists(select 1 from storage.objects where bucket_id='round-two-abstracts' and name=p_abstract_path
  and (metadata->>'size')::bigint between 1 and 10485760
  and metadata->>'mimetype' in ('application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation')) then
  raise exception 'Upload a valid new abstract';
 end if;
 if not exists(select 1 from storage.objects where bucket_id='round-two-payments' and name=p_payment_path
  and (metadata->>'size')::bigint between 1 and 5242880
  and metadata->>'mimetype' in ('image/jpeg','image/png','application/pdf')) then
  raise exception 'Upload a separate payment proof';
 end if;
 insert into public.round_two_extra_abstracts(entry_id,user_id,abstract_path,abstract_name,payment_path,fee)
 values(e.id,e.user_id,p_abstract_path,btrim(p_abstract_name),p_payment_path,e.fee)
 on conflict (abstract_path) do nothing returning id into result;
 if result is null then
  select id into result from public.round_two_extra_abstracts
  where entry_id=e.id and user_id=e.user_id and abstract_path=p_abstract_path and payment_path=p_payment_path;
 end if;
 if result is null then raise exception 'This abstract is already associated with different payment evidence'; end if;
 return result;
end; $$;
revoke all on function public.submit_extra_round_two_abstract(uuid,text,text,text) from public,anon;
grant execute on function public.submit_extra_round_two_abstract(uuid,text,text,text) to authenticated;
create or replace function public.review_extra_round_two_payment(
 p_abstract_id uuid,p_approve boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_finance_admin() then raise exception 'Not authorised' using errcode='42501'; end if;
 if p_approve is null or (not p_approve and nullif(btrim(p_reason),'') is null) then
  raise exception 'Decision and rejection reason required';
 end if;
 update public.round_two_extra_abstracts
 set payment_status=case when p_approve then 'approved' else 'rejected' end,
 payment_reason=case when p_approve then null else left(btrim(p_reason),2000) end,
 payment_reviewed_by=auth.uid(),payment_reviewed_at=now()
 where id=p_abstract_id and payment_status='under_review';
 if not found then raise exception 'Payment already reviewed or not found'; end if;
end; $$;
revoke all on function public.review_extra_round_two_payment(uuid,boolean,text) from public,anon;
grant execute on function public.review_extra_round_two_payment(uuid,boolean,text) to authenticated;
-- Signed uploads must pass the same private guard even if Storage bypasses RLS.
create or replace function round_two_private.guard_file_insert()
returns trigger language plpgsql security definer set search_path='' as $$
declare e public.round_two_entries;
begin
 select * into e from public.round_two_entries
 where id::text=split_part(new.name,'/',2) and user_id::text=split_part(new.name,'/',1)
 for key share;
 if not found then raise exception 'Round 2 entry no longer accepts uploads. Refresh My Events.' using errcode='42501'; end if;
 if not (e.payment_status='draft' or e.payment_status='rejected' or e.submission_status='rejected')
 and not (new.bucket_id in ('round-two-abstracts','round-two-payments')
  and exists(select 1 from public.round_two_attempts a where a.entry_id=e.id)) then
  raise exception 'Round 2 entry no longer accepts uploads. Refresh My Events.' using errcode='42501';
 end if;
 return new;
end; $$;
revoke all on function round_two_private.guard_file_insert() from public,anon,authenticated;
