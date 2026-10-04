-- Prepared migration only. Apply through the Supabase migration workflow after
-- a row-conservation export from D1; do not run against production blindly.
create extension if not exists pgcrypto;
create schema if not exists jshs;

create table if not exists jshs.users (id uuid primary key default gen_random_uuid(), display_name text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_login_at timestamptz);
create table if not exists jshs.user_identities (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, provider text not null, provider_user_id text not null, created_at timestamptz not null default now(), unique(provider, provider_user_id));
create table if not exists jshs.line_friendships (user_id uuid primary key references jshs.users(id) on delete cascade, is_friend boolean not null default false, checked_at timestamptz not null default now());
create table if not exists jshs.exam_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, name text not null, exam_date date not null, created_at timestamptz not null default now());
create table if not exists jshs.exam_results (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, exam_session_id uuid references jshs.exam_sessions(id) on delete set null, subject_code text not null, score numeric, grade text, percentile numeric, created_at timestamptz not null default now());
create table if not exists jshs.subject_scores (id uuid primary key default gen_random_uuid(), exam_result_id uuid not null references jshs.exam_results(id) on delete cascade, subject_code text not null, score numeric, created_at timestamptz not null default now());
create table if not exists jshs.weakness_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, topic_id text not null, mastery_score numeric not null, wrong_count integer not null default 0, attempt_count integer not null default 0, confidence numeric, updated_at timestamptz not null default now(), unique(user_id, topic_id));
create table if not exists jshs.wishes (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, school_code text not null, sort_order integer not null default 0, created_at timestamptz not null default now());
create table if not exists jshs.favorites (id uuid primary key default gen_random_uuid(), user_id uuid not null references jshs.users(id) on delete cascade, school_code text not null, created_at timestamptz not null default now(), unique(user_id, school_code));
create table if not exists jshs.anonymous_submissions (id uuid primary key default gen_random_uuid(), school_code text, type text not null, title text not null, content text not null, status text not null default 'pending', moderation_status text not null default 'pending', reviewed_at timestamptz, reviewed_by uuid references jshs.users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists jshs.admin_drafts (id uuid primary key default gen_random_uuid(), actor_user_id uuid references jshs.users(id) on delete set null, resource_type text not null, resource_id text not null, payload jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists jshs.audit_logs (id uuid primary key default gen_random_uuid(), actor_user_id uuid references jshs.users(id) on delete set null, action text not null, target_type text not null, target_id text not null, status text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

alter table jshs.users enable row level security;
alter table jshs.user_identities enable row level security;
alter table jshs.line_friendships enable row level security;
alter table jshs.exam_sessions enable row level security;
alter table jshs.exam_results enable row level security;
alter table jshs.subject_scores enable row level security;
alter table jshs.weakness_profiles enable row level security;
alter table jshs.wishes enable row level security;
alter table jshs.favorites enable row level security;
alter table jshs.anonymous_submissions enable row level security;
alter table jshs.admin_drafts enable row level security;
alter table jshs.audit_logs enable row level security;

-- No browser policies are created. RLS is deny-by-default; all access goes
-- through JSHS server authorization using the service role in a Worker secret.
revoke all on all tables in schema jshs from anon, authenticated;
