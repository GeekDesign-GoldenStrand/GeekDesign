import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Turbopack/React Fast Refresh need 'unsafe-eval' and inline scripts in dev.
    // Production keeps a tighter policy.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      // Presigned GCS reads (the /api/images proxy 302s to *.storage.googleapis.com).
      "img-src 'self' data: blob: https://images.unsplash.com https://storage.googleapis.com https://*.storage.googleapis.com",
      "font-src 'self' data:",
      // Browser uploads PUT directly to the presigned bucket URL.
      "connect-src 'self' https://storage.googleapis.com https://*.storage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // No Cross-Origin-Embedder-Policy: require-corp would block
          // presigned GCS images (GCS sends no CORP header) without
          // buying anything — the app needs no cross-origin isolation.
        ],
      },
    ];
  },
};

export default nextConfig;
