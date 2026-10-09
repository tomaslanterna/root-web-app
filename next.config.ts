import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    BACKEND_PUBLIC_API_URL: process.env.BACKEND_PUBLIC_API_URL,
  },
  allowedDevOrigins: ["192.168.1.9", "http://192.168.1.9:3000"],
};

export default nextConfig;
