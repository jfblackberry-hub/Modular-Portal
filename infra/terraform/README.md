# Terraform Layout

This directory now includes a reusable AWS foundation for the portal POC, while keeping room for later staging and production compositions.

## Modules

- `modules/network`: VPC, subnets, IGW, and single NAT Gateway
- `modules/security-groups`: ALB, ECS, and RDS security groups
- `modules/iam-ecs`: ECS task execution and task roles
- `modules/ecr-repositories`: reusable ECR repository creation
- `modules/cloudwatch-logging`: reusable CloudWatch log groups
- `modules/ecs-service`: placeholder reusable ECS service module
- `modules/scheduled-task`: placeholder EventBridge scheduled ECS task module

## Environments

- `environments/poc`: active `us-east-1` proof-of-concept foundation
- `environments/staging`: placeholder composition
- `environments/production`: placeholder composition

## POC Scope

The POC environment is intentionally secure but lightweight:

- `10.0.0.0/16` VPC
- 2 public subnets and 2 private subnets across 2 AZs
- 1 Internet Gateway
- 1 single NAT Gateway for cost control
- tightly scoped security groups
- least-privilege IAM roles for ECS tasks
- ECR repositories for app images
- CloudWatch log groups for ECS workloads
