#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."

until PGPASSWORD=postgres psql -h postgres -U postgres -d postgres -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting the application..."
node dist/index.js
