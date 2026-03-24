#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

CONFIG_PATH="${1:-}"
load_config "${CONFIG_PATH}"
load_state

STACK_NAME="${STACK_NAME:-$(default_stack_name data)}"
TEMPLATE_PATH="$(resolve_template_file data.yaml)"
PARAMETERS_PATH="${PARAMETERS_FILE:-$(mktemp)}"

if [[ -z "${PARAMETERS_FILE:-}" ]]; then
  trap 'rm -f "${PARAMETERS_PATH}"' EXIT
  create_parameters_file "${PARAMETERS_PATH}" \
    "EnvironmentName=${ENVIRONMENT}" \
    "Owner=${OWNER}" \
    "DbName=${DB_NAME}" \
    "DbMasterUsername=${DB_MASTER_USERNAME}" \
    "DbMasterUserPassword=${DB_MASTER_PASSWORD}" \
    "DbInstanceClass=${DB_INSTANCE_CLASS}" \
    "DbAllocatedStorage=${DB_ALLOCATED_STORAGE}" \
    "DbPort=${DB_PORT}" \
    "DbEngineVersion=${DB_ENGINE_VERSION}" \
    "DbStorageType=${DB_STORAGE_TYPE}" \
    "DbBackupRetentionDays=${DB_BACKUP_RETENTION_DAYS}" \
    "DbMultiAz=${DB_MULTI_AZ}" \
    "DbDeletionProtection=${DB_DELETION_PROTECTION}"
fi

preflight_checks "${TEMPLATE_PATH}"
deploy_stack "${STACK_NAME}" "${TEMPLATE_PATH}" "${PARAMETERS_PATH}"
save_stack_outputs "${STACK_NAME}"

print_stack_outputs "${STACK_NAME}"
