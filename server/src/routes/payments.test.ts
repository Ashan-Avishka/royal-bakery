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
      "customer-token": {
        id: CUSTOMER_ID,
        email: "cust@example.com",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: CUSTOMER_ID,
        full_name: "Jane Doe",
        phone: "0771234567",
        address: "123 Galle Road",
        role: "customer",
        created_at: "t",
      },
    ],
    orders: [
      {
        id: ORDER_ID,
        user_id: CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
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
