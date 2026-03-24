# AWS Scaffold

This directory is the placeholder infrastructure scaffold for separating the platform into deployable services on AWS.

## Intended Services

- `portal-web`
- `admin-console`
- `api`
- `job-worker`

## Intended AWS Mapping

- ECS/Fargate service for `portal-web`
- ECS/Fargate service for `admin-console`
- ECS/Fargate service for `api`
- ECS/Fargate service for `job-worker`
- EventBridge scheduled ECS task for backup schedule configuration

The scheduled backup task should run the worker image with a command override:

```bash
pnpm --filter @payer-portal/server backups:configure
```

The long-running worker service should continue to run:

```bash
pnpm --filter @payer-portal/server worker:start
```
