import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("calculator follows explain-as-you-fill flow and labels rule context", async () => {
  const source = await read("components/admission-calculator.tsx");
  for (const label of ["確認就學區與學年度", "輸入會考各科等級／標示", "輸入志願序與必要比序項目", "目前總分", "計算版本", "目前資料缺口", "可以用來做什麼", "不能用來做什麼"]) assert.match(source, new RegExp(label));
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

test("planner exposes four workspaces, ordering, comparison, family summary and private share", async () => {
  const [planner, page, share] = await Promise.all([
    read("components/planner-workspace.tsx"),
    read("app/planner/page.tsx"),
    read("components/planner-share.tsx"),
  ]);
  for (const label of ["我的選項", "風險分層", "比較表", "下一步", "為什麼想選", "觀點標籤", "列印／另存 PDF", "下載清單", "建立只讀分享", "家庭討論摘要"]) assert.match(planner, new RegExp(label));
  assert.match(planner, /draggable/);
  assert.match(planner, /\/api\/planner\/state/);
  assert.match(page, /plannerSchools/);
  assert.match(share, /不公開索引/);
});

test("search and trust centers are real routes and discoverable", async () => {
  await Promise.all([access(new URL("../app/search/page.tsx", import.meta.url)), access(new URL("../app/trust/page.tsx", import.meta.url))]);
  const [search, trust, sitemap] = await Promise.all([read("app/search/page.tsx"), read("app/trust/page.tsx"), read("scripts/generate-sitemap.mjs")]);
  for (const label of ["學校／校科", "升學指南文章", "百科與規則名詞", "重要日程", "官方來源"]) assert.match(search, new RegExp(label));
  for (const label of ["資料來源與更新紀錄", "如何閱讀落點與風險", "資料錯誤回報", "隱私權", "服務條款", "支持／合作與售後"]) assert.match(trust, new RegExp(label));
  assert.match(sitemap, /entry\("\/search"/);
  assert.match(sitemap, /entry\("\/trust"/);
});

test("CT and Changhua timelines contain only source-confirmed page I/II fields", async () => {
  const [schedule, workspace, metadata] = await Promise.all([
    read("lib/admission-schedules.ts"),
    read("components/schedule-workspace.tsx"),
    read("public/it_hs/district-metadata.json"),
  ]);
  for (const label of ["ct-115-preference", "ct-115-placement", "ch-115-preference", "ch-115-placement", "sourcePages", "confirmed"]) assert.match(schedule, new RegExp(label));
  assert.match(workspace, /getDistrictAdmissionSchedule/);
  assert.match(workspace, /項目、日期、說明與來源頁碼均已逐欄核對/);
  const districts = JSON.parse(metadata).districts;
  assert.equal(districts.ct.dataStatus, "ready");
  assert.equal(districts.changhua.dataStatus, "ready");
  assert.notEqual(districts.yunlin.dataStatus, "ready");
});
