#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"

case "${ENVIRONMENT}" in
  dev|qa|demo)
    ;;
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

COMMAND_ID="$(
  aws ssm send-command \
    --region "${REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --parameters "commands=[\"cd /opt/modular-portal\",\"docker compose run --rm --entrypoint sh api -lc 'cd /workspace && pnpm --filter @payer-portal/database exec prisma migrate deploy'\"]" \
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
      echo "Database migration failed with status ${STATUS}." >&2
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
