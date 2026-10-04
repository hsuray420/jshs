import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseJsonOutput, safeEnv, sanitizeOutput } from "../scripts/storage-migration/common.mjs";
import { insertSqlFile, loadTargetSchema, transformTableRows, validateMigratedTable } from "../scripts/storage-migration/data.mjs";
import { inspectIdentity } from "../scripts/storage-migration/mapping.mjs";

test("all split schemas load locally and expose the migration targets", async () => {
  for (const domain of ["core", "learning", "community"]) {
    const schema = await loadTargetSchema(domain);
    try {
      const tables = schema.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
      assert.ok(tables.length > 0, `${domain} schema has tables`);
      if (domain === "core") assert.ok(tables.includes("users"));
      if (domain === "learning") assert.ok(tables.includes("weakness_profiles"));
      if (domain === "community") assert.ok(tables.includes("anonymous_submissions"));
    } finally {
      schema.close();
    }
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
    assert.equal(transformed[0].line_user_id, "line-user-1");
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
      INSERT INTO user_identities VALUES ('user-2', 'line', 'line-1');
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
  const [runner, cutover] = await Promise.all([
    readFile(new URL("../scripts/storage-migration/run.sh", import.meta.url), "utf8"),
    readFile(new URL("../scripts/storage-migration/cutover.mjs", import.meta.url), "utf8"),
  ]);
  assert.ok(runner.indexOf("run_phase prepare") < runner.indexOf("run_phase inventory"));
  assert.ok(runner.indexOf("run_phase inventory") < runner.indexOf("run_phase migrate"));
  assert.ok(runner.indexOf("run_phase migrate") < runner.indexOf("run_phase verify"));
  assert.ok(runner.indexOf("run_phase verify") < runner.indexOf("run_phase cutover"));
  assert.ok(cutover.indexOf('if (answer !== "y")') < cutover.indexOf('run("git", ["add", "--", "wrangler.jsonc"])'));
  assert.match(cutover, /run\("git", \["push", "github", "main"\]/);
  assert.doesNotMatch(cutover, /wrangler\s+deploy/);
});

test("Wrangler logs are directed away and credential values are redacted", () => {
  const env = safeEnv();
  assert.equal(env.WRANGLER_WRITE_LOGS, "false");
  assert.equal(env.WRANGLER_LOG_PATH, "/dev/null");
  const output = sanitizeOutput("IMAGEKIT_PRIVATE_KEY=private-example CLOUDFLARE_API_TOKEN=token-example");
  assert.doesNotMatch(output, /private-example|token-example/);
});
