import { describe, it, expect } from "vitest";
import { createFakeSupabaseClient } from "./fakeSupabase.js";

describe("createFakeSupabaseClient", () => {
  it("supports select().eq().maybeSingle() lookups", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [
        {
          id: "p1",
          full_name: "Test User",
          phone: null,
          address: null,
          role: "customer",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", "p1")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("Test User");
  });

  it("supports update().eq().select().single() mutations", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [
        {
          id: "p1",
          full_name: "Old Name",
          phone: null,
          address: null,
          role: "customer",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "New Name" })
      .eq("id", "p1")
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("New Name");
  });

  it("resolves auth.getUser() based on the provided token", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {
        "valid-token": { id: "u1", email: "a@b.com", app_metadata: { role: "customer" } },
      },
      profiles: [],
    });

    const ok = await client.auth.getUser("valid-token");
    expect(ok.data.user?.id).toBe("u1");

    const bad = await client.auth.getUser("bad-token");
    expect(bad.data.user).toBeNull();
    expect(bad.error).not.toBeNull();
  });
});
