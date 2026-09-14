-- ============================================================================
-- organizer_registration_export: two changes, both found while stress-testing.
--
-- 1. The export had no sight of the new roster. An organiser downloading the
--    sheet could see that a team line was bought but not who is in the team,
--    which is the whole point of collecting the roster. The new columns are
--    APPENDED after the existing ones so anything reading the export by column
--    position keeps working.
--
-- 2. The view duplicated every order line for any delegate holding more than
--    one application row. `LEFT JOIN delegate_applications da ON da.user_id =
--    o.user_id` fans out once per application; one live user has a `revoked`
--    row and a `pending` row, so all five of their orders appeared twice, with
--    the revoked identity on one copy. The join is now a LATERAL picking a
--    single application — an approved or pending one first, then the most
--    recently submitted.
--
-- security_invoker stays on: the export must be read with the caller's own
-- privileges so the admin RLS policies decide who sees it, not the view owner.
-- ============================================================================

create or replace view public.organizer_registration_export
with (security_invoker = true) as
select
  o.id                as order_id,
  o.reference         as order_reference,
  o.user_id,
  da.full_name,
  da.email,
  da.phone,
  da.institution,
  da.year_of_study,
  da.status           as delegate_status,
  da.delegate_id,
  o.status            as order_status,
  o.subtotal,
  o.discount_amount,
  o.discount_label,
  o.total,
  o.proof_mime,
  o.proof_size,
  o.rejection_reason,
  o.created_at,
  o.submitted_at,
  o.reviewed_at,
  ol.id               as order_line_id,
  ol.event_id,
  ol.event_name,
  ol.event_code,
  ol.context,
  ol.category,
  ol.event_date,
  ol.start_time,
  ol.participation,
  ol.unit_price,
  ol.price_basis,
  ol.lunch_choice,
  -- Appended below this line; positional consumers of the old shape are safe.
  da.tier             as delegate_tier,
  ol.quantity         as team_entries,
  ol.combo_id,
  ol.unit_price * ol.quantity as line_total,
  (select count(*) from public.order_line_participants p
    where p.order_line_id = ol.id) as participant_count,
  (select string_agg(
            'T' || p.team_index || '.' || p."position" || ' ' || p.name
              || coalesce(' (' || p.year_of_study || ')', '')
              || coalesce(' ' || p.college, '')
              || coalesce(' ' || p.phone, ''),
            ' | ' order by p.team_index, p."position")
     from public.order_line_participants p
    where p.order_line_id = ol.id) as roster
from public.orders o
join public.order_lines ol on ol.order_id = o.id
left join lateral (
  select d.*
    from public.delegate_applications d
   where d.user_id = o.user_id
   order by (d.status in ('approved', 'pending')) desc, d.submitted_at desc
   limit 1
) da on true;

grant select on public.organizer_registration_export to authenticated;
