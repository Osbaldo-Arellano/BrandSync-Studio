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
    // [id] bracket syntax is not expanded by Next.js file tracing — use * glob.
    // The runtime fallback in generate-pdf.ts downloads the pack if bin/ is
    // still missing, so this is a belt-and-suspenders inclusion.
    "/api/estimates/*/sign": [
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
