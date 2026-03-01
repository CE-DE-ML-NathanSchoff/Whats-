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
  echo ".env has been updated. Run --init-db to generate and save the Snowflake key pair."
  echo "For MFA, edit .env and set SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA and SNOWFLAKE_PASSCODE before running --init-db."
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

# --- Step 3.5: Helper to inject the private key into .env as base64 ---
inject_key_into_env() {
  local pem="$1"
  if [ -z "$pem" ]; then
    echo "Warning: no private key content to inject into .env." >&2
    return 1
  fi
  local key_b64
  key_b64=$(printf '%s' "$pem" | base64 | tr -d '\n')
  # Remove any existing SNOWFLAKE_PRIVATE_KEY or SNOWFLAKE_PRIVATE_KEY_PATH lines, then append the new key
  local tmpfile="${ENV_FILE}.tmp.$$"
  grep -v '^SNOWFLAKE_PRIVATE_KEY_PATH=' "$ENV_FILE" | grep -v '^SNOWFLAKE_PRIVATE_KEY=' > "$tmpfile" || true
  # Also strip comment-only lines about the old key-path approach
  echo "SNOWFLAKE_PRIVATE_KEY=${key_b64}" >> "$tmpfile"
  mv "$tmpfile" "$ENV_FILE"
  debug "Injected SNOWFLAKE_PRIVATE_KEY (base64, ${#key_b64} chars) into .env"
  echo "Private key saved to .env as SNOWFLAKE_PRIVATE_KEY (base64-encoded)."
}

# --- Step 4: Optional DB init ---
if [ "$RUN_INIT_DB" = "1" ]; then
  # #region agent log
  dbg_log "step_start" "\"step\":4,\"name\":\"init_db\""
  # #endregion
  debug "Step 4a: Running Snowflake schema init"
  echo "Running one-time DB init (Snowflake schema)..."
  echo "With key-pair (default): you will be prompted for your MFA code once; init-db generates a key pair, registers it with Snowflake, and saves the private key to .env."

  TEMP_KEY_FILE="${SCRIPT_DIR}/.snowflake_rsa_key_tmp.p8"
  rm -f "$TEMP_KEY_FILE" 2>/dev/null || true

  # #region agent log
  DEBUG_LOG="${SCRIPT_DIR}/.cursor/debug-843cca.log"
  mkdir -p "$(dirname "$DEBUG_LOG")" 2>/dev/null
  # H3/H4: Log the env file's key path value and what this script is passing
  ENV_KEY_PATH_VAL=$(grep '^SNOWFLAKE_PRIVATE_KEY_PATH=' "$ENV_FILE" 2>/dev/null || echo "(not set)")
  ENV_KEY_VAL_LEN=$(grep '^SNOWFLAKE_PRIVATE_KEY=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | wc -c | tr -d ' ')
  echo "{\"sessionId\":\"843cca\",\"hypothesisId\":\"H3_H4\",\"location\":\"docker-run.bash:step4\",\"message\":\"env_file_values\",\"data\":{\"SNOWFLAKE_PRIVATE_KEY_PATH_in_env\":\"${ENV_KEY_PATH_VAL}\",\"SNOWFLAKE_PRIVATE_KEY_len\":${ENV_KEY_VAL_LEN:-0},\"script_will_pass\":\"/tmp/snowflake_rsa_key.p8\"},\"timestamp\":$(date +%s)000}" >> "$DEBUG_LOG"
  # H1/H2: Run diagnostic container to check user, writable dirs
  DIAG=$(docker run --rm --env-file "$ENV_FILE" -e SNOWFLAKE_PRIVATE_KEY_PATH="/tmp/snowflake_rsa_key.p8" "$IMAGE" sh -c \
    'echo "uid=$(id -u) user=$(whoami) tmp_writable=$(test -w /tmp && echo yes || echo no) app_writable=$(test -w /app && echo yes || echo no) key_path_env=${SNOWFLAKE_PRIVATE_KEY_PATH}"' 2>&1 || echo "diag_failed")
  echo "{\"sessionId\":\"843cca\",\"hypothesisId\":\"H1_H2\",\"location\":\"docker-run.bash:step4_diag\",\"message\":\"container_diagnostics\",\"data\":{\"diag\":\"${DIAG}\"},\"timestamp\":$(date +%s)000}" >> "$DEBUG_LOG"
  # #endregion

  # Use docker create/start/cp to avoid all mount permission issues:
  # init.js writes to /tmp (always writable), then we docker cp it out
  INIT_CONTAINER=$(docker create -it \
    --env-file "$ENV_FILE" \
    -e SNOWFLAKE_PRIVATE_KEY_PATH="/tmp/snowflake_rsa_key.p8" \
    "$IMAGE" node server/db/init.js)

  set +e
  docker start -ai "$INIT_CONTAINER"
  INIT_RET=$?
  set -e

  # Always extract the key BEFORE checking exit code — the key may have been
  # generated successfully even if a later step (e.g. second pool connection)
  # failed with TOTP Invalid.
  docker cp "${INIT_CONTAINER}:/tmp/snowflake_rsa_key.p8" "$TEMP_KEY_FILE" 2>/dev/null
  CP_RET=$?
  docker rm "$INIT_CONTAINER" >/dev/null 2>&1 || true

  # #region agent log
  echo "{\"sessionId\":\"b9c3ac\",\"hypothesisId\":\"H1\",\"location\":\"docker-run.bash:step4_post\",\"message\":\"init_and_cp_result\",\"data\":{\"init_exit\":${INIT_RET},\"cp_exit\":${CP_RET},\"key_file_exists\":\"$(test -f "$TEMP_KEY_FILE" && echo yes || echo no)\",\"key_file_size\":\"$(wc -c < "$TEMP_KEY_FILE" 2>/dev/null || echo 0)\"},\"timestamp\":$(date +%s)000}" >> "$DBG_LOG"
  # #endregion

  KEY_INJECTED=0
  if [ -f "$TEMP_KEY_FILE" ] && [ -s "$TEMP_KEY_FILE" ]; then
    KEY_PEM=$(cat "$TEMP_KEY_FILE")
    rm -f "$TEMP_KEY_FILE"
    inject_key_into_env "$KEY_PEM"
    KEY_INJECTED=1
  else
    rm -f "$TEMP_KEY_FILE" 2>/dev/null || true
  fi

  if [ "$INIT_RET" -ne 0 ]; then
    if [ "$KEY_INJECTED" = "1" ]; then
      echo "Note: init-db exited with code $INIT_RET (likely expired TOTP on a second pool connection),"
      echo "  but the RSA key pair was created and saved to .env successfully."
      echo "  Re-running --init-db to finish schema setup with the new key..."
      # #region agent log
      echo "{\"sessionId\":\"b9c3ac\",\"hypothesisId\":\"H2\",\"location\":\"docker-run.bash:step4_retry\",\"message\":\"retrying_init_with_jwt\",\"timestamp\":$(date +%s)000}" >> "$DBG_LOG"
      # #endregion
      RETRY_CONTAINER=$(docker create \
        --env-file "$ENV_FILE" \
        "$IMAGE" node server/db/init.js)
      set +e
      docker start -ai "$RETRY_CONTAINER"
      RETRY_RET=$?
      set -e
      docker rm "$RETRY_CONTAINER" >/dev/null 2>&1 || true
      # #region agent log
      echo "{\"sessionId\":\"b9c3ac\",\"hypothesisId\":\"H2\",\"location\":\"docker-run.bash:step4_retry_done\",\"message\":\"retry_result\",\"data\":{\"retry_exit\":${RETRY_RET}},\"timestamp\":$(date +%s)000}" >> "$DBG_LOG"
      # #endregion
      if [ "$RETRY_RET" -ne 0 ]; then
        dbg_log "step_failed" "\"step\":4,\"error\":\"init-db retry exited with code $RETRY_RET\""
        echo "DB init retry failed (exit code $RETRY_RET)." >&2
        exit 1
      fi
      echo "DB init completed on retry. Key is saved to .env."
    else
      dbg_log "step_failed" "\"step\":4,\"error\":\"init-db exited with code $INIT_RET\""
      echo "DB init failed (exit code $INIT_RET). Fix .env (Snowflake credentials or MFA) and run again with --init-db." >&2
      exit 1
    fi
  else
    if [ "$KEY_INJECTED" = "1" ]; then
      echo "DB init completed. Key saved to .env."
    else
      echo "DB init completed but no new key file was written." >&2
      echo "  If key-pair auth was already set up, the existing SNOWFLAKE_PRIVATE_KEY in .env will be used." >&2
    fi
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

# Pre-flight: if JWT auth is configured, verify that SNOWFLAKE_PRIVATE_KEY is present in .env
if grep -q 'SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT' "$ENV_FILE" 2>/dev/null; then
  if ! grep -q '^SNOWFLAKE_PRIVATE_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
    echo "Error: Cannot start — SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT is set but SNOWFLAKE_PRIVATE_KEY is empty or missing in .env." >&2
    echo "  Run:  ./docker-run.bash --init-db   to generate and save the key first." >&2
    exit 1
  fi
  debug "SNOWFLAKE_PRIVATE_KEY found in .env — no volume mount needed."
fi
echo "Starting Comunitree (frontend $PORT, backend 7000)..."
if [ "$FOREGROUND" = "1" ]; then
  exec docker run -p "${PORT}:8000" -p "7000:7000" --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --rm $DETACH "$IMAGE"
fi

RUN_ERR=$(docker run $DETACH -p "${PORT}:8000" -p "7000:7000" --name "$CONTAINER_NAME" --env-file "$ENV_FILE" --restart unless-stopped "$IMAGE" 2>&1); RUN_RET=$?
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
