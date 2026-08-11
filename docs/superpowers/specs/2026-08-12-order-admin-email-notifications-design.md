# Order & Admin Email Notifications — Design

## Context

The backend has SMTP credentials already configured (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Gmail, wired into `server/src/config/env.ts`'s zod schema) but nothing sends email today: no mail library is installed, no notification code exists. There is no background job/queue/cron infrastructure in this backend — everything is synchronous request/response.

Auth (including signup) is entirely delegated to Supabase Auth. Supabase already blocks session creation for an unconfirmed email and sends its own confirmation email via its own project-level mail settings — this is independent of the app's SMTP credentials and is out of scope for this feature (see Scope).

## Scope

Five transactional email types, all backend-only, all fire-and-forget:

1. Order confirmation → customer, on order creation.
2. Order status change → customer, on `orders.status` update (processing / completed / cancelled).
3. Payment status change → customer, on `orders.payment_status` update (via the PayHere webhook).
4. New order → admin, on order creation.
5. Low stock → admin, when an order pushes a product's stock at-or-below the existing `LOW_STOCK_THRESHOLD` (5), alerting once per crossing rather than on every order that touches an already-low product.

**Explicitly out of scope:** email verification / signup flow (already fully handled by Supabase Auth — confirmed with the user that no changes are needed there), any new UI, retry queues, scheduled/digest emails, and low-stock checks triggered by anything other than order placement (e.g. admin manually editing stock does not trigger a check).

## Backend changes

### Dependency

Add `nodemailer` (+ `@types/nodemailer` dev dependency).

### `server/src/config/env.ts`

Add two keys to the existing zod schema, alongside the current `SMTP_*` block:
- `SMTP_FROM_EMAIL: z.string().default("")` — the email's `From:` address. Falls back to `SMTP_USER` at the point emails are sent if left unset (not at env-parse time), since `SMTP_USER` is already validated there.
- `ADMIN_NOTIFICATION_EMAIL: z.string().default("")` — where admin notifications (#4, #5) go. If unset, admin sends are skipped with a logged warning — never a crash, never blocks the customer-facing request that triggered them.

Both also get added to `server/.env.example` under the existing `# --- SMTP ---` comment block.

### `server/src/lib/mailer.ts` (new)

A singleton nodemailer transporter built from `env.SMTP_HOST/PORT/USER/PASS`, exposing one function:

```ts
sendMail(params: { to: string; subject: string; html: string; text: string }): Promise<void>
```

This function **never throws and never rejects** — any failure (SMTP connection error, auth failure, malformed recipient) is caught internally and logged via `console.error`. This is the single place the "fire-and-forget, log failures" policy lives, so every call site can call it without its own try/catch and without awaiting if it doesn't want to.

### `server/src/emails/` (new directory)

Plain template-literal functions — no templating library, five email types don't justify one. One shared shell function (branded header/footer using the site's cocoa/caramel palette, both HTML and a plain-text equivalent) wraps five content builders, one per email type in the Scope list. Each builder takes plain data (order, customer name, old/new status, product name + remaining stock, etc.) and returns `{ subject, html, text }` — no I/O, easily unit-testable in isolation.

### `server/src/services/notificationService.ts` (new)

The five `sendXEmail(...)` functions that other services call directly:
- `sendOrderConfirmationEmail(order, customerEmail)`
- `sendOrderStatusChangeEmail(order, customerEmail, previousStatus)`
- `sendPaymentStatusChangeEmail(order, customerEmail, previousPaymentStatus)`
- `sendAdminNewOrderEmail(order, customerEmail)`
- `sendAdminLowStockEmail(crossedProducts: { name: string; stockQuantity: number }[])`

Each builds its content via `server/src/emails/` and calls `mailer.sendMail`. `sendAdminNewOrderEmail`/`sendAdminLowStockEmail` no-op with a logged warning if `ADMIN_NOTIFICATION_EMAIL` is unset.

`LOW_STOCK_THRESHOLD` is exported from its existing home in `server/src/services/analyticsService.ts` and imported here — not redefined a third time (it's already duplicated once, in `client/src/lib/admin/catalog.ts`, and that's not being touched by this feature).

## Trigger points

### 1 & 2. Order confirmation + new-order admin alert — `orderService.createOrderFromCart`

After the order is created via the `create_order_from_cart` RPC and reloaded (existing code), look up the customer's email via `getSupabaseAdmin().auth.admin.getUserById(userId)` (same pattern already used in `profileService.setUserRole`), then fire `sendOrderConfirmationEmail` and `sendAdminNewOrderEmail`.

### 3. Low-stock admin alert — same hook as above

The stock decrement happens atomically inside the `create_order_from_cart` SQL function (`server/supabase/migrations/20260726062801_order_functions.sql`) — the JS layer never sees a "before" stock value directly. Since the decrement is atomic and equals the ordered quantity, `stockBefore = stockAfter + quantityOrdered` can be derived without an extra "before" query: for each line item in the newly created order, fetch the product's current (post-decrement) `stock_quantity`, compute what it was before, and flag it if `stockBefore > LOW_STOCK_THRESHOLD >= stockAfter`. All flagged products from this single order go into **one** combined `sendAdminLowStockEmail` call, not one email per product — avoids spamming the admin inbox when one order pushes several items low at once. If a product was already at-or-below the threshold before this order (no crossing), it's silently skipped — the admin was already alerted for it.

### 4. Order status change — `orderService.updateOrderStatus`

After the status is written (both the plain-update branch and the `cancel_order` RPC branch) and the order is reloaded, email the customer with the previous and new status. The function already loads the order once at the top (to check it exists) — that gives the "previous" status for free. The customer's `user_id` isn't currently exposed past the mapped `Order`/`OrderSummary` DTOs (`mapOrderSummary` drops it); the hook reads it directly off the raw row already being fetched internally.

### 5. Payment status change — `paymentService.processPaymentNotification`

After the existing `orders.payment_status` update, email the customer with the previous and new payment status. The function doesn't currently select `user_id` back from that update — adding `.select("user_id, payment_status")` (or a light follow-up read) to the existing update call is the cheapest way to get what's needed without a second round trip.

## Data flow

**Order placement:** customer submits → RPC decrements stock + creates order (unchanged) → order reloaded → customer email looked up → confirmation email fires → admin new-order email fires → per-item stock-crossing check runs → admin low-stock email fires if anything crossed. All sends are independent and fire-and-forget; any one failing never affects the others or the HTTP response already being sent to the customer.

**Status / payment updates:** the real DB write always happens and succeeds *before* any email is attempted, so a failed or slow email can never block, delay, or reverse a real state change — worst case, a notification silently doesn't arrive (logged) while the underlying order/payment state is already correct.

## Error handling

Every failure mode — unset `ADMIN_NOTIFICATION_EMAIL`, SMTP connection/auth failure, malformed recipient address, a template builder throwing on unexpected input — is caught inside `mailer.ts` (and, for the admin-email-unset case, inside `notificationService.ts`) and logged. Nothing email-related can fail an order placement, a status update, or the PayHere webhook. No retry mechanism — none of the existing infrastructure supports it, and adding a queue for this is out of scope.

## Testing

Follows the existing vitest + fake-Supabase pattern used throughout `server/src`. `nodemailer.createTransport` is mocked the same way `getSupabaseAdmin` is mocked elsewhere (`vi.mock("nodemailer", ...)`), so tests assert on what *would* have been sent (recipient, subject, key content) without any real SMTP call. Coverage:
- `mailer.ts`: the never-throws guarantee, including when the underlying transport rejects.
- `emails/` content builders: pure functions, tested directly for correct subject/content per email type.
- `notificationService.ts`: each `sendXEmail` wires the right builder to the right recipient; admin functions no-op (and don't throw) when `ADMIN_NOTIFICATION_EMAIL` is unset.
- `orderService.test.ts` / `paymentService.test.ts`: extended to assert the right notification function(s) fire (mocked) at each trigger point, including the low-stock crossing logic (crosses vs. already-low vs. stays-above-threshold cases).
