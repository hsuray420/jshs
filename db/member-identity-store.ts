import { getCoreDatabase } from "./bindings";

export type JshsMember = Readonly<{
  userId: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  isFriend: boolean;
  checkedAt: string;
}>;

export async function ensureMemberIdentitySchema() {
  const db = getCoreDatabase();
  const usersTable = "users";
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS ${usersTable} (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      picture_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_identities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(provider, provider_user_id)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities(user_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS line_friendships (
      user_id TEXT PRIMARY KEY,
      is_friend INTEGER NOT NULL DEFAULT 0,
      checked_at TEXT NOT NULL
    )`),
  ]);
}

export async function ensureJshsMemberForLine(input: {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  isFriend: boolean;
}): Promise<JshsMember> {
  await ensureMemberIdentitySchema();
  const db = getCoreDatabase();
  const usersTable = "users";
  const now = new Date().toISOString();
  let identity = await db.prepare(`SELECT user_id FROM user_identities
    WHERE provider = 'line' AND provider_user_id = ? LIMIT 1`).bind(input.lineUserId).first<{ user_id: string }>();

  if (!identity) {
    const userId = crypto.randomUUID();
    try {
      await db.batch([
        db.prepare(`INSERT INTO ${usersTable} (id, display_name, picture_url, created_at, updated_at, last_login_at)
          VALUES (?, ?, ?, ?, ?, ?)`).bind(userId, input.displayName || "", input.pictureUrl || "", now, now, now),
        db.prepare(`INSERT INTO user_identities (id, user_id, provider, provider_user_id, created_at, updated_at)
          VALUES (?, ?, 'line', ?, ?, ?)`).bind(crypto.randomUUID(), userId, input.lineUserId, now, now),
      ]);
      identity = { user_id: userId };
    } catch {
      identity = await db.prepare(`SELECT user_id FROM user_identities
        WHERE provider = 'line' AND provider_user_id = ? LIMIT 1`).bind(input.lineUserId).first<{ user_id: string }>();
      if (!identity) throw new Error("member_identity_create_failed");
    }
  }

  await db.batch([
    db.prepare(`UPDATE ${usersTable} SET display_name = CASE WHEN ? != '' THEN ? ELSE display_name END,
      picture_url = CASE WHEN ? != '' THEN ? ELSE picture_url END, updated_at = ?, last_login_at = ? WHERE id = ?`)
      .bind(input.displayName || "", input.displayName || "", input.pictureUrl || "", input.pictureUrl || "", now, now, identity.user_id),
    db.prepare(`INSERT INTO line_friendships (user_id, is_friend, checked_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET is_friend = excluded.is_friend, checked_at = excluded.checked_at`)
      .bind(identity.user_id, input.isFriend ? 1 : 0, now),
  ]);

  return { userId: identity.user_id, lineUserId: input.lineUserId, displayName: input.displayName || "", pictureUrl: input.pictureUrl || "", isFriend: input.isFriend, checkedAt: now };
}

export async function listJshsMembers() {
  await ensureMemberIdentitySchema();
  const db = getCoreDatabase();
  const usersTable = "users";
  const result = await db.prepare(`SELECT users.id AS user_id, users.display_name, users.picture_url,
    users.created_at, users.last_login_at, identities.provider_user_id AS line_user_id,
    COALESCE(friendships.is_friend, 0) AS is_friend, friendships.checked_at
    FROM ${usersTable} AS users
    JOIN user_identities AS identities ON identities.user_id = users.id AND identities.provider = 'line'
    LEFT JOIN line_friendships AS friendships ON friendships.user_id = users.id
    ORDER BY users.last_login_at DESC LIMIT 200`).all<{
      user_id: string; display_name: string; picture_url: string; created_at: string; last_login_at: string;
      line_user_id: string; is_friend: number; checked_at: string | null;
    }>();
  return result.results ?? [];
}

export async function findJshsUserIdForLine(lineUserId: string) {
  await ensureMemberIdentitySchema();
  const db = getCoreDatabase();
  const identity = await db.prepare(`SELECT user_id FROM user_identities
    WHERE provider = 'line' AND provider_user_id = ? LIMIT 1`)
    .bind(lineUserId).first<{ user_id: string }>();
  return identity?.user_id ?? null;
}

export async function getLatestLineVerification() {
  await ensureMemberIdentitySchema();
  const db = getCoreDatabase();
  const result = await db.prepare("SELECT MAX(checked_at) AS checked_at FROM line_friendships")
    .first<{ checked_at: string | null }>();
  return result?.checked_at ?? null;
}
