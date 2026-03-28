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
- pushes to `staging` automatically deploy to `qa`
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

## Lightweight staging branch strategy

Use a simple two-branch promotion flow:

1. do normal development locally
2. push ready-to-share work to `staging`
3. let GitHub Actions auto-deploy `staging` to the `qa` AWS environment
4. validate there with the team
5. merge the verified change to `main`
6. let GitHub Actions auto-deploy `main` to `dev`

This keeps the cloud environment close to local work without requiring manual EC2 sync steps after every change.

Recommended conventions:

- use `staging` for integration-ready work, not half-finished experiments
- keep `main` as the branch for changes that passed staging validation
- if a staging deploy breaks, fix on a short-lived branch and merge back into `staging`
- only promote `staging` to `main` after login flows, branding, and tenant-specific behavior are checked in AWS

## Suggested branch protection

To keep releases traceable, pair this workflow with:

- pull requests into `staging` for shared QA changes
- pull requests into `main`
- required GitHub Actions checks before merge
- direct deploys only from `staging` and `main`
