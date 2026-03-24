#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

CONFIG_PATH="${1:-}"
load_config "${CONFIG_PATH}"
load_state

STACK_NAME="${STACK_NAME:-$(default_stack_name security)}"
TEMPLATE_PATH="$(resolve_template_file security.yaml)"
PARAMETERS_PATH="${PARAMETERS_FILE:-$(mktemp)}"

if [[ -z "${PARAMETERS_FILE:-}" ]]; then
  trap 'rm -f "${PARAMETERS_PATH}"' EXIT
  create_parameters_file "${PARAMETERS_PATH}" \
    "EnvironmentName=${ENVIRONMENT}" \
    "Owner=${OWNER}" \
    "AppPort=${APP_PORT}" \
    "AdminPort=${ADMIN_PORT:-3003}" \
    "ApiPort=${API_PORT:-3002}" \
    "DbPort=${DB_PORT}" \
    "S3BucketArn1=${S3_BUCKET_ARN_1:-}" \
    "S3BucketArn2=${S3_BUCKET_ARN_2:-}" \
    "S3BucketArn3=${S3_BUCKET_ARN_3:-}" \
    "SecretArn1=${SECRET_ARN_1:-}" \
    "SecretArn2=${SECRET_ARN_2:-}" \
    "SecretArn3=${SECRET_ARN_3:-}"
fi

preflight_checks "${TEMPLATE_PATH}"
deploy_stack "${STACK_NAME}" "${TEMPLATE_PATH}" "${PARAMETERS_PATH}"
save_stack_outputs "${STACK_NAME}"

print_stack_outputs "${STACK_NAME}"
