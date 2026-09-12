import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school discovery uses a lightweight static search index", async () => {
  const [dataset, searchIndex, page, explorer, compare, commute, map, detail] = await Promise.all([
    readFile(new URL("../content/schools/generated/metadata.json", import.meta.url), "utf8"),
    readFile(new URL("../content/schools/generated/school-search-index.json", import.meta.url), "utf8"),
    readSource("app/schools/page.tsx"),
    readSource("components/school-explorer.tsx"),
    readSource("app/schools/compare/page.tsx"),
    readSource("app/schools/commute/page.tsx"),
    readSource("app/schools/map/page.tsx"),
    readSource("app/schools/[district]/page.tsx"),
  ]);
  const payload = JSON.parse(dataset);
  const indexPayload = JSON.parse(searchIndex);
  const publicSearchIndex = await stat(new URL("../public/data/school-search-index.json", import.meta.url));
  const publicLegacySummary = await stat(new URL("../public/data/schools.json", import.meta.url));

  assert.equal(payload.schoolCount, 347);
  assert.equal(payload.admissionRecordCount, 373);
  assert.equal(indexPayload.length, 347);
  assert.ok(indexPayload.every((school) => school.normalizedSearchText && !school.admissionRecords && !school.raw));
  assert.ok(publicSearchIndex.size < publicLegacySummary.size, "search index must be smaller than the legacy public summary payload");
  assert.doesNotMatch(page, /getSchoolSummaries|getSchools\(/);
  assert.match(explorer, /school-search-index\.json/);
  assert.match(explorer, /normalizedSearchText/);
  assert.doesNotMatch(explorer, /\/data\/schools\.json/);
  for (const route of [compare, commute, map, detail]) assert.doesNotMatch(route, /getSchools\(/);
  assert.match(detail, /SchoolDetailClient/);
});

test("public document responses receive a short edge-cache policy", async () => {
  const worker = await readSource("worker/index.ts");

  assert.match(worker, /isPublicDocumentRequest/);
  assert.match(worker, /s-maxage=60/);
  assert.match(worker, /stale-while-revalidate=300/);
  assert.match(worker, /request\.headers\.has\("cookie"\)/);
  assert.match(worker, /request\.headers\.get\("accept"\)/);
  assert.match(worker, /schoolDataAssetResponse/);
  assert.match(worker, /\/data\/school-search-index\.json/);
  assert.match(worker, /\/data\/schools\/by-code\//);
  assert.match(worker, /school-data-static-asset/);
});
