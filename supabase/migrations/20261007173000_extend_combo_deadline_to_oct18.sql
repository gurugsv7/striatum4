-- Extend all STRIATUM 4.0 combo offers through the end of 18 October 2026 (Asia/Kolkata).
-- 18 Oct 23:59:59.999 IST = 18 Oct 18:29:59.999 UTC.
update public.discount_rules
set ends_at = timestamptz '2026-10-18 18:29:59.999+00',
    active = true
where kind = 'combo'
  and id like 'combo-%';
