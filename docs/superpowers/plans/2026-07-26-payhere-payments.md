# Royal Bakery Backend — PayHere Payment Integration Implementation Plan

Design doc: `docs/superpowers/specs/2026-07-26-payhere-payments-design.md`

Same TDD structure as Modules 1–3. `cd server` assumed for every command block.

## Global constraints

- Same conventions as every prior backend module: `.js` import extensions,
  `{ error: { message } }` error shape, every thrown service error is an
  `AppError` with an explicit status, `PGRST116` → 404 on `.single()`.
- No new migration — `payments`/`orders.payment_status` already have every
  column needed.
- The webhook route (`POST /payments/webhook`) is deliberately **not**
  behind `requireAuth` — PayHere calls it directly, server-to-server. Its
  own signature check (`md5sig`) is the security boundary, not JWT auth.
- Do not run `git commit`/`git push` beyond `git add` staging at the end of
  each task — same standing rule as every prior module.

---

### Task 1: Add `payments` table to the fake Supabase client

**Files:** `server/src/test/fakeSupabase.ts`, `server/src/test/fakeSupabase.test.ts`

- [ ] **Step 1: Add a failing test**

Append to `fakeSupabase.test.ts`:

```ts
describe("createFakeSupabaseClient — payments table", () => {
  it("supports insert/select on a payments table", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [], payments: [] });

    const { data: created, error } = await client
      .from("payments")
      .insert({ order_id: "order-1", payment_method: "payhere", status: "pending", amount: "760.00" })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(created.status).toBe("pending");

    const { data } = await client.from("payments").select("*").eq("order_id", "order-1");
    expect(data).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Confirm it fails** — `npm run test -- fakeSupabase` → `unsupported table "payments"`.

- [ ] **Step 3: Implement**

Add to `fakeSupabase.ts`:

```ts
export interface FakePaymentRow {
  id: string;
  order_id: string;
  payment_method: string;
  status: string;
  amount: string;
  transaction_id: string | null;
  payhere_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
}
```

Add `payments?: FakePaymentRow[]` to `FakeSupabaseOptions`, and
`payments: options.payments ?? []` to the `tables` map inside
`createFakeSupabaseClient`.

- [ ] **Step 4: Confirm it passes, then run the full suite**

```bash
npm run test -- fakeSupabase
npm run test
```

Expected: PASS — 150 existing tests + the new one, unmodified elsewhere.

- [ ] **Step 5: Stage** — `git add server/src/test`

---

### Task 2: Payment types and service

**Files:** `server/src/types/payment.ts`, `server/src/services/paymentService.ts`, `server/src/services/paymentService.test.ts`

- [ ] **Step 1: Add the domain types**

```ts
// server/src/types/payment.ts
export interface PaymentInitiation {
  checkoutUrl: string;
  merchantId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  orderId: string;
  items: string;
  currency: string;
  amount: string;
  hash: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface WebhookPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// server/src/services/paymentService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("../config/env.js", () => ({
  env: {
    PAYHERE_MERCHANT_ID: "test_merchant",
    PAYHERE_MERCHANT_SECRET: "test_secret",
    PAYHERE_MODE: "sandbox",
    CLIENT_ORIGIN: "http://localhost:3000",
    API_PUBLIC_URL: "http://localhost:4000",
  },
}));

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { initiatePayment, processPaymentNotification } from "./paymentService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_ID = "22222222-2222-2222-2222-222222222222";

function md5Upper(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
}
function expectedHash(orderId: string, amount: string, currency: string): string {
  return md5Upper("test_merchant" + orderId + amount + currency + md5Upper("test_secret"));
}
function expectedSig(orderId: string, amount: string, currency: string, statusCode: string): string {
  return md5Upper("test_merchant" + orderId + amount + currency + statusCode + md5Upper("test_secret"));
}

function seed(overrides: { profileComplete?: boolean; orderStatus?: string; paymentStatus?: string } = {}) {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [
      {
        id: USER_ID,
        full_name: overrides.profileComplete === false ? null : "Jane Doe",
        phone: overrides.profileComplete === false ? null : "0771234567",
        address: overrides.profileComplete === false ? null : "123 Galle Road",
        role: "customer",
        created_at: "t",
      },
    ],
    orders: [
      {
        id: ORDER_ID,
        user_id: USER_ID,
        status: overrides.orderStatus ?? "pending",
        payment_status: overrides.paymentStatus ?? "unpaid",
        total_amount: "760.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orderItems: [],
    payments: [],
  });
}

describe("initiatePayment", () => {
  it("returns a correctly-computed hash and creates a pending payment row", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);

    const result = await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    expect(result.hash).toBe(expectedHash(ORDER_ID, "760.00", "LKR"));
    expect(result.amount).toBe("760.00");
    expect(result.checkoutUrl).toContain("sandbox.payhere.lk");
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Doe");

    const { data } = await client.from("payments").select("*").eq("order_id", ORDER_ID);
    expect(data).toHaveLength(1);
    expect((data as any[])[0].status).toBe("pending");
  });

  it("does not create a duplicate payment row if one is already pending", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);

    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    const { data } = await client.from("payments").select("*").eq("order_id", ORDER_ID);
    expect(data).toHaveLength(1);
  });

  it("throws a 404 AppError for another user's order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
    await expect(
      initiatePayment({ userId: OTHER_USER_ID, email: "x@example.com", orderId: ORDER_ID })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 400 AppError for a cancelled order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed({ orderStatus: "cancelled" }) as any);
    await expect(
      initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws a 400 AppError for an already-paid order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed({ paymentStatus: "paid" }) as any);
    await expect(
      initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws a 400 AppError when the profile is incomplete", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed({ profileComplete: false }) as any);
    await expect(
      initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("processPaymentNotification", () => {
  it("marks the payment completed and the order paid on status_code 2", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    await processPaymentNotification({
      merchant_id: "test_merchant",
      order_id: ORDER_ID,
      payment_id: "payhere-payment-1",
      payhere_amount: "760.00",
      payhere_currency: "LKR",
      status_code: "2",
      md5sig: expectedSig(ORDER_ID, "760.00", "LKR", "2"),
    });

    const { data: payment } = await client.from("payments").select("*").eq("order_id", ORDER_ID).maybeSingle();
    expect((payment as any).status).toBe("completed");
    expect((payment as any).transaction_id).toBe("payhere-payment-1");

    const { data: order } = await client.from("orders").select("*").eq("id", ORDER_ID).maybeSingle();
    expect((order as any).payment_status).toBe("paid");
  });

  it("marks failed on status_code -2", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    await processPaymentNotification({
      merchant_id: "test_merchant",
      order_id: ORDER_ID,
      payment_id: "payhere-payment-2",
      payhere_amount: "760.00",
      payhere_currency: "LKR",
      status_code: "-2",
      md5sig: expectedSig(ORDER_ID, "760.00", "LKR", "-2"),
    });

    const { data: order } = await client.from("orders").select("*").eq("id", ORDER_ID).maybeSingle();
    expect((order as any).payment_status).toBe("failed");
  });

  it("rejects a forged signature and writes nothing", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    await expect(
      processPaymentNotification({
        merchant_id: "test_merchant",
        order_id: ORDER_ID,
        payment_id: "payhere-payment-3",
        payhere_amount: "760.00",
        payhere_currency: "LKR",
        status_code: "2",
        md5sig: "not-the-real-signature",
      })
    ).rejects.toMatchObject({ status: 400 });

    const { data: order } = await client.from("orders").select("*").eq("id", ORDER_ID).maybeSingle();
    expect((order as any).payment_status).toBe("unpaid");
  });
});
```

- [ ] **Step 3: Confirm it fails** — `npm run test -- paymentService` → module not found.

- [ ] **Step 4: Implement**

```ts
// server/src/services/paymentService.ts
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import type { PaymentInitiation, WebhookPayload } from "../types/payment.js";
import { getOrderForUser } from "./orderService.js";
import { getProfileById } from "./profileService.js";

function md5Upper(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
}

function payhereHash(parts: string[]): string {
  return md5Upper(parts.join("") + md5Upper(env.PAYHERE_MERCHANT_SECRET));
}

const CHECKOUT_URLS = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const;

export async function initiatePayment(params: {
  userId: string;
  email: string;
  orderId: string;
}): Promise<PaymentInitiation> {
  const order = await getOrderForUser(params.userId, params.orderId);
  if (!order) throw new AppError(404, "Order not found");
  if (order.status === "cancelled") throw new AppError(400, "This order has been cancelled");
  if (order.paymentStatus === "paid") throw new AppError(400, "This order has already been paid");

  const profile = await getProfileById(params.userId);
  if (!profile?.fullName || !profile.phone || !profile.address) {
    throw new AppError(400, "Complete your profile (name, phone, address) before paying");
  }

  const admin = getSupabaseAdmin();
  const { data: existing, error: existingError } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", params.orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingError) throw new AppError(500, "Failed to check existing payment", { cause: existingError });

  if (!existing) {
    const { error: insertError } = await admin.from("payments").insert({
      order_id: params.orderId,
      payment_method: "payhere",
      status: "pending",
      amount: order.totalAmount,
    });
    if (insertError) throw new AppError(500, "Failed to create payment record", { cause: insertError });
  }

  const amount = order.totalAmount.toFixed(2);
  const currency = "LKR";
  const hash = payhereHash([env.PAYHERE_MERCHANT_ID, params.orderId, amount, currency]);

  const [firstName, ...rest] = profile.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  return {
    checkoutUrl: CHECKOUT_URLS[env.PAYHERE_MODE],
    merchantId: env.PAYHERE_MERCHANT_ID,
    returnUrl: `${env.CLIENT_ORIGIN}/orders/${params.orderId}?payment=success`,
    cancelUrl: `${env.CLIENT_ORIGIN}/orders/${params.orderId}?payment=cancelled`,
    notifyUrl: `${env.API_PUBLIC_URL}/api/payments/webhook`,
    orderId: params.orderId,
    items: `Royal Bakery order ${params.orderId.slice(0, 8)}`,
    currency,
    amount,
    hash,
    firstName,
    lastName,
    email: params.email,
    phone: profile.phone,
    address: profile.address,
    city: "Colombo",
    country: "Sri Lanka",
  };
}

export async function processPaymentNotification(payload: WebhookPayload): Promise<void> {
  const expected = payhereHash([
    payload.merchant_id,
    payload.order_id,
    payload.payhere_amount,
    payload.payhere_currency,
    payload.status_code,
  ]);
  if (expected !== payload.md5sig) {
    throw new AppError(400, "Invalid payment notification signature");
  }

  const statusCode = Number(payload.status_code);
  const paymentStatus = statusCode === 2 ? "completed" : statusCode === -2 || statusCode === -3 ? "failed" : "pending";
  const orderPaymentStatus = statusCode === 2 ? "paid" : statusCode === -2 || statusCode === -3 ? "failed" : "unpaid";

  const admin = getSupabaseAdmin();
  const { error: paymentError } = await admin
    .from("payments")
    .update({
      status: paymentStatus,
      transaction_id: payload.payment_id,
      payhere_payment_id: payload.payment_id,
      paid_at: statusCode === 2 ? new Date().toISOString() : null,
    })
    .eq("order_id", payload.order_id);
  if (paymentError) throw new AppError(500, "Failed to update payment record", { cause: paymentError });

  const { error: orderError } = await admin
    .from("orders")
    .update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() })
    .eq("id", payload.order_id);
  if (orderError) throw new AppError(500, "Failed to update order payment status", { cause: orderError });
}
```

- [ ] **Step 5: Confirm it passes** — `npm run test -- paymentService` → PASS (10 tests).

- [ ] **Step 6: Stage** — `git add server/src/types/payment.ts server/src/services/paymentService.ts server/src/services/paymentService.test.ts`

---

### Task 3: Validation schema

**Files:** `server/src/validation/paymentSchemas.ts`, `server/src/validation/paymentSchemas.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { initiatePaymentSchema } from "./paymentSchemas.js";

describe("initiatePaymentSchema", () => {
  it("accepts a valid orderId", () => {
    expect(initiatePaymentSchema.safeParse({ orderId: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
  });
  it("rejects a missing orderId", () => {
    expect(initiatePaymentSchema.safeParse({}).success).toBe(false);
  });
});
```

- [ ] **Step 2: Confirm it fails**, then implement:

```ts
import { z } from "zod";
import { uuidSchema } from "./catalogSchemas.js";

export const initiatePaymentSchema = z.object({
  orderId: uuidSchema,
});
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
```

- [ ] **Step 3: Confirm it passes** — `npm run test -- paymentSchemas`.

- [ ] **Step 4: Stage** — `git add server/src/validation/paymentSchemas.ts server/src/validation/paymentSchemas.test.ts`

---

### Task 4: Routes + config

**Files:** `server/src/routes/payments.ts`, `server/src/routes/payments.test.ts`, `server/src/routes/index.ts` (modify), `server/src/config/env.ts` (modify), `server/.env.example` (modify)

- [ ] **Step 1: Add `API_PUBLIC_URL` to env**

In `server/src/config/env.ts`, add to the schema: `API_PUBLIC_URL: z.string().default("http://localhost:4000"),`

In `server/.env.example`, add under the PayHere section:
```
# Public base URL of this API (PayHere's notify_url webhook needs to reach
# it directly -- localhost will NOT work for real PayHere calls, use a
# tunnel like ngrok for that, or your deployed URL in production)
API_PUBLIC_URL=http://localhost:4000
```

- [ ] **Step 2: Write the failing route test**

```ts
// server/src/routes/payments.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
const ORDER_ID = "22222222-2222-2222-2222-222222222222";

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [
      { id: CUSTOMER_ID, full_name: "Jane Doe", phone: "0771234567", address: "123 Galle Road", role: "customer", created_at: "t" },
    ],
    orders: [
      { id: ORDER_ID, user_id: CUSTOMER_ID, status: "pending", payment_status: "unpaid", total_amount: "760.00", delivery_address: null, created_at: "t", updated_at: "t" },
    ],
    orderItems: [],
    payments: [],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
});

describe("POST /api/payments/initiate", () => {
  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).post("/api/payments/initiate").send({ orderId: ORDER_ID });
    expect(res.status).toBe(401);
  });

  it("returns the PayHere field set for a valid order", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/payments/initiate")
      .set("Authorization", "Bearer customer-token")
      .send({ orderId: ORDER_ID });
    expect(res.status).toBe(200);
    expect(res.body.payment.orderId).toBe(ORDER_ID);
    expect(res.body.payment.hash).toBeTruthy();
  });

  it("rejects an invalid orderId", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/payments/initiate")
      .set("Authorization", "Bearer customer-token")
      .send({ orderId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/payments/webhook", () => {
  it("does not require auth but rejects a bad signature", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/payments/webhook")
      .type("form")
      .send({
        merchant_id: "whatever",
        order_id: ORDER_ID,
        payment_id: "p1",
        payhere_amount: "760.00",
        payhere_currency: "LKR",
        status_code: "2",
        md5sig: "wrong",
      });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Confirm it fails**, then implement `server/src/routes/payments.ts`:

```ts
import express, { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { initiatePayment, processPaymentNotification } from "../services/paymentService.js";
import { initiatePaymentSchema } from "../validation/paymentSchemas.js";
import { AppError } from "../errors.js";

export const paymentsRouter = Router();

paymentsRouter.post("/payments/initiate", requireAuth, async (req, res, next) => {
  const parsed = initiatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }
  if (!req.user!.email) {
    next(new AppError(400, "Account email is required to make a payment"));
    return;
  }

  try {
    const payment = await initiatePayment({
      userId: req.user!.id,
      email: req.user!.email,
      orderId: parsed.data.orderId,
    });
    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post(
  "/payments/webhook",
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      await processPaymentNotification(req.body);
      res.status(200).send("OK");
    } catch (err) {
      next(err);
    }
  }
);
```

- [ ] **Step 4: Wire into `routes/index.ts`** — add the import and `apiRouter.use(paymentsRouter);`.

- [ ] **Step 5: Confirm it passes, then run the full suite and build**

```bash
npm run test -- routes/payments
npm run test
npm run build
```

- [ ] **Step 6: Stage** — `git add server/src/routes/payments.ts server/src/routes/payments.test.ts server/src/routes/index.ts server/src/config/env.ts server/.env.example`

---

### Task 5: Manual verification (synthetic webhook, no real PayHere account)

No new source files.

- [ ] **Step 1:** Set placeholder credentials in `server/.env` (never committed): `PAYHERE_MERCHANT_ID=test_merchant`, `PAYHERE_MERCHANT_SECRET=test_secret_change_me`, `PAYHERE_MODE=sandbox`. Restart `npm run dev`.

- [ ] **Step 2:** Create a real order via the existing cart/checkout flow (reuse the pattern from Module 3's verification — QA customer, product with stock, add to cart, `POST /api/orders`).

- [ ] **Step 3:** `POST /api/payments/initiate` with that order's id as the customer. Confirm `200`, and independently recompute the expected hash (same formula, using the placeholder secret) to confirm it matches `response.payment.hash` exactly.

- [ ] **Step 4:** Compute a correctly-signed synthetic webhook payload (same formula, `status_code=2`, `payhere_amount` matching the order total) and `POST /api/payments/webhook` with it (form-encoded). Confirm `200`, then confirm via `GET /api/admin/orders/:id` that `paymentStatus` is now `"paid"`.

- [ ] **Step 5:** Send the same payload again but with `md5sig` deliberately wrong. Confirm `400` and that the order's `paymentStatus` is unchanged.

- [ ] **Step 6:** Clean up the QA order/product/category/accounts created for this pass, same discipline as every prior module's verification.

Module is done once Steps 3–5 all match their expected results.
