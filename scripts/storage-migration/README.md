# Deprecated production migration tooling

The current production architecture is clean initialization of `CORE_DB`, `LEARNING_DB`, and `COMMUNITY_DB`. No legacy rows are being migrated.

Do not run `bash scripts/storage-migration/run.sh`, restore legacy data, or use this package in the production release flow. The files remain only as historical tooling; application runtime and deployment must not depend on them.
