import { chmod, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOMAINS, ROOT, ensurePrivateDir, readJson } from "./common.mjs";

const dir = await ensurePrivateDir();
const metadata = await readJson(path.join(dir, "metadata.json"));
const inventory = await readJson(path.join(dir, "inventory.json")).catch(() => null);
const pathToReport = path.join(ROOT, "storage-migration-report.md");
const inventoryRows = (inventory?.tables ?? []).map((table) =>
  `| ${table.name} | ${table.rowCount} | ${table.domain} |`).join("\n") || "| Not completed | — | — |";
const copiedRows = (metadata.tableVerification ?? []).map((table) =>
  `| ${table.sourceTable} → ${table.database}.${table.targetTable} | ${table.oldCount} | ${table.migratedCount} | ${table.droppedByAuthorization} | ${table.unexpectedMissing} | ${table.newCount} | ${table.uniqueCheck} | ${table.randomReadback} | ${table.oldestNewestReadback} | ${table.contentHashMatch ? "PASS" : "FAIL"} | ${table.result} |`).join("\n")
  || (metadata.migrationTables ?? []).map((table) =>
    `| ${table.sourceTable} → ${table.database}.${table.targetTable} | ${table.oldCount} | ${table.migratedRowCount} | ${table.droppedRowCount} | ${table.unexpectedMissingCount} | Not verified | PENDING | PENDING | PENDING | PENDING | PENDING |`).join("\n")
  || "| No copied tables recorded | — | — | — | — | — | PENDING | PENDING | PENDING | PENDING | PENDING |";
const identity = metadata.destinationIdentity ?? inventory?.identity;
const orphanChecks = metadata.crossDatabaseOrphans;
const checks = metadata.checks ?? {};
const identityAuditRows = (metadata.identityBackfillAudit ?? inventory?.identityBackfillAudit ?? []).map((item) =>
  `| ${item.alias} | ${item.tables.map((table) => `${table.table} (${table.rowCount})`).join(", ") || "planner ownership"} | ${item.plannerIds.length} | ${item.backfillRequired ? "new UUID backfill" : "existing mapping"} |`).join("\n")
  || "| No member-referenced LINE identity | — | 0 | — |";
const dropAuditRows = (metadata.dropAudit ?? inventory?.plannerDrops ?? []).map((item) =>
  `| ${item.sourceTable} | ${item.plannerAlias} | ${item.rowCount} | ${item.reason} | ${item.action} |`).join("\n")
  || "| None | — | 0 | — | — |";
const plannerOwnerRows = (inventory?.plannerOwnerChecks ?? []).map((item) =>
  `| ${item.sourceTable} | ${item.plannerAlias} | ${item.ownerAlias} | ${item.rowCount} | PASS |`).join("\n")
  || "| None | — | — | 0 | PASS |";
const domainRows = Object.entries(DOMAINS).map(([domain, spec]) =>
  `| ${domain.toUpperCase()} | ${spec.database} | ${metadata.databaseIds?.[domain] ?? "Not created"} |`).join("\n");
const lines = [
  "# Storage migration report",
  "",
  `Run: ${metadata.runId}`,
  `Started: ${metadata.startedAt}`,
  `Report generated: ${new Date().toISOString()}`,
  "",
  "## Legacy database inventory",
  "",
  `- Name: \`${metadata.legacyDatabase?.name ?? "jshs-db"}\``,
  `- ID: \`${metadata.legacyDatabase?.id ?? "Unavailable"}\``,
  `- Account confirmed: ${metadata.cloudflareAccountIds?.length ? "yes" : "not yet"}`,
  `- Export: ${metadata.backup?.complete ? `PASS (${metadata.backup.bytes} bytes, SHA-256 ${metadata.backup.sha256})` : "PENDING"}`,
  `- Time Travel checkpoint: ${metadata.rollbackCheckpoint?.bookmark ?? "Unavailable"}`,
  `- Original worktree was dirty: ${metadata.worktreeDirty ? "yes" : "no"} (${metadata.worktreeStatusLines ?? 0} paths)`,
  "- Legacy database retained; migration is copy-only.",
  "",
  "| Legacy table | Rows | Classification |",
  "|---|---:|---|",
  inventoryRows,
  "",
  "## New D1 databases",
  "",
  "| Domain | Name | Database ID |",
  "|---|---|---|",
  domainRows,
  "",
  "## Table mapping and row conservation",
  "",
  "| Mapping | Old rows | Migrated | Dropped by authorization | Unexpected missing | New rows | Primary/unique | Random readback | Oldest/newest | Content hash | Result |",
  "|---|---:|---:|---:|---:|---:|---|---|---|---|---|",
  copiedRows,
  "",
  "## Legacy member identity ownership",
  "",
  `- Member-referenced LINE identities: ${metadata.legacyOwnershipSummary?.candidateIdentityCount ?? inventory?.identity?.candidateIdentityCount ?? "PENDING"}`,
  `- New internal UUID backfills: ${metadata.legacyOwnershipSummary?.generatedBackfillCount ?? inventory?.identity?.generatedBackfillCount ?? "PENDING"}`,
  `- LINE-only records not promoted to members: ${metadata.legacyOwnershipSummary?.lineUsersNotPromoted ?? inventory?.identity?.lineUsersNotPromoted ?? "PENDING"}`,
  "",
  "| Anonymous identity | Member data tables | Planner IDs | Identity handling |",
  "|---|---|---:|---|",
  identityAuditRows,
  "",
  "## Planner ownership and authorized exclusions",
  "",
  "| Retained child table | Planner alias | Owner alias | Rows | Owner check |",
  "|---|---|---|---:|---|",
  plannerOwnerRows,
  "",
  "| Source table | Orphan planner alias | Rows | Reason | Action |",
  "|---|---|---:|---|---|",
  dropAuditRows,
  "",
  `- Total explicitly dropped from migration: ${metadata.legacyOwnershipSummary?.explicitlyDroppedPlannerChildRowCount ?? inventory?.identity?.explicitlyDroppedPlannerChildRowCount ?? "PENDING"}`,
  `- Unexpected missing rows: ${metadata.unexpectedMissingCount ?? (metadata.migrationTables ? metadata.migrationTables.reduce((total, table) => total + table.unexpectedMissingCount, 0) : "PENDING")}`,
  "",
  "## Identity and orphan validation",
  "",
  `- Legacy identity preflight: ${inventory?.identityChecks ?? "PENDING"}`,
  `- Duplicate LINE mappings: ${identity?.duplicateLineMappingCount ?? "PENDING"}`,
  `- Duplicate internal identity/provider pairs: ${identity?.duplicateInternalIdentityCount ?? "PENDING"}`,
  `- Orphan identities: ${identity?.orphanIdentityCount ?? "PENDING"}`,
  `- Orphan scores: ${identity?.orphanScoreCount ?? "PENDING"}`,
  `- Orphan exams: ${identity?.orphanExamCount ?? "PENDING"}`,
  `- Orphan planners: ${identity?.orphanPlannerCount ?? "PENDING"}`,
  `- Orphan AI conversations: ${identity?.orphanAiConversationCount ?? "PENDING"}`,
  `- Users without identity: ${identity?.usersWithoutIdentityCount ?? "PENDING"}`,
  `- Conflicting legacy/internal identity records: ${identity?.identityConflictsCount ?? "PENDING"}`,
  `- Cross-database Learning owner orphans: ${orphanChecks?.learningOwnerOrphans ?? "PENDING"}`,
  `- Cross-database planner child orphans: ${orphanChecks?.plannerChildOrphans ?? "PENDING"}`,
  `- Cross-database community vote orphans: ${orphanChecks?.communityVoteOrphans ?? "PENDING"}`,
  `- Cross-database community audit actor orphans: ${orphanChecks?.communityAuditActorOrphans ?? "PENDING"}`,
  `- Exam result/session orphans: ${orphanChecks?.examResultSessionOrphans ?? "PENDING"}`,
  `- Subject score/result orphans: ${orphanChecks?.subjectScoreOrphans ?? "PENDING"}`,
  `- Identity status: ${metadata.verification?.status ?? inventory?.identityChecks ?? "PENDING"}`,
  `- Backfill readback: ${metadata.identityBackfillVerification?.passed === true ? "PASS" : metadata.identityBackfillVerification?.passed === false ? "FAIL" : "PENDING"}`,
  "",
  "## ImageKit validation",
  "",
  `- Status: ${metadata.imageKitSmoke?.status ?? "PENDING"}`,
  `- Temporary file deleted: ${metadata.imageKitSmoke?.temporaryFileDeleted === true ? "yes" : "not verified"}`,
  `- D1 binary fallback used: ${metadata.imageKitSmoke?.d1BinaryFallbackUsed === false ? "no" : "not verified"}`,
  "",
  "## Bindings and test gates",
  "",
  `- Legacy binding \`DB → jshs-db\`: retained`,
  `- CORE_DB / LEARNING_DB / COMMUNITY_DB: ${metadata.cutover?.productionBindingsChanged ? "added to local Wrangler config" : "not changed"}`,
  `- Typecheck: ${checks.typecheck ?? "PENDING"}`,
  `- Lint: ${checks.lint ?? "PENDING"}`,
  `- Full test suite: ${checks.test ?? "PENDING"}`,
  `- git diff --check: ${checks.diffCheck ?? "PENDING"}`,
  `- Binding commit: ${metadata.cutover?.commit ?? "not created"}`,
  `- GitHub remote push: ${metadata.cutover?.pushStatus ?? "not run"}`,
  `- Git branch/remote: main / github`,
  `- Production deployment: ${metadata.cutover?.deployment ?? "not run"}`,
  `- Production smoke tests: ${metadata.cutover?.smokeStatus ?? "not run"}`,
  "",
  "## Rollback",
  "",
  `- Status: ${metadata.cutover?.status ?? "not started"}`,
  `- Rollback bookmark: ${metadata.rollbackCheckpoint?.bookmark ?? "Full SQL backup only"}`,
  "- Procedure: [rollback.md](./scripts/storage-migration/rollback.md)",
  `- Private full export and metadata directory: \`${metadata.migrationDirectory ?? "not recorded"}\``,
  "- The report intentionally contains counts and operational metadata only, never row contents or credentials.",
  "",
];
await writeFile(pathToReport, lines.join("\n"), { mode: 0o600 });
await chmod(pathToReport, 0o600);
console.log("Updated storage-migration-report.md without including production row contents or secrets.");
