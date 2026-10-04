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

CREATE TABLE IF NOT EXISTS member_notification_preferences (
  user_id TEXT PRIMARY KEY,
  planner_finalized_enabled INTEGER NOT NULL DEFAULT 1,
  score_calculated_enabled INTEGER NOT NULL DEFAULT 1,
  important_date_enabled INTEGER NOT NULL DEFAULT 1,
  weekly_report_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  school_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, school_code)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_settings (
  event_key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  body_template TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS important_dates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  send_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  sent_at TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '116',
  district TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'pending',
  source_url TEXT NOT NULL DEFAULT '',
  source_pages TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_important_dates_dispatch
  ON important_dates(enabled, send_at, sent_at);
