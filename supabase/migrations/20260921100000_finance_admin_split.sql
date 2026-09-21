-- Finance-only evidence access for the existing Vite/Supabase schema.
create or replace function public.is_finance_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on u.id = a.user_id
    where a.user_id = auth.uid()
      and lower(u.email) in ('financesigma26@gmail.com', 'gurugsv777@gmail.com')
  );
$$;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select
  using ((user_id = auth.uid()) or public.is_finance_admin());

drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for update
  using (public.is_finance_admin())
  with check (public.is_finance_admin());

drop policy if exists delegate_select on public.delegate_applications;
create policy delegate_select on public.delegate_applications for select
  using ((user_id = auth.uid()) or public.is_finance_admin());

drop policy if exists delegate_admin on public.delegate_applications;
create policy delegate_admin on public.delegate_applications for update
  using (public.is_finance_admin())
  with check (public.is_finance_admin());

drop policy if exists payment_proofs_select_admin on storage.objects;
create policy payment_proofs_select_finance on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.is_finance_admin());
