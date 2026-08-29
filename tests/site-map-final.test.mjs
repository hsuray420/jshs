import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const finalGroups = ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任"];

test("final sitemap defines the seven user-facing navigation groups", async () => {
  const catalog = JSON.parse(await read("content/site-map.json"));
  assert.deepEqual(catalog.menuGroups.map(({ label }) => label), finalGroups);

  const labels = JSON.stringify(catalog.menuGroups).match(/全國校科查詢|歷年錄取|校園開放日|資料更新狀態|試算與分析方法/g) || [];
  for (const label of [
    "全國校科查詢", "歷年錄取", "校園開放日", "資料更新狀態", "試算與分析方法",
  ]) assert.ok(labels.includes(label), `missing final sitemap item: ${label}`);
});

test("final sitemap exposes real canonical hubs and compatibility routes stay out of navigation", async () => {
  for (const route of ["app/schools/page.tsx", "app/tools/page.tsx", "app/planner/page.tsx", "app/schedule/page.tsx", "app/admission-guides/page.tsx", "app/knowledge/page.tsx", "app/trust/page.tsx"]) {
    await access(new URL(route, root));
  }

  const [schools, tools, planner, schedule, guides, knowledge, trust, gate, header] = await Promise.all([
    read("app/schools/page.tsx"), read("app/tools/page.tsx"), read("app/planner/page.tsx"),
    read("app/schedule/page.tsx"), read("app/admission-guides/page.tsx"), read("app/knowledge/page.tsx"), read("app/trust/page.tsx"),
    read("components/district-gate.tsx"),
    read("components/site-header.tsx"),
  ]);

  assert.match(schools, /SchoolExplorer/);
  assert.match(tools, /AdmissionCalculator/);
  assert.match(planner, /PlannerHub/);
  assert.match(schedule, /ScheduleWorkspace/);
  assert.match(guides, /AdmissionGuideLibrary/);
  assert.match(knowledge, /guideSections/);
  assert.match(trust, /sections/);
  assert.match(gate, /請選擇就學區/);
  assert.match(gate, /jshs_district/);
  assert.match(gate, /jshs-district-changed/);
  assert.doesNotMatch(header, /查學校|時間日程|特殊資格|升學知識|信任中心|工具中心/);
});

test("資料與信任 menu items each have independent canonical detail pages", async () => {
  const catalog = JSON.parse(await read("content/site-map.json"));
  const trust = catalog.menuGroups.find(({ label }) => label === "資料與信任");
  const expected = new Map([
    ["資料來源", "/trust/sources"],
    ["資料更新狀態", "/trust/status"],
    ["15 區建置進度", "/trust/progress"],
    ["試算與分析方法", "/trust/methodology"],
    ["資料版本紀錄", "/trust/versions"],
    ["錯誤回報", "/trust/report"],
    ["平台可信度說明", "/trust/credibility"],
  ]);

  for (const [label, href] of expected) {
    assert.equal(trust.items.find((item) => item.label === label)?.href, href, `${label} should have its own URL`);
  }

  const detailRoute = await read("app/trust/[slug]/page.tsx");
  assert.match(detailRoute, /generateStaticParams/);
  for (const href of expected.values()) assert.match(detailRoute, new RegExp(href.split("/").at(-1)));
});

test("資料錯誤回報使用指定的 Google 表單", async () => {
  const reportPage = await read("app/trust/[slug]/page.tsx");
  assert.match(reportPage, /https:\/\/forms\.gle\/qd6GuS1EFXkzjppz7/);
  assert.match(reportPage, /填寫錯誤回報表單/);
});

test("trust detail pages expose the PRD trust surfaces", async () => {
  const detailRoute = await read("app/trust/[slug]/page.tsx");
  for (const label of ["來源年度", "服務年度", "8／15", "規則資料", "錯誤回報", "不取代", "錄取保證"]) {
    assert.match(detailRoute, new RegExp(label));
  }
});

test("shared header contains the final fixed context controls", async () => {
  const header = await read("components/site-header.tsx");
  for (const label of finalGroups) assert.match(header, new RegExp(label));
  for (const label of ["通知", "帳號", "目前：", "全站搜尋"]) assert.match(header, new RegExp(label));
  assert.match(header, /useSyncExternalStore/);
});
