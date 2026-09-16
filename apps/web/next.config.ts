import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (.next/standalone) —
  // the standard shape for a container image (docs/phase-13/README.md),
  // so the runtime image doesn't need the full node_modules tree.
  output: "standalone",
  transpilePackages: [
    "@ltp/core",
    "@ltp/market-data",
    "@ltp/db",
    "@ltp/ai",
    "@ltp/entitlements",
    "@ltp/billing",
  ],
  async headers() {
    return [
      {
        // Applies to every route. A stricter Content-Security-Policy is
        // deferred (see docs/phase-12/README.md) — Next.js dev mode and
        // the inline JSON-LD <script> tags (components/seo/JsonLd.tsx)
        // need care to not break under a naive CSP, and getting that
        // wrong silently breaks the app rather than failing loudly.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
