# Order & Admin Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send 5 transactional emails (order confirmation, order status change, payment status change, admin new-order, admin low-stock) via nodemailer using the SMTP credentials already configured, without blocking any request on SMTP latency or failure.

**Architecture:** A `mailer.ts` wraps a singleton nodemailer transporter behind a `sendMail()` that never throws. Plain template-literal functions in `emails/templates.ts` build `{subject, html, text}` content. `notificationService.ts` exposes 5 `sendXEmail(...)` functions combining the two. `orderService.ts` and `paymentService.ts` call these from their existing order-creation, status-update, and webhook code paths — always after the real DB write succeeds, and always without awaiting the actual `sendMail` call.

**Tech Stack:** Express 5 + TypeScript, `nodemailer`, vitest + the existing fake-Supabase-client test pattern.

## Global Constraints

- SMTP credentials are already configured in `server/.env` (Gmail, `SMTP_PORT=587`) and wired into `server/src/config/env.ts`'s zod schema (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) — do not change these.
- Admin notifications (new order, low stock) go to a single fixed address, `ADMIN_NOTIFICATION_EMAIL` — not a lookup of all admin-role users.
- Fire-and-forget: the actual `sendMail`/SMTP call must never be awaited by the code path that triggered it, and must never throw past `mailer.ts`. The DB write for whatever triggered the notification must always complete and succeed *before* any notification code runs.
- No retry queue, no background job/cron infrastructure — none exists in this backend and none is being added.
- `LOW_STOCK_THRESHOLD` is `5`, already defined in `server/src/services/analyticsService.ts` — reuse it via export, do not redefine it.
- Low-stock alerts fire only on the transition (stock was above 5 before this order, at-or-below after) — never repeat for a product that was already low.
- Email verification / signup is explicitly out of scope — already fully handled by Supabase Auth, confirmed with the user, no changes needed anywhere in this plan.

---

## Task 1: SMTP config, nodemailer dependency, and the never-throws mailer

**Files:**
- Modify: `server/package.json`
- Modify: `server/.env.example`
- Modify: `server/src/config/env.ts`
- Create: `server/src/lib/mailer.ts`
- Test: `server/src/lib/mailer.test.ts`

**Interfaces:**
- Produces: `sendMail(params: { to: string; subject: string; html: string; text: string }): Promise<void>` — never throws or rejects. `env.SMTP_FROM_EMAIL: string` and `env.ADMIN_NOTIFICATION_EMAIL: string` (both default `""`).

- [ ] **Step 1: Install nodemailer**

Run: `cd server && npm install nodemailer && npm install --save-dev @types/nodemailer`

This updates `server/package.json` and `server/package-lock.json` automatically with the currently-published versions — do not hand-edit version numbers into `package.json`.

- [ ] **Step 2: Add the two new env keys**

In `server/src/config/env.ts`, change:

```ts
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
});
```

to:

```ts
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM_EMAIL: z.string().default(""),
  ADMIN_NOTIFICATION_EMAIL: z.string().default(""),
});
```

In `server/.env.example`, change the final block:

```
# --- SMTP (order confirmations / notifications) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

to:

```
# --- SMTP (order confirmations / notifications) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
# Defaults to SMTP_USER if left blank
SMTP_FROM_EMAIL=
# Where new-order and low-stock admin alerts are sent
ADMIN_NOTIFICATION_EMAIL=
```

- [ ] **Step 3: Write the failing test**

Create `server/src/lib/mailer.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));
vi.mock("../config/env.js", () => ({
  env: {
    SMTP_HOST: "smtp.test.example",
    SMTP_PORT: 587,
    SMTP_USER: "user@test.example",
    SMTP_PASS: "secret",
    SMTP_FROM_EMAIL: "",
  },
}));

import { sendMail } from "./mailer.js";

beforeEach(() => {
  sendMailMock.mockReset();
});

describe("sendMail", () => {
  it("sends via the transporter, falling back to SMTP_USER as the from address", async () => {
    sendMailMock.mockResolvedValue({});

    await sendMail({ to: "customer@example.com", subject: "Hi", html: "<p>hi</p>", text: "hi" });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "user@test.example",
      to: "customer@example.com",
      subject: "Hi",
      html: "<p>hi</p>",
      text: "hi",
    });
  });

  it("never throws when the transporter rejects", async () => {
    sendMailMock.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(
      sendMail({ to: "customer@example.com", subject: "Hi", html: "<p>hi</p>", text: "hi" })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd server && npx vitest run src/lib/mailer.test.ts`
Expected: FAIL — `./mailer.js` doesn't exist yet.

- [ ] **Step 5: Implement the mailer**

Create `server/src/lib/mailer.ts`:

```ts
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an email. Never throws or rejects -- any failure (SMTP connection,
 * auth, malformed recipient) is caught and logged. Every call site can call
 * this without its own try/catch and without awaiting, so SMTP latency or
 * failure never blocks or breaks the request that triggered it.
 */
export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const from = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  try {
    await getTransporter().sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  } catch (err) {
    console.error(`Failed to send email to ${params.to}`, err);
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd server && npx vitest run src/lib/mailer.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/package-lock.json server/.env.example server/src/config/env.ts server/src/lib/mailer.ts server/src/lib/mailer.test.ts
git commit -m "feat(server): add never-throws mailer on top of nodemailer"
```

---

## Task 2: Email content templates

**Files:**
- Create: `server/src/emails/templates.ts`
- Test: `server/src/emails/templates.test.ts`

**Interfaces:**
- Consumes: `OrderStatus`, `PaymentStatus` from `../types/order.js` (existing).
- Produces: `EmailContent = { subject: string; html: string; text: string }`. `OrderEmailItem = { name: string; quantity: number; unitPrice: number; subtotal: number }`. `OrderEmailData = { id: string; items: OrderEmailItem[]; totalAmount: number; deliveryAddress: string | null }`. Functions: `buildOrderConfirmationEmail(order: OrderEmailData): EmailContent`, `buildOrderStatusChangeEmail(order: {id, totalAmount}, previousStatus: OrderStatus, newStatus: OrderStatus): EmailContent`, `buildPaymentStatusChangeEmail(order: {id, totalAmount}, previousPaymentStatus: PaymentStatus, newPaymentStatus: PaymentStatus): EmailContent`, `buildAdminNewOrderEmail(order: OrderEmailData, customerEmail: string): EmailContent`, `buildAdminLowStockEmail(products: {name: string; stockQuantity: number}[]): EmailContent`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/emails/templates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildAdminLowStockEmail,
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusChangeEmail,
  buildPaymentStatusChangeEmail,
} from "./templates.js";

const ORDER = {
  id: "11111111-2222-3333-4444-555555555555",
  items: [{ name: "Croissant", quantity: 2, unitPrice: 380, subtotal: 760 }],
  totalAmount: 760,
  deliveryAddress: "123 Galle Road",
};

describe("buildOrderConfirmationEmail", () => {
  it("includes the order id, items, and total", () => {
    const email = buildOrderConfirmationEmail(ORDER);
    expect(email.subject).toContain("11111111");
    expect(email.html).toContain("Croissant");
    expect(email.html).toContain("LKR 760");
    expect(email.text).toContain("Croissant");
    expect(email.text).toContain("LKR 760");
  });
});

describe("buildOrderStatusChangeEmail", () => {
  it("mentions both the previous and new status", () => {
    const email = buildOrderStatusChangeEmail(ORDER, "pending", "processing");
    expect(email.subject).toContain("Processing");
    expect(email.html).toContain("Pending");
    expect(email.html).toContain("Processing");
  });
});

describe("buildPaymentStatusChangeEmail", () => {
  it("mentions both the previous and new payment status", () => {
    const email = buildPaymentStatusChangeEmail(ORDER, "unpaid", "paid");
    expect(email.subject.toLowerCase()).toContain("paid");
    expect(email.html).toContain("Unpaid");
    expect(email.html).toContain("Paid");
  });
});

describe("buildAdminNewOrderEmail", () => {
  it("includes the customer email and order details", () => {
    const email = buildAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(email.html).toContain("customer@example.com");
    expect(email.html).toContain("Croissant");
  });
});

describe("buildAdminLowStockEmail", () => {
  it("lists every product and its remaining stock", () => {
    const email = buildAdminLowStockEmail([
      { name: "Croissant", stockQuantity: 3 },
      { name: "Bagel", stockQuantity: 1 },
    ]);
    expect(email.subject).toContain("Croissant");
    expect(email.subject).toContain("Bagel");
    expect(email.html).toContain("3 left");
    expect(email.html).toContain("1 left");
  });

  it("uses singular phrasing for a single product", () => {
    const email = buildAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(email.html).toContain("has dropped");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/emails/templates.test.ts`
Expected: FAIL — `./templates.js` doesn't exist yet.

- [ ] **Step 3: Implement the templates**

Create `server/src/emails/templates.ts`:

```ts
import type { OrderStatus, PaymentStatus } from "../types/order.js";

const BRAND_NAME = "Royal Bakery";
const BRAND_ADDRESS = "Dorenegama Rd, Medawala, Harispaththuwa";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEmailData {
  id: string;
  items: OrderEmailItem[];
  totalAmount: number;
  deliveryAddress: string | null;
}

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-US")}`;
}

function orderShortId(orderId: string): string {
  return orderId.slice(0, 8);
}

function renderShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#FBF6EE;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background-color:#3A1A13;color:#FBF6EE;padding:20px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#D9A441;">${BRAND_NAME}</p>
        <h1 style="margin:8px 0 0;font-size:20px;">${title}</h1>
      </div>
      <div style="padding:24px;color:#3A1A13;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #EADFCB;color:#8A7A68;font-size:12px;">
        ${BRAND_NAME} &middot; ${BRAND_ADDRESS}
      </div>
    </div>
  </body>
</html>`;
}

function renderTextShell(title: string, bodyText: string): string {
  return `${BRAND_NAME}\n${title}\n\n${bodyText}\n\n---\n${BRAND_NAME} - ${BRAND_ADDRESS}`;
}

function renderItemsHtml(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;">${item.quantity} &times; ${item.name}</td><td style="padding:4px 0;text-align:right;">${formatLKR(item.subtotal)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>`;
}

function renderItemsText(items: OrderEmailItem[]): string {
  return items.map((item) => `  ${item.quantity} x ${item.name} - ${formatLKR(item.subtotal)}`).join("\n");
}

export function buildOrderConfirmationEmail(order: OrderEmailData): EmailContent {
  const title = "Order confirmed";
  const bodyHtml = `
    <p>Thanks for your order! We've received order <strong>#${orderShortId(order.id)}</strong> and we're getting it ready.</p>
    ${renderItemsHtml(order.items)}
    <p><strong>Total: ${formatLKR(order.totalAmount)}</strong></p>
    ${order.deliveryAddress ? `<p>Delivering to: ${order.deliveryAddress}</p>` : ""}
  `;
  const bodyText = `Thanks for your order! We've received order #${orderShortId(order.id)} and we're getting it ready.\n\n${renderItemsText(order.items)}\n\nTotal: ${formatLKR(order.totalAmount)}${order.deliveryAddress ? `\nDelivering to: ${order.deliveryAddress}` : ""}`;

  return {
    subject: `Order confirmed - #${orderShortId(order.id)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function buildOrderStatusChangeEmail(
  order: { id: string; totalAmount: number },
  previousStatus: OrderStatus,
  newStatus: OrderStatus
): EmailContent {
  const title = "Order status updated";
  const bodyHtml = `
    <p>Order <strong>#${orderShortId(order.id)}</strong> is now <strong>${STATUS_LABELS[newStatus]}</strong> (previously ${STATUS_LABELS[previousStatus]}).</p>
    <p>Order total: ${formatLKR(order.totalAmount)}</p>
  `;
  const bodyText = `Order #${orderShortId(order.id)} is now ${STATUS_LABELS[newStatus]} (previously ${STATUS_LABELS[previousStatus]}).\n\nOrder total: ${formatLKR(order.totalAmount)}`;

  return {
    subject: `Order #${orderShortId(order.id)} is now ${STATUS_LABELS[newStatus]}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function buildPaymentStatusChangeEmail(
  order: { id: string; totalAmount: number },
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): EmailContent {
  const title = "Payment status updated";
  const bodyHtml = `
    <p>Payment for order <strong>#${orderShortId(order.id)}</strong> is now <strong>${PAYMENT_STATUS_LABELS[newPaymentStatus]}</strong> (previously ${PAYMENT_STATUS_LABELS[previousPaymentStatus]}).</p>
    <p>Order total: ${formatLKR(order.totalAmount)}</p>
  `;
  const bodyText = `Payment for order #${orderShortId(order.id)} is now ${PAYMENT_STATUS_LABELS[newPaymentStatus]} (previously ${PAYMENT_STATUS_LABELS[previousPaymentStatus]}).\n\nOrder total: ${formatLKR(order.totalAmount)}`;

  return {
    subject: `Payment ${PAYMENT_STATUS_LABELS[newPaymentStatus].toLowerCase()} for order #${orderShortId(order.id)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

export function buildAdminNewOrderEmail(order: OrderEmailData, customerEmail: string): EmailContent {
  const title = "New order received";
  const bodyHtml = `
    <p>New order <strong>#${orderShortId(order.id)}</strong> from ${customerEmail}.</p>
    ${renderItemsHtml(order.items)}
    <p><strong>Total: ${formatLKR(order.totalAmount)}</strong></p>
    ${order.deliveryAddress ? `<p>Delivery address: ${order.deliveryAddress}</p>` : ""}
  `;
  const bodyText = `New order #${orderShortId(order.id)} from ${customerEmail}.\n\n${renderItemsText(order.items)}\n\nTotal: ${formatLKR(order.totalAmount)}${order.deliveryAddress ? `\nDelivery address: ${order.deliveryAddress}` : ""}`;

  return {
    subject: `New order #${orderShortId(order.id)} - ${formatLKR(order.totalAmount)}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}

export function buildAdminLowStockEmail(products: { name: string; stockQuantity: number }[]): EmailContent {
  const title = "Low stock alert";
  const rowsHtml = products.map((p) => `<li>${p.name} &mdash; ${p.stockQuantity} left</li>`).join("");
  const rowsText = products.map((p) => `  ${p.name} - ${p.stockQuantity} left`).join("\n");

  const bodyHtml = `
    <p>The following product${products.length > 1 ? "s have" : " has"} dropped to low stock:</p>
    <ul>${rowsHtml}</ul>
  `;
  const bodyText = `The following product${products.length > 1 ? "s have" : " has"} dropped to low stock:\n\n${rowsText}`;

  return {
    subject: `Low stock: ${products.map((p) => p.name).join(", ")}`,
    html: renderShell(title, bodyHtml),
    text: renderTextShell(title, bodyText),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/emails/templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/emails/templates.ts server/src/emails/templates.test.ts
git commit -m "feat(server): add email content templates"
```

---

## Task 3: `notificationService` — the 5 send functions

**Files:**
- Create: `server/src/services/notificationService.ts`
- Test: `server/src/services/notificationService.test.ts`

**Interfaces:**
- Consumes: `sendMail` (Task 1), the 5 `buildX` functions and `OrderEmailData`/`EmailContent` types (Task 2), `env.ADMIN_NOTIFICATION_EMAIL` (Task 1), `OrderStatus`/`PaymentStatus` from `../types/order.js`.
- Produces: `sendOrderConfirmationEmail(order: OrderEmailData, customerEmail: string): Promise<void>`, `sendOrderStatusChangeEmail(order: {id, totalAmount}, customerEmail: string, previousStatus: OrderStatus, newStatus: OrderStatus): Promise<void>`, `sendPaymentStatusChangeEmail(order: {id, totalAmount}, customerEmail: string, previousPaymentStatus: PaymentStatus, newPaymentStatus: PaymentStatus): Promise<void>`, `sendAdminNewOrderEmail(order: OrderEmailData, customerEmail: string): Promise<void>`, `sendAdminLowStockEmail(products: {name: string; stockQuantity: number}[]): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/services/notificationService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn();
vi.mock("../lib/mailer.js", () => ({ sendMail: sendMailMock }));

const envMock = vi.hoisted(() => ({
  env: { ADMIN_NOTIFICATION_EMAIL: "admin@royalbakery.lk" },
}));
vi.mock("../config/env.js", () => envMock);

import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
  sendPaymentStatusChangeEmail,
} from "./notificationService.js";

const ORDER = {
  id: "11111111-2222-3333-4444-555555555555",
  items: [{ name: "Croissant", quantity: 2, unitPrice: 380, subtotal: 760 }],
  totalAmount: 760,
  deliveryAddress: "123 Galle Road",
};

beforeEach(() => {
  sendMailMock.mockReset();
  envMock.env.ADMIN_NOTIFICATION_EMAIL = "admin@royalbakery.lk";
});

describe("sendOrderConfirmationEmail", () => {
  it("emails the customer", async () => {
    await sendOrderConfirmationEmail(ORDER, "customer@example.com");
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
  });
});

describe("sendOrderStatusChangeEmail", () => {
  it("emails the customer with the status change", async () => {
    await sendOrderStatusChangeEmail(ORDER, "customer@example.com", "pending", "processing");
    expect(sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
    expect(sendMailMock.mock.calls[0][0].html).toContain("Processing");
  });
});

describe("sendPaymentStatusChangeEmail", () => {
  it("emails the customer with the payment status change", async () => {
    await sendPaymentStatusChangeEmail(ORDER, "customer@example.com", "unpaid", "paid");
    expect(sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
  });
});

describe("sendAdminNewOrderEmail", () => {
  it("emails the configured admin address", async () => {
    await sendAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(sendMailMock.mock.calls[0][0].to).toBe("admin@royalbakery.lk");
  });

  it("skips sending when no admin address is configured", async () => {
    envMock.env.ADMIN_NOTIFICATION_EMAIL = "";
    await sendAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe("sendAdminLowStockEmail", () => {
  it("emails the configured admin address", async () => {
    await sendAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(sendMailMock.mock.calls[0][0].to).toBe("admin@royalbakery.lk");
  });

  it("does nothing for an empty product list", async () => {
    await sendAdminLowStockEmail([]);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("skips sending when no admin address is configured", async () => {
    envMock.env.ADMIN_NOTIFICATION_EMAIL = "";
    await sendAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/services/notificationService.test.ts`
Expected: FAIL — `./notificationService.js` doesn't exist yet.

- [ ] **Step 3: Implement `notificationService.ts`**

Create `server/src/services/notificationService.ts`:

```ts
import { env } from "../config/env.js";
import { sendMail } from "../lib/mailer.js";
import {
  buildAdminLowStockEmail,
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusChangeEmail,
  buildPaymentStatusChangeEmail,
  type OrderEmailData,
} from "../emails/templates.js";
import type { OrderStatus, PaymentStatus } from "../types/order.js";

export async function sendOrderConfirmationEmail(
  order: OrderEmailData,
  customerEmail: string
): Promise<void> {
  const { subject, html, text } = buildOrderConfirmationEmail(order);
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendOrderStatusChangeEmail(
  order: { id: string; totalAmount: number },
  customerEmail: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus
): Promise<void> {
  const { subject, html, text } = buildOrderStatusChangeEmail(order, previousStatus, newStatus);
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendPaymentStatusChangeEmail(
  order: { id: string; totalAmount: number },
  customerEmail: string,
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): Promise<void> {
  const { subject, html, text } = buildPaymentStatusChangeEmail(
    order,
    previousPaymentStatus,
    newPaymentStatus
  );
  await sendMail({ to: customerEmail, subject, html, text });
}

export async function sendAdminNewOrderEmail(
  order: OrderEmailData,
  customerEmail: string
): Promise<void> {
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    console.warn("ADMIN_NOTIFICATION_EMAIL is not set; skipping new-order admin email");
    return;
  }
  const { subject, html, text } = buildAdminNewOrderEmail(order, customerEmail);
  await sendMail({ to: env.ADMIN_NOTIFICATION_EMAIL, subject, html, text });
}

export async function sendAdminLowStockEmail(
  products: { name: string; stockQuantity: number }[]
): Promise<void> {
  if (products.length === 0) return;
  if (!env.ADMIN_NOTIFICATION_EMAIL) {
    console.warn("ADMIN_NOTIFICATION_EMAIL is not set; skipping low-stock admin email");
    return;
  }
  const { subject, html, text } = buildAdminLowStockEmail(products);
  await sendMail({ to: env.ADMIN_NOTIFICATION_EMAIL, subject, html, text });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/services/notificationService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/notificationService.ts server/src/services/notificationService.test.ts
git commit -m "feat(server): add notificationService with the 5 send functions"
```

---

## Task 4: Order confirmation + admin new-order + low-stock alert — `orderService.createOrderFromCart`

**Files:**
- Modify: `server/src/services/analyticsService.ts`
- Modify: `server/src/services/orderService.ts`
- Modify: `server/src/services/orderService.test.ts`

**Interfaces:**
- Consumes: `sendOrderConfirmationEmail`, `sendAdminNewOrderEmail`, `sendAdminLowStockEmail` (Task 3).
- Produces: `LOW_STOCK_THRESHOLD` exported from `analyticsService.ts` (value `5`, unchanged).

- [ ] **Step 1: Export `LOW_STOCK_THRESHOLD`**

In `server/src/services/analyticsService.ts`, change:

```ts
const LOW_STOCK_THRESHOLD = 5;
```

to:

```ts
export const LOW_STOCK_THRESHOLD = 5;
```

- [ ] **Step 2: Write the failing tests**

In `server/src/services/orderService.test.ts`, replace the top of the file (from the first line through the `PRODUCT_A` constant) — currently:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  createOrderFromCart,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from "./orderService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_A = "22222222-2222-2222-2222-222222222222";
const ORDER_B = "33333333-3333-3333-3333-333333333333";
const PRODUCT_A = "44444444-4444-4444-4444-444444444444";
```

with:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendAdminNewOrderEmail: vi.fn(),
  sendAdminLowStockEmail: vi.fn(),
}));
vi.mock("./notificationService.js", () => notificationMocks);

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  createOrderFromCart,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from "./orderService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_A = "22222222-2222-2222-2222-222222222222";
const ORDER_B = "33333333-3333-3333-3333-333333333333";
const PRODUCT_A = "44444444-4444-4444-4444-444444444444";
const CUSTOMER_EMAIL = "customer@example.com";

afterEach(() => {
  vi.clearAllMocks();
});
```

Then replace the `seed` function — currently:

```ts
function seed(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orders: [
```

with:

```ts
function seed(
  rpc: Record<string, (params: Record<string, unknown>) => any> = {},
  options: { stockQuantity?: number } = {}
) {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": {
        id: USER_ID,
        email: CUSTOMER_EMAIL,
        app_metadata: { role: "customer" },
      },
    },
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: options.stockQuantity ?? 20,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orders: [
```

(The rest of `seed` — the `orders`, `orderItems`, and `rpc` fields — is unchanged.)

Then, inside the existing `describe("createOrderFromCart", ...)` block, add these tests after the existing three (`"maps a successful rpc call..."`, `"maps a P0001..."`, `"maps a P0002..."`), before the block's closing `});`:

```ts

  it("sends order confirmation and admin new-order emails after creating an order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        create_order_from_cart: () => ({ data: ORDER_A, error: null }),
      }) as any
    );

    const order = await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendOrderConfirmationEmail).toHaveBeenCalledWith(order, CUSTOMER_EMAIL);
    expect(notificationMocks.sendAdminNewOrderEmail).toHaveBeenCalledWith(order, CUSTOMER_EMAIL);
  });

  it("does not throw when the user has no email on record", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      createFakeSupabaseClient({
        usersByToken: {},
        profiles: [],
        products: [
          {
            id: PRODUCT_A,
            category_id: null,
            name: "Croissant",
            description: null,
            price: "380.00",
            image_url: null,
            stock_quantity: 5,
            is_available: true,
            created_at: "t",
            updated_at: "t",
          },
        ],
        orders: [
          {
            id: ORDER_A,
            user_id: USER_ID,
            status: "pending",
            payment_status: "unpaid",
            total_amount: "760.00",
            delivery_address: null,
            created_at: "t",
            updated_at: "t",
          },
        ],
        orderItems: [
          {
            id: "oi1",
            order_id: ORDER_A,
            product_id: PRODUCT_A,
            quantity: 2,
            unit_price: "380.00",
            subtotal: "760.00",
          },
        ],
        rpc: { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
      }) as any
    );

    const order = await createOrderFromCart(USER_ID);
    expect(order.id).toBe(ORDER_A);
    expect(notificationMocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("sends a low-stock alert when an order pushes a product's stock at or below the threshold", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 4 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).toHaveBeenCalledWith([
      { name: "Croissant", stockQuantity: 4 },
    ]);
  });

  it("does not send a low-stock alert when the product was already low before this order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 2 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).not.toHaveBeenCalled();
  });

  it("does not send a low-stock alert when stock stays above the threshold", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 10 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).not.toHaveBeenCalled();
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/services/orderService.test.ts`
Expected: FAIL — the new assertions fail since `createOrderFromCart` doesn't call any notification functions yet.

- [ ] **Step 4: Wire the notifications into `createOrderFromCart`**

In `server/src/services/orderService.ts`, change the import block:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Order, OrderItem, OrderStatus, OrderSummary, PaymentStatus } from "../types/order.js";
```

to:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import { LOW_STOCK_THRESHOLD } from "./analyticsService.js";
import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "./notificationService.js";
import type { Order, OrderItem, OrderStatus, OrderSummary, PaymentStatus } from "../types/order.js";
```

Then change `createOrderFromCart`:

```ts
export async function createOrderFromCart(
  userId: string,
  deliveryAddress?: string
): Promise<Order> {
  const { data: orderId, error } = await getSupabaseAdmin().rpc("create_order_from_cart", {
    p_user_id: userId,
    p_delivery_address: deliveryAddress ?? null,
  });

  if (error) {
    if (error.code === "P0001") throw new AppError(400, "Cart is empty");
    if (error.code === "P0002") throw new AppError(409, error.message);
    throw new AppError(500, "Failed to create order", { cause: error });
  }

  const order = await getOrderById(orderId as string);
  if (!order) throw new AppError(500, "Order was created but could not be loaded");
  return order;
}
```

to:

```ts
export async function createOrderFromCart(
  userId: string,
  deliveryAddress?: string
): Promise<Order> {
  const { data: orderId, error } = await getSupabaseAdmin().rpc("create_order_from_cart", {
    p_user_id: userId,
    p_delivery_address: deliveryAddress ?? null,
  });

  if (error) {
    if (error.code === "P0001") throw new AppError(400, "Cart is empty");
    if (error.code === "P0002") throw new AppError(409, error.message);
    throw new AppError(500, "Failed to create order", { cause: error });
  }

  const order = await getOrderById(orderId as string);
  if (!order) throw new AppError(500, "Order was created but could not be loaded");

  await notifyOrderCreated(userId, order);

  return order;
}

async function notifyOrderCreated(userId: string, order: Order): Promise<void> {
  try {
    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${userId}; skipping order notification emails`);
      return;
    }

    void sendOrderConfirmationEmail(order, customerEmail);
    void sendAdminNewOrderEmail(order, customerEmail);
    await checkLowStockAndNotify(order.items);
  } catch (err) {
    console.error("Failed to send order-created notifications", err);
  }
}

async function checkLowStockAndNotify(items: OrderItem[]): Promise<void> {
  if (items.length === 0) return;
  const productIds = items.map((i) => i.productId);
  const { data: products, error } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .in("id", productIds);
  if (error || !products) return;

  const stockByProductId = new Map(
    (products as { id: string; stock_quantity: number }[]).map((p) => [p.id, p.stock_quantity])
  );
  const crossed: { name: string; stockQuantity: number }[] = [];
  for (const item of items) {
    const stockAfter = stockByProductId.get(item.productId);
    if (stockAfter === undefined) continue;
    const stockBefore = stockAfter + item.quantity;
    if (stockBefore > LOW_STOCK_THRESHOLD && stockAfter <= LOW_STOCK_THRESHOLD) {
      crossed.push({ name: item.name, stockQuantity: stockAfter });
    }
  }
  if (crossed.length > 0) {
    void sendAdminLowStockEmail(crossed);
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/services/orderService.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full backend suite**

Run: `cd server && npm test`
Expected: PASS (no regressions, including `analyticsService`'s consumers).

- [ ] **Step 7: Commit**

```bash
git add server/src/services/analyticsService.ts server/src/services/orderService.ts server/src/services/orderService.test.ts
git commit -m "feat(server): send order confirmation, admin new-order, and low-stock emails"
```

---

## Task 5: Order status change email — `orderService.updateOrderStatus`

**Files:**
- Modify: `server/src/services/orderService.ts`
- Modify: `server/src/services/orderService.test.ts`

**Interfaces:**
- Consumes: `sendOrderStatusChangeEmail` (Task 3).

- [ ] **Step 1: Write the failing tests**

In `server/src/services/orderService.test.ts`, change the hoisted mock object (added in Task 4):

```ts
const notificationMocks = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendAdminNewOrderEmail: vi.fn(),
  sendAdminLowStockEmail: vi.fn(),
}));
```

to:

```ts
const notificationMocks = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendAdminNewOrderEmail: vi.fn(),
  sendAdminLowStockEmail: vi.fn(),
  sendOrderStatusChangeEmail: vi.fn(),
}));
```

Then, inside `describe("updateOrderStatus", ...)`, add these two tests after the existing four, before the block's closing `});`:

```ts

  it("sends a status-change email when the order status changes", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);

    const order = await updateOrderStatus(ORDER_A, "processing");

    expect(notificationMocks.sendOrderStatusChangeEmail).toHaveBeenCalledWith(
      order,
      CUSTOMER_EMAIL,
      "pending",
      "processing"
    );
  });

  it("does not send a status-change email when the status does not actually change", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);

    await updateOrderStatus(ORDER_A, "pending");

    expect(notificationMocks.sendOrderStatusChangeEmail).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/services/orderService.test.ts`
Expected: FAIL — the two new assertions fail since `updateOrderStatus` doesn't send any email yet.

- [ ] **Step 3: Wire the notification into `updateOrderStatus`**

In `server/src/services/orderService.ts`, change the notification import (from Task 4):

```ts
import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "./notificationService.js";
```

to:

```ts
import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
} from "./notificationService.js";
```

Then change `updateOrderStatus`:

```ts
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const existing = await getOrderById(orderId);
  if (!existing) throw new AppError(404, "Order not found");

  if (status === "cancelled") {
    const { error } = await getSupabaseAdmin().rpc("cancel_order", { p_order_id: orderId });
    if (error) {
      if (error.code === "P0003") throw new AppError(409, "Order cannot be cancelled");
      throw new AppError(500, "Failed to cancel order", { cause: error });
    }
  } else {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) throw new AppError(500, "Failed to update order status", { cause: error });
  }

  const order = await getOrderById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  return order;
}
```

to:

```ts
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const existing = await getOrderById(orderId);
  if (!existing) throw new AppError(404, "Order not found");

  if (status === "cancelled") {
    const { error } = await getSupabaseAdmin().rpc("cancel_order", { p_order_id: orderId });
    if (error) {
      if (error.code === "P0003") throw new AppError(409, "Order cannot be cancelled");
      throw new AppError(500, "Failed to cancel order", { cause: error });
    }
  } else {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) throw new AppError(500, "Failed to update order status", { cause: error });
  }

  const order = await getOrderById(orderId);
  if (!order) throw new AppError(404, "Order not found");

  if (existing.status !== order.status) {
    await notifyOrderStatusChanged(orderId, order, existing.status);
  }

  return order;
}

async function notifyOrderStatusChanged(
  orderId: string,
  order: Order,
  previousStatus: OrderStatus
): Promise<void> {
  try {
    const { data: row, error } = await getSupabaseAdmin()
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !row) return;
    const userId = (row as { user_id: string }).user_id;

    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${userId}; skipping order-status notification`);
      return;
    }

    void sendOrderStatusChangeEmail(order, customerEmail, previousStatus, order.status);
  } catch (err) {
    console.error("Failed to send order-status-change notification", err);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/services/orderService.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full backend suite**

Run: `cd server && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/orderService.ts server/src/services/orderService.test.ts
git commit -m "feat(server): send an email when an order's status changes"
```

---

## Task 6: Payment status change email — `paymentService.processPaymentNotification`

**Files:**
- Modify: `server/src/services/paymentService.ts`
- Modify: `server/src/services/paymentService.test.ts`

**Interfaces:**
- Consumes: `sendPaymentStatusChangeEmail` (Task 3).

- [ ] **Step 1: Write the failing tests**

In `server/src/services/paymentService.test.ts`, replace the top of the file (from the first line through the `ORDER_ID` constant) — currently:

```ts
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
```

with:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

const notificationMocks = vi.hoisted(() => ({
  sendPaymentStatusChangeEmail: vi.fn(),
}));
vi.mock("./notificationService.js", () => notificationMocks);

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { initiatePayment, processPaymentNotification } from "./paymentService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_ID = "22222222-2222-2222-2222-222222222222";
const CUSTOMER_EMAIL = "customer@royalbakery-test.example";

afterEach(() => {
  vi.clearAllMocks();
});
```

Then replace the `seed` function:

```ts
function seed(
  overrides: { profileComplete?: boolean; orderStatus?: string; paymentStatus?: string } = {}
) {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [
```

with:

```ts
function seed(
  overrides: { profileComplete?: boolean; orderStatus?: string; paymentStatus?: string } = {}
) {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": {
        id: USER_ID,
        email: CUSTOMER_EMAIL,
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
```

(The rest of `seed` is unchanged.)

Then, inside `describe("processPaymentNotification", ...)`, add these two tests after the existing three, before the block's closing `});`:

```ts

  it("sends a payment-status-change email when the payment status changes", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    await processPaymentNotification({
      merchant_id: "test_merchant",
      order_id: ORDER_ID,
      payment_id: "payhere-payment-4",
      payhere_amount: "760.00",
      payhere_currency: "LKR",
      status_code: "2",
      md5sig: expectedSig(ORDER_ID, "760.00", "LKR", "2"),
    });

    expect(notificationMocks.sendPaymentStatusChangeEmail).toHaveBeenCalledWith(
      { id: ORDER_ID, totalAmount: 760 },
      CUSTOMER_EMAIL,
      "unpaid",
      "paid"
    );
  });

  it("does not send a duplicate email when the payment status does not change", async () => {
    const client = seed({ paymentStatus: "paid" });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);

    await processPaymentNotification({
      merchant_id: "test_merchant",
      order_id: ORDER_ID,
      payment_id: "payhere-payment-5",
      payhere_amount: "760.00",
      payhere_currency: "LKR",
      status_code: "2",
      md5sig: expectedSig(ORDER_ID, "760.00", "LKR", "2"),
    });

    expect(notificationMocks.sendPaymentStatusChangeEmail).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/services/paymentService.test.ts`
Expected: FAIL — the two new assertions fail since `processPaymentNotification` doesn't send any email yet.

- [ ] **Step 3: Wire the notification into `processPaymentNotification`**

In `server/src/services/paymentService.ts`, change the import block:

```ts
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import type { PaymentInitiation, WebhookPayload } from "../types/payment.js";
import { getOrderForUser } from "./orderService.js";
import { getProfileById } from "./profileService.js";
```

to:

```ts
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../errors.js";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendPaymentStatusChangeEmail } from "./notificationService.js";
import type { PaymentInitiation, WebhookPayload } from "../types/payment.js";
import type { PaymentStatus } from "../types/order.js";
import { getOrderForUser } from "./orderService.js";
import { getProfileById } from "./profileService.js";
```

Then change `processPaymentNotification`:

```ts
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
  const paymentStatus =
    statusCode === 2 ? "completed" : statusCode === -2 || statusCode === -3 ? "failed" : "pending";
  const orderPaymentStatus =
    statusCode === 2 ? "paid" : statusCode === -2 || statusCode === -3 ? "failed" : "unpaid";

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
  if (paymentError) {
    throw new AppError(500, "Failed to update payment record", { cause: paymentError });
  }

  const { error: orderError } = await admin
    .from("orders")
    .update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() })
    .eq("id", payload.order_id);
  if (orderError) {
    throw new AppError(500, "Failed to update order payment status", { cause: orderError });
  }
}
```

to:

```ts
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
  const paymentStatus =
    statusCode === 2 ? "completed" : statusCode === -2 || statusCode === -3 ? "failed" : "pending";
  const orderPaymentStatus: PaymentStatus =
    statusCode === 2 ? "paid" : statusCode === -2 || statusCode === -3 ? "failed" : "unpaid";

  const admin = getSupabaseAdmin();

  const { data: existingOrderRow, error: existingOrderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", payload.order_id)
    .maybeSingle();
  if (existingOrderError) {
    throw new AppError(500, "Failed to load order for payment notification", {
      cause: existingOrderError,
    });
  }

  const { error: paymentError } = await admin
    .from("payments")
    .update({
      status: paymentStatus,
      transaction_id: payload.payment_id,
      payhere_payment_id: payload.payment_id,
      paid_at: statusCode === 2 ? new Date().toISOString() : null,
    })
    .eq("order_id", payload.order_id);
  if (paymentError) {
    throw new AppError(500, "Failed to update payment record", { cause: paymentError });
  }

  const { error: orderError } = await admin
    .from("orders")
    .update({ payment_status: orderPaymentStatus, updated_at: new Date().toISOString() })
    .eq("id", payload.order_id);
  if (orderError) {
    throw new AppError(500, "Failed to update order payment status", { cause: orderError });
  }

  const previousPaymentStatus = (existingOrderRow as { payment_status: PaymentStatus } | null)
    ?.payment_status;
  if (existingOrderRow && previousPaymentStatus !== orderPaymentStatus) {
    await notifyPaymentStatusChanged(
      existingOrderRow as { id: string; user_id: string; total_amount: string },
      previousPaymentStatus as PaymentStatus,
      orderPaymentStatus
    );
  }
}

async function notifyPaymentStatusChanged(
  orderRow: { id: string; user_id: string; total_amount: string },
  previousPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus
): Promise<void> {
  try {
    const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(orderRow.user_id);
    const customerEmail = userData?.user?.email;
    if (!customerEmail) {
      console.warn(`No email found for user ${orderRow.user_id}; skipping payment-status notification`);
      return;
    }
    void sendPaymentStatusChangeEmail(
      { id: orderRow.id, totalAmount: Number(orderRow.total_amount) },
      customerEmail,
      previousPaymentStatus,
      newPaymentStatus
    );
  } catch (err) {
    console.error("Failed to send payment-status-change notification", err);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/services/paymentService.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full backend suite**

Run: `cd server && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/paymentService.ts server/src/services/paymentService.test.ts
git commit -m "feat(server): send an email when an order's payment status changes"
```
