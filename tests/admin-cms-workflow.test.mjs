import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin navigation keeps existing operational destinations and adds the frontend editor", async () => {
  const shell = await source("components/admin-shell.tsx");
  for (const route of [
    "/admin/editor", "/admin/schools", "/admin/media", "/admin/content", "/admin/data",
    "/admin/data/reports", "/admin/data/reviews", "/admin/data/csv", "/admin/data/operations",
    "/admin/notifications", "/admin/payments", "/admin/code", "/admin/deployments",
    "/admin/audit", "/admin/users", "/admin/settings", "/admin/system", "/admin/system/resources",
  ]) assert.ok(shell.includes(route), `Admin navigation should keep ${route}`);
});

test("school CMS mirror composes the real frontend and exposes a keyboard-dismissible editor dialog", async () => {
  const mirror = await source("components/admin-school-frontend-mirror.tsx");
  assert.match(mirror, /<SchoolDetailClient code=\{props\.schoolCode\} previewRaw=\{draft\} \/>/);
  assert.doesNotMatch(mirror, /<iframe\b/i);
  assert.match(mirror, /role="dialog" aria-modal="true"/);
  assert.match(mirror, /event\.key === "Escape"/);
  assert.match(mirror, /onDraftChange=\{updateDraft\}/);
  assert.match(mirror, /Admin Edit Mode/);
  assert.match(mirror, /previewMode/);
  assert.match(mirror, /admin-edit-affordance/);
});

test("admin destructive media actions use an in-app confirmation dialog", async () => {
  const review = await source("components/admin-school-media-review.tsx");
  assert.doesNotMatch(review, /window\.confirm|window\.alert/);
  assert.match(review, /role="dialog" aria-modal="true"/);
});

test("school drafts are not marked published until a matching GitHub deployment succeeds", async () => {
  const schoolApi = await source("app/api/admin/schools/[schoolCode]/route.ts");
  const deploymentApi = await source("app/api/admin/deployments/github/route.ts");
  assert.doesNotMatch(schoolApi, /markSchoolDataDraftPublished/);
  assert.match(deploymentApi, /deployment\.status === "success"/);
  assert.match(deploymentApi, /markSchoolDataDraftPublished/);
  assert.match(deploymentApi, /requireAdminRole\("editor"\)/);
});

test("school image intake saves ImageKit metadata as a draft before publication", async () => {
  const route = await source("app/api/admin/school-media/route.ts");
  const store = await source("db/school-media-store.ts");
  const migration = await source("db/migrations/community/0001_community.sql");
  assert.match(route, /saveSchoolMediaDraft/);
  assert.match(route, /if \(action === "publish-draft"\) return publishDraft/);
  assert.match(route, /requireAdminRole\(action === "publish-draft" \|\| action === "remove" \? "administrator" : "editor"\)/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS school_media_drafts/);
  assert.match(store, /idx_school_media_drafts_one_pending_per_school/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS school_media_drafts/);
  assert.doesNotMatch(route, /file_blob\s*:/i);
});

test("missing-image workspace stages multiple school-mapped files before explicit draft save", async () => {
  const batch = await source("components/admin-missing-school-media-batch.tsx");
  assert.match(batch, /multiple/);
  assert.match(batch, /逐張確認學校配對/);
  assert.match(batch, /role="dialog" aria-modal="true"/);
  assert.match(batch, /確認保存 \{items\.length\} 筆草稿/);
  assert.match(batch, /set\("action", "save-draft"\)/);
  assert.match(batch, /admin-missing-drop-target/);
  assert.match(batch, /addFileForSchool/);
  assert.match(batch, /已準備 \{items\.length\} 間學校/);
});
