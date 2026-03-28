#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"

if [[ $# -ge 2 ]]; then
  shift 2
else
  shift $# || true
fi

SERVICES=("$@")

if [[ ${#SERVICES[@]} -eq 0 ]]; then
  SERVICES=(portal-web admin-console api)
fi

case "${ENVIRONMENT}" in
  dev|qa|demo) ;;
  *)
    echo "ENVIRONMENT must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

STACK_NAME="${ENVIRONMENT}-application"

INSTANCE_ID="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
  --output text)"

if [[ -z "${INSTANCE_ID}" || "${INSTANCE_ID}" == "None" ]]; then
  echo "Unable to determine application instance id from stack ${STACK_NAME}." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity \
  --region "${REGION}" \
  --query "Account" \
  --output text)"

if [[ -z "${ACCOUNT_ID}" || "${ACCOUNT_ID}" == "None" ]]; then
  echo "Unable to determine AWS account id." >&2
  exit 1
fi

compose_targets="${SERVICES[*]}"
PARAMETERS_FILE="$(mktemp)"
trap 'rm -f "${PARAMETERS_FILE}"' EXIT

cat > "${PARAMETERS_FILE}" <<EOF
{
  "commands": [
    "aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com",
    "cd /opt/modular-portal",
    "docker compose pull ${compose_targets} 2>&1 | tee /tmp/modular-portal-compose-pull.log",
    "if grep -qiE 'authorization token has expired|pull access denied|error response from daemon|denied:' /tmp/modular-portal-compose-pull.log; then exit 1; fi",
    "docker compose up -d ${compose_targets}",
    "sleep 15",
    "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'"
  ]
}
EOF

COMMAND_ID="$(
  aws ssm send-command \
    --region "${REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --parameters "file://${PARAMETERS_FILE}" \
    --query "Command.CommandId" \
    --output text
)"

echo "SSM command id: ${COMMAND_ID}"

while true; do
  STATUS="$(aws ssm get-command-invocation \
    --region "${REGION}" \
    --command-id "${COMMAND_ID}" \
    --instance-id "${INSTANCE_ID}" \
    --query "Status" \
    --output text)"

  case "${STATUS}" in
    Pending|InProgress|Delayed)
      sleep 5
      ;;
    Success)
      break
      ;;
    *)
      aws ssm get-command-invocation \
        --region "${REGION}" \
        --command-id "${COMMAND_ID}" \
        --instance-id "${INSTANCE_ID}" \
        --output json
      echo "Remote deploy failed with status ${STATUS}." >&2
      exit 1
      ;;
  esac
done

aws ssm get-command-invocation \
  --region "${REGION}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}" \
  --query "{Status:Status,Stdout:StandardOutputContent,Stderr:StandardErrorContent}" \
  --output json
