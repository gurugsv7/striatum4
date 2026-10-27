-- Additional Round 2 abstracts: separate, independently reviewable submissions.
-- The original attempt, fee, proof and review status remain unchanged.
create table if not exists public.round_two_extra_abstracts (
 id uuid primary key default gen_random_uuid(),
 entry_id uuid not null references public.round_two_entries(id),
 user_id uuid not null references auth.users(id),
 abstract_path text not null unique,
 abstract_name text not null,
 status text not null default 'under_review' check(status in ('under_review','approved','rejected')),
 review_reason text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 submitted_at timestamptz not null default now()
);
create index if not exists round_two_extra_abstracts_entry_idx on public.round_two_extra_abstracts(entry_id,submitted_at desc);
alter table public.round_two_extra_abstracts enable row level security;
revoke all on public.round_two_extra_abstracts from public,anon,authenticated;
grant select on public.round_two_extra_abstracts to authenticated;
create policy round_two_extra_abstracts_read on public.round_two_extra_abstracts
 for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
-- Allow extra file uploads only for the owner's entry AFTER its first submitted attempt.
create policy round_two_extra_file_insert on storage.objects for insert to authenticated with check(
 bucket_id='round-two-abstracts'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.round_two_entries e
   where e.id::text=(storage.foldername(objects.name))[2]
   and e.user_id=(select auth.uid())
   and exists(select 1 from public.round_two_attempts a where a.entry_id=e.id))
);
create or replace function public.submit_extra_round_two_abstract(p_entry_id uuid,p_abstract_path text,p_abstract_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare e public.round_two_entries; result uuid;
begin
 select * into e from public.round_two_entries where id=p_entry_id and user_id=auth.uid();
 if not found then raise exception 'Round 2 entry not found' using errcode='42501'; end if;
 if not exists(select 1 from public.round_two_attempts where entry_id=e.id) then
  raise exception 'Submit your first Round 2 abstract and proof before adding another';
 end if;
 if nullif(btrim(p_abstract_name),'') is null or length(p_abstract_name)>240 then raise exception 'Invalid file name'; end if;
 if split_part(p_abstract_path,'/',1)<>e.user_id::text or split_part(p_abstract_path,'/',2)<>e.id::text
   or array_length(string_to_array(p_abstract_path,'/'),1)<>3 then raise exception 'Invalid file path'; end if;
 if not exists(select 1 from storage.objects
   where bucket_id='round-two-abstracts' and name=p_abstract_path
   and (metadata->>'size')::bigint between 1 and 10485760
   and metadata->>'mimetype' in ('application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'))
 then raise exception 'Upload a valid abstract before submitting'; end if;
 insert into public.round_two_extra_abstracts(entry_id,user_id,abstract_path,abstract_name)
 values(e.id,e.user_id,p_abstract_path,btrim(p_abstract_name))
 on conflict (abstract_path) do nothing returning id into result;
 if result is null then
  select id into result from public.round_two_extra_abstracts
  where abstract_path=p_abstract_path and entry_id=e.id and user_id=e.user_id;
 end if;
 if result is null then raise exception 'Abstract path belongs to another submission'; end if;
 return result;
end; $$;
create or replace function public.review_extra_round_two_abstract(p_abstract_id uuid,p_approve boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Not authorised' using errcode='42501'; end if;
 if p_approve is null or (not p_approve and nullif(btrim(p_reason),'') is null) then raise exception 'A review decision and rejection reason are required'; end if;
 update public.round_two_extra_abstracts
 set status=case when p_approve then 'approved' else 'rejected' end,
     review_reason=case when p_approve then null else left(btrim(p_reason),2000) end,
     reviewed_by=auth.uid(),reviewed_at=now()
 where id=p_abstract_id and status='under_review';
 if not found then raise exception 'Abstract already reviewed or not found'; end if;
end; $$;
revoke all on function public.submit_extra_round_two_abstract(uuid,text,text),
 public.review_extra_round_two_abstract(uuid,boolean,text) from public,anon;
grant execute on function public.submit_extra_round_two_abstract(uuid,text,text),
 public.review_extra_round_two_abstract(uuid,boolean,text) to authenticated;
