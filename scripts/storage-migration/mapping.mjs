import { sqlIdentifier } from "./common.mjs";

export const TABLE_MAP = Object.freeze({
  core: {
    jshs_users: "users",
    users: "users",
    user_identities: "user_identities",
    line_friendships: "line_friendships",
    favorites: "favorites",
    account_settings: "account_settings",
  },
  learning: {
    member_mock_exams: "member_mock_exams",
    member_score_history: "member_score_history",
    exam_sessions: "exam_sessions",
    exam_results: "exam_results",
    subject_scores: "subject_scores",
    weakness_profiles: "weakness_profiles",
    analysis_snapshots: "analysis_snapshots",
    member_planners: "member_planners",
    planner_items: "planner_items",
    planner_states: "planner_states",
    planner_confirmations: "planner_confirmations",
    planner_versions: "planner_versions",
    member_ai_conversations: "member_ai_conversations",
  },
  community: {
    school_reviews: "school_reviews",
    school_review_rate_limits: "school_review_rate_limits",
    data_reports: "data_reports",
    data_report_rate_limits: "data_report_rate_limits",
    anonymous_submissions: "anonymous_submissions",
    community_vote_topics: "community_vote_topics",
    community_votes: "community_votes",
    school_media_overrides: "school_media_metadata",
    school_media_metadata: "school_media_metadata",
    school_data_drafts: "school_data_drafts",
    school_data_audit: "school_data_audit",
    admin_audit_logs: "admin_audit_logs",
  },
});

export const PURPOSE = Object.freeze({
  core: "會員身份與必要帳號資料",
  learning: "會員學習、成績與規劃",
  community: "社群內容、審核、校務資料與媒體 metadata",
  legacy_system: "未列入本次三域 schema 的舊管理／通知／系統表；保留於 jshs-db",
});

export function findDomain(table) {
  for (const [domain, tables] of Object.entries(TABLE_MAP)) {
    if (Object.hasOwn(tables, table)) return domain;
  }
  return "legacy_system";
}

export function sourceForTarget(domain, target) {
  const matching = Object.entries(TABLE_MAP[domain]).filter(([, dest]) => dest === target).map(([source]) => source);
  return matching;
}

export function getColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${sqlIdentifier(table)})`).all();
}

export function getTableNames(db) {
  return db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all().map(({ name }) => name);
}

export function rowCount(db, table) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${sqlIdentifier(table)}`).get().count);
}

function countSql(db, statement, parameters = []) {
  return Number(db.prepare(statement).get(...parameters)?.count ?? 0);
}

function columnSet(db, table) {
  return new Set(getColumns(db, table).map((column) => column.name));
}

function ownerOrphanCount(db, table, identity) {
  const columns = columnSet(db, table);
  if (columns.has("user_id")) {
    return countSql(db, `SELECT COUNT(*) AS count FROM ${sqlIdentifier(table)} records
      LEFT JOIN ${sqlIdentifier(identity.usersTable)} users ON users.id = records.user_id
      WHERE records.user_id IS NOT NULL AND users.id IS NULL`);
  }
  if (columns.has("line_user_id")) {
    return countSql(db, `SELECT COUNT(*) AS count FROM ${sqlIdentifier(table)} records
      LEFT JOIN user_identities identities ON identities.provider = 'line'
        AND identities.provider_user_id = records.line_user_id
      WHERE records.line_user_id IS NOT NULL AND records.line_user_id != '' AND identities.user_id IS NULL`);
  }
  return 0;
}

export function inspectIdentity(db) {
  const result = {
    duplicateLineMappingCount: 0,
    duplicateInternalIdentityCount: 0,
    orphanIdentityCount: 0,
    usersWithoutIdentityCount: 0,
    duplicatePrimaryKeyCount: 0,
    unresolvedLearningOwnerCount: 0,
    orphanScoreCount: 0,
    orphanExamCount: 0,
    orphanPlannerCount: 0,
    orphanAiConversationCount: 0,
    identityConflictsCount: 0,
    checkedLearningTables: [],
  };
  const names = new Set(getTableNames(db));
  const usersTable = names.has("jshs_users") ? "jshs_users" : names.has("users") ? "users" : null;
  const hasIdentities = names.has("user_identities");

  if (!usersTable || !hasIdentities) {
    result.orphanIdentityCount = (usersTable ? 0 : 1) + (hasIdentities ? 0 : 1);
    result.identityCheckAvailable = false;
    return result;
  }
  result.identityCheckAvailable = true;
  const users = sqlIdentifier(usersTable);
  result.duplicatePrimaryKeyCount = countSql(db, `SELECT COUNT(*) AS count FROM (
    SELECT id FROM ${users} GROUP BY id HAVING id IS NULL OR COUNT(*) > 1)`);
  result.duplicateLineMappingCount = countSql(db, `SELECT COUNT(*) AS count FROM (
    SELECT provider_user_id FROM user_identities WHERE provider = 'line'
    GROUP BY provider_user_id HAVING provider_user_id IS NULL OR COUNT(*) > 1)`);
  result.duplicateInternalIdentityCount = countSql(db, `SELECT COUNT(*) AS count FROM (
    SELECT user_id, provider FROM user_identities GROUP BY user_id, provider HAVING COUNT(*) > 1)`);
  result.orphanIdentityCount = countSql(db, `SELECT COUNT(*) AS count FROM user_identities identities
    LEFT JOIN ${users} users ON users.id = identities.user_id WHERE users.id IS NULL`);
  result.usersWithoutIdentityCount = countSql(db, `SELECT COUNT(*) AS count FROM ${users} users
    LEFT JOIN user_identities identities ON identities.user_id = users.id
    WHERE identities.user_id IS NULL`);

  const lineMap = db.prepare(`SELECT provider_user_id, user_id FROM user_identities WHERE provider = 'line'`).all();
  const userMap = new Map(lineMap.map((row) => [row.provider_user_id, row.user_id]));

  for (const table of ["member_score_history", "member_mock_exams", "member_ai_conversations", "member_planners", "favorites", "community_votes"]) {
    if (!names.has(table)) continue;
    result.checkedLearningTables.push(table);
    result.unresolvedLearningOwnerCount += ownerOrphanCount(db, table, { usersTable });
  }
  for (const table of ["member_score_history"]) if (names.has(table)) result.orphanScoreCount += ownerOrphanCount(db, table, { usersTable });
  for (const table of ["member_mock_exams", "exam_sessions", "exam_results", "subject_scores"]) {
    if (names.has(table)) result.orphanExamCount += ownerOrphanCount(db, table, { usersTable });
  }
  for (const table of ["member_ai_conversations"]) if (names.has(table)) result.orphanAiConversationCount += ownerOrphanCount(db, table, { usersTable });

  for (const table of ["member_score_history", "member_mock_exams", "member_ai_conversations", "member_planners", "favorites", "community_votes"]) {
    if (!names.has(table)) continue;
    const columns = columnSet(db, table);
    if (columns.has("user_id") && columns.has("line_user_id")) {
      const mismatches = db.prepare(`SELECT records.user_id, records.line_user_id
        FROM ${sqlIdentifier(table)} records
        JOIN user_identities identities ON identities.provider = 'line'
          AND identities.provider_user_id = records.line_user_id
        WHERE records.line_user_id IS NOT NULL AND records.line_user_id != ''
          AND records.user_id IS NOT NULL AND records.user_id != identities.user_id`).all();
      result.identityConflictsCount += mismatches.length;
    }
  }

  if (names.has("member_planners")) {
    const columns = columnSet(db, "member_planners");
    if (columns.has("planner_id")) {
      for (const table of ["planner_items", "planner_states", "planner_confirmations", "planner_versions"]) {
        if (!names.has(table) || !columnSet(db, table).has("planner_id")) continue;
        result.orphanPlannerCount += countSql(db, `SELECT COUNT(*) AS count FROM ${sqlIdentifier(table)} child
          LEFT JOIN member_planners owners ON owners.planner_id = child.planner_id
          WHERE owners.planner_id IS NULL`);
        result.checkedLearningTables.push(table);
      }
    }
  } else {
    for (const table of ["planner_items", "planner_states", "planner_confirmations", "planner_versions"]) {
      if (names.has(table)) result.orphanPlannerCount += rowCount(db, table);
    }
  }
  result.lineIdentityCount = lineMap.length;
  result.internalUserCount = rowCount(db, usersTable);
  result.lineMappingsResolve = lineMap.every((row) => row.provider_user_id && row.user_id && userMap.get(row.provider_user_id) === row.user_id);
  return result;
}

export function sourcePrimaryKey(db, table) {
  return getColumns(db, table).filter((column) => Number(column.pk) > 0).sort((a, b) => a.pk - b.pk).map((column) => column.name);
}
