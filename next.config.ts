import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin requests to /_next HMR and other dev assets.
  // Opening http://127.0.0.1:3100 while the server bound to localhost (or the
  // reverse) otherwise leaves client components unhydrated — buttons render
  // but clicks do nothing. Hostnames only; ignored in production.
  // workshop.geek.partners / crm.local cover local hosts files the parent may map.
  allowedDevOrigins: ["127.0.0.1", "localhost", "workshop.geek.partners", "crm.local"],
};

export default nextConfig;
