-- ============================================================================
-- The symposium, the case presentation and the ideathon take an abstract
-- first, not a payment.
--
-- All three were open for registration and checkout on the site. The organisers
-- have confirmed the actual flow: a participant emails an abstract, and only an
-- entry that is selected pays anything. Taking money up front would have been
-- collecting a fee from people who may never be selected.
--
-- They keep their published fees, which the event page now presents as what a
-- selected entry pays, and they keep their submission deadlines and addresses.
-- Only the ability to register and be charged through the site is withdrawn.
--
--   LUMINARA              400 per team, prize pool 4,000
--   THE DIAGNOSTIC ABYSS  400 flat, solo or team alike, 5,000 per domain
--   NEURONOVA             500 per team, prize pool 10,000
--
-- Nothing was registered or ordered for any of the three, so nothing is
-- stranded by this.
--
-- Verified after applying: create_order refuses all three with
-- "<name> is not open for registration".
-- ============================================================================

update public.events
   set registerable = false,
       status = 'not_registerable'
 where id in ('s4-14', 's4-15', 's4-18');
