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
  assert.match(bindings, /runtime\.DB/);
  assert.doesNotMatch(config, /CORE_DB|LEARNING_DB|COMMUNITY_DB/);
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

test("blocks new school-image uploads without ImageKit and preserves legacy BLOB reading", async () => {
  const [imagekit, route, editor, resources, adminStore] = await Promise.all([
    read("lib/imagekit-server.ts"),
    read("app/api/admin/school-media/route.ts"),
    read("components/admin-school-media-editor.tsx"),
    read("app/admin/system/resources/page.tsx"),
    read("db/admin-store.ts"),
  ]);
  assert.match(imagekit, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(imagekit, /checkImageKitHealth/);
  assert.match(route, /school_image_not_configured/);
  assert.doesNotMatch(route, /createAdminFile/);
  assert.match(editor, /圖片服務尚未設定/);
  assert.match(editor, /disabled={!imageKitConfigured}/);
  assert.match(adminStore, /file_blob/);
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
