import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allowedDevOrigins is required to access dev server over network
  allowedDevOrigins: ["192.168.1.84:3000", "192.168.1.84", "0.0.0.0:3000"]
};

export default nextConfig;
