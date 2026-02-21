#!/bin/bash
set -e

echo "Starting Billing Application Container..."

# Install pnpm dependencies if needed
# if [ -f "package.json" ]; then
#     echo "Installing pnpm dependencies..."
#     pnpm install
# fi

# Build pnpm project if needed
# if [ -f "package.json" ]; then
#     echo "Building pnpm project..."
#     pnpm build
# fi

# Install/update composer dependencies if needed
# if [ -f "composer.json" ]; then
#     echo "Installing Composer dependencies..."
#     composer install --no-interaction --optimize-autoloader
# fi

# Set proper permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Run database migrations
if [ -f "phinx.php" ]; then
    echo "Running database migrations..."
    pnpm db:migrate || echo "Warning: Database migration failed or not needed"
fi

# Execute the main command (apache2-foreground)
exec "$@"
