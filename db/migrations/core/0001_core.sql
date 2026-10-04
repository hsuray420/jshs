-- CORE_DB: member identity, account settings, and favorites only.
-- No foreign keys cross D1 database boundaries.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  picture_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities(user_id);

CREATE TABLE IF NOT EXISTS line_friendships (
  user_id TEXT PRIMARY KEY,
  is_friend INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_settings (
  user_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, setting_key)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  school_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, school_code)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at);
