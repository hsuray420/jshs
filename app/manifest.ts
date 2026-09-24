import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "找學校、成績分析、規劃志願與掌握升學資訊。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F2F2F7",
    theme_color: "#F2F2F7",
    lang: "zh-TW",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "全國學校查詢", short_name: "學校查詢", url: "/schools", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "成績分析", short_name: "成績分析", url: "/scores", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
