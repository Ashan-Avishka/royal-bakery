import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));
vi.mock("../lib/jwt.js", () => ({ verifySupabaseToken: vi.fn() }));
vi.mock("../services/catalogService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/catalogService.js")>();
  return {
    ...actual,
    setProductImage: vi.fn(actual.setProductImage),
    clearProductImage: vi.fn(actual.clearProductImage),
  };
});
vi.mock("../services/uploadService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/uploadService.js")>();
  return {
    ...actual,
    deleteProductImage: vi.fn(actual.deleteProductImage),
  };
});

import { getSupabaseAdmin } from "../lib/supabase.js";
import { verifySupabaseToken } from "../lib/jwt.js";
import { setProductImage, clearProductImage } from "../services/catalogService.js";
import { deleteProductImage } from "../services/uploadService.js";
import { createFakeSupabaseClient, createFakeJwtVerifier } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const CATEGORY_ID = "33333333-3333-3333-3333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-4444-444444444444";

const USERS_BY_TOKEN = {
  "admin-token": { id: ADMIN_ID, email: "admin@royalbakery.lk", app_metadata: { role: "admin" } },
  "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
};

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: USERS_BY_TOKEN,
    profiles: [],
    categories: [
      { id: CATEGORY_ID, name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
    ],
    products: [
      {
        id: PRODUCT_ID,
        category_id: CATEGORY_ID,
        name: "Chocolate Cake",
        description: null,
        price: "1500.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
  vi.mocked(verifySupabaseToken).mockImplementation(createFakeJwtVerifier(USERS_BY_TOKEN));
});

describe("admin categories", () => {
  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/categories");
    expect(res.status).toBe(401);
  });

  it("requires the admin role", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("lists all categories for an admin", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
  });

  it("creates a category", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Breads" });
    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe("Breads");
  });

  it("rejects an empty create body", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", "Bearer admin-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 updating an unknown category", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/admin/categories/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Whatever" });
    expect(res.status).toBe(404);
  });

  it("deletes a category", async () => {
    const app = createApp();
    const res = await request(app)
      .delete(`/api/admin/categories/${CATEGORY_ID}`)
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(204);
  });
});

describe("admin products", () => {
  it("lists all products including unavailable ones", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/products")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("creates a product", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Croissant", price: 380 });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe("Croissant");
    expect(res.body.product.price).toBe(380);
  });

  it("rejects a negative price", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/admin/products")
      .set("Authorization", "Bearer admin-token")
      .send({ name: "Bad Product", price: -5 });
    expect(res.status).toBe(400);
  });

  it("updates a product", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/products/${PRODUCT_ID}`)
      .set("Authorization", "Bearer admin-token")
      .send({ stockQuantity: 10 });
    expect(res.status).toBe(200);
    expect(res.body.product.stockQuantity).toBe(10);
  });

  it("returns 404 deleting an unknown product", async () => {
    const app = createApp();
    const res = await request(app)
      .delete("/api/admin/products/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(404);
  });

  it("uploads a product image and sets imageUrl", async () => {
    const app = createApp();
    const res = await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("fake-png-bytes"), "photo.png");

    expect(res.status).toBe(200);
    expect(res.body.product.imageUrl).toContain("product-images");
  });

  it("rejects a non-image upload", async () => {
    const app = createApp();
    const res = await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  it("removes a product image", async () => {
    const app = createApp();
    await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("fake-png-bytes"), "photo.png");

    const res = await request(app)
      .delete(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(200);
    expect(res.body.product.imageUrl).toBeNull();
  });

  it("does not delete the previous stored image when the DB write for the new one fails", async () => {
    const app = createApp();
    await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("first-bytes"), "first.png");

    vi.mocked(deleteProductImage).mockClear();
    vi.mocked(setProductImage).mockRejectedValueOnce(new Error("db unavailable"));

    const res = await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("second-bytes"), "second.png");

    expect(res.status).toBe(500);
    expect(deleteProductImage).not.toHaveBeenCalled();
  });

  it("does not delete the stored image when the DB clear fails on remove", async () => {
    const app = createApp();
    await request(app)
      .post(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token")
      .attach("image", Buffer.from("first-bytes"), "first.png");

    vi.mocked(deleteProductImage).mockClear();
    vi.mocked(clearProductImage).mockRejectedValueOnce(new Error("db unavailable"));

    const res = await request(app)
      .delete(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(500);
    expect(deleteProductImage).not.toHaveBeenCalled();
  });

  it("returns 400 removing an image from a product that has none", async () => {
    const app = createApp();
    const res = await request(app)
      .delete(`/api/admin/products/${PRODUCT_ID}/image`)
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(400);
  });

  it("returns 404 removing an image from an unknown product", async () => {
    const app = createApp();
    const res = await request(app)
      .delete("/api/admin/products/99999999-9999-9999-9999-999999999999/image")
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(404);
  });
});
