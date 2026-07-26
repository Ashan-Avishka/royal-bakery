create or replace function public.create_order_from_cart(
  p_user_id uuid,
  p_delivery_address text
) returns uuid
language plpgsql
as $$
declare
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  v_item record;
begin
  if not exists (select 1 from public.cart_items where user_id = p_user_id) then
    raise exception 'Cart is empty' using errcode = 'P0001';
  end if;

  for v_item in
    select ci.product_id, ci.quantity, p.price, p.stock_quantity, p.is_available, p.name
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = p_user_id
    for update of p
  loop
    if not v_item.is_available or v_item.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for product "%"', v_item.name using errcode = 'P0002';
    end if;
    v_total := v_total + (v_item.price * v_item.quantity);
  end loop;

  insert into public.orders (user_id, total_amount, delivery_address)
  values (p_user_id, v_total, p_delivery_address)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, unit_price, subtotal)
  select v_order_id, ci.product_id, ci.quantity, p.price, p.price * ci.quantity
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id;

  update public.products p
  set stock_quantity = p.stock_quantity - ci.quantity
  from public.cart_items ci
  where ci.product_id = p.id and ci.user_id = p_user_id;

  delete from public.cart_items where user_id = p_user_id;

  return v_order_id;
end;
$$;

create or replace function public.cancel_order(
  p_order_id uuid
) returns void
language plpgsql
as $$
begin
  if not exists (select 1 from public.orders where id = p_order_id and status not in ('completed', 'cancelled')) then
    raise exception 'Order cannot be cancelled' using errcode = 'P0003';
  end if;

  update public.products p
  set stock_quantity = p.stock_quantity + oi.quantity
  from public.order_items oi
  where oi.product_id = p.id and oi.order_id = p_order_id;

  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;
end;
$$;
