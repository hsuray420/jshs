-- COMMUNITY_DB: anonymous submissions and community moderation/publishing data.
-- Anonymous submission/review rows contain no member identity; votes use the stable JSHS UUID.
CREATE TABLE IF NOT EXISTS school_reviews (
  id TEXT PRIMARY KEY,
  district TEXT NOT NULL,
  school_code TEXT NOT NULL,
  school_name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名學長姐',
  graduation_year TEXT NOT NULL DEFAULT '',
  exam_score TEXT NOT NULL DEFAULT '',
  admission_score TEXT NOT NULL DEFAULT '',
  admission_result TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_school_reviews_school_created ON school_reviews(district, school_code, status, created_at);
CREATE TABLE IF NOT EXISTS school_review_rate_limits (
  fingerprint TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS data_reports (
  id TEXT PRIMARY KEY,
  page_url TEXT NOT NULL,
  category TEXT NOT NULL,
  dataset TEXT NOT NULL DEFAULT '',
  academic_year TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  current_value TEXT NOT NULL DEFAULT '',
  suggested_value TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_data_reports_status_created ON data_reports(status, created_at);
CREATE TABLE IF NOT EXISTS data_report_rate_limits (
  fingerprint TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS anonymous_submissions (
  id TEXT PRIMARY KEY,
  school_code TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS community_vote_topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ends_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS community_votes (
  topic_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(topic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_votes_topic ON community_votes(topic_id);

CREATE TABLE IF NOT EXISTS school_media_metadata (
  school_code TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  storage_provider TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL,
  credit TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS school_data_drafts (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  school_name TEXT NOT NULL,
  region_code TEXT NOT NULL,
  source_file TEXT NOT NULL,
  base_sha TEXT NOT NULL DEFAULT '',
  base_values_json TEXT NOT NULL,
  updates_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(school_code, region_code, created_by)
);
CREATE INDEX IF NOT EXISTS idx_school_data_drafts_status
  ON school_data_drafts(status, updated_at);
CREATE TABLE IF NOT EXISTS school_data_audit (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  school_code TEXT NOT NULL,
  school_name TEXT NOT NULL,
  region_code TEXT NOT NULL,
  source_file TEXT NOT NULL,
  field TEXT NOT NULL DEFAULT '',
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  commit_sha TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_school_data_audit_lookup ON school_data_audit(school_code, occurred_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  diff_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_files (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  visibility TEXT NOT NULL DEFAULT 'public',
  description TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'd1',
  external_file_id TEXT,
  external_url TEXT,
  file_blob BLOB
);
CREATE INDEX IF NOT EXISTS idx_admin_files_created_at ON admin_files(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_files_visibility ON admin_files(visibility);

CREATE TABLE IF NOT EXISTS deployment_events (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deployment_events_created_at ON deployment_events(created_at);

CREATE TABLE IF NOT EXISTS external_media_cleanup (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  file_id TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, file_id)
);

CREATE TABLE IF NOT EXISTS admin_rate_limits (
  key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_entries (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(content_type, slug)
);
CREATE INDEX IF NOT EXISTS idx_content_entries_public
  ON content_entries(content_type, status, updated_at);

CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  revision INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_revisions_entry
  ON content_revisions(content_id, revision DESC);
