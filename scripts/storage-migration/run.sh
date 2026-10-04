#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$ROOT"

echo "Checking local Node.js and package-manager environment..."
node -v
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) process.exit(1)' || {
  echo "Node.js 22.13 or newer is required for the read-only SQLite snapshot checks."
  exit 1
}
npm -v
if command -v corepack >/dev/null 2>&1; then
  corepack --version
else
  echo "Corepack: unavailable"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    echo "pnpm is missing; trying Corepack activation..."
    corepack enable
    corepack prepare pnpm@latest --activate
  else
    echo "Corepack is unavailable; installing pnpm with npm..."
    npm install -g pnpm
  fi
fi
pnpm -v

if [[ ! -x "$ROOT/node_modules/.bin/wrangler" ]]; then
  echo "Local Wrangler dependency is missing; restoring repository dependencies without changing the lockfile..."
  pnpm install --frozen-lockfile
  if [[ ! -x "$ROOT/node_modules/.bin/wrangler" ]]; then
    echo "Wrangler is still unavailable after the frozen install; refusing to continue."
    exit 1
  fi
fi

MIGRATION_ROOT="$HOME/.jshs-storage-migration"
RUNS_DIR="$MIGRATION_ROOT/runs"
if [[ -L "$MIGRATION_ROOT" || -L "$RUNS_DIR" ]]; then
  echo "Migration backup directory must not be a symbolic link; refusing to continue."
  exit 1
fi
mkdir -p "$RUNS_DIR"
chmod 700 "$MIGRATION_ROOT" "$RUNS_DIR"
RUN_ID="$(date -u '+%Y%m%dT%H%M%SZ')-$$"
MIGRATION_DIR="$RUNS_DIR/$RUN_ID"
if ! mkdir "$MIGRATION_DIR"; then
  echo "Could not create a unique private migration run directory; refusing to overwrite any existing checkpoint."
  exit 1
fi
chmod 700 "$MIGRATION_DIR"
export JSHS_MIGRATION_DIR="$MIGRATION_DIR"
export WRANGLER_WRITE_LOGS=false
export WRANGLER_LOG_PATH=/dev/null

if ! mkdir "$MIGRATION_ROOT/.lock" 2>/dev/null; then
  echo "Another migration run holds the lock at $MIGRATION_ROOT/.lock; refusing to continue."
  exit 1
fi
cleanup() {
  local exit_code=$?
  if [[ -f "$MIGRATION_DIR/metadata.json" ]]; then
    node --experimental-sqlite scripts/storage-migration/report.mjs || echo "Could not update the migration report; inspect the private metadata directory."
  fi
  rmdir "$MIGRATION_ROOT/.lock" 2>/dev/null || true
  return "$exit_code"
}
trap cleanup EXIT

echo
echo "Current Git worktree status (paths only):"
git status --short --untracked-files=all

run_phase() {
  local phase="$1"
  echo
  echo "=== Storage migration phase: $phase ==="
  node --experimental-sqlite "scripts/storage-migration/$phase.mjs"
}

run_phase prepare
run_phase inventory
run_phase migrate
run_phase verify
run_phase cutover

echo
echo "Storage migration package finished. Read storage-migration-report.md and keep the private backup at $MIGRATION_DIR."
