create table schools (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  ownership text,
  admission_area text,
  school_type text,
  gender_policy text,
  city text,
  district text,
  address text,
  website text,
  phone text,
  featured_programs text,
  rank integer,
  sort_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  quota integer,
  gender_limit text,
  admission_year integer,
  created_at timestamptz not null default now()
);

create table admission_scores (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  program_name text,
  admission_year integer not null,
  score_label text,
  source_note text,
  source_url text,
  confidence text not null default 'reference',
  created_at timestamptz not null default now()
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  audience text not null default 'all',
  title text not null,
  body text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table line_users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  preferred_audience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  line_user_id uuid references line_users(id) on delete cascade,
  school_id uuid references schools(id) on delete cascade,
  wish_order integer,
  created_at timestamptz not null default now()
);

create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);
