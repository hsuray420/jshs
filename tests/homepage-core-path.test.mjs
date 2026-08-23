import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage exposes canonical task routes and progress context", async () => {
  const home = await readSource("app/page.tsx");

  assert.match(home, /href="\/news#latest"/);
  assert.match(home, /href="\/schools\?district=ct"/);
  assert.match(home, /href="\/tools\?district=ct"/);
  assert.match(home, /href="\/planner"/);
  assert.match(home, /<HomeProgress/);
  assert.match(home, /你的使用情境/);
  assert.match(home, /更新日/);
  assert.match(home, /jshs-task-icon/);
  assert.match(home, /tone="green"/);
  assert.match(home, /jshs-info-group-title/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm#(?:calculator|analysis|home)/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm\?district=/);
});
