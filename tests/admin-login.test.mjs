import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("admin login uses the current public design system and LINE entry point", async () => {
  const source = await readFile(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8");
  assert.match(source, /SiteHeader/);
  assert.match(source, /jshs-page-shell/);
  assert.match(source, /jshs-surface-card/);
  assert.match(source, /\/api\/admin\/line\/start/);
  assert.match(source, /使用 LINE 登入/);
  assert.match(source, /LINE 管理員/);
});
