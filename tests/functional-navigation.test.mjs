import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("task hubs route users back into the existing working admission system", async () => {
  const [tools, schools, planner, home] = await Promise.all([
    readSource("app/tools/page.tsx"),
    readSource("app/schools/page.tsx"),
    readSource("app/planner/page.tsx"),
    readSource("app/page.tsx"),
  ]);

  assert.match(tools, /\/districts\?target=calculator/);
  assert.match(tools, /\/districts\?target=analysis/);
  assert.match(schools, /\/districts\?target=schools/);
  assert.match(schools, /\/districts\?target=analysis/);
  assert.match(planner, /\/districts\?target=analysis/);
  assert.match(home, /\/districts\?target=schools/);
  assert.match(home, /\/districts\?target=calculator/);
  assert.match(home, /\/districts\?target=analysis/);
});

test("district selection preserves the requested tool and falls back to school search", async () => {
  const districts = await readSource("app/districts/page.tsx");

  assert.match(districts, /searchParams/);
  assert.match(districts, /target\?: string/);
  assert.match(districts, /target === "calculator" && !district\.calculator/);
  assert.match(districts, /target === "analysis" && !district\.analysis/);
  assert.match(districts, /\/it_hs\/it_hs\.html\?district=\$\{code\}#\$\{resolvedTarget\}/);
});

test("the original system still owns every functional destination", async () => {
  const [guide, script] = await Promise.all([
    readSource("public/it_hs/guide.htm"),
    readSource("public/it_hs/guide.js"),
  ]);

  for (const target of ["schools", "calculator", "analysis"]) {
    assert.match(guide, new RegExp(`data-page-section=\\"${target}\\"`));
  }
  assert.match(script, /const initialPage = window\.location\.hash\.replace/);
  assert.match(script, /showPage\(initialPage\)/);
});
