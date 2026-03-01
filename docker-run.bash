#!/usr/bin/env bash
# Run Comunitree in Docker: ensures .env, optional DB init/migrations, then runs the app.
# Usage:
#   ./docker-run.bash [--init-db] [--migrate] [--foreground]
#   or: bash docker-run.bash [--init-db] [--migrate] [--foreground]  (if script not executable)
#   --init-db   Run Snowflake schema init once (one-off container) then continue to run.
#   --migrate   Run DB migrations (private/friends, profile/config) then continue to run.
#   --foreground  Run container in foreground (no -d).
# If you get "Permission denied", run: chmod +x docker-run.bash
# Debug: DEBUG=1 ./docker-run.bash
# Re-exec with bash if invoked via sh (dash doesn't support read -s/-p used in step 2).
[ -z "${BASH_VERSION}" ] && exec bash "$0" "$@"
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
ENV_EXAMPLE="${SCRIPT_DIR}/.env.example"
IMAGE="${IMAGE:-ghcr.io/ce-de-ml-nathanschoff/whats:main}"
PORT="${PORT:-8000}"
CONTAINER_NAME="${CONTAINER_NAME:-comunitree}"
RUN_INIT_DB=0
RUN_MIGRATE=0
FOREGROUND=0
SAVED_ARGS=("$@")
while [ $# -gt 0 ]; do
  case "$1" in
    --init-db)   RUN_INIT_DB=1; shift ;;
    --migrate)   RUN_MIGRATE=1; shift ;;
    --foreground) FOREGROUND=1; shift ;;
    *) shift ;;
  esac
done

debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $*" >&2; }

# #region agent log
DBG_LOG="${SCRIPT_DIR}/.cursor/debug-841063.log"
dbg_log() { mkdir -p "$(dirname "$DBG_LOG")" 2>/dev/null; echo "{\"sessionId\":\"841063\",\"message\":\"$1\",\"data\":{$2},\"timestamp\":$(( $(date +%s) * 1000 ))}" >> "$DBG_LOG" 2>/dev/null || true; }
sanitize_err() { printf '%s' "$1" | tr '\n' ' ' | sed 's/"/\\"/g'; }
show_docker_permission_hint() {
  if echo "$1" | grep -qiE 'permission denied|not permitted|cannot connect to the Docker daemon'; then
    echo "" >&2
    echo "Docker reported a permission error. On this host you may need to:" >&2
    echo "  • Run with sudo: sudo $0 ${SAVED_ARGS[*]}" >&2
    echo "  • Or add your user to the docker group: sudo usermod -aG docker \$USER" >&2
    echo "    then log out and back in (or newgrp docker), and run again without sudo." >&2
    echo "" >&2
  fi
}
# #endregion

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
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created .env from .env.example."
    need_env_prompt=1
  else
    echo "Error: No .env or .env.example found in: $SCRIPT_DIR" >&2
    echo "Run this script from the Comunitree repo root (where .env.example lives), or copy .env.example there." >&2
    exit 1
  fi
else
  # Check for placeholders
  if grep -q 'your_account_identifier\|your_username\|your_password\|your-super-secret-jwt-key-change-in-production' "$ENV_FILE" 2>/dev/null; then
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
  if [ -f "$ENV_EXAMPLE" ]; then
    sed -e "s|your-super-secret-jwt-key-change-in-production|$JWT_SECRET|g" \
        -e "s|your_account_identifier|$SNOWFLAKE_ACCOUNT|g" \
        -e "s|your_username|$SNOWFLAKE_USERNAME|g" \
        -e "s|your_password|$SNOWFLAKE_PASSWORD|g" \
        -e "s|^SNOWFLAKE_WAREHOUSE=.*|SNOWFLAKE_WAREHOUSE=$SNOWFLAKE_WAREHOUSE|" \
        -e "s|^SNOWFLAKE_DATABASE=.*|SNOWFLAKE_DATABASE=$SNOWFLAKE_DATABASE|" \
        -e "s|^SNOWFLAKE_SCHEMA=.*|SNOWFLAKE_SCHEMA=$SNOWFLAKE_SCHEMA|" \
        -e "s|^SNOWFLAKE_ROLE=.*|SNOWFLAKE_ROLE=$SNOWFLAKE_ROLE|" \
        "$ENV_EXAMPLE" > "$ENV_FILE"
  fi
  echo ""
  echo ".env has been updated. For MFA, edit .env and set SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA and SNOWFLAKE_PASSCODE before running --init-db."
  echo ""
fi

# --- Step 3: Pull image (needed for init/migrate and run) ---
# #region agent log
dbg_log "step_start" "\"step\":3,\"name\":\"pull_image\""
# #endregion
debug "Step 3: Pulling image"
echo "Pulling image: $IMAGE"
PULL_ERR=$(docker pull "$IMAGE" 2>&1); PULL_RET=$?
if [ "$PULL_RET" -ne 0 ]; then
  dbg_log "step_failed" "\"step\":3,\"error\":\"$(sanitize_err "$PULL_ERR")\""
  echo "Error: failed to pull $IMAGE" >&2
  echo "$PULL_ERR" >&2
  show_docker_permission_hint "$PULL_ERR" "$@"
  exit 1
fi

# --- Step 4: Optional DB init ---
if [ "$RUN_INIT_DB" = "1" ]; then
  # #region agent log
  dbg_log "step_start" "\"step\":4,\"name\":\"init_db\""
  # #endregion
  debug "Step 4a: Running Snowflake schema init"
  echo "Running one-time DB init (Snowflake schema)..."
  INIT_ERR=$(docker run --rm --env-file "$ENV_FILE" "$IMAGE" node server/db/init.js 2>&1); INIT_RET=$?
  if [ "$INIT_RET" -ne 0 ]; then
    dbg_log "step_failed" "\"step\":4,\"error\":\"$(sanitize_err "$INIT_ERR")\""
    echo "DB init failed. Fix .env (e.g. Snowflake credentials, MFA passcode) and run again with --init-db." >&2
    echo "$INIT_ERR" >&2
    show_docker_permission_hint "$INIT_ERR" "$@"
    exit 1
  fi
  echo "DB init completed."
fi

# --- Step 5: Optional migrations ---
if [ "$RUN_MIGRATE" = "1" ]; then
  debug "Step 5: Running migrations"
  echo "Running migration: migratePrivateAndFriends..."
  docker run --rm --env-file "$ENV_FILE" "$IMAGE" node server/db/migratePrivateAndFriends.js
  echo "Running migration: migrateProfileAndConfig..."
  docker run --rm --env-file "$ENV_FILE" "$IMAGE" node server/db/migrateProfileAndConfig.js
  echo "Migrations completed."
fi

# --- Step 6: Clean existing container ---
# #region agent log
dbg_log "step_start" "\"step\":6,\"name\":\"clean_container\""
# #endregion
debug "Step 6: Cleaning existing container"
EXISTING=$(docker ps -a -q -f "name=^${CONTAINER_NAME}$" 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  echo "Stopping and removing existing container: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# --- Step 7: Run container ---
# #region agent log
dbg_log "step_start" "\"step\":7,\"name\":\"run_container\""
# #endregion
debug "Step 7: Running container"
DETACH="-d"
[ "$FOREGROUND" = "1" ] && DETACH=""

echo "Starting Comunitree on port $PORT..."
if [ "$FOREGROUND" = "1" ]; then
  exec docker run -p "${PORT}:8000" --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --rm $DETACH "$IMAGE"
fi

RUN_ERR=$(docker run $DETACH -p "${PORT}:8000" --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --restart unless-stopped "$IMAGE" 2>&1); RUN_RET=$?
if [ "$RUN_RET" -ne 0 ]; then
  dbg_log "step_failed" "\"step\":7,\"error\":\"$(sanitize_err "$RUN_ERR")\""
  echo "Error: failed to run container" >&2
  echo "$RUN_ERR" >&2
  show_docker_permission_hint "$RUN_ERR" "$@"
  exit 1
fi

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
