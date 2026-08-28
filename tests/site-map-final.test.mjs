import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const finalGroups = ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任"];

test("final sitemap defines the seven user-facing navigation groups", async () => {
  const source = await read("lib/site-map-116.ts");
  assert.deepEqual([...source.matchAll(/label: "([^"]+)"/g)].slice(0, 7).map((match) => match[1]), finalGroups);

  const labels = source.match(/全國校科查詢|歷年錄取參考|校園開放日|資料更新狀態|試算與分析方法/g) || [];
  for (const label of [
    "全國校科查詢", "歷年錄取參考", "校園開放日", "資料更新狀態", "試算與分析方法",
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
  for (const source of [schedule, eligibility]) assert.match(source, /DistrictGate/);
  assert.doesNotMatch(knowledge, /DistrictGate/);
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

test("資料錯誤回報使用指定的 Google 表單", async () => {
  const reportPage = await read("app/trust/[slug]/page.tsx");
  assert.match(reportPage, /https:\/\/forms\.gle\/qd6GuS1EFXkzjppz7/);
  assert.match(reportPage, /填寫錯誤回報表單/);
});

test("long-form trust policies live in editable text files", async () => {
  const detailRoute = await read("app/trust/[slug]/page.tsx");
  for (const file of ["privacy", "terms", "support"]) {
    const text = await read(`content/trust/${file}.txt`);
    assert.ok(text.trim().length > 200, `${file} policy should be editable as long-form text`);
    assert.match(detailRoute, new RegExp(`content/trust/${file}\\.txt\\?raw`));
  }
  assert.match(detailRoute, /text-slate-950/);
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
