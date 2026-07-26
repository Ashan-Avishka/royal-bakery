# Royal Bakery Frontend — Module 2: Cart, Checkout & Order Tracking

Status: approved for planning
Date: 2026-07-26
Depends on: `docs/superpowers/specs/2026-07-26-frontend-storefront-auth-design.md` (Phase 1 — layout, auth, product pages, merged), `docs/superpowers/specs/2026-07-26-cart-orders-api-design.md` (backend Module 3 — cart/orders API, merged)

## Context

Phase 1 deliberately shipped the product detail page with no add-to-cart control, since the cart/orders backend didn't exist yet. It now does. This module closes the loop: add to cart, view/edit the cart, check out, and track order status — completing the core browse → cart → checkout → track flow the whole project proposal is built around.

Per the frontend module list:
1. ~~Storefront + Auth~~ — done
2. **Cart, Checkout & Order Tracking** (this document)
3. Contact (working submission) — blocked on backend Module 5
4. Admin dashboard — separate scope decision

## Scope

| Screen | In scope |
|---|---|
| Add to cart (on Product Detail) | ✅ quantity input + submit; signed-out visitors see a "sign in to add to cart" prompt instead |
| Cart page | ✅ list items, change quantity, remove, subtotal, proceed to checkout |
| Checkout page | ✅ order summary, optional delivery address (blank = pickup), place order |
| Order confirmation | ✅ — same as the order detail page, landed on immediately after checkout |
| My Orders (list) | ✅ every past order with status |
| Order detail / tracking | ✅ status, items, total, delivery address |
| Quick add-to-cart from product cards/listing | ❌ deferred — `ProductCard` is currently one big `<Link>`; nesting a second interactive form inside it needs a layout change that's a distinct piece of work, not bundled into this scope |
| Payment during checkout | ❌ out of scope — Module 4 (PayHere). Checkout completes with `paymentStatus: "unpaid"`, exactly as the backend already returns |

Cart is never anonymous — `cart_items.user_id` is `not null` in the schema, so there's no guest-cart concept to support. Every page in this module requires a signed-in session, same `redirect('/login')` pattern `/account` already uses.

## Data layer

Two new client-side modules, mirroring `lib/catalog.ts`'s existing pattern (plain types + `api<T>()` calls, no state management library):

`client/src/lib/cart.ts`:
```ts
export interface CartItem {
  productId: string; name: string; price: number; imageUrl: string | null;
  quantity: number; subtotal: number; stockQuantity: number; isAvailable: boolean;
}
export interface Cart { items: CartItem[]; subtotal: number }

getCart(accessToken: string): Promise<Cart>
```

`client/src/lib/orders.ts`:
```ts
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export interface OrderItem { productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }
export interface OrderSummary { id: string; status: OrderStatus; paymentStatus: string; totalAmount: number; deliveryAddress: string | null; createdAt: string }
export interface Order extends OrderSummary { items: OrderItem[] }

listOrders(accessToken: string): Promise<OrderSummary[]>
getOrder(accessToken: string, id: string): Promise<Order | null>  // null on 404
```

Every page needing these fetches the Supabase session itself (`supabase.auth.getSession()`) and passes `session.access_token` through — same pattern `(shop)/account/page.tsx` already established. No new auth plumbing needed.

## Server Actions

`client/src/app/actions/cart.ts` (`"use server"`): `addToCart(productId, quantity)`, `updateCartItemQuantity(productId, quantity)`, `removeCartItem(productId)` — each re-derives the session token server-side (never trusts a client-supplied one), calls the matching cart endpoint, `revalidatePath` on the pages that show cart state (`/cart`, and the product detail page for the availability badge). Errors (404 unknown product, 409 insufficient stock) surface as a returned `{ error }` state via `useActionState`, same convention as `actions/auth.ts` and `actions/profile.ts`.

`client/src/app/actions/orders.ts`: `placeOrder(deliveryAddress?)` — calls `POST /api/orders`; on success `redirect(`/orders/${order.id}`)` (this is also the "confirmation" page — no separate confirmation screen). On a `400`/`409` (empty cart / insufficient stock), returns the error inline rather than redirecting, so the checkout page can show it without losing context.

## Pages

```
client/src/app/(shop)/
  products/[id]/page.tsx    — modified: adds the add-to-cart form
  cart/
    page.tsx                — Cart page
  checkout/
    page.tsx                — Checkout page
  orders/
    page.tsx                — My Orders list
    [id]/
      page.tsx              — Order detail / tracking (also the post-checkout landing page)
```

`client/src/components/CartItemRow.tsx` — one cart line: image, name, price, a quantity `<form>` (number input + submit, posts to `updateCartItemQuantity`), a remove `<form>` (posts to `removeCartItem`). Plain forms, no client-side state — consistent with how every other mutation in this codebase works (progressive enhancement, no unnecessary `"use client"`).

`client/src/components/OrderStatusBadge.tsx` — small shared component mapping `OrderStatus` → `Badge` tone/label (`pending`→honey "Pending", `processing`→honey "Processing", `completed`→success "Completed", `cancelled`→muted "Cancelled"), used on both the list and detail pages.

## Header changes

Adds a "Cart" link next to "Account"/"Sign out" (signed-in only, matching how those already only render for a session) showing the item count as a small badge — fetched via `getCart` in the same async `Header` Server Component that already fetches the session, no new pattern. Adds a "My Orders" link alongside it. Signed-out visitors keep seeing exactly what they see today (Sign In / Sign Up) — no cart affordance for them, since there's nothing to show without a session.

## Product Detail page changes

Adds, below the existing price/stock/description block:
- If signed in and in stock: a `<form action={addToCart}>` with a `productId` hidden input, a `quantity` number input (`min=1`, `max={stockQuantity}`, `defaultValue=1`), and a submit button. Errors (e.g. requesting more than in-stock, though the input's `max` already discourages it) render inline the same way `AccountForm` shows its save errors.
- If signed in and out of stock: the form is replaced with a disabled "Out of stock" state (no submit control).
- If signed out: a "Sign in to add to cart" link to `/login`.

## Out of scope / open items

- Quick-add from product listing cards — needs a `ProductCard` layout change (splitting the link area from an interactive form area), tracked as a follow-up, not bundled here.
- Editing/cancelling an order as a customer — only admins can change order status (matches the backend's existing scope decision).
- Payment step in checkout — Module 4.
- Any notification (email) on order placement or status change — Module 4/5.

## Testing approach

Same as Phase 1: no frontend test framework introduced. `npm run build` as the compile-correctness gate, then a full manual browser walkthrough (add to cart, adjust quantity, remove, checkout with and without a delivery address, view order in the list and detail pages, confirm a second account can't see the first's order via a guessed URL) against the live Supabase project + Express API before this module is considered done.
