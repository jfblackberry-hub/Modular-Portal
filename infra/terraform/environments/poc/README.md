# POC Environment

AWS region: `us-east-1`

This composition creates a secure but lightweight foundation for the portal POC:

- VPC with 2 public and 2 private subnets
- Internet Gateway
- single NAT Gateway for cost control
- ALB, ECS, and RDS security groups
- ECS task execution and task IAM roles
- ECR repositories for `portal-web`, `admin-console`, and `api-server`
- CloudWatch log groups for ECS workloads

## Usage

```bash
cd infra/terraform/environments/poc
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
```

Update `terraform.tfvars` with real S3 bucket ARNs and Secrets Manager secret ARNs before applying.
