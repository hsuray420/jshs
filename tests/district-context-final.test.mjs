import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("district context normalizes missing values and provides a safe local-storage contract", async () => {
  const source = await readFile(new URL("../lib/district-context.ts", import.meta.url), "utf8");
  assert.match(source, /DISTRICT_STORAGE_KEY = "jshs_district"/);
  for (const functionName of ["normalizeDistrict", "getDistrictLabel", "readStoredDistrict", "writeStoredDistrict", "subscribeToDistrict"]) {
    assert.match(source, new RegExp(`function ${functionName}`));
  }
  assert.match(source, /return district \? districts\[district\]\.label : "選擇就學區"/);
});

test("progress district selection uses the shared district change contract", async () => {
  const source = await readFile(new URL("../lib/progress.ts", import.meta.url), "utf8");
  assert.match(source, /writeStoredDistrict/);
  assert.doesNotMatch(source, /localStorage\.setItem\("jshs_district", value\)/);
});

test("district-aware clients restore stored district instead of resetting it to the default", async () => {
  const [calculator, explorer] = await Promise.all([
    readFile(new URL("../components/admission-calculator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/school-explorer.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(calculator, /readStoredDistrict/);
  assert.match(explorer, /initialFilters/);
  assert.doesNotMatch(explorer, /readStoredDistrict/); // National discovery must not silently hide schools outside a saved district.
  assert.doesNotMatch(explorer, /filters\.district === "all" \? "ct" : filters\.district/);
});
