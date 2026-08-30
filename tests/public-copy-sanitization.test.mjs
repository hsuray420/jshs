import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("school map explains its purpose without exposing implementation vendors or credentials", async () => {
  const page = await source("components/school-map-explorer.tsx");
  assert.doesNotMatch(page, /學校地圖 · OpenStreetMap/);
  assert.doesNotMatch(page, /不需要 Google 金鑰或付款方式/);
  assert.doesNotMatch(page, /地址定位由 OpenStreetMap Nominatim 提供/);
});

test("commute and member screens use user-facing language for location and privacy", async () => {
  const [commute, account] = await Promise.all([
    source("components/commute-comparison.tsx"),
    source("components/account-center.tsx"),
  ]);
  assert.doesNotMatch(commute, /座標由 OpenStreetMap 資料整理/);
  assert.doesNotMatch(account, /LINE 身分只在後端保存/);
  assert.doesNotMatch(account, /目前瀏覽器中以 JSHS 開頭保存/);
});

test("legacy public guides never surface development labels, file paths, or raw loading errors", async () => {
  const [guide, centralTaiwan, changhua] = await Promise.all([
    source("public/it_hs/guide.js"),
    source("data/admission/115/central_taiwan.json"),
    source("data/admission/115/changhua.json"),
  ]);
  assert.doesNotMatch(guide, /目前開發區域/);
  assert.doesNotMatch(guide, /無法載入 \$\{config\.csvPath\}/);
  assert.doesNotMatch(centralTaiwan, /前端應以學校代碼/);
  assert.doesNotMatch(changhua, /部署時完整匯入competition_catalog資料表/);
});

test("public configuration failure responses do not disclose secret variable names", async () => {
  const webhook = await source("app/api/line/webhook/route.ts");
  assert.doesNotMatch(webhook, /LINE_CHANNEL_SECRET is not configured yet/);
});

test("score guidance describes admission rules rather than internal research artifacts", async () => {
  const [calculator, route] = await Promise.all([
    source("components/admission-calculator.tsx"),
    source("app/api/admission/calculate/route.ts"),
  ]);
  assert.doesNotMatch(calculator, /本區研究資料的志願序/);
  assert.doesNotMatch(route, /研究規則要求的欄位/);
});
