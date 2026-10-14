import path from "node:path";

const nextConfig = {
  reactCompiler: true,
  experimental: { inlineCss: false },
  turbopack: {
    root: path.resolve("../.."),
    rules: { "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" } },
  },
};

export default nextConfig;
