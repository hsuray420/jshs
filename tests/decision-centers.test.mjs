import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("calculator follows explain-as-you-fill flow and labels rule context", async () => {
  const source = await read("components/admission-calculator.tsx");
  for (const label of ["確認就學區與服務年度", "輸入會考各科等級／標示", "輸入志願序與必要比序項目", "目前總分", "計算版本", "目前資料缺口", "可以用來做什麼", "不能用來做什麼"]) assert.match(source, new RegExp(label));
  assert.match(source, /目前位於第/);
  assert.match(source, /上限/);
  assert.match(source, /\/api\/admission\/calculate/);
});

test("admission calculator uses structured sections and fact-based controls", async () => {
  const source = await read("components/admission-calculator.tsx");
  for (const component of ["AdmissionSection", "RuleHelpPopover", "PreferenceList", "SemesterSelector"]) assert.match(source, new RegExp(component));
  assert.doesNotMatch(source, /以逗號分隔/);
  assert.doesNotMatch(source, /<input type="number"/);
  assert.match(source, /<select value=\{writingLevel\}/);
});

test("planner exposes manual and non-predictive discovery workspaces with shared ordering and health checks", async () => {
  const [planner, page] = await Promise.all([
    read("components/planner-mode-workspace.tsx"),
    read("app/planner/page.tsx"),
  ]);
  for (const label of ["我的志願順序", "志願健檢", "志願探索", "位於你的就學區", "拖曳", "查看學校"]) assert.match(planner, new RegExp(label));
  assert.doesNotMatch(planner, /Group title="挑戰"/);
  assert.match(planner, /draggable/);
  assert.match(planner, /\/api\/planner\/state/);
  assert.match(page, /PlannerHub/);
  assert.match(planner, /readLocalPlanner|writeLocalPlanner/);
});

test("search and trust centers are real routes and discoverable", async () => {
  await Promise.all([access(new URL("../app/search/page.tsx", import.meta.url)), access(new URL("../app/trust/page.tsx", import.meta.url))]);
  const [search, trust, sitemap, routes] = await Promise.all([read("app/search/page.tsx"), read("app/trust/page.tsx"), read("scripts/generate-sitemap.mjs"), read("content/route-metadata.json")]);
  for (const label of ["學校", "科別", "升學指南", "積分規則", "官方資訊", "日程", "功能", "Trust", "公告"]) assert.match(search, new RegExp(label));
  for (const label of ["資料來源", "資料更新狀態", "15 區建置進度", "試算與分析方法", "錯誤回報", "平台可信度說明"]) assert.match(trust, new RegExp(label));
  assert.doesNotMatch(trust, /隱私權|服務條款|支持／合作與售後/);
  assert.match(sitemap, /routeMetadata\.routes/);
  assert.match(routes, /"pathname": "\/search"/);
  assert.match(routes, /"indexable": false/);
  assert.match(routes, /"pathname": "\/trust"/);
});

test("CT and Changhua timelines contain only source-confirmed page I/II fields", async () => {
  const [schedule, workspace, metadata] = await Promise.all([
    read("lib/admission-schedules.ts"),
    read("components/schedule-workspace.tsx"),
    read("public/it_hs/district-metadata.json"),
  ]);
  for (const label of ["ct-115-preference", "ct-115-placement", "ch-115-preference", "ch-115-placement", "sourcePages", "previous_year_reference"]) assert.match(schedule, new RegExp(label));
  assert.match(workspace, /getDistrictAdmissionSchedule/);
  assert.match(workspace, /官方來源|來源頁碼/);
  const districts = JSON.parse(metadata).districts;
  assert.equal(districts.ct.dataStatus, "ready");
  assert.equal(districts.changhua.dataStatus, "ready");
  assert.notEqual(districts.yunlin.dataStatus, "ready");
});
