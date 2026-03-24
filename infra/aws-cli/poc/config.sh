#!/usr/bin/env bash

set -euo pipefail

export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_PAGER=""

export PROJECT_NAME="${PROJECT_NAME:-modular-portal}"
export ENVIRONMENT="${ENVIRONMENT:-poc}"
export OWNER="${OWNER:-platform}"

export VPC_CIDR="${VPC_CIDR:-10.0.0.0/16}"
export PUBLIC_SUBNET_1_CIDR="${PUBLIC_SUBNET_1_CIDR:-10.0.0.0/24}"
export PUBLIC_SUBNET_2_CIDR="${PUBLIC_SUBNET_2_CIDR:-10.0.1.0/24}"
export PRIVATE_SUBNET_1_CIDR="${PRIVATE_SUBNET_1_CIDR:-10.0.10.0/24}"
export PRIVATE_SUBNET_2_CIDR="${PRIVATE_SUBNET_2_CIDR:-10.0.11.0/24}"

export APP_PORT="${APP_PORT:-3000}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-portal}"
export DB_MASTER_USERNAME="${DB_MASTER_USERNAME:-portaladmin}"
export DB_MASTER_PASSWORD="${DB_MASTER_PASSWORD:-replace-with-secure-password}"
export DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
export DB_ALLOCATED_STORAGE="${DB_ALLOCATED_STORAGE:-20}"
export DB_ENGINE_VERSION="${DB_ENGINE_VERSION:-16.4}"
export DB_STORAGE_TYPE="${DB_STORAGE_TYPE:-gp3}"
export DB_BACKUP_RETENTION_DAYS="${DB_BACKUP_RETENTION_DAYS:-7}"
export DB_MULTI_AZ="${DB_MULTI_AZ:-false}"
export DB_DELETION_PROTECTION="${DB_DELETION_PROTECTION:-false}"

export S3_BUCKET_ARN_1="${S3_BUCKET_ARN_1:-arn:aws:s3:::replace-with-portal-documents-bucket}"
export SECRET_ARN_1="${SECRET_ARN_1:-arn:aws:secretsmanager:us-east-1:123456789012:secret:replace-with-app-secret}"

export ECR_REPOSITORIES="${ECR_REPOSITORIES:-portal-web admin-console api-server}"
export CLOUDWATCH_LOG_GROUPS="${CLOUDWATCH_LOG_GROUPS:-/aws/ecs/poc/portal-web /aws/ecs/poc/admin-console /aws/ecs/poc/api-server}"
export CLOUDWATCH_RETENTION_DAYS="${CLOUDWATCH_RETENTION_DAYS:-30}"
