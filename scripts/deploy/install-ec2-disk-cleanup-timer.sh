#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"
INTERVAL_HOURS="${3:-6}"
PRUNE_AFTER_HOURS="${4:-24}"

case "${ENVIRONMENT}" in
  dev|qa|demo) ;;
  *)
    echo "ENVIRONMENT must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

if ! [[ "${INTERVAL_HOURS}" =~ ^[0-9]+$ ]] || (( INTERVAL_HOURS < 1 || INTERVAL_HOURS > 24 )); then
  echo "INTERVAL_HOURS must be an integer between 1 and 24." >&2
  exit 1
fi

if ! [[ "${PRUNE_AFTER_HOURS}" =~ ^[0-9]+$ ]] || (( PRUNE_AFTER_HOURS < 1 )); then
  echo "PRUNE_AFTER_HOURS must be a positive integer." >&2
  exit 1
fi

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

read -r -d '' INSTALL_SCRIPT <<EOF || true
set -euo pipefail

sudo tee /usr/local/bin/modular-portal-docker-cleanup.sh >/dev/null <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

echo "[modular-portal] disk cleanup started at \$(date -Is)"
echo "--- BEFORE ---"
df -h /
docker system df || true

docker container prune -f --filter "until=${PRUNE_AFTER_HOURS}h"
docker image prune -a -f --filter "until=${PRUNE_AFTER_HOURS}h"
docker builder prune -a -f --filter "until=${PRUNE_AFTER_HOURS}h"

echo "--- AFTER ---"
df -h /
docker system df || true
echo "[modular-portal] disk cleanup finished at \$(date -Is)"
SCRIPT

sudo chmod +x /usr/local/bin/modular-portal-docker-cleanup.sh

sudo tee /etc/systemd/system/modular-portal-docker-cleanup.service >/dev/null <<'UNIT'
[Unit]
Description=Modular Portal Docker disk cleanup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/modular-portal-docker-cleanup.sh
UNIT

sudo tee /etc/systemd/system/modular-portal-docker-cleanup.timer >/dev/null <<'UNIT'
[Unit]
Description=Run Modular Portal Docker cleanup every ${INTERVAL_HOURS} hours

[Timer]
OnBootSec=15min
OnUnitActiveSec=${INTERVAL_HOURS}h
RandomizedDelaySec=10min
Persistent=true

[Install]
WantedBy=timers.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now modular-portal-docker-cleanup.timer
sudo systemctl restart modular-portal-docker-cleanup.timer
systemctl status modular-portal-docker-cleanup.timer --no-pager
systemctl list-timers modular-portal-docker-cleanup.timer --no-pager
EOF

COMMAND_ID="$(
  aws ssm send-command \
    --region "${REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --parameters "$(jq -cn --arg cmd "${INSTALL_SCRIPT}" '{commands: [$cmd]}')" \
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
      echo "Remote timer installation failed with status ${STATUS}." >&2
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
