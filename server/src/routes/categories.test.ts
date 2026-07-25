import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    categories: [
      { id: "1", name: "Cakes", description: null, is_active: true, created_at: "2026-01-01T00:00:00.000Z" },
      { id: "2", name: "Discontinued", description: null, is_active: false, created_at: "2026-01-01T00:00:00.000Z" },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("GET /api/categories", () => {
  it("returns only active categories, no auth required", async () => {
    const app = createApp();
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].name).toBe("Cakes");
  });
});
