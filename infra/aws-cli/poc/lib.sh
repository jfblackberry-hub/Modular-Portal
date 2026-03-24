#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
CFN_TEMPLATE_DIR="${REPO_ROOT}/infra/cloudformation"
STATE_DIR="${SCRIPT_DIR}/state"
STATE_FILE="${STATE_DIR}/foundation.env"

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

ensure_state_dir() {
  mkdir -p "${STATE_DIR}"
  touch "${STATE_FILE}"
}

load_config() {
  local config_path="${1:-}"

  if [[ -n "${config_path}" ]]; then
    if [[ ! -f "${config_path}" ]]; then
      echo "Config file not found at ${config_path}." >&2
      exit 1
    fi

    # shellcheck source=/dev/null
    source "${config_path}"
  elif [[ -f "${SCRIPT_DIR}/config.sh" ]]; then
    # shellcheck source=/dev/null
    source "${SCRIPT_DIR}/config.sh"
  fi

  detect_region
}

detect_region() {
  if [[ -z "${AWS_REGION:-}" ]]; then
    AWS_REGION="${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}"
  fi

  if [[ -z "${AWS_REGION:-}" ]]; then
    echo "AWS_REGION is not set and no default AWS CLI region could be detected." >&2
    exit 1
  fi

  export AWS_REGION
  export AWS_DEFAULT_REGION="${AWS_REGION}"
  export AWS_PAGER="${AWS_PAGER:-}"
}

load_state() {
  ensure_state_dir
  # shellcheck source=/dev/null
  source "${STATE_FILE}"
}

save_kv() {
  local key="$1"
  local value="$2"
  local tmp_file

  ensure_state_dir
  tmp_file="$(mktemp)"
  trap 'rm -f "${tmp_file}"' RETURN

  awk -v key="${key}" -v value="${value}" '
    BEGIN { updated = 0 }
    index($0, key "=") == 1 {
      printf "%s=\"%s\"\n", key, value
      updated = 1
      next
    }
    { print }
    END {
      if (updated == 0) {
        printf "%s=\"%s\"\n", key, value
      }
    }
  ' "${STATE_FILE}" > "${tmp_file}"

  mv "${tmp_file}" "${STATE_FILE}"
  trap - RETURN
}

normalize_output_key() {
  local output_key="$1"

  case "${output_key}" in
    VpcId) printf 'VPC_ID\n' ;;
    PublicSubnet1Id) printf 'PUBLIC_SUBNET_1_ID\n' ;;
    PublicSubnet2Id) printf 'PUBLIC_SUBNET_2_ID\n' ;;
    PrivateSubnet1Id) printf 'PRIVATE_SUBNET_1_ID\n' ;;
    PrivateSubnet2Id) printf 'PRIVATE_SUBNET_2_ID\n' ;;
    PrivateSubnetIds) printf 'PRIVATE_SUBNET_IDS\n' ;;
    PublicSubnetIds) printf 'PUBLIC_SUBNET_IDS\n' ;;
    InternetGatewayId) printf 'IGW_ID\n' ;;
    PublicRouteTableId) printf 'PUBLIC_ROUTE_TABLE_ID\n' ;;
    PrivateRouteTableId) printf 'PRIVATE_ROUTE_TABLE_ID\n' ;;
    NatEipAllocationId) printf 'NAT_EIP_ALLOCATION_ID\n' ;;
    NatGatewayId) printf 'NAT_GATEWAY_ID\n' ;;
    AvailabilityZone1) printf 'AZ_1\n' ;;
    AvailabilityZone2) printf 'AZ_2\n' ;;
    AlbSecurityGroupId) printf 'ALB_SG_ID\n' ;;
    EcsSecurityGroupId) printf 'ECS_SG_ID\n' ;;
    RdsSecurityGroupId) printf 'RDS_SG_ID\n' ;;
    EcsTaskExecutionRoleName) printf 'ECS_TASK_EXECUTION_ROLE_NAME\n' ;;
    EcsTaskExecutionRoleArn) printf 'ECS_TASK_EXECUTION_ROLE_ARN\n' ;;
    EcsTaskRoleName) printf 'ECS_TASK_ROLE_NAME\n' ;;
    EcsTaskRoleArn) printf 'ECS_TASK_ROLE_ARN\n' ;;
    DbInstanceIdentifier) printf 'DB_INSTANCE_IDENTIFIER\n' ;;
    DbEndpointAddress) printf 'DB_ENDPOINT_ADDRESS\n' ;;
    DbEndpointPort) printf 'DB_ENDPOINT_PORT\n' ;;
    DbSubnetGroupName) printf 'DB_SUBNET_GROUP_NAME\n' ;;
    EcrRepository1Uri) printf 'ECR_REPOSITORY_1_URI\n' ;;
    EcrRepository2Uri) printf 'ECR_REPOSITORY_2_URI\n' ;;
    EcrRepository3Uri) printf 'ECR_REPOSITORY_3_URI\n' ;;
    LogGroup1Name) printf 'LOG_GROUP_1_NAME\n' ;;
    LogGroup2Name) printf 'LOG_GROUP_2_NAME\n' ;;
    LogGroup3Name) printf 'LOG_GROUP_3_NAME\n' ;;
    *)
      printf '%s\n' "${output_key}" | sed -E 's/([A-Z]+)([A-Z][a-z])/\1_\2/g; s/([a-z0-9])([A-Z])/\1_\2/g' | tr '[:lower:]' '[:upper:]'
      ;;
  esac
}

name_prefix() {
  printf '%s-%s' "${PROJECT_NAME}" "${ENVIRONMENT}"
}

default_stack_name() {
  local component="$1"
  printf '%s-%s' "$(name_prefix)" "${component}"
}

resolve_template_file() {
  local default_template="$1"

  if [[ -n "${TEMPLATE_FILE:-}" ]]; then
    printf '%s\n' "${TEMPLATE_FILE}"
  else
    printf '%s\n' "${CFN_TEMPLATE_DIR}/${default_template}"
  fi
}

preflight_checks() {
  local template_file="$1"

  echo "Starting deployment..."

  require_command aws
  detect_region

  aws sts get-caller-identity >/dev/null

  if [[ ! -f "${template_file}" ]]; then
    echo "Template file not found: ${template_file}" >&2
    exit 1
  fi

  echo "Validating template..."
  aws cloudformation validate-template --template-body "file://${template_file}" >/dev/null
}

stack_tags() {
  printf '%s\n' \
    "Project=${PROJECT_NAME}" \
    "Environment=${ENVIRONMENT}" \
    "ManagedBy=aws-cli" \
    "Owner=${OWNER}"
}

deploy_stack() {
  local stack_name="$1"
  local template_file="$2"
  local parameters_file="$3"
  local tags=()

  while IFS= read -r tag; do
    tags+=("${tag}")
  done < <(stack_tags)

  echo "Deploying stack..."
  aws cloudformation deploy \
    --template-file "${template_file}" \
    --stack-name "${stack_name}" \
    --parameter-overrides "file://${parameters_file}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${AWS_REGION}" \
    --no-fail-on-empty-changeset \
    --tags "${tags[@]}"
  echo "Deployment complete"
}

save_stack_outputs() {
  local stack_name="$1"
  local state_key

  while IFS=$'\t' read -r output_key output_value; do
    [[ -n "${output_key:-}" && "${output_key}" != "None" ]] || continue
    state_key="$(normalize_output_key "${output_key}")"
    save_kv "${state_key}" "${output_value}"
  done < <(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output text)
}

create_parameters_file() {
  local file_path="$1"
  shift

  : > "${file_path}"
  printf '[\n' >> "${file_path}"

  local first=1
  local pair key value
  for pair in "$@"; do
    key="${pair%%=*}"
    value="${pair#*=}"

    if [[ ${first} -eq 0 ]]; then
      printf ',\n' >> "${file_path}"
    fi

    printf '  {"ParameterKey":"%s","ParameterValue":"%s"}' "${key}" "${value}" >> "${file_path}"
    first=0
  done

  printf '\n]\n' >> "${file_path}"
}

require_state_value() {
  local key="$1"
  local value="${!key:-}"

  if [[ -z "${value}" || "${value}" == "None" ]]; then
    echo "${key} not found in state. Run the prerequisite stack deployment first." >&2
    exit 1
  fi
}

print_stack_outputs() {
  local stack_name="$1"
  aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
    --output text
}
