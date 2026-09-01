import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("AI privacy copy separates message processing from conversation storage", async () => {
  const [assistant, privacy, aiPage] = await Promise.all([
    read("components/ai-assistant.tsx"),
    read("content/trust/privacy.txt"),
    read("app/ai/page.tsx"),
  ]);
  assert.match(assistant, /訊息會送到服務端與 AI 系統產生回答/);
  assert.match(assistant, /訪客聊天紀錄留在本機 IndexedDB/);
  assert.match(assistant, /會員對話會同步到本站伺服器/);
  assert.match(privacy, /AI 小助手訊息與聊天紀錄/);
  assert.match(aiPage, /robots: \{ index: false, follow: true \}/);
  assert.doesNotMatch(assistant, /不會上傳雲端|訊息完全不會離開裝置/);
});

test("shared search registry powers header, search page, sitemap, and audits", async () => {
  const [header, searchPage, registry, sitemapScript, searchIndex, routeAudit, searchAudit] = await Promise.all([
    read("components/site-header.tsx"),
    read("app/search/page.tsx"),
    read("content/route-metadata.json"),
    read("scripts/generate-sitemap.mjs"),
    read("lib/search-index.ts"),
    read("scripts/audit-route-metadata.mjs"),
    read("scripts/audit-search.mjs"),
  ]);
  assert.match(header, /searchSite\(query, 12\)/);
  assert.match(searchPage, /searchSite\(query\)/);
  assert.match(registry, /"pathname": "\/tools\/rules"/);
  assert.match(sitemapScript, /routeMetadata\.routes/);
  assert.match(searchIndex, /normalizeSearchText/);
  assert.match(searchIndex, /synonyms/);
  assert.match(routeAudit, /noindex route cannot be in sitemap/);
  assert.match(searchAudit, /中投志願序/);
});

test("intro modal and floating AI affordances are mobile-accessible", async () => {
  const [modal, css] = await Promise.all([
    read("components/site-intro-modal.tsx"),
    read("app/globals.css"),
  ]);
  for (const marker of ["aria-modal=\"true\"", "role=\"dialog\"", "Escape", "event.key !== \"Tab\"", "lastFocusRef", "jshs-intro-modal-open"]) assert.match(modal, new RegExp(marker));
  for (const marker of ["jshs-intro-dialog", "safe-area-inset-bottom", "calc(84px + var(--safe-bottom))", "prefers-reduced-motion"]) assert.ok(css.includes(marker), `CSS should include ${marker}`);
  assert.doesNotMatch(modal, /資訊基本上正確|沒有任何盈利/);
});
