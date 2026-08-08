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

const USER_ID = "11111111-1111-1111-1111-111111111111";

const USERS_BY_TOKEN = {
  "customer-token": {
    id: USER_ID,
    email: "jane@example.com",
    app_metadata: { role: "customer" },
  },
};

let profiles: Parameters<typeof createFakeSupabaseClient>[0]["profiles"];

beforeEach(() => {
  profiles = [
    {
      id: USER_ID,
      full_name: "Jane Doe",
      phone: null,
      address: null,
      role: "customer",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ];
  const fakeClient = createFakeSupabaseClient({
    usersByToken: USERS_BY_TOKEN,
    profiles,
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
  vi.mocked(verifySupabaseToken).mockImplementation(createFakeJwtVerifier(USERS_BY_TOKEN));
});

describe("GET /api/users/me", () => {
  it("returns 401 without a bearer token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the merged profile for an authenticated user", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer customer-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: USER_ID,
      email: "jane@example.com",
      fullName: "Jane Doe",
      phone: null,
      address: null,
      role: "customer",
    });
  });
});

describe("PUT /api/users/me", () => {
  it("returns 400 for an empty body", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", "Bearer customer-token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("updates and returns the profile", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", "Bearer customer-token")
      .send({ phone: "0771234567" });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe("0771234567");
    expect(res.body.fullName).toBe("Jane Doe");
  });

  it("ignores a role field in the request body — role is never writable via this endpoint", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", "Bearer customer-token")
      .send({ fullName: "New Name", role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe("New Name");
    // The response's `role` field is sourced from the JWT claim (unchanged token), not the DB row —
    // that alone wouldn't catch a real bug, so assert directly on the fake store's underlying row:
    expect(profiles[0].role).toBe("customer");
  });
});
