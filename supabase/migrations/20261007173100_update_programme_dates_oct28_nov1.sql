-- Align the persisted event catalogue with the organiser-confirmed 28 Oct–1 Nov 2026 programme.
-- Existing event identities, prices, capacity and registration rules are preserved.
update public.events set event_date = date '2026-10-28' where id in ('s4-13','s4-22');
update public.events set event_date = date '2026-10-29' where id in ('s4-01','s4-02','s4-07','s4-09');
update public.events set event_date = date '2026-10-30' where id in ('s4-03','s4-05','s4-08','s4-10');
update public.events set event_date = date '2026-10-31' where id in ('s4-04','s4-06','s4-14','s4-19','s4-20','s4-26');
update public.events set event_date = date '2026-11-01' where id in ('s4-11','s4-12','s4-15','s4-16','s4-17','s4-18','s4-25');
