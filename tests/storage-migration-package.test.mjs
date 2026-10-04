import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hasStagedChanges, parseJsonOutput, safeEnv, sanitizeOutput } from "../scripts/storage-migration/common.mjs";
import { insertSqlFile, loadTargetSchema, transformTableRows, validateMigratedTable } from "../scripts/storage-migration/data.mjs";
import { analyzeLegacyOwnership, buildBackfillRowsForCore, filterPlannerOrphans } from "../scripts/storage-migration/identity-backfill.mjs";
import { inspectIdentity } from "../scripts/storage-migration/mapping.mjs";

test("all split schemas load locally and expose the migration targets", async () => {
  for (const domain of ["core", "learning", "community"]) {
    const schema = await loadTargetSchema(domain);
    try {
      const tables = schema.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
      assert.ok(tables.length > 0, `${domain} schema has tables`);
      if (domain === "core") {
        assert.ok(tables.includes("users"));
        assert.ok(tables.includes("member_notification_preferences"));
      }
      if (domain === "learning") assert.ok(tables.includes("weakness_profiles"));
      if (domain === "community") assert.ok(tables.includes("anonymous_submissions"));
    } finally {
      schema.close();
    }
  }
});

test("ownership analysis excludes LINE-only users and explicitly classifies only planner orphans", () => {
  const legacy = new DatabaseSync(":memory:");
  try {
    legacy.exec(`
      CREATE TABLE jshs_users (id TEXT PRIMARY KEY);
      CREATE TABLE user_identities (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, provider_user_id TEXT NOT NULL
      );
      CREATE TABLE line_users (line_user_id TEXT PRIMARY KEY, display_name TEXT);
      CREATE TABLE line_friendships (line_user_id TEXT PRIMARY KEY, is_friend INTEGER);
      CREATE TABLE member_planners (line_user_id TEXT PRIMARY KEY, planner_id TEXT UNIQUE);
      CREATE TABLE member_ai_conversations (
        line_user_id TEXT NOT NULL, conversation_id TEXT NOT NULL, title TEXT NOT NULL,
        conversation_json TEXT NOT NULL, updated_at TEXT NOT NULL,
        PRIMARY KEY(line_user_id, conversation_id)
      );
      CREATE TABLE member_notification_preferences (
        line_user_id TEXT PRIMARY KEY, planner_finalized_enabled INTEGER NOT NULL,
        score_calculated_enabled INTEGER NOT NULL, important_date_enabled INTEGER NOT NULL,
        weekly_report_enabled INTEGER NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE planner_items (id TEXT PRIMARY KEY, planner_id TEXT NOT NULL);
      CREATE TABLE planner_states (planner_id TEXT PRIMARY KEY, state_json TEXT NOT NULL);
      CREATE TABLE planner_confirmations (planner_id TEXT PRIMARY KEY, state_json TEXT NOT NULL);
      CREATE TABLE planner_versions (id TEXT PRIMARY KEY, planner_id TEXT NOT NULL);
      INSERT INTO line_users VALUES ('member-line', 'member'), ('oa-only-line', 'oa');
      INSERT INTO line_friendships VALUES ('friend-only-line', 1);
      INSERT INTO member_planners VALUES ('member-line', 'owned-planner');
      INSERT INTO member_ai_conversations VALUES ('member-line', 'c1', 't1', '{}', '2026-01-01');
      INSERT INTO member_ai_conversations VALUES ('member-line', 'c2', 't2', '{}', '2026-01-02');
      INSERT INTO member_notification_preferences VALUES ('member-line', 1, 1, 1, 0, '2026-01-01');
      INSERT INTO planner_states VALUES ('owned-planner', '{}');
      INSERT INTO planner_items VALUES ('orphan-item', 'unknown-planner');
      INSERT INTO planner_states VALUES ('orphan-state-1', '{}');
      INSERT INTO planner_states VALUES ('orphan-state-2', '{}');
      INSERT INTO planner_states VALUES ('orphan-state-3', '{}');
      INSERT INTO planner_states VALUES ('orphan-state-4', '{}');
      INSERT INTO planner_confirmations VALUES ('owned-planner', '{}');
    `);
    const plan = analyzeLegacyOwnership(legacy, {}, "2026-01-01T00:00:00.000Z");
    assert.equal(plan.summary.candidateIdentityCount, 1);
    assert.equal(plan.summary.generatedBackfillCount, 1);
    assert.equal(plan.summary.lineUsersNotPromoted, 1);
    assert.equal(plan.summary.uniquelyOwnedPlannerChildRowCount, 2);
    assert.equal(plan.summary.explicitlyDroppedPlannerChildRowCount, 5);
    assert.deepEqual(
      plan.plannerDrops.map(({ sourceTable, plannerAlias, rowCount, reason, action, classification }) => ({ sourceTable, plannerAlias, rowCount, reason, action, classification })),
      [
        { sourceTable: "planner_items", plannerAlias: "legacy-planner-6", rowCount: 1, reason: "unresolved_owner", action: "dropped_from_migration", classification: "DROP_AS_UNRESOLVED_LEGACY" },
        { sourceTable: "planner_states", plannerAlias: "legacy-planner-1", rowCount: 1, reason: "unresolved_owner", action: "dropped_from_migration", classification: "DROP_AS_UNRESOLVED_LEGACY" },
        { sourceTable: "planner_states", plannerAlias: "legacy-planner-2", rowCount: 1, reason: "unresolved_owner", action: "dropped_from_migration", classification: "DROP_AS_UNRESOLVED_LEGACY" },
        { sourceTable: "planner_states", plannerAlias: "legacy-planner-3", rowCount: 1, reason: "unresolved_owner", action: "dropped_from_migration", classification: "DROP_AS_UNRESOLVED_LEGACY" },
        { sourceTable: "planner_states", plannerAlias: "legacy-planner-4", rowCount: 1, reason: "unresolved_owner", action: "dropped_from_migration", classification: "DROP_AS_UNRESOLVED_LEGACY" },
      ],
    );
    assert.equal(plan.candidateAudit[0].alias, "legacy-line-1");
    assert.deepEqual(plan.candidateAudit[0].tables, [
      { table: "member_ai_conversations", rowCount: 2 },
      { table: "member_notification_preferences", rowCount: 1 },
      { table: "member_planners", rowCount: 1 },
    ]);
    const filtered = filterPlannerOrphans("planner_states", [
      { planner_id: "owned-planner" },
      { planner_id: "orphan-state-1" },
      { planner_id: "orphan-state-2" },
      { planner_id: "orphan-state-3" },
      { planner_id: "orphan-state-4" },
    ], plan.plannerDrops);
    assert.equal(filtered.rows.length, 1);
    assert.equal(filtered.droppedCount, 4);
  } finally {
    legacy.close();
  }
});

test("identity backfill UUIDs persist across retries and produce only member-referenced CORE rows", () => {
  const legacy = new DatabaseSync(":memory:");
  try {
    legacy.exec(`
      CREATE TABLE jshs_users (id TEXT PRIMARY KEY);
      CREATE TABLE user_identities (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, provider_user_id TEXT NOT NULL
      );
      CREATE TABLE line_users (line_user_id TEXT PRIMARY KEY);
      CREATE TABLE member_ai_conversations (
        line_user_id TEXT NOT NULL, conversation_id TEXT NOT NULL, title TEXT NOT NULL,
        conversation_json TEXT NOT NULL, updated_at TEXT NOT NULL,
        PRIMARY KEY(line_user_id, conversation_id)
      );
      INSERT INTO line_users VALUES ('referenced-line'), ('line-only');
      INSERT INTO member_ai_conversations VALUES ('referenced-line', 'c1', 'title', '{}', '2026-01-01');
    `);
    const first = analyzeLegacyOwnership(legacy, {}, "2026-01-01T00:00:00.000Z");
    const retry = analyzeLegacyOwnership(legacy, first.identityBackfillMap, "2027-01-01T00:00:00.000Z");
    const firstEntry = first.identityBackfillMap["referenced-line"];
    const retryEntry = retry.identityBackfillMap["referenced-line"];
    assert.equal(retryEntry.userId, firstEntry.userId);
    assert.equal(retryEntry.identityId, firstEntry.identityId);
    assert.equal(retryEntry.createdAt, firstEntry.createdAt);
    assert.equal(first.identityBackfillMap["line-only"], undefined);
    const rows = buildBackfillRowsForCore(first.identityBackfillMap, "fallback");
    assert.equal(rows.users.length, 1);
    assert.equal(rows.identities.length, 1);
    assert.equal(rows.identities[0].provider, "line");
    assert.equal(rows.identities[0].provider_user_id, "referenced-line");
    assert.equal(rows.identities[0].user_id, rows.users[0].id);
  } finally {
    legacy.close();
  }
});

test("ownership preflight stops on ambiguous planner owners and conflicting identity mappings", () => {
  const ambiguous = new DatabaseSync(":memory:");
  const conflicting = new DatabaseSync(":memory:");
  const resolvedOrphan = new DatabaseSync(":memory:");
  try {
    ambiguous.exec(`
      CREATE TABLE jshs_users (id TEXT PRIMARY KEY);
      CREATE TABLE user_identities (id TEXT PRIMARY KEY, user_id TEXT, provider TEXT, provider_user_id TEXT);
      CREATE TABLE member_planners (line_user_id TEXT, planner_id TEXT);
      CREATE TABLE planner_items (id TEXT, planner_id TEXT);
      INSERT INTO member_planners VALUES ('line-a', 'same-planner'), ('line-b', 'same-planner');
      INSERT INTO planner_items VALUES ('item-1', 'same-planner');
    `);
    assert.throws(() => analyzeLegacyOwnership(ambiguous), /planner_has_multiple_line_owners/);

    resolvedOrphan.exec(`
      CREATE TABLE jshs_users (id TEXT PRIMARY KEY);
      CREATE TABLE user_identities (id TEXT PRIMARY KEY, user_id TEXT, provider TEXT, provider_user_id TEXT);
      CREATE TABLE planner_items (id TEXT, planner_id TEXT, user_id TEXT);
      INSERT INTO jshs_users VALUES ('known-user');
      INSERT INTO user_identities VALUES ('known-identity', 'known-user', 'line', 'known-line');
      INSERT INTO planner_items VALUES ('known-item', 'missing-parent', 'known-user');
    `);
    assert.throws(() => analyzeLegacyOwnership(resolvedOrphan), /orphan_planner_has_resolved_owner_without_parent/);

    conflicting.exec(`
      CREATE TABLE jshs_users (id TEXT PRIMARY KEY);
      CREATE TABLE user_identities (id TEXT PRIMARY KEY, user_id TEXT, provider TEXT, provider_user_id TEXT);
      CREATE TABLE member_ai_conversations (line_user_id TEXT, conversation_id TEXT);
      INSERT INTO jshs_users VALUES ('user-a'), ('user-b');
      INSERT INTO user_identities VALUES ('identity-a', 'user-a', 'line', 'line-same');
      INSERT INTO user_identities VALUES ('identity-b', 'user-b', 'line', 'line-same');
      INSERT INTO member_ai_conversations VALUES ('line-same', 'c1');
    `);
    assert.throws(() => analyzeLegacyOwnership(conflicting), /conflicting JSHS users/);
  } finally {
    ambiguous.close();
    conflicting.close();
    resolvedOrphan.close();
  }
});

test("legacy LINE-owned learning rows resolve to the existing internal UUID", async () => {
  const legacy = new DatabaseSync(":memory:");
  const target = await loadTargetSchema("learning");
  try {
    legacy.exec(`
      CREATE TABLE user_identities (user_id TEXT, provider TEXT, provider_user_id TEXT);
      INSERT INTO user_identities VALUES ('existing-uuid', 'line', 'line-user-1');
      CREATE TABLE member_mock_exams (
        id TEXT, line_user_id TEXT, user_id TEXT, name TEXT, exam_date TEXT,
        subjects_json TEXT, essay TEXT, created_at TEXT, updated_at TEXT
      );
      INSERT INTO member_mock_exams VALUES
        ('exam-1', 'line-user-1', NULL, 'practice', '2026-01-01', '{}', '', 'a', 'b');
    `);
    const transformed = transformTableRows(legacy, target, "member_mock_exams", "member_mock_exams").rows;
    assert.equal(transformed[0].user_id, "existing-uuid");
    assert.equal("line_user_id" in transformed[0], false);
  } finally {
    legacy.close();
    target.close();
  }
});

test("legacy LINE identity ambiguity and schema column loss fail closed", async () => {
  const legacy = new DatabaseSync(":memory:");
  const target = await loadTargetSchema("learning");
  try {
    legacy.exec(`
      CREATE TABLE user_identities (user_id TEXT, provider TEXT, provider_user_id TEXT);
      INSERT INTO user_identities VALUES ('user-1', 'line', 'line-1');
      CREATE TABLE member_mock_exams (
        id TEXT, line_user_id TEXT, user_id TEXT, name TEXT, exam_date TEXT,
        subjects_json TEXT, essay TEXT, created_at TEXT, updated_at TEXT, private_payload TEXT
      );
      INSERT INTO member_mock_exams VALUES ('exam-1', 'line-1', NULL, 'n', 'd', '{}', '', 'a', 'b', 'must-not-drop');
    `);
    assert.throws(
      () => transformTableRows(legacy, target, "member_mock_exams", "member_mock_exams"),
      /would drop columns \(private_payload\)/,
    );
  } finally {
    legacy.close();
    target.close();
  }
});

test("table readback detects row loss and confirms exact migrated content", async () => {
  const legacy = new DatabaseSync(":memory:");
  const target = await loadTargetSchema("learning");
  try {
    legacy.exec(`
      CREATE TABLE member_score_history (
        id TEXT, user_id TEXT, district TEXT, academic_year TEXT,
        total_score REAL, result_json TEXT, created_at TEXT
      );
      INSERT INTO member_score_history VALUES ('s1', 'u1', 'N', '2026', 30, '{}', '2026-01-01');
    `);
    const expected = transformTableRows(legacy, target, "member_score_history", "member_score_history").rows;
    target.prepare(`INSERT INTO member_score_history
      (id, user_id, district, academic_year, total_score, result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(...Object.values(expected[0]));
    const actual = target.prepare("SELECT * FROM member_score_history").all();
    assert.equal(validateMigratedTable(expected, actual, "member_score_history", "member_score_history", target).rowConservation, "PASS");
    assert.equal(validateMigratedTable(expected, [], "member_score_history", "member_score_history", target).rowConservation, "FAIL");
  } finally {
    legacy.close();
    target.close();
  }
});

test("D1 import batches obey safe statement and SQL-byte limits", () => {
  const columns = [{ name: "id" }, { name: "value" }];
  const rows = Array.from({ length: 20 }, (_, index) => ({ id: `row-${index}`, value: "x".repeat(40) }));
  const chunks = insertSqlFile(rows, columns, "fixture", 60, 300);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk, "utf8") <= 300));
  assert.throws(() => insertSqlFile([{ id: "large", value: "x".repeat(100) }], columns, "fixture", 60, 50), /exceeds the safe D1 SQL batch size/);
});

test("identity inventory catches duplicate LINE mappings and orphan users", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`
      CREATE TABLE jshs_users (id TEXT);
      CREATE TABLE user_identities (user_id TEXT, provider TEXT, provider_user_id TEXT);
      INSERT INTO jshs_users VALUES ('user-1'), ('user-2');
      INSERT INTO user_identities VALUES ('user-1', 'line', 'line-1'), ('user-2', 'line', 'line-1');
    `);
    const result = inspectIdentity(db);
    assert.equal(result.duplicateLineMappingCount, 1);
    assert.equal(result.usersWithoutIdentityCount, 0);
  } finally {
    db.close();
  }
});

test("Wrangler JSON parsing tolerates notices without exposing command output", () => {
  assert.deepEqual(parseJsonOutput("notice\n{\"success\":true,\"result\":[1]}"), { success: true, result: [1] });
});

test("one-command runner gates phases and never invokes direct Wrangler deployment", async () => {
  const [runner, prepare, cutover] = await Promise.all([
    readFile(new URL("../scripts/storage-migration/run.sh", import.meta.url), "utf8"),
    readFile(new URL("../scripts/storage-migration/prepare.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/storage-migration/cutover.mjs", import.meta.url), "utf8"),
  ]);
  assert.ok(runner.indexOf("run_phase prepare") < runner.indexOf("run_phase inventory"));
  assert.ok(runner.indexOf("run_phase inventory") < runner.indexOf("run_phase migrate"));
  assert.ok(runner.indexOf("run_phase migrate") < runner.indexOf("run_phase verify"));
  assert.ok(runner.indexOf("run_phase verify") < runner.indexOf("run_phase cutover"));
  assert.ok(cutover.indexOf('if (answer !== "y")') < cutover.indexOf('run("git", ["add", "--", "wrangler.jsonc"])'));
  assert.match(cutover, /run\("git", \["push", "github", "main"\]/);
  assert.doesNotMatch(cutover, /wrangler\s+deploy/);
  assert.match(prepare, /Storage migration scripts or schemas are not committed/);
  assert.match(prepare, /not published at github\/main/);
});

test("cutover rejects staged paths but permits unstaged and generated untracked paths", () => {
  assert.equal(hasStagedChanges(" M tracked.ts\n?? generated.json"), false);
  assert.equal(hasStagedChanges("M  staged.ts"), true);
  assert.equal(hasStagedChanges("A  staged-new.ts"), true);
  assert.equal(hasStagedChanges(" D deleted.ts"), false);
});

test("Wrangler logs are directed away and credential values are redacted", () => {
  const env = safeEnv();
  assert.equal(env.WRANGLER_WRITE_LOGS, "false");
  assert.equal(env.WRANGLER_LOG_PATH, "/dev/null");
  const output = sanitizeOutput("IMAGEKIT_PRIVATE_KEY=private-example CLOUDFLARE_API_TOKEN=token-example");
  assert.doesNotMatch(output, /private-example|token-example/);
});
