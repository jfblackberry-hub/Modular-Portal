# Productionization Backlog

This backlog turns the current codebase state into a concrete set of tasks required to productionize the platform.

It is based on the repository as of March 28, 2026, including the current monorepo layout, deployment workflow, runtime config model, release validation scripts, and infrastructure/docs already present in the repo.

## Current State Summary

The codebase already has several strong production foundations:

- Monorepo build, lint, typecheck, and test scripts at the workspace root
- Runtime config validation and environment modeling
- Health, readiness, liveness, and metrics endpoints
- Structured logging and correlation ID support in the API
- Dockerfiles and Docker Compose for app runtimes
- Release validation and smoke/integration test harness scripts
- An existing GitHub Actions deployment workflow for EC2-based refreshes

The biggest remaining gaps are operational hardening, CI enforcement, production infrastructure completion, deploy safety, secrets management, and reduction of placeholder/demo behaviors.

## Priority 0

### P0-1. Add Required CI For Pull Requests

Problem:
The repository currently has a deployment workflow, but no dedicated PR workflow enforcing code quality and release gates before merge.

Tasks:

- Add a GitHub Actions CI workflow for pull requests
- Run `pnpm lint`
- Run `pnpm typecheck`
- Run `pnpm build`
- Run `pnpm test`
- Run `pnpm test:smoke`
- Run `pnpm test:integration` where environment setup is practical
- Publish test results and fail fast on regressions
- Mark CI checks as required for branch protection on `main`

Primary references:

- [package.json](../../package.json)
- [.github/workflows/deploy-ec2.yml](../../.github/workflows/deploy-ec2.yml)
- [scripts/testing/run-smoke-tests.mjs](../../scripts/testing/run-smoke-tests.mjs)
- [scripts/testing/run-integration-tests.mjs](../../scripts/testing/run-integration-tests.mjs)

Exit criteria:

- Every PR runs automated checks before merge
- `main` is protected by required status checks
- Deployments no longer act as the first full validation point

### P0-2. Fix Repo Hygiene And Generated Artifact Handling

Problem:
Generated Next.js development artifacts are appearing in git status, which creates noise and increases the risk of accidental commits.

Tasks:

- Update `.gitignore` to exclude `.next`, `.next-dev`, and related generated app output
- Confirm no build/cache artifacts are intentionally tracked
- Clean up any stale tracked generated files if needed
- Add a lightweight repo hygiene check in CI

Primary references:

- [.gitignore](../../.gitignore)

Exit criteria:

- `git status` stays clean after normal local development
- Generated runtime/build artifacts are not review noise

### P0-3. Choose And Align The Actual Production Runtime Architecture

Problem:
The repo currently reflects two overlapping deployment stories:

- Active GitHub deployment to a single EC2 host running Docker Compose
- Planned ECS/Fargate production architecture in Terraform and architecture docs

Tasks:

- Decide whether the next production target is:
  - hardened EC2 + Docker Compose
  - ECS/Fargate
  - phased migration from EC2 to ECS
- Update architecture docs to reflect the chosen path
- Align deploy automation, environment variables, runbooks, and infra ownership to that choice
- Remove ambiguous or conflicting production guidance

Primary references:

- [docs/github-actions-deploy.md](../github-actions-deploy.md)
- [infra/README.md](../../infra/README.md)
- [infra/terraform/README.md](../../infra/terraform/README.md)
- [infra/terraform/environments/production/README.md](../../infra/terraform/environments/production/README.md)

Exit criteria:

- One production architecture is explicitly documented as canonical
- Automation and docs all describe the same deployment model

### P0-4. Harden Release Sequencing, Migration Safety, And Rollback

Problem:
The current deployment flow refreshes services, then runs migrations, then checks health. That needs explicit safety guarantees for schema changes and rollback handling.

Tasks:

- Define the safe order for image rollout, migrations, and service restart
- Classify supported migration types and backward compatibility expectations
- Add rollback rules for failed migration, failed health checks, and failed workflow validation
- Ensure release validation is run consistently for every deploy
- Document zero-downtime or bounded-downtime expectations

Primary references:

- [.github/workflows/deploy-ec2.yml](../../.github/workflows/deploy-ec2.yml)
- [scripts/testing/validate-release.mjs](../../scripts/testing/validate-release.mjs)

Exit criteria:

- Release flow is deterministic and documented
- Rollback path is defined and tested
- Schema changes do not rely on manual judgment during deploy

### P0-5. Move Production Secrets And Runtime Config Into Managed Infrastructure

Problem:
The config model is good, but production readiness requires managed secret storage, provisioning ownership, and rotation policy.

Tasks:

- Inventory all required production env vars and secrets
- Move secrets to AWS Secrets Manager or an equivalent managed secret store
- Define how secrets are injected into each runtime
- Add secret rotation guidance and break-glass procedures
- Validate startup behavior for missing or malformed production configuration

Primary references:

- [docs/architecture/runtime-config-model.md](../architecture/runtime-config-model.md)
- [packages/config/src/index.ts](../../packages/config/src/index.ts)

Exit criteria:

- Production secrets are not manually managed on hosts
- Each runtime has a documented source of truth for config
- Secret rotation is operationally understood

### P0-6. Productionize Backup, Restore, And Recovery Validation

Problem:
Backup behavior exists conceptually, but production readiness requires restore confidence, retention policy, and operational ownership.

Tasks:

- Define backup scope for database, document storage, public assets, and generated artifacts
- Verify encryption-at-rest and encryption-in-transit requirements
- Define retention windows and cleanup policy
- Run documented restore drills
- Record target RPO and RTO
- Add alerting for backup job failures

Primary references:

- [packages/server/README.backups.md](../../packages/server/README.backups.md)
- [infra/terraform/environments/production/README.md](../../infra/terraform/environments/production/README.md)

Exit criteria:

- Backups run automatically
- Restores are proven, not assumed
- Recovery expectations are documented

## Priority 1

### P1-1. Implement The Real Production Infrastructure

Problem:
The production Terraform environment is still a placeholder.

Tasks:

- Build the production environment composition in Terraform
- Provision networking, security groups, compute, database, storage, logging, and scheduled task support
- Add autoscaling where required
- Define per-service capacity and failure-domain assumptions
- Validate infra in a non-local environment before cutover

Primary references:

- [infra/terraform/environments/production/README.md](../../infra/terraform/environments/production/README.md)
- [infra/terraform/README.md](../../infra/terraform/README.md)

Exit criteria:

- Production environment is represented in code
- Infra can be reproducibly planned and applied

### P1-2. Complete Observability Wiring

Problem:
Instrumentation exists, but production operations still need dashboards, alarms, routing, retention, and drill-tested runbooks.

Tasks:

- Create service dashboards for API, web, admin, and worker
- Add alarms for 5xx rate, latency, worker failures, backlog age, auth failures, and storage degradation
- Define log retention and search strategy
- Ensure metrics scraping/export works in the chosen runtime platform
- Connect alerting to the correct human response path

Primary references:

- [docs/architecture/observability-baseline.md](../architecture/observability-baseline.md)
- [apps/api/src/server.ts](../../apps/api/src/server.ts)
- [apps/api/src/routes/metrics.ts](../../apps/api/src/routes/metrics.ts)

Exit criteria:

- Operators can detect failure quickly
- Alerts are actionable and not purely informational

### P1-3. Add Production Security Hardening At The Edge

Problem:
The repo has runtime security settings, but production web hardening should be explicit and testable.

Tasks:

- Add or verify security headers for web surfaces
- Define CSP policy per app
- Add API and auth rate limiting
- Review upload constraints and abuse boundaries
- Validate secure cookie settings in production topology
- Verify proxy trust configuration and forwarded header handling
- Review audit coverage for privileged actions

Primary references:

- [packages/config/src/index.ts](../../packages/config/src/index.ts)
- [apps/api/src/server.ts](../../apps/api/src/server.ts)

Exit criteria:

- Security posture is intentional and documented
- Key edge protections are enforced and tested

### P1-4. Add Browser E2E Coverage For Critical Flows

Problem:
The repo has meaningful test coverage, but not full browser-level E2E coverage for the highest-risk production flows.

Tasks:

- Add E2E coverage for login and logout
- Add E2E coverage for auth handoff between portal and admin
- Add E2E coverage for at least one member workflow
- Add E2E coverage for at least one tenant-admin workflow
- Add E2E coverage for at least one platform-admin workflow
- Add E2E release smoke scenarios suitable for CI and pre-deploy validation

Primary references:

- [apps/portal-web/tests](../../apps/portal-web/tests)
- [apps/admin-console/tests](../../apps/admin-console/tests)
- [apps/api/test](../../apps/api/test)

Exit criteria:

- Critical user journeys are validated in a real browser
- Release confidence is not based solely on API-level tests

### P1-5. Add Coverage For Untested Core Packages

Problem:
Some high-leverage foundational packages still report no meaningful tests.

Tasks:

- Add tests for `@payer-portal/config`
- Add tests for `@payer-portal/database`
- Add targeted tests for runtime validation edge cases
- Add tests for migration/bootstrap assumptions where practical

Primary references:

- [packages/config/package.json](../../packages/config/package.json)
- [packages/database/package.json](../../packages/database/package.json)

Exit criteria:

- Foundational config and data layers have regression coverage

### P1-6. Run Load, Capacity, And Failure-Mode Testing

Problem:
Production readiness depends on understanding system behavior under load and partial dependency failure.

Tasks:

- Define expected traffic envelope and concurrency assumptions
- Load test login and authenticated API routes
- Load test admin-heavy operational routes
- Stress test worker queue throughput and backlog behavior
- Simulate degraded database and storage conditions
- Record scaling thresholds and bottlenecks

Exit criteria:

- Capacity expectations are explicit
- Major bottlenecks are known before production incidents

## Priority 2

### P2-1. Remove, Gate, Or Clearly Label Placeholder And Demo Surfaces

Problem:
The repo still contains placeholder pages, mock behaviors, synthetic demo integrations, and POC-oriented flows that should not silently ship as production capability.

Tasks:

- Inventory placeholder and admin scaffolding pages
- Remove or feature-flag non-production surfaces
- Replace synthetic/demo defaults where they currently stand in for real workflows
- Mark intentional demo content explicitly where it remains useful in non-production environments

Primary references:

- [apps/admin-console/app/admin/governance/policies/page.tsx](../../apps/admin-console/app/admin/governance/policies/page.tsx)
- [apps/admin-console/app/admin/developer/debug/page.tsx](../../apps/admin-console/app/admin/developer/debug/page.tsx)
- [apps/admin-console/app/admin/developer/adapters/page.tsx](../../apps/admin-console/app/admin/developer/adapters/page.tsx)

Exit criteria:

- Production users do not encounter incomplete or misleading capability surfaces

### P2-2. Finish Storage Provider Production Wiring

Problem:
The runtime model already anticipates S3-backed storage, but the current docs describe that path as config-ready and still stubbed.

Tasks:

- Implement production object storage wiring
- Define bucket layout and access controls
- Migrate document, backup, and public asset flows to the production storage provider
- Add validation and failure-mode handling for storage operations

Primary references:

- [docs/architecture/runtime-config-model.md](../architecture/runtime-config-model.md)

Exit criteria:

- Production storage is real, not placeholder-configured

### P2-3. Finish Operational Runbooks And Ownership

Problem:
Production readiness requires response clarity, not just working code.

Tasks:

- Define owner for deploys, rollback, infra, and backup recovery
- Create or finish runbooks for:
  - failed deploy
  - failed migration
  - service unhealthy
  - queue backlog growth
  - storage outage
  - auth incident
  - backup restore
- Add escalation expectations and communication templates

Exit criteria:

- Humans know what to do during incidents
- Operational response does not rely on tribal knowledge

### P2-4. Create A Formal Production Readiness Gate

Problem:
A final go/no-go checklist should exist outside of individual engineering judgment.

Tasks:

- Create a release readiness checklist
- Require sign-off on CI, infra, secrets, observability, backup/restore, rollback, and smoke coverage
- Use the checklist for every pre-production and production cutover

Exit criteria:

- Release decisions are consistent and auditable

## Suggested Sequence

Recommended order of execution:

1. P0-1 Add required CI
2. P0-2 Fix repo hygiene
3. P0-3 Choose canonical production runtime
4. P0-4 Harden release sequencing and rollback
5. P0-5 Move secrets into managed infrastructure
6. P0-6 Productionize backup and restore validation
7. P1-1 Implement production infrastructure
8. P1-2 Complete observability wiring
9. P1-3 Add security hardening
10. P1-4 Add browser E2E coverage
11. P1-5 Add missing package-level tests
12. P1-6 Run load and resilience testing
13. P2-1 Remove or gate placeholder/demo surfaces
14. P2-2 Finish storage production wiring
15. P2-3 Finish runbooks and ownership
16. P2-4 Create a formal readiness gate

## Suggested Owners

To keep this tractable, split ownership across tracks:

- Platform engineering: CI, deploys, infra, secrets, observability
- Application engineering: E2E coverage, placeholder/demo cleanup, release workflow validation
- Data/platform: migrations, backup/restore, database reliability
- Security/shared ownership: edge hardening, cookie/session policy, audit coverage

## Notes

- This backlog assumes the immediate goal is productionizing the current platform shape rather than redesigning the architecture first.
- If the team decides to move directly from EC2 to ECS/Fargate, several P0 and P1 items stay the same, but the implementation details should be updated together.
