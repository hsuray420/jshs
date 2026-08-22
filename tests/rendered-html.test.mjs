import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appPageUrl = new URL("../app/page.tsx", import.meta.url);
const legacyJshsHtmlUrl = new URL("../public/jshs/jshs.html", import.meta.url);
const districtScriptUrl = new URL("../public/it_hs/guide.js", import.meta.url);
const districtIndexUrl = new URL("../public/it_hs/ilan/index.html", import.meta.url);
const districtMetadataUrl = new URL("../public/it_hs/district-metadata.json", import.meta.url);
const districtGuideUrl = new URL("../public/it_hs/guide.htm", import.meta.url);
const globalCssUrl = new URL("../app/globals.css", import.meta.url);
const districtCssUrl = new URL("../public/it_hs/guide.css", import.meta.url);
const tokenCssUrl = new URL("../public/design-tokens.css", import.meta.url);
const workerUrl = new URL("../worker/index.ts", import.meta.url);
const wranglerConfigUrl = new URL("../wrangler.jsonc", import.meta.url);

test("root route is the canonical public homepage", async () => {
  const page = await readFile(appPageUrl, "utf8");

  assert.match(page, /canonical:\s*"\/"/);
  assert.match(page, /先選一件事完成/);
  for (const label of ["升學指南", "找校科", "試算工具", "我的規劃"]) assert.match(page, new RegExp(label));
  assert.doesNotMatch(page, /redirect\(/);
  assert.doesNotMatch(page, /localStorage|role="dialog"|setSelectedDistrict/);
});

test("legacy jshs entry points resolve to the single public homepage", async () => {
  const [worker, legacyHtml] = await Promise.all([
    readFile(workerUrl, "utf8"),
    readFile(legacyJshsHtmlUrl, "utf8"),
  ]);

  assert.match(worker, /const canonicalHomePaths = new Set/);
  for (const path of ["/jshs", "/jshs/home", "/jshs/jshs"]) {
    assert.match(worker, new RegExp(`"${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(worker, /redirectToCanonicalHome\(request\)/);
  assert.match(legacyHtml, /url=\//);
  assert.match(legacyHtml, /window\.location\.replace\('\/'\)/);
});

test("district picker restores the last district and preserves the requested tool", async () => {
  const script = await readFile(districtScriptUrl, "utf8");

  assert.match(script, /localStorage\.getItem\('jshs_district'\)/);
  assert.match(script, /requestedPage === 'home' \? 'overview' : requestedPage/);
  assert.match(script, /window\.location\.replace\(`\/it_hs\/guide\.htm\?district=\$\{encodeURIComponent\(district\)\}#\$\{encodeURIComponent\(targetPage\)\}`\)/);
  assert.match(script, /if \(!getSelectedDistrict\(\) && \['home', 'calculator', 'analysis'\]\.includes\(requestedPage\)\) open\(\)/);
  assert.match(script, /localStorage\.setItem\('jshs_district', district\)/);
});

test("unavailable districts show a clear construction page", async () => {
  const [script, districtIndex] = await Promise.all([
    readFile(districtScriptUrl, "utf8"),
    readFile(districtIndexUrl, "utf8"),
  ]);

  assert.match(script, /function showDistrictUnavailablePage\(\)/);
  assert.match(script, /功能尚未開放/);
  assert.match(script, /查看可用學校資料/);
  assert.match(script, /查看基北區資料/);
  assert.match(districtIndex, /district=\$\{encodeURIComponent\(district\)\}/);
});

test("districts with a school CSV open school search without scoring tools", async () => {
  const [script, page] = await Promise.all([
    readFile(districtScriptUrl, "utf8"),
    readFile(new URL("../public/it_hs/guide.htm", import.meta.url), "utf8"),
  ]);

  assert.match(script, /function isSchoolQueryOnlyMode\(\)/);
  assert.match(script, /\|\| 'overview'/);
  assert.match(script, /\['calculator', 'analysis'\]/);
  assert.match(page, /data-scoring-feature/);
});

test("district metadata exposes feature availability and authoritative context", async () => {
  const metadata = JSON.parse(await readFile(districtMetadataUrl, "utf8"));

  assert.equal(metadata.version, "2026.08.14");
  assert.equal(metadata.districts.ct.schools, true);
  assert.equal(metadata.districts.ct.calculator, true);
  assert.equal(metadata.districts.tp.analysis, true);
  assert.equal(metadata.districts.ilan.calculator, false);
  assert.match(metadata.officialDirectory.url, /^https:\/\//);
  assert.ok(metadata.timelineDefaults.ready.every((item) => item.date && item.status));
  assert.match(metadata.disclaimer, /最新公告/);
});

test("district guide persists a private local planning workspace and exposes comparisons", async () => {
  const [script, page] = await Promise.all([
    readFile(districtScriptUrl, "utf8"),
    readFile(districtGuideUrl, "utf8"),
  ]);

  assert.match(script, /jshs:planner:v1/);
  assert.match(script, /localStorage\.setItem\(PLANNER_STORAGE_KEY/);
  assert.match(script, /data-wish-commute/);
  assert.match(page, /id="wishlistComparison"/);
  assert.match(page, /id="plannerTaskList"/);
  assert.match(page, /id="plannerTimelineList"/);
  assert.match(page, /id="faqContext"/);
  assert.match(script, /function getDistrictTimeline/);
  assert.match(script, /function renderFaqContext/);
  assert.match(script, /item\.open = item\.dataset\.faqTopic === topic/);
  assert.match(script, /wishlist-comparison-mobile/);
  assert.match(script, /analysis-tier/);
});

test("homepage and district guide share one Apple Notion design token system", async () => {
  const [globalCss, districtGuide, districtCss, tokens] = await Promise.all([
    readFile(globalCssUrl, "utf8"),
    readFile(districtGuideUrl, "utf8"),
    readFile(districtCssUrl, "utf8"),
    readFile(tokenCssUrl, "utf8"),
  ]);

  assert.match(tokens, /--bg-page:\s*#FFFFFF/i);
  assert.match(tokens, /--bg-subtle:\s*#F5F5F7/i);
  assert.match(tokens, /--text-primary:\s*#1D1D1F/i);
  assert.match(tokens, /--text-secondary:\s*#6E6E73/i);
  assert.match(tokens, /--border-light:\s*#E5E5E7/i);
  assert.match(tokens, /--brand-primary:\s*#0066CC/i);
  assert.match(tokens, /--brand-tint:\s*#F2F7FF/i);
  assert.match(tokens, /--jshs-space-1:\s*4px/i);
  assert.match(tokens, /--radius-lg:\s*16px/i);
  assert.doesNotMatch(tokens, /organic-radius|#FDFCF8|#5D7052|#C18C5D/i);
  assert.doesNotMatch(globalCss, /main\.min-h-screen > section\s*\{[^}]*min-height:\s*100vh/s);
  assert.match(globalCss, /@import url\("\/design-tokens\.css"\)/);
  assert.match(globalCss, /-apple-system,\s*BlinkMacSystemFont/);
  assert.match(globalCss, /\.jshs-surface-card/);
  assert.match(globalCss, /\.jshs-button-primary/);
  assert.match(globalCss, /\.jshs-input/);
  assert.doesNotMatch(globalCss, /fonts\.googleapis|Fraunces|Nunito|body::before|mix-blend-mode|organic/i);
  assert.match(districtGuide, /href="\/design-tokens\.css"/);
  assert.match(districtGuide, /href="guide\.css\?v=20260814-4"/);
  assert.match(districtCss, /Guide Apple Notion final layer/);
  assert.match(districtCss, /var\(--jshs-radius-card\)/);
});

test("shared visual token stylesheet and static guide are served by the Worker asset binding", async () => {
  const [worker, config] = await Promise.all([
    readFile(workerUrl, "utf8"),
    readFile(wranglerConfigUrl, "utf8"),
  ]);

  assert.match(worker, /url\.pathname === "\/design-tokens\.css"/);
  assert.match(worker, /url\.pathname === "\/app\/globals\.css"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/it_hs\/"\)/);
  assert.match(worker, /const legacyGuidePaths = new Set/);
  assert.match(worker, /new Request\(assetUrl, request\)/);
  assert.match(config, /"html_handling": "none"/);
  assert.match(config, /"run_worker_first": true/);
  assert.match(worker, /return env\.ASSETS\.fetch\(request\)/);
});

test("trust-critical static files bypass stale asset caches", async () => {
  const worker = await readFile(workerUrl, "utf8");

  assert.match(worker, /import districtMetadata from "\.\.\/public\/it_hs\/district-metadata\.json"/);
  assert.match(worker, /import robotsText from "\.\.\/public\/robots\.txt\?raw"/);
  assert.match(worker, /import sitemapXml from "\.\.\/public\/sitemap\.xml\?raw"/);
  assert.match(worker, /url\.pathname === "\/it_hs\/district-metadata\.json"/);
  assert.match(worker, /url\.pathname === "\/robots\.txt"/);
  assert.match(worker, /url\.pathname === "\/sitemap\.xml"/);
  assert.match(worker, /"cache-control": "no-store"/);
});

test("worker serves the original admission app and redirects its alias back to the functional guide", async () => {
  const worker = await readFile(workerUrl, "utf8");

  assert.match(worker, /url\.pathname\.startsWith\("\/assets\/"\)/);
  assert.match(worker, /"\/it_hs\/it_hs"/);
  assert.match(worker, /"\/it_hs\/it_hs\.html"/);
  assert.match(worker, /new URL\("\/it_hs\/guide\.htm"/);
  assert.doesNotMatch(worker, /url\.pathname === "\/it_hs\/guide\.htm"[^}]+Response\.redirect/s);
  assert.match(worker, /url\.pathname\.startsWith\("\/jshs\/"\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/it_5\/"\)/);
});

test("production Worker route takes over the existing jshs.cc zone without R2", async () => {
  const config = JSON.parse(await readFile(wranglerConfigUrl, "utf8"));

  assert.deepEqual(config.routes, [
    {
      pattern: "jshs.cc/*",
      zone_id: "2700357d9e2674d41286c7d39452e50e",
    },
  ]);
  assert.equal("r2_buckets" in config, false);
});
