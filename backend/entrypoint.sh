#!/bin/sh

# Wait for postgres to be ready
until nc -z postgres 5432; do
  echo "Waiting for postgres..."
  sleep 1
done

echo "PostgreSQL is ready!"

# Run migrations
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

# Seed database (only if not already seeded)
echo "Seeding database..."
./node_modules/.bin/ts-node prisma/seed.ts || true

# Start application
echo "Starting NestJS application..."
exec npm run start:dev
