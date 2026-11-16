#!/usr/bin/env sh
set -eu

PORT="${PORT:-10000}"

# Bind Apache to Render's assigned HTTP port.
printf "Listen %s\n" "$PORT" > /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

if [ -z "${APP_KEY:-}" ]; then
  echo "ERROR: APP_KEY is not set in Render Environment Variables." >&2
  echo "Generate one locally with: php artisan key:generate --show" >&2
  exit 1
fi

# Refresh caches at runtime using Render's injected environment variables.
php artisan config:clear
php artisan config:cache
php artisan route:cache

# Run database migrations safely on startup.
php artisan migrate --force

# Seed initial admin (and optional demo portfolio) only on an empty database.
if [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  USER_COUNT=$(php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo App\Models\User::count();")
  if [ "$USER_COUNT" = "0" ]; then
    php artisan db:seed --force
  fi
fi

# Ensure storage and cache files created during boot remain writable by Apache.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec apache2-foreground

