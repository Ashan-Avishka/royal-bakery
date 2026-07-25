import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  updateCategorySchema,
  updateProductSchema,
} from "./catalogSchemas.js";

describe("idParamSchema", () => {
  it("accepts a uuid", () => {
    expect(idParamSchema.safeParse({ id: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
  });
  it("rejects a non-uuid", () => {
    expect(idParamSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts a name-only body", () => {
    expect(createCategorySchema.safeParse({ name: "Cakes" }).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("rejects an empty body", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });
  it("accepts isActive alone", () => {
    expect(updateCategorySchema.safeParse({ isActive: false }).success).toBe(true);
  });
});

describe("createProductSchema", () => {
  it("accepts a minimal valid product", () => {
    expect(createProductSchema.safeParse({ name: "Croissant", price: 380 }).success).toBe(true);
  });
  it("rejects a negative price", () => {
    expect(createProductSchema.safeParse({ name: "X", price: -1 }).success).toBe(false);
  });
  it("rejects a non-integer stockQuantity", () => {
    expect(
      createProductSchema.safeParse({ name: "X", price: 1, stockQuantity: 1.5 }).success
    ).toBe(false);
  });
  it("accepts an explicit null categoryId", () => {
    expect(
      createProductSchema.safeParse({ name: "X", price: 1, categoryId: null }).success
    ).toBe(true);
  });
});

describe("updateProductSchema", () => {
  it("rejects an empty body", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });
});

describe("productListQuerySchema", () => {
  it("accepts no query params", () => {
    expect(productListQuerySchema.safeParse({}).success).toBe(true);
  });
  it("rejects an invalid categoryId", () => {
    expect(productListQuerySchema.safeParse({ categoryId: "nope" }).success).toBe(false);
  });
});
