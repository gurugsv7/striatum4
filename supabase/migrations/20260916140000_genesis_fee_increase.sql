-- ============================================================================
-- GENESIS: early bird 800 -> 1000, late bird 1000 -> 1200.
--
-- Only the event's published fee changes. Orders already placed keep the
-- unit_price recorded on their own lines, so a delegate who registered at 800
-- still owes 800 — which is what they were shown and what they have paid. One
-- such order existed when this was applied (S4 / 0102, under review).
-- ============================================================================

update public.events
   set price_early_bird = 1000,
       price_late_bird  = 1200
 where id = 's4-05';
