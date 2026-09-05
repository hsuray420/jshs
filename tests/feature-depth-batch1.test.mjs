import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("placement refuses prediction when the verified model contract is absent", async () => {
  const source = await read("components/score-workspaces.tsx");
  assert.match(source, /目前資料不足，無法提供可信的落點判斷/);
  assert.match(source, /可比較年度/);
  assert.doesNotMatch(source, /PlacementGroup title="挑戰"/);
  assert.doesNotMatch(source, /PlacementGroup title="適中"/);
  assert.doesNotMatch(source, /PlacementGroup title="穩定"/);
});

test("planner recommendation is discovery rather than an admission prediction", async () => {
  const source = await read("components/planner-mode-workspace.tsx");
  assert.match(source, /志願探索/);
  assert.match(source, /你的積分資料已載入/);
  assert.match(source, /位於你的就學區/);
  assert.doesNotMatch(source, /Group title="挑戰"/);
  assert.doesNotMatch(source, /Group title="適中"/);
  assert.doesNotMatch(source, /Group title="穩定"/);
});

test("commute keeps official transport information separate from a third-party route", async () => {
  const source = await read("components/commute-comparison.tsx");
  assert.match(source, /校方交通資訊/);
  assert.match(source, /你的路線試算/);
  assert.match(source, /Google 地圖路線試算/);
  assert.match(source, /不顯示即時計算的距離與時間/);
  assert.doesNotMatch(source, /estimateMinutes\(|geometric_estimate/);
});

test("history uses the auditable record contract and separates official from community", async () => {
  const [source, records] = await Promise.all([
    read("components/admission-history-explorer.tsx"),
    read("public/it_hs/historical-records.json"),
  ]);
  for (const field of ["id", "district", "schoolCode", "programCode", "schoolYear", "recordType", "sourceType", "sourceUrl", "verifiedAt", "notes"]) assert.match(records, new RegExp(`"${field}"`));
  for (const label of ["學校", "科別", "年度", "官方資料", "社群參考資料", "目前沒有找到這個年度的官方歷史資料"]) assert.match(source, new RegExp(label));
});

test("groups, official information, and trust surfaces use auditable data models", async () => {
  const [groups, official, trust, registry] = await Promise.all([
    read("components/knowledge-topic-workspace.tsx"),
    read("lib/official-information.ts"),
    read("app/trust/[slug]/page.tsx"),
    read("lib/trust-registry.ts"),
  ]);
  for (const label of ["技高群科探索", "搜尋科別", "群別篩選", "相關學校", "待補資料"]) assert.match(groups, new RegExp(label));
  for (const field of ["issuer", "schoolYear", "publishDate", "sourceType", "official_original", "jshs_curated"]) assert.match(official, new RegExp(field));
  for (const label of ["VERIFIED", "recommendation_inputs"]) assert.match(registry, new RegExp(label));
  for (const label of ["模型版本", "資料異動紀錄"]) assert.match(trust, new RegExp(label));
});
