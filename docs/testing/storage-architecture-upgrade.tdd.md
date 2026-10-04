# D1 storage architecture test evidence

## Automated contracts

`tests/storage-architecture-upgrade.test.mjs` checks that:

- The three target D1 schemas exist and use the intended ownership keys.
- Runtime stores route identity, learning, and community data through explicit bindings.
- Missing named bindings use only the legacy D1 compatibility path.
- Member import derives the user from the session, validates bounded records, and reads records back.
- Mock guest data is not automatically uploaded after login.
- ImageKit secrets stay server-side and school uploads have no D1 BLOB fallback.
- The System Resources page does not report Supabase or hard-coded capacity figures as production health.

Run the focused contract with `node --test tests/storage-architecture-upgrade.test.mjs`; run repository checks with `pnpm run lint`, `pnpm run typecheck`, `pnpm test`, and `pnpm run build`.

## Manual staging gates

Repository tests cannot create the external D1 databases or prove production row conservation. Before production bindings are changed, staging must record and compare old/new row counts, stable keys, duplicate LINE mappings, orphan identities, scores, planner records, reviews, and readback results. Any failed comparison blocks cutover.

Real ImageKit upload/delete, GitHub API authentication, LINE Login, and browser persistence require configured external credentials and cannot be represented as passing by source-only tests.
