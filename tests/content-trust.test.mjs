import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  findForbiddenPublicMarkers,
  validateDistrictMetadata,
  validateSitemap,
} from "../lib/content-trust.mjs";

const metadataUrl = new URL("../public/it_hs/district-metadata.json", import.meta.url);
const sitemapUrl = new URL("../public/sitemap.xml", import.meta.url);
const robotsUrl = new URL("../public/robots.txt", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const fiveYearPageUrl = new URL("../public/it_5/it_5.html", import.meta.url);
const guideScriptUrl = new URL("../public/it_hs/guide.js", import.meta.url);
const centralScriptUrl = new URL("../public/it_hs/ct/it_hs.js", import.meta.url);

test("district metadata satisfies the P0 trust contract", async () => {
  const metadata = JSON.parse(await readFile(metadataUrl, "utf8"));
  const issues = validateDistrictMetadata(metadata);

  assert.deepEqual(issues, []);
  assert.equal(metadata.schemaVersion, "1.0");
  assert.equal(metadata.currentAcademicYear, "115");
  assert.equal(metadata.canonicalOrigin, "https://jshs.cc");
});

test("sitemap and robots expose absolute canonical URLs", async () => {
  const [metadata, sitemap, robots] = await Promise.all([
    readFile(metadataUrl, "utf8").then(JSON.parse),
    readFile(sitemapUrl, "utf8"),
    readFile(robotsUrl, "utf8"),
  ]);

  assert.deepEqual(validateSitemap(sitemap, metadata.canonicalOrigin), []);
  assert.match(sitemap, /<loc>https:\/\/jshs\.cc\/jshs\/home<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/jshs\.cc\/it_hs\/guide\.htm<\/loc>/);
  assert.match(robots, /Sitemap: https:\/\/jshs\.cc\/sitemap\.xml/);
});

test("public trust surfaces contain no test placeholders", async () => {
  const publicFiles = Object.fromEntries(
    await Promise.all(
      [fiveYearPageUrl, guideScriptUrl, centralScriptUrl].map(async (url) => [
        url.pathname,
        await readFile(url, "utf8"),
      ]),
    ),
  );

  assert.deepEqual(findForbiddenPublicMarkers(publicFiles), []);
  assert.doesNotMatch(publicFiles[fiveYearPageUrl.pathname], /內容整理中/);
  assert.match(publicFiles[fiveYearPageUrl.pathname], /資料來源與適用範圍/);
});

test("root metadata declares canonical and social discovery fields", async () => {
  const layout = await readFile(layoutUrl, "utf8");

  assert.match(layout, /metadataBase:\s*new URL\("https:\/\/jshs\.cc"\)/);
  assert.match(layout, /canonical:\s*"\/jshs\/home"/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
});
