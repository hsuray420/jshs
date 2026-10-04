import { chmod, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DOMAINS, LEGACY_NAME, ROOT, ensurePrivateDir, parseJsonOutput, readJson, sqlIdentifier, writeJson, wrangler } from "./common.mjs";
import { loadTargetSchema, openSnapshot, readRows, tableFingerprint, transformTableRows, validateMigratedTable } from "./data.mjs";
import { inspectIdentity } from "./mapping.mjs";
import { filterPlannerOrphans } from "./identity-backfill.mjs";

const dir = await ensurePrivateDir();
const metadataPath = path.join(dir, "metadata.json");
const metadata = await readJson(metadataPath);
const inventory = await readJson(path.join(dir, "inventory.json"));
if (metadata.migrationStatus !== "COPIED_AWAITING_VERIFICATION") throw new Error("No completed data-copy phase is recorded");
const source = openSnapshot(path.join(dir, "legacy-snapshot.sqlite"));
const results = [];
const targetDatabaseFiles = {};

try {
  for (const domain of Object.keys(DOMAINS)) {
    const spec = DOMAINS[domain];
    const id = metadata.databaseIds?.[domain];
    if (!id) throw new Error(`Missing database ID for ${spec.database}`);
    const sqlPath = path.join(dir, `${spec.database}.readback.sql`);
    wrangler(["d1", "export", spec.database, "--remote", "--output", sqlPath, "--skip-confirmation"], {
      timeout: 60 * 60 * 1000,
      label: `read back ${spec.database}`,
    });
    const targetFile = await loadExport(sqlPath, `${spec.database}.readback.sqlite`);
    targetDatabaseFiles[domain] = targetFile;
    const target = new DatabaseSync(targetFile, { readOnly: true });
    const targetSchema = await loadTargetSchema(domain);
    try {
      for (const table of metadata.migrationTables.filter((item) => item.domain === domain)) {
        const transformed = transformTableRows(source, targetSchema, table.sourceTable, table.targetTable, metadata.identityBackfillMap);
        const filtered = filterPlannerOrphans(table.sourceTable, transformed.rows, inventory.plannerDrops ?? []);
        const expected = filtered.rows;
        const actual = readRows(target, table.targetTable);
        const check = validateMigratedTable(expected, actual, table.sourceTable, table.targetTable, targetSchema);
        const actualDropped = (inventory.plannerDrops ?? [])
          .filter((drop) => drop.sourceTable === table.sourceTable)
          .reduce((total, drop) => total + drop.rowCount, 0);
        const unexpectedMissingCount = transformed.sourceRowCount - actual.length - actualDropped;
        const authorizedDropCountMatch = actualDropped === table.droppedRowCount && filtered.droppedCount === actualDropped;
        check.oldCount = transformed.sourceRowCount;
        check.newCount = actual.length;
        check.migratedCount = expected.length;
        check.droppedByAuthorization = actualDropped;
        check.unexpectedMissing = unexpectedMissingCount;
        check.rowConservation = check.rowConservation === "PASS"
          && transformed.sourceRowCount === expected.length + actualDropped
          && actual.length === expected.length
          ? "PASS" : "FAIL";
        const allChecks = [
          check.rowConservation,
          authorizedDropCountMatch ? "PASS" : "FAIL",
          unexpectedMissingCount === 0 ? "PASS" : "FAIL",
          check.uniqueCheck,
          check.randomReadback,
          check.oldestNewestReadback,
          check.contentHashMatch ? "PASS" : "FAIL",
        ];
        check.result = allChecks.every((value) => value === "PASS") ? "PASS" : "FAIL";
        results.push({ domain, database: spec.database, databaseId: id, ...check });
        metadata.tableVerification = results;
        await writeJson(metadataPath, metadata);
        console.log(`${domain}.${table.sourceTable} -> ${table.targetTable}: ${check.result} (${check.oldCount} → ${check.newCount})`);
      }
    } finally {
      target.close();
      targetSchema.close();
    }
  }

  const core = new DatabaseSync(targetDatabaseFiles.core, { readOnly: true });
  const learning = new DatabaseSync(targetDatabaseFiles.learning, { readOnly: true });
  const community = new DatabaseSync(targetDatabaseFiles.community, { readOnly: true });
  let destinationIdentity;
  let crossDbOrphans;
  let backfillClean;
  try {
    destinationIdentity = inspectIdentity(core);
    crossDbOrphans = countCrossDatabaseOrphans(core, learning, community);
    backfillClean = validateBackfillReadback(core, metadata.identityBackfillMap);
  } finally {
    core.close(); learning.close(); community.close();
  }

  const identityClean = destinationIdentity.identityCheckAvailable
    && destinationIdentity.duplicateLineMappingCount === 0
    && destinationIdentity.duplicateInternalIdentityCount === 0
    && destinationIdentity.duplicatePrimaryKeyCount === 0
    && destinationIdentity.orphanIdentityCount === 0
    && destinationIdentity.usersWithoutIdentityCount === 0
    && destinationIdentity.unresolvedLearningOwnerCount === 0
    && destinationIdentity.identityConflictsCount === 0
    && destinationIdentity.lineMappingsResolve;
  const orphanClean = Object.values(crossDbOrphans).every((count) => count === 0);
  const tableClean = results.length === metadata.migrationTables.length && results.every((item) => item.result === "PASS");
  metadata.tableVerification = results;
  metadata.destinationIdentity = destinationIdentity;
  metadata.crossDatabaseOrphans = crossDbOrphans;
  metadata.identityBackfillVerification = backfillClean;
  metadata.unexpectedMissingCount = results.reduce((total, item) => total + item.unexpectedMissing, 0);
  const noUnexpectedMissing = results.every((item) => item.unexpectedMissing === 0);
  if (!tableClean || !identityClean || !orphanClean || !backfillClean.passed || !noUnexpectedMissing) {
    const failed = { tableClean, identityClean, orphanClean, backfillClean: backfillClean.passed, noUnexpectedMissing, failedTables: results.filter((item) => item.result !== "PASS").length };
    metadata.verification = { status: "FAIL", completedAt: new Date().toISOString(), failed };
    await writeJson(metadataPath, metadata);
    throw new Error(`Migration readback validation failed: ${JSON.stringify(failed)}; production bindings remain unchanged`);
  }

  metadata.verification = { status: "PASS", completedAt: new Date().toISOString() };
  await writeJson(metadataPath, metadata);
  console.log("Row conservation (migrated + authorized drops), unique keys, sampled readback, and identity/orphan checks PASS.");
  await runBrowserImageKitSmoke();
  metadata.imageKitSmoke = { status: "PASS", verifiedAt: new Date().toISOString(), temporaryFileDeleted: true, d1BinaryFallbackUsed: false };
  await verifyLegacyMappedTablesUnchanged(metadata, inventory);
  metadata.verification = { status: "PASS", completedAt: new Date().toISOString() };
  await writeJson(metadataPath, metadata);
  await writeReport(metadata, inventory.tables, results, destinationIdentity, crossDbOrphans);
  console.log("All migration checks passed, including ImageKit upload/read/delete. Production bindings remain unchanged until explicit deploy approval.");
} catch (error) {
  if (metadata.verification?.status !== "FAIL") {
    metadata.verification = { status: "FAIL", completedAt: new Date().toISOString(), reason: safeReason(error) };
    await writeJson(metadataPath, metadata);
  }
  throw error;
} finally {
  source.close();
}

async function loadExport(sqlPath, dbName) {
  const dump = await readFile(sqlPath, "utf8");
  if (!/CREATE TABLE/i.test(dump)) throw new Error(`D1 readback export for ${dbName} is incomplete`);
  const dbPath = path.join(dir, dbName);
  await writeFile(dbPath, Buffer.alloc(0), { mode: 0o600 });
  const db = new DatabaseSync(dbPath);
  try { db.exec(dump); } catch (error) {
    db.close();
    throw new Error(`Cannot load D1 readback for ${dbName}: ${safeReason(error)}`);
  }
  db.close();
  await chmod(dbPath, 0o600);
  return dbPath;
}

function validateBackfillReadback(core, identityBackfillMap) {
  const byUser = new Map();
  let missingUsers = 0;
  let missingMappings = 0;
  let conflictingMappings = 0;
  for (const [lineUserId, mapping] of Object.entries(identityBackfillMap ?? {})) {
    const user = core.prepare("SELECT id FROM users WHERE id = ? LIMIT 1").get(mapping.userId);
    const identity = core.prepare(`SELECT id, user_id FROM user_identities
      WHERE provider = 'line' AND provider_user_id = ? LIMIT 1`).get(lineUserId);
    if (!user) missingUsers += 1;
    if (!identity || identity.user_id !== mapping.userId || identity.id !== mapping.identityId) missingMappings += 1;
    const previous = byUser.get(mapping.userId);
    if (previous && previous !== lineUserId) conflictingMappings += 1;
    byUser.set(mapping.userId, lineUserId);
  }
  const result = {
    candidateIdentityCount: Object.keys(identityBackfillMap ?? {}).length,
    missingUsers,
    missingMappings,
    conflictingMappings,
    passed: missingUsers === 0 && missingMappings === 0 && conflictingMappings === 0,
  };
  return result;
}

function countCrossDatabaseOrphans(core, learning, community) {
  const userIds = new Set(core.prepare(`SELECT id FROM users`).all().map((row) => row.id));
  const coreLineKeys = new Map(core.prepare(`SELECT provider_user_id, user_id FROM user_identities WHERE provider = 'line'`).all().map((row) => [row.provider_user_id, row.user_id]));
  const result = { learningOwnerOrphans: 0, communityVoteOrphans: 0, communityAuditActorOrphans: 0, plannerChildOrphans: 0, examResultSessionOrphans: 0, subjectScoreOrphans: 0 };
  for (const table of ["member_score_history", "member_mock_exams", "member_ai_conversations", "member_planners", "weakness_profiles", "analysis_snapshots", "exam_sessions", "exam_results"]) {
    const columns = learning.prepare(`PRAGMA table_info(${sqlIdentifier(table)})`).all().map((column) => column.name);
    if (!columns.includes("user_id")) continue;
    for (const row of learning.prepare(`SELECT user_id ${columns.includes("line_user_id") ? ", line_user_id" : ""} FROM ${sqlIdentifier(table)}`).all()) {
      if (!userIds.has(row.user_id)) result.learningOwnerOrphans += 1;
      if (row.line_user_id && coreLineKeys.get(row.line_user_id) !== row.user_id) result.learningOwnerOrphans += 1;
    }
  }
  const voteColumns = community.prepare("PRAGMA table_info(community_votes)").all().map((column) => column.name);
  if (voteColumns.includes("user_id")) {
    for (const row of community.prepare("SELECT user_id FROM community_votes").all()) {
      if (!userIds.has(row.user_id)) result.communityVoteOrphans += 1;
    }
    const auditColumns = community.prepare("PRAGMA table_info(admin_audit_logs)").all().map((column) => column.name);
    if (auditColumns.includes("actor_user_id")) {
      for (const row of community.prepare("SELECT actor_user_id FROM admin_audit_logs WHERE actor_user_id IS NOT NULL").all()) {
        if (!userIds.has(row.actor_user_id)) result.communityAuditActorOrphans += 1;
      }
    }
    const examSessions = new Set(learning.prepare("SELECT id FROM exam_sessions").all().map((row) => row.id));
    for (const row of learning.prepare("SELECT exam_session_id FROM exam_results WHERE exam_session_id IS NOT NULL").all()) {
      if (!examSessions.has(row.exam_session_id)) result.examResultSessionOrphans += 1;
    }
    const examResults = new Set(learning.prepare("SELECT id FROM exam_results").all().map((row) => row.id));
    for (const row of learning.prepare("SELECT exam_result_id FROM subject_scores").all()) {
      if (!examResults.has(row.exam_result_id)) result.subjectScoreOrphans += 1;
    }
  }
  const planners = new Set(learning.prepare("SELECT planner_id FROM member_planners").all().map((row) => row.planner_id));
  for (const table of ["planner_items", "planner_states", "planner_versions", "planner_confirmations"]) {
    const tables = new Set(learning.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
    if (!tables.has(table)) continue;
    for (const row of learning.prepare(`SELECT planner_id FROM ${sqlIdentifier(table)}`).all()) {
      if (!planners.has(row.planner_id)) result.plannerChildOrphans += 1;
    }
  }
  return result;
}

async function runBrowserImageKitSmoke() {
  const nonce = crypto.randomUUID();
  const marker = `${nonce}:PASS`;
  const url = `https://jshs.cc/admin/system/resources?storageMigrationImageKitSmoke=${nonce}`;
  console.log("Opening the authenticated JSHS Admin page to run the server-side ImageKit smoke test...");
  const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const openArgs = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const opened = await import("node:child_process").then(({ spawnSync }) => spawnSync(openCommand, openArgs, { stdio: "ignore", timeout: 10_000 }));
  if (opened.error || opened.status !== 0) throw new Error("Could not open the authenticated Admin browser for ImageKit validation");

  const query = `SELECT value FROM site_settings WHERE key = '${MIGRATION_KEY}' LIMIT 1`;
  const startedAt = Date.now();
  let passed = false;
  try {
    while (Date.now() - startedAt < 120_000) {
      const result = wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", query, "--json"], { timeout: 30_000 });
      if (containsValue(parseJsonOutput(result.stdout), marker)) {
        passed = true;
        break;
      }
      if (containsValue(parseJsonOutput(result.stdout), `${nonce}:FAIL`)) {
        throw new Error("ImageKit smoke test failed or the Admin browser session is not authenticated");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } finally {
    wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", `DELETE FROM site_settings WHERE key = '${MIGRATION_KEY}' AND value LIKE '${nonce}:%'`, "--yes"]);
    const remaining = wrangler(["d1", "execute", LEGACY_NAME, "--remote", "--command", query, "--json"], { timeout: 30_000 });
    if (containsNonce(parseJsonOutput(remaining.stdout), nonce)) throw new Error("ImageKit smoke marker cleanup could not be verified");
  }
  if (!passed) throw new Error("ImageKit browser smoke result was not received within 120 seconds; no production bindings changed");
}

async function verifyLegacyMappedTablesUnchanged(currentMetadata, originalInventory) {
  const sqlPath = path.join(dir, "legacy-after-copy.sql");
  const dbPath = path.join(dir, "legacy-after-copy.sqlite");
  wrangler(["d1", "export", LEGACY_NAME, "--remote", "--output", sqlPath, "--skip-confirmation"], {
    timeout: 60 * 60 * 1000,
    label: "recheck legacy tables after copy",
  });
  await loadExport(sqlPath, "legacy-after-copy.sqlite");
  const current = new DatabaseSync(dbPath, { readOnly: true });
  const before = openSnapshot(path.join(dir, "legacy-snapshot.sqlite"));
  try {
    const original = new Map(originalInventory.tables.map((table) => [table.name, table]));
    const failures = [];
    for (const table of originalInventory.tables.filter((item) => item.domain !== "legacy_system")) {
      const prior = original.get(table.name);
      const now = readRows(current, table.name);
      const beforeRows = readRows(before, table.name);
      const same = prior?.fingerprint === tableFingerprint(now)
        && beforeRows.length === now.length
        && tableFingerprint(beforeRows) === tableFingerprint(now);
      if (!same) failures.push(table.name);
    }
    if (failures.length) throw new Error(`Legacy source changed during migration copy (${failures.join(", ")}); production bindings remain unchanged`);
  } finally {
    current.close();
    before.close();
  }
  console.log("Legacy mapped source data unchanged since backup: PASS.");
}

function containsValue(value, expected) {
  if (!value || typeof value !== "object") return false;
  if (Object.values(value).some((item) => item === expected)) return true;
  return Object.values(value).some((item) => containsValue(item, expected));
}

function containsNonce(value, nonce) {
  if (typeof value === "string") return value.startsWith(`${nonce}:`);
  if (Array.isArray(value)) return value.some((item) => containsNonce(item, nonce));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsNonce(item, nonce));
  return false;
}

async function writeReport(currentMetadata, inventoryTables, tables, identity, orphans) {
  const tableLines = tables.map((item) => `| ${item.sourceTable} → ${item.database}.${item.targetTable} | ${item.oldCount} | ${item.migratedCount} | ${item.droppedByAuthorization} | ${item.unexpectedMissing} | ${item.newCount} | ${item.result} |`).join("\n");
  const inventoryLines = inventoryTables.map((item) => `| ${item.name} | ${item.rowCount} | ${item.domain} |`).join("\n");
  const identityLines = (currentMetadata.identityBackfillAudit ?? []).map((item) =>
    `| ${item.alias} | ${item.tables.map((table) => `${table.table} (${table.rowCount})`).join(", ")} | ${item.plannerIds.length} | ${item.backfillRequired ? "new UUID backfill" : "existing mapping"} |`).join("\n");
  const dropLines = (currentMetadata.dropAudit ?? []).map((item) =>
    `| ${item.sourceTable} | ${item.plannerAlias} | ${item.rowCount} | ${item.reason} | ${item.action} |`).join("\n");
  const report = `# Storage migration report

Run: ${currentMetadata.runId}
Completed: ${new Date().toISOString()}

## Legacy database

- Name: \`jshs-db\`
- ID: \`${currentMetadata.legacyDatabase.id}\`
- Size before migration: ${currentMetadata.legacyDatabase.info?.sizeBytes ?? "Unavailable"}
- Backup: PASS; secure export SHA-256 \`${currentMetadata.backup.sha256}\`
- Time Travel bookmark: ${currentMetadata.rollbackCheckpoint?.bookmark ?? "Unavailable"}
- Production old DB retained: yes

## Legacy inventory

| Table | Rows | Mapping |
|---|---:|---|
${inventoryLines || "| No tables | 0 | — |"}

## New D1 databases

| Domain | Name | Database ID |
|---|---|---|
| CORE | ${DOMAINS.core.database} | ${currentMetadata.databaseIds.core} |
| LEARNING | ${DOMAINS.learning.database} | ${currentMetadata.databaseIds.learning} |
| COMMUNITY | ${DOMAINS.community.database} | ${currentMetadata.databaseIds.community} |

## Table row conservation

| Table mapping | Old rows | Migrated | Dropped by authorization | Unexpected missing | New rows | Result |
|---|---:|---:|---:|---:|---:|---|
${tableLines || "| No populated mapped tables | 0 | 0 | 0 | 0 | 0 | PASS |"}

## Member identity backfill

- Member-referenced LINE identities: ${currentMetadata.legacyOwnershipSummary?.candidateIdentityCount ?? 0}
- New deterministic UUID backfills: ${currentMetadata.legacyOwnershipSummary?.generatedBackfillCount ?? 0}
- LINE-only records not promoted: ${currentMetadata.legacyOwnershipSummary?.lineUsersNotPromoted ?? 0}

| Anonymous identity | Member tables | Planner IDs | Identity handling |
|---|---|---:|---|
${identityLines.join("\n") || "| None | — | 0 | — |"}

## Authorized planner exclusions

| Source table | Planner alias | Rows | Reason | Action |
|---|---|---:|---|---|
${dropLines.join("\n") || "| None | — | 0 | — | —"}

- Unexpected missing rows: ${currentMetadata.unexpectedMissingCount ?? 0}
- Backfill identity readback: ${currentMetadata.identityBackfillVerification?.passed ? "PASS" : "FAIL"}

## Integrity

- Duplicate LINE mapping rows: ${identity.duplicateLineMappingCount}; result PASS
- Duplicate internal identity/provider rows: ${identity.duplicateInternalIdentityCount}; result PASS
- Orphan identities: ${identity.orphanIdentityCount}; result PASS
- Learning owner orphans: ${orphans.learningOwnerOrphans}; result PASS
- Planner child orphans: ${orphans.plannerChildOrphans}; result PASS
- Community vote identity orphans: ${orphans.communityVoteOrphans}; result PASS
- LINE mapping uses existing internal UUIDs: PASS
- Random, oldest, newest readback and full-table hash: PASS

## ImageKit

- Temporary upload: PASS
- fileId / API readback: PASS
- image URL retrieval: PASS
- delete and post-delete verification: PASS
- D1 image binary fallback used: no

## Cutover

- Production bindings changed: no (awaiting explicit approval)
- Production deployment: not run
- Rollback checkpoint: ${currentMetadata.rollbackCheckpoint?.bookmark ?? "Full SQL backup only"}
- Rollback instructions: [rollback.md](./scripts/storage-migration/rollback.md)
`;
  const reportPath = path.join(ROOT, "storage-migration-report.md");
  await writeFile(reportPath, report, { mode: 0o600 });
  await chmod(reportPath, 0o600);
}

function safeReason(error) {
  return error instanceof Error ? error.message.replace(/[A-Za-z0-9_-]{48,}/g, "[redacted]").slice(0, 240) : "unknown verification error";
}
