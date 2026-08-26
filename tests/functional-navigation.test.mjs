import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("task hubs route users into the new first-party admission surfaces", async () => {
  const [tools, schools, planner, home] = await Promise.all([
    readSource("app/tools/page.tsx"),
    readSource("app/schools/page.tsx"),
    readSource("app/planner/page.tsx"),
    readSource("app/page.tsx"),
  ]);

  assert.match(tools, /AdmissionCalculator/);
  assert.match(schools, /SchoolExplorer/);
  assert.match(planner, /PlannerWorkspace/);
  assert.match(home, /href="\/tools"/);
  assert.match(home, /href="\/knowledge"/);
  assert.match(home, /href="\/knowledge\/fit-quiz"/);
  assert.match(home, /HomeProgress/);
  assert.doesNotMatch(home, /districts-title|HomeDistrictPicker/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm#(?:calculator|analysis|home)/);
  assert.doesNotMatch(home, /\/it_hs\/guide\.htm\?district=/);

  for (const source of [tools, schools, planner, home]) {
    assert.doesNotMatch(source, /\/it_hs\/it_hs\.html/);
    assert.doesNotMatch(source, /原有功能|原有規劃|原有比較/);
  }
});

test("first-party actions publish progress for the homepage summary", async () => {
  const [schools, calculator, progress] = await Promise.all([
    readSource("components/school-explorer.tsx"),
    readSource("components/admission-calculator.tsx"),
    readSource("components/home-progress.tsx"),
  ]);

  assert.match(schools, /markProgress\("district"/);
  assert.match(schools, /markProgress\("schoolSearch"/);
  assert.match(schools, /markProgress\("planner"/);
  assert.match(calculator, /markProgress\("district"/);
  assert.match(calculator, /markProgress\("calculator"/);
  assert.match(progress, /jshs-progress/);
  assert.match(progress, /選擇就學區|查找校科|完成試算|建立規劃/);
});

test("district selection preserves the requested tool on first-party routes", async () => {
  const districts = await readSource("app/districts/page.tsx");

  assert.match(districts, /searchParams/);
  assert.match(districts, /target\?: string/);
  assert.match(districts, /target === "calculator" && !district\.calculator/);
  assert.match(districts, /target === "analysis" && !district\.analysis/);
  assert.match(districts, /destinationFor\(resolvedTarget, code\)/);
  assert.match(districts, /`\/schools\?district=\$\{code\}`/);
  assert.match(districts, /`\/tools\?district=\$\{code\}`/);
  assert.match(districts, /`\/planner\?district=\$\{code\}`/);
  assert.doesNotMatch(districts, /\/it_hs\/it_hs\.html/);
});

test("new school, calculator, and planner clients own the functional destinations", async () => {
  const [schools, calculator, planner] = await Promise.all([
    readSource("components/school-explorer.tsx"),
    readSource("components/admission-calculator.tsx"),
    readSource("components/planner-workspace.tsx"),
  ]);

  assert.match(schools, /SchoolDirectoryRecord/);
  assert.match(schools, /\/api\/planner/);
  assert.match(calculator, /\/api\/admission\/calculate/);
  assert.match(planner, /\/api\/planner/);
});
