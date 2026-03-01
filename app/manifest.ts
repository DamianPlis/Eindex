import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eindx",
    short_name: "Eindx",
    description: "School planning app",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f2ee",
    theme_color: "#2d5bff",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
