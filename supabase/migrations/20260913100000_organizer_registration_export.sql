-- One organiser export row per event line, with delegate identity and contact
-- fields joined from the canonical delegate application record.
create or replace view public.organizer_registration_export
with (security_invoker = true) as
select
  o.id as order_id,
  o.reference as order_reference,
  o.user_id,
  da.full_name,
  da.email,
  da.phone,
  da.institution,
  da.year_of_study,
  da.status as delegate_status,
  da.delegate_id,
  o.status as order_status,
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
  ol.id as order_line_id,
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
  ol.lunch_choice
from public.orders o
left join public.delegate_applications da on da.user_id = o.user_id
join public.order_lines ol on ol.order_id = o.id;

comment on view public.organizer_registration_export is
  'Admin-facing joined export: one row per order event line with delegate identity, contact, payment, and lunch details.';
