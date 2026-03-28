# GitHub Actions EC2 Deploy

This repository includes a GitHub Actions workflow at
`/.github/workflows/deploy-ec2.yml` that:

1. builds ARM64 Docker images for `portal-web`, `admin-console`, and `api`
2. pushes those images to the existing ECR repositories
3. finds the live EC2 application instance from the CloudFormation stack
4. refreshes the running Docker Compose services over AWS Systems Manager

## Why this matches the current architecture

The live application runs on a single `t4g.small` EC2 instance, so the workflow
builds `linux/arm64` images. This keeps GitHub-produced images compatible with
the running host and removes the dependency on a developer laptop for releases.

## Required GitHub secret

Create this repository secret:

- `AWS_GITHUB_ACTIONS_ROLE_ARN`

This should point to an IAM role that GitHub Actions can assume through AWS OIDC.

You can create that role from this repo with:

```bash
cd infra/aws-cli/poc
cp config.sh.example config.sh
# update GITHUB_ORG and GITHUB_REPO in config.sh
./07-create-github-actions-role.sh
```

## Minimum AWS permissions for the GitHub Actions role

The role used by GitHub Actions needs permission to:

- push images to the app ECR repositories
- read CloudFormation stack outputs for `${env}-application`
- send and read SSM commands for the application EC2 instance
- call `sts:GetCallerIdentity`

In practice that means access similar to:

- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:CompleteLayerUpload`
- `ecr:InitiateLayerUpload`
- `ecr:PutImage`
- `ecr:UploadLayerPart`
- `ecr:BatchGetImage`
- `cloudformation:DescribeStacks`
- `ssm:SendCommand`
- `ssm:GetCommandInvocation`
- `ec2:DescribeInstances`
- `sts:GetCallerIdentity`

## Trigger behavior

- pushes to `main` automatically deploy to `dev`
- the workflow can also be started manually from GitHub Actions for:
  - `dev`
  - `qa`
  - `demo`

## Current deploy behavior

The workflow updates all three app services:

- `portal-web`
- `admin-console`
- `api`

It runs the same style of refresh you have been using manually:

- `docker compose pull ...`
- `docker compose up -d ...`

## Recommended follow-up

To make shared URLs stable across instance replacements, move the public origins
to a stable DNS name or static IP and keep those values in the application
stack/bootstrap configuration.

## Single-Environment Development Flow

With only a `dev` AWS environment, use local development as the fast inner loop
and reserve cloud deploys for validated checkpoints:

1. develop and test locally first
2. run targeted local checks before release
3. push `main` only when you want AWS `dev` updated

`staging` can still be used as a local collaboration branch if helpful, but it
does not auto-deploy.

## Suggested branch protection

To keep releases traceable, pair this workflow with:

- pull requests into `main`
- required GitHub Actions checks before merge
- direct deploys only from `main`
