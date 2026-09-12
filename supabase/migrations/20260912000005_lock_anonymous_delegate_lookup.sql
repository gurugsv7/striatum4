-- Anonymous sessions use the authenticated Postgres role. Keep the helper
-- from becoming a cross-account existence oracle for delegate passes.
create or replace function public.has_active_delegate_pass(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  return exists (
    select 1
      from public.delegate_applications
     where user_id = p_user_id
       and status in ('pending', 'approved')
  );
end;
$$;

revoke execute on function public.has_active_delegate_pass(uuid) from public, anon;
grant execute on function public.has_active_delegate_pass(uuid) to authenticated;
