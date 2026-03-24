#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.local/services"
PID_DIR="$STATE_DIR/pids"

PORTAL_PORT="${PORTAL_WEB_PORT:-3000}"
API_PORT="${API_PORT:-3002}"
ADMIN_PORT="${ADMIN_CONSOLE_PORT:-3003}"

is_pid_running() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1
}

collect_descendant_pids() {
  local parent_pid="$1"
  local child_pid

  while read -r child_pid; do
    [ -n "$child_pid" ] || continue
    printf '%s\n' "$child_pid"
    collect_descendant_pids "$child_pid"
  done < <(ps -eo pid=,ppid= | awk -v parent="$parent_pid" '$2 == parent { print $1 }')
}

wait_for_pids_exit() {
  local -a pids=("$@")
  local attempt
  local pid

  if [ "${#pids[@]}" -eq 0 ]; then
    return 0
  fi

  for attempt in $(seq 1 20); do
    local still_running='false'
    for pid in "${pids[@]}"; do
      if is_pid_running "$pid"; then
        still_running='true'
        break
      fi
    done

    if [ "$still_running" = 'false' ]; then
      return 0
    fi

    sleep 1
  done

  return 1
}

stop_pid_tree() {
  local pid="$1"
  local label="$2"
  local context="$3"
  local -a process_tree=()
  local -a still_running=()
  local target_pid

  if ! is_pid_running "$pid"; then
    return 0
  fi

  while read -r target_pid; do
    [ -n "$target_pid" ] || continue
    process_tree+=("$target_pid")
  done < <(
    {
      printf '%s\n' "$pid"
      collect_descendant_pids "$pid"
    } | awk '!seen[$0]++'
  )

  for target_pid in "${process_tree[@]}"; do
    if is_pid_running "$target_pid"; then
      kill "$target_pid" >/dev/null 2>&1 || true
    fi
  done

  if wait_for_pids_exit "${process_tree[@]}"; then
    return 0
  fi

  still_running=()
  for target_pid in "${process_tree[@]}"; do
    if is_pid_running "$target_pid"; then
      still_running+=("$target_pid")
    fi
  done

  if [ "${#still_running[@]}" -gt 0 ]; then
    echo "Force stopping hung $label process(es) from $context: ${still_running[*]}"
    for target_pid in "${still_running[@]}"; do
      kill -9 "$target_pid" >/dev/null 2>&1 || true
    done
  fi
}

stop_service() {
  local label="$1"
  local port="$2"
  local pid_file="$PID_DIR/$label.pid"
  local pid=''
  local stopped='false'
  local max_port_passes=8
  local pass

  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    stop_pid_tree "$pid" "$label" "pid file"
    rm -f "$pid_file"
    stopped='true'
  fi

  if [ "$port" = '0' ]; then
    if [ "$stopped" = 'true' ]; then
      echo "Stopped $label"
    else
      echo "$label was not running"
    fi
    return 0
  fi

  for pass in $(seq 1 "$max_port_passes"); do
    if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi
    stopped='true'

    while read -r pid; do
      [ -n "$pid" ] || continue
      stop_pid_tree "$pid" "$label" "port $port listener"
    done < <(lsof -tiTCP:"$port" -sTCP:LISTEN | awk '!seen[$0]++')

    if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi

    if [ "$pass" -eq "$max_port_passes" ]; then
      echo "Unable to fully stop $label on port $port after $max_port_passes attempts."
      break
    fi

  done

  if [ "$stopped" = 'true' ]; then
    echo "Stopped $label"
  else
    echo "$label was not running"
  fi
}

stop_stale_workspace_dev_processes() {
  local line
  local pid
  local command
  local stopped_any='false'

  while IFS= read -r line; do
    [ -n "$line" ] || continue
    pid="$(printf '%s\n' "$line" | awk '{print $1}')"
    command="$(printf '%s\n' "$line" | cut -d' ' -f2-)"

    [ -n "$pid" ] || continue
    [ -n "$command" ] || continue

    case "$command" in
      *"$ROOT_DIR"*'pnpm dev:api'*|\
      *"$ROOT_DIR"*'pnpm dev:portal'*|\
      *"$ROOT_DIR"*'pnpm dev:admin'*|\
      *"$ROOT_DIR"*'pnpm dev:worker'*|\
      *"$ROOT_DIR"*'next/dist/bin/next dev'*|\
      *"$ROOT_DIR"*'tsx/dist/cli.mjs watch src/server.ts'*|\
      *"$ROOT_DIR"*'tsx/dist/cli.mjs src/jobs/runWorker.ts'*)
        stop_pid_tree "$pid" 'workspace-dev-process' 'stale process sweep'
        stopped_any='true'
        ;;
    esac
  done < <(ps -eo pid=,command=)

  if [ "$stopped_any" = 'true' ]; then
    echo 'Stopped stale workspace dev processes'
  fi
}

stop_service 'portal-web' "$PORTAL_PORT"
stop_service 'api' "$API_PORT"
stop_service 'admin-console' "$ADMIN_PORT"
stop_service 'job-worker' "0"
stop_stale_workspace_dev_processes

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

if [ -f "$PID_DIR/job-worker.pid" ]; then
  worker_pid="$(cat "$PID_DIR/job-worker.pid")"
  if [ -n "${worker_pid:-}" ] && kill -0 "$worker_pid" >/dev/null 2>&1; then
    echo "Job worker is still running with pid $worker_pid"
    exit 1
  fi
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
