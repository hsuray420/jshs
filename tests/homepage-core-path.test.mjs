import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage exposes canonical task routes and progress context", async () => {
  const home = await readSource("app/page.tsx");

  assert.match(home, /href="\/tools"/);
  assert.match(home, /href="\/schools"/);
  assert.match(home, /href="\/planner"/);
  assert.match(home, /jshs-task-icon/);
  assert.match(home, /116 學年度升學 Dashboard/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm#(?:calculator|analysis|home)/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm\?district=/);
  assert.doesNotMatch(home, /HomeDistrictPicker|districts-title/);
});
