-- ============================================================================
-- AQUAQUEST takes up to three, and a lone entrant is allowed.
--
-- It was published as exactly three, and both the roster rule and the events
-- row said so, which meant validate_roster refused a one-person entry with
-- "AQUAQUEST needs exactly 3 participant(s)". The organisers have confirmed the
-- team is a maximum rather than a fixed size.
--
-- The fee is unchanged and still charged per team, so a solo entrant pays the
-- same 700 as a team of three.
--
-- Verified after applying: a one-person roster was accepted at 700, and a
-- four-person roster was still refused with "takes between 1 and 3 members"
-- (both probe orders removed afterwards).
-- ============================================================================

update public.events
   set team_min = 1
 where id = 's4-12';

update public.event_registration_rules
   set min_members = 1
 where event_id = 's4-12';
