# One-command D1 storage migration

After this package and its authenticated ImageKit smoke endpoint are available on `jshs.cc` through the repository's normal GitHub → Cloudflare integration, run:

```sh
bash scripts/storage-migration/run.sh
```

The endpoint preflight is read-only and stops before Cloudflare data export or database creation if the currently deployed application does not contain the smoke endpoint. Keep an active JSHS Admin browser session available: the script opens the protected System Resources page for the ImageKit test and later for the post-deploy split-binding test.

The package uses the locally authenticated Wrangler CLI only for D1 inventory, backup, copy, and readback verification. It does not print credential values, write Wrangler log files, alter production bindings before all gates pass, or delete the legacy database. Each invocation creates a new private run directory at `~/.jshs-storage-migration/runs/<run-id>`; earlier exports and checkpoints are never overwritten. If a previous run created any target D1, a new run will stop rather than reuse that database without its original run metadata.

Before any production API access, preflight requires the migration scripts and D1 schemas to be committed on `main` and that commit to be published at `github/main`. Only LINE identities referenced by actual member-owned records are candidates for identity backfill; `line_users` or `line_friendships` alone never creates an account. Orphan planner child rows with no `member_planners` owner and no reliable direct owner are excluded from the new Learning D1 and listed in the migration audit by table, anonymous planner alias, count, reason and action. A planner child with a known owner but no parent remains a STOP condition. The original legacy D1 and its private export remain unchanged.

The final approval commits only `wrangler.jsonc` and pushes `main` to the `github` remote. Cloudflare deployment remains the responsibility of the configured Git integration; this package never runs `wrangler deploy` or calls the Cloudflare API directly.

If any phase stops, inspect `storage-migration-report.md` and the rollback procedure before resuming. Do not manually clear or reuse a partially populated target database.
