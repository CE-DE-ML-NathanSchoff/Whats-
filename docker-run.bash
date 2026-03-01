#!/usr/bin/env bash
# Run Comunitree in Docker: ensures .env, optional DB init/migrations, then runs the app.
# Usage: ./docker-run.bash [--init-db] [--migrate] [--foreground]
#   --init-db   Run Snowflake schema init once (one-off container) then continue to run.
#   --migrate   Run DB migrations (private/friends, profile/config) then continue to run.
#   --foreground  Run container in foreground (no -d).
# Debug: DEBUG=1 ./docker-run.bash
set -e

IMAGE="${IMAGE:-ghcr.io/ce-de-ml-nathanschoff/whats:main}"
PORT="${PORT:-8000}"
CONTAINER_NAME="${CONTAINER_NAME:-comunitree}"
RUN_INIT_DB=0
RUN_MIGRATE=0
FOREGROUND=0
while [ $# -gt 0 ]; do
  case "$1" in
    --init-db)   RUN_INIT_DB=1; shift ;;
    --migrate)   RUN_MIGRATE=1; shift ;;
    --foreground) FOREGROUND=1; shift ;;
    *) shift ;;
  esac
done

debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $*" >&2; }

# --- Step 1: Check Docker ---
debug "Step 1: Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi
[ -n "$DEBUG" ] && docker --version

# --- Step 2: Ensure .env with required values ---
debug "Step 2: Ensuring .env"
need_env_prompt=0
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example."
    need_env_prompt=1
  else
    echo "Error: No .env or .env.example found." >&2
    exit 1
  fi
else
  # Check for placeholders
  if grep -q 'your_account_identifier\|your_username\|your_password\|your-super-secret-jwt-key-change-in-production' .env 2>/dev/null; then
    need_env_prompt=1
  fi
fi

prompt_value() {
  local name="$1" secret="${2:-0}" default="${3:-}"
  local val
  if [ "$secret" = "1" ]; then
    read -r -s -p "$name: " val
    echo "" >&2
  else
    read -r -p "$name${default:+ [$default]}: " val
  fi
  echo "${val:-$default}"
}

if [ "$need_env_prompt" = "1" ]; then
  echo ""
  echo "Comunitree needs the following configuration. Values are written to .env."
  echo ""

  JWT_SECRET=$(prompt_value "JWT_SECRET (long random string, e.g. run: openssl rand -hex 32)" 1)
  [ -z "$JWT_SECRET" ] && echo "JWT_SECRET is required." >&2 && exit 1

  echo ""
  echo "--- Snowflake (get these from your Snowflake account / UI) ---"
  SNOWFLAKE_ACCOUNT=$(prompt_value "SNOWFLAKE_ACCOUNT (e.g. xy12345 or xy12345.us-east-1)" 0 "your_account_identifier")
  SNOWFLAKE_USERNAME=$(prompt_value "SNOWFLAKE_USERNAME" 0 "your_username")
  SNOWFLAKE_PASSWORD=$(prompt_value "SNOWFLAKE_PASSWORD" 1)
  SNOWFLAKE_WAREHOUSE=$(prompt_value "SNOWFLAKE_WAREHOUSE" 0 "COMPUTE_WH")
  SNOWFLAKE_DATABASE=$(prompt_value "SNOWFLAKE_DATABASE" 0 "COMUNITREE")
  SNOWFLAKE_SCHEMA=$(prompt_value "SNOWFLAKE_SCHEMA" 0 "PUBLIC")
  SNOWFLAKE_ROLE=$(prompt_value "SNOWFLAKE_ROLE" 0 "ACCOUNTADMIN")

  # Write non-secret vars; append secrets with care (no spaces around =)
  export JWT_SECRET SNOWFLAKE_ACCOUNT SNOWFLAKE_USERNAME SNOWFLAKE_PASSWORD
  export SNOWFLAKE_WAREHOUSE SNOWFLAKE_DATABASE SNOWFLAKE_SCHEMA SNOWFLAKE_ROLE

  # Write .env: replace placeholders with user-provided values
  if [ -f .env.example ]; then
    sed -e "s|your-super-secret-jwt-key-change-in-production|$JWT_SECRET|g" \
        -e "s|your_account_identifier|$SNOWFLAKE_ACCOUNT|g" \
        -e "s|your_username|$SNOWFLAKE_USERNAME|g" \
        -e "s|your_password|$SNOWFLAKE_PASSWORD|g" \
        -e "s|^SNOWFLAKE_WAREHOUSE=.*|SNOWFLAKE_WAREHOUSE=$SNOWFLAKE_WAREHOUSE|" \
        -e "s|^SNOWFLAKE_DATABASE=.*|SNOWFLAKE_DATABASE=$SNOWFLAKE_DATABASE|" \
        -e "s|^SNOWFLAKE_SCHEMA=.*|SNOWFLAKE_SCHEMA=$SNOWFLAKE_SCHEMA|" \
        -e "s|^SNOWFLAKE_ROLE=.*|SNOWFLAKE_ROLE=$SNOWFLAKE_ROLE|" \
        .env.example > .env
  fi
  echo ""
  echo ".env has been updated. For MFA, edit .env and set SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA and SNOWFLAKE_PASSCODE before running --init-db."
  echo ""
fi

# --- Step 3: Pull image (needed for init/migrate and run) ---
debug "Step 3: Pulling image"
echo "Pulling image: $IMAGE"
if ! docker pull "$IMAGE"; then
  echo "Error: failed to pull $IMAGE" >&2
  exit 1
fi

# --- Step 4: Optional DB init ---
if [ "$RUN_INIT_DB" = "1" ]; then
  debug "Step 4a: Running Snowflake schema init"
  echo "Running one-time DB init (Snowflake schema)..."
  if ! docker run --rm --env-file .env "$IMAGE" node server/db/init.js; then
    echo "DB init failed. Fix .env (e.g. Snowflake credentials, MFA passcode) and run again with --init-db." >&2
    exit 1
  fi
  echo "DB init completed."
fi

# --- Step 5: Optional migrations ---
if [ "$RUN_MIGRATE" = "1" ]; then
  debug "Step 5: Running migrations"
  echo "Running migration: migratePrivateAndFriends..."
  docker run --rm --env-file .env "$IMAGE" node server/db/migratePrivateAndFriends.js
  echo "Running migration: migrateProfileAndConfig..."
  docker run --rm --env-file .env "$IMAGE" node server/db/migrateProfileAndConfig.js
  echo "Migrations completed."
fi

# --- Step 6: Clean existing container ---
debug "Step 6: Cleaning existing container"
EXISTING=$(docker ps -a -q -f "name=^${CONTAINER_NAME}$" 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  echo "Stopping and removing existing container: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# --- Step 7: Run container ---
debug "Step 7: Running container"
DETACH="-d"
[ "$FOREGROUND" = "1" ] && DETACH=""

echo "Starting Comunitree on port $PORT..."
if [ "$FOREGROUND" = "1" ]; then
  exec docker run -p "${PORT}:8000" --name "$CONTAINER_NAME" --env-file .env --rm $DETACH "$IMAGE"
fi

docker run $DETACH -p "${PORT}:8000" --name "$CONTAINER_NAME" --env-file .env --restart unless-stopped "$IMAGE"

echo ""
echo "Comunitree is running."
echo "  URL:    http://localhost:${PORT}"
echo "  Logs:   docker logs -f $CONTAINER_NAME"
echo "  Stop:   docker stop $CONTAINER_NAME"
echo "  Attach: ./docker-run.bash --foreground"
echo ""
echo "If this is the first run and you have not initialized Snowflake yet, run:"
echo "  ./docker-run.bash --init-db    # then re-run this script to start the app"
echo "  ./docker-run.bash --migrate    # optional: run migrations (after init)"
