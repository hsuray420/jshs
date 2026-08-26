import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("每個選單功能都有獨立路徑，不使用 query 或 hash 代替頁面", async () => {
  const catalog = JSON.parse(await readFile(new URL("../content/site-map.json", import.meta.url), "utf8"));
  const hrefs = [];
  const walk = (items) => items.forEach((item) => { hrefs.push(item.href); if (item.children) walk(item.children); });
  catalog.menuGroups.forEach((group) => walk(group.items));
  assert.equal(hrefs.some((href) => href.includes("?") || href.includes("#")), false);
  for (const route of ["app/schools/[district]/page.tsx", "app/eligibility/[topic]/page.tsx", "app/knowledge/[topic]/page.tsx", "app/account/[feature]/page.tsx", "app/notifications/[feature]/page.tsx", "app/planner/[feature]/page.tsx"]) await access(new URL(`../${route}`, import.meta.url));
});
