import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/order": ["./node_modules/@sparticuz/chromium/**"],
    "/api/render-pdf": ["./node_modules/@sparticuz/chromium/**"],
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
