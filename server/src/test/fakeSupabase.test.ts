import { describe, it, expect } from "vitest";
import { createFakeSupabaseClient } from "./fakeSupabase.js";

describe("createFakeSupabaseClient — profiles (existing behavior)", () => {
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

  it("returns a PGRST116 error from update().eq().select().single() when nothing matches", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "Nobody" })
      .eq("id", "does-not-exist")
      .select("*")
      .single();

    expect(data).toBeNull();
    expect(error?.code).toBe("PGRST116");
  });
});

describe("createFakeSupabaseClient — generic multi-table support", () => {
  it("supports insert().select().single() generating an id and created_at", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [], categories: [] });

    const { data, error } = await client
      .from("categories")
      .insert({ name: "Cakes", description: null, is_active: true })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe("Cakes");
    expect(typeof data.id).toBe("string");
    expect(typeof data.created_at).toBe("string");
  });

  it("supports repeated .eq() filters narrowing a select", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: "cat-a", name: "A", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: "cat-a", name: "B", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: false, created_at: "t", updated_at: "t" },
        { id: "3", category_id: "cat-b", name: "C", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client
      .from("products")
      .select("*")
      .eq("category_id", "cat-a")
      .eq("is_available", true);

    expect(data.map((p: any) => p.id)).toEqual(["1"]);
  });

  it("supports .ilike() as a case-insensitive substring match", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: null, name: "Chocolate Cake", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: null, name: "Plain Bread", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client.from("products").select("*").ilike("name", "%choc%");
    expect(data.map((p: any) => p.id)).toEqual(["1"]);
  });

  it("supports delete().eq().select().maybeSingle()", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      categories: [
        { id: "cat-1", name: "Cakes", description: null, is_active: true, created_at: "t" },
      ],
    });

    const { data, error } = await client
      .from("categories")
      .delete()
      .eq("id", "cat-1")
      .select("*")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe("cat-1");

    const remaining = await client.from("categories").select("*");
    expect(remaining.data).toHaveLength(0);
  });

  it("throws for an unsupported table name", () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    expect(() => client.from("not-a-real-table")).toThrow(/unsupported table/);
  });
});

describe("createFakeSupabaseClient — .in() filter", () => {
  it("matches any row whose column value is in the given list", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: null, name: "A", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: null, name: "B", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "3", category_id: null, name: "C", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client.from("products").select("*").in("id", ["1", "3"]);
    expect((data as any[]).map((p) => p.id).sort()).toEqual(["1", "3"]);
  });
});

describe("createFakeSupabaseClient — .rpc() mock", () => {
  it("calls the configured handler with the given params", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      rpc: {
        do_thing: (params) => ({ data: { received: params }, error: null }),
      },
    });

    const { data, error } = await client.rpc("do_thing", { foo: "bar" });
    expect(error).toBeNull();
    expect(data).toEqual({ received: { foo: "bar" } });
  });

  it("throws if no handler is configured for the given name", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    await expect(client.rpc("unconfigured", {})).rejects.toThrow(/no rpc handler/);
  });
});

describe("createFakeSupabaseClient — payments table", () => {
  it("supports insert/select on a payments table", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [], payments: [] });

    const { data: created, error } = await client
      .from("payments")
      .insert({ order_id: "order-1", payment_method: "payhere", status: "pending", amount: "760.00" })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(created.status).toBe("pending");

    const { data } = await client.from("payments").select("*").eq("order_id", "order-1");
    expect(data).toHaveLength(1);
  });
});

describe("createFakeSupabaseClient — storage mock", () => {
  it("uploads a file and returns a public URL containing the bucket and path", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });

    const { error } = await client.storage
      .from("product-images")
      .upload("prod-1/photo.png", Buffer.from("bytes"), { contentType: "image/png" });
    expect(error).toBeNull();

    const { data } = client.storage.from("product-images").getPublicUrl("prod-1/photo.png");
    expect(data.publicUrl).toContain("product-images");
    expect(data.publicUrl).toContain("prod-1/photo.png");
  });
});

describe("range filters", () => {
  it("filters comparable values and safely rejects non-comparable filter inputs", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      orders: [
        { id: "order-1", user_id: "u1", status: "pending", payment_status: "pending", total_amount: "100", delivery_address: null, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
        { id: "order-2", user_id: "u1", status: "pending", payment_status: "pending", total_amount: "200", delivery_address: null, created_at: "2026-02-01T00:00:00.000Z", updated_at: "2026-02-01T00:00:00.000Z" },
      ],
    });

    const ranged = await client.from("orders").select("*").gte("created_at", "2026-01-15T00:00:00.000Z");
    expect(ranged.data.map((order: { id: string }) => order.id)).toEqual(["order-2"]);

    const invalid = await client.from("orders").select("*").lte("created_at", {});
    expect(invalid.data).toEqual([]);
  });
});
