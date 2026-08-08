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
    // Supabase Storage already serves these from a CDN, and Next's built-in
    // optimizer does a server-side DNS lookup + SSRF check before fetching
    // upstream images — on networks where that hostname resolves via NAT64
    // (64:ff9b::/96), Next flags it as a private address and refuses to
    // fetch it at all. Skipping optimization avoids that entirely; the
    // browser just requests the Supabase URL directly.
    unoptimized: true,
  },
};

export default nextConfig;
