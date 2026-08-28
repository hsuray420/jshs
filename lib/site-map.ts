import siteMapCatalog from "@/content/site-map.json";
import { menuGroups116, primaryNavigation116 } from "@/lib/site-map-116";

export type PrimaryNavigationItem = Readonly<{
  label: string;
  href: string;
  activeHref: string;
}>;

export type MenuItem = Readonly<{
  label: string;
  href: string;
  description: string;
  available?: boolean;
  children?: readonly MenuItem[];
}>;

export type MenuGroup = Readonly<{
  label: string;
  href: string;
  activeHref: string;
  eyebrow: string;
  description: string;
  items: readonly MenuItem[];
}>;

type SiteMapCatalog = Readonly<{
  updatedAt: string;
  primaryNavigation: readonly PrimaryNavigationItem[];
  menuGroups: readonly MenuGroup[];
}>;

const catalog = siteMapCatalog as SiteMapCatalog;

export const siteMapUpdatedAt = catalog.updatedAt;
export const primaryNavigation = Object.freeze([...primaryNavigation116]);
export const menuGroups = Object.freeze([...menuGroups116]);
