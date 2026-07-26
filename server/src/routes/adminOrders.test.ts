import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const ORDER_ID = "33333333-3333-3333-3333-333333333333";

function makeClient(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {
      "admin-token": { id: ADMIN_ID, email: "admin@royalbakery.lk", app_metadata: { role: "admin" } },
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
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
    rpc,
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
});

describe("admin order routes", () => {
  it("requires auth", async () => {
    const app = createApp();
    expect((await request(app).get("/api/admin/orders")).status).toBe(401);
  });

  it("requires the admin role", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("lists all orders for an admin", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/orders").set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });

  it("returns 404 fetching an unknown order", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/orders/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(404);
  });

  it("updates order status", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/orders/${ORDER_ID}/status`)
      .set("Authorization", "Bearer admin-token")
      .send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("processing");
  });

  it("rejects an invalid status value", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/orders/${ORDER_ID}/status`)
      .set("Authorization", "Bearer admin-token")
      .send({ status: "shipped" });
    expect(res.status).toBe(400);
  });
});
