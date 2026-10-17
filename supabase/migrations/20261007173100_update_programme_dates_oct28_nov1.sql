-- Align the persisted event catalogue with the organiser-confirmed 28 Oct–1 Nov 2026 programme.
-- Existing event identities, prices, capacity and registration rules are preserved.
update public.events set event_date = date '2026-10-28' where id in ('s4-13','s4-22');
update public.events set event_date = date '2026-10-29' where id in ('s4-01','s4-02','s4-07','s4-09');
update public.events set event_date = date '2026-10-30' where id in ('s4-03','s4-05','s4-08','s4-10');
update public.events set event_date = date '2026-10-31' where id in ('s4-04','s4-06','s4-14','s4-19','s4-20','s4-26');
update public.events set event_date = date '2026-11-01' where id in ('s4-11','s4-12','s4-15','s4-16','s4-17','s4-18','s4-25');

-- Final brochure reconciliation. Guard the requested 75-seat STITCHREEF
-- override, which takes precedence over the printed brochure's old 50.
update public.events set slots = greatest(coalesce(slots, 0), 75) where id='s4-02';
-- PLEURALIS: 30 in the final brochure; organisers should verify no unconfirmed
-- capacity increase was separately approved before applying this migration.
update public.events set slots=30 where id='s4-09' and slots=40;

-- GLANDSWARS: its 6:00–6:45 PM time belongs to the ONLINE PRELIMS on 18 Oct.
-- The 28 Oct catalogue date is the offline semifinals/finals, whose start time
-- is not published in the brochure.
update public.events set start_time=null, end_time=null where id='s4-13';

-- Academic domains from the 18 Oct brochure.
update public.events set specialties=ARRAY[
  'General Medicine','General Surgery','Physiology','Pathology','Ophthalmology'
]::text[] where id='s4-14';
update public.events set specialties=ARRAY[
  'Medicine','Paediatrics','ENT','Ophthalmology','Surgery'
]::text[] where id='s4-15';

-- Quiz eligibility: junior 2023-batch cap 1; senior 2022-batch cap 2.
update public.event_registration_rules
set year_limits='[{"year":"2023","max":1}]'::jsonb
where event_id='s4-11';
update public.event_registration_rules
set year_limits='[{"year":"2021","max":1},{"year":"2022","max":2}]'::jsonb
where event_id='s4-12';

-- Ideathon permits four-person teams; older configuration capped at three.
update public.event_registration_rules
set max_members=4
where event_id='s4-18' and max_members=3;
