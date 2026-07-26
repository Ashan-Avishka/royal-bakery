import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_CUSTOMER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_ORDER_ID = "33333333-3333-3333-3333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-4444-444444444444";

function makeClient(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
    products: [
      {
        id: PRODUCT_ID,
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
        id: ORDER_ID,
        user_id: CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "760.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
      {
        id: OTHER_ORDER_ID,
        user_id: OTHER_CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "380.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orderItems: [
      {
        id: "oi1",
        order_id: ORDER_ID,
        product_id: PRODUCT_ID,
        quantity: 2,
        unit_price: "380.00",
        subtotal: "760.00",
      },
    ],
    rpc,
  });
}

describe("order routes", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
  });

  it("requires auth on every route", async () => {
    const app = createApp();
    expect((await request(app).post("/api/orders")).status).toBe(401);
    expect((await request(app).get("/api/orders")).status).toBe(401);
    expect((await request(app).get(`/api/orders/${ORDER_ID}`)).status).toBe(401);
  });

  it("lists only the caller's own orders", async () => {
    const app = createApp();
    const res = await request(app).get("/api/orders").set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.orders.map((o: any) => o.id)).toEqual([ORDER_ID]);
  });

  it("returns 404 for another customer's order", async () => {
    const app = createApp();
    const res = await request(app)
      .get(`/api/orders/${OTHER_ORDER_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(404);
  });

  it("returns the caller's own order with items", async () => {
    const app = createApp();
    const res = await request(app)
      .get(`/api/orders/${ORDER_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.order.items).toHaveLength(1);
  });
});

describe("POST /api/orders (checkout)", () => {
  it("creates an order on a successful rpc call", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({ create_order_from_cart: () => ({ data: ORDER_ID, error: null }) }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({ deliveryAddress: "123 Galle Road" });
    expect(res.status).toBe(201);
    expect(res.body.order.id).toBe(ORDER_ID);
  });

  it("returns 400 when the cart is empty", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({
        create_order_from_cart: () => ({ data: null, error: { code: "P0001", message: "Cart is empty" } }),
      }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 409 on insufficient stock", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({
        create_order_from_cart: () => ({
          data: null,
          error: { code: "P0002", message: 'Insufficient stock for product "Croissant"' },
        }),
      }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({});
    expect(res.status).toBe(409);
  });
});
