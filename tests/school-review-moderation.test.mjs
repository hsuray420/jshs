import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("匿名分享先進待審核資料，不會直接公開或回傳完整資料", async () => {
  const route = await read("app/api/school-reviews/route.ts");
  assert.match(route, /examScore/);
  assert.match(route, /admissionResult/);
  assert.match(route, /status: "pending"/);
  assert.match(route, /status: "pending"/);
  assert.match(route, /待管理員審核後公開/);
  assert.doesNotMatch(route, /Response\.json\(\{ ok: true, review \}/);
});

test("前台只讀已公開分享，管理員才能審核 pending", async () => {
  const [store, adminRoute, adminPage] = await Promise.all([
    read("db/school-review-store.ts"),
    read("app/api/admin/school-reviews/route.ts"),
    read("app/admin/page.tsx"),
  ]);
  assert.match(store, /listPendingSchoolReviews/);
  assert.match(store, /moderateSchoolReview/);
  assert.match(store, /status = 'published'/);
  assert.match(store, /status = 'pending'/);
  assert.match(adminRoute, /getAdminSession/);
  assert.match(adminRoute, /status !== "published" && status !== "rejected"/);
  assert.match(adminPage, /匿名分享待審核/);
  assert.match(adminPage, /審核公開/);
});
