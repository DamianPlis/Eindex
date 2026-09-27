import path from "node:path";

export default {
  reactCompiler: true,
  experimental: { inlineCss: false },
  turbopack: {
    root: path.resolve("../.."),
    rules: { "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" } },
  },
};
