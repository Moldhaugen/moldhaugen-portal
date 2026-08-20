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
      { src: "/api/icons/pwa/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/icons/pwa/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/icons/pwa/maskable-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/api/icons/pwa/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
