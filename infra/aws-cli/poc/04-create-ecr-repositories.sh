#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

CONFIG_PATH="${1:-}"
load_config "${CONFIG_PATH}"
load_state

STACK_NAME="${STACK_NAME:-$(default_stack_name compute)}"
TEMPLATE_PATH="$(resolve_template_file compute.yaml)"
PARAMETERS_PATH="${PARAMETERS_FILE:-$(mktemp)}"
read -r -a repositories <<< "${ECR_REPOSITORIES}"

if [[ ${#repositories[@]} -eq 0 ]]; then
  echo "ECR_REPOSITORIES must define at least one repository name." >&2
  exit 1
fi

if [[ -z "${PARAMETERS_FILE:-}" ]]; then
  trap 'rm -f "${PARAMETERS_PATH}"' EXIT
  create_parameters_file "${PARAMETERS_PATH}" \
    "EnvironmentName=${ENVIRONMENT}" \
    "Owner=${OWNER}" \
    "RepositoryName1=${repositories[0]}" \
    "RepositoryName2=${repositories[1]:-}" \
    "RepositoryName3=${repositories[2]:-}"
fi

preflight_checks "${TEMPLATE_PATH}"
deploy_stack "${STACK_NAME}" "${TEMPLATE_PATH}" "${PARAMETERS_PATH}"
save_stack_outputs "${STACK_NAME}"

print_stack_outputs "${STACK_NAME}"
