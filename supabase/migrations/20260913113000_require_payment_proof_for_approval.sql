-- Payment review must be backed by a real private Storage object. UI checks are
-- helpful feedback, but these database guards are the security boundary.
create or replace function public.submit_payment_proof(
  p_order_id uuid, p_path text, p_mime text, p_size integer
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_expected_path text;
begin
  select * into v_order from public.orders
   where id = p_order_id and user_id = auth.uid()
     for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  if v_order.status not in ('awaiting_payment', 'rejected') then
    raise exception 'This order has already been submitted for verification'
      using errcode = 'P0001';
  end if;
  if p_mime not in ('image/jpeg', 'image/png') then
    raise exception 'Only JPG, JPEG or PNG screenshots can be accepted'
      using errcode = 'P0001';
  end if;
  if p_size is null or p_size <= 0 or p_size > 5242880 then
    raise exception 'Payment screenshot must be a non-empty image under 5 MB'
      using errcode = 'P0001';
  end if;

  v_expected_path := auth.uid()::text || '/' || p_order_id::text ||
    case when p_mime = 'image/png' then '.png' else '.jpg' end;

  if p_path is null or p_path <> v_expected_path then
    raise exception 'Invalid payment screenshot path' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from storage.objects obj
     where obj.bucket_id = 'payment-proofs'
       and obj.name = p_path
       and coalesce((obj.metadata ->> 'size')::bigint, 0) > 0
  ) then
    raise exception 'Upload the payment screenshot before submitting for verification'
      using errcode = 'P0001';
  end if;

  update public.orders
     set proof_path = p_path, proof_mime = p_mime, proof_size = p_size,
         status = 'under_review', submitted_at = now(), rejection_reason = null
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.approve_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line public.order_lines%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0001';
  end if;
  if v_order.status = 'approved' then
    raise exception 'Order is already approved' using errcode = 'P0001';
  end if;
  if v_order.status not in ('payment_submitted', 'under_review') then
    raise exception 'Payment proof must be submitted before approval'
      using errcode = 'P0001';
  end if;
  if v_order.proof_path is null
     or v_order.proof_mime not in ('image/jpeg', 'image/png')
     or v_order.proof_size is null
     or v_order.proof_size <= 0
     or v_order.proof_size > 5242880 then
    raise exception 'A valid payment screenshot is required before approval'
      using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from storage.objects obj
     where obj.bucket_id = 'payment-proofs'
       and obj.name = v_order.proof_path
       and coalesce((obj.metadata ->> 'size')::bigint, 0) > 0
  ) then
    raise exception 'Payment screenshot file is missing from secure storage'
      using errcode = 'P0001';
  end if;

  for v_line in select * from public.order_lines where order_id = p_order_id
  loop
    insert into public.registrations
      (order_id, user_id, event_id, participation, lunch_choice)
    values
      (v_order.id, v_order.user_id, v_line.event_id, v_line.participation, v_line.lunch_choice)
    on conflict (user_id, event_id) do nothing;
  end loop;

  update public.orders
     set status = 'approved', reviewed_at = now(),
         reviewed_by = auth.uid(), rejection_reason = null
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;
