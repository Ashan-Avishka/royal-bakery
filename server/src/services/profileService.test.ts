import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  getProfileById,
  listProfiles,
  setUserRole,
  updateProfile,
} from "./profileService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  const fakeClient = createFakeSupabaseClient({
    usersByToken: {
      "user-token": {
        id: USER_ID,
        email: "jane@example.com",
        app_metadata: { role: "customer" },
      },
    },
    profiles: [
      {
        id: USER_ID,
        full_name: "Jane Doe",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: OTHER_ID,
        full_name: "Bob Smith",
        phone: null,
        address: null,
        role: "customer",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);
});

describe("getProfileById", () => {
  it("returns the mapped profile for an existing id", async () => {
    const profile = await getProfileById(USER_ID);
    expect(profile).toEqual({
      id: USER_ID,
      fullName: "Jane Doe",
      phone: null,
      address: null,
      role: "customer",
      createdAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("returns null for an unknown id", async () => {
    const profile = await getProfileById("does-not-exist");
    expect(profile).toBeNull();
  });
});

describe("updateProfile", () => {
  it("updates only the provided fields", async () => {
    const profile = await updateProfile(USER_ID, { phone: "0771234567" });
    expect(profile.phone).toBe("0771234567");
    expect(profile.fullName).toBe("Jane Doe");
  });
});

describe("listProfiles", () => {
  it("returns profiles ordered by created_at descending", async () => {
    const profiles = await listProfiles();
    expect(profiles.map((p) => p.id)).toEqual([USER_ID, OTHER_ID]);
  });
});

describe("setUserRole", () => {
  it("updates both the auth app_metadata role and the profile role", async () => {
    const profile = await setUserRole(USER_ID, "admin");
    expect(profile.role).toBe("admin");

    const fakeClient = getSupabaseAdmin();
    const { data } = await (fakeClient as any).auth.admin.getUserById(USER_ID);
    expect(data.user?.app_metadata.role).toBe("admin");
  });

  it("throws when the target user does not exist in auth", async () => {
    // The fake client (mirroring real Supabase behavior) returns an error alongside
    // a null user for an unknown id, but we check !userData?.user first to properly
    // return a 404, not a 500 infrastructure error.
    await expect(
      setUserRole("00000000-0000-0000-0000-000000000000", "admin")
    ).rejects.toThrow("No user found with id");
  });

  it("throws a clear error when the auth update succeeds but the profile row update fails", async () => {
    const ORPHAN_ID = "33333333-3333-3333-3333-333333333333";
    const fakeClient = createFakeSupabaseClient({
      usersByToken: {
        "orphan-token": {
          id: ORPHAN_ID,
          email: "orphan@example.com",
          app_metadata: { role: "customer" },
        },
      },
      profiles: [], // no matching profiles row for ORPHAN_ID
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(fakeClient as any);

    await expect(setUserRole(ORPHAN_ID, "admin")).rejects.toThrow(
      "profiles row update failed"
    );
  });
});
