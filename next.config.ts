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
    inlineCss: true,
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
  allowedDevOrigins: [
    "192.168.203.228",
    "192.168.1.197",
    "192.168.68.103",
    "192.168.203.221",
  ],
};

export default nextConfig;
