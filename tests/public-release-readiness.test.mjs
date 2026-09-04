import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public trust surfaces explain the JSHS promise and editorial independence", async () => {
  const [home, trust, detail, siteMap] = await Promise.all([
    read("app/page.tsx"),
    read("app/trust/page.tsx"),
    read("app/trust/[slug]/page.tsx"),
    read("content/site-map.json"),
  ]);

  for (const principle of ["看得懂", "查得到", "算得清楚", "自己決定"]) {
    assert.match(home, new RegExp(principle));
  }
  for (const slug of ["about", "sponsor", "updates"]) {
    assert.match(detail, new RegExp(`\\b${slug}\\b`));
  }
  assert.match(detail, /贊助不影響|編輯獨立/);
  assert.match(trust, /資料狀態|官方確認|多來源整理|使用者提供|尚待確認/);
  assert.match(siteMap, /關於本站|支持／合作|資料更新紀錄/);
});

test("data reporting is a first-party moderated flow", async () => {
  const [route, store, form, adminPage, dashboard] = await Promise.all([
    read("app/api/data-reports/route.ts"),
    read("db/data-report-store.ts"),
    read("components/data-report-form.tsx"),
    read("app/admin/data/reports/page.tsx"),
    read("app/admin/page.tsx"),
  ]);

  assert.match(route, /sameOrigin/);
  assert.match(route, /rate/i);
  assert.match(store, /data_reports/);
  for (const status of ["pending", "accepted", "fixed", "rejected"]) assert.match(store, new RegExp(status));
  assert.match(form, /目前內容/);
  assert.match(form, /官方來源/);
  assert.match(adminPage, /資料回報/);
  assert.match(dashboard, /data-reports/);
});

test("release gate and discovery metadata are wired into the project", async () => {
  const [packageJson, gate, layout, manifest] = await Promise.all([
    read("package.json"),
    read("scripts/check-release-gate.mjs"),
    read("app/layout.tsx"),
    read("app/manifest.ts"),
  ]);

  assert.match(packageJson, /release:gate/);
  assert.match(gate, /Coming soon|功能開發中|placeholder/i);
  assert.match(gate, /not-found/);
  assert.match(layout, /og-image/);
  assert.match(manifest, /JSHS/);
});
