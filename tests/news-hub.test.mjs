import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogUrl = new URL("../content/news.json", import.meta.url);
const hubPageUrl = new URL("../app/news/page.tsx", import.meta.url);
const articlePageUrl = new URL("../app/news/[slug]/page.tsx", import.meta.url);
const newsLibraryUrl = new URL("../lib/news.ts", import.meta.url);
const homePageUrl = new URL("../app/page.tsx", import.meta.url);
const sitemapUrl = new URL("../public/sitemap.xml", import.meta.url);

test("news catalog contains six useful, source-backed guides", async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  const articles = catalog.articles;

  assert.equal(catalog.updatedAt, "2026-08-14");
  assert.ok(Array.isArray(articles));
  assert.ok(articles.length >= 6);
  assert.equal(new Set(articles.map((article) => article.slug)).size, articles.length);
  assert.ok(new Set(articles.map((article) => article.category)).size >= 5);

  for (const article of articles) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(article.title.length >= 18);
    assert.ok(article.description.length >= 45);
    assert.ok(article.readMinutes >= 4);
    assert.ok(article.keywords.length >= 3);
    assert.ok(article.summary.length >= 3);
    assert.ok(article.audience.length >= 4);
    assert.ok(article.academicYear.length >= 3);
    assert.ok(article.districtScope.length >= 4);
    assert.ok(article.oneLineConclusion.length >= 20);
    assert.ok(article.preparation.length >= 2);
    assert.ok(article.misconceptions.length >= 2);
    assert.ok(article.sections.length >= 3);
    assert.ok(article.sources.length >= 1);
    assert.ok(article.sources.every((source) => /^https:\/\//.test(source.url)));
    assert.ok(article.sources.every((source) => /(?:gov\.tw|edu\.tw|ntut\.edu\.tw|jshs\.cc)/.test(source.url)));
    assert.match(article.cta.href, /^\//);
    assert.doesNotMatch(JSON.stringify(article), /保證錄取|一定會上|精準預測/);
  }
});

test("official information hub stays official-only and article slugs render their own content", async () => {
  const [hubPage, articlePage, newsLibrary] = await Promise.all([
    readFile(hubPageUrl, "utf8"),
    readFile(articlePageUrl, "utf8"),
    readFile(newsLibraryUrl, "utf8"),
  ]);

  assert.match(hubPage, /canonical:\s*"\/news"/);
  assert.match(hubPage, /官方最新公告/);
  assert.match(hubPage, /SourceBadge sourceType="official"/);
  assert.doesNotMatch(hubPage, /getFeaturedNews|SourceBadge sourceType="jshs_|SourceBadge sourceType="community/);
  assert.match(articlePage, /generateStaticParams/);
  assert.match(articlePage, /generateMetadata/);
  assert.match(articlePage, /getNewsArticle/);
  assert.match(articlePage, /article\.title/);
  assert.match(articlePage, /notFound/);
  assert.doesNotMatch(articlePage, /redirect\(destinationFor\(slug\)\)/);
  assert.doesNotMatch(articlePage, /application\/ld\+json/);
  assert.match(newsLibrary, /export function getNewsArticle/);
  assert.match(newsLibrary, /export function getRelatedNews/);
  assert.doesNotMatch(hubPage, /newsArticles|article\.title/);
});

test("homepage and sitemap expose the canonical official information entry", async () => {
  const [homePage, sitemap] = await Promise.all([
    readFile(homePageUrl, "utf8"),
    readFile(sitemapUrl, "utf8"),
  ]);

  assert.match(homePage, /href="\/news"/);
  assert.doesNotMatch(homePage, /getFeaturedNews/);
  assert.match(sitemap, /<loc>https:\/\/jshs\.cc\/news<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/jshs\.cc\/news\/[^<]+<\/loc>/);
});
