# Storage upgrade — production migration boundary

## Current, verified state

- Cloudflare Worker runs the web application and binds Cloudflare D1 as `DB`.
- Existing member records, mock exams, score snapshots, planner state, notifications, and Admin drafts are keyed by `line_user_id` in D1.
- School CSV remains canonical in GitHub; generated JSON is derived and must not be edited.
- Existing school-image overrides remain in D1 until ImageKit has been configured and each image has been verified.

## Target ownership

| Data | Owner after migration | Notes |
| --- | --- | --- |
| Public official school, admission, and district CSV | GitHub | Versioned, reviewed source data only. |
| User, identity, score, weakness, wish, favorite, submission, draft, audit | Supabase | Server-authorized access and deny-by-default RLS. |
| Public school image binaries | ImageKit | Database stores only file ID, URL, and provenance metadata. |
| Runtime, API, transient cache, operational logs | Cloudflare Worker | No durable user-data disk. |

## Required secrets and non-secret configuration

Worker secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, existing GitHub and LINE secrets.

Non-secret Admin links: `ADMIN_HOSTING_DASHBOARD_URL`, `SUPABASE_DASHBOARD_URL`, `IMAGEKIT_DASHBOARD_URL`, `GITHUB_REPOSITORY_URL`, `LINE_DEVELOPERS_DASHBOARD_URL`, `LINE_OA_DASHBOARD_URL`.

## Safe migration sequence

1. Export D1 counts for members, mock exams, score snapshots, planners, notifications, wishes/favorites, and submissions.
2. Apply `supabase/migrations/0001_jshs_dynamic_data.sql` to an empty Supabase project through the approved migration workflow.
3. Backfill `jshs_users` and `user_identities` using the already-created internal UUID bridge; do not regenerate IDs.
4. Migrate each dependent table with an explicit `line_user_id → user_id` mapping and compare pre/post counts.
5. Reject migration on duplicate LINE identities, orphan rows, or any row-count loss.
6. Enable server-side dual-read validation before changing writes; only cut over after verified readback.
7. Upload and verify ImageKit assets one at a time. Keep the existing image serving path until the ImageKit URL has been persisted and checked.

No production migration is run merely by deploying this repository. This prevents silent user-data loss when provider credentials or an approved export are absent.
