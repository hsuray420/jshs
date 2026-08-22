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
  new URL("../components/planner-workspace.tsx", import.meta.url),
  new URL("../components/site-header.tsx", import.meta.url),
];

const expectedNavigation = [
  ["升學指南", "/news#latest"],
  ["找校科", "/schools?district=ct"],
  ["試算工具", "/tools"],
  ["我的規劃", "/planner"],
];

const expectedCategories = ["exam", "rules", "strategy", "schools", "career", "parents"];

test("the information architecture keeps four task hubs and treats district as context", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));

  assert.deepEqual(
    siteMap.primaryNavigation.map(({ label, href }) => [label, href]),
    expectedNavigation,
  );
  assert.equal(new Set(siteMap.primaryNavigation.map(({ href }) => href)).size, 4);
  assert.deepEqual(
    siteMap.primaryNavigation.map(({ activeHref }) => activeHref),
    ["/news", "/schools", "/tools", "/planner"],
  );
  assert.equal(siteMap.primaryNavigation.some(({ label }) => label === "就學區"), false);
});

test("shared header exposes scalable desktop, drawer, and mobile bottom navigation", async () => {
  const [header, footer] = await Promise.all([
    readFile(headerUrl, "utf8"),
    readFile(footerUrl, "utf8"),
  ]);

  assert.match(header, /primaryNavigation\.map/);
  assert.match(header, /aria-label="主要導覽"/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /aria-modal="true"/);
  assert.match(header, /搜尋內容與功能/);
  assert.match(header, /mobile-bottom-nav/);
  assert.match(header, /jshs-nav-open/);
  assert.match(header, /jshs-floating-nav/);
  assert.match(header, /jshs-button/);
  assert.match(header, /function openDrawer\(focusSearch = false\)/);
  assert.match(header, /onClick=\{\(\) => openDrawer\(true\)\}/);
  assert.doesNotMatch(header, />導覽選單</);
  assert.match(footer, /menuGroups\.map/);
});

test("visitor task surfaces hide implementation details from public copy", async () => {
  for (const url of visitorSurfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.doesNotMatch(source, /CLOUDFLARE|Cloudflare D1|Cloudflare Assets|新版/);
  }
});

test("visitor task surfaces use the shared Apple Notion design system without one-off chrome", async () => {
  for (const url of visitorSurfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /jshs-hero-section|jshs-surface-card|jshs-button/);
    assert.doesNotMatch(source, /jshs-organic|jshs-hero-band|jshs-pill-button|bg-blue-50|text-\[#2868d7\]|shadow-blue/);
  }
});

test("six news category hubs have stable URLs, metadata, and route files", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));

  assert.deepEqual(siteMap.newsCategories.map(({ slug }) => slug), expectedCategories);

  for (const category of siteMap.newsCategories) {
    assert.equal(category.href, `/news/${category.slug}`);
    assert.ok(category.title.length >= 4);
    assert.ok(category.description.length >= 30);

    const route = new URL(`../app/news/${category.slug}/page.tsx`, import.meta.url);
    const source = await readFile(route, "utf8");
    assert.match(source, new RegExp(`categorySlug=\\"${category.slug}\\"`));
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
  const guide = await readFile(new URL("../public/it_hs/guide.htm", import.meta.url), "utf8");
  const news = await readFile(new URL("../app/news/page.tsx", import.meta.url), "utf8");
  const schools = await readFile(new URL("../app/schools/page.tsx", import.meta.url), "utf8");
  const tools = await readFile(new URL("../app/tools/page.tsx", import.meta.url), "utf8");
  const planner = await readFile(new URL("../app/planner/page.tsx", import.meta.url), "utf8");

  for (const { href } of siteMap.primaryNavigation) {
    const url = new URL(href, "https://jshs.cc");
    if (url.pathname === "/schools") {
      assert.equal(url.searchParams.get("district"), "ct");
      assert.match(schools, /<SchoolExplorer/);
      continue;
    }
    const [path, anchor] = href.split("#");
    if (path === "/news") {
      assert.ok(anchor, `${path} must link directly to its useful content`);
      assert.match(news, new RegExp(`id=["']${anchor}["']`));
    } else if (path === "/tools") assert.match(tools, /AdmissionCalculator/);
    else if (path === "/planner") assert.match(planner, /PlannerWorkspace/);
    else {
      assert.equal(path, "/it_hs/guide.htm");
      assert.ok(anchor, `${path} must link directly to its useful content`);
      assert.match(guide, new RegExp(`data-page-section=["']${anchor}["']`));
    }
  }
});

test("sitemap exposes canonical hubs and excludes redirect-only legacy homepage", async () => {
  const sitemap = await readFile(sitemapUrl, "utf8");
  const requiredPaths = [
    "/",
    "/news",
    ...expectedCategories.map((slug) => `/news/${slug}`),
    "/tools",
    "/schools",
    "/districts",
  ];

  for (const path of requiredPaths) {
    assert.match(sitemap, new RegExp(`<loc>https://jshs\\.cc${path === "/" ? "/" : path}</loc>`));
  }

  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/jshs\/home<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/planner<\/loc>/);
});

test("article breadcrumbs point back to the canonical homepage", async () => {
  const articlePage = await readFile(articlePageUrl, "utf8");
  assert.match(articlePage, /item:\s*"https:\/\/jshs\.cc\/"/);
  assert.match(articlePage, /href="\/"/);
});

test("district metadata remains the Cloudflare-hosted source catalog", async () => {
  await access(new URL("../public/it_hs/district-metadata.json", import.meta.url));
});
