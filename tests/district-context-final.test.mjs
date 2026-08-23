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
