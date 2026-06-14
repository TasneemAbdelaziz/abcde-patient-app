#!/usr/bin/env sh
# Container entry point: prepare env -> build DB from Excel -> serve.
set -e
cd /app/backend

# An env file + app key must exist (key is generated if the host didn't set one).
[ -f .env ] || cp .env.example .env
php artisan key:generate --force --no-interaction

# On Render the public URL is injected; use it so generated links are correct.
if [ -n "${RENDER_EXTERNAL_URL}" ]; then
  export APP_URL="${RENDER_EXTERNAL_URL}"
fi

# SQLite schema, then load the hospital data from db/*.xlsx (idempotent).
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite
php artisan migrate --force --no-interaction
php artisan abcde:import --no-interaction || echo "abcde:import skipped (no workbooks?)"

# Drop any cached config so the host's runtime env vars take effect.
php artisan optimize:clear || true

PORT="${PORT:-8080}"
echo "Starting ABCDE Healthcare API on 0.0.0.0:${PORT}"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
