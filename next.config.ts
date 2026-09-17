import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin requests to /_next HMR and other dev assets.
  // Opening http://127.0.0.1:3000 while the server bound to localhost (or the
  // reverse) otherwise leaves client components unhydrated — buttons render
  // but clicks do nothing. Hostnames only; ignored in production.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
