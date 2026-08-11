import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  clearProductImage,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  setProductImage,
  updateCategory,
  updateProduct,
} from "./catalogService.js";

const CAT_A = "11111111-1111-1111-1111-111111111111";
const CAT_B = "22222222-2222-2222-2222-222222222222";
const PROD_A = "33333333-3333-3333-3333-333333333333";
const PROD_B = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    categories: [
      { id: CAT_A, name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
      { id: CAT_B, name: "Discontinued", description: null, is_active: false, created_at: "2026-01-02T00:00:00.000Z" },
    ],
    products: [
      {
        id: PROD_A,
        category_id: CAT_A,
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
        id: PROD_B,
        category_id: null,
        name: "Butter Cookies",
        description: null,
        price: "250.00",
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

describe("listCategories", () => {
  it("returns all categories sorted by name when activeOnly is false", async () => {
    const categories = await listCategories({ activeOnly: false });
    expect(categories.map((c) => c.name)).toEqual(["Cakes", "Discontinued"]);
  });

  it("filters to active categories only", async () => {
    const categories = await listCategories({ activeOnly: true });
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Cakes");
  });
});

describe("createCategory / updateCategory / deleteCategory", () => {
  it("creates a category with defaults", async () => {
    const category = await createCategory({ name: "Breads" });
    expect(category.name).toBe("Breads");
    expect(category.isActive).toBe(true);
  });

  it("updates only the provided fields", async () => {
    const category = await updateCategory(CAT_A, { isActive: false });
    expect(category.isActive).toBe(false);
    expect(category.name).toBe("Cakes");
  });

  it("throws a 404 AppError updating an unknown category", async () => {
    await expect(
      updateCategory("99999999-9999-9999-9999-999999999999", { name: "X" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("deletes an existing category", async () => {
    await expect(deleteCategory(CAT_A)).resolves.toBeUndefined();
  });

  it("throws a 404 AppError deleting an unknown category", async () => {
    await expect(
      deleteCategory("99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("listProducts", () => {
  it("returns only available products when availableOnly is true", async () => {
    const products = await listProducts({ availableOnly: true });
    expect(products.map((p) => p.id)).toEqual([PROD_A]);
  });

  it("returns all products when availableOnly is false", async () => {
    const products = await listProducts({ availableOnly: false });
    expect(products).toHaveLength(2);
  });

  it("filters by categoryId", async () => {
    const products = await listProducts({ availableOnly: false, categoryId: CAT_A });
    expect(products.map((p) => p.id)).toEqual([PROD_A]);
  });

  it("filters by case-insensitive search", async () => {
    const products = await listProducts({ availableOnly: false, search: "cookie" });
    expect(products.map((p) => p.id)).toEqual([PROD_B]);
  });

  it("converts the numeric(10,2) price string to a number", async () => {
    const products = await listProducts({ availableOnly: false });
    const chocolateCake = products.find((p) => p.id === PROD_A)!;
    expect(chocolateCake.price).toBe(1500);
  });
});

describe("getProductById", () => {
  it("returns null for an unknown id", async () => {
    const product = await getProductById("99999999-9999-9999-9999-999999999999");
    expect(product).toBeNull();
  });
});

describe("createProduct / updateProduct / setProductImage / deleteProduct", () => {
  it("creates a product with defaults", async () => {
    const product = await createProduct({ name: "Croissant", price: 380 });
    expect(product.stockQuantity).toBe(0);
    expect(product.isAvailable).toBe(true);
  });

  it("updates only the provided fields", async () => {
    const product = await updateProduct(PROD_A, { stockQuantity: 12 });
    expect(product.stockQuantity).toBe(12);
    expect(product.name).toBe("Chocolate Cake");
  });

  it("throws a 404 AppError updating an unknown product", async () => {
    await expect(
      updateProduct("99999999-9999-9999-9999-999999999999", { stockQuantity: 1 })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("sets the product image", async () => {
    const product = await setProductImage(PROD_A, "https://example.test/img.png");
    expect(product.imageUrl).toBe("https://example.test/img.png");
  });

  it("clears the product image", async () => {
    await setProductImage(PROD_A, "https://example.test/img.png");
    const product = await clearProductImage(PROD_A);
    expect(product.imageUrl).toBeNull();
  });

  it("deletes an existing product", async () => {
    await expect(deleteProduct(PROD_A)).resolves.toBeUndefined();
  });

  it("throws a 404 AppError deleting an unknown product", async () => {
    await expect(
      deleteProduct("99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});
