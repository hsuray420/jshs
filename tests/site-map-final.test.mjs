import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const finalGroups = ["查學校", "算成績", "時間日程", "我的志願", "特殊資格", "升學知識", "更多"];

test("final sitemap defines the seven user-facing navigation groups", async () => {
  const catalog = JSON.parse(await read("content/site-map.json"));
  assert.deepEqual(catalog.menuGroups.map(({ label }) => label), finalGroups);

  const labels = catalog.menuGroups.flatMap(({ items }) => collectLabels(items));
  for (const label of [
    "全國校科查詢", "歷年錄取成績查詢", "學長姐分享", "學校地圖", "費用試算", "通勤比較", "群科／十五群科介紹", "開始試算", "積分／序位換算說明",
    "全年倒數計時", "重要時程總覽", "我的候選校科清單", "排序與健檢", "版本紀錄",
    "資格自我檢測", "特色招生／特色班", "3 分鐘看懂免試入學", "名詞小百科", "AI 問答小幫手",
    "會員登入", "LINE 官方帳號整合", "資料來源與更新紀錄", "資料錯誤回報", "隱私權", "支持／合作",
  ]) assert.ok(labels.includes(label), `missing final sitemap item: ${label}`);
});

test("final sitemap exposes real hubs and all district-gated hubs use the shared gate", async () => {
  for (const route of ["app/schools/page.tsx", "app/tools/page.tsx", "app/planner/page.tsx", "app/schedule/page.tsx", "app/eligibility/page.tsx", "app/knowledge/page.tsx"]) {
    await access(new URL(route, root));
  }

  const [schools, tools, planner, schedule, eligibility, knowledge, gate] = await Promise.all([
    read("app/schools/page.tsx"), read("app/tools/page.tsx"), read("app/planner/page.tsx"),
    read("app/schedule/page.tsx"), read("app/eligibility/page.tsx"), read("app/knowledge/page.tsx"),
    read("components/district-gate.tsx"),
  ]);

  for (const source of [schools, tools, planner]) assert.match(source, /DistrictGate/);
  for (const source of [schedule, eligibility, knowledge]) assert.doesNotMatch(source, /DistrictGate/);
  assert.match(gate, /請選擇就學區/);
  assert.match(gate, /jshs_district/);
  assert.match(gate, /jshs-district-changed/);
});

test("trust and about menu items each have independent detail pages", async () => {
  const catalog = JSON.parse(await read("content/site-map.json"));
  const more = catalog.menuGroups.find(({ label }) => label === "更多");
  const expected = new Map([
    ["資料來源與更新紀錄", "/trust/sources"],
    ["評分與回饋", "/trust/feedback"],
    ["使用人數展示", "/trust/community"],
    ["資料錯誤回報", "/trust/report"],
    ["社群投票互動", "/trust/voting"],
    ["在校生真實心得", "/trust/stories"],
    ["隱私權", "/trust/privacy"],
    ["服務條款", "/trust/terms"],
    ["支持／合作", "/trust/support"],
  ]);
  const children = more.items.flatMap(({ children = [] }) => children);

  for (const [label, href] of expected) {
    assert.equal(children.find((item) => item.label === label)?.href, href, `${label} should have its own URL`);
  }

  const detailRoute = await read("app/trust/[slug]/page.tsx");
  assert.match(detailRoute, /generateStaticParams/);
  for (const href of expected.values()) assert.match(detailRoute, new RegExp(href.split("/").at(-1)));
});

test("long-form trust policies live in editable text files", async () => {
  const detailRoute = await read("app/trust/[slug]/page.tsx");
  for (const file of ["privacy", "support"]) {
    const text = await read(`content/trust/${file}.txt`);
    assert.ok(text.trim().length > 200, `${file} policy should be editable as long-form text`);
    assert.match(detailRoute, new RegExp(`content/trust/${file}\\.txt\\?raw`));
  }
  const terms = await read("全國國中升學資訊網服務條款");
  assert.ok(terms.trim().length > 1000, "existing terms document should remain the source of truth");
  assert.match(detailRoute, /全國國中升學資訊網服務條款\?raw/);
});

test("shared header contains the final fixed context controls", async () => {
  const header = await read("components/site-header.tsx");
  for (const label of finalGroups) assert.match(header, new RegExp(label));
  for (const label of ["通知", "帳號", "目前：", "全站搜尋"]) assert.match(header, new RegExp(label));
  assert.match(header, /useSyncExternalStore/);
});

function collectLabels(items) {
  return items.flatMap(({ label, children = [] }) => [label, ...collectLabels(children)]);
}
