import type { NextConfig } from "next";

function getSupabaseImagePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return undefined;

  try {
    const url = new URL(supabaseUrl);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".supabase.co") ||
      url.port ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return {
      protocol: "https" as const,
      hostname: url.hostname,
      port: "",
      pathname: "/storage/v1/object/public/product-images/**",
      search: "",
    };
  } catch {
    return undefined;
  }
}

const supabaseImagePattern = getSupabaseImagePattern();
const unsplashImagePaths = [
  "/photo-1517433670267-08bbd4be890f",
  "/photo-1578985545062-69928b1d9587",
  "/photo-1509440159596-0249088772ff",
] as const;
const unsplashImageSearch = "?auto=format&fit=crop&w=1400&q=80";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
      ...unsplashImagePaths.map((pathname) => ({
        protocol: "https" as const,
        hostname: "images.unsplash.com",
        port: "",
        pathname,
        search: unsplashImageSearch,
      })),
    ],
    // Product sources remain raw CDN assets until a production `/_next/image`
    // request succeeds for a real imported URL. With this global fallback,
    // Next does not generate srcset variants or emit `sizes`; component sizes
    // stay accurate so the future optimized policy can be enabled safely.
    // The patterns above constrain that future optimizer, not browser-side
    // requests for the current raw source delivery.
    unoptimized: true,
  },
};

export default nextConfig;
