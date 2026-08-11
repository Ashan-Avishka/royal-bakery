import { afterEach, expect, it, vi } from "vitest";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  }
  vi.resetModules();
});

it("derives a future optimizer allowlist from the exact configured Supabase project", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://catalog-abc.supabase.co";
  vi.resetModules();

  const { default: nextConfig } = await import("../next.config");
  const patterns = nextConfig.images?.remotePatterns ?? [];

  expect(patterns).toContainEqual({
    protocol: "https",
    hostname: "catalog-abc.supabase.co",
    port: "",
    pathname: "/storage/v1/object/public/product-images/**",
    search: "",
  });
});

it("does not invent a Supabase project and permits existing Unsplash query variants", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  vi.resetModules();

  const { default: nextConfig } = await import("../next.config");
  const patterns = nextConfig.images?.remotePatterns ?? [];

  expect(patterns).not.toContainEqual(expect.objectContaining({ hostname: expect.stringMatching(/supabase\\.co$/) }));
  expect(patterns).toContainEqual({
    protocol: "https",
    hostname: "images.unsplash.com",
    port: "",
    pathname: "/**",
  });
});
