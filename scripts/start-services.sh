#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local/services"
LOG_DIR="$STATE_DIR/logs"
PID_DIR="$STATE_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

PORTAL_PORT=3000
API_PORT=3002
ADMIN_PORT=3003
POSTGRES_PORT=5432

export DATABASE_URL="${DATABASE_URL:-postgresql://dev:dev@127.0.0.1:5432/payer_portal}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3002}"
export NEXT_PUBLIC_ADMIN_USER_ID="${NEXT_PUBLIC_ADMIN_USER_ID:-}"

service_label_for_port() {
  case "$1" in
    "$PORTAL_PORT") printf 'portal-web' ;;
    "$API_PORT") printf 'api' ;;
    "$ADMIN_PORT") printf 'admin-console' ;;
    *) printf 'unknown' ;;
  esac
}

pid_file_for_port() {
  printf '%s/%s.pid' "$PID_DIR" "$(service_label_for_port "$1")"
}

is_port_listening() {
  lsof -tiTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

listening_pid_for_port() {
  lsof -tiTCP:"$1" -sTCP:LISTEN | head -n 1
}

command_for_pid() {
  ps -p "$1" -o command= 2>/dev/null | sed 's/^[[:space:]]*//'
}

assert_port_free() {
  local port="$1"
  local label
  local pid
  local command

  if is_port_listening "$port"; then
    label="$(service_label_for_port "$port")"
    pid="$(listening_pid_for_port "$port")"
    command=''

    if [ -n "$pid" ]; then
      command="$(command_for_pid "$pid")"
    fi

    echo "Cannot start $label: port $port is already in use."
    if [ -n "$pid" ]; then
      echo "  PID: $pid"
    fi
    if [ -n "$command" ]; then
      echo "  Command: $command"
    fi
    echo "  Next step: run 'pnpm services:stop' or stop the process above, then retry."
    exit 1
  fi
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempt

  for attempt in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for $label at $url"
  exit 1
}

wait_for_portal_path() {
  local path="$1"
  local label="$2"
  local attempt
  local status_code
  local url="http://127.0.0.1:$PORTAL_PORT$path"

  for attempt in $(seq 1 45); do
    status_code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    case "$status_code" in
      200|301|302|303|307|308)
        return 0
        ;;
    esac
    sleep 1
  done

  echo "Timed out waiting for $label at $url"
  echo "Last HTTP status: ${status_code:-n/a}"
  exit 1
}

resolve_platform_admin_user_id() {
  docker compose exec -T postgres psql -U dev -d payer_portal -tAc \
    "SELECT u.id
     FROM \"User\" u
     INNER JOIN \"UserRole\" ur ON ur.\"userId\" = u.id
     INNER JOIN \"Role\" r ON r.id = ur.\"roleId\"
     WHERE r.code IN ('platform_admin', 'platform-admin')
     ORDER BY u.\"createdAt\" ASC
     LIMIT 1;" 2>/dev/null | tr -d '[:space:]'
}

record_listener_pid() {
  local port="$1"
  local pid_file
  local pid

  pid_file="$(pid_file_for_port "$port")"
  pid="$(lsof -tiTCP:"$port" -sTCP:LISTEN | head -n 1)"
  printf '%s\n' "$pid" >"$pid_file"
}

start_service() {
  local label="$1"
  local command="$2"
  local log_file="$LOG_DIR/$label.log"

  rm -f "$log_file"
  echo "Starting $label"
  (
    cd "$ROOT_DIR"
    nohup bash -lc "$command" >"$log_file" 2>&1 &
  )
}

assert_port_free "$PORTAL_PORT"
assert_port_free "$API_PORT"
assert_port_free "$ADMIN_PORT"

cd "$ROOT_DIR"

echo 'Starting postgres'
docker compose up -d postgres >/dev/null

for attempt in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U dev -d payer_portal >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$attempt" -eq 30 ]; then
    echo 'Postgres did not become ready in time.'
    exit 1
  fi
done

if [ -z "$NEXT_PUBLIC_ADMIN_USER_ID" ]; then
  NEXT_PUBLIC_ADMIN_USER_ID="$(resolve_platform_admin_user_id)"

  if [ -n "$NEXT_PUBLIC_ADMIN_USER_ID" ]; then
    export NEXT_PUBLIC_ADMIN_USER_ID
  else
    echo 'Warning: no platform admin user found. Admin console platform links may require manual NEXT_PUBLIC_ADMIN_USER_ID.'
  fi
fi

start_service 'api' "DATABASE_URL='$DATABASE_URL' pnpm dev:api"
start_service 'portal-web' "NEXT_PUBLIC_API_BASE_URL='$NEXT_PUBLIC_API_BASE_URL' pnpm dev:portal"
start_service 'admin-console' "NEXT_PUBLIC_API_BASE_URL='$NEXT_PUBLIC_API_BASE_URL' NEXT_PUBLIC_ADMIN_USER_ID='$NEXT_PUBLIC_ADMIN_USER_ID' pnpm dev:admin"

wait_for_http "http://127.0.0.1:$API_PORT/health" 'api health endpoint'
wait_for_http "http://127.0.0.1:$PORTAL_PORT" 'portal homepage'
wait_for_http "http://127.0.0.1:$ADMIN_PORT" 'admin console homepage'

wait_for_portal_path "/provider-login" 'provider login page'
wait_for_portal_path "/provider/dashboard" 'provider dashboard route'
wait_for_portal_path "/provider/documents" 'provider resources route'
wait_for_portal_path "/assets/portal-images/doctor-consultation.svg" 'provider hero image asset'

record_listener_pid "$API_PORT"
record_listener_pid "$PORTAL_PORT"
record_listener_pid "$ADMIN_PORT"

echo
echo 'Services are running:'
echo "  postgres      http://127.0.0.1:$POSTGRES_PORT"
echo "  portal-web    http://127.0.0.1:$PORTAL_PORT"
echo "  provider-login http://127.0.0.1:$PORTAL_PORT/provider-login"
echo "  provider-app   http://127.0.0.1:$PORTAL_PORT/provider/dashboard"
echo "  provider-docs  http://127.0.0.1:$PORTAL_PORT/provider/documents"
echo "  api           http://127.0.0.1:$API_PORT/health"
echo "  admin-console http://127.0.0.1:$ADMIN_PORT"
if [ -n "$NEXT_PUBLIC_ADMIN_USER_ID" ]; then
  echo "  admin-user-id  $NEXT_PUBLIC_ADMIN_USER_ID"
fi
echo "  logs          $LOG_DIR"
echo
echo 'Validation checks passed.'
