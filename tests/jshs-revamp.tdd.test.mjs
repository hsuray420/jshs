import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school search uses a concise search-first result card", async () => {
  const page = await source("components/school-explorer.tsx");
  assert.match(page, /找學校與科系/);
  assert.match(page, /搜尋結果摘要/);
  assert.doesNotMatch(page, /<Status label="資料年度"/);
  assert.doesNotMatch(page, /<Status label="資料狀態"/);
});

test("map requests native location only after an explicit action and never links to Google", async () => {
  const page = await source("components/school-map-explorer.tsx");
  assert.match(page, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(page, /使用目前位置/);
  assert.match(page, /api\/commute/);
  assert.doesNotMatch(page, /google\.com\/maps/);
});

test("history only routes a record to its school detail", async () => {
  const page = await source("components/admission-history-explorer.tsx");
  assert.match(page, />查看學校詳情/);
  assert.doesNotMatch(page, /學長姐分享/);
  assert.doesNotMatch(page, /#alumni/);
});

test("support and open-day ingestion surfaces are available", async () => {
  const [support, openDays] = await Promise.all([
    source("app/support/page.tsx"),
    source("components/schedule-workspace.tsx"),
  ]);
  assert.match(support, /小額捐款/);
  assert.match(support, /贊助我們/);
  assert.match(support, /付款成功/);
  assert.match(openDays, /使用者提供/);
  assert.match(openDays, /CSV/);
});
