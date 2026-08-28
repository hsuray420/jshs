import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("content center stores drafts, published state, and revisions in D1", async () => {
  const store = await read("db/content-store.ts");
  assert.match(store, /content_entries/);
  assert.match(store, /content_revisions/);
  assert.match(store, /draft/);
  assert.match(store, /published/);
  assert.match(store, /publishContentEntry/);
});

test("admin content editor is protected and supports preview plus publish", async () => {
  const page = await read("app/admin/content/page.tsx");
  const route = await read("app/api/admin/content/route.ts");
  assert.match(page, /草稿|發布/);
  assert.match(page, /預覽/);
  assert.match(route, /requireAdmin/);
  assert.match(route, /publishContentEntry/);
  assert.match(route, /content_type/);
});

test("knowledge and schedule follow the canonical information architecture", async () => {
  const knowledge = await read("app/knowledge/page.tsx");
  const scheduleApi = await read("app/api/schedule/route.ts");
  for (const label of ["升學入門", "志願與積分", "特殊入學與資格", "升學百科", "生涯探索"]) {
    assert.match(knowledge, new RegExp(label));
  }
  assert.doesNotMatch(knowledge, /KnowledgeHelper|更多|名詞小百科/);
  assert.match(scheduleApi, /listPublishedContent/);
  assert.match(scheduleApi, /schedule_task/);
});

test("public content cannot expose drafts or private editor fields", async () => {
  const store = await read("db/content-store.ts");
  const route = await read("app/api/site-content/route.ts");
  assert.match(store, /status = 'published'/);
  assert.match(route, /listPublishedContent/);
  assert.doesNotMatch(route, /content_revisions/);
});

test("content publishing supports Word-like text size and color plus GitHub sync", async () => {
  const page = await read("app/admin/content/page.tsx");
  const route = await read("app/api/admin/content/route.ts");
  const sync = await read("lib/github-sync.ts");
  assert.match(page, /font_size|字級/);
  assert.match(page, /text_color|文字顏色/);
  assert.match(route, /fontSize|color/);
  assert.match(route, /syncContentToGitHub/);
  assert.match(sync, /api\.github\.com/);
  assert.match(sync, /GITHUB_TOKEN/);
});

test("media administration remains first-party without becoming a public IA entry", async () => {
  const [admin, route, sync, workspace, manifest, sitemap] = await Promise.all([
    read("app/admin/page.tsx"),
    read("app/api/admin/media/route.ts"),
    read("lib/github-sync.ts"),
    read("components/knowledge-topic-workspace.tsx"),
    read("content/media-library.json"),
    read("content/site-map.json"),
  ]);
  assert.match(admin, /上傳 Podcast／影片/);
  assert.match(admin, /\/api\/admin\/media/);
  assert.match(route, /requireAdmin/);
  assert.match(route, /syncMediaToGitHub/);
  assert.match(sync, /content\/media-library\.json/);
  assert.match(sync, /mediaPath/);
  assert.doesNotMatch(workspace, /youtube\.com/);
  assert.doesNotMatch(sitemap, /Podcast|影片|影音/);
  assert.match(manifest, /"items"/);
});
