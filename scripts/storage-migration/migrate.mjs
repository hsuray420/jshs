import { chmod, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOMAINS, ensurePrivateDir, parseJsonOutput, readJson, writeJson, wrangler } from "./common.mjs";
import { applyTargetSchema, findOrCreateD1, insertSqlFile, loadTargetSchema, openSnapshot, transformTableRows } from "./data.mjs";
import { TABLE_MAP, getTableNames } from "./mapping.mjs";

const dir = await ensurePrivateDir();
const metadata = await readJson(path.join(dir, "metadata.json"));
const inventory = await readJson(path.join(dir, "inventory.json"));
if (!metadata.backup?.complete || inventory.identityChecks !== "PASS") throw new Error("Backup or identity preflight is not PASS; refusing to migrate");

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
      const transformed = transformTableRows(source, targetSchemas[domain], sourceTable, targetTable);
      const privateSqlDir = path.join(dir, "sql", domain);
      await import("node:fs/promises").then(({ mkdir }) => mkdir(privateSqlDir, { recursive: true, mode: 0o700 }));
      const chunks = insertSqlFile(transformed.rows, transformed.columns, targetTable);
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
        insertedSourceRows: transformed.rows.length,
        insertBatches: chunks.length,
        transformation: sourceTable === targetTable ? "columns copied; LINE IDs resolved where required" : `${sourceTable} -> ${targetTable}`,
      });
      console.log(`${domain}: copied ${transformed.rows.length} rows from ${sourceTable} to ${targetTable}`);
    }
  }
} finally {
  source.close();
  for (const db of Object.values(targetSchemas)) db.close();
}

metadata.migrationTables = results;
metadata.migrationStatus = "COPIED_AWAITING_VERIFICATION";
await writeJson(path.join(dir, "metadata.json"), metadata);
console.log(`Copied ${results.length} mapped source tables. Old jshs-db was not modified.`);
