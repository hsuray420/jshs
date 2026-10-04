# D1 storage separation and migration boundary

## Ownership

The production database remains Cloudflare D1. Supabase is not part of this design.

| Domain | Target D1 | Data |
| --- | --- | --- |
| Core identity | `CORE_DB` / `jshs-core` | `users`, `user_identities`, `line_friendships`, account settings, member favorites, notification preferences |
| Learning | `LEARNING_DB` / `jshs-learning` | mock exams, score history, exam results, weakness profiles, analysis snapshots, planner records, member AI conversations |
| Community | `COMMUNITY_DB` / `jshs-community` | anonymous reviews/reports, moderation, votes, school-image metadata, school-data drafts/audit and publishing records |
| Official source data | GitHub Contents API | Official school, admissions, and district CSV only |
| Public school image binaries | ImageKit | Binary objects; D1 contains the public URL and provenance metadata |

No SQL JOIN or foreign key crosses D1 boundaries. Member data uses the existing JSHS UUID; LINE IDs remain identity-provider keys and legacy ownership keys only. Anonymous reports/reviews do not create a member identity.

## Transitional bindings

`db/bindings.ts` resolves each named D1 independently. If a named binding is absent, that domain temporarily uses the existing `DB` binding so production continues to use its current D1. A present-but-failing named binding never silently falls back to the legacy database.

`wrangler.jsonc` intentionally retains the existing production `DB` binding and does not contain guessed IDs for the three new databases. Provision the three D1 databases and apply the matching `db/migrations/{core,learning,community}/0001_*.sql` schemas in a non-production environment first. Do not attach the new bindings to production until migration preflight, row conservation, identity mapping, and readback all pass.

The SQL files are proposed initial schemas, not evidence that Cloudflare databases have been created or migrated. Runtime compatibility stores still create their legacy-compatible schemas as needed; this is not a substitute for the checked migration.

The production migration inventory considers only LINE IDs referenced by member-owned tables as member identities; rows in `line_users` alone never create an account. Missing identities receive persisted, deterministic JSHS UUIDs in the migration copy and are written to the new Core D1, never backfilled into the legacy production D1. A planner child with no `member_planners` owner is excluded only when no unique owner can be established; each excluded table/planner alias/count is audit-logged without private row values. Multiple possible owners, conflicting mappings, or other unresolved member rows remain STOP conditions.

## Guest and explicit import

Unauthenticated calculators, mock exams, planner items, and favorites remain in browser storage. Member routes derive the UUID from the signed server session and never accept an owner ID from a request.

After LINE Login, `/account` detects local score history, mock records, planner entries, and favorites. It displays category counts and asks before any upload. Pressing **匯入** invokes `/api/member/import`; the route bounds and validates each category, writes Learning records by internal user UUID and favorites to Core, and performs readback checks. Local copies are not removed after import. A separate user action removes only keys whose values have not changed since the import began.

The mock-exam workspace no longer uploads pending guest records just because a member signs in.

## ImageKit

New school-image uploads require all three server-side settings: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT`. The Worker uploads to ImageKit and persists the returned file ID/URLs and attribution metadata. If settings are missing, the UI disables upload and the server rejects it; new images do not fall back to D1 BLOB.

Existing D1 BLOB-backed images remain readable. They are not deleted or migrated automatically. The safe later migration is: upload one legacy image, verify returned URL and file ID, update the metadata, verify the public read path, then delete the old BLOB. This repository does not run that migration.

## Observability

The Admin resource page removes the Supabase card. D1 cards run a real `SELECT 1` and report SQLite page-count size when available; no percentage is displayed without a reliable plan limit. ImageKit is probed through its Files API. GitHub uses the configured Contents repository's latest school CSV commit history. LINE is labelled as configured and shows the last stored friend-status check; this is not described as a live LINE health test.

## Safe staged rollout

1. Provision the three D1 databases and apply the schemas in a staging environment.
2. Record source table counts, stable keys, duplicate identity keys, identity-backfill candidates, and orphan checks.
3. Copy rows while preserving each existing JSHS UUID; generate a stable mapping only for LINE identities referenced by member data.
4. Compare `old = migrated + explicitly authorized orphan drops`; unexpected missing rows must equal zero. Verify representative reads.
5. Test named bindings in staging and simulate each binding failing independently.
6. Only after complete readback, configure production bindings and validate again.
7. Keep the old `DB` attached and retained for the approved recovery window. Do not drop it as part of this rollout.

Each migration invocation uses a fresh private run directory, preserving earlier exports/checkpoints rather than overwriting them. A prior run that already provisioned a named target database still requires inspection before retry; the package will not reuse an unverified existing D1.

No D1 is provisioned or migrated by local tests. Production bindings remain unchanged until all gates pass and the separate explicit deployment approval is given.
