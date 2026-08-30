import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const primaryLabels = ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任", "其他"];

test("one content catalog defines all eight primary destinations including schedule and other", async () => {
  const catalog = JSON.parse(await source("content/site-map.json"));
  assert.deepEqual(catalog.primaryNavigation.map(({ label }) => label), primaryLabels);
  assert.equal(catalog.menuGroups.at(-1)?.label, "其他");
  assert.deepEqual(catalog.menuGroups.at(-1)?.items.map(({ label }) => label), ["平台", "法律與使用"]);
});

test("header uses the common navigation config and one full brand component", async () => {
  const header = await source("components/site-header.tsx");
  assert.match(header, /from "@\/lib\/site-map"/);
  assert.doesNotMatch(header, /const primaryNavigation = \[/);
  assert.match(header, /全國國中升學資訊網/);
  assert.match(header, /SiteIcon name="school"/);
  assert.match(header, /mobileNavigation\.map/);
  assert.match(header, /mobileNavigation = primaryNavigation/);
});

test("homepage offers a next-step guide and compact colour-coded quick actions", async () => {
  const [home, guide] = await Promise.all([source("app/page.tsx"), source("components/home-next-step.tsx")]);
  assert.match(home, /HomeNextStep/);
  assert.match(home, /HomeQuickActions/);
  assert.doesNotMatch(home, /jshs-home-task-grid/);
  assert.match(guide, /第一次來？不知道從哪裡開始/);
  assert.match(guide, /幫我確認下一步/);
  assert.match(guide, /學生目前階段/);
  assert.match(guide, /就學區是否已知/);
  assert.match(guide, /現在最想處理的問題/);
  assert.match(guide, /我知道我要做什麼/);
  assert.match(guide, /jshs-home-quick-action/);
});

test("guide has six canonical sections and directs detailed score rules to the calculator", async () => {
  const [catalog, page, workspace] = await Promise.all([source("content/site-map.json"), source("app/knowledge/page.tsx"), source("components/knowledge-topic-workspace.tsx")]);
  for (const label of ["升學入門", "志願與積分", "特殊入學與資格", "升學百科", "生涯探索", "升學動態"]) assert.match(catalog, new RegExp(label));
  assert.match(page, /升學動態/);
  assert.match(workspace, /"\/tools\/rules"/);
});
