import { describe, it, expect } from "vitest";
import { initiatePaymentSchema } from "./paymentSchemas.js";

describe("initiatePaymentSchema", () => {
  it("accepts a valid orderId", () => {
    expect(
      initiatePaymentSchema.safeParse({ orderId: "11111111-1111-1111-1111-111111111111" }).success
    ).toBe(true);
  });
  it("rejects a missing orderId", () => {
    expect(initiatePaymentSchema.safeParse({}).success).toBe(false);
  });
});
