# Executive Architecture Deck Outline

This outline is designed for leadership, stakeholders, and cross-functional planning conversations. It uses the architecture diagrams already created in this repo, but organizes them into a presentation flow that explains:

- what the platform is
- how it works today
- what the AWS target state is
- why the migration matters
- what decisions and outcomes the business should align on

## Slide 1: Title

**Title**

Modular Portal Architecture And AWS Migration Overview

**Subtitle**

Current-state platform architecture, target AWS end state, and migration direction

**Speaker note**

Open with the platform story: this is a modular healthcare portal platform supporting multiple audiences, multiple tenants, and a growing integration footprint.

## Slide 2: Executive Summary

**Core message**

The platform already has clear runtime separation and multitenant boundaries. The AWS migration is primarily an operational and deployment evolution, not a ground-up application rewrite.

**On-slide points**

- One shared platform supports member, employer, broker, provider, and admin experiences
- Current architecture is a modular monolith with separated web, API, and worker runtimes
- Target AWS state preserves the application model while improving scalability, resilience, and operations
- The migration path is incremental because the service boundaries already exist

**Visual**

Use Diagram 9 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 3: Business Context

**Core message**

The platform is more than a single portal. It is a multichannel digital platform with shared workflows, tenant-specific branding, and extensible integration capabilities.

**On-slide points**

- Supports multiple user populations through a shared digital platform
- Enables tenant-specific configuration, branding, and feature control
- Combines synchronous user experiences with background operational processing
- Must support future partner integrations and AWS-native operational maturity

**Visual**

Use Diagram 1 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 4: Current-State Architecture

**Core message**

Today’s architecture is already split into business-facing experiences, a central application API, and a dedicated background worker.

**On-slide points**

- `portal-web` serves end-user experiences
- `admin-console` serves tenant-admin and platform-admin workflows
- `api` centralizes business logic and data access
- `job-worker` handles background processing only
- Postgres and shared storage support the full platform

**Visual**

Use Diagram 2 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 5: How The Platform Works

**Core message**

User journeys are handled synchronously through the web and API layers, while heavier operational work is pushed into background processing.

**On-slide points**

- User and admin actions flow through web applications into the API
- The API enforces identity, tenant scope, and business rules
- Platform data is stored centrally and returned as tenant-scoped responses
- Long-running or integration-heavy work is moved off the request path

**Visual**

Use Diagram 3 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 6: Operational And Integration Model

**Core message**

The platform already has the core control points needed for scale: queue-backed work, event-driven processing, and connector patterns for external systems.

**On-slide points**

- API actions can enqueue jobs and publish events
- Worker processes integrations, notifications, and backups
- Connector patterns support future vendor growth without changing the portal shell
- Audit, telemetry, and operational tracking are already part of the platform model

**Visual**

Use Diagram 4 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 7: Why AWS Migration

**Core message**

The move to AWS is about operational maturity, scalability, resilience, and cleaner production operations rather than changing the core product architecture.

**On-slide points**

- Separate deployable services map naturally to cloud runtime boundaries
- Managed infrastructure improves scaling and production reliability
- Shared object storage better supports documents, assets, and backups
- Cloud-native scheduling and observability strengthen supportability

**Suggested callout**

“We are not changing what the platform is. We are improving how it runs.”

## Slide 8: Target AWS End State

**Core message**

The AWS target state preserves the platform’s current service split while moving runtime responsibility into managed cloud infrastructure.

**On-slide points**

- Web, admin, API, and worker run as separate ECS/Fargate services
- Data moves to managed PostgreSQL and object storage
- Scheduled operational tasks run independently from long-lived services
- Observability becomes a first-class operational capability

**Visual**

Use Diagram 5 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 9: AWS Deployment View

**Core message**

The target infrastructure cleanly separates edge routing, application runtimes, persistent storage, scheduled operations, and observability.

**On-slide points**

- Public traffic enters through DNS, HTTPS, and load balancing
- Application services run independently and can scale by role
- RDS becomes the managed system of record
- Object storage holds documents, branding assets, and backup artifacts
- Scheduled ECS tasks support operational control activities such as backup schedule configuration

**Visual**

Use Diagram 6 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 10: End-State User Flow

**Core message**

The user-facing experience stays familiar, but the runtime path becomes more production-ready and operationally observable.

**On-slide points**

- Users continue to enter through the portal or admin experiences
- Web services call the API over defined internal boundaries
- Managed data and object storage back the transaction flow
- Logs and metrics are captured throughout the path

**Visual**

Use Diagram 7 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 11: End-State Background Flow

**Core message**

Background processing becomes more resilient and more operationally intentional in AWS.

**On-slide points**

- API persists jobs and events for background execution
- Worker services process integrations, notifications, and backup jobs
- EventBridge-triggered ECS tasks handle scheduled operational commands
- Operational telemetry provides visibility into failures, backlog, and throughput

**Visual**

Use Diagram 8 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 12: Current State Vs. Target State

**Core message**

The target state is an evolution of the current platform, not a replacement.

**On-slide comparison**

- Current: local-style runtime split, platform-owned process coordination, local/shared storage
- Target: cloud-hosted service split, managed database and object storage, scheduled cloud tasks, stronger observability
- Constant: portal/admin/API/worker boundaries, multitenant platform model, plugin/connector extension strategy

**Visual**

Use Diagram 9 from [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md).

## Slide 13: Strategic Benefits

**Core message**

The migration creates business and operating leverage beyond infrastructure modernization.

**On-slide points**

- Better production scalability for independently growing workloads
- Cleaner operational ownership and support model
- Stronger resilience for documents, backups, and long-running workflows
- Better foundation for enterprise integrations and tenant onboarding
- Stronger readiness for regulated operational expectations

## Slide 14: Key Risks And Watchouts

**Core message**

Success depends on preserving trust boundaries, tenant isolation, and operational discipline during migration.

**On-slide points**

- Authentication and tenant context must remain server-trusted
- Storage migration needs careful handling for documents, logos, and backup artifacts
- Background job reliability and queue visibility must be validated early
- Environment and secret management must be standardized across services
- Staging must mirror production closely enough to prove behavior before cutover

## Slide 15: Decision Slide

**Core message**

Leadership alignment is needed on the migration shape, not on every implementation detail.

**Decision prompts**

- Confirm the target runtime model: ECS/Fargate service split remains the destination
- Confirm the operational baseline: managed database, object storage, scheduled cloud tasks, centralized observability
- Confirm sequencing approach: incremental migration with current service boundaries preserved
- Confirm success measures: reliability, deployability, supportability, and security posture

## Slide 16: Appendix

**Include**

- diagram pack link
- architecture overview link
- runtime/config model link
- observability baseline link

**References**

- [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md)
- [system-architecture-overview.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-architecture-overview.md)
- [runtime-config-model.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/runtime-config-model.md)
- [observability-baseline.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/observability-baseline.md)

## Presenter Guidance

- Keep the story at the operating-model level, not the code-structure level.
- Avoid package names unless the audience is technical.
- Emphasize continuity: the platform architecture is already pointing toward the AWS service model.
- Frame AWS as an execution and operations improvement, not as architecture churn.
- When discussing risk, anchor on identity, tenant isolation, storage migration, and worker reliability.
