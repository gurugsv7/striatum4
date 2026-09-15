-- ============================================================================
-- The two games trade terms.
--
-- MEDMAZE is the gated one: no entry fee, and a Tier 2 (SYNEXA) Delegate Pass
-- is the whole requirement. Its own description has said "Tier 2 registration
-- is required" all along; the enforced columns now agree.
--
-- THE MEDICAL VAULT is the paid one: 200 a team, open to anyone, no pass.
--
-- This reverses the arrangement applied a day earlier, when the Vault was the
-- free Tier 2 event. Nothing was registered or ordered for either, so nothing
-- is stranded by the change.
--
-- MEDMAZE being free means it now takes the zero-total path added for the
-- Vault: a Tier 2 delegate registering it alone is confirmed on the spot with
-- no payment step, since there is nothing to pay.
--
-- Verified against the live database after applying:
--   Tier 1 delegate -> MEDMAZE        refused, "requires a SYNEXA Delegate Pass"
--   Tier 1 delegate -> MEDICAL VAULT  accepted, 200, awaiting_payment
--   Tier 2 delegate -> MEDMAZE        accepted, 0, approved, registration written
--   no pass at all  -> MEDICAL VAULT  accepted, 200
--   no pass at all  -> MEDMAZE        refused, "requires a Delegate Pass"
-- ============================================================================

update public.events
   set price_team = 200,
       price_flat = null,
       price_unit = 'per_team',
       delegate_pass_requirement = 'not_required'
 where id = 's4-25';

update public.event_registration_rules
   set required_tier = null
 where event_id = 's4-25';

update public.events
   set price_team = null,
       price_flat = 0,
       price_unit = 'per_team',
       delegate_pass_requirement = 'required'
 where id = 's4-26';

update public.event_registration_rules
   set required_tier = 'SYNEXA'
 where event_id = 's4-26';
