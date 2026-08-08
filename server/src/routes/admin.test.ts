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

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

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

beforeEach(() => {
  vi.mocked(verifySupabaseToken).mockImplementation(createFakeJwtVerifier(USERS_BY_TOKEN));
  const fakeClient = createFakeSupabaseClient({
    usersByToken: USERS_BY_TOKEN,
    profiles: [
      {
        id: ADMIN_ID,
        full_name: "Admin User",
        phone: null,
        address: null,
        role: "admin",
        created_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: CUSTOMER_ID,
        full_name: "Regular Customer",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/admin/customers", () => {
  it("returns 401 without a token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/customers");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin token", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/customers")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("returns the customer list for an admin token", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/customers")
      .set("Authorization", "Bearer admin-token");

    expect(res.status).toBe(200);
    expect(res.body.customers).toHaveLength(2);
    expect(res.body.customers[0].id).toBe(ADMIN_ID);
  });
});

describe("PUT /api/admin/customers/:id/role", () => {
  it("promotes a customer to admin", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/customers/${CUSTOMER_ID}/role`)
      .set("Authorization", "Bearer admin-token")
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.customer.role).toBe("admin");
  });

  it("returns 400 for an invalid role value", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/customers/${CUSTOMER_ID}/role`)
      .set("Authorization", "Bearer admin-token")
      .send({ role: "superadmin" });

    expect(res.status).toBe(400);
  });
});
