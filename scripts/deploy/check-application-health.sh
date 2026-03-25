#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"
STACK_NAME="${ENVIRONMENT}-application"

case "${ENVIRONMENT}" in
  dev|qa|demo) ;;
  *)
    echo "ENVIRONMENT must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

get_output() {
  local key="$1"
  aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue" \
    --output text
}

check_url() {
  local label="$1"
  local url="$2"
  local attempts="${3:-10}"
  local delay_seconds="${4:-6}"
  local attempt=1

  while [[ ${attempt} -le ${attempts} ]]; do
    if curl -fsS --max-time 15 "${url}" >/dev/null; then
      echo "${label} ok: ${url}"
      return 0
    fi

    sleep "${delay_seconds}"
    attempt=$((attempt + 1))
  done

  echo "${label} failed: ${url}" >&2
  return 1
}

PORTAL_URL="$(get_output PortalUrl)"
ADMIN_URL="$(get_output AdminUrl)"
API_URL="$(get_output ApiUrl)"

if [[ -z "${PORTAL_URL}" || -z "${ADMIN_URL}" || -z "${API_URL}" ]]; then
  echo "Unable to resolve application endpoint outputs from ${STACK_NAME}." >&2
  exit 1
fi

check_url "portal-liveness" "${PORTAL_URL}/liveness"
check_url "admin-liveness" "${ADMIN_URL}/liveness"
check_url "api-readiness" "${API_URL}/health/ready"
