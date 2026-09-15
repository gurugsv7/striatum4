-- ============================================================================
-- Abstracts attached to a registration.
--
-- CHIRONEX, CORAL CANVAS and THE UNCHARTED all ask for one, and until now the
-- only route was email. The abstract now travels with the registration, and for
-- those three no payment can be submitted without it. That is enforced in
-- submit_payment_proof, not only on the screen that asks, so a crafted request
-- cannot skip it.
--
-- Documents rather than screenshots: PDF, Word and PowerPoint, because that is
-- what the brochures ask to be written in. The bucket had only ever accepted
-- images at 5 MB, so both limits had to give.
--
-- The three events that email an abstract instead — LUMINARA, THE DIAGNOSTIC
-- ABYSS and NEURONOVA — take no payment here at all, so they are untouched.
--
-- Verified against the live database:
--   order with CHIRONEX + THE MEDICAL VAULT -> missing_abstracts names CHIRONEX only
--   submit with screenshot but no abstract  -> refused, "Attach the abstract for CHIRONEX"
--   attach, then submit                     -> accepted, under_review
--   attach after submission                 -> refused, "can no longer be changed"
-- ============================================================================

alter table public.events
  add column if not exists requires_abstract boolean not null default false;

comment on column public.events.requires_abstract is
  'Registration for this event is incomplete until an abstract is attached.';

update public.events set requires_abstract = true
 where id in ('s4-16', 's4-17', 's4-19');

alter table public.order_lines
  add column if not exists abstract_path text,
  add column if not exists abstract_mime text,
  add column if not exists abstract_size bigint,
  add column if not exists abstract_name text;

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array[
         'image/jpeg',
         'image/png',
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation'
       ]
 where id = 'payment-proofs';

create or replace function public.set_order_line_abstract(
  p_line_id uuid, p_path text, p_mime text, p_size bigint, p_name text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user  uuid := auth.uid();
  v_line  public.order_lines%rowtype;
  v_order public.orders%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_line from public.order_lines where id = p_line_id;
  if not found then
    raise exception 'That registration is no longer in your order' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = v_line.order_id;
  if not found or v_order.user_id <> v_user then
    raise exception 'That order is not yours' using errcode = '42501';
  end if;
  if v_order.status <> 'awaiting_payment' then
    raise exception 'This order can no longer be changed' using errcode = 'P0001';
  end if;

  if coalesce(btrim(p_path), '') = '' then
    raise exception 'No abstract was uploaded' using errcode = 'P0001';
  end if;
  if split_part(p_path, '/', 1) <> v_user::text then
    raise exception 'That file does not belong to you' using errcode = '42501';
  end if;
  if not exists (
    select 1 from storage.objects o
     where o.bucket_id = 'payment-proofs' and o.name = p_path
       and coalesce((o.metadata ->> 'size')::bigint, 0) > 0
  ) then
    raise exception 'Your abstract upload did not complete' using errcode = 'P0001';
  end if;

  update public.order_lines
     set abstract_path = p_path,
         abstract_mime = nullif(btrim(coalesce(p_mime, '')), ''),
         abstract_size = p_size,
         abstract_name = nullif(btrim(coalesce(p_name, '')), '')
   where id = p_line_id;
end;
$function$;

grant execute on function public.set_order_line_abstract(uuid, text, text, bigint, text) to authenticated;

-- Names any event in the order still waiting for its abstract.
create or replace function public.missing_abstracts(p_order_id uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select string_agg(ol.event_name, ', ' order by ol.event_name)
    from public.order_lines ol
    join public.events e on e.id = ol.event_id
   where ol.order_id = p_order_id
     and e.requires_abstract
     and coalesce(btrim(ol.abstract_path), '') = '';
$function$;

revoke all on function public.missing_abstracts(uuid) from public, anon;
grant execute on function public.missing_abstracts(uuid) to authenticated;

-- submit_payment_proof gains the check. The rest of it is unchanged; see the
-- deployed definition, which this mirrors.
