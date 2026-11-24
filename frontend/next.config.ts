import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Under Vercel Services (Beta) the /_next/image optimizer route returns 404, so images are
  // served as-is. Our images are pre-optimized WebP (e.g. the 37 KB moon), so nothing is lost.
  images: { unoptimized: true },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
