import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("defines a stable JSHS user identity bridge without replacing LINE identity", async () => {
  const [store, callback, memberAuth] = await Promise.all([
    read("db/member-identity-store.ts"),
    read("app/api/line/login/callback/route.ts"),
    read("lib/member-auth.ts"),
  ]);
  assert.match(store, /CREATE TABLE IF NOT EXISTS jshs_users/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS user_identities/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS line_friendships/);
  assert.match(store, /ensureJshsMemberForLine/);
  assert.match(callback, /ensureJshsMemberForLine/);
  assert.match(memberAuth, /userId\?: string/);
});

test("provides a server-only Supabase schema with RLS and no browser service role", async () => {
  const [schema, server] = await Promise.all([
    read("supabase/migrations/0001_jshs_dynamic_data.sql"),
    read("lib/supabase-server.ts"),
  ]);
  for (const table of ["users", "user_identities", "line_friendships", "exam_sessions", "exam_results", "subject_scores", "weakness_profiles", "wishes", "favorites", "anonymous_submissions", "admin_drafts", "audit_logs"]) {
    assert.match(schema, new RegExp(`CREATE TABLE.*${table}`, "s"));
    assert.match(schema, new RegExp(`ALTER TABLE.*${table} ENABLE ROW LEVEL SECURITY`, "s"));
  }
  assert.match(server, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(server, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("centralizes provider links and renders the system resources control plane", async () => {
  const [resources, page, shell] = await Promise.all([
    read("lib/system-resources.ts"),
    read("app/admin/system/resources/page.tsx"),
    read("components/admin-shell.tsx"),
  ]);
  assert.match(resources, /ADMIN_EXTERNAL_LINKS/);
  assert.match(resources, /SUPABASE_DASHBOARD_URL/);
  assert.match(resources, /IMAGEKIT_DASHBOARD_URL/);
  assert.match(page, /網站伺服器/);
  assert.match(page, /Supabase/);
  assert.match(page, /ImageKit/);
  assert.match(page, /GitHub/);
  assert.match(page, /LINE/);
  assert.match(shell, /\/admin\/system\/resources/);
});

test("keeps ImageKit signing and upload credentials on the server", async () => {
  const [imagekit, route] = await Promise.all([
    read("lib/imagekit-server.ts"),
    read("app/api/admin/imagekit/auth/route.ts"),
  ]);
  assert.match(imagekit, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(imagekit, /createImageKitUploadSignature/);
  assert.match(route, /requireAdminRole/);
  assert.match(route, /assertSameOrigin/);
  assert.doesNotMatch(route, /IMAGEKIT_PRIVATE_KEY/);
});
