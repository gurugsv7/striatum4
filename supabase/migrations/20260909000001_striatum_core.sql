-- ============================================================================
-- STRIATUM 4.0 — core schema
--
-- Design rules this migration enforces:
--   1. The SERVER decides what a delegate owes. create_order() recomputes every
--      price from the events table; the client never sends a total.
--   2. Approval is atomic. approve_order() confirms every line or none.
--   3. Capacity is enforced under row locks, counting confirmed + pending.
--   4. Payment screenshots live in a PRIVATE storage bucket, never a public URL.
--   5. Money is stored as whole rupees (integer). The brochure has no paise.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- admins ----

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  added_at   timestamptz not null default now()
);

-- SECURITY DEFINER so RLS policies can call it without recursing into admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- -------------------------------------------------------------- settings ----

create table public.app_settings (
  key    text primary key,
  value  jsonb not null
);

-- The brochure states early- and late-bird fees but NOT the cutoff date, so the
-- phase is an explicit organiser-controlled switch rather than a guessed date.
insert into public.app_settings (key, value)
values ('pricing_phase', '"early"'::jsonb);

-- ---------------------------------------------------------------- events ----

create table public.events (
  id                         text primary key,
  code                       text not null,
  name                       text not null,
  category                   text not null,
  format                     text not null,
  specialties                text[] not null default '{}',

  event_date                 date,
  start_time                 text,
  end_time                   text,
  venue                      text,

  slots                      integer check (slots is null or slots > 0),

  participation              text not null
                             check (participation in ('individual', 'team', 'either')),
  team_min                   integer,
  team_max                   integer,

  price_early_bird           integer,
  price_late_bird            integer,
  price_entry                integer,
  price_spot                 integer,
  price_individual           integer,
  price_team                 integer,
  price_flat                 integer,
  price_unit                 text check (price_unit in ('per_person', 'per_team')),
  price_unspecified          boolean not null default false,

  delegate_pass_requirement  text not null
                             check (delegate_pass_requirement in
                               ('required', 'not_required',
                                'not_required_for_submission', 'unspecified')),

  status                     text not null default 'open'
                             check (status in ('open', 'closed', 'coming_soon',
                                               'full', 'not_registerable')),
  registerable               boolean not null default true,
  updated_at                 timestamptz not null default now()
);

-- ------------------------------------------------------- discount rules -----

create table public.discount_rules (
  id                   text primary key,
  name                 text not null,
  label                text not null,
  min_eligible_items   integer,
  eligible_event_ids   text[],
  eligible_categories  text[],
  discount_type        text not null check (discount_type in ('percentage', 'fixed')),
  discount_value       integer not null check (discount_value >= 0),
  max_discount         integer,
  active               boolean not null default false,
  priority             integer not null default 100
);

-- Organisers have NOT finalised the bundle rule. It ships inactive with a zero
-- value so no discount is ever invented; flip `active` once the rule is agreed.
insert into public.discount_rules
  (id, name, label, min_eligible_items, discount_type, discount_value, active, priority)
values
  ('bundle-placeholder', 'Multi-event bundle', 'BUNDLE DISCOUNT', 2,
   'percentage', 0, false, 10);

-- ------------------------------------------------- delegate applications ----

create table public.delegate_applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  full_name         text not null,
  institution       text not null,
  email             text not null,
  year_of_study     text,
  phone             text,
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  delegate_id       text unique,
  rejection_reason  text,
  submitted_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references auth.users (id)
);

-- One live application per delegate; a rejected one may be superseded.
create unique index delegate_applications_one_live
  on public.delegate_applications (user_id)
  where status <> 'rejected';

create sequence public.delegate_id_seq;

-- ---------------------------------------------------------------- orders ----

create type public.order_status as enum (
  'cart', 'awaiting_payment', 'payment_submitted',
  'under_review', 'approved', 'rejected', 'cancelled'
);

create sequence public.order_reference_seq;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text unique not null,
  user_id           uuid not null references auth.users (id) on delete cascade,

  subtotal          integer not null check (subtotal >= 0),
  discount_amount   integer not null default 0 check (discount_amount >= 0),
  discount_rule_id  text references public.discount_rules (id),
  discount_label    text,
  total             integer not null check (total >= 0),
  pricing_phase     text not null,

  status            public.order_status not null default 'awaiting_payment',

  -- Storage object path only. Never a public URL.
  proof_path        text,
  proof_mime        text,
  proof_size        integer,

  rejection_reason  text,
  created_at        timestamptz not null default now(),
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  reviewed_by       uuid references auth.users (id),

  constraint total_is_subtotal_less_discount
    check (total = subtotal - discount_amount)
);

create index orders_user_idx   on public.orders (user_id, created_at desc);
create index orders_review_idx on public.orders (status)
  where status in ('payment_submitted', 'under_review');

-- Price and name are snapshotted so historical orders never drift when the
-- catalogue changes.
create table public.order_lines (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  event_id       text not null references public.events (id),
  event_name     text not null,
  event_code     text not null,
  context        text not null,
  category       text not null,
  event_date     date,
  start_time     text,
  participation  text not null check (participation in ('individual', 'team')),
  unit_price     integer not null check (unit_price >= 0),
  price_basis    text not null default '',
  unique (order_id, event_id)
);

create index order_lines_event_idx on public.order_lines (event_id);

-- --------------------------------------------------------- registrations ----

create table public.registrations (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  event_id       text not null references public.events (id),
  participation  text not null,
  confirmed_at   timestamptz not null default now(),
  -- A delegate can hold at most one confirmed place per event.
  unique (user_id, event_id)
);

create index registrations_event_idx on public.registrations (event_id);

-- ============================================================================
-- Capacity
-- ============================================================================

-- Seats consumed = confirmed registrations + lines on orders still in review.
create or replace function public.event_seats_taken(p_event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.registrations r where r.event_id = p_event_id)
  + (select count(*)
       from public.order_lines ol
       join public.orders o on o.id = ol.order_id
      where ol.event_id = p_event_id
        and o.status in ('awaiting_payment', 'payment_submitted', 'under_review'))
$$;

create or replace function public.event_seats_available(p_event_id text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_slots integer;
begin
  select slots into v_slots from public.events where id = p_event_id;
  if v_slots is null then
    return null;                      -- no published limit
  end if;
  return greatest(0, v_slots - public.event_seats_taken(p_event_id));
end;
$$;

-- ============================================================================
-- Authoritative order creation
--
-- p_items: [{"event_id": "s4-07", "participation": "individual"}, ...]
-- The client sends only WHAT it wants, never what it costs.
-- ============================================================================

create or replace function public.create_order(p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user            uuid := auth.uid();
  v_phase           text;
  v_item            jsonb;
  v_event           public.events%rowtype;
  v_participation   text;
  v_price           integer;
  v_basis           text;
  v_subtotal        integer := 0;
  v_has_pass        boolean;
  v_order           public.orders%rowtype;
  v_reference       text;
  v_rule            public.discount_rules%rowtype;
  v_discount        integer := 0;
  v_discount_id     text := null;
  v_discount_label  text := null;
  v_eligible_count  integer;
  v_eligible_total  integer;
  v_best            integer := 0;
  v_lines           jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty' using errcode = 'P0001';
  end if;

  select (value #>> '{}') into v_phase from public.app_settings where key = 'pricing_phase';
  v_phase := coalesce(v_phase, 'early');

  v_has_pass := exists (
    select 1 from public.delegate_applications
     where user_id = v_user and status = 'approved'
  );

  -- Lock every requested event so two concurrent checkouts cannot oversell.
  perform 1
     from public.events
    where id in (select jsonb_array_elements(p_items) ->> 'event_id')
    order by id
      for update;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_event from public.events where id = v_item ->> 'event_id';
    if not found then
      raise exception 'Unknown event: %', v_item ->> 'event_id' using errcode = 'P0001';
    end if;

    if not v_event.registerable or v_event.status in ('closed', 'not_registerable') then
      raise exception '% is not open for registration', v_event.name using errcode = 'P0001';
    end if;

    if v_event.price_unspecified then
      raise exception 'Fees are not yet published for %', v_event.name using errcode = 'P0001';
    end if;

    if v_event.delegate_pass_requirement = 'required' and not v_has_pass then
      raise exception '% requires an approved Delegate ID', v_event.name using errcode = 'P0001';
    end if;

    if exists (select 1 from public.registrations
                where user_id = v_user and event_id = v_event.id) then
      raise exception 'You are already registered for %', v_event.name using errcode = 'P0001';
    end if;

    if exists (select 1
                 from public.order_lines ol
                 join public.orders o on o.id = ol.order_id
                where ol.event_id = v_event.id
                  and o.user_id = v_user
                  and o.status in ('awaiting_payment', 'payment_submitted', 'under_review')) then
      raise exception '% is already in an order awaiting verification', v_event.name
        using errcode = 'P0001';
    end if;

    if v_event.slots is not null
       and public.event_seats_taken(v_event.id) >= v_event.slots then
      raise exception '% is full', v_event.name using errcode = 'P0001';
    end if;

    v_participation := coalesce(v_item ->> 'participation',
                                case when v_event.participation = 'team'
                                     then 'team' else 'individual' end);

    -- Price resolution mirrors src/services/pricing.ts exactly.
    if v_event.price_early_bird is not null or v_event.price_late_bird is not null then
      if v_phase <> 'early' and v_event.price_late_bird is not null then
        v_price := v_event.price_late_bird; v_basis := 'Late bird';
      else
        v_price := v_event.price_early_bird; v_basis := 'Early bird';
      end if;
    elsif v_event.price_entry is not null or v_event.price_spot is not null then
      if v_phase = 'spot' and v_event.price_spot is not null then
        v_price := v_event.price_spot; v_basis := 'Spot entry';
      else
        v_price := v_event.price_entry; v_basis := 'Entry';
      end if;
    elsif v_participation = 'team' and v_event.price_team is not null then
      v_price := v_event.price_team; v_basis := 'Team';
    elsif v_participation = 'individual' and v_event.price_individual is not null then
      v_price := v_event.price_individual; v_basis := 'Individual';
    elsif v_event.price_team is not null then
      v_price := v_event.price_team; v_basis := 'Team';
    elsif v_event.price_individual is not null then
      v_price := v_event.price_individual; v_basis := 'Individual';
    elsif v_event.price_flat is not null then
      v_price := v_event.price_flat; v_basis := 'Registration';
    else
      raise exception 'No published fee for %', v_event.name using errcode = 'P0001';
    end if;

    if v_event.price_unit = 'per_team' then
      v_basis := v_basis || ' · per team';
    elsif v_event.price_unit = 'per_person' then
      v_basis := v_basis || ' · per person';
    end if;

    v_subtotal := v_subtotal + v_price;
    v_lines := v_lines || jsonb_build_object(
      'event_id',      v_event.id,
      'event_name',    v_event.name,
      'event_code',    v_event.code,
      'context',       coalesce(v_event.specialties[1] || ' · ', '') || v_event.format,
      'category',      v_event.category,
      'event_date',    v_event.event_date,
      'start_time',    v_event.start_time,
      'participation', v_participation,
      'unit_price',    v_price,
      'price_basis',   v_basis
    );
  end loop;

  -- Best active discount wins. With no active rule this stays zero.
  for v_rule in select * from public.discount_rules where active order by priority
  loop
    select count(*), coalesce(sum((l ->> 'unit_price')::int), 0)
      into v_eligible_count, v_eligible_total
      from jsonb_array_elements(v_lines) l
     where (v_rule.eligible_event_ids is null
            or (l ->> 'event_id') = any (v_rule.eligible_event_ids))
       and (v_rule.eligible_categories is null
            or (l ->> 'category') = any (v_rule.eligible_categories));

    if v_eligible_count = 0
       or (v_rule.min_eligible_items is not null
           and v_eligible_count < v_rule.min_eligible_items) then
      continue;
    end if;

    if v_rule.discount_type = 'percentage' then
      v_discount := floor(v_eligible_total * v_rule.discount_value / 100.0);
    else
      v_discount := v_rule.discount_value;
    end if;

    if v_rule.max_discount is not null then
      v_discount := least(v_discount, v_rule.max_discount);
    end if;
    v_discount := greatest(0, least(v_discount, v_eligible_total));

    if v_discount > v_best then
      v_best := v_discount;
      v_discount_id := v_rule.id;
      v_discount_label := v_rule.label;
    end if;
  end loop;

  v_reference := 'S4 / ' || lpad(nextval('public.order_reference_seq')::text, 4, '0');

  insert into public.orders (reference, user_id, subtotal, discount_amount,
                             discount_rule_id, discount_label, total,
                             pricing_phase, status)
  values (v_reference, v_user, v_subtotal, v_best,
          v_discount_id, v_discount_label, v_subtotal - v_best,
          v_phase, 'awaiting_payment')
  returning * into v_order;

  insert into public.order_lines (order_id, event_id, event_name, event_code, context,
                                  category, event_date, start_time, participation,
                                  unit_price, price_basis)
  select v_order.id,
         l ->> 'event_id',   l ->> 'event_name', l ->> 'event_code',
         l ->> 'context',    l ->> 'category',
         nullif(l ->> 'event_date', '')::date,
         l ->> 'start_time', l ->> 'participation',
         (l ->> 'unit_price')::int, l ->> 'price_basis'
    from jsonb_array_elements(v_lines) l;

  return v_order;
end;
$$;

-- ============================================================================
-- Proof submission & manual verification
-- ============================================================================

create or replace function public.submit_payment_proof(
  p_order_id uuid, p_path text, p_mime text, p_size integer
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders
   where id = p_order_id and user_id = auth.uid()
     for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  if v_order.status not in ('awaiting_payment', 'rejected') then
    raise exception 'This order has already been submitted for verification'
      using errcode = 'P0001';
  end if;
  if p_mime not in ('image/jpeg', 'image/png') then
    raise exception 'Only JPG, JPEG or PNG screenshots can be accepted'
      using errcode = 'P0001';
  end if;

  update public.orders
     set proof_path = p_path, proof_mime = p_mime, proof_size = p_size,
         status = 'under_review', submitted_at = now(), rejection_reason = null
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

-- Confirms every line together. A partial approval would leave a delegate paid
-- up but unregistered, so this is one transaction or nothing.
create or replace function public.approve_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line  public.order_lines%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  if v_order.status = 'approved' then
    raise exception 'Order is already approved' using errcode = 'P0001';
  end if;

  for v_line in select * from public.order_lines where order_id = p_order_id
  loop
    insert into public.registrations (order_id, user_id, event_id, participation)
    values (v_order.id, v_order.user_id, v_line.event_id, v_line.participation)
    on conflict (user_id, event_id) do nothing;
  end loop;

  update public.orders
     set status = 'approved', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = null
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.reject_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = 'P0001';
  end if;

  update public.orders
     set status = 'rejected', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = btrim(p_reason)
   where id = p_order_id
   returning * into v_order;

  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  return v_order;
end;
$$;

create or replace function public.approve_delegate(p_application_id uuid)
returns public.delegate_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.delegate_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  update public.delegate_applications
     set status = 'approved',
         delegate_id = coalesce(
           delegate_id,
           'S4-' || lpad(nextval('public.delegate_id_seq')::text, 4, '0') || '-26'),
         reviewed_at = now(), reviewed_by = auth.uid(), rejection_reason = null
   where id = p_application_id
   returning * into v_app;

  if not found then
    raise exception 'Application not found' using errcode = 'P0001';
  end if;
  return v_app;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.events                 enable row level security;
alter table public.discount_rules         enable row level security;
alter table public.app_settings           enable row level security;
alter table public.admins                 enable row level security;
alter table public.delegate_applications  enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_lines            enable row level security;
alter table public.registrations          enable row level security;

-- Catalogue is public to read, admin-only to change.
create policy events_read      on public.events        for select using (true);
create policy events_write     on public.events        for all    using (public.is_admin())
                                                                  with check (public.is_admin());
create policy rules_read       on public.discount_rules for select using (true);
create policy rules_write      on public.discount_rules for all    using (public.is_admin())
                                                                   with check (public.is_admin());
create policy settings_read    on public.app_settings  for select using (true);
create policy settings_write   on public.app_settings  for all    using (public.is_admin())
                                                                  with check (public.is_admin());
create policy admins_read      on public.admins        for select using (public.is_admin());

-- A delegate sees and files their own application; admins see all.
create policy delegate_select  on public.delegate_applications for select
  using (user_id = auth.uid() or public.is_admin());
create policy delegate_insert  on public.delegate_applications for insert
  with check (user_id = auth.uid());
create policy delegate_admin   on public.delegate_applications for update
  using (public.is_admin()) with check (public.is_admin());

-- Orders are readable by their owner and by admins. All writes go through the
-- SECURITY DEFINER functions above, so there is deliberately no INSERT/UPDATE
-- policy for delegates — a client cannot fabricate a total.
create policy orders_select    on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy orders_admin     on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

create policy lines_select     on public.order_lines for select
  using (exists (select 1 from public.orders o
                  where o.id = order_id
                    and (o.user_id = auth.uid() or public.is_admin())));

create policy regs_select      on public.registrations for select
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- Private payment-proof storage
--
-- Objects are keyed <user_id>/<order_id>.<ext>. The bucket is private, so the
-- app must mint a short-lived signed URL to display one. No public URL exists.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy proof_insert_own on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy proof_read_own on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy proof_update_own on storage.objects for update
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
