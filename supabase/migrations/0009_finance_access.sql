-- Restrict finance evidence and review transitions to the designated finance account.
-- Registration and event dashboards continue to use the existing admin role model.

create or replace function is_finance_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join admin_users au on au.user_id = u.id
    where u.id = p_uid
      and lower(u.email) in ('financesigma26@gmail.com', 'gurugsv777@gmail.com')
  );
$$;

drop policy if exists payment_submissions_select_admin on payment_submissions;
drop policy if exists payment_submissions_write_admin on payment_submissions;
create policy payment_submissions_select_finance on payment_submissions
  for select using (is_finance_admin(auth.uid()));
create policy payment_submissions_write_finance on payment_submissions
  for all using (is_finance_admin(auth.uid())) with check (is_finance_admin(auth.uid()));

drop policy if exists payment_screenshots_select_admin on storage.objects;
create policy payment_screenshots_select_finance on storage.objects
  for select using (bucket_id = 'payment-screenshots' and is_finance_admin(auth.uid()));

-- Review RPCs are invoked by trusted server actions with the service role.
-- Removing the default PUBLIC execute grant prevents direct client invocation.
revoke execute on function approve_delegate_payment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function reject_delegate_payment(uuid, uuid, text, text, boolean) from public, anon, authenticated;
revoke execute on function approve_event_payment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function reject_event_payment(uuid, uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function approve_delegate_payment(uuid, uuid, text) to service_role;
grant execute on function reject_delegate_payment(uuid, uuid, text, text, boolean) to service_role;
grant execute on function approve_event_payment(uuid, uuid, text) to service_role;
grant execute on function reject_event_payment(uuid, uuid, text, text, boolean) to service_role;
