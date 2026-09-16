-- ============================================================================
-- Order write RPCs are for signed-in delegates only.
--
-- EXECUTE defaults to PUBLIC when a function is created, so set_order_line_abstract
-- and remove_order_line were reachable by the `anon` role through PostgREST.
-- Neither could actually do anything -- auth.uid() is null for anon, so they
-- raise 'Not authenticated' or 'That order is not yours' -- but an anonymous
-- caller had no business reaching them at all, and the database linter flagged
-- both. submit_free_order was revoked when it was written; this brings the
-- other two into line.
--
-- Verified after applying, for all five order RPCs:
--   has_function_privilege('anon', ...)          -> false
--   has_function_privilege('authenticated', ...) -> true
-- ============================================================================

revoke all on function public.set_order_line_abstract(uuid, text, text, bigint, text)
  from public, anon;
grant execute on function public.set_order_line_abstract(uuid, text, text, bigint, text)
  to authenticated;

revoke all on function public.remove_order_line(uuid) from public, anon;
grant execute on function public.remove_order_line(uuid) to authenticated;
