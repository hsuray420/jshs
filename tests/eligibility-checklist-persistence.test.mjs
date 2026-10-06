import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/eligibility-topic-workspace.tsx", import.meta.url), "utf8");

test("eligibility checklist persists to localStorage per topic and district", () => {
  assert.match(source, /localStorage\.getItem/);
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /checklistKey\(topic, district\)/);
  assert.doesNotMatch(source, /useState<boolean\[\]>/);
});

test("eligibility checklist copy is honest about local-only storage and failures", () => {
  assert.match(source, /本機瀏覽器/);
  assert.match(source, /無法儲存勾選狀態/);
});
