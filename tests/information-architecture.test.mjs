import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);
const sitemapUrl = new URL("../public/sitemap.xml", import.meta.url);
const articlePageUrl = new URL("../app/news/[slug]/page.tsx", import.meta.url);

const expectedNavigation = [
  ["升學情報", "/news"],
  ["找學校", "/schools"],
  ["升學工具", "/tools"],
  ["就學區", "/districts"],
  ["我的規劃", "/planner"],
];

const expectedCategories = ["exam", "rules", "strategy", "schools", "career", "parents"];

test("the information architecture has exactly five stable primary navigation items", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));

  assert.deepEqual(
    siteMap.primaryNavigation.map(({ label, href }) => [label, href]),
    expectedNavigation,
  );
  assert.equal(new Set(siteMap.primaryNavigation.map(({ href }) => href)).size, 5);
  assert.deepEqual(
    siteMap.primaryNavigation.map(({ activeHref }) => activeHref),
    ["/news", "/schools", "/tools", "/districts", "/planner"],
  );
});

test("shared header and footer render the same navigation on every app surface", async () => {
  const [header, footer] = await Promise.all([
    readFile(headerUrl, "utf8"),
    readFile(footerUrl, "utf8"),
  ]);

  assert.match(header, /primaryNavigation\.map/);
  assert.match(header, /aria-label="主要導覽"/);
  assert.match(header, /<details/);
  assert.match(footer, /primaryNavigation\.map/);
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
