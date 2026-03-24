#!/usr/bin/env bash

set -euo pipefail

ENV="${ENV:-${1:-dev}}"
REGION="${REGION:-us-east-1}"
STACKS=(
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

wait_for_drift_detection() {
  local stack_name="$1"
  local detection_id="$2"
  local detection_status

  while true; do
    detection_status="$(aws cloudformation describe-stack-drift-detection-status \
      --stack-drift-detection-id "${detection_id}" \
      --region "${REGION}" \
      --query 'DetectionStatus' \
      --output text)"

    case "${detection_status}" in
      DETECTION_COMPLETE)
        return 0
        ;;
      DETECTION_FAILED)
        echo "Drift detection failed for ${stack_name}" >&2
        aws cloudformation describe-stack-drift-detection-status \
          --stack-drift-detection-id "${detection_id}" \
          --region "${REGION}" \
          --output table >&2
        exit 1
        ;;
      *)
        sleep 3
        ;;
    esac
  done
}

validate_stack_drift() {
  local stack_name="$1"
  local detection_id
  local drift_status
  local modified_resources

  if ! stack_exists "${stack_name}"; then
    echo "Skipping drift check for ${stack_name} because the stack does not exist."
    return 0
  fi

  echo "Checking stack drift for ${stack_name}..."
  detection_id="$(aws cloudformation detect-stack-drift \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query 'StackDriftDetectionId' \
    --output text)"

  wait_for_drift_detection "${stack_name}" "${detection_id}"

  drift_status="$(aws cloudformation describe-stack-drift-detection-status \
    --stack-drift-detection-id "${detection_id}" \
    --region "${REGION}" \
    --query 'StackDriftStatus' \
    --output text)"

  echo "Drift status: ${drift_status}"
  echo "Modified resources:"

  modified_resources="$(aws cloudformation describe-stack-resource-drifts \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --stack-resource-drift-status-filters MODIFIED DELETED \
    --query 'StackResourceDrifts[].{LogicalResourceId:LogicalResourceId,ResourceType:ResourceType,DriftStatus:StackResourceDriftStatus}' \
    --output table || true)"

  if [[ -z "${modified_resources//[[:space:]]/}" ]]; then
    echo "None"
  else
    echo "${modified_resources}"
  fi

  if [[ "${drift_status}" == "DRIFTED" ]]; then
    echo "Stack ${stack_name} is drifted." >&2
    exit 1
  fi
}

check_vpc() {
  local stack_name="${ENV}-networking"
  local vpc_id
  local vpc_state

  vpc_id="$(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='VpcId'].OutputValue" \
    --output text)"

  if [[ -z "${vpc_id}" || "${vpc_id}" == "None" ]]; then
    echo "VPC output not found for ${stack_name}" >&2
    exit 1
  fi

  vpc_state="$(aws ec2 describe-vpcs \
    --vpc-ids "${vpc_id}" \
    --region "${REGION}" \
    --query 'Vpcs[0].State' \
    --output text)"

  echo "VPC ${vpc_id} state: ${vpc_state}"

  if [[ "${vpc_state}" != "available" ]]; then
    echo "VPC ${vpc_id} is not available." >&2
    exit 1
  fi
}

check_subnets() {
  local stack_name="${ENV}-networking"
  local subnet_ids
  local subnet_id
  local subnet_state

  subnet_ids="$(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='PublicSubnet1Id' || OutputKey=='PublicSubnet2Id' || OutputKey=='PrivateSubnet1Id' || OutputKey=='PrivateSubnet2Id'].OutputValue" \
    --output text)"

  for subnet_id in ${subnet_ids}; do
    subnet_state="$(aws ec2 describe-subnets \
      --subnet-ids "${subnet_id}" \
      --region "${REGION}" \
      --query 'Subnets[0].State' \
      --output text)"

    echo "Subnet ${subnet_id} state: ${subnet_state}"

    if [[ "${subnet_state}" != "available" ]]; then
      echo "Subnet ${subnet_id} is not available." >&2
      exit 1
    fi
  done
}

check_rds() {
  local stack_name="${ENV}-data"
  local db_identifier
  local db_status

  if ! stack_exists "${stack_name}"; then
    echo "Skipping RDS validation because ${stack_name} does not exist."
    return 0
  fi

  db_identifier="$(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='DbInstanceIdentifier'].OutputValue" \
    --output text)"

  if [[ -z "${db_identifier}" || "${db_identifier}" == "None" ]]; then
    echo "RDS output not found for ${stack_name}" >&2
    exit 1
  fi

  db_status="$(aws rds describe-db-instances \
    --db-instance-identifier "${db_identifier}" \
    --region "${REGION}" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text)"

  echo "RDS ${db_identifier} status: ${db_status}"

  if [[ "${db_status}" != "available" ]]; then
    echo "RDS instance ${db_identifier} is not available." >&2
    exit 1
  fi
}

check_application_runtime() {
  local stack_name="${ENV}-application"
  local instance_id
  local instance_state
  local instance_status
  local system_status
  local reserved_public_ip
  local instance_public_ip
  local elastic_ip_allocation_id
  local elastic_ip_instance_id
  local attempts=0

  if ! stack_exists "${stack_name}"; then
    echo "Skipping application runtime validation because ${stack_name} does not exist."
    return 0
  fi

  instance_id="$(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
    --output text)"

  if [[ -z "${instance_id}" || "${instance_id}" == "None" ]]; then
    echo "Application instance output not found for ${stack_name}" >&2
    exit 1
  fi

  reserved_public_ip="$(aws cloudformation describe-stacks \
    --stack-name "${stack_name}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='PublicIp'].OutputValue" \
    --output text)"

  if [[ -z "${reserved_public_ip}" || "${reserved_public_ip}" == "None" ]]; then
    echo "Reserved application Elastic IP output not found for ${stack_name}" >&2
    exit 1
  fi

  instance_state="$(aws ec2 describe-instances \
    --instance-ids "${instance_id}" \
    --region "${REGION}" \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)"

  echo "Application instance ${instance_id} state: ${instance_state}"

  if [[ "${instance_state}" != "running" ]]; then
    echo "Application instance ${instance_id} is not running." >&2
    exit 1
  fi

  instance_public_ip="$(aws ec2 describe-instances \
    --instance-ids "${instance_id}" \
    --region "${REGION}" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)"

  echo "Application instance ${instance_id} public IP: ${instance_public_ip}"
  echo "Reserved application Elastic IP: ${reserved_public_ip}"

  if [[ "${instance_public_ip}" != "${reserved_public_ip}" ]]; then
    echo "Application instance ${instance_id} is not using the reserved Elastic IP ${reserved_public_ip}." >&2
    exit 1
  fi

  elastic_ip_allocation_id="$(aws ec2 describe-addresses \
    --public-ips "${reserved_public_ip}" \
    --region "${REGION}" \
    --query 'Addresses[0].AllocationId' \
    --output text)"
  elastic_ip_instance_id="$(aws ec2 describe-addresses \
    --public-ips "${reserved_public_ip}" \
    --region "${REGION}" \
    --query 'Addresses[0].InstanceId' \
    --output text)"

  echo "Application Elastic IP association: allocation=${elastic_ip_allocation_id}, instance=${elastic_ip_instance_id}"

  if [[ -z "${elastic_ip_allocation_id}" || "${elastic_ip_allocation_id}" == "None" ]]; then
    echo "Elastic IP ${reserved_public_ip} is not allocated in AWS." >&2
    exit 1
  fi

  if [[ "${elastic_ip_instance_id}" != "${instance_id}" ]]; then
    echo "Elastic IP ${reserved_public_ip} is not associated with application instance ${instance_id}." >&2
    exit 1
  fi

  while true; do
    instance_status="$(aws ec2 describe-instance-status \
      --instance-ids "${instance_id}" \
      --region "${REGION}" \
      --query 'InstanceStatuses[0].InstanceStatus.Status' \
      --output text)"
    system_status="$(aws ec2 describe-instance-status \
      --instance-ids "${instance_id}" \
      --region "${REGION}" \
      --query 'InstanceStatuses[0].SystemStatus.Status' \
      --output text)"

    if [[ "${instance_status}" == "ok" && "${system_status}" == "ok" ]]; then
      break
    fi

    attempts=$((attempts + 1))
    if [[ ${attempts} -ge 20 ]]; then
      break
    fi

    sleep 15
  done

  echo "Application instance checks: instance=${instance_status}, system=${system_status}"

  if [[ "${instance_status}" != "ok" || "${system_status}" != "ok" ]]; then
    echo "Application instance ${instance_id} has not passed EC2 status checks." >&2
    exit 1
  fi
}

require_command aws

for stack in "${STACKS[@]}"; do
  validate_stack_drift "${ENV}-${stack}"
done

check_vpc
check_subnets
check_application_runtime

echo "Validation complete."
