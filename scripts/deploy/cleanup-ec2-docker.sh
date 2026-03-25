#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"

case "${ENVIRONMENT}" in
  dev|qa|demo) ;;
  *)
    echo "ENVIRONMENT must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

STACK_NAME="${ENVIRONMENT}-application"

INSTANCE_ID="$(
  aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" \
    --output text
)"

if [[ -z "${INSTANCE_ID}" || "${INSTANCE_ID}" == "None" ]]; then
  echo "Unable to determine application instance id from stack ${STACK_NAME}." >&2
  exit 1
fi

read -r -d '' CLEANUP_SCRIPT <<'EOF' || true
set -euo pipefail

echo "--- BEFORE ---"
df -h /
docker system df || true

echo "--- SAFE PRUNE ---"
docker container prune -f
docker image prune -a -f
docker builder prune -a -f

echo "--- AFTER ---"
df -h /
docker system df || true
EOF

COMMAND_ID="$(
  aws ssm send-command \
    --region "${REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --parameters "$(jq -cn --arg cmd "${CLEANUP_SCRIPT}" '{commands: [$cmd]}')" \
    --query "Command.CommandId" \
    --output text
)"

echo "SSM command id: ${COMMAND_ID}"

while true; do
  STATUS="$(
    aws ssm get-command-invocation \
      --region "${REGION}" \
      --command-id "${COMMAND_ID}" \
      --instance-id "${INSTANCE_ID}" \
      --query "Status" \
      --output text
  )"

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
      echo "Remote cleanup failed with status ${STATUS}." >&2
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
