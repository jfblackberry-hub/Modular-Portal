#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"
TARGET_SIZE_GB="${3:-64}"

case "${ENVIRONMENT}" in
  dev|qa|demo) ;;
  *)
    echo "ENVIRONMENT must be one of: dev, qa, demo" >&2
    exit 1
    ;;
esac

if ! [[ "${TARGET_SIZE_GB}" =~ ^[0-9]+$ ]] || [[ "${TARGET_SIZE_GB}" -lt 32 ]]; then
  echo "TARGET_SIZE_GB must be an integer >= 32." >&2
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

VOLUME_ID="$(
  aws ec2 describe-volumes \
    --region "${REGION}" \
    --filters "Name=attachment.instance-id,Values=${INSTANCE_ID}" \
    --query "Volumes[0].VolumeId" \
    --output text
)"

CURRENT_SIZE_GB="$(
  aws ec2 describe-volumes \
    --region "${REGION}" \
    --volume-ids "${VOLUME_ID}" \
    --query "Volumes[0].Size" \
    --output text
)"

echo "Instance: ${INSTANCE_ID}"
echo "Volume: ${VOLUME_ID}"
echo "Current size: ${CURRENT_SIZE_GB} GiB"

if [[ "${CURRENT_SIZE_GB}" -ge "${TARGET_SIZE_GB}" ]]; then
  echo "Volume is already ${CURRENT_SIZE_GB} GiB; no resize needed."
else
  aws ec2 modify-volume \
    --region "${REGION}" \
    --volume-id "${VOLUME_ID}" \
    --size "${TARGET_SIZE_GB}" \
    >/dev/null

  echo "Requested resize to ${TARGET_SIZE_GB} GiB. Waiting for optimization state..."

  while true; do
    MOD_STATE="$(
      aws ec2 describe-volumes-modifications \
        --region "${REGION}" \
        --volume-ids "${VOLUME_ID}" \
        --query "VolumesModifications[0].ModificationState" \
        --output text
    )"

    case "${MOD_STATE}" in
      optimizing|completed)
        break
        ;;
      failed)
        echo "Volume modification failed." >&2
        exit 1
        ;;
      *)
        sleep 10
        ;;
    esac
  done
fi

read -r -d '' EXPAND_SCRIPT <<'EOF' || true
set -euo pipefail

if ! command -v growpart >/dev/null 2>&1; then
  sudo dnf install -y cloud-utils-growpart
fi

ROOT_DEVICE="$(findmnt -n -o SOURCE /)"
ROOT_DISK="/dev/$(lsblk -no PKNAME "${ROOT_DEVICE}")"

sudo growpart "${ROOT_DISK}" 1 || true
sudo xfs_growfs -d / || sudo resize2fs "${ROOT_DEVICE}"

echo "--- RESIZED FILESYSTEM ---"
df -h /
lsblk
EOF

COMMAND_ID="$(
  aws ssm send-command \
    --region "${REGION}" \
    --instance-ids "${INSTANCE_ID}" \
    --document-name AWS-RunShellScript \
    --parameters "$(jq -cn --arg cmd "${EXPAND_SCRIPT}" '{commands: [$cmd]}')" \
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
      echo "Remote resize failed with status ${STATUS}." >&2
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
