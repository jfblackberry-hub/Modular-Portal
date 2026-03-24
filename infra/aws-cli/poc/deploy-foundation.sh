#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_PATH="${1:-}"

"${SCRIPT_DIR}/01-create-network.sh" "${CONFIG_PATH}"
"${SCRIPT_DIR}/02-create-security-groups.sh" "${CONFIG_PATH}"
"${SCRIPT_DIR}/04-create-ecr-repositories.sh" "${CONFIG_PATH}"
"${SCRIPT_DIR}/05-create-cloudwatch-logs.sh" "${CONFIG_PATH}"

echo
echo "Foundation deployment complete."
echo "State file: ${SCRIPT_DIR}/state/foundation.env"
