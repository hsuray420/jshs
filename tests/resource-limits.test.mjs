import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school explorer data is a compact static asset, not an SSR prop", async () => {
  const [dataset, page, explorer] = await Promise.all([
    readFile(new URL("../public/it_hs/school-directory.json", import.meta.url), "utf8"),
    readSource("app/schools/page.tsx"),
    readSource("components/school-explorer.tsx"),
  ]);
  const payload = JSON.parse(dataset);

  assert.ok(Array.isArray(payload.schools));
  assert.ok(payload.schools.length >= 600);
  assert.ok(payload.schools.every((school) => school.code && school.name && school.districtCode));
  assert.ok(payload.schools.every((school) => "address" in school && !("courseDirection" in school)));
  assert.doesNotMatch(page, /schoolDirectory/);
  assert.match(explorer, /school-directory\.json/);
  assert.match(explorer, /正在載入學校資料/);
});

test("public document responses receive a short edge-cache policy", async () => {
  const worker = await readSource("worker/index.ts");

  assert.match(worker, /isPublicDocumentRequest/);
  assert.match(worker, /s-maxage=60/);
  assert.match(worker, /stale-while-revalidate=300/);
  assert.match(worker, /request\.headers\.has\("cookie"\)/);
  assert.match(worker, /request\.headers\.get\("accept"\)/);
});
