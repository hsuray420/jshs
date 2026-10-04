# D1 clean initialization

## Production bindings

The production runtime uses three independent Cloudflare D1 databases:

| Binding | Database | Ownership |
| --- | --- | --- |
| `CORE_DB` | `jshs-core` | `users`, LINE identity/friendship, account settings, favorites, site and notification settings |
| `LEARNING_DB` | `jshs-learning` | Member scores, mock exams, planners, weakness profiles, member AI history |
| `COMMUNITY_DB` | `jshs-community` | Anonymous reviews/reports, votes, school media metadata, moderation and admin/content records |

The configured database IDs are in `wrangler.jsonc`. `db/bindings.ts` requires each named binding and fails explicitly if it is missing. It has no legacy `DB` fallback.

## Clean initialization policy

This is a clean initialization, not a legacy migration. Do not run `scripts/storage-migration/run.sh`, identity backfills, orphan processing, or legacy restore. No old D1 binding is read or written by the application. The historical migration package is not part of the deployment path.

Apply only the initial schemas:

```text
db/migrations/core/0001_core.sql        → CORE_DB
db/migrations/learning/0001_learning.sql → LEARNING_DB
db/migrations/community/0001_community.sql → COMMUNITY_DB
```

Do not copy legacy rows. New member records use `users.id` as the stable JSHS UUID. LINE Login first checks `user_identities(provider = 'line', provider_user_id)` and reuses the mapped UUID; only an unmapped, successfully authenticated and friendship-verified LINE account receives a new UUID and identity row. Webhook events and LINE OA audiences do not create member accounts. `line_friendships` contains only actual LINE friendship API results.

Member-owned data is written using the internal `user_id` obtained from the signed member session. Guest score, mock exam, planner, weakness, favorites and AI conversation data stays on the client; the guest AI allowance is carried in a signed HttpOnly cookie and is not persisted to D1. Anonymous reviews and data reports are written to `COMMUNITY_DB` without creating a member identity.

## Image storage

School and administrator image uploads go through the Worker to ImageKit. The private key is read only from the runtime environment and is never exposed to browser code or persisted in D1. D1 stores only image metadata (`fileId`, URL, school/code context, attribution and timestamps). The image upload path fails explicitly if ImageKit is unavailable; images are never written to `admin_files.file_blob`.

`POST /api/admin/system/imagekit-smoke` is protected by same-origin validation, an Admin Session with editor role, and an admin rate limit. It uploads a temporary image, verifies the ImageKit file record and delivery URL, then deletes and verifies deletion. The Admin System Resources page exposes the test button. A failed cleanup is reported as a failed smoke test.

Non-image admin files used by existing CSV and code-deployment workflows may continue to use the Community D1 `admin_files.file_blob` column.

## Verification and release

Before deployment, validate the schemas and runtime stores, run typecheck/lint/tests and a production build, and check `git diff --check`. After deployment, verify the three bindings and website routes. Full LINE OAuth and ImageKit upload/read/delete tests require the configured production runtime and an authorized Admin Session.

Official school/admissions data remains sourced from the repository and GitHub; the storage change does not move or rebuild those source files.
