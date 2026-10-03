import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("會員志願探索送出 API 接受的 tier，且同校不同科別可並存", async () => {
  const source = await readSource("components/planner-mode-workspace.tsx");

  assert.match(source, /addItem\(school: RecommendationSchool, tier = "balanced"\)/);
  assert.match(source, /onAdd\(school, "balanced"\)/);
  assert.match(source, /school\.code.*school\.department/);
  assert.match(source, /item\.school_code.*item\.department/);
  assert.doesNotMatch(source, /tier = "explore"/);
});

test("志願拖曳使用來源 item id，而非目標卡片 id", async () => {
  const source = await readSource("components/planner-mode-workspace.tsx");

  assert.match(source, /draggedItemId/);
  assert.match(source, /onReorder\(draggedItemId/);
});

test("清空志願由單一操作處理，不逐項呼叫舊 closure", async () => {
  const source = await readSource("components/planner-mode-workspace.tsx");

  assert.match(source, /function clearItems\(/);
  assert.match(source, /onClear=\{clearItems\}/);
  assert.doesNotMatch(source, /orderedItems\.forEach\(\(item\) => onDelete\(item\)\)/);
});

test("模考趨勢以日期排序後取最新與前次成績", async () => {
  const source = await readSource("components/mock-exam-workspace.tsx");

  assert.match(source, /sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)/);
  assert.match(source, /latest: values\[0\]/);
  assert.match(source, /values\[1\]/);
});
