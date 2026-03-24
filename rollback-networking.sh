#!/usr/bin/env bash

set -euo pipefail

ENV="${ENV:-${1:-dev}}"
REGION="${REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-${ENV}-networking}"
DEPENDENT_STACKS=(
  "${ENV}-application"
  "${ENV}-security"
  "${ENV}-data"
)

case "${ENV}" in
  dev|qa|demo) ;;
  *)
    echo "ENV must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

stack_exists() {
  local stack_name="$1"
  aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" >/dev/null 2>&1
}

stack_status() {
  local stack_name="$1"
  aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query 'Stacks[0].StackStatus' \
    --output text
}

print_stack_events() {
  local stack_name="$1"

  echo "Recent events for ${stack_name}:"
  aws cloudformation describe-stack-events \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --max-items 20 \
    --query 'StackEvents[].{Time:Timestamp,Resource:LogicalResourceId,Status:ResourceStatus,Reason:ResourceStatusReason}' \
    --output table || true
}

check_dependencies() {
  local dependent_stack
  local status

  for dependent_stack in "${DEPENDENT_STACKS[@]}"; do
    if stack_exists "${dependent_stack}"; then
      status="$(stack_status "${dependent_stack}")"
      case "${status}" in
        DELETE_COMPLETE)
          ;;
        *)
          echo "Cannot roll back ${STACK_NAME} while dependent stack ${dependent_stack} exists with status ${status}." >&2
          echo "Delete ${dependent_stack} first, then rerun rollback-networking.sh." >&2
          exit 1
          ;;
      esac
    fi
  done
}

require_command aws

if ! stack_exists "${STACK_NAME}"; then
  echo "Networking stack ${STACK_NAME} does not exist in ${REGION}."
  exit 0
fi

check_dependencies

echo "Rolling back networking stack ${STACK_NAME}..."
aws cloudformation delete-stack \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}"

if ! aws cloudformation wait stack-delete-complete \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}"; then
  echo "Rollback failed for ${STACK_NAME}." >&2
  print_stack_events "${STACK_NAME}"
  exit 1
fi

echo "Networking rollback complete for ${STACK_NAME}."
