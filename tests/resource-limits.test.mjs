import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school discovery excludes raw relation ledgers from its server-to-client prop", async () => {
  const [dataset, page, explorer] = await Promise.all([
    readFile(new URL("../content/schools/generated/metadata.json", import.meta.url), "utf8"),
    readSource("app/schools/page.tsx"),
    readSource("components/school-explorer.tsx"),
  ]);
  const payload = JSON.parse(dataset);

  assert.equal(payload.schoolCount, 545);
  assert.match(page, /getSchoolSummaries/);
  assert.match(explorer, /SchoolSummary/);
  assert.doesNotMatch(explorer, /\.raw|\.admissionRecords/);
});

test("public document responses receive a short edge-cache policy", async () => {
  const worker = await readSource("worker/index.ts");

  assert.match(worker, /isPublicDocumentRequest/);
  assert.match(worker, /s-maxage=60/);
  assert.match(worker, /stale-while-revalidate=300/);
  assert.match(worker, /request\.headers\.has\("cookie"\)/);
  assert.match(worker, /request\.headers\.get\("accept"\)/);
});
