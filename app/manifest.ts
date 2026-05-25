import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eindex",
    short_name: "Eindex",
    description: "School planning app",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff7fbf",
    orientation: "portrait",
    icons: [],
  };
}
