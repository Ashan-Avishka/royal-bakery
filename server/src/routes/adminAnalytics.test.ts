import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));
vi.mock("../lib/jwt.js", () => ({ verifySupabaseToken: vi.fn() }));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { verifySupabaseToken } from "../lib/jwt.js";
import { createFakeSupabaseClient, createFakeJwtVerifier } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const PRODUCT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CATEGORY_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PAID_ORDER = "33333333-3333-3333-3333-333333333333";
const UNPAID_ORDER = "44444444-4444-4444-4444-444444444444";

const USERS_BY_TOKEN = {
  "admin-token": {
    id: ADMIN_ID,
    email: "admin@royalbakery.lk",
    app_metadata: { role: "admin" },
  },
  "customer-token": {
    id: CUSTOMER_ID,
    email: "cust@example.com",
    app_metadata: { role: "customer" },
  },
};

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: USERS_BY_TOKEN,
    profiles: [],
    categories: [
      {
        id: CATEGORY_ID,
        name: "Cakes",
        description: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    products: [
      {
        id: PRODUCT_ID,
        category_id: CATEGORY_ID,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 3,
        is_available: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    orders: [
      {
        id: PAID_ORDER,
        user_id: CUSTOMER_ID,
        status: "completed",
        payment_status: "paid",
        total_amount: "1500.00",
        delivery_address: null,
        created_at: "2026-07-15T12:00:00.000Z",
        updated_at: "2026-07-15T12:00:00.000Z",
      },
      {
        id: UNPAID_ORDER,
        user_id: CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "500.00",
        delivery_address: null,
        created_at: "2026-07-16T12:00:00.000Z",
        updated_at: "2026-07-16T12:00:00.000Z",
      },
    ],
    orderItems: [
      {
        id: "55555555-5555-5555-5555-555555555555",
        order_id: PAID_ORDER,
        product_id: PRODUCT_ID,
        quantity: 1,
        unit_price: "1500.00",
        subtotal: "1500.00",
      },
    ],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
  vi.mocked(verifySupabaseToken).mockImplementation(createFakeJwtVerifier(USERS_BY_TOKEN));
});

describe("admin analytics routes", () => {
  it("requires auth", async () => {
    const app = createApp();
    expect((await request(app).get("/api/admin/analytics")).status).toBe(401);
  });

  it("requires the admin role", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("returns sales KPIs from paid orders only", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.analytics.totalRevenue).toBe(1500);
    expect(res.body.analytics.paidOrdersCount).toBe(1);
    expect(res.body.analytics.totalOrdersCount).toBe(2);
    expect(res.body.analytics.ordersByStatus.pending).toBe(1);
    expect(res.body.analytics.ordersByStatus.completed).toBe(1);
    expect(res.body.analytics.topProducts[0].name).toBe("Chocolate Cake");
    expect(res.body.analytics.topCategory).toBe("Cakes");
    expect(res.body.analytics.lowStockCount).toBe(1);
  });

  it("rejects invalid date filters", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/analytics?from=not-a-date")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(400);
  });
});
