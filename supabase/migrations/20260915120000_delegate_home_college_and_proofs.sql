-- ============================================================================
-- IGMCRI's own students and the evidence behind a delegate pass.
--
-- The conclave is IGMCRI's, so its students do not pay the delegate fee for
-- Tier 1 and pay 100 rather than 600 for Tier 2. What replaces the fee is a
-- student ID card, checked by an organiser.
--
-- Two things were already broken and had to be fixed for any of it to work:
--
--   * the tier a delegate chose was never written. applyForDelegateRemote
--     inserted every other field, so a genuine application carried a null tier
--     and the two events requiring SYNEXA refused every real delegate with
--     "your pass tier is not on record".
--
--   * the delegate's payment screenshot was never uploaded. It sat in browser
--     state and went nowhere, so organisers approved passes with no evidence
--     of payment at all. Event orders were never affected — those upload and
--     record correctly — this was the delegate path only.
--
-- Files live in the existing payment-proofs bucket under the caller's own
-- folder, so the policies already keeping order proofs private apply unchanged
-- and no new storage policy had to be written.
--
-- Verified against the live database after applying:
--   IGMCRI + Tier 1, no ID card          -> refused
--   outside + Tier 2, no screenshot      -> refused
--   a path in someone else's folder      -> refused
--   no tier at all                       -> refused
--   IGMCRI + Tier 2, both files present  -> accepted, fee 100, status pending
-- ============================================================================

alter table public.delegate_applications
  add column if not exists home_college boolean not null default false,
  add column if not exists fee_due integer,
  add column if not exists id_proof_path text,
  add column if not exists payment_proof_path text,
  add column if not exists payment_proof_mime text,
  add column if not exists payment_proof_size bigint;

comment on column public.delegate_applications.home_college is
  'Claimed to study at IGMCRI. A claim, not a fact: the ID card is what an organiser checks.';
comment on column public.delegate_applications.fee_due is
  'What this delegate owes, decided here and never taken from the browser.';

-- What each delegate owes. One place, server-side, so a crafted request cannot
-- award itself the home-college rate.
create or replace function public.delegate_fee(p_tier text, p_home_college boolean)
returns integer
language sql
immutable
as $function$
  select case
    when p_home_college and p_tier = 'AQUALUME' then 0
    when p_home_college and p_tier = 'SYNEXA'   then 100
    when p_tier = 'AQUALUME' then 500
    when p_tier = 'SYNEXA'   then 600
  end;
$function$;

create or replace function public.apply_for_delegate(
  p_full_name       text,
  p_institution     text,
  p_email           text,
  p_year_of_study   text     default null,
  p_phone           text     default null,
  p_tier            text     default null,
  p_home_college    boolean  default false,
  p_id_proof_path   text     default null,
  p_payment_path    text     default null,
  p_payment_mime    text     default null,
  p_payment_size    bigint   default null
)
returns public.delegate_applications
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_fee  integer;
  v_row  public.delegate_applications%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if coalesce(p_tier, '') not in ('AQUALUME', 'SYNEXA') then
    raise exception 'Choose a Delegate Pass tier' using errcode = 'P0001';
  end if;

  v_fee := public.delegate_fee(p_tier, coalesce(p_home_college, false));

  -- The concession is the whole reason the card is collected, so it is not
  -- optional for anyone claiming it.
  if coalesce(p_home_college, false) and coalesce(btrim(p_id_proof_path), '') = '' then
    raise exception 'Upload your IGMCRI student ID card' using errcode = 'P0001';
  end if;

  if v_fee > 0 and coalesce(btrim(p_payment_path), '') = '' then
    raise exception 'Upload your payment screenshot' using errcode = 'P0001';
  end if;

  -- A path is only worth storing if the file is really there and really the
  -- caller's. Mirrors what approve_order checks before honouring a proof.
  if coalesce(btrim(p_id_proof_path), '') <> '' then
    if split_part(p_id_proof_path, '/', 1) <> v_user::text then
      raise exception 'That ID card does not belong to you' using errcode = '42501';
    end if;
    if not exists (
      select 1 from storage.objects o
       where o.bucket_id = 'payment-proofs' and o.name = p_id_proof_path
         and coalesce((o.metadata ->> 'size')::bigint, 0) > 0
    ) then
      raise exception 'Your ID card upload did not complete' using errcode = 'P0001';
    end if;
  end if;

  if coalesce(btrim(p_payment_path), '') <> '' then
    if split_part(p_payment_path, '/', 1) <> v_user::text then
      raise exception 'That screenshot does not belong to you' using errcode = '42501';
    end if;
    if not exists (
      select 1 from storage.objects o
       where o.bucket_id = 'payment-proofs' and o.name = p_payment_path
         and coalesce((o.metadata ->> 'size')::bigint, 0) > 0
    ) then
      raise exception 'Your screenshot upload did not complete' using errcode = 'P0001';
    end if;
  end if;

  insert into public.delegate_applications
    (user_id, full_name, institution, email, year_of_study, phone,
     tier, home_college, fee_due,
     id_proof_path, payment_proof_path, payment_proof_mime, payment_proof_size)
  values
    (v_user, btrim(p_full_name), btrim(p_institution), btrim(p_email),
     nullif(btrim(coalesce(p_year_of_study, '')), ''),
     nullif(btrim(coalesce(p_phone, '')), ''),
     p_tier, coalesce(p_home_college, false), v_fee,
     nullif(btrim(coalesce(p_id_proof_path, '')), ''),
     nullif(btrim(coalesce(p_payment_path, '')), ''),
     nullif(btrim(coalesce(p_payment_mime, '')), ''),
     p_payment_size)
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'You already have a delegate application on file'
      using errcode = 'P0001';
end;
$function$;

grant execute on function public.delegate_fee(text, boolean) to authenticated;
grant execute on function public.apply_for_delegate(
  text, text, text, text, text, text, boolean, text, text, text, bigint
) to authenticated;
