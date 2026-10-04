# Storage migration report

Run: 202610040523-23652fcd
Started: 2026-10-04T05:23:21.333Z
Report generated: 2026-10-04T05:23:40.283Z

## Legacy database inventory

- Name: `jshs-db`
- ID: `dfc77943-f336-46a1-9aec-3c3e29107748`
- Account confirmed: yes
- Export: PASS (1855881 bytes, SHA-256 749fb5cc6b0dd096df0a3f11179840f5820396cfe78ead36b99f982378e23829)
- Time Travel checkpoint: 00000651-00000006-000050fa-c2776b2dcc66d45b5376a80496e52715
- Original worktree was dirty: yes (1 paths)
- Legacy database retained; migration is copy-only.

| Legacy table | Rows | Classification |
|---|---:|---|
| admin_files | 3 | legacy_system |
| admin_rate_limits | 1 | legacy_system |
| assistant_guest_usage | 59 | legacy_system |
| community_vote_topics | 0 | community |
| community_votes | 0 | community |
| content_entries | 15 | legacy_system |
| content_revisions | 2 | legacy_system |
| data_report_rate_limits | 0 | community |
| data_reports | 0 | community |
| deployment_events | 0 | legacy_system |
| external_media_cleanup | 0 | legacy_system |
| important_dates | 2 | legacy_system |
| jshs_users | 0 | core |
| line_friendships | 0 | core |
| line_users | 3 | legacy_system |
| member_ai_conversations | 2 | learning |
| member_notification_preferences | 2 | core |
| member_planners | 2 | learning |
| member_score_history | 0 | learning |
| notification_settings | 3 | legacy_system |
| planner_confirmations | 1 | learning |
| planner_items | 1 | learning |
| planner_states | 5 | learning |
| planner_versions | 0 | learning |
| school_data_audit | 0 | community |
| school_data_drafts | 0 | community |
| school_media_overrides | 3 | community |
| school_review_rate_limits | 2 | community |
| school_reviews | 2 | community |
| site_settings | 5 | legacy_system |
| user_identities | 0 | core |

## New D1 databases

| Domain | Name | Database ID |
|---|---|---|
| CORE | jshs-core | Not created |
| LEARNING | jshs-learning | Not created |
| COMMUNITY | jshs-community | Not created |

## Table mapping and row conservation

| Mapping | Old rows | Migrated | Dropped by authorization | Unexpected missing | New rows | Primary/unique | Random readback | Oldest/newest | Content hash | Result |
|---|---:|---:|---:|---:|---:|---|---|---|---|---|
| No copied tables recorded | — | — | — | — | — | PENDING | PENDING | PENDING | PENDING | PENDING |

## Legacy member identity ownership

- Member-referenced LINE identities: 2
- New internal UUID backfills: 2
- LINE-only records not promoted to members: 1

| Anonymous identity | Member data tables | Planner IDs | Identity handling |
|---|---|---:|---|
| legacy-line-1 | member_ai_conversations (2), member_notification_preferences (1), member_planners (1) | 1 | new UUID backfill |
| legacy-line-2 | member_notification_preferences (1), member_planners (1) | 1 | new UUID backfill |

## Planner ownership and authorized exclusions

| Retained child table | Planner alias | Owner alias | Rows | Owner check |
|---|---|---|---:|---|
| planner_confirmations | legacy-planner-4 | legacy-line-1 | 1 | PASS |
| planner_states | legacy-planner-4 | legacy-line-1 | 1 | PASS |

| Source table | Orphan planner alias | Rows | Reason | Action |
|---|---|---:|---|---|
| planner_items | legacy-planner-5 | 1 | unresolved_owner | dropped_from_migration |
| planner_states | legacy-planner-1 | 1 | unresolved_owner | dropped_from_migration |
| planner_states | legacy-planner-2 | 1 | unresolved_owner | dropped_from_migration |
| planner_states | legacy-planner-3 | 1 | unresolved_owner | dropped_from_migration |
| planner_states | legacy-planner-5 | 1 | unresolved_owner | dropped_from_migration |

- Total explicitly dropped from migration: 5
- Unexpected missing rows: 0

## Identity and orphan validation

- Legacy identity preflight: PASS
- Duplicate LINE mappings: 0
- Duplicate internal identity/provider pairs: 0
- Orphan identities: 0
- Orphan scores: 0
- Orphan exams: 0
- Orphan planners: 0
- Orphan AI conversations: 0
- Users without identity: 0
- Conflicting legacy/internal identity records: 0
- Cross-database Learning owner orphans: PENDING
- Cross-database planner child orphans: PENDING
- Cross-database community vote orphans: PENDING
- Cross-database community audit actor orphans: PENDING
- Exam result/session orphans: PENDING
- Subject score/result orphans: PENDING
- Identity status: PASS
- Backfill readback: PENDING

## ImageKit validation

- Status: PENDING
- Temporary file deleted: not verified
- D1 binary fallback used: not verified

## Bindings and test gates

- Legacy binding `DB → jshs-db`: retained
- CORE_DB / LEARNING_DB / COMMUNITY_DB: not changed
- Typecheck: PENDING
- Lint: PENDING
- Full test suite: PENDING
- git diff --check: PENDING
- Binding commit: not created
- GitHub remote push: not run
- Git branch/remote: main / github
- Production deployment: not run
- Production smoke tests: not run

## Rollback

- Status: not started
- Rollback bookmark: 00000651-00000006-000050fa-c2776b2dcc66d45b5376a80496e52715
- Procedure: [rollback.md](./scripts/storage-migration/rollback.md)
- Private full export and metadata directory: `/Users/ray/.jshs-storage-migration/runs/20261004T052320Z-24013`
- The report intentionally contains counts and operational metadata only, never row contents or credentials.
