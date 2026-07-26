# Royal Bakery Backend — Module 4: PayHere Payment Integration

Status: approved for planning
Date: 2026-07-26
Depends on: `docs/superpowers/specs/2026-07-24-backend-schema-auth-design.md` (Module 1 — `payments` table, `orders.payment_status`, auth), `docs/superpowers/specs/2026-07-26-cart-orders-api-design.md` (Module 3 — orders, merged)
Reference: [PayHere Checkout API docs](https://support.payhere.lk/api-&-mobile-sdk/checkout-api) (fetched live 2026-07-26 to confirm field names/hash formulas before writing this — this is external, unversioned documentation, not something to trust from training-data memory alone)

## Context

`payments` and `orders.payment_status` have existed since Module 1's schema, untouched since. This module wires up PayHere for real: a customer initiates payment for an unpaid order, is redirected to PayHere's hosted checkout, and PayHere calls our server back (`notify_url`) with the result, which we verify and use to update `payments`/`orders.payment_status`.

Per the module sequence:
1. ~~Auth/profile~~ — done
2. ~~Catalog~~ — done
3. ~~Cart & orders~~ — done
4. **PayHere payment integration** (this document)
5. Inquiries + admin reporting

No frontend work is bundled into this module (same split Modules 2/3 used — backend first, frontend as its own follow-up).

## No PayHere account exists yet

This is being built entirely against PayHere's published API contract, not tested against a real sandbox account (there isn't one yet). Everything in this module is real, correct code per the documented contract — but the live-verification task substitutes a **synthetic, correctly-signed webhook request** for an actual PayHere-hosted checkout round trip, since PayHere's own sandbox needs a real merchant account. Once a real sandbox account exists, replacing the placeholder `PAYHERE_MERCHANT_ID`/`PAYHERE_MERCHANT_SECRET` in `server/.env` with real ones is the only thing needed to go live in sandbox mode — no code changes.

**A real constraint, not a scope choice:** PayHere's `notify_url` is a server-to-server callback and — per their own docs — "cannot be tested on localhost." Full end-to-end verification (redirect to PayHere's actual hosted page, real webhook delivery) requires either a deployed server or a tunnel (ngrok or similar) exposing local Express to the internet. That's out of scope for this pass; the synthetic-webhook approach proves our side of the contract (signature verification, status mapping, idempotent-ish updates) without needing that infrastructure.

## PayHere integration contract (as documented)

**Initiating a payment** — the client needs these fields to build a form that POSTs (or redirects) to PayHere's hosted checkout:

`merchant_id`, `return_url`, `cancel_url`, `notify_url`, `order_id`, `items`, `currency`, `amount`, `first_name`, `last_name`, `email`, `phone`, `address`, `city`, `country`, `hash`.

The `hash` **must** be computed server-side (it embeds `merchant_secret` via MD5 — computing it client-side would leak the secret):

```
hash = MD5_UPPER(merchant_id + order_id + amount + currency + MD5_UPPER(merchant_secret))
```

`amount` is a plain decimal string, 2 places, no thousands separator (e.g. `"1170.00"`, not `"1,170.00"`).

Checkout URLs: `https://sandbox.payhere.lk/pay/checkout` (sandbox) / `https://www.payhere.lk/pay/checkout` (live) — selected by `PAYHERE_MODE`, already an existing env var.

**The webhook** (`POST` to our `notify_url`, `application/x-www-form-urlencoded`, not JSON) sends: `merchant_id`, `order_id`, `payment_id`, `payhere_amount`, `payhere_currency`, `status_code`, `md5sig`, plus card/method metadata we don't need to store beyond what `payments` already has columns for.

Verify authenticity before trusting *anything* in the payload:

```
expected_md5sig = MD5_UPPER(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5_UPPER(merchant_secret))
```

If `expected_md5sig !== md5sig`, reject — this is the one thing standing between this endpoint and anyone on the internet being able to mark arbitrary orders as paid.

`status_code`: `2` = success, `0` = pending, `-1` = canceled, `-2` = failed, `-3` = chargedback.

**`return_url`/`cancel_url` carry no payment status** — PayHere explicitly does not pass status info to the browser redirect. The webhook is the only authoritative source; the frontend (a later module) will need to poll or re-fetch the order rather than trust query params on return.

## Service layer

`server/src/services/paymentService.ts`. Both the request-hash and the webhook-signature check share the same underlying formula (`MD5_UPPER(joined_parts + MD5_UPPER(secret))`), implemented once:

```ts
function md5Upper(input: string): string { /* node:crypto, uppercase hex */ }
function payhereHash(parts: string[]): string {
  return md5Upper(parts.join("") + md5Upper(env.PAYHERE_MERCHANT_SECRET));
}
```

```ts
interface PaymentInitiation {
  checkoutUrl: string;
  merchantId: string; returnUrl: string; cancelUrl: string; notifyUrl: string;
  orderId: string; items: string; currency: string; amount: string; hash: string;
  firstName: string; lastName: string; email: string; phone: string; address: string;
  city: string; country: string;
}

initiatePayment(params: { userId: string; email: string; orderId: string }): Promise<PaymentInitiation>
```
- Loads the order via `getOrderForUser` (Module 3) — 404 if missing/not owned, same ownership-hiding as everywhere else.
- Rejects (`400`) if the order is `cancelled`, or `paymentStatus` is already `"paid"`.
- Loads the profile; requires `fullName`, `phone`, `address` all present — `400 "Complete your profile before paying"` otherwise. (`email` comes from the caller's auth session, not the profile, since `profiles` has no email column — same split `GET /users/me` already uses.)
- Finds-or-creates a `pending` `payments` row for this order (idempotent — re-initiating an already-pending payment reuses the row rather than creating duplicates).
- `firstName`/`lastName` are split from `fullName` on the first space (best-effort — the schema has no separate given/family name fields). `city`/`country` default to `"Colombo"`/`"Sri Lanka"` (the schema's `address` is one freeform field, not structured — same reasoning).
- Computes `hash` from the **server-held** `order.totalAmount`, never a client-supplied amount.

```ts
interface WebhookPayload {
  merchant_id: string; order_id: string; payment_id: string;
  payhere_amount: string; payhere_currency: string; status_code: string; md5sig: string;
}

processPaymentNotification(payload: WebhookPayload): Promise<void>
```
- Recomputes the signature and compares — `AppError(400, "Invalid payment notification signature")` on mismatch, no DB writes.
- Maps `status_code`: `2` → `payments.status = "completed"`, `orders.payment_status = "paid"`, `paid_at = now()`; `-2`/`-3` → `"failed"`/`"failed"`; `0`/`-1` → left as `"pending"`/`"unpaid"` (customer can retry).
- Updates `payments` (status, `transaction_id`/`payhere_payment_id` = `payment_id`, `paid_at`) and `orders.payment_status` by `order_id`.

## Express API surface

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/initiate` | `requireAuth` | Body `{ orderId }`; returns the full field set above |
| `POST` | `/payments/webhook` | none (signature-verified instead) | PayHere's server-to-server callback |

Both routes live in a new `server/src/routes/payments.ts`, mounted under its own `/payments/*` prefix — deliberately not sharing a router with `ordersRouter`/`adminOrdersRouter`, avoiding any repeat of the Module 3 mount-order bug (a router whose own path prefix never overlaps with another router's can't shadow it regardless of mount order).

The webhook route needs `express.urlencoded()` body parsing (PayHere posts form-encoded, not JSON) — applied as route-level middleware on just that one route, not globally on `app.ts`, since nothing else in this codebase needs it.

## Validation

`server/src/validation/paymentSchemas.ts`: `initiatePaymentSchema` — `{ orderId: uuidSchema }` (reusing the existing `uuidSchema` export from `catalogSchemas.ts`). The webhook body is *not* Zod-validated in the usual sense — its authenticity check (`md5sig`) is the actual validation; a Zod shape check on top would just add friction for zero security benefit (a forged-but-valid-shaped payload is exactly what the signature check exists to catch).

## New config

`server/src/config/env.ts` gains `API_PUBLIC_URL` (default `"http://localhost:4000"`), used to build `notify_url`. `PAYHERE_MERCHANT_ID`/`PAYHERE_MERCHANT_SECRET`/`PAYHERE_MODE` already exist from the Module 0 scaffold, untouched.

## No database migration

`payments` and `orders.payment_status` already have every column this module needs. Nothing to add.

## Out of scope for this module

- Frontend payment UI (the actual redirect-to-PayHere flow, a "pay now" button, polling the order after return) — a follow-up frontend module, same split as Modules 2/3.
- Refunds — `payments.status`/`orders.payment_status` both already model `"refunded"` in their check constraints, but no refund-initiating endpoint exists yet; not requested, not built speculatively.
- Recurring/Preapproval/Authorize APIs (PayHere has separate products for these) — this bakery only needs one-off checkout payments.
- Email/notification on payment success or failure — Module 5 territory per the original proposal.

## Testing approach

Same fake-client unit-test strategy as every prior module — `paymentService`'s functions are pure table CRUD plus local MD5 math, no new fake-client capability needed (no `.rpc()`, no new tables beyond the already-supported `payments`... which the fake client doesn't have yet, so Task 1 adds a `FakePaymentRow`/`payments` table to it, same pattern as every prior module's Task 1).

**Live verification** (in place of a real PayHere sandbox round trip, per the "no account yet" constraint): set a placeholder `PAYHERE_MERCHANT_ID`/`PAYHERE_MERCHANT_SECRET` locally, call `POST /payments/initiate` for a real order and confirm the returned `hash` matches an independently-computed one, then send a **correctly-signed synthetic webhook** to `POST /payments/webhook` and confirm `payments.status`/`orders.payment_status` update exactly as designed — plus a **deliberately wrong** `md5sig` to confirm it's rejected and nothing is written. This proves the module's actual logic (the part we control) without needing PayHere's hosted infrastructure.
