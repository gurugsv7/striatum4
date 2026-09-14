-- ============================================================================
-- reject_delegate: present in production, absent from this repository.
--
-- 20260909000002_lock_down_function_execute.sql revokes and grants
-- public.reject_delegate(uuid, text), and src/services/remote.ts calls it, but
-- no migration in this tree ever created it. It exists in the deployed database
-- (created outside this history), so the app works -- but a rebuild from these
-- migrations alone would produce a database without it, and delegate rejection
-- would fail.
--
-- Reproduced here verbatim from the deployed definition so the repository can
-- stand on its own. Running this against the live database is a no-op.
-- ============================================================================

create or replace function public.reject_delegate(p_application_id uuid, p_reason text)
returns public.delegate_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.delegate_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = 'P0001';
  end if;

  update public.delegate_applications
     set status = 'rejected', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = btrim(p_reason)
   where id = p_application_id
   returning * into v_app;

  if not found then
    raise exception 'Application not found' using errcode = 'P0001';
  end if;
  return v_app;
end;
$$;

revoke execute on function public.reject_delegate(uuid, text) from public, anon;
grant  execute on function public.reject_delegate(uuid, text) to authenticated;
