import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Zytron Drop — Universal P2P AirDrop",
    short_name: "Zytron Drop",
    description:
      "Universele P2P AirDrop tussen iPhone (iOS), Samsung, Xiaomi (HyperOS), Huawei en PC. Deel direct vanuit je Share-menu of via QR/Radar zonder installatie op het tweede toestel.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030306",
    theme_color: "#030306",
    categories: ["utilities", "productivity", "social"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    share_target: {
      action: "/?shared=1",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "files",
            accept: [
              "image/*",
              "video/*",
              "audio/*",
              "application/pdf",
              "application/zip",
              "text/*",
              "*/*",
            ],
          },
        ],
      },
    },
    shortcuts: [
      {
        name: "Quick Share / AirDrop",
        short_name: "Quick Share",
        description: "Direct bestanden verzenden via Quick Share of AirDrop",
        url: "/?action=quick_send",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Vaste Vrienden (School ↔ Thuis)",
        short_name: "Vrienden",
        description: "Direct bestanden naar je PC of vrienden sturen op afstand",
        url: "/?action=friends",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Auto-Radar Scanner",
        short_name: "Radar",
        description: "Automatische nabijheidsradar voor toestellen in de buurt",
        url: "/?action=radar",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
