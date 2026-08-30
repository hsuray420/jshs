import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage exposes canonical compact task routes and progress context", async () => {
  const [home, quickActions] = await Promise.all([readSource("app/page.tsx"), readSource("components/home-next-step.tsx")]);

  assert.match(quickActions, /href: "\/tools"/);
  assert.match(quickActions, /href: "\/schools"/);
  assert.match(quickActions, /href: "\/planner"/);
  assert.match(home, /HomeNextStep/);
  assert.match(home, /HomeQuickActions/);
  assert.doesNotMatch(home, /jshs-home-task-card/);
  assert.match(home, /學年度升學規劃/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm#(?:calculator|analysis|home)/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm\?district=/);
  assert.doesNotMatch(home, /HomeDistrictPicker|districts-title/);
});
