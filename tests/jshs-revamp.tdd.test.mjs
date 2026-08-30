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
  assert.match(support, /外部付款服務/);
  assert.match(openDays, /使用者提供/);
  assert.match(openDays, /官方公告/);
});

test("desktop welcome cards do not disappear merely because the visitor is signed in", async () => {
  const intro = await source("components/site-intro-modal.tsx");
  assert.doesNotMatch(intro, /!isMember/);
  assert.doesNotMatch(intro, /if \(!open \|\| isMember\)/);
});

test("donation button uses a configurable external destination instead of creating a local payment order", async () => {
  const [form, header, admin, settings] = await Promise.all([
    source("components/support-donation-form.tsx"),
    source("components/site-header.tsx"),
    source("app/admin/page.tsx"),
    source("app/api/admin/settings/route.ts"),
  ]);
  assert.match(form, /donation_url/);
  assert.match(form, /target="_blank"/);
  assert.doesNotMatch(form, /fetch\("\/api\/donations"/);
  assert.match(header, /DonationLink/);
  assert.match(header, /fallbackHref="\/support"/);
  assert.match(admin, /綠界付款連結（小額捐款／贊助）/);
  assert.match(admin, /name="donation_url"/);
  assert.match(settings, /donation_url/);
  assert.match(settings, /isValidEcpayUrl/);
});
