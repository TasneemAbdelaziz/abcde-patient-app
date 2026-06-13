# ABCDE Healthcare API — production image for free-tier hosts (Render / Koyeb / Railway).
# Build context is the REPO ROOT so the API (backend/) can reach the data files (db/).
FROM php:8.2-cli-bookworm

# System libraries for the PHP extensions Laravel + PhpSpreadsheet need.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip ca-certificates \
        libzip-dev libpng-dev libonig-dev libxml2-dev \
        sqlite3 libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite mbstring zip gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer (from the official image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Production-safe defaults. OS env vars win over .env, so these harden the app
# even if the host forgets to set them. Override APP_URL on the host.
ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_LOCALE=ar \
    APP_FALLBACK_LOCALE=en \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    SESSION_DRIVER=database \
    CACHE_STORE=database \
    QUEUE_CONNECTION=sync \
    PHP_CLI_SERVER_WORKERS=4 \
    COMPOSER_ALLOW_SUPERUSER=1

# Copy the whole repo (db/*.xlsx included) then install PHP deps.
WORKDIR /app
COPY . /app

WORKDIR /app/backend
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Entry point: prepare env, build the DB from the Excel files, then serve.
RUN cp -f docker/start.sh /usr/local/bin/start.sh \
    && sed -i 's/\r$//' /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh \
    && chmod -R ug+rw storage bootstrap/cache database

EXPOSE 8080
CMD ["start.sh"]
