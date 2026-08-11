import { afterEach, expect, it, vi } from "vitest";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const unsplashQuery = "?auto=format&fit=crop&w=1400&q=80";
const unsplashSources = [
  `https://images.unsplash.com/photo-1517433670267-08bbd4be890f${unsplashQuery}`,
  `https://images.unsplash.com/photo-1578985545062-69928b1d9587${unsplashQuery}`,
  `https://images.unsplash.com/photo-1509440159596-0249088772ff${unsplashQuery}`,
];

function matchesPattern(pattern: unknown, source: string): boolean {
  if (!pattern || typeof pattern !== "object" || pattern instanceof URL) return false;
  const candidate = pattern as {
    protocol?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
  };
  const url = new URL(source);

  return (
    candidate.protocol === url.protocol.slice(0, -1) &&
    candidate.hostname === url.hostname &&
    candidate.port === url.port &&
    (candidate.pathname?.endsWith("**")
      ? url.pathname.startsWith(candidate.pathname.slice(0, -2))
      : candidate.pathname === url.pathname) &&
    (candidate.search === undefined || candidate.search === url.search)
  );
}

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

it("restricts the future optimizer to the exact current Unsplash assets", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  vi.resetModules();

  const { default: nextConfig } = await import("../next.config");
  const patterns = nextConfig.images?.remotePatterns ?? [];

  expect(patterns).not.toContainEqual(expect.objectContaining({ hostname: expect.stringMatching(/supabase\\.co$/) }));
  const unsplashPatterns = patterns.filter(
    (pattern) => !(pattern instanceof URL) && pattern.hostname === "images.unsplash.com"
  );

  for (const source of unsplashSources) {
    expect(unsplashPatterns.some((pattern) => matchesPattern(pattern, source))).toBe(true);
  }
  expect(
    unsplashPatterns.some((pattern) =>
      matchesPattern(
        pattern,
        `https://images.unsplash.com/photo-unrelated${unsplashQuery}`
      )
    )
  ).toBe(false);
  expect(
    unsplashPatterns.some((pattern) =>
      matchesPattern(
        pattern,
        "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80"
      )
    )
  ).toBe(false);
});
