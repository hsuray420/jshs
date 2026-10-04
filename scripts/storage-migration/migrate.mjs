import { chmod, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOMAINS, ensurePrivateDir, parseJsonOutput, readJson, writeJson, wrangler } from "./common.mjs";
import { applyTargetSchema, findOrCreateD1, insertSqlFile, loadTargetSchema, openSnapshot, transformTableRows } from "./data.mjs";
import { TABLE_MAP, getTableNames } from "./mapping.mjs";
import { buildBackfillRowsForCore, filterPlannerOrphans } from "./identity-backfill.mjs";

const dir = await ensurePrivateDir();
const metadata = await readJson(path.join(dir, "metadata.json"));
const inventory = await readJson(path.join(dir, "inventory.json"));
if (!metadata.backup?.complete || inventory.identityChecks !== "PASS") throw new Error("Backup or identity preflight is not PASS; refusing to migrate");
metadata.dropAudit = (inventory.plannerDrops ?? []).map(({ sourceTable, plannerAlias, rowCount, reason, action, classification }) => ({
  sourceTable, plannerAlias, rowCount, reason, action, classification,
}));
metadata.migrationTables = [];
await writeJson(path.join(dir, "metadata.json"), metadata);

const source = openSnapshot(path.join(dir, "legacy-snapshot.sqlite"));
const sourceNames = new Set(getTableNames(source));
const domains = {};
const targetSchemas = {};
const results = [];
try {
  for (const domain of Object.keys(DOMAINS)) {
    domains[domain] = await findOrCreateD1(domain, metadata, wrangler, parseJsonOutput);
  }

  for (const domain of Object.keys(DOMAINS)) {
    await applyTargetSchema(domains[domain].name, domain, wrangler);
    targetSchemas[domain] = await loadTargetSchema(domain);
  }

  for (const domain of Object.keys(DOMAINS)) {
    const map = TABLE_MAP[domain];
    const targetGroups = new Map();
    for (const [sourceTable, targetTable] of Object.entries(map)) {
      if (!sourceNames.has(sourceTable)) continue;
      const list = targetGroups.get(targetTable) ?? [];
      list.push(sourceTable);
      targetGroups.set(targetTable, list);
    }
    for (const [targetTable, sourceTables] of targetGroups) {
      const populated = sourceTables.filter((table) => Number(source.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get().count) > 0);
      if (populated.length > 1) {
        throw new Error(`Multiple populated legacy tables map to ${domain}.${targetTable}; manual merge review required`);
      }
      const sourceTable = populated[0] ?? sourceTables[0];
      const transformed = transformTableRows(source, targetSchemas[domain], sourceTable, targetTable, metadata.identityBackfillMap);
      const filtered = filterPlannerOrphans(sourceTable, transformed.rows, inventory.plannerDrops ?? []);
      const expectedDropped = (inventory.plannerDrops ?? [])
        .filter((drop) => drop.sourceTable === sourceTable)
        .reduce((total, drop) => total + drop.rowCount, 0);
      if (filtered.droppedCount !== expectedDropped) {
        throw new Error(`Planner orphan filter count mismatch for ${sourceTable}; refusing to continue`);
      }
      const unexpectedMissingCount = transformed.sourceRowCount - filtered.rows.length - filtered.droppedCount;
      if (unexpectedMissingCount !== 0) {
        throw new Error(`Unexpected missing legacy rows in ${sourceTable}; refusing to continue`);
      }
      const privateSqlDir = path.join(dir, "sql", domain);
      await import("node:fs/promises").then(({ mkdir }) => mkdir(privateSqlDir, { recursive: true, mode: 0o700 }));
      const chunks = insertSqlFile(filtered.rows, transformed.columns, targetTable);
      for (const [index, sql] of chunks.entries()) {
        const sqlPath = path.join(privateSqlDir, `${sourceTable}-${String(index + 1).padStart(5, "0")}.sql`);
        await writeFile(sqlPath, sql, { mode: 0o600 });
        await chmod(sqlPath, 0o600);
        wrangler(["d1", "execute", domains[domain].name, "--remote", "--file", sqlPath, "--yes"], {
          timeout: 60 * 60 * 1000,
          label: `copy ${domain}.${sourceTable} batch ${index + 1}`,
        });
      }
      results.push({
        domain,
        database: domains[domain].name,
        databaseId: domains[domain].id,
        sourceTable,
        targetTable,
        oldCount: transformed.sourceRowCount,
        migratedRowCount: filtered.rows.length,
        droppedRowCount: filtered.droppedCount,
        unexpectedMissingCount,
        insertedSourceRows: filtered.rows.length,
        insertBatches: chunks.length,
        transformation: sourceTable === targetTable ? "columns copied; LINE IDs resolved where required" : `${sourceTable} -> ${targetTable}`,
      });
      console.log(`${domain}: ${sourceTable} old=${transformed.sourceRowCount}, migrated=${filtered.rows.length}, authorizedDrop=${filtered.droppedCount}, unexpectedMissing=${unexpectedMissingCount}`);
      metadata.migrationTables = results;
      await writeJson(path.join(dir, "metadata.json"), metadata);
    }
  }

  const coreBackfill = buildBackfillRowsForCore(metadata.identityBackfillMap, metadata.startedAt);
  for (const [table, rows] of Object.entries({ users: coreBackfill.users, user_identities: coreBackfill.identities })) {
    if (!rows.length) continue;
    const columns = targetSchemas.core.prepare(`PRAGMA table_info("${table}")`).all();
    const chunks = insertSqlFile(rows, columns, table);
    for (const [index, sql] of chunks.entries()) {
      const sqlPath = path.join(dir, "sql", "core", `identity-backfill-${table}-${String(index + 1).padStart(5, "0")}.sql`);
      await writeFile(sqlPath, sql, { mode: 0o600 });
      await chmod(sqlPath, 0o600);
      wrangler(["d1", "execute", domains.core.name, "--remote", "--file", sqlPath, "--yes"], {
        timeout: 60 * 60 * 1000,
        label: `backfill CORE_DB ${table}`,
      });
    }
  }
  metadata.identityBackfillApplied = {
    status: "COPIED",
    generatedUserCount: coreBackfill.users.length,
    generatedIdentityCount: coreBackfill.identities.length,
  };
} finally {
  source.close();
  for (const db of Object.values(targetSchemas)) db.close();
}

metadata.migrationTables = results;
metadata.migrationStatus = "COPIED_AWAITING_VERIFICATION";
await writeJson(path.join(dir, "metadata.json"), metadata);
console.log(`Copied ${results.length} mapped source tables. Old jshs-db was not modified.`);
