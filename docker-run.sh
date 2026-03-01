#!/usr/bin/env bash
set -e

IMAGE="${IMAGE:-ghcr.io/ce-de-ml-nathanschoff/whats:backend-docker}"
PORT="${PORT:-8000}"

if [ -f .env ]; then
  exec docker run -p "${PORT}:8000" --env-file .env "$@" "$IMAGE"
else
  echo "Warning: .env not found. Copy .env.example to .env and set JWT_SECRET and Snowflake vars." >&2
  exec docker run -p "${PORT}:8000" "$@" "$IMAGE"
fi
