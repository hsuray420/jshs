import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const primaryLabels = ["找學校", "模擬考", "成績分析", "我的志願", "日程", "升學指南", "資料與信任"];

test("one content catalog defines the seven primary destinations", async () => {
  const catalog = JSON.parse(await source("content/site-map.json"));
  assert.deepEqual(catalog.primaryNavigation.map(({ label }) => label), primaryLabels);
  assert.equal(catalog.menuGroups.at(-1)?.label, "資料與信任");
  assert.ok(catalog.menuGroups.at(-1)?.items.some(({ label }) => label === "平台"));
});

test("header uses the common navigation config and one full brand component", async () => {
  const header = await source("components/site-header.tsx");
  assert.match(header, /from "@\/lib\/site-map"/);
  assert.doesNotMatch(header, /const primaryNavigation = \[/);
  assert.match(header, /SITE_NAME/);
  assert.match(header, /SiteIcon name="school"/);
  assert.match(header, /mobileNavigation\.map/);
  assert.match(header, /mobileNavigation = primaryNavigation/);
});

test("homepage follows the approved visual system while navigation remains data-driven", async () => {
  const [home, header, catalog] = await Promise.all([source("app/page.tsx"), source("components/site-header.tsx"), source("content/site-map.json")]);
  assert.match(home, /jshs-v2-home/);
  assert.match(home, /發現更大的/);
  assert.match(header, /mobileNavigation = primaryNavigation/);
  for (const label of ["找學校", "模擬考", "成績分析", "我的志願", "日程", "升學指南", "資料與信任"]) assert.match(catalog, new RegExp(label));
});

test("guide has six canonical sections and directs detailed score rules to the calculator", async () => {
  const [catalog, page, workspace] = await Promise.all([source("content/site-map.json"), source("app/knowledge/page.tsx"), source("components/knowledge-topic-workspace.tsx")]);
  for (const label of ["升學入門", "志願與積分", "特殊入學與資格", "升學百科", "生涯探索", "升學動態"]) assert.match(catalog, new RegExp(label));
  assert.match(page, /升學動態/);
  assert.match(workspace, /"\/tools\/rules"/);
});
