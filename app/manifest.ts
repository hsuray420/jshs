import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "全國國中升學資訊網｜JSHS",
    short_name: "JSHS",
    description: "找學校、算成績、規劃志願與掌握升學資訊。",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F2F7",
    theme_color: "#F2F2F7",
    lang: "zh-TW",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
