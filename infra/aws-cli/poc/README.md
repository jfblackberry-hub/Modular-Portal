# AWS CloudShell-Compatible AWS CLI Stacks

This script set deploys modular CloudFormation stacks for the healthcare portal POC using AWS CLI scripts that are safe to run from AWS CloudShell.

## What It Creates

- networking resources in `infra/cloudformation/networking.yaml`
- security groups and IAM resources in `infra/cloudformation/security.yaml`
- reusable compute resources in `infra/cloudformation/compute.yaml`
- shared logging resources in `infra/cloudformation/shared-services.yaml`
- optional PostgreSQL data resources in `infra/cloudformation/data.yaml`

## Files

- `config.sh.example`: environment-variable based configuration
- `lib.sh`: shared CloudShell-safe helpers
- `/infra/cloudformation/networking.yaml`: VPC, subnets, NAT, routes, exports
- `/infra/cloudformation/security.yaml`: security groups, IAM roles, imports from networking
- `/infra/cloudformation/data.yaml`: PostgreSQL RDS, imports from networking and security
- `/infra/cloudformation/compute.yaml`: ECR repositories
- `/infra/cloudformation/shared-services.yaml`: CloudWatch log groups
- `01-create-network.sh`: deploys the networking stack
- `02-create-security-groups.sh`: deploys the security stack
- `03-create-iam-roles.sh`: compatibility wrapper to the security stack deploy
- `04-create-ecr-repositories.sh`: deploys the compute stack
- `05-create-cloudwatch-logs.sh`: deploys the shared-services stack
- `06-create-data.sh`: deploys the optional data stack
- `07-create-github-actions-role.sh`: creates the GitHub OIDC IAM role used by the CI deploy workflow
- `/infra/cloudformation/application.yaml`: ECS cluster, ALBs, task definitions, and ECS services
- `deploy-foundation.sh`: sequential wrapper for the non-database stacks

## Behavior

- Uses `bash` strict mode in every script: `set -euo pipefail`
- Assumes AWS CLI is already installed
- Assumes you are already authenticated
- Detects `AWS_REGION` from the environment or current AWS CLI config if not passed
- Uses CloudFormation exports/imports between stacks:
  - networking exports the VPC ID and subnet IDs
  - security imports the VPC ID
  - data imports the private subnets and RDS security group
- Runs pre-flight validation with:
  - `aws sts get-caller-identity`
  - `aws cloudformation validate-template`
- Logs the deployment lifecycle with:
  - `Starting deployment...`
  - `Validating template...`
  - `Deploying stack...`
  - `Deployment complete`
- Uses `aws cloudformation deploy`
  - handles create and update automatically
  - includes `--no-fail-on-empty-changeset`
  - includes stack tags for `Project`, `Environment`, `ManagedBy`, and `Owner`

## Usage

```bash
cd infra/aws-cli/poc
cp config.sh.example config.sh
source ./config.sh
chmod +x ./*.sh
./deploy-foundation.sh
```

You can also override the standardized inputs per script:

```bash
STACK_NAME="modular-portal-poc-network" \
AWS_REGION="us-east-1" \
TEMPLATE_FILE="../../cloudformation/networking.yaml" \
PARAMETERS_FILE="./network-params.json" \
./01-create-network.sh
```

If `PARAMETERS_FILE` is not provided, each script generates one automatically from the exported environment variables.

The optional data stack is deployed separately:

```bash
./06-create-data.sh
```

The GitHub Actions deploy role can be created after foundation resources exist:

```bash
./07-create-github-actions-role.sh
```

## Notes

- No absolute local-machine paths are used in the scripts or default template references.
- Stack outputs are saved to `state/foundation.env`.
- Replace the placeholder S3 bucket, Secrets Manager ARNs, and database password in `config.sh` before running the relevant stacks.
- Replace `GITHUB_ORG` and `GITHUB_REPO` in `config.sh` before creating the GitHub Actions role.
- Resource names follow the pattern `<env>-<module>-<resource>`.
- The compute and shared-services templates currently model up to three repositories and log groups, matching the POC defaults.
