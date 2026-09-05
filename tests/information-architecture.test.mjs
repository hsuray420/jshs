import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);
const sitemapUrl = new URL("../public/sitemap.xml", import.meta.url);
const articlePageUrl = new URL("../app/news/[slug]/page.tsx", import.meta.url);
const visitorSurfaceUrls = [
  new URL("../components/school-explorer.tsx", import.meta.url),
  new URL("../components/admission-calculator.tsx", import.meta.url),
  new URL("../components/planner-mode-workspace.tsx", import.meta.url),
  new URL("../components/site-header.tsx", import.meta.url),
];

const expectedNavigation = [
  ["找學校", "/schools"],
  ["算成績", "/tools"],
  ["我的志願", "/planner"],
  ["升學日程", "/schedule"],
  ["官方資訊", "/admission-guides"],
  ["升學指南", "/knowledge"],
  ["資料與信任", "/trust"],
  ["其他", "/trust/credibility"],
];

const legacyNewsCategories = ["exam", "rules", "strategy", "schools", "career", "parents"];

test("the information architecture follows the final eight-group product sitemap", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));

  assert.deepEqual(
    siteMap.primaryNavigation.map(({ label, href }) => [label, href]),
    expectedNavigation,
  );
  assert.equal(new Set(siteMap.primaryNavigation.map(({ href }) => href)).size, 8);
  assert.deepEqual(
    siteMap.primaryNavigation.map(({ activeHref }) => activeHref),
    ["/schools", "/tools", "/planner", "/schedule", "/admission-guides", "/knowledge", "/trust", "/trust/credibility"],
  );
  assert.equal(siteMap.primaryNavigation.some(({ label }) => label === "就學區"), false);
});

test("shared header exposes scalable desktop, drawer, and mobile bottom navigation", async () => {
  const [header, footer] = await Promise.all([
    readFile(headerUrl, "utf8"),
    readFile(footerUrl, "utf8"),
  ]);

  assert.match(header, /primaryNavigation/);
  assert.match(header, /aria-label="主要導覽"/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /aria-modal="true"/);
  assert.match(header, /搜尋內容與功能/);
  assert.match(header, /mobile-bottom-nav/);
  assert.match(header, /jshs-nav-open/);
  assert.match(header, /jshs-site-header/);
  assert.match(header, /jshs-desktop-nav/);
  assert.match(header, /jshs-login-link/);
  assert.match(header, /mobileNavigation = primaryNavigation/);
  assert.match(header, /mobileNavigation\.map/);
  assert.match(header, /全國國中升學資訊網/);
  assert.doesNotMatch(header, />導覽選單</);
  assert.match(footer, /footerGroups\.map/);
  assert.match(footer, /JSHS\.CC/);
  assert.match(footer, /資料最後更新/);
});

test("visitor task surfaces hide implementation details from public copy", async () => {
  for (const url of visitorSurfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.doesNotMatch(source, /CLOUDFLARE|Cloudflare D1|Cloudflare Assets|新版/);
  }
});

test("visitor task surfaces use the shared education iOS design system without one-off chrome", async () => {
  for (const url of visitorSurfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /jshs-hero-section|jshs-surface-card|jshs-button|sv-root/);
    assert.doesNotMatch(source, /jshs-organic|jshs-hero-band|jshs-pill-button|bg-blue-50|text-\[#2868d7\]|shadow-blue/);
  }
});

test("legacy news category routes redirect into the canonical IA", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));
  assert.equal("newsCategories" in siteMap, false);

  for (const slug of legacyNewsCategories) {
    const source = await readFile(new URL(`../app/news/${slug}/page.tsx`, import.meta.url), "utf8");
    assert.match(source, /redirect\(/);
    assert.doesNotMatch(source, /NewsCategoryPage|categorySlug/);
  }
});

test("tools, schools, districts, and private planner each have a real landing page", async () => {
  for (const slug of ["tools", "schools", "districts", "planner"]) {
    const route = new URL(`../app/${slug}/page.tsx`, import.meta.url);
    await access(route);
  }

  const planner = await readFile(new URL("../app/planner/page.tsx", import.meta.url), "utf8");
  assert.match(planner, /index:\s*false/);
  assert.match(planner, /follow:\s*false/);
});

test("primary navigation lands on an interactive surface instead of an introductory hero", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));
  const schools = await readFile(new URL("../app/schools/page.tsx", import.meta.url), "utf8");
  const tools = await readFile(new URL("../app/tools/page.tsx", import.meta.url), "utf8");
  const planner = await readFile(new URL("../app/planner/page.tsx", import.meta.url), "utf8");
  const schedule = await readFile(new URL("../app/schedule/page.tsx", import.meta.url), "utf8");
  const knowledge = await readFile(new URL("../app/knowledge/page.tsx", import.meta.url), "utf8");

  for (const { href } of siteMap.primaryNavigation) {
    const url = new URL(href, "https://jshs.cc");
    if (url.pathname === "/schools") {
      assert.match(schools, /<SchoolExplorer/);
      continue;
    }
    if (url.pathname === "/tools") assert.match(tools, /AdmissionCalculator/);
    else if (url.pathname === "/planner") assert.match(planner, /PlannerHub/);
    else if (url.pathname === "/schedule") assert.match(schedule, /ScheduleWorkspace/);
    else if (url.pathname === "/admission-guides") assert.match(await readFile(new URL("../app/admission-guides/page.tsx", import.meta.url), "utf8"), /AdmissionGuideLibrary/);
    else if (url.pathname === "/knowledge") assert.match(knowledge, /guideSections/);
    else if (url.pathname === "/trust/credibility") assert.match(await readFile(new URL("../app/trust/[slug]/page.tsx", import.meta.url), "utf8"), /credibility/);
    else assert.equal(url.pathname, "/trust");
  }
});

test("sitemap exposes canonical hubs and excludes redirect-only legacy homepage", async () => {
  const sitemap = await readFile(sitemapUrl, "utf8");
  const requiredPaths = [
    "/",
    "/news",
    "/admission-guides/schedule",
    "/tools",
    "/schools",
    "/schools/groups",
    "/trust",
  ];

  for (const path of requiredPaths) {
    assert.match(sitemap, new RegExp(`<loc>https://jshs\\.cc${path === "/" ? "/" : path}</loc>`));
  }

  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/jshs\/home<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/search<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/planner/);
  for (const slug of legacyNewsCategories) assert.doesNotMatch(sitemap, new RegExp(`<loc>https://jshs\\.cc/news/${slug}</loc>`));
  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/schedule\/(countdown|compare|export|open-days)<\/loc>/);
});

test("article routes render canonical article content without generic redirects", async () => {
  const articlePage = await readFile(articlePageUrl, "utf8");
  assert.match(articlePage, /getNewsArticle/);
  assert.match(articlePage, /article\.title/);
  assert.doesNotMatch(articlePage, /redirect\(destinationFor\(slug\)\)/);
  assert.match(articlePage, /robots: \{ index: false, follow: false \}/);
  assert.doesNotMatch(articlePage, /application\/ld\+json/);
});

test("district metadata remains the Cloudflare-hosted source catalog", async () => {
  await access(new URL("../public/it_hs/district-metadata.json", import.meta.url));
});
