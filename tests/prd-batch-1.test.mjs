import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("積分規則的正式 UI 不輸出內部公式或研究資料結構名稱", async () => {
  const source = await read("components/interactive-rule-table.tsx");
  assert.match(source, /humanizeRuleExplanation/);
  assert.doesNotMatch(source, /精確計算.*item\.calculation/);
  assert.doesNotMatch(source, /欄位、條件與原文/);
  assert.doesNotMatch(source, /研究 JSON／MD/);
});

test("待辦頁只呈現中文使用者標籤，不呈現資料結構 key", async () => {
  const source = await read("components/schedule-workspace.tsx");
  assert.match(source, /系統建議待辦/);
  assert.match(source, /我的待辦/);
  assert.doesNotMatch(source, /<p className="jshs-eyebrow">systemTasks<\/p>/);
  assert.doesNotMatch(source, /<p className="jshs-eyebrow">userTasks<\/p>/);
});

test("新聞文章 route 以 slug 取得並呈現對應內容", async () => {
  const source = await read("app/news/[slug]/page.tsx");
  assert.match(source, /getNewsArticle/);
  assert.match(source, /notFound/);
  assert.match(source, /article\.title/);
  assert.doesNotMatch(source, /redirect\(destinationFor\(slug\)\)/);
});

test("全站提供可理解的錯誤與找不到頁面", async () => {
  const [error, notFound] = await Promise.all([read("app/error.tsx"), read("app/not-found.tsx")]);
  for (const source of [error, notFound]) {
    assert.match(source, /目前無法載入這個內容|找不到這個頁面/);
    assert.match(source, /返回升學指南/);
  }
  assert.match(error, /重新載入/);
});

test("第一批補修不讓資料狀態互相矛盾", async () => {
  const [eligibility, schools, history, calculator] = await Promise.all([
    read("components/admission-path-finder.tsx"),
    read("components/school-explorer.tsx"),
    read("components/admission-history-explorer.tsx"),
    read("components/admission-calculator.tsx"),
  ]);
  assert.match(eligibility, /if \(!hydrated\) return <WelcomeView/);
  assert.match(schools, /loaded \? \(loadError \?/);
  assert.match(history, /\{loaded \? <span/);
  assert.doesNotMatch(calculator, /五個就學區/);
  assert.match(calculator, /目前開放 8／15 區/);
});
