revoke execute on function public.set_order_lunch_choices(uuid, jsonb) from public;
revoke execute on function public.set_order_lunch_choices(uuid, jsonb) from anon;
grant execute on function public.set_order_lunch_choices(uuid, jsonb) to authenticated;
