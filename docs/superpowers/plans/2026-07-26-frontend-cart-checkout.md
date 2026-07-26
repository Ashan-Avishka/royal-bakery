# Royal Bakery Frontend — Cart, Checkout & Order Tracking Implementation Plan

Design doc: `docs/superpowers/specs/2026-07-26-frontend-cart-checkout-design.md`

No test framework, same as Phase 1 — each task is "write the files, `npm run build`,"
with a full manual browser walkthrough as the final task. `cd client` assumed
for every command.

## Global constraints

- Server Components by default; forms use Server Actions (progressive
  enhancement, no client-side state) — same convention as `actions/auth.ts`/`actions/profile.ts`.
- Every page in this module requires a session — `redirect('/login')` if
  `supabase.auth.getUser()` returns null, same pattern `/account` already uses.
- Data fetching goes through new `lib/cart.ts`/`lib/orders.ts`, mirroring
  `lib/catalog.ts`'s shape (plain async functions, no client state library).
- Do not modify `server/` — backend-only work is done (Module 3, merged).
- Stage only (`git add`), no commits — same standing rule as every prior module.

---

### Task 1: Cart and order data-layer modules

**Files:** `client/src/lib/cart.ts`, `client/src/lib/orders.ts`

Plain types + `api<T>()` calls per the design doc's "Data layer" section.
`getCart`/`listOrders`/`getOrder` all take an `accessToken` param and set
`Authorization: Bearer ${accessToken}` — no session lookup inside these
files, callers (pages) own fetching the session, same separation
`actions/profile.ts` already has.

Verify: `npm run build` still passes (nothing imports these yet, but they
must compile standalone).

### Task 2: Cart Server Actions

**Files:** `client/src/app/actions/cart.ts`

`addToCart(productId, quantity)`, `updateCartItemQuantity(productId, quantity)`,
`removeCartItem(productId)` — each: get the session, 401-equivalent early
return if none, call the matching cart endpoint with the token, `revalidatePath("/cart")`
and `revalidatePath(`/products/${productId}`)`, return `{ error }` state for
`useActionState`-less plain forms (these are invoked via plain `<form action={...}>`,
not `useActionState`, since none of these need pending-state UI beyond what
the browser gives for free — errors surface via a redirect-with-query or by
re-rendering the page after `revalidatePath` reads the latest cart and shows
any lingering problem inline. Decide the exact error-surfacing mechanism
while implementing — the important constraint is: a 409 (insufficient
stock) must never look like a silent no-op to the user).

### Task 3: Order Server Action

**Files:** `client/src/app/actions/orders.ts`

`placeOrder(deliveryAddress?)` — get the session, call `POST /api/orders`.
On success, `redirect(`/orders/${order.id}`)`. On a caught `ApiError` with
status 400/409, return `{ error: err.message }` instead of throwing, so the
checkout page can render it without losing the delivery-address input the
customer already typed.

### Task 4: Shared components

**Files:** `client/src/components/OrderStatusBadge.tsx`, `client/src/components/CartItemRow.tsx`

- `OrderStatusBadge`: maps `OrderStatus` to a `Badge` tone/label per the design doc.
- `CartItemRow`: one cart line — image/name/price, a quantity `<form>`
  (number input, `min=1`, `max={stockQuantity}`, posts to `updateCartItemQuantity`),
  a remove `<form>` (posts to `removeCartItem`).

### Task 5: Cart page

**Files:** `client/src/app/(shop)/cart/page.tsx`

Server Component: redirect to `/login` if unauthenticated; fetch the cart;
empty state with a "browse the menu" link if no items; otherwise a list of
`CartItemRow` plus a subtotal and a "Proceed to checkout" link to `/checkout`
(only enabled/shown when the cart isn't empty).

### Task 6: Checkout page

**Files:** `client/src/app/(shop)/checkout/page.tsx`

Server Component: redirect to `/login` if unauthenticated; redirect to
`/cart` if the cart is empty (nothing to check out); shows an order summary
(reuse the cart data), a delivery-address textarea (optional, helper text
"Leave blank for pickup"), and a submit button wired to `placeOrder`.

### Task 7: My Orders list page

**Files:** `client/src/app/(shop)/orders/page.tsx`

Server Component: redirect to `/login` if unauthenticated; fetch
`listOrders`; empty state if none yet; otherwise a list of orders (id,
date, status via `OrderStatusBadge`, total) each linking to `/orders/:id`.

### Task 8: Order detail / tracking page

**Files:** `client/src/app/(shop)/orders/[id]/page.tsx`

Server Component: redirect to `/login` if unauthenticated; `params: Promise<{ id: string }>`
(must `await`); `getOrder` returns `null` on a 404 (either missing or not
owned by this user, per the backend's ownership-hiding design) → Next's
`notFound()`. Shows status (`OrderStatusBadge`), items, total, delivery
address (or "Pickup" if null), creation date. This page is also where a
customer lands immediately after checkout, so it doubles as the order
confirmation screen — no separate confirmation route.

### Task 9: Add-to-cart on Product Detail

**Files:** `client/src/app/(shop)/products/[id]/page.tsx` (modify)

Becomes session-aware (check `supabase.auth.getUser()`, same as other pages
but note this page must stay viewable when signed out — only the add-to-cart
control itself is conditional, the page as a whole is still public). Adds,
below the existing price/stock/description block, per the design doc's
"Product Detail page changes" section: signed-in + in-stock → quantity
form; signed-in + out-of-stock → disabled state; signed-out → "Sign in to
add to cart" link.

### Task 10: Header — cart badge and My Orders link

**Files:** `client/src/components/Header.tsx` (modify)

When a session exists, fetch the cart (via `getCart` with the session
token, same async Server Component already fetching the user) and show a
"Cart" link with an item-count badge, plus a "My Orders" link, alongside
the existing Account/Sign out. Signed-out rendering is unchanged.

### Task 11: Full manual verification (Definition of Done)

No new files — the checklist proving this module works end-to-end.

1. `npm run build` — exits 0, no type errors.
2. Both dev servers running (`server`: 4000, `client`: 3000).
3. Signed out, visit a product detail page — see "Sign in to add to cart",
   not a broken form.
4. Signed in, add a product to cart with a chosen quantity — redirected or
   revalidated to reflect it; header cart badge updates.
5. `/cart` — shows the item, quantity change persists and recomputes the
   subtotal, remove empties it back to the empty state.
6. Add an item back, `/checkout` — place an order with a delivery address;
   land on `/orders/:id` showing the right items/total/address and
   `pending` status; cart is now empty; product stock decreased by the
   ordered quantity (confirm via the admin product list or `/api/admin/products`).
7. Attempt to order more of a product than is in stock — confirm the 409
   from the backend surfaces as a real inline error, not a crash.
8. `/orders` — the placed order appears with the right status badge.
9. As a *different* signed-in account, try `/orders/:id` with the first
   account's order id (typed directly in the URL) — confirm `notFound()`,
   not the order.
10. Sign out, visit `/cart`, `/checkout`, `/orders`, `/orders/:id` — all
    redirect to `/login`.
11. Clean up any test product/order data created purely for this pass,
    stop both dev servers.

Module is done once steps 3–10 all match their expected results.
