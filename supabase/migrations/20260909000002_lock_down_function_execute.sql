-- Postgres grants EXECUTE to PUBLIC on every new function, and the `anon` role
-- inherits that, so revoking from `anon` alone is a no-op. Revoke from PUBLIC
-- first, then grant back only to the roles that should hold it.
--
-- Caught by the Supabase security advisor after the initial migration
-- (lint 0028: anon_security_definer_function_executable).

revoke execute on function public.create_order(jsonb)                             from public, anon;
revoke execute on function public.submit_payment_proof(uuid, text, text, integer)  from public, anon;
revoke execute on function public.approve_order(uuid)                             from public, anon;
revoke execute on function public.reject_order(uuid, text)                        from public, anon;
revoke execute on function public.approve_delegate(uuid)                          from public, anon;
revoke execute on function public.reject_delegate(uuid, text)                     from public, anon;
revoke execute on function public.is_admin()                                      from public, anon;

-- Signed-in delegates own their cart-to-payment path.
grant execute on function public.create_order(jsonb)                              to authenticated;
grant execute on function public.submit_payment_proof(uuid, text, text, integer)   to authenticated;

-- Admin verification RPCs stay callable by `authenticated` because admins sign
-- in as that role; the is_admin() check inside each one is the real gate.
grant execute on function public.approve_order(uuid)                              to authenticated;
grant execute on function public.reject_order(uuid, text)                         to authenticated;
grant execute on function public.approve_delegate(uuid)                           to authenticated;
grant execute on function public.reject_delegate(uuid, text)                      to authenticated;
grant execute on function public.is_admin()                                       to authenticated;

-- Remaining-seat counts stay public: they are catalogue facts shown on Explore
-- cards next to the published slot count, and expose nothing about who booked.
