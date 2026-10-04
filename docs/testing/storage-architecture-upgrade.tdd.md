# Storage architecture upgrade — TDD evidence

## Journeys

1. A LINE-authenticated member receives a stable JSHS UUID while the existing LINE key and historic D1 rows remain intact.
2. An operator can see whether Worker, Supabase, ImageKit, GitHub, and LINE are actually configured without fabricated capacity figures.
3. An administrator can obtain ImageKit upload credentials only from a same-origin, authenticated server endpoint.
4. A future Supabase migration has the required relational schema with RLS enabled and browser access denied by default.

## RED → GREEN

| Guarantee | Test | RED evidence | GREEN evidence |
| --- | --- | --- | --- |
| Internal user identity bridge | `storage-architecture-upgrade.test.mjs` | Missing `member-identity-store.ts` | Passing source contract and TypeScript check |
| Supabase RLS schema | `storage-architecture-upgrade.test.mjs` | Missing migration and adapter | All target tables and RLS statements found |
| System resources control plane | `storage-architecture-upgrade.test.mjs` | Missing resource page/config | Provider cards and centralized links found |
| ImageKit secrets stay server-only | `storage-architecture-upgrade.test.mjs` | Missing signing route | Same-origin/Auth contract and no client secret reference found |

## Commands

- `node --test tests/storage-architecture-upgrade.test.mjs tests/admin-architecture.test.mjs tests/member-line-login.test.mjs tests/member-friend-gate-and-feature-routes.test.mjs` — 12 passed.
- `pnpm run test:unit` — 321 passed, 0 failed, 0 cancelled.
- `pnpm run typecheck` — passed.
- `pnpm run lint` — 0 errors, 23 existing warnings.
- `pnpm run build` — passed; includes `/admin/system/resources`, `/admin/users`, and `/api/admin/imagekit/auth`.
- `pnpm audit --audit-level=critical` — no critical findings; 20 remaining transitive findings (3 low, 8 moderate, 9 high) require dependency-owner follow-up.

## Known gaps

No Supabase project, approved D1 export, ImageKit credentials, or production Admin session were supplied. Therefore no production data was moved, no provider API usage was fabricated, and no external dashboard was changed. The migration remains deliberately prepared-but-not-applied until row-conservation validation can run against the chosen Supabase project.
