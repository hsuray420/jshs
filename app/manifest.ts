import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "全國國中升學資訊網｜JSHS",
    short_name: "JSHS",
    description: "找學校、算成績、規劃志願與掌握升學資訊。",
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
      { name: "積分試算", short_name: "積分試算", url: "/tools", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
