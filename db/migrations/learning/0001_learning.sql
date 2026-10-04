-- LEARNING_DB: member-owned learning records. user_id is the stable JSHS UUID.
-- A nullable line_user_id exists only for imported legacy rows.
CREATE TABLE IF NOT EXISTS member_mock_exams (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  line_user_id TEXT,
  name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  subjects_json TEXT NOT NULL,
  essay TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_mock_exams_user_date ON member_mock_exams(user_id, exam_date DESC);

CREATE TABLE IF NOT EXISTS member_score_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  line_user_id TEXT,
  district TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  total_score REAL NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_score_history_user_created ON member_score_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_session_id TEXT,
  subject_code TEXT NOT NULL,
  score REAL,
  grade TEXT,
  percentile REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subject_scores (
  id TEXT PRIMARY KEY,
  exam_result_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  score REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS weakness_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  mastery_score REAL NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  confidence REAL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_weakness_profiles_user_updated ON weakness_profiles(user_id, updated_at);
CREATE TABLE IF NOT EXISTS analysis_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_user_created ON analysis_snapshots(user_id, created_at);

CREATE TABLE IF NOT EXISTS member_planners (
  user_id TEXT PRIMARY KEY,
  planner_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS planner_items (
  id TEXT PRIMARY KEY,
  planner_id TEXT NOT NULL,
  district TEXT NOT NULL,
  school_code TEXT NOT NULL,
  school_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_planner_items_owner_created ON planner_items(planner_id, created_at);
CREATE TABLE IF NOT EXISTS planner_states (
  planner_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS planner_confirmations (
  planner_id TEXT PRIMARY KEY,
  item_count INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  confirmed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS planner_versions (
  id TEXT PRIMARY KEY,
  planner_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  item_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_planner_versions_planner_created ON planner_versions(planner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS member_ai_conversations (
  user_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  conversation_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, conversation_id)
);
CREATE INDEX IF NOT EXISTS idx_member_ai_conversations_updated ON member_ai_conversations(user_id, updated_at);
