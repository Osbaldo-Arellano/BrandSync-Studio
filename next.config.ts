import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/order": ["./node_modules/@sparticuz/chromium/**"],
    "/api/render-pdf": ["./node_modules/@sparticuz/chromium/**"],
    "/api/estimates/[id]/sign": ["./node_modules/@sparticuz/chromium/**"],
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
