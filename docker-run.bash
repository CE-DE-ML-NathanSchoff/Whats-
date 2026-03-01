#!/bin/sh
# POSIX-compliant: run with sh or bash. For debug output use DEBUG=1 ./docker-run.bash
set -e

IMAGE="${IMAGE:-ghcr.io/ce-de-ml-nathanschoff/whats:backend-docker}"
PORT="${PORT:-8000}"
CONTAINER_NAME="${CONTAINER_NAME:-comunitree-backend}"

debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $*" >&2; }

# --- Step 1: Check Docker ---
debug "Step 1: Checking Docker availability"
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi
debug "Docker path: $(command -v docker)"
[ -n "$DEBUG" ] && docker --version

# --- Step 2: Pull image ---
debug "Step 2: Pulling image"
echo "Pulling image: $IMAGE"
if ! docker pull "$IMAGE"; then
  echo "Error: failed to pull $IMAGE" >&2
  exit 1
fi
debug "Pull completed for: $IMAGE"

# --- Step 3: Ensure .env ---
debug "Step 3: Checking .env"
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    debug "Copying .env.example -> .env"
    cp .env.example .env
    echo "Created .env from .env.example. Please edit .env and set JWT_SECRET and your Snowflake credentials, then run this script again." >&2
    exit 1
  else
    debug "No .env or .env.example; will run without env file"
    echo "Warning: .env not found and no .env.example to copy. Run without env file." >&2
  fi
else
  debug ".env exists; will use --env-file .env"
fi

# --- Step 4: Clean existing container ---
debug "Step 4: Cleaning existing container (name=$CONTAINER_NAME)"
EXISTING=$(docker ps -a -q -f "name=^${CONTAINER_NAME}$" 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  debug "Found container: $EXISTING"
  echo "Stopping and removing existing container: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
  debug "Container removed"
else
  debug "No existing container named $CONTAINER_NAME"
fi

# --- Step 5: Run container ---
debug "Step 5: Running container"
if [ -f .env ]; then
  debug "Command: docker run -p ${PORT}:8000 --name $CONTAINER_NAME --env-file .env $* $IMAGE"
  exec docker run -p "${PORT}:8000" --name "$CONTAINER_NAME" --env-file .env "$@" "$IMAGE"
else
  debug "Command: docker run -p ${PORT}:8000 --name $CONTAINER_NAME $* $IMAGE"
  exec docker run -p "${PORT}:8000" --name "$CONTAINER_NAME" "$@" "$IMAGE"
fi
