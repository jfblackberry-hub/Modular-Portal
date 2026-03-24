#!/usr/bin/env bash

set -euo pipefail

ENV="${ENV:-${1:-dev}}"
REGION="${REGION:-us-east-1}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
MODULES=(
  application
  compute
  shared-services
  data
  security
  networking
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

  if ! stack_exists "${stack_name}"; then
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

confirm_destroy() {
  if [[ "${AUTO_APPROVE}" == "true" ]]; then
    return 0
  fi

  if [[ ! -t 0 ]]; then
    echo "Refusing to delete stacks without confirmation in a non-interactive shell." >&2
    echo "Set AUTO_APPROVE=true to continue." >&2
    exit 1
  fi

  echo "This will delete the AWS CloudFormation stacks for ${ENV} in ${REGION}:"
  printf '  - %s\n' "${MODULES[@]/#/${ENV}-}"
  echo
  read -r -p "Type ${ENV} to confirm teardown: " confirmation

  if [[ "${confirmation}" != "${ENV}" ]]; then
    echo "Confirmation did not match. Aborting."
    exit 1
  fi
}

get_stack_resources_by_type() {
  local stack_name="$1"
  local resource_type="$2"

  aws cloudformation list-stack-resources \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "StackResourceSummaries[?ResourceType=='${resource_type}'].PhysicalResourceId" \
    --output text
}

stop_cloudtrail_logging() {
  local stack_name="$1"
  local trails trail_name

  trails="$(get_stack_resources_by_type "${stack_name}" 'AWS::CloudTrail::Trail')"
  [[ -n "${trails}" && "${trails}" != "None" ]] || return 0

  for trail_name in ${trails}; do
    echo "Stopping CloudTrail logging for ${trail_name}..."
    aws cloudtrail stop-logging \
      --name "${trail_name}" \
      --region "${REGION}" >/dev/null || true
  done
}

disable_rds_deletion_protection() {
  local stack_name="$1"
  local db_instances db_instance_identifier deletion_protection

  db_instances="$(get_stack_resources_by_type "${stack_name}" 'AWS::RDS::DBInstance')"
  [[ -n "${db_instances}" && "${db_instances}" != "None" ]] || return 0

  for db_instance_identifier in ${db_instances}; do
    deletion_protection="$(
      aws rds describe-db-instances \
        --db-instance-identifier "${db_instance_identifier}" \
        --region "${REGION}" \
        --query 'DBInstances[0].DeletionProtection' \
        --output text
    )"

    if [[ "${deletion_protection}" == "True" ]]; then
      echo "Disabling deletion protection on RDS instance ${db_instance_identifier}..."
      aws rds modify-db-instance \
        --db-instance-identifier "${db_instance_identifier}" \
        --no-deletion-protection \
        --apply-immediately \
        --region "${REGION}" >/dev/null

      aws rds wait db-instance-available \
        --db-instance-identifier "${db_instance_identifier}" \
        --region "${REGION}"
    fi
  done
}

force_delete_ecr_repositories() {
  local stack_name="$1"
  local repositories repository_name

  repositories="$(get_stack_resources_by_type "${stack_name}" 'AWS::ECR::Repository')"
  [[ -n "${repositories}" && "${repositories}" != "None" ]] || return 0

  for repository_name in ${repositories}; do
    echo "Force deleting ECR repository ${repository_name}..."
    aws ecr delete-repository \
      --repository-name "${repository_name}" \
      --force \
      --region "${REGION}" >/dev/null || true
  done
}

delete_s3_object_versions() {
  local bucket_name="$1"
  local delete_payload

  while true; do
    delete_payload="$(
      aws s3api list-object-versions \
        --bucket "${bucket_name}" \
        --region "${REGION}" \
        --output json |
        python3 -c '
import json
import sys

payload = json.load(sys.stdin)
objects = []
for key in ("Versions", "DeleteMarkers"):
    for item in payload.get(key, []):
        objects.append({"Key": item["Key"], "VersionId": item["VersionId"]})

print(json.dumps({"Objects": objects, "Quiet": True}, separators=(",", ":")))
'
    )"

    if [[ "${delete_payload}" == '{"Objects":[],"Quiet":true}' ]]; then
      break
    fi

    aws s3api delete-objects \
      --bucket "${bucket_name}" \
      --delete "${delete_payload}" \
      --region "${REGION}" >/dev/null
  done
}

empty_s3_buckets() {
  local stack_name="$1"
  local buckets bucket_name

  buckets="$(get_stack_resources_by_type "${stack_name}" 'AWS::S3::Bucket')"
  [[ -n "${buckets}" && "${buckets}" != "None" ]] || return 0

  for bucket_name in ${buckets}; do
    echo "Emptying S3 bucket ${bucket_name}..."
    delete_s3_object_versions "${bucket_name}"
  done
}

prepare_stack_for_deletion() {
  local stack_name="$1"

  stop_cloudtrail_logging "${stack_name}"
  force_delete_ecr_repositories "${stack_name}"
  empty_s3_buckets "${stack_name}"
  disable_rds_deletion_protection "${stack_name}"
}

delete_stack() {
  local stack_name="$1"
  local status

  if ! stack_exists "${stack_name}"; then
    echo "Skipping ${stack_name}; stack does not exist."
    return 0
  fi

  status="$(stack_status "${stack_name}")"

  case "${status}" in
    DELETE_COMPLETE)
      echo "Skipping ${stack_name}; stack is already deleted."
      return 0
      ;;
    DELETE_IN_PROGRESS)
      echo "Waiting for ${stack_name} deletion already in progress..."
      ;;
    *)
      prepare_stack_for_deletion "${stack_name}"
      echo "Deleting ${stack_name}..."
      aws cloudformation delete-stack \
        --stack-name "${stack_name}" \
        --region "${REGION}"
      ;;
  esac

  if ! aws cloudformation wait stack-delete-complete \
    --stack-name "${stack_name}" \
    --region "${REGION}"; then
    echo "Deletion failed for ${stack_name}." >&2
    print_stack_events "${stack_name}"
    exit 1
  fi

  echo "Deleted ${stack_name}."
}

require_command aws
require_command python3
confirm_destroy

for module in "${MODULES[@]}"; do
  delete_stack "${ENV}-${module}"
done

echo "Teardown complete."
