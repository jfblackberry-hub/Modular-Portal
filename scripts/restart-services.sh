#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo 'Restarting Modular Portal services'
echo

bash "$ROOT_DIR/scripts/stop-services.sh"
echo
bash "$ROOT_DIR/scripts/start-services.sh"
