import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("popular-schools module defines default region maps and D1 integration", async () => {
  const [lib, data] = await Promise.all([
    read("lib/popular-schools.ts"),
    read("lib/popular-schools-data.ts"),
  ]);
  assert.match(data, /export const DEFAULT_POPULAR_SCHOOLS/);
  assert.match(data, /tp:/);
  assert.match(data, /ct:/);
  assert.match(data, /kaohsiung:/);
  assert.match(data, /all:/);
  assert.match(lib, /export \{ DEFAULT_POPULAR_SCHOOLS/);
  assert.match(lib, /export async function getPopularSchoolsMap/);
  assert.match(lib, /export async function savePopularSchoolsMap/);
});

test("school explorer uses dynamic popular schools and updated wording", async () => {
  const explorer = await read("components/school-explorer.tsx");
  assert.match(explorer, /熱門學校/);
  assert.doesNotMatch(explorer, /curatedPopularCodes\s*=\s*\["060322"/);
  assert.match(explorer, /\/api\/schools\/popular/);
});

test("admin backend provides popular schools editor and navigation entries", async () => {
  const [shell, adminPage, editor, apiAdmin, apiPublic] = await Promise.all([
    read("components/admin-shell.tsx"),
    read("app/admin/schools/popular/page.tsx"),
    read("components/admin-popular-schools-editor.tsx"),
    read("app/api/admin/popular-schools/route.ts"),
    read("app/api/schools/popular/route.ts"),
  ]);

  assert.match(shell, /\/admin\/schools\/popular/);
  assert.match(shell, /熱門學校推薦/);
  assert.match(adminPage, /AdminPopularSchoolsEditor/);
  assert.match(editor, /熱門學校清單/);
  assert.match(editor, /儲存/);
  assert.match(apiAdmin, /requireAdmin/);
  assert.match(apiAdmin, /savePopularSchoolsMap/);
  assert.match(apiPublic, /getPopularSchoolsMap/);
});
