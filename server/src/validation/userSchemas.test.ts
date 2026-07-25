import { describe, it, expect } from "vitest";
import { updateProfileSchema, updateRoleSchema } from "./userSchemas.js";

describe("updateProfileSchema", () => {
  it("accepts a partial update with one field", () => {
    const result = updateProfileSchema.safeParse({ phone: "0771234567" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty string field", () => {
    const result = updateProfileSchema.safeParse({ fullName: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateRoleSchema", () => {
  it("accepts 'admin' and 'customer'", () => {
    expect(updateRoleSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ role: "customer" }).success).toBe(true);
  });

  it("rejects any other role value", () => {
    expect(updateRoleSchema.safeParse({ role: "superadmin" }).success).toBe(false);
  });
});
