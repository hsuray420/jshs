import { chmod, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ROOT, ensurePrivateDir, parseJsonOutput, readJson, sha256, writeJson, wrangler } from "./common.mjs";
import { findDomain, getColumns, getTableNames, inspectIdentity, rowCount, sourcePrimaryKey } from "./mapping.mjs";
import { readRows, tableFingerprint } from "./data.mjs";

const dir = await ensurePrivateDir();
const metadataPath = path.join(dir, "metadata.json");
const metadata = await readJson(metadataPath);
const configPath = path.join(ROOT, "wrangler.jsonc");
const config = JSON.parse(await readFile(configPath, "utf8"));
const expectedId = metadata.legacyDatabase.id;
const configured = config.d1_databases?.find((entry) => entry.binding === "DB" && entry.database_name === "jshs-db");
if (!configured || configured.database_id !== expectedId) throw new Error("Legacy D1 config changed after prepare; refusing to access a different database");

console.log("Checking that the authenticated ImageKit smoke endpoint is already available on the production site...");
let smokeEndpoint;
try {
  smokeEndpoint = await fetch("https://jshs.cc/api/admin/system/imagekit-smoke", {
    method: "OPTIONS",
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
} catch {
  throw new Error("Cannot verify the production ImageKit smoke endpoint; publish this package through the normal GitHub → Cloudflare workflow before running migration");
}
if (![204, 405].includes(smokeEndpoint.status)) {
  throw new Error(`Production ImageKit smoke endpoint is not ready (HTTP ${smokeEndpoint.status}); publish this package through the normal GitHub → Cloudflare workflow before running migration`);
}

console.log("Checking authenticated Cloudflare account...");
const whoami = parseJsonOutput(wrangler(["whoami", "--json"]).stdout);
const accountIds = [...new Set((whoami.accounts ?? []).map((account) => account.id).filter((id) => typeof id === "string"))];
if (!accountIds.length) throw new Error("Wrangler returned no authenticated Cloudflare account");
metadata.cloudflareAccountIds = accountIds;

console.log("Confirming configured production D1 identity...");
const info = parseJsonOutput(wrangler(["d1", "info", "jshs-db", "--json"]).stdout);
const foundId = findString(info, ["database_id", "databaseId", "uuid"]);
const foundName = findString(info, ["name", "database_name", "databaseName"]);
if (foundId && foundId !== expectedId) throw new Error("Cloudflare D1 info returned an ID that does not match wrangler.jsonc");
if (foundName && foundName !== "jshs-db") throw new Error("Cloudflare D1 info returned an unexpected database name");
metadata.legacyDatabase.info = {
  id: foundId || expectedId,
  name: foundName || "jshs-db",
  sizeBytes: findNumber(info, ["file_size", "fileSize", "size_bytes", "sizeBytes"]),
  rawInfoSha256: sha256(JSON.stringify(info)),
};

console.log("Obtaining the D1 Time Travel bookmark when available...");
const timestamp = new Date().toISOString();
try {
  const travel = parseJsonOutput(wrangler(["d1", "time-travel", "info", "jshs-db", "--timestamp", timestamp, "--json"]).stdout);
  metadata.rollbackCheckpoint = {
    available: true,
    timestamp,
    bookmark: findString(travel, ["bookmark", "bookmark_id", "bookmarkId"]),
  };
  if (!metadata.rollbackCheckpoint.bookmark) metadata.rollbackCheckpoint.available = false;
} catch {
  metadata.rollbackCheckpoint = { available: false, timestamp, bookmark: null };
}

const exportPath = path.join(dir, "jshs-db.full-export.sql");
console.log("Exporting complete legacy D1 schema and data to the private backup directory...");
wrangler(["d1", "export", "jshs-db", "--remote", "--output", exportPath, "--skip-confirmation"], { timeout: 60 * 60 * 1000 });
const exportStat = await stat(exportPath).catch(() => null);
if (!exportStat?.isFile() || exportStat.size < 32) throw new Error("Legacy D1 export is missing or unexpectedly empty; STOP");
await chmod(exportPath, 0o600);
const dump = await readFile(exportPath, "utf8");
if (!/CREATE TABLE/i.test(dump)) throw new Error("Legacy D1 export does not contain a schema; STOP");
metadata.backup = { file: exportPath, bytes: exportStat.size, sha256: sha256(dump), complete: true };
await writeJson(metadataPath, metadata);

console.log("Reading exported SQL into a private local SQLite snapshot and counting real production tables...");
const snapshotPath = path.join(dir, "legacy-snapshot.sqlite");
await writeFile(snapshotPath, Buffer.alloc(0), { mode: 0o600 });
const snapshot = new DatabaseSync(snapshotPath);
try {
  snapshot.exec(dump);
} catch (error) {
  snapshot.close();
  throw new Error(`Cannot load full D1 export for inventory (${error instanceof Error ? error.message.slice(0, 180) : "SQLite error"}); STOP`);
}
await chmod(snapshotPath, 0o600);

const tables = getTableNames(snapshot).map((table) => {
  const columns = getColumns(snapshot, table);
  return {
    name: table,
    domain: findDomain(table),
    rowCount: rowCount(snapshot, table),
    primaryKey: sourcePrimaryKey(snapshot, table),
    fingerprint: tableFingerprint(readRows(snapshot, table)),
    columns: columns.map((column) => ({
      name: column.name,
      type: column.type,
      notNull: Boolean(column.notnull),
      primaryKeyPosition: Number(column.pk),
    })),
  };
});
const identity = inspectIdentity(snapshot);
snapshot.close();

const errors = Object.entries(identity)
  .filter(([key, value]) => key.endsWith("Count") && typeof value === "number" && value > 0)
  .map(([key, value]) => ({ check: key, failures: value }));
if (!identity.identityCheckAvailable) errors.push({ check: "identityCheckAvailable", failures: 1 });
if (!identity.lineMappingsResolve) errors.push({ check: "lineMappingsResolve", failures: 1 });

const inventory = {
  capturedAt: new Date().toISOString(),
  database: { name: "jshs-db", id: expectedId, sizeBytes: metadata.legacyDatabase.info.sizeBytes },
  backup: metadata.backup,
  timeTravel: metadata.rollbackCheckpoint,
  tables,
  identity,
  identityChecks: errors.length ? "FAIL" : "PASS",
  identityFailures: errors,
};
await writeJson(path.join(dir, "inventory.json"), inventory);
console.log(`Backup PASS (${exportStat.size} bytes). Inventoried ${tables.length} tables.`);
console.log(`Identity/orphan preflight: ${inventory.identityChecks}.`);
for (const table of tables) console.log(`${table.name}: ${table.rowCount} rows [${table.domain}]`);
if (errors.length) {
  console.error("Unresolved identity or orphan conflicts detected. No new D1 databases have been created.");
  process.exitCode = 2;
}

function findString(value, keys) {
  if (!value || typeof value !== "object") return null;
  for (const [key, item] of Object.entries(value)) {
    if (keys.includes(key) && typeof item === "string") return item;
    const nested = findString(item, keys);
    if (nested) return nested;
  }
  return null;
}

function findNumber(value, keys) {
  if (!value || typeof value !== "object") return null;
  for (const [key, item] of Object.entries(value)) {
    if (keys.includes(key) && Number.isFinite(Number(item))) return Number(item);
    const nested = findNumber(item, keys);
    if (nested !== null) return nested;
  }
  return null;
}
