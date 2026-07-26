import { describe, it, expect } from "vitest";
import {
  addCartItemSchema,
  productIdParamSchema,
  updateCartItemQuantitySchema,
} from "./cartSchemas.js";

describe("addCartItemSchema", () => {
  it("accepts a valid body", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 2,
      }).success
    ).toBe(true);
  });
  it("rejects quantity 0", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 0,
      }).success
    ).toBe(false);
  });
  it("rejects a non-integer quantity", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 1.5,
      }).success
    ).toBe(false);
  });
});

describe("updateCartItemQuantitySchema", () => {
  it("rejects a missing quantity", () => {
    expect(updateCartItemQuantitySchema.safeParse({}).success).toBe(false);
  });
});

describe("productIdParamSchema", () => {
  it("rejects a non-uuid productId", () => {
    expect(productIdParamSchema.safeParse({ productId: "nope" }).success).toBe(false);
  });
});
