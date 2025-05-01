#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."

until PGPASSWORD=postgres psql -h postgres -U postgres -d postgres -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

echo "Waiting for Redis to be ready..."

until redis-cli -h redis ping | grep PONG; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done

echo "Redis is up - executing command"


echo "Starting the application..."
node dist/index.js
