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

function md5Upper(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
}
function expectedHash(orderId: string, amount: string, currency: string): string {
  return md5Upper("test_merchant" + orderId + amount + currency + md5Upper("test_secret"));
}
function expectedSig(orderId: string, amount: string, currency: string, statusCode: string): string {
  return md5Upper("test_merchant" + orderId + amount + currency + statusCode + md5Upper("test_secret"));
}

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

    const result = await initiatePayment({
      userId: USER_ID,
      email: "jane@example.com",
      orderId: ORDER_ID,
    });

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

    const { data: payment } = await client
      .from("payments")
      .select("*")
      .eq("order_id", ORDER_ID)
      .maybeSingle();
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

  it("still completes the payment/order writes when the preliminary order read for the notification fails", async () => {
    const client = seed();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client as any);
    await initiatePayment({ userId: USER_ID, email: "jane@example.com", orderId: ORDER_ID });

    // Simulate a transient read error on the preliminary "orders" select that exists
    // purely to capture the previous status for the notification email. Only the
    // `select` path on the "orders" table is intercepted here — `update` calls
    // (the real payment writes) go through the fake client completely untouched.
    const originalFrom = client.from.bind(client);
    let interceptSelect = true;
    client.from = ((tableName: string) => {
      const table = originalFrom(tableName);
      if (tableName !== "orders" || !interceptSelect) return table;
      return {
        ...table,
        select: (columns?: string) => {
          const builder: any = table.select(columns);
          const originalThen = builder.then.bind(builder);
          builder.then = (onFulfilled: any, onRejected: any) =>
            originalThen(() => onFulfilled({ data: null, error: { message: "boom" } }), onRejected);
          return builder;
        },
      };
    }) as any;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      processPaymentNotification({
        merchant_id: "test_merchant",
        order_id: ORDER_ID,
        payment_id: "payhere-payment-6",
        payhere_amount: "760.00",
        payhere_currency: "LKR",
        status_code: "2",
        md5sig: expectedSig(ORDER_ID, "760.00", "LKR", "2"),
      })
    ).resolves.toBeUndefined();

    // Stop intercepting so assertions below observe the real, unmodified rows.
    interceptSelect = false;

    const { data: payment } = await client
      .from("payments")
      .select("*")
      .eq("order_id", ORDER_ID)
      .maybeSingle();
    expect((payment as any).status).toBe("completed");
    expect((payment as any).transaction_id).toBe("payhere-payment-6");

    const { data: order } = await client.from("orders").select("*").eq("id", ORDER_ID).maybeSingle();
    expect((order as any).payment_status).toBe("paid");

    // The notification is skipped because the previous status could not be observed.
    expect(notificationMocks.sendPaymentStatusChangeEmail).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
