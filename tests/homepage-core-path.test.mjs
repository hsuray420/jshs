import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage exposes canonical task routes and the AI workspace", async () => {
  const [home, ai, scoreRegistry] = await Promise.all([readSource("app/page.tsx"), readSource("components/home-ai-panel.tsx"), readSource("content/score-features.json")]);

  assert.match(scoreRegistry, /"href": "\/scores\/mock"/);
  assert.match(home, /jshs-v2-home/);
  assert.match(home, /\/schools/);
  assert.match(home, /\/planner/);
  assert.match(home, /HomeAiPanel/);
  assert.match(ai, /\/api\/assistant/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm#(?:calculator|analysis|home)/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm\?district=/);
  assert.doesNotMatch(home, /HomeDistrictPicker|districts-title/);
});
