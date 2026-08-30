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

test("the desktop header uses the six task-first links and a simple login action", async () => {
  const header = await source("components/site-header.tsx");
  assert.match(header, /const primaryNavigation/);
  assert.match(header, /找學校/);
  assert.match(header, /算成績/);
  assert.match(header, /我的志願/);
  assert.match(header, /升學指南/);
  assert.match(header, /官方資訊/);
  assert.match(header, /資料與信任/);
  assert.match(header, />登入</);
});

test("the homepage starts with a compact education hero and four fixed-colour task cards", async () => {
  const home = await source("app/page.tsx");
  assert.match(home, /jshs-home-hero/);
  assert.match(home, /找到你的方向/);
  assert.match(home, /tone: "school"/);
  assert.match(home, /tone: "score"/);
  assert.match(home, /tone: "planner"/);
  assert.match(home, /tone: "guide"/);
  assert.match(home, /jshs-home-task-card is-\$\{tone\}/);
});
