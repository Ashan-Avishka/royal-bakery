import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  orderStatusQuerySchema,
  updateOrderStatusSchema,
} from "./orderSchemas.js";

describe("createOrderSchema", () => {
  it("accepts an empty body (pickup)", () => {
    expect(createOrderSchema.safeParse({}).success).toBe(true);
  });
  it("accepts a delivery address", () => {
    expect(createOrderSchema.safeParse({ deliveryAddress: "123 Galle Road" }).success).toBe(true);
  });
  it("rejects an empty-string delivery address", () => {
    expect(createOrderSchema.safeParse({ deliveryAddress: "" }).success).toBe(false);
  });
});

describe("updateOrderStatusSchema", () => {
  it("accepts a valid status", () => {
    expect(updateOrderStatusSchema.safeParse({ status: "processing" }).success).toBe(true);
  });
  it("rejects an invalid status", () => {
    expect(updateOrderStatusSchema.safeParse({ status: "shipped" }).success).toBe(false);
  });
});

describe("orderStatusQuerySchema", () => {
  it("accepts no query params", () => {
    expect(orderStatusQuerySchema.safeParse({}).success).toBe(true);
  });
});
