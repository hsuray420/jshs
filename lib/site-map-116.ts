import siteMapCatalog from "../content/site-map.json" with { type: "json" };
import type { MenuGroup, PrimaryNavigationItem } from "./site-map";
import scoreFeatureCatalog from "../content/score-features.json" with { type: "json" };

// The JSON catalog is the one editable IA source. Runtime consumers and tests
// share this typed projection so a legacy menu cannot silently diverge again.
export const primaryNavigation116 = Object.freeze([...siteMapCatalog.primaryNavigation]) as readonly PrimaryNavigationItem[];
export const menuGroups116 = Object.freeze(siteMapCatalog.menuGroups.map((group) => {
  if (group.label !== "成績分析") return group;
  return {
    ...group,
    items: scoreFeatureCatalog.areas.map((area) => ({
      label: area.label,
      href: area.primaryHref,
      description: area.title,
      children: scoreFeatureCatalog.features
        .filter((feature) => feature.area === area.key)
        .map(({ label, href, description }) => ({ label, href, description })),
    })),
  };
})) as readonly MenuGroup[];
