import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/order": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/render-pdf": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/estimates/[id]/sign": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/estimates/[id]/sign/route": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/@sparticuz/chromium/bin/**",
    ],
  },
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
