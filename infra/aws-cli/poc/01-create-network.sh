#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

CONFIG_PATH="${1:-}"
load_config "${CONFIG_PATH}"
load_state

STACK_NAME="${STACK_NAME:-$(default_stack_name networking)}"
TEMPLATE_PATH="$(resolve_template_file networking.yaml)"
PARAMETERS_PATH="${PARAMETERS_FILE:-$(mktemp)}"

if [[ -z "${PARAMETERS_FILE:-}" ]]; then
  trap 'rm -f "${PARAMETERS_PATH}"' EXIT
  create_parameters_file "${PARAMETERS_PATH}" \
    "EnvironmentName=${ENVIRONMENT}" \
    "Owner=${OWNER}" \
    "VpcCidr=${VPC_CIDR}" \
    "PublicSubnet1Cidr=${PUBLIC_SUBNET_1_CIDR}" \
    "PublicSubnet2Cidr=${PUBLIC_SUBNET_2_CIDR}" \
    "PrivateSubnet1Cidr=${PRIVATE_SUBNET_1_CIDR}" \
    "PrivateSubnet2Cidr=${PRIVATE_SUBNET_2_CIDR}"
fi

preflight_checks "${TEMPLATE_PATH}"
deploy_stack "${STACK_NAME}" "${TEMPLATE_PATH}" "${PARAMETERS_PATH}"
save_stack_outputs "${STACK_NAME}"

print_stack_outputs "${STACK_NAME}"
