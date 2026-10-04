# Storage migration rollback

The migration is a copy-only operation. Never delete `jshs-db` or any of the three new D1 databases during rollback.

## If deployment has not started

No production binding has changed. Leave all databases intact. A new invocation creates a separate run directory and fresh backup; prior backups/checkpoints are preserved:

```sh
bash scripts/storage-migration/run.sh
```

If a previous phase reported `FAIL`, do not manually clear or recreate a destination database; inspect that run's private metadata/report first. If the run stopped before any new database was created, a fresh invocation is safe. If it created a named target D1, the package stops rather than reusing it without verified run metadata.

## If deployment or a production smoke test failed

1. Stop any further migration or deployment attempt.
2. Restore the saved pre-cutover Wrangler config from the specific run directory shown in that run's private metadata/report:

   ```sh
   cp "$HOME/.jshs-storage-migration/runs/<run-id>/wrangler.pre-cutover.jsonc" wrangler.jsonc
   git add -- wrangler.jsonc
   git commit -m "Restore legacy D1 production binding" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
   git push github main
   ```

3. Confirm `wrangler.jsonc` contains only the original `DB → jshs-db` binding. Keep all three new D1 databases and their data untouched.
4. GitHub → Cloudflare integration will redeploy the legacy binding. Do not force-push, rewrite history, or bypass the normal deployment workflow.
5. Verify the site and member LINE login/history against the restored legacy binding before resuming.

If D1 Time Travel was available, the exact bookmark is recorded in the private run metadata and in `storage-migration-report.md`. Do not restore a bookmark automatically: the legacy database is intentionally left intact, and Time Travel restoration can discard writes made after that point. Use the bookmark only after an operator has assessed data loss risk.

## Sensitive backups

The full SQL export, SQLite snapshots, per-batch SQL, metadata and Wrangler config copy live in a private per-run directory outside the repository. Keep the directory private until the migration is accepted. Never add these files to Git, attach them to an issue, or share them; they contain production data.
