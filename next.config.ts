import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    BACKEND_PUBLIC_API_URL: process.env.BACKEND_PUBLIC_API_URL,
  },
  allowedDevOrigins: ["192.168.1.9", "http://192.168.1.9:3000"],
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 2592000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "192.168.1.9",
      },
      {
        protocol: "http",
        hostname: "192.168.*.*",
      },
      {
        protocol: "http",
        hostname: "perito-app-service.com",
      },
      {
        protocol: "https",
        hostname: "perito-app-service.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "passline.com",
      },
      {
        protocol: "https",
        hostname: "**.passline.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
