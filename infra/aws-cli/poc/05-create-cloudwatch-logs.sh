#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

CONFIG_PATH="${1:-}"
load_config "${CONFIG_PATH}"
load_state

STACK_NAME="${STACK_NAME:-$(default_stack_name shared-services)}"
TEMPLATE_PATH="$(resolve_template_file shared-services.yaml)"
PARAMETERS_PATH="${PARAMETERS_FILE:-$(mktemp)}"
read -r -a log_groups <<< "${CLOUDWATCH_LOG_GROUPS}"

if [[ ${#log_groups[@]} -eq 0 ]]; then
  echo "CLOUDWATCH_LOG_GROUPS must define at least one log group." >&2
  exit 1
fi

for index in "${!log_groups[@]}"; do
  log_groups[${index}]="$(basename "${log_groups[${index}]}")"
done

if [[ -z "${PARAMETERS_FILE:-}" ]]; then
  trap 'rm -f "${PARAMETERS_PATH}"' EXIT
  create_parameters_file "${PARAMETERS_PATH}" \
    "EnvironmentName=${ENVIRONMENT}" \
    "Owner=${OWNER}" \
    "RetentionDays=${CLOUDWATCH_RETENTION_DAYS}" \
    "LogGroupName1=${log_groups[0]}" \
    "LogGroupName2=${log_groups[1]:-}" \
    "LogGroupName3=${log_groups[2]:-}"
fi

preflight_checks "${TEMPLATE_PATH}"
deploy_stack "${STACK_NAME}" "${TEMPLATE_PATH}" "${PARAMETERS_PATH}"
save_stack_outputs "${STACK_NAME}"

print_stack_outputs "${STACK_NAME}"
