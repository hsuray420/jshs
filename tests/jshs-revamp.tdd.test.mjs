import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school search uses a concise search-first result card", async () => {
  const [page, route, styles, detail] = await Promise.all([
    source("components/school-explorer.tsx"),
    source("app/schools/page.tsx"),
    source("components/schools-v2.css"),
    source("components/school-detail-client.tsx"),
  ]);
  assert.doesNotMatch(route, /getSchoolSummaries|getSchools\(/);
  assert.match(page, /school-search-index\.json/);
  assert.match(page, /找到適合你的學校/);
  assert.match(page, /目前就學區/);
  assert.match(page, /依目前選擇的就學區顯示可用資料，可隨時切換。/);
  assert.match(page, /共 <strong>\{result\.length\}<\/strong> 所學校/);
  assert.match(page, /sv-school-card-link/);
  assert.doesNotMatch(page, /SchoolMedia|sv-school-card-image|校園圖片尚未提供/);
  assert.doesNotMatch(page, /查看全部/);
  assert.match(route, /getRegionRegistry/);
  assert.match(route, /regions=\{getRegionRegistry\(\)\}/);
  assert.match(styles, /\.sv-explorer-root \.sv-school-grid \{[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(styles, /@media \(max-width:\s*1023px\)[\s\S]*?\.sv-explorer-root \.sv-school-grid \{[^}]*repeat\(2,/s);
  assert.match(styles, /@media \(max-width:\s*767px\)[\s\S]*?\.sv-explorer-root \.sv-school-grid \{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(detail, /SchoolMedia/);
});

test("map only renders verified coordinates and keeps Google Maps as an address link", async () => {
  const page = await source("components/school-map-explorer.tsx");
  assert.match(page, /getSchoolCoordinate/);
  assert.match(page, /已核對學校位置地圖/);
  assert.match(page, /Google 地圖開啟/);
  assert.doesNotMatch(page, /navigator\.geolocation/);
});

test("history routes a record to its school detail without unrelated sharing", async () => {
  const page = await source("components/admission-history-explorer.tsx");
  assert.match(page, />查看學校 →/);
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

test("the公益維護 welcome card links to the donation page", async () => {
  const intro = await source("components/site-intro-modal.tsx");
  assert.match(intro, /贊助我們/);
  assert.match(intro, /action: \{ label: "贊助我們", href: "\/support" \}/);
  assert.match(intro, /<Link href=\{card\.action\.href\}/);
});

test("donation button sends a validated amount to the server-side ECPay checkout", async () => {
  const [form, header, admin, settings] = await Promise.all([
    source("components/support-donation-form.tsx"),
    source("components/site-header.tsx"),
    source("app/admin/payments/page.tsx"),
    source("app/api/admin/settings/route.ts"),
  ]);
  assert.match(form, /api\/donation\/checkout\?amount=/);
  assert.match(form, /target="_blank"/);
  assert.doesNotMatch(form, /fetch\("\/api\/donations"/);
  assert.doesNotMatch(header, /DonationLink/);
  assert.match(header, /href="\/search"/);
  assert.match(admin, /綠界公開設定/);
  assert.match(admin, /name="donation_url"/);
  assert.match(settings, /donation_url/);
  assert.match(settings, /isValidEcpayUrl/);
});
