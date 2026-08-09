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

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
const PRODUCT_ID = "22222222-2222-2222-2222-222222222222";

const USERS_BY_TOKEN = {
  "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
};

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: USERS_BY_TOKEN,
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
    cartItems: [],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
  vi.mocked(verifySupabaseToken).mockImplementation(createFakeJwtVerifier(USERS_BY_TOKEN));
});

describe("cart routes", () => {
  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("returns an empty cart initially", async () => {
    const app = createApp();
    const res = await request(app).get("/api/cart").set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual({ items: [], subtotal: 0 });
  });

  it("adds an item to the cart", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.cart.items[0].quantity).toBe(2);
  });

  it("rejects adding more than available stock", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 99 });
    expect(res.status).toBe(409);
  });

  it("updates an item's quantity", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .put(`/api/cart/${PRODUCT_ID}`)
      .set("Authorization", "Bearer customer-token")
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].quantity).toBe(3);
  });

  it("removes an item", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .delete(`/api/cart/${PRODUCT_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
  });

  it("clears the cart", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual({ items: [], subtotal: 0 });
  });
});
