import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("自選志願以明確儲存並分析操作建立版本，分析後才提供其他工作區入口", async () => {
  const source = await read("components/planner-mode-workspace.tsx");

  assert.match(source, /function saveAndAnalyze\(/);
  assert.match(source, /儲存並分析/);
  assert.match(source, /已保存版本/);
  assert.match(source, /href="\/planner\/versions"/);
  assert.match(source, /請 AI 說明健檢/);
  assert.match(source, /登入 LINE 後儲存並分析/);
  assert.doesNotMatch(source, /saveLocalPlannerSnapshot/);
});

test("志願清單與探索卡片只呈現學校、所在地與學制，且探索提供可收合的進階篩選", async () => {
  const source = await read("components/planner-mode-workspace.tsx");

  assert.match(source, /school\.city, school\.program/);
  assert.match(source, /進階篩選/);
  assert.doesNotMatch(source, /\[school\.city, school\.program, school\.department\]\.filter/);
  assert.doesNotMatch(source, /item\.department \|\| "校科資料"/);
});

test("我的志願各入口與背景卡片沿用紅色主題並保留左右留白", async () => {
  const [featurePage, css] = await Promise.all([
    read("app/planner/[feature]/page.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(featurePage, /jshs-feature-planner/);
  assert.match(css, /\.jshs-feature-planner > \.jshs-hero-section/);
  assert.match(css, /linear-gradient\(120deg, #fff1f2/);
  assert.match(css, /margin: 28px auto 0/);
});
