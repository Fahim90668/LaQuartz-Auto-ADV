#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

mkdir -p packages/db/src

echo "▶ Generating database types..."
supabase gen types typescript \
  --linked \
  --schema public \
  > packages/db/src/types.generated.ts

echo "✓ Wrote packages/db/src/types.generated.ts ($(wc -l < packages/db/src/types.generated.ts) lines)"