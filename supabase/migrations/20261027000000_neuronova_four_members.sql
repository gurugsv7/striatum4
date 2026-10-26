-- Round 2 NEURONOVA accepts 1-4 participants at the existing fee.
-- Preserve historical order, fee and roster data; refuse unknown schema drift.
DO $change$
DECLARE v_function text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_function
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'start_round_two';
  IF v_function IS NULL
     OR position('e.id=''s4-18'' and n>3' IN v_function) = 0 THEN
    RAISE EXCEPTION 'Unexpected start_round_two function; review migration before editing';
  END IF;
  UPDATE public.event_registration_rules SET max_members = 4
  WHERE event_id = 's4-18' AND min_members = 1 AND max_members = 3;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unexpected NEURONOVA registration rule; review before editing';
  END IF;
  EXECUTE replace(v_function, 'e.id=''s4-18'' and n>3', 'e.id=''s4-18'' and n>4');
END
$change$;
