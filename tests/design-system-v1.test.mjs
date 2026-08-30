import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("JSHS Design System V1 defines the requested restrained palette and 1200px content frame", async () => {
  const tokens = await source("public/design-tokens.css");
  assert.match(tokens, /--brand-primary: #1A73E8/);
  assert.match(tokens, /--success: #34A853/);
  assert.match(tokens, /--planner: #F9AB00/);
  assert.match(tokens, /--guide: #8B5CF6/);
  assert.match(tokens, /--bg-page: #F7F9FC/);
  assert.match(tokens, /--content-max: 1200px/);
  assert.match(tokens, /--radius-md: 12px/);
});

test("the desktop header uses the shared eight-item navigation and full brand", async () => {
  const [header, catalog] = await Promise.all([source("components/site-header.tsx"), source("content/site-map.json")]);
  assert.match(header, /mobileNavigation = primaryNavigation/);
  assert.match(header, /mobileNavigation\.map/);
  assert.match(header, /全國國中升學資訊網/);
  assert.match(header, /<SiteIcon name="school"/);
  assert.deepEqual(JSON.parse(catalog).primaryNavigation.map(({ label }) => label), ["找學校", "算成績", "我的志願", "升學日程", "官方資訊", "升學指南", "資料與信任", "其他"]);
  assert.match(header, />登入</);
});

test("the homepage starts with a full-bleed hero and compact fixed-colour actions", async () => {
  const [home, nextStep, css] = await Promise.all([source("app/page.tsx"), source("components/home-next-step.tsx"), source("app/globals.css")]);
  assert.match(home, /jshs-home-hero/);
  assert.match(home, /先確認下一步/);
  assert.match(home, /HomeNextStep/);
  assert.match(home, /HomeQuickActions/);
  assert.match(nextStep, /第一次來？不知道從哪裡開始/);
  assert.match(nextStep, /我知道我要做什麼/);
  assert.match(nextStep, /jshs-home-quick-action/);
  assert.doesNotMatch(home, /jshs-home-task-card/);
  assert.match(home, /jshs-home-hero-v2\.png/);
  assert.match(css, /jshs-home-hero-background/);
  assert.match(css, /object-fit: cover/);
});

test("each core function page has a matching coloured feature band", async () => {
  const pages = await Promise.all(["app/schools/page.tsx", "app/tools/page.tsx", "app/planner/page.tsx", "app/schedule/page.tsx"].map(source));
  for (const [page, tone] of pages.map((page, index) => [page, ["school", "score", "planner", "guide"][index]])) {
    assert.match(page, new RegExp(`FeaturePageBand tone="${tone}"`));
  }
  const css = await source("app/globals.css");
  assert.match(css, /\.jshs-feature-page-band/);
  for (const tone of ["school", "score", "planner", "guide"]) assert.match(css, new RegExp(`feature-page-band\\.is-${tone}`));
});
