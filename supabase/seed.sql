-- ============================================================================
-- STRIATUM 4.0 — seed.sql
-- Seeds ONLY what the product spec (00-PRODUCT.md §3.15) actually supplies:
-- event types, the six programme days with their named events (names only —
-- every other field left NULL / closed), and the baseline delegate form
-- fields. No fake users, delegates, registrations, prices, or venues.
--
-- Idempotent: safe to re-run (upserts on natural keys).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- app_settings — single row, not launched, no dates invented
-- ----------------------------------------------------------------------------
insert into app_settings (id, launched, launch_date, symposium_start, symposium_end)
values (true, false, null, '2026-10-13', '2026-10-18')
on conflict (id) do update set
  symposium_start = excluded.symposium_start,
  symposium_end   = excluded.symposium_end;

-- ----------------------------------------------------------------------------
-- payment_settings — one active row, fee intentionally NULL (not announced)
-- ----------------------------------------------------------------------------
insert into payment_settings (
  delegate_fee_inr, payee_name, upi_id, qr_storage_path,
  instructions, require_transaction_ref, is_active
)
select null, null, null, null, null, false, true
where not exists (select 1 from payment_settings where is_active);

-- ----------------------------------------------------------------------------
-- event_types
-- ----------------------------------------------------------------------------
insert into event_types (key, label, sort_order, is_active) values
  ('WORKSHOP',     'Workshop',     1, true),
  ('COMPETITION',  'Competition',  2, true),
  ('PRESENTATION', 'Presentation', 3, true),
  ('OTHER',        'Other',        4, true)
on conflict (key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ----------------------------------------------------------------------------
-- events — §3.15 programme, names only. Type assignment below is a
-- judgement-call keyword categorization (see docs/02-SCHEMA.md) — every
-- other field (date beyond the named day, time, venue, fee, capacity,
-- eligibility, speakers, rules) is left NULL, and registration_open is
-- false, exactly as the spec requires.
-- ----------------------------------------------------------------------------
with types as (
  select key, id from event_types
)
insert into events (slug, name, type_id, event_date, format, is_paid, registration_open, sort_order)
select v.slug, v.name, t.id, v.event_date::date, 'INDIVIDUAL', false, false, v.sort_order
from (values
  -- 13 OCT
  ('inauguration',                  'Inauguration',                     'OTHER',        '2026-10-13', 1),
  ('online-quiz-semifinal-finals',  'Online Quiz Semifinal & Finals',   'COMPETITION',  '2026-10-13', 2),
  ('expo',                          'Expo',                             'OTHER',        '2026-10-13', 3),
  -- 14 OCT
  ('surgery-workshop',              'Surgery Workshop',                 'WORKSHOP',     '2026-10-14', 4),
  ('obg-workshop',                  'OBG Workshop',                     'WORKSHOP',     '2026-10-14', 5),
  ('rm',                            'RM',                               'OTHER',        '2026-10-14', 6),
  ('symposium',                     'Symposium',                        'OTHER',        '2026-10-14', 7),
  -- 15 OCT
  ('paediatrics-workshop',          'Paediatrics Workshop',             'WORKSHOP',     '2026-10-15', 8),
  ('disaster-management',           'Disaster Management',              'OTHER',        '2026-10-15', 9),
  ('anaesthesia',                   'Anaesthesia',                      'OTHER',        '2026-10-15', 10),
  ('fine-art',                      'Fine Art',                         'OTHER',        '2026-10-15', 11),
  ('mystery-room',                  'Mystery Room',                     'COMPETITION',  '2026-10-15', 12),
  -- 16 OCT
  ('ortho-workshop',                'Ortho Workshop',                   'WORKSHOP',     '2026-10-16', 13),
  ('em-2',                          'EM 2',                             'OTHER',        '2026-10-16', 14),
  ('radio-workshop',                'Radio Workshop',                   'WORKSHOP',     '2026-10-16', 15),
  ('3-mins-research',               '3 Mins Research',                  'PRESENTATION', '2026-10-16', 16),
  -- 17 OCT
  ('cm-workshop',                   'CM Workshop',                      'WORKSHOP',     '2026-10-17', 17),
  ('ecg',                           'ECG',                              'OTHER',        '2026-10-17', 18),
  ('ideathon',                      'Ideathon',                         'COMPETITION',  '2026-10-17', 19),
  ('gala-night',                    'Gala Night',                       'OTHER',        '2026-10-17', 20),
  -- 18 OCT
  ('junior-senior-quiz',            'Junior and Senior Quiz',           'COMPETITION',  '2026-10-18', 21),
  ('case-presentation',             'Case Presentation',                'PRESENTATION', '2026-10-18', 22),
  ('research-presentation',         'Research Presentation',            'PRESENTATION', '2026-10-18', 23),
  ('poster-presentation',           'Poster Presentation',              'PRESENTATION', '2026-10-18', 24)
) as v(slug, name, type_key, event_date, sort_order)
join types t on t.key = v.type_key
on conflict (slug) do update set
  name = excluded.name,
  type_id = excluded.type_id,
  event_date = excluded.event_date,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- delegate_form_fields — baseline fields (mirrors the dedicated columns on
-- delegate_applications so the form can be rendered data-driven from day
-- one). student_id is optional per spec ("optional unless configured
-- required"). No option lists are invented for year_of_study — plain text.
-- ----------------------------------------------------------------------------
insert into delegate_form_fields (key, label, help_text, field_type, options, required, sort_order, is_active)
values
  ('full_name',     'Full Name',           null, 'TEXT',  null, true,  1, true),
  ('email',         'Email',               'Prefilled from your account', 'EMAIL', null, true, 2, true),
  ('mobile',        'Mobile Number',       null, 'TEL',   null, true,  3, true),
  ('college',       'College / Institution', null, 'TEXT', null, true, 4, true),
  ('year_of_study',  'Year of Study',      null, 'TEXT',  null, true,  5, true),
  ('student_id',    'Student ID',          'Optional unless required by organizers', 'TEXT', null, false, 6, true)
on conflict (key) do update set
  label = excluded.label,
  help_text = excluded.help_text,
  field_type = excluded.field_type,
  required = excluded.required,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ============================================================================
-- END seed.sql
-- ============================================================================
