#!/bin/sh
set -e

echo "Running Prisma db push to sync schema..."
npx prisma db push --accept-data-loss

echo "Starting Next.js server..."
exec node server.js
