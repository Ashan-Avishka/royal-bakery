import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../src/lib/supabase.js";
import { createFakeSupabaseClient } from "../src/test/fakeSupabase.js";
import { resolveAndPromoteUserByEmail } from "./setAdminRole.js";

const USER_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "owner-token": {
        id: USER_ID,
        email: "owner@royalbakery.lk",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: USER_ID,
        full_name: "Bakery Owner",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("resolveAndPromoteUserByEmail", () => {
  it("promotes the matching user to admin", async () => {
    const profile = await resolveAndPromoteUserByEmail("owner@royalbakery.lk");
    expect(profile.role).toBe("admin");
  });

  it("is case-insensitive on email", async () => {
    const profile = await resolveAndPromoteUserByEmail("OWNER@royalbakery.lk");
    expect(profile.role).toBe("admin");
  });

  it("throws a clear error when no user matches the email", async () => {
    await expect(
      resolveAndPromoteUserByEmail("nobody@royalbakery.lk")
    ).rejects.toThrow('No user found with email "nobody@royalbakery.lk"');
  });
});
