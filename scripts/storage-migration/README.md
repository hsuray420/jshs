# One-command D1 storage migration

After this package and its authenticated ImageKit smoke endpoint are available on `jshs.cc` through the repository's normal GitHub → Cloudflare integration, run:

```sh
bash scripts/storage-migration/run.sh
```

The endpoint preflight is read-only and stops before Cloudflare data export or database creation if the currently deployed application does not contain the smoke endpoint. Keep an active JSHS Admin browser session available: the script opens the protected System Resources page for the ImageKit test and later for the post-deploy split-binding test.

The package uses the locally authenticated Wrangler CLI only for D1 inventory, backup, copy, and readback verification. It does not print credential values, write Wrangler log files, alter production bindings before all gates pass, or delete the legacy database. Backups and migration metadata are stored outside the repository in `~/.jshs-storage-migration/active` with private permissions.

The final approval commits only `wrangler.jsonc` and pushes `main` to the `github` remote. Cloudflare deployment remains the responsibility of the configured Git integration; this package never runs `wrangler deploy` or calls the Cloudflare API directly.

If any phase stops, inspect `storage-migration-report.md` and the rollback procedure before resuming. Do not manually clear or reuse a partially populated target database.
