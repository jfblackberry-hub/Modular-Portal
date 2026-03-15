#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local/services"
LOG_DIR="$STATE_DIR/logs"

PORTAL_PORT=3000
API_PORT=3002
ADMIN_PORT=3003

listening_pid_for_port() {
  lsof -tiTCP:"$1" -sTCP:LISTEN | head -n 1
}

command_for_pid() {
  ps -p "$1" -o command= 2>/dev/null | sed 's/^[[:space:]]*//'
}

http_status_for_url() {
  curl -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || true
}

print_http_service_status() {
  local label="$1"
  local port="$2"
  local url="$3"
  local pid
  local command
  local http_code

  pid="$(listening_pid_for_port "$port")"

  if [ -z "$pid" ]; then
    printf '%-14s stopped\n' "$label"
    return 0
  fi

  command="$(command_for_pid "$pid")"
  http_code="$(http_status_for_url "$url")"

  printf '%-14s running  port=%s  pid=%s  http=%s\n' "$label" "$port" "$pid" "${http_code:-n/a}"
  if [ -n "$command" ]; then
    printf '  command: %s\n' "$command"
  fi
}

print_postgres_status() {
  local status

  status="$(docker compose ps --status running postgres --format json 2>/dev/null || true)"

  if [ -n "$status" ]; then
    printf '%-14s running  port=%s\n' "postgres" "5432"
  else
    printf '%-14s stopped\n' "postgres"
  fi
}

echo 'Modular Portal service status'
echo
print_postgres_status
print_http_service_status 'portal-web' "$PORTAL_PORT" "http://127.0.0.1:$PORTAL_PORT"
print_http_service_status 'api' "$API_PORT" "http://127.0.0.1:$API_PORT/health"
print_http_service_status 'admin-console' "$ADMIN_PORT" "http://127.0.0.1:$ADMIN_PORT"
echo
echo "Logs: $LOG_DIR"
