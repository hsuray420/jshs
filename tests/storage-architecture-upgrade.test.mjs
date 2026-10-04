import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("defines the three independent D1 schemas with stable member UUID ownership", async () => {
  const [core, learning, community, bindings, config] = await Promise.all([
    read("db/migrations/core/0001_core.sql"),
    read("db/migrations/learning/0001_learning.sql"),
    read("db/migrations/community/0001_community.sql"),
    read("db/bindings.ts"),
    read("wrangler.jsonc"),
  ]);
  for (const table of ["users", "user_identities", "line_friendships", "account_settings", "favorites"]) assert.match(core, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  for (const table of ["member_mock_exams", "member_score_history", "exam_sessions", "exam_results", "subject_scores", "weakness_profiles", "analysis_snapshots", "member_planners", "member_ai_conversations"]) assert.match(learning, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  for (const table of ["school_reviews", "data_reports", "anonymous_submissions", "community_votes", "school_data_audit", "admin_audit_logs"]) assert.match(community, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(bindings, /CORE_DB/);
  assert.match(bindings, /LEARNING_DB/);
  assert.match(bindings, /COMMUNITY_DB/);
  assert.doesNotMatch(bindings, /runtime\.DB|getLegacyDatabase|legacy/);
  assert.match(config, /"binding": "CORE_DB"/);
  assert.match(config, /"binding": "LEARNING_DB"/);
  assert.match(config, /"binding": "COMMUNITY_DB"/);
  assert.doesNotMatch(config, /"binding": "DB"|jshs-db/);
});

test("routes community stores independently and keeps guest submissions identity-free", async () => {
  const [reviews, reports, votes, communitySchema] = await Promise.all([
    read("db/school-review-store.ts"),
    read("db/data-report-store.ts"),
    read("db/community-vote-store.ts"),
    read("db/migrations/community/0001_community.sql"),
  ]);
  for (const store of [reviews, reports, votes]) assert.match(store, /getCommunityDatabase/);
  assert.match(communitySchema, /anonymous_submissions/);
  assert.doesNotMatch(communitySchema.split("CREATE TABLE IF NOT EXISTS anonymous_submissions")[1].split(";")[0], /user_id|line_user_id|email|phone/i);
});

test("keeps member data tied to the signed internal identity and offers explicit guest import", async () => {
  const [identity, memberAuth, importRoute, account, mockWorkspace] = await Promise.all([
    read("db/member-identity-store.ts"),
    read("lib/member-auth.ts"),
    read("app/api/member/import/route.ts"),
    read("components/account-center.tsx"),
    read("components/mock-exam-workspace.tsx"),
  ]);
  assert.match(identity, /provider_user_id = \?/);
  assert.match(memberAuth, /findJshsUserIdForLine/);
  assert.match(importRoute, /getMemberUserId\(member\)/);
  assert.match(importRoute, /hasMemberScoreSnapshot/);
  assert.match(importRoute, /hasMockExam/);
  assert.match(importRoute, /listPlannerItems/);
  assert.match(importRoute, /listFavorites/);
  assert.match(importRoute, /import_readback_failed/);
  assert.match(account, /這台裝置有未同步的本機紀錄/);
  assert.match(account, /只有按下「匯入」才會送至伺服器驗證/);
  assert.match(account, /刪除已匯入的本機副本/);
  const memberLoadEffect = mockWorkspace.split("useEffect")[1]?.split("}, [isMember])")[0] || "";
  assert.doesNotMatch(memberLoadEffect, /method: "POST"/);
});

test("routes all new images to ImageKit and removes D1 image BLOB fallback", async () => {
  const [imagekit, route, editor, adminStore, uploadRoute, readRoute, smokeRoute] = await Promise.all([
    read("lib/imagekit-server.ts"),
    read("app/api/admin/school-media/route.ts"),
    read("components/admin-school-media-editor.tsx"),
    read("db/admin-store.ts"),
    read("app/api/admin/files/route.ts"),
    read("app/api/files/[id]/route.ts"),
    read("app/api/admin/system/imagekit-smoke/route.ts"),
  ]);
  assert.match(imagekit, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(imagekit, /checkImageKitHealth/);
  assert.match(route, /school_image_not_configured/);
  assert.doesNotMatch(route, /createAdminFile/);
  assert.match(editor, /圖片服務尚未設定/);
  assert.match(editor, /disabled={!imageKitConfigured}/);
  assert.match(adminStore, /image_file_requires_imagekit_without_d1_blob/);
  assert.match(adminStore, /file_blob/);
  assert.match(uploadRoute, /uploadAdminImageToImageKit/);
  assert.match(uploadRoute, /storage_provider: external \? "imagekit" : "d1"/);
  assert.match(readRoute, /Response\.redirect\(file\.external_url, 302\)/);
  assert.match(smokeRoute, /requireAdminRole\("editor"\)/);
  assert.match(smokeRoute, /assertSameOrigin/);
  assert.match(smokeRoute, /runImageKitStorageSmokeTest/);
  assert.match(await read("app/api/school-media/route.ts"), /Response\.redirect\(override\.image_url, 302\)/);
  assert.doesNotMatch(await read("app/api/school-media/route.ts"), /getAdminFileBlob|fileBlobToBytes/);
});

test("keeps guest usage out of D1 and removes webhook-created LINE identities", async () => {
  const [quota, assistant, webhook, login, migrationDocs, resources] = await Promise.all([
    read("lib/assistant-quota.ts"),
    read("app/api/assistant/route.ts"),
    read("app/api/line/webhook/route.ts"),
    read("app/api/line/login/callback/route.ts"),
    read("scripts/storage-migration/README.md"),
    read("app/admin/system/resources/page.tsx"),
  ]);
  assert.doesNotMatch(quota, /getD1|prepare\(|CREATE TABLE|assistant_guest_usage/);
  assert.match(quota, /crypto\.subtle\.verify/);
  assert.match(assistant, /set-cookie/);
  assert.doesNotMatch(webhook, /upsertLineUser|ensureJshsMemberForLine/);
  assert.match(login, /ensureJshsMemberForLine/);
  assert.match(migrationDocs, /Do not run `bash scripts\/storage-migration\/run\.sh`/);
  assert.match(resources, /SELECT 1/);
});

test("removes Supabase as a runtime service and avoids fabricated resource health", async () => {
  const [resourceLib, page, schemaFiles, linkList] = await Promise.all([
    read("lib/system-resources.ts"),
    read("app/admin/system/resources/page.tsx"),
    read("db/migrations/core/0001_core.sql"),
    read("lib/system-resources.ts"),
  ]);
  assert.doesNotMatch(resourceLib + page + linkList, /SUPABASE|Supabase/);
  assert.match(resourceLib, /PRAGMA page_count/);
  assert.match(resourceLib, /SELECT 1 AS connected/);
  assert.match(page, /Files API 實際探測/);
  assert.match(page, /最近一次好友驗證記錄/);
  assert.match(schemaFiles, /CREATE TABLE IF NOT EXISTS users/);
  await assert.rejects(read("lib/supabase-server.ts"));
  await assert.rejects(read("docs/supabase-schema.sql"));
});

test("keeps ImageKit signing credentials on the server", async () => {
  const [imagekit, route, mediaRoute] = await Promise.all([
    read("lib/imagekit-server.ts"),
    read("app/api/admin/imagekit/auth/route.ts"),
    read("app/api/admin/school-media/route.ts"),
  ]);
  assert.match(imagekit, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(imagekit, /createImageKitUploadSignature/);
  assert.match(route, /requireAdminRole/);
  assert.match(route, /assertSameOrigin/);
  assert.doesNotMatch(route, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(mediaRoute, /assertSameOrigin/);
  assert.match(mediaRoute, /consumeAdminRateLimit/);
});
