import { createHash } from "node:crypto";
import { sqlIdentifier } from "./common.mjs";
import { getColumns, getTableNames } from "./mapping.mjs";

const UUID_NAMESPACE = "jshs-storage-migration-line-identity-v1";
export function analyzeLegacyOwnership(db, previousMap = {}, generatedAt = new Date().toISOString()) {
  const tables = getTableNames(db);
  const tableSet = new Set(tables);
  const columnsByTable = new Map(tables.map((table) => [
    table,
    new Set(getColumns(db, table).map((column) => column.name)),
  ]));
  const plannerChildTables = tables.filter((table) => table !== "member_planners" && columnsByTable.get(table).has("planner_id"));
  const usersTable = tableSet.has("jshs_users") ? "jshs_users" : tableSet.has("users") ? "users" : null;
  if (!usersTable || !tableSet.has("user_identities")) {
    throw new Error("Legacy users and user_identities tables are required to safely backfill member ownership");
  }
  const userColumns = columnsByTable.get(usersTable);
  const userIdColumn = userColumns.has("id") ? "id" : userColumns.has("user_id") ? "user_id" : null;
  if (!userIdColumn) throw new Error("Legacy user table has no stable identity key");

  const users = new Set(db.prepare(`SELECT ${sqlIdentifier(userIdColumn)} AS id FROM ${sqlIdentifier(usersTable)}`).all()
    .map((row) => row.id).filter((id) => typeof id === "string" && id.length));
  const identities = readExistingLineIdentities(db, users);
  const candidates = new Map();
  const ownershipTableCounts = {};
  const ownershipConflicts = [];
  const directUserPairs = [];

  for (const table of tables) {
    const columns = columnsByTable.get(table);
    if (table === "line_users" || table === "line_friendships" || plannerChildTables.includes(table)) continue;
    if (!columns.has("line_user_id")) continue;
    const rows = db.prepare(`SELECT line_user_id${columns.has("user_id") ? ", user_id" : ""} FROM ${sqlIdentifier(table)}`).all();
    const perIdentity = new Map();
    for (const row of rows) {
      const lineId = row.line_user_id;
      if (typeof lineId !== "string" || !lineId.trim()) {
        if (/^member_/i.test(table)) ownershipConflicts.push({ table, reason: "member_row_missing_line_identity" });
        continue;
      }
      addCandidate(candidates, lineId, table);
      perIdentity.set(lineId, (perIdentity.get(lineId) ?? 0) + 1);
      if (row.user_id) directUserPairs.push({ table, lineId, userId: row.user_id });
    }
    if (perIdentity.size) {
      ownershipTableCounts[table] = Object.fromEntries([...perIdentity].map(([id, count]) => [id, count]));
    }
  }
  for (const table of tables) {
    if (table === "user_identities" || !columnsByTable.get(table).has("user_id")) continue;
    const rows = db.prepare(`SELECT user_id FROM ${sqlIdentifier(table)} WHERE user_id IS NOT NULL AND user_id != ''`).all();
    for (const row of rows) {
      if (!users.has(row.user_id)) ownershipConflicts.push({ table, reason: "user_id_references_missing_jshs_user" });
    }
  }

  const plannerParents = new Map();
  const plannerIdsByOwner = new Map();
  if (tableSet.has("member_planners")) {
    const columns = columnsByTable.get("member_planners");
    if (!columns.has("line_user_id") || !columns.has("planner_id")) {
      ownershipConflicts.push({ table: "member_planners", reason: "planner_parent_missing_owner_columns" });
    } else {
      const rows = db.prepare("SELECT line_user_id, planner_id FROM member_planners").all();
      for (const row of rows) {
        if (typeof row.line_user_id !== "string" || !row.line_user_id.trim()
          || typeof row.planner_id !== "string" || !row.planner_id.trim()) {
          ownershipConflicts.push({ table: "member_planners", reason: "planner_parent_missing_owner_or_planner_id" });
          continue;
        }
        addCandidate(candidates, row.line_user_id, "member_planners");
        const owners = plannerParents.get(row.planner_id) ?? new Set();
        owners.add(row.line_user_id);
        plannerParents.set(row.planner_id, owners);
        const ownedPlannerIds = plannerIdsByOwner.get(row.line_user_id) ?? new Set();
        ownedPlannerIds.add(row.planner_id);
        plannerIdsByOwner.set(row.line_user_id, ownedPlannerIds);
      }
    }
  }
  const lineAliases = new Map([...candidates.keys()].sort().map((lineId, index) => [lineId, `legacy-line-${index + 1}`]));
  for (const [lineId, candidate] of candidates) candidate.alias = lineAliases.get(lineId);
  for (const [lineId, plannerIds] of plannerIdsByOwner) {
    if (plannerIds.size > 1) {
      ownershipConflicts.push({ table: "member_planners", reason: "one_member_has_multiple_planner_ids", alias: lineAliases.get(lineId) });
    }
  }
  for (const [plannerId, owners] of plannerParents) {
    if (owners.size > 1) {
      ownershipConflicts.push({ table: "member_planners", reason: "planner_has_multiple_line_owners", plannerId });
    }
  }

  const plannerValues = new Map();
  for (const table of plannerChildTables) {
    for (const row of db.prepare(`SELECT planner_id FROM ${sqlIdentifier(table)}`).all()) {
      if (typeof row.planner_id !== "string" || !row.planner_id.trim()) {
        ownershipConflicts.push({ table, reason: "planner_child_missing_planner_id" });
        continue;
      }
      plannerValues.set(row.planner_id, (plannerValues.get(row.planner_id) ?? 0) + 1);
    }
  }

  const plannerAliases = new Map([...new Set([...plannerParents.keys(), ...plannerValues.keys()])]
    .sort().map((plannerId, index) => [plannerId, `legacy-planner-${index + 1}`]));
  const plannerDrops = [];
  const plannerOwnerChecks = [];
  const resolvedOrphanPlannerIds = new Set();
  for (const table of plannerChildTables) {
    const columns = columnsByTable.get(table);
    const selected = ["planner_id", ...(columns.has("line_user_id") ? ["line_user_id"] : []), ...(columns.has("user_id") ? ["user_id"] : [])];
    const rows = db.prepare(`SELECT ${selected.map(sqlIdentifier).join(", ")} FROM ${sqlIdentifier(table)}`).all();
    const counts = new Map();
    for (const row of rows) {
      const owners = plannerParents.get(row.planner_id) ?? new Set();
      if (owners.size > 1) {
        ownershipConflicts.push({ table, reason: "planner_child_has_multiple_owners", plannerAlias: plannerAliases.get(row.planner_id) });
        continue;
      }
      if (owners.size === 1) {
        const owner = [...owners][0];
        if ((row.line_user_id && row.line_user_id !== owner)
          || (row.user_id && identities.byLine.get(owner)?.userId && row.user_id !== identities.byLine.get(owner).userId)) {
          ownershipConflicts.push({ table, reason: "planner_child_owner_conflicts_with_parent", plannerAlias: plannerAliases.get(row.planner_id) });
        }
      } else if (owners.size === 0
        && ((row.line_user_id && (identities.byLine.has(row.line_user_id) || candidates.has(row.line_user_id)))
          || (row.user_id && users.has(row.user_id)))) {
        resolvedOrphanPlannerIds.add(row.planner_id);
        ownershipConflicts.push({ table, reason: "orphan_planner_has_resolved_owner_without_parent", plannerAlias: plannerAliases.get(row.planner_id) });
      }
      const key = row.planner_id;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [plannerId, count] of counts) {
      const owners = plannerParents.get(plannerId) ?? new Set();
      const alias = plannerAliases.get(plannerId);
      if (owners.size === 0) {
        if (resolvedOrphanPlannerIds.has(plannerId)) continue;
        plannerDrops.push({
          sourceTable: table,
          plannerId,
          plannerAlias: alias,
          rowCount: count,
          classification: "DROP_AS_UNRESOLVED_LEGACY",
          reason: "unresolved_owner",
          action: "dropped_from_migration",
        });
        continue;
      }
      plannerOwnerChecks.push({ sourceTable: table, plannerAlias: alias, ownerAlias: candidates.get([...owners][0]).alias, rowCount: count });
    }
  }

  for (const conflict of ownershipConflicts) {
    if (conflict.alias || conflict.plannerAlias) continue;
    if (conflict.plannerId) conflict.plannerAlias = plannerAliases.get(conflict.plannerId);
    delete conflict.plannerId;
  }
  if (ownershipConflicts.length) {
    const reasons = [...new Set(ownershipConflicts.map((item) => item.reason))].join(", ");
    throw new Error(`Unresolved legacy ownership conflict(s): ${reasons}`);
  }

  const identityBackfillMap = {};
  const backfillRows = [];
  const reservedUserIds = new Set(users);
  const reservedIdentityIds = new Set(identities.identityIds);
  for (const [lineId, candidate] of [...candidates].sort(([a], [b]) => a.localeCompare(b))) {
    const existing = identities.byLine.get(lineId);
    if (existing) {
      identityBackfillMap[lineId] = {
        alias: candidate.alias,
        userId: existing.userId,
        identityId: existing.identityId,
        source: "existing_mapping",
        tables: [...candidate.tables].sort(),
      };
      continue;
    }
    const saved = previousMap[lineId];
    const userId = saved?.userId ?? stableUuid("user", lineId);
    const identityId = saved?.identityId ?? stableUuid("identity", lineId);
    if (!isUuid(userId) || !isUuid(identityId)) {
      throw new Error(`Persisted identity backfill is invalid for ${candidate.alias}; refusing to change or recreate its UUID`);
    }
    if (reservedUserIds.has(userId) || reservedIdentityIds.has(identityId)) {
      throw new Error(`Deterministic identity collision for ${candidate.alias}; refusing to backfill`);
    }
    reservedUserIds.add(userId);
    reservedIdentityIds.add(identityId);
    const mapping = {
      alias: candidate.alias,
      userId,
      identityId,
      source: "generated_backfill",
      tables: [...candidate.tables].sort(),
      createdAt: saved?.createdAt ?? generatedAt,
    };
    identityBackfillMap[lineId] = mapping;
    backfillRows.push({ lineUserId: lineId, ...mapping });
  }
  for (const pair of directUserPairs) {
    if (identityBackfillMap[pair.lineId].userId !== pair.userId) {
      throw new Error(`Conflicting internal and LINE owners in ${pair.table} for ${candidates.get(pair.lineId).alias}`);
    }
  }

  const candidateAudit = [...candidates].sort(([a], [b]) => a.localeCompare(b)).map(([lineId, candidate]) => ({
    alias: candidate.alias,
    tables: [...candidate.tables].sort().map((table) => ({
      table,
      rowCount: ownershipTableCounts[table]?.[lineId] ?? 0,
    })),
    plannerIds: [...(plannerIdsByOwner.get(lineId) ?? [])].map((id) => plannerAliases.get(id)).sort(),
    existingMapping: identities.byLine.has(lineId),
    backfillRequired: !identities.byLine.has(lineId),
  }));

  const summary = {
    candidateIdentityCount: candidates.size,
    generatedBackfillCount: backfillRows.length,
    existingMappingCount: candidates.size - backfillRows.length,
    lineUsersNotPromoted: tableSet.has("line_users")
      ? countUnreferencedLineUsers(db, candidates)
      : 0,
    plannerChildRowCount: [...plannerValues.values()].reduce((total, count) => total + count, 0),
    uniquelyOwnedPlannerChildRowCount: plannerOwnerChecks.reduce((total, item) => total + item.rowCount, 0),
    explicitlyDroppedPlannerChildRowCount: plannerDrops.reduce((total, item) => total + item.rowCount, 0),
    ownershipConflictCount: 0,
    orphanCountAfterPolicy: 0,
    duplicateLineMappingCount: 0,
    duplicateInternalLineIdentityCount: 0,
  };

  return {
    usersTable,
    userIdColumn,
    identityBackfillMap,
    backfillRows,
    plannerDrops,
    plannerOwnerChecks,
    plannerChildTables,
    candidateAudit,
    summary,
  };
}

export function buildBackfillRowsForCore(identityBackfillMap, timestamp) {
  const users = [];
  const identities = [];
  for (const [lineUserId, mapping] of Object.entries(identityBackfillMap)) {
    if (mapping.source !== "generated_backfill") continue;
    const createdAt = mapping.createdAt ?? timestamp;
    users.push({
      id: mapping.userId,
      display_name: "",
      picture_url: "",
      created_at: createdAt,
      updated_at: createdAt,
      last_login_at: createdAt,
    });
    identities.push({
      id: mapping.identityId,
      user_id: mapping.userId,
      provider: "line",
      provider_user_id: lineUserId,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }
  return { users, identities };
}

export function filterPlannerOrphans(sourceTable, rows, plannerDrops) {
  const droppedIds = new Set(plannerDrops.filter((item) => item.sourceTable === sourceTable).map((item) => item.plannerId));
  if (droppedIds.size === 0) return { rows, droppedCount: 0 };
  const retained = rows.filter((row) => !droppedIds.has(row.planner_id));
  return { rows: retained, droppedCount: rows.length - retained.length };
}

function readExistingLineIdentities(db, users) {
  const columns = new Set(getColumns(db, "user_identities").map((column) => column.name));
  for (const required of ["user_id", "provider", "provider_user_id", "id"]) {
    if (!columns.has(required)) throw new Error(`user_identities is missing required column ${required}`);
  }
  const rows = db.prepare("SELECT id, user_id, provider_user_id FROM user_identities WHERE provider = 'line'").all();
  const byLine = new Map();
  const identitiesByUser = new Map();
  const identityIds = new Set();
  for (const row of rows) {
    if (!row.provider_user_id || !row.user_id || !row.id) throw new Error("Existing LINE identity mapping has an empty key");
    if (!users.has(row.user_id)) throw new Error("Existing LINE identity points to a missing JSHS user");
    if (byLine.has(row.provider_user_id)) {
      if (byLine.get(row.provider_user_id).userId !== row.user_id) {
        throw new Error("An existing LINE identity maps to conflicting JSHS users");
      }
      throw new Error("Duplicate rows exist for an existing LINE identity mapping");
    }
    const previousLine = identitiesByUser.get(row.user_id);
    if (previousLine && previousLine !== row.provider_user_id) {
      throw new Error("One JSHS user maps to multiple LINE identities");
    }
    if (identityIds.has(row.id)) throw new Error("Duplicate primary key in existing LINE identity mappings");
    byLine.set(row.provider_user_id, { userId: row.user_id, identityId: row.id });
    identitiesByUser.set(row.user_id, row.provider_user_id);
    identityIds.add(row.id);
  }
  return { byLine, identityIds };
}

function addCandidate(candidates, lineId, table) {
  const candidate = candidates.get(lineId) ?? { tables: new Set() };
  candidate.tables.add(table);
  candidates.set(lineId, candidate);
}

function countUnreferencedLineUsers(db, candidates) {
  const rows = db.prepare("SELECT line_user_id FROM line_users").all();
  const identities = new Set(rows.map((row) => row.line_user_id).filter(Boolean));
  return [...identities].filter((lineId) => !candidates.has(lineId)).length;
}

function stableUuid(kind, lineUserId) {
  const bytes = createHash("sha256").update(`${UUID_NAMESPACE}:${kind}:${lineUserId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
