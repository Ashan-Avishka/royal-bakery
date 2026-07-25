import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const AVAILABLE_ID = "11111111-1111-1111-1111-111111111111";
const UNAVAILABLE_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: AVAILABLE_ID,
        category_id: null,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: UNAVAILABLE_ID,
        category_id: null,
        name: "Retired Bread",
        description: null,
        price: "300.00",
        image_url: null,
        stock_quantity: 0,
        is_available: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/products", () => {
  it("returns only available products, no auth required", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Chocolate Cake");
    expect(res.body.products[0].price).toBe(1500);
  });

  it("filters by search", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products?search=choco");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("returns 400 for an invalid categoryId", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products?categoryId=not-a-uuid");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/products/:id", () => {
  it("returns an available product", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/products/${AVAILABLE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.product.id).toBe(AVAILABLE_ID);
  });

  it("returns 404 for an unavailable product", async () => {
    const app = createApp();
    const res = await request(app).get(`/api/products/${UNAVAILABLE_ID}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const app = createApp();
    const res = await request(app).get("/api/products/99999999-9999-9999-9999-999999999999");
    expect(res.status).toBe(404);
  });
});
