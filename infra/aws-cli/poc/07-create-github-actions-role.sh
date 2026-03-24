#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

load_config "${1:-}"

require_command aws

: "${GITHUB_ORG:?GITHUB_ORG must be set in config.sh or the environment}"
: "${GITHUB_REPO:?GITHUB_REPO must be set in config.sh or the environment}"
: "${GITHUB_BRANCH:?GITHUB_BRANCH must be set in config.sh or the environment}"
: "${GITHUB_ACTIONS_ROLE_NAME:?GITHUB_ACTIONS_ROLE_NAME must be set in config.sh or the environment}"

OIDC_URL="https://token.actions.githubusercontent.com"
OIDC_THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"
SUBJECT="repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/${GITHUB_BRANCH}"
ROLE_NAME="${GITHUB_ACTIONS_ROLE_NAME}"
POLICY_NAME="${ROLE_NAME}-deploy"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

ensure_oidc_provider() {
  if aws iam get-open-id-connect-provider \
    --open-id-connect-provider-arn "${OIDC_PROVIDER_ARN}" >/dev/null 2>&1; then
    echo "GitHub OIDC provider already exists."
    return 0
  fi

  echo "Creating GitHub Actions OIDC provider..."
  aws iam create-open-id-connect-provider \
    --url "${OIDC_URL}" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list "${OIDC_THUMBPRINT}" >/dev/null
}

create_trust_policy() {
  local file_path="$1"

  cat > "${file_path}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${OIDC_PROVIDER_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "${SUBJECT}"
        }
      }
    }
  ]
}
EOF
}

create_permissions_policy() {
  local file_path="$1"
  local ecr_repo_arns=()
  local repo

  for repo in ${ECR_REPOSITORIES}; do
    ecr_repo_arns+=("\"arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${ENVIRONMENT}-compute-${repo}\"")
  done

  cat > "${file_path}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadIdentity",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PushAppImages",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": [
        $(IFS=,; echo "${ecr_repo_arns[*]}")
      ]
    },
    {
      "Sid": "AuthToEcr",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ReadApplicationStack",
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks"
      ],
      "Resource": "arn:aws:cloudformation:${AWS_REGION}:${ACCOUNT_ID}:stack/${ENVIRONMENT}-application/*"
    },
    {
      "Sid": "DiscoverApplicationInstance",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DeployViaSsm",
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

main() {
  local trust_policy_file
  local permissions_policy_file

  trust_policy_file="$(mktemp)"
  permissions_policy_file="$(mktemp)"
  trap 'rm -f "${trust_policy_file}" "${permissions_policy_file}"' EXIT

  ensure_oidc_provider
  create_trust_policy "${trust_policy_file}"
  create_permissions_policy "${permissions_policy_file}"

  if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
    echo "Updating existing role ${ROLE_NAME}..."
    aws iam update-assume-role-policy \
      --role-name "${ROLE_NAME}" \
      --policy-document "file://${trust_policy_file}" >/dev/null
  else
    echo "Creating role ${ROLE_NAME}..."
    aws iam create-role \
      --role-name "${ROLE_NAME}" \
      --assume-role-policy-document "file://${trust_policy_file}" \
      --tags \
        "Key=Project,Value=${PROJECT_NAME}" \
        "Key=Environment,Value=${ENVIRONMENT}" \
        "Key=ManagedBy,Value=aws-cli" \
        "Key=Owner,Value=${OWNER}" >/dev/null
  fi

  echo "Attaching inline policy ${POLICY_NAME}..."
  aws iam put-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-name "${POLICY_NAME}" \
    --policy-document "file://${permissions_policy_file}" >/dev/null

  echo "GitHub Actions role ready."
  echo "Role ARN:"
  aws iam get-role \
    --role-name "${ROLE_NAME}" \
    --query 'Role.Arn' \
    --output text
}

main "$@"
