# IAM ECS Module

Creates:

- ECS task execution role using the AWS-managed execution policy
- ECS task role with least-privilege access scoped to:
  - specific S3 buckets
  - specific Secrets Manager secrets
