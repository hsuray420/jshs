import { createHash, randomInt } from "node:crypto";
import path from "node:path";
import { readFile, readdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { DOMAINS, ROOT, migrationDir, sqlIdentifier, writeJson } from "./common.mjs";
import { TABLE_MAP, getColumns, getTableNames, rowCount, sourcePrimaryKey } from "./mapping.mjs";

export function openSnapshot(file) {
  return new DatabaseSync(file, { readOnly: true });
}

export function listDomainTables(domain) {
  return Object.entries(TABLE_MAP[domain]).map(([source, target]) => ({ source, target }));
}

export async function loadTargetSchema(domain) {
  const spec = DOMAINS[domain];
  const dir = path.join(ROOT, "db", "migrations", spec.migrationDir);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  if (!files.length) throw new Error(`No schema SQL files found for ${domain}`);
  const db = new DatabaseSync(":memory:");
  for (const file of files) db.exec(await readFile(path.join(dir, file), "utf8"));
  return db;
}

export async function applyTargetSchema(target, domain, wrangler) {
  const spec = DOMAINS[domain];
  const dir = path.join(ROOT, "db", "migrations", spec.migrationDir);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  if (!files.length) throw new Error(`No schema SQL files found for ${domain}`);
  for (const file of files) {
    wrangler(["d1", "execute", target, "--remote", "--file", path.join(dir, file), "--yes"]);
  }
}

export async function findOrCreateD1(domain, metadata, wrangler, parseJsonOutput) {
  const spec = DOMAINS[domain];
  let entry = findDatabase(parseJsonOutput(wrangler(["d1", "list", "--json"]).stdout), spec.database);
  let createdThisRun = false;
  if (!entry) {
    console.log(`Creating ${spec.database} in APAC (resource only; no Worker binding change)...`);
    metadata.creationIntents ??= {};
    metadata.creationIntents[domain] ??= { startedAt: new Date().toISOString() };
    await writeJson(`${migrationDir()}/metadata.json`, metadata);
    try {
      const created = parseJsonOutput(wrangler(["d1", "create", spec.database, "--location=apac"]).stdout);
      entry = findDatabase(created, spec.database);
      createdThisRun = Boolean(entry);
    } catch {
      entry = findDatabase(parseJsonOutput(wrangler(["d1", "list", "--json"]).stdout), spec.database);
      if (!entry || !wasCreatedAfterIntent(entry, metadata.creationIntents[domain])) {
        throw new Error(`Could not safely determine whether ${spec.database} was created; no database will be modified`);
      }
      createdThisRun = true;
    }
    if (!entry) {
      entry = findDatabase(parseJsonOutput(wrangler(["d1", "list", "--json"]).stdout), spec.database);
      if (!entry || !wasCreatedAfterIntent(entry, metadata.creationIntents[domain])) {
        throw new Error(`Could not verify newly-created D1 ${spec.database} in the account inventory`);
      }
      createdThisRun = true;
    }
  }
  const id = entry?.uuid ?? entry?.database_id ?? entry?.databaseId ?? entry?.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{30,40}$/i.test(id)) throw new Error(`Could not verify D1 ID for ${spec.database}`);
  const previous = metadata.databaseIds?.[domain];
  if (previous && previous !== id) throw new Error(`Database ID for ${spec.database} changed from this run's checkpoint`);
  if (!previous && !createdThisRun && !wasCreatedAfterIntent(entry, metadata.creationIntents?.[domain])) {
    throw new Error(`${spec.database} already exists but is not recorded as created by this migration run`);
  }
  if (!previous) await assertD1Empty(spec.database, wrangler, parseJsonOutput);
  metadata.databaseIds ??= {};
  metadata.databaseIds[domain] = id;
  metadata.domains[domain].id = id;
  await writeJson(`${migrationDir()}/metadata.json`, metadata);

  if (createdThisRun) {
    metadata.createdDatabaseIds ??= [];
    if (!metadata.createdDatabaseIds.includes(id)) metadata.createdDatabaseIds.push(id);
    await writeJson(`${migrationDir()}/metadata.json`, metadata);
  }
  return { name: spec.database, id };
}

function findDatabase(value, name) {
  return findObject(value, (item) => item.name === name || item.database_name === name);
}

function wasCreatedAfterIntent(entry, intent) {
  const timestamp = entry.created_at ?? entry.created_on ?? entry.createdAt ?? entry.createdOn;
  if (!intent?.startedAt || typeof timestamp !== "string") return false;
  const started = Date.parse(intent.startedAt);
  const created = Date.parse(timestamp);
  return Number.isFinite(started) && Number.isFinite(created) && created >= started - 60_000;
}

async function assertD1Empty(name, wrangler, parseJsonOutput) {
  const info = parseJsonOutput(wrangler(["d1", "info", name, "--json"]).stdout);
  const knownCount = findNumber(info, ["num_tables", "table_count", "tables_count"]);
  if (knownCount !== null && knownCount !== 0) throw new Error(`New D1 ${name} unexpectedly contains tables`);
  const response = parseJsonOutput(wrangler([
    "d1", "execute", name, "--remote", "--command",
    "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    "--json",
  ]).stdout);
  const count = findNumber(response, ["count"]);
  if (count !== 0) throw new Error(`Could not prove new D1 ${name} is empty; refusing to migrate into it`);
}

function findObject(value, predicate) {
  if (!value || typeof value !== "object") return null;
  if (!Array.isArray(value) && predicate(value)) return value;
  for (const nested of Object.values(value)) {
    const found = findObject(nested, predicate);
    if (found) return found;
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

export function readRows(db, table) {
  const pk = sourcePrimaryKey(db, table);
  const order = pk.length ? ` ORDER BY ${pk.map(sqlIdentifier).join(", ")}` : " ORDER BY rowid";
  return db.prepare(`SELECT * FROM ${sqlIdentifier(table)}${order}`).all();
}

export function makeIdentityMap(db) {
  const names = new Set(getTableNames(db));
  const map = new Map();
  if (!names.has("user_identities")) return map;
  for (const identity of db.prepare("SELECT user_id, provider_user_id FROM user_identities WHERE provider = 'line'").all()) {
    if (typeof identity.provider_user_id === "string" && typeof identity.user_id === "string") map.set(identity.provider_user_id, identity.user_id);
  }
  return map;
}

export function transformTableRows(sourceDb, targetDb, sourceTable, targetTable) {
  const targetColumns = getColumns(targetDb, targetTable);
  if (!targetColumns.length) throw new Error(`Target table ${targetTable} does not exist`);
  const sourceColumns = getColumns(sourceDb, sourceTable).map((column) => column.name);
  const targetNames = new Set(targetColumns.map((column) => column.name));
  const mapping = makeIdentityMap(sourceDb);
  const rows = readRows(sourceDb, sourceTable);
  const transformed = rows.map((original) => transformRow(original, sourceTable, targetTable, targetColumns, targetNames, mapping));
  return { rows: transformed, columns: targetColumns, identityMap: mapping, sourceColumns };
}

export function transformRow(original, sourceTable, targetTable, targetColumns, targetNames, identityMap) {
  const row = normalizeRow(original);
  if (sourceTable === "jshs_users" && targetTable === "users") {
    if (Object.hasOwn(row, "user_id") && !Object.hasOwn(row, "id")) row.id = row.user_id;
    delete row.user_id;
  }
  if (sourceTable === "school_media_overrides" && targetTable === "school_media_metadata") {
    if (!Object.hasOwn(row, "sort_order")) row.sort_order = 0;
    if (!Object.hasOwn(row, "is_cover")) row.is_cover = 1;
    if (!Object.hasOwn(row, "source_url")) row.source_url = "";
    if (!Object.hasOwn(row, "credit")) row.credit = "";
  }

  if (Object.hasOwn(row, "line_user_id") && targetNames.has("user_id")) {
    const mapped = identityMap.get(row.line_user_id);
    if (!mapped) throw new Error(`Unmapped LINE identity in ${sourceTable}; refusing to invent an owner`);
    if (row.user_id && row.user_id !== mapped) throw new Error(`Conflicting internal/LINE identity in ${sourceTable}`);
    row.user_id = mapped;
  }
  if (targetTable === "line_friendships" && !targetNames.has("line_user_id") && Object.hasOwn(row, "line_user_id")) {
    const mapped = identityMap.get(row.line_user_id);
    if (!mapped) throw new Error("Unmapped LINE friendship; refusing to invent an owner");
    row.user_id = mapped;
  }

  const sourceNames = Object.keys(row);
  const dropped = sourceNames.filter((name) => !targetNames.has(name) && name !== "line_user_id");
  if (dropped.length) throw new Error(`Schema mismatch for ${sourceTable}: target ${targetTable} would drop columns (${dropped.join(", ")})`);

  for (const column of targetColumns) {
    if (Object.hasOwn(row, column.name)) continue;
    if (column.notnull && column.dflt_value === null && Number(column.pk) === 0) {
      throw new Error(`Target ${targetTable}.${column.name} is required but has no source/default`);
    }
    if (column.dflt_value !== null) row[column.name] = parseSqlDefault(column.dflt_value);
  }

  return Object.fromEntries(targetColumns
    .filter((column) => Object.hasOwn(row, column.name))
    .map((column) => [column.name, row[column.name]]));
}

function parseSqlDefault(value) {
  if (/^NULL$/i.test(value)) return null;
  if (/^'.*'$/s.test(value)) return value.slice(1, -1).replaceAll("''", "'");
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  throw new Error(`Unsupported target schema default in ${value}; refusing to synthesize migration values`);
}

function normalizeRow(input) {
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = value instanceof Uint8Array ? Buffer.from(value) : value;
  }
  return output;
}

export function canonicalRow(row) {
  return JSON.stringify(Object.fromEntries(Object.keys(row).sort().map((key) => {
    const value = row[key];
    return [key, value instanceof Uint8Array || Buffer.isBuffer(value) ? { blobHex: Buffer.from(value).toString("hex") } : value];
  })));
}

export function tableFingerprint(rows) {
  const hash = createHash("sha256");
  for (const row of rows) hash.update(canonicalRow(row)).update("\n");
  return hash.digest("hex");
}

export function validateMigratedTable(sourceRows, targetRows, sourceTable, targetTable, targetSchema) {
  const oldCount = sourceRows.length;
  const newCount = targetRows.length;
  const targetColumns = getColumns(targetSchema, targetTable);
  const primaryKeyColumns = targetColumns.filter((column) => Number(column.pk) > 0).sort((a, b) => a.pk - b.pk).map((column) => column.name);
  const duplicateKeyCount = countDuplicateKeys(targetRows, primaryKeyColumns);
  const uniqueConstraintChecks = targetSchema.prepare(`PRAGMA index_list(${sqlIdentifier(targetTable)})`).all()
    .filter((index) => Number(index.unique) === 1)
    .map((index) => ({
      name: index.name,
      columns: targetSchema.prepare(`PRAGMA index_info(${sqlIdentifier(index.name)})`).all().map((column) => column.name),
    }))
    .filter((index) => index.columns.length > 0);
  const duplicateUniqueKeyCount = uniqueConstraintChecks.reduce((total, index) => total + countDuplicateKeys(targetRows, index.columns), 0);
  const targetByKey = new Map(targetRows.map((row) => [rowKey(row, primaryKeyColumns), row]));
  const oldByKey = new Map(sourceRows.map((row) => [rowKey(row, primaryKeyColumns), row]));
  const sortedSource = [...sourceRows].sort((a, b) => rowKey(a, primaryKeyColumns).localeCompare(rowKey(b, primaryKeyColumns)));
  const sortedTarget = [...targetRows].sort((a, b) => rowKey(a, primaryKeyColumns).localeCompare(rowKey(b, primaryKeyColumns)));
  const contentHashMatch = tableFingerprint(sortedSource) === tableFingerprint(sortedTarget);
  const samples = chooseSamples(sourceRows);
  const randomReadback = samples.random.every((row) => canonicalRow(row) === canonicalRow(targetByKey.get(rowKey(row, primaryKeyColumns)) ?? {}));
  const oldestNewestReadback = samples.oldestNewest.every((row) => canonicalRow(row) === canonicalRow(targetByKey.get(rowKey(row, primaryKeyColumns)) ?? {}));
  const failedReadback = [...samples.random, ...samples.oldestNewest]
    .filter((row) => !targetByKey.has(rowKey(row, primaryKeyColumns))).length;
  return {
    sourceTable,
    targetTable,
    oldCount,
    newCount,
    difference: newCount - oldCount,
    primaryKeyColumns,
    uniqueCheck: duplicateKeyCount === 0 && duplicateUniqueKeyCount === 0 ? "PASS" : "FAIL",
    duplicateKeyCount,
    uniqueConstraintChecks,
    duplicateUniqueKeyCount,
    contentHashMatch,
    randomReadback: randomReadback && !failedReadback ? "PASS" : "FAIL",
    oldestNewestReadback: oldestNewestReadback && !failedReadback ? "PASS" : "FAIL",
    rowConservation: oldCount === newCount && oldByKey.size === targetByKey.size ? "PASS" : "FAIL",
  };
}

function rowKey(row, columns) {
  if (!columns.length) return canonicalRow(row);
  return JSON.stringify(columns.map((column) => {
    const value = row[column];
    return value instanceof Uint8Array || Buffer.isBuffer(value) ? Buffer.from(value).toString("hex") : value;
  }));
}

function countDuplicateKeys(rows, columns) {
  if (!rows.length) return 0;
  if (!columns.length) return rows.length - new Set(rows.map(canonicalRow)).size;
  const keys = rows.filter((row) => columns.every((column) => row[column] !== null && row[column] !== undefined))
    .map((row) => rowKey(row, columns));
  return keys.length - new Set(keys).size;
}

function chooseSamples(rows) {
  if (!rows.length) return { random: [], oldestNewest: [] };
  const randomIndexes = new Set();
  while (randomIndexes.size < Math.min(3, rows.length)) randomIndexes.add(randomInt(rows.length));
  const dateColumn = ["created_at", "updated_at", "occurred_at", "checked_at"].find((column) => Object.hasOwn(rows[0], column));
  const sorted = dateColumn ? [...rows].sort((a, b) => String(a[dateColumn]).localeCompare(String(b[dateColumn]))) : rows;
  return { random: [...randomIndexes].map((index) => rows[index]), oldestNewest: rows.length === 1 ? [sorted[0]] : [sorted[0], sorted.at(-1)] };
}

export function migrationTableManifest(sourceDb) {
  const names = new Set(getTableNames(sourceDb));
  const result = {};
  for (const [domain, mapping] of Object.entries(TABLE_MAP)) {
    result[domain] = Object.entries(mapping)
      .filter(([source]) => names.has(source))
      .map(([source, target]) => ({ source, target, oldCount: rowCount(sourceDb, source) }));
  }
  return result;
}

export function insertSqlFile(rows, targetColumns, table, maxStatements = 60, maxBytes = 64 * 1024) {
  const names = Object.keys(rows[0] || {}).filter((name) => targetColumns.some((column) => column.name === name));
  if (!names.length && rows.length) throw new Error(`No compatible columns to migrate into ${table}`);
  const cols = names.map(sqlIdentifier).join(", ");
  const statements = rows.map((row) => `INSERT OR IGNORE INTO ${sqlIdentifier(table)} (${cols}) VALUES (${names.map((name) => sqlValue(row[name])).join(", ")});`);
  const chunks = [];
  let current = [];
  let currentBytes = 0;
  for (const statement of statements) {
    const bytes = Buffer.byteLength(statement, "utf8") + 1;
    if (bytes > maxBytes) throw new Error(`A ${table} row exceeds the safe D1 SQL batch size; refusing to truncate or partially encode it`);
    if (current.length && (current.length >= maxStatements || currentBytes + bytes > maxBytes)) {
      chunks.push(`${current.join("\n")}\n`);
      current = [];
      currentBytes = 0;
    }
    current.push(statement);
    currentBytes += bytes;
  }
  if (current.length) chunks.push(`${current.join("\n")}\n`);
  return chunks;
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}
