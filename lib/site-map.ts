import siteMapCatalog from "@/content/site-map.json";

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

export type NewsCategoryHub = Readonly<{
  slug: string;
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  topics: readonly string[];
  articleSlugs: readonly string[];
  nextHref: string;
  nextLabel: string;
}>;

type SiteMapCatalog = Readonly<{
  updatedAt: string;
  primaryNavigation: readonly PrimaryNavigationItem[];
  menuGroups: readonly MenuGroup[];
  newsCategories: readonly NewsCategoryHub[];
}>;

const catalog = siteMapCatalog as SiteMapCatalog;

export const siteMapUpdatedAt = catalog.updatedAt;
export const primaryNavigation = Object.freeze([...catalog.primaryNavigation]);
export const menuGroups = Object.freeze([...catalog.menuGroups]);
export const newsCategories = Object.freeze([...catalog.newsCategories]);

export function getNewsCategoryHub(slug: string): NewsCategoryHub | undefined {
  return newsCategories.find((category) => category.slug === slug);
}
