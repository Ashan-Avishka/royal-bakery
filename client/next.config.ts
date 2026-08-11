import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
    // Keep the source-delivery fallback until a real imported Supabase URL
    // has passed a production `/_next/image` request in this environment.
    // Next's optimizer resolves the upstream hostname and applies SSRF
    // protections; a NAT64/private-address rejection would otherwise make
    // product imagery unavailable. Imported assets are already 1000px,
    // quality-82 WebP files on Supabase's CDN, with responsive `sizes` and
    // lazy loading supplied by the consuming Image components.
    unoptimized: true,
  },
};

export default nextConfig;
