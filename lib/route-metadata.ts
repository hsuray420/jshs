import routeMetadataCatalog from "@/content/route-metadata.json";

export type RouteCategory =
  | "學校"
  | "科別"
  | "升學指南"
  | "積分規則"
  | "官方資訊"
  | "日程"
  | "功能"
  | "Trust"
  | "公告";

export type RouteMetadata = Readonly<{
  pathname: string;
  title: string;
  description: string;
  indexable: boolean;
  sitemap: boolean;
  canonical: string;
  category: RouteCategory;
  priority: string;
  changefreq: string;
  aliases: readonly string[];
  legacy?: boolean;
}>;

type RouteMetadataCatalog = Readonly<{
  updatedAt: string;
  routes: readonly RouteMetadata[];
}>;

const catalog = routeMetadataCatalog as RouteMetadataCatalog;

export const routeMetadataUpdatedAt = catalog.updatedAt;
export const routeMetadata = Object.freeze([...catalog.routes]) as readonly RouteMetadata[];
export const sitemapRoutes = Object.freeze(routeMetadata.filter((route) => route.sitemap && route.indexable));
export const searchableRoutes = Object.freeze(routeMetadata.filter((route) => !route.legacy));

export function getRouteMetadata(pathname: string): RouteMetadata | undefined {
  return routeMetadata.find((route) => route.pathname === pathname);
}
