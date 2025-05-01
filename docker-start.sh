#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
# Simple wait loop for PostgreSQL
until PGPASSWORD=postgres psql -h postgres -U postgres -d postgres -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
node dist/index.js
