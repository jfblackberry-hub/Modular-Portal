#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${SCRIPT_DIR}/infra/cloudformation"
PARAMS_DIR="${SCRIPT_DIR}/params"

ENV="${ENV:-${1:-dev}}"
REGION="${REGION:-us-east-1}"
MODULES=(
  networking
  security
  shared-services
  compute
  application
)

case "${ENV}" in
  dev|qa|demo) ;;
  *)
    echo "ENV must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

CURRENT_STACK_NAME=""

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

extract_tag_value() {
  local params_file="$1"
  local key="$2"

  python3 - "$params_file" "$key" <<'PY'
import json
import sys

params_file, key = sys.argv[1], sys.argv[2]
with open(params_file, encoding="utf-8") as fh:
    params = json.load(fh)

for item in params:
    if item.get("ParameterKey") == key:
        print(item.get("ParameterValue", ""))
        break
PY
}

print_stack_events() {
  local stack_name="$1"

  if [[ -z "${stack_name}" ]]; then
    return 0
  fi

  if ! stack_exists "${stack_name}"; then
    echo "Stack ${stack_name} was not created, so there are no stack events to display."
    return 0
  fi

  echo "Recent events for ${stack_name}:"
  aws cloudformation describe-stack-events \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --max-items 20 \
    --query 'StackEvents[].{Time:Timestamp,Resource:LogicalResourceId,Status:ResourceStatus,Reason:ResourceStatusReason}' \
    --output table || true
}

handle_failure() {
  local exit_code=$?

  if [[ ${exit_code} -ne 0 ]]; then
    echo "Deployment failed for ${CURRENT_STACK_NAME:-unknown stack}."
    print_stack_events "${CURRENT_STACK_NAME}"
  fi

  exit "${exit_code}"
}

trap handle_failure EXIT

ensure_deployable_stack() {
  local stack_name="$1"
  local status

  if ! stack_exists "${stack_name}"; then
    return 0
  fi

  status="$(stack_status "${stack_name}")"

  if [[ "${status}" == "ROLLBACK_COMPLETE" ]]; then
    echo "Deleting ${stack_name} because it is in ROLLBACK_COMPLETE..."
    aws cloudformation delete-stack \
      --stack-name "${stack_name}" \
      --region "${REGION}"
    aws cloudformation wait stack-delete-complete \
      --stack-name "${stack_name}" \
      --region "${REGION}"
  fi
}

deploy_module() {
  local module="$1"
  local template_file="${TEMPLATE_DIR}/${module}.yaml"
  local params_file="${PARAMS_DIR}/${ENV}/${module}.json"
  local stack_name="${ENV}-${module}"
  local owner
  local cost_center

  if [[ ! -f "${template_file}" ]]; then
    echo "Template file not found: ${template_file}" >&2
    exit 1
  fi

  if [[ ! -f "${params_file}" ]]; then
    echo "Parameter file not found: ${params_file}" >&2
    exit 1
  fi

  CURRENT_STACK_NAME="${stack_name}"
  ensure_deployable_stack "${stack_name}"
  owner="$(extract_tag_value "${params_file}" "Owner")"
  cost_center="$(extract_tag_value "${params_file}" "CostCenter")"

  echo "Deploying ${module} stack..."
  aws cloudformation deploy \
    --template-file "${template_file}" \
    --stack-name "${stack_name}" \
    --parameter-overrides "file://${params_file}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${REGION}" \
    --no-fail-on-empty-changeset \
    --tags \
      "Environment=${ENV}" \
      "Application=Modular_Portal_Pilot" \
      "Owner=${owner}" \
      "CostCenter=${cost_center}" \
      "Module=${module}" \
      "ManagedBy=cloudshell-deploy"

  aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --output table
}

for module in "${MODULES[@]}"; do
  deploy_module "${module}"
done

if stack_exists "${ENV}-data"; then
  echo "Legacy stack ${ENV}-data still exists."
  echo "Delete it after validating the EC2-based portal cutover if you want to remove RDS cost:"
  echo "aws cloudformation delete-stack --stack-name ${ENV}-data --region ${REGION}"
fi

trap - EXIT
echo "Deployment complete."
