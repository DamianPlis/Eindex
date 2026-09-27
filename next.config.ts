import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "https://bookish-zebra-pjwvxr4p45vv3rjxq-3000.app.github.dev",
        "bookish-zebra-pjwvxr4p45vv3rjxq-3000.app.github.dev",
      ],
    },
    inlineCss: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  allowedDevOrigins: [],
};

export default nextConfig;
