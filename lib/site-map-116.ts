import siteMapCatalog from "../content/site-map.json" with { type: "json" };
import type { MenuGroup, PrimaryNavigationItem } from "@/lib/site-map";

// The JSON catalog is the one editable IA source. Runtime consumers and tests
// share this typed projection so a legacy menu cannot silently diverge again.
export const primaryNavigation116 = Object.freeze([...siteMapCatalog.primaryNavigation]) as readonly PrimaryNavigationItem[];
export const menuGroups116 = Object.freeze([...siteMapCatalog.menuGroups]) as readonly MenuGroup[];
