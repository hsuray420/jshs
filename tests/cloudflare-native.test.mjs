import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production UI has no third-party runtime scripts or remote data fallback", async () => {
  const [layout, fiveYear, siteConfig] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("public/it_5/it_5.html"),
    readSource("public/it_hs/site-config.js"),
  ]);

  for (const source of [layout, fiveYear]) {
    assert.doesNotMatch(source, /googlesyndication|fonts\.googleapis|fonts\.gstatic/);
  }
  assert.doesNotMatch(siteConfig, /tyctw\.github\.io|publicSchoolIndexSource/);
});

test("school and planner data are served by Cloudflare Assets and D1", async () => {
  const [schoolRoute, plannerStore, plannerRoute, workerConfig] = await Promise.all([
    readSource("app/api/schools.csv/route.ts"),
    readSource("db/planner-store.ts"),
    readSource("app/api/planner/route.ts"),
    readSource("wrangler.jsonc"),
  ]);

  assert.match(schoolRoute, /env\.ASSETS\.fetch/);
  assert.match(schoolRoute, /district/);
  assert.match(plannerStore, /CREATE TABLE IF NOT EXISTS planner_items/);
  assert.match(plannerStore, /\.prepare\(/);
  assert.match(plannerStore, /\.bind\(/);
  assert.match(plannerRoute, /HttpOnly/);
  assert.match(workerConfig, /"binding": "ASSETS"/);
  assert.match(workerConfig, /"binding": "DB"/);
});

test("admin uploads use Cloudflare D1 instead of an unavailable external file layer", async () => {
  const [store, filesRoute, csvRoute, downloadRoute] = await Promise.all([
    readSource("db/admin-store.ts"),
    readSource("app/api/admin/files/route.ts"),
    readSource("app/api/admin/schools-csv/route.ts"),
    readSource("app/api/files/[id]/route.ts"),
  ]);

  for (const source of [store, filesRoute, csvRoute, downloadRoute]) {
    assert.doesNotMatch(source, /getR2|R2Bucket|\.FILES/);
  }
  assert.match(store, /file_blob/);
  assert.match(filesRoute, /arrayBuffer/);
});

test("local source changes are gated and deployed directly to Cloudflare", async () => {
  const [pkg, watcher] = await Promise.all([
    readSource("package.json"),
    readSource("scripts/cloudflare-watch.mjs"),
  ]);

  assert.match(pkg, /"cloudflare:watch"/);
  assert.match(pkg, /"cloudflare:deploy:direct"/);
  assert.match(watcher, /pnpm/);
  assert.match(watcher, /process\.execPath/);
  assert.match(watcher, /test/);
  assert.match(watcher, /wrangler/);
  assert.match(watcher, /deploy/);
  assert.match(watcher, /--keep-vars/);
  assert.match(watcher, /jshs-production/);
  assert.match(watcher, /setTimeout/);
});

test("health status follows Cloudflare core services, not optional LINE integrations", async () => {
  const healthRoute = await readSource("app/api/health/route.ts");

  assert.match(healthRoute, /const coreOk = database/);
  assert.match(healthRoute, /status: coreOk \? 200 : 503/);
  assert.match(healthRoute, /integrations/);
});
