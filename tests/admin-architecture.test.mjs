import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("admin IA exposes independent module routes and a shared shell", async () => {
  const routes = ["page", "data/page", "data/csv/page", "data/reviews/page", "content/page", "notifications/page", "media/page", "payments/page", "deployments/page", "system/page", "settings/page"];
  for (const route of routes) assert.match(await read(`app/admin/${route}.tsx`), /requireAdmin/);
  assert.match(await read("app/admin/layout.tsx"), /AdminShell/);
  assert.match(await read("components/admin-shell.tsx"), /admin-sidebar/);
  assert.doesNotMatch(await read("app/admin/page.tsx"), /<form|listImportantDates|listLineUsers/);
});

test("payment UI never renders payment secrets to the client", async () => {
  const page = await read("app/admin/payments/page.tsx");
  assert.match(page, /HashKey/);
  assert.match(page, /僅由環境變數管理/);
  assert.doesNotMatch(page, /settings\.get\("(?:hashkey|hashiv|ecpay_hash|ecpay_iv)"\)/i);
});

test("notification developer metadata is behind an advanced disclosure", async () => {
  const page = await read("app/admin/notifications/page.tsx");
  assert.match(page, /志願完成通知/);
  assert.match(page, /進階設定/);
  assert.match(page, /<details/);
});
