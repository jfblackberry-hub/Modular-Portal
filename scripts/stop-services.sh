#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local/services"
PID_DIR="$STATE_DIR/pids"

PORTAL_PORT=3000
API_PORT=3002
ADMIN_PORT=3003

kill_pid_if_running() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

wait_for_pid_exit() {
  local pid="$1"
  local attempt

  if [ -z "$pid" ]; then
    return 0
  fi

  for attempt in $(seq 1 20); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
}

stop_service() {
  local label="$1"
  local port="$2"
  local pid_file="$PID_DIR/$label.pid"
  local pid=''
  local stopped='false'

  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    kill_pid_if_running "$pid"
    wait_for_pid_exit "$pid"
    rm -f "$pid_file"
    stopped='true'
  fi

  while lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    pid="$(lsof -tiTCP:"$port" -sTCP:LISTEN | head -n 1)"
    kill_pid_if_running "$pid"
    wait_for_pid_exit "$pid"
    stopped='true'
  done

  if [ "$stopped" = 'true' ]; then
    echo "Stopped $label"
  else
    echo "$label was not running"
  fi
}

stop_service 'portal-web' "$PORTAL_PORT"
stop_service 'api' "$API_PORT"
stop_service 'admin-console' "$ADMIN_PORT"

cd "$ROOT_DIR"
docker compose stop postgres >/dev/null 2>&1 || true

if lsof -tiTCP:"$PORTAL_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Portal is still listening on port $PORTAL_PORT"
  exit 1
fi

if lsof -tiTCP:"$API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "API is still listening on port $API_PORT"
  exit 1
fi

if lsof -tiTCP:"$ADMIN_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Admin console is still listening on port $ADMIN_PORT"
  exit 1
fi

if curl -fsS "http://127.0.0.1:$PORTAL_PORT/provider-login" >/dev/null 2>&1; then
  echo 'Provider login page is still reachable after stop.'
  exit 1
fi

if curl -fsS "http://127.0.0.1:$PORTAL_PORT/provider/documents" >/dev/null 2>&1; then
  echo 'Provider resources page is still reachable after stop.'
  exit 1
fi

echo 'All Modular portal services are stopped.'
