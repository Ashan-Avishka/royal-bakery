# Royal Bakery Backend — Module 3: Cart & Orders API

Status: approved for planning
Date: 2026-07-26
Depends on: `docs/superpowers/specs/2026-07-24-backend-schema-auth-design.md` (Module 1 — schema incl. `cart_items`/`orders`/`order_items`, auth/RBAC), `docs/superpowers/specs/2026-07-25-catalog-api-design.md` (Module 2 — catalog, `products.stock_quantity`)

## Context

Module 1's schema already defines `cart_items`, `orders`, `order_items`, and `payments` (plus RLS enabled with no policies — deny-all, same access-control model as every other table). No route reads or writes any of them yet. This module builds the cart and the checkout/order lifecycle; `payments` stays untouched (`payment_status` remains `'unpaid'` throughout — that's Module 4's job, once PayHere is integrated).

Per the Module 1 spec's module sequence:

1. ~~Database schema + auth/profile sync~~ — done
2. ~~Product & category catalog API~~ — done
3. **Cart & orders API** (this document)
4. PayHere payment integration
5. Inquiries + admin reporting

No schema migration is needed for the tables themselves — they already exist exactly as required. One migration *is* needed, for two Postgres functions (see below).

## Why two operations need a Postgres function instead of plain REST calls

Every other write in this codebase (Modules 1–2) is a single-table Supabase REST call, which is why the service layer has stayed simple. Checkout is different: it touches `orders`, `order_items`, `products.stock_quantity`, and `cart_items` together, and money/inventory correctness actually matters here — a partial failure (order created but stock not decremented, or stock decremented but cart not cleared) is a real bug, not a cosmetic one. The Supabase JS client has no multi-statement transaction API over PostgREST, so the only way to get atomicity is a Postgres function (which runs in a single transaction) called via `.rpc()`.

Two operations get this treatment:
- **`create_order_from_cart(p_user_id, p_delivery_address)`** — validates the cart isn't empty and every item still has enough stock, creates the order + order_items, decrements stock, clears the cart. All-or-nothing.
- **`cancel_order(p_order_id)`** — restores stock for every item on the order, sets status to `cancelled`. All-or-nothing.

Every other write in this module (add/update/remove cart item, list orders, non-cancel status transitions) stays a plain single-table REST call, same as Modules 1–2 — the function is reserved for the two places that genuinely need it.

**Testing consequence:** the fake Supabase client (Task 1 of the plan) gains a generic `.rpc(name, params)` mock that individual tests configure with a canned success/error response — this tests that `orderService` calls the RPC correctly and handles its result/error shape, but it does **not** test the SQL/plpgsql logic itself (there's no SQL engine in the fake client). That logic is verified for real in this module's live-Supabase manual verification pass instead — same precedent as Module 2 deferring the `categories.name` unique-constraint (`23505`) path to manual verification, since the fake client can't simulate a real constraint violation either.

## Access control

Unchanged architecture: Express is the only writer, via `getSupabaseAdmin()` (service-role, bypasses RLS). Cart and self-service order routes require `requireAuth` only (any authenticated customer, acting on their own data — enforced in the service layer by filtering on `user_id`, not by role). Admin order routes require `requireAuth` + `requireRole("admin")`.

## Database migration

New file, one migration, two functions:

```sql
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
```

`for update of p` row-locks the products being checked, so two concurrent checkouts against the same low-stock product can't both pass the stock check before either decrements it.

## Service layer

`server/src/types/cart.ts`, `server/src/types/order.ts` — domain types, camelCase, mapped from snake_case rows exactly like `catalogService`.

```ts
interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  isAvailable: boolean;
}
interface Cart {
  items: CartItem[];
  subtotal: number;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
interface OrderSummary {
  id: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  totalAmount: number;
  deliveryAddress: string | null;
  createdAt: string;
}
interface Order extends OrderSummary {
  items: OrderItem[];
}
```

`server/src/services/cartService.ts` — `getCart(userId)` (fetches `cart_items` for the user, then `products` by the referenced ids in a second query, merges in JS — no join/embed support needed in the fake client, consistent with how every other service in this codebase already works), `addToCart(userId, productId, quantity)` (validates the product exists/is available, upserts — increases quantity if already present), `setCartItemQuantity(userId, productId, quantity)`, `removeCartItem(userId, productId)`, `clearCart(userId)`.

`server/src/services/orderService.ts` — `createOrderFromCart(userId, deliveryAddress?)` (calls the RPC; maps `P0001` → `AppError(400, "Cart is empty")`, `P0002` → `AppError(409, error.message)`, then fetches and returns the newly created order), `listOrdersForUser(userId)`, `getOrderForUser(userId, orderId)` (404 if missing *or* belongs to someone else — never distinguish the two), `listAllOrders(filters: { status?: string })` (admin), `getOrderById(orderId)` (admin, no ownership filter), `updateOrderStatus(orderId, status)` (plain update for `pending`/`processing`/`completed`; calls the `cancel_order` RPC when status is `cancelled`, mapping `P0003` → `AppError(409, "Order cannot be cancelled")`).

## Express API surface

Base path `/api`. Errors as `{ error: { message } }`, same as every other module.

### Customer (`requireAuth`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/cart` | Current user's cart + subtotal |
| `POST` | `/cart` | Body: `{ productId, quantity }` — add/increase |
| `PUT` | `/cart/:productId` | Body: `{ quantity }` — set exact quantity |
| `DELETE` | `/cart/:productId` | Remove one item |
| `DELETE` | `/cart` | Clear the whole cart |
| `POST` | `/orders` | Body: `{ deliveryAddress? }` — checkout; `null`/omitted `deliveryAddress` means pickup |
| `GET` | `/orders` | List own orders (summaries) |
| `GET` | `/orders/:id` | Own order detail with items; 404 if not found or not yours |

### Admin (`requireAuth` + `requireRole("admin")`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/orders` | All orders; optional `?status=` filter |
| `GET` | `/admin/orders/:id` | Any order detail, no ownership check |
| `PUT` | `/admin/orders/:id/status` | Body: `{ status }`; `cancelled` triggers stock restoration |

## Validation

`server/src/validation/cartSchemas.ts`: `addCartItemSchema` (`{ productId: uuid, quantity: int >= 1 }`), `updateCartItemQuantitySchema` (`{ quantity: int >= 1 }`), `productIdParamSchema` (`{ productId: uuid }`).

`server/src/validation/orderSchemas.ts`: `createOrderSchema` (`{ deliveryAddress?: string, trimmed, max 500 }`), `updateOrderStatusSchema` (`{ status: enum(pending, processing, completed, cancelled) }`), reuses `idParamSchema` from `catalogSchemas.ts` for `:id`.

## Out of scope for this module

- Payments (`payments` table, PayHere) — Module 4. Checkout leaves `payment_status: 'unpaid'`; nothing in this module ever sets it otherwise.
- Order status notifications (email) — mentioned in the project proposal but tied to Module 4/5's integration work, not this module.
- Quantity limits / max-per-product business rules beyond "must not exceed current stock" — not requested, not added speculatively.
- Editing an order after checkout (customers can't modify a placed order in this module — only admins can transition its status).

## Testing approach

Same fake-client unit-test strategy as Modules 1–2, plus the new `.rpc()` mock described above. Route-level Supertest coverage: 401 on every route without auth, 403 on admin routes without the admin role, 400/409 on the validation and business-rule failure paths (empty cart, insufficient stock via a canned `.rpc()` error, cancelling a completed order), ownership enforcement on `GET /orders/:id` (a different user's order 404s), and the full happy-path shapes.

Live-Supabase manual verification (this module's Task N, mirroring Module 2's Task 9): add real items to a cart, check out, confirm stock actually decremented and the cart actually cleared, attempt to over-order a low-stock item and confirm the real `P0002` rejection, cancel an order and confirm stock is restored — this is where the plpgsql functions themselves get proven correct, since the fake client can't do that.

## Open items carried to later modules

- Payment status transitions and the PayHere webhook — Module 4.
- Order-related email notifications — Module 4/5.
- Any reporting/analytics over orders (sales totals, popular products) — Module 5 per the original proposal's admin reporting scope.
