import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const routeMetadata = await readJson("content/route-metadata.json");
const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8").catch(() => "");
const css = await readFile(resolve(root, "app/globals.css"), "utf8");
const issues = [];

const routes = routeMetadata.routes;
for (const route of routes) {
  for (const key of ["pathname", "title", "description", "canonical", "category"]) {
    if (!route[key]) issues.push(`${route.pathname}: missing ${key}`);
  }
  if (route.sitemap && !route.indexable) issues.push(`${route.pathname}: noindex route cannot be in sitemap`);
  if (route.pathname !== route.canonical && !route.legacy) issues.push(`${route.pathname}: non-legacy route canonical mismatch`);
  if (!route.legacy) {
    const pageFile = pageFileFor(route.pathname);
    if (pageFile) await access(resolve(root, pageFile)).catch(() => issues.push(`${route.pathname}: route page missing at ${pageFile}`));
  }
}

for (const location of sitemap.matchAll(/<loc>https:\/\/jshs\.cc([^<]+)<\/loc>/g)) {
  const pathname = location[1] === "/" ? "/" : location[1].replace(/\/$/u, "");
  const route = routes.find((item) => item.pathname === pathname);
  if (route && !route.indexable) issues.push(`${pathname}: noindex route appears in sitemap`);
  if (route && !route.sitemap) issues.push(`${pathname}: route metadata excludes sitemap but XML includes it`);
  if (!route && !pathname.startsWith("/schools/")) issues.push(`${pathname}: sitemap URL missing route metadata`);
}

for (const route of routes.filter((item) => item.sitemap && item.indexable)) {
  if (!sitemap.includes(`<loc>https://jshs.cc${route.pathname === "/" ? "/" : route.pathname}</loc>`)) issues.push(`${route.pathname}: route metadata expects sitemap inclusion`);
}

const featureHeroRequired = [
  "/schools",
  "/schools/history",
  "/schools/map",
  "/schools/compare",
  "/schools/commute",
  "/schools/cost",
  "/schools/alumni",
  "/schools/open-days",
  "/tools",
  "/tools/rules",
  "/tools/placement",
  "/tools/summary",
  "/tools/history",
  "/planner",
  "/planner/custom",
  "/planner/recommend",
  "/schedule",
  "/schedule/timeline",
  "/schedule/now",
  "/schedule/tasks",
  "/admission-guides",
  "/knowledge",
  "/eligibility",
  "/trust",
];

for (const pathname of featureHeroRequired) {
  const file = pageFileFor(pathname);
  if (!file) continue;
  const source = await readFile(resolve(root, file), "utf8").catch(() => "");
  if (!/FeatureHero/.test(source)) issues.push(`${pathname}: FeatureHero requirement missing`);
}

for (const required of ["jshs-intro-dialog", "safe-area-inset-bottom", "prefers-reduced-motion", "mobile-bottom-nav"]) {
  if (!css.includes(required)) issues.push(`mobile QA state missing ${required}`);
}

for (const path of ["/search", "/ai", "/account", "/notifications", "/tools/summary", "/tools/history", "/tools/placement", "/planner"]) {
  const route = routes.find((item) => item.pathname === path);
  if (!route || route.indexable || route.sitemap) issues.push(`${path}: expected noindex/no sitemap`);
}

if (issues.length) {
  console.error(`Route metadata audit failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Route metadata audit passed: ${routes.length} registered routes, sitemap is consistent.`);

function pageFileFor(pathname) {
  if (pathname === "/") return "app/page.tsx";
  if (pathname === "/it_5/it_5.html") return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "planner" && ["custom", "recommend"].includes(segments[1])) return `app/${segments.join("/")}/page.tsx`;
  if (segments[0] === "trust" && segments.length === 2) return "app/trust/[slug]/page.tsx";
  if (segments[0] === "knowledge" && segments.length === 2 && !["updates"].includes(segments[1])) return "app/knowledge/[topic]/page.tsx";
  if (segments[0] === "planner" && segments.length === 2 && ["custom", "recommend", "versions", "export", "official-platform"].includes(segments[1])) return "app/planner/[feature]/page.tsx";
  return `app/${segments.join("/")}/page.tsx`;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
