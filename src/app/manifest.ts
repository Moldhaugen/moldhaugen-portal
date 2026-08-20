import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moldhaugen Portal",
    short_name: "Moldhaugen",
    description: "Nabolagsportalen for Moldhaugen Borettslag",
    start_url: "/calendar",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1e293b",
    theme_color: "#1e293b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
