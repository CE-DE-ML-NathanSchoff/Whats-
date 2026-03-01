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
ENV_EXAMPLE_RAW_URL="${ENV_EXAMPLE_RAW_URL:-https://raw.githubusercontent.com/CE-DE-ML-NathanSchoff/Whats-/main/.env.example}"
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
  if [ ! -f "$ENV_EXAMPLE" ]; then
    if command -v wget >/dev/null 2>&1; then
      echo "No .env.example found. Downloading latest from repo..."
      if wget --no-cache -q -O "$ENV_EXAMPLE" "$ENV_EXAMPLE_RAW_URL" 2>/dev/null; then
        echo "Downloaded .env.example from $ENV_EXAMPLE_RAW_URL"
      else
        rm -f "$ENV_EXAMPLE"
        echo "Error: No .env or .env.example found in: $SCRIPT_DIR" >&2
        echo "Run this script from the Comunitree repo root (where .env.example lives), or copy .env.example there." >&2
        exit 1
      fi
    else
      echo "Error: No .env or .env.example found in: $SCRIPT_DIR" >&2
      echo "Run this script from the Comunitree repo root (where .env.example lives), or copy .env.example there." >&2
      exit 1
    fi
  fi
  if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created .env from .env.example."
    need_env_prompt=1
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

  JWT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET (openssl rand -hex 32)."

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

# --- Step 3.5: Ensure key volume directory and permissions ---
KEY_VOLUME="${KEY_VOLUME:-comunitree_snowflake_keys}"
KEY_PATH="/secrets/snowflake_rsa_key.p8"

ensure_secrets_volume() {
  debug "Ensuring /secrets dir exists with correct permissions in volume ${KEY_VOLUME}"
  docker volume create "$KEY_VOLUME" >/dev/null 2>&1 || true
  docker run --rm -v "${KEY_VOLUME}:/secrets" "$IMAGE" sh -c \
    'mkdir -p /secrets && chmod 777 /secrets' 2>/dev/null || true
}

fix_key_permissions() {
  debug "Fixing permissions on $KEY_PATH inside volume ${KEY_VOLUME}"
  docker run --rm -v "${KEY_VOLUME}:/secrets" "$IMAGE" sh -c \
    "[ -f $KEY_PATH ] && chmod 644 $KEY_PATH || true" 2>/dev/null || true
}

verify_key_readable() {
  debug "Verifying $KEY_PATH exists and is readable"
  local check
  check=$(docker run --rm -v "${KEY_VOLUME}:/secrets" "$IMAGE" sh -c \
    "if [ ! -f $KEY_PATH ]; then echo MISSING; elif [ ! -r $KEY_PATH ]; then echo UNREADABLE; else echo OK; fi" 2>&1)
  case "$check" in
    MISSING)
      echo "Warning: $KEY_PATH does not exist in volume '${KEY_VOLUME}'." >&2
      echo "  Run with --init-db to generate the Snowflake key pair." >&2
      return 1 ;;
    UNREADABLE)
      echo "Warning: $KEY_PATH exists but is not readable. Attempting to fix permissions..." >&2
      fix_key_permissions
      local recheck
      recheck=$(docker run --rm -v "${KEY_VOLUME}:/secrets" "$IMAGE" sh -c \
        "[ -r $KEY_PATH ] && echo OK || echo FAIL" 2>&1)
      if [ "$recheck" != "OK" ]; then
        echo "Error: Could not fix permissions on $KEY_PATH." >&2
        echo "  Try manually: docker run --rm -v ${KEY_VOLUME}:/secrets alpine chmod 644 $KEY_PATH" >&2
        return 1
      fi
      echo "Permissions fixed." ;;
    OK) debug "Key file is present and readable." ;;
    *)
      echo "Warning: Could not verify key file (volume may not exist yet). Output: $check" >&2
      return 1 ;;
  esac
  return 0
}

# --- Step 4: Optional DB init ---
if [ "$RUN_INIT_DB" = "1" ]; then
  # #region agent log
  dbg_log "step_start" "\"step\":4,\"name\":\"init_db\""
  # #endregion
  debug "Step 4a: Running Snowflake schema init"
  echo "Running one-time DB init (Snowflake schema)..."
  echo "With key-pair (default): you will be prompted for your MFA code once; init-db creates a key and writes it to a volume so the app can use it 24/7."
  ensure_secrets_volume
  set +e
  docker run -it --rm -v "${KEY_VOLUME}:/secrets" --env-file "$ENV_FILE" -e SNOWFLAKE_PRIVATE_KEY_PATH="$KEY_PATH" "$IMAGE" node server/db/init.js
  INIT_RET=$?
  set -e
  if [ "$INIT_RET" -ne 0 ]; then
    dbg_log "step_failed" "\"step\":4,\"error\":\"init-db exited with code $INIT_RET\""
    echo "DB init failed (exit code $INIT_RET). Fix .env (Snowflake credentials, key path, or MFA) and run again with --init-db." >&2
    exit 1
  fi
  fix_key_permissions
  if verify_key_readable; then
    echo "DB init completed. Key written and verified."
  else
    echo "DB init completed but key verification failed. The app may not start correctly." >&2
  fi
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

KEY_ENV=""
if grep -q 'SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT' "$ENV_FILE" 2>/dev/null; then
  KEY_ENV="-v ${KEY_VOLUME}:/secrets -e SNOWFLAKE_PRIVATE_KEY_PATH=${KEY_PATH}"
  ensure_secrets_volume
  if ! verify_key_readable; then
    echo "Error: Cannot start — Snowflake JWT auth is configured but the private key is missing or unreadable." >&2
    echo "  Run:  ./docker-run.bash --init-db   to generate the key first." >&2
    exit 1
  fi
fi
echo "Starting Comunitree (frontend $PORT, backend 7000)..."
if [ "$FOREGROUND" = "1" ]; then
  exec docker run -p "${PORT}:8000" -p "7000:7000" $KEY_ENV --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --rm $DETACH "$IMAGE"
fi

RUN_ERR=$(docker run $DETACH -p "${PORT}:8000" -p "7000:7000" $KEY_ENV --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --restart unless-stopped "$IMAGE" 2>&1); RUN_RET=$?
if [ "$RUN_RET" -ne 0 ]; then
  dbg_log "step_failed" "\"step\":7,\"error\":\"$(sanitize_err "$RUN_ERR")\""
  echo "Error: failed to run container" >&2
  echo "$RUN_ERR" >&2
  show_docker_permission_hint "$RUN_ERR" "$@"
  exit 1
fi

echo ""
echo "Comunitree is running."
echo "  Frontend: http://localhost:${PORT}"
echo "  Backend:  http://localhost:7000"
echo "  Logs:     docker logs -f $CONTAINER_NAME"
echo "  Stop:   docker stop $CONTAINER_NAME"
echo "  Attach: ./docker-run.bash --foreground"
echo ""
echo "If this is the first run and you have not initialized Snowflake yet, run:"
echo "  ./docker-run.bash --init-db    # then re-run this script to start the app"
echo "  ./docker-run.bash --migrate    # optional: run migrations (after init)"
