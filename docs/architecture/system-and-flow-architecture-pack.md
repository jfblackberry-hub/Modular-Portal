# System And Flow Architecture Pack

This document collects the high-level diagrams needed to describe the platform in two modes:

- current state
- target AWS end state

The goal is to cover both system architecture and the most important runtime flows without dropping into package-level implementation detail.

## Scope And Assumptions

- Current state is based on the monorepo runtime model, Docker Compose layout, shared server modules, and existing portal/admin/API/worker boundaries.
- Target AWS state is based on documented intended infrastructure: ECS/Fargate services for `portal-web`, `admin-console`, `api`, and `job-worker`; RDS PostgreSQL; object storage for documents and assets; EventBridge-triggered scheduled ECS tasks; and CloudWatch/OpenTelemetry for observability.
- Where the exact AWS service is not explicitly committed in the repo, the diagram stays generic rather than inventing an unsupported component.

## 1. Current-State System Context

```mermaid
flowchart LR
    users["Users
    Members, Employers, Brokers,
    Providers, Tenant Admins,
    Platform Admins"] --> experience["Experience Layer
    Portal Web + Admin Console"]

    experience --> core["Core Platform
    Auth, business workflows,
    tenant configuration, APIs"]

    core --> extensions["Extensions
    Plugins, connectors,
    partner integrations"]
    core --> data["Data And Content
    Postgres, documents,
    branding assets, backups"]
    core --> ops["Operations
    worker, queue, events,
    logs, metrics, audit"]

    external["External Systems
    vendor APIs and partner platforms"] <--> extensions
```

## 2. Current-State Runtime / Deployment View

```mermaid
flowchart TB
    browser["Browsers"] --> portal["portal-web
    Next.js runtime"]
    browser --> admin["admin-console
    Next.js runtime"]

    portal --> api["api
    application API"]
    admin --> api

    api --> postgres["Postgres"]
    api --> storage["Local storage profiles
    documents, tenant assets, backups"]

    api --> jobs["Postgres-backed job queue"]
    api --> events["Postgres-backed event delivery"]

    worker["job-worker
    background processor"] --> jobs
    worker --> postgres
    worker --> storage

    portal -.plugin flags.-> api
    admin -.control plane.-> api
```

## 3. Current-State Synchronous Request Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant W as Portal Web or Admin Console
    participant A as API
    participant D as Postgres
    participant S as Storage

    U->>W: Load page / submit action
    W->>A: Authenticated API request
    A->>A: Validate identity, tenant scope, permissions
    A->>D: Read or write operational data
    alt Document or asset needed
        A->>S: Resolve document or asset
        S-->>A: File metadata / content / URL
    end
    A-->>W: Tenant-scoped response
    W-->>U: Render page or action result
```

## 4. Current-State Async / Integration Flow

```mermaid
flowchart LR
    trigger["API action or system event"] --> api["API / shared services"]
    api --> queue["Job queue"]
    api --> bus["Event bus"]

    queue --> worker["job-worker"]
    bus --> worker

    worker --> connectors["Connector adapters
    REST, SFTP, webhook"]
    worker --> backups["Backup execution"]
    worker --> notifications["Notification processing"]

    connectors <--> external["External vendor / partner systems"]
    worker --> postgres["Postgres"]
    worker --> storage["Documents / assets / backups storage"]
    worker --> telemetry["Audit, logs, metrics"]
```

## 5. Target AWS End-State System Context

```mermaid
flowchart LR
    users["Users
    Members, Employers, Brokers,
    Providers, Tenant Admins,
    Platform Admins"] --> edge["AWS Edge And Entry
    DNS, TLS, load balancing"]

    edge --> experience["Digital Experience Services
    portal-web and admin-console"]
    experience --> platform["Application Platform Services
    API, auth/session handling,
    tenant workflows"]

    platform --> async["Async Processing
    worker services and scheduled tasks"]
    platform --> data["Managed Data And Storage
    RDS and object storage"]
    platform --> ecosystem["Integration Ecosystem
    plugins, connectors, partner APIs"]
    platform --> observability["Operations And Observability
    logs, metrics, alarms, audit"]

    ecosystem <--> external["External healthcare and partner systems"]
```

## 6. Target AWS End-State Deployment View

```mermaid
flowchart TB
    users["End users and admins"] --> route["Public DNS + HTTPS"]
    route --> alb["Application Load Balancer"]

    alb --> portalSvc["ECS/Fargate Service
    portal-web"]
    alb --> adminSvc["ECS/Fargate Service
    admin-console"]
    alb --> apiSvc["ECS/Fargate Service
    api"]

    portalSvc --> apiSvc
    adminSvc --> apiSvc

    apiSvc --> rds["RDS PostgreSQL"]
    apiSvc --> s3["Object storage
    documents, branding assets,
    backup artifacts"]

    workerSvc["ECS/Fargate Service
    job-worker"] --> rds
    workerSvc --> s3

    eventbridge["EventBridge scheduled task"] --> schedTask["One-shot ECS task
    backup schedule configuration"]
    schedTask --> rds

    apiSvc --> cw["CloudWatch + OpenTelemetry"]
    workerSvc --> cw
    portalSvc --> cw
    adminSvc --> cw

    secrets["Runtime secrets and config"] --> portalSvc
    secrets --> adminSvc
    secrets --> apiSvc
    secrets --> workerSvc
    secrets --> schedTask
```

## 7. Target AWS End-State Synchronous Request Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant E as AWS Edge / ALB
    participant W as portal-web or admin-console
    participant A as api service
    participant R as RDS PostgreSQL
    participant O as Object storage
    participant M as Monitoring

    U->>E: HTTPS request
    E->>W: Route to web service
    W->>A: Server-side API call
    A->>A: Validate auth, tenant, policy
    A->>R: Read or write tenant data
    alt Document or asset needed
        A->>O: Resolve object / URL / content
        O-->>A: Object response
    end
    A-->>W: Response payload
    W-->>U: Rendered page / result
    A-->>M: Logs, metrics, correlation data
    W-->>M: Service telemetry
```

## 8. Target AWS End-State Async And Scheduled Flow

```mermaid
flowchart LR
    api["api service"] --> enqueue["Persist job or event in RDS"]
    enqueue --> worker["job-worker service"]

    worker --> integrations["Connector execution
    REST, SFTP, webhook"]
    worker --> backups["Backup jobs"]
    worker --> notifications["Notification jobs"]

    integrations <--> partners["External partner systems"]
    backups --> s3["Object storage"]
    notifications --> audit["Audit + job history in RDS"]
    worker --> cloudwatch["CloudWatch / telemetry"]

    eventbridge["EventBridge schedule"] --> ecsTask["Scheduled ECS task
    backups:configure"]
    ecsTask --> rds["RDS PostgreSQL"]
    ecsTask --> cloudwatch
```

## 9. Migration Delta View

```mermaid
flowchart LR
    current["Current state
    Docker/local-style service split
    Postgres + local storage
    in-process runtime boundaries"] --> target["AWS target state
    ECS/Fargate services
    RDS PostgreSQL
    object storage
    EventBridge scheduled tasks
    CloudWatch-backed operations"]
```

## 10. Diagram Usage Guide

- Use Diagram 1 for executive overviews of the current platform.
- Use Diagram 2 when discussing current runtime boundaries and deployment responsibilities.
- Use Diagram 3 for normal user and admin request lifecycle conversations.
- Use Diagram 4 for queue, connector, backup, and notification discussions.
- Use Diagram 5 for target-state architecture reviews and migration planning.
- Use Diagram 6 for AWS environment design, infra planning, and security reviews.
- Use Diagram 7 for explaining the post-migration request path end to end.
- Use Diagram 8 for operations, scheduling, and integration-runbook discussions.
- Use Diagram 9 for roadmap, funding, or migration-sequencing conversations.

## Source References

- [README.md](/Users/jfrank/Projects/Modular%20portal/README.md)
- [docs/architecture/runtime-config-model.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/runtime-config-model.md)
- [docs/architecture/observability-baseline.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/observability-baseline.md)
- [docs/architecture/system-architecture-overview.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-architecture-overview.md)
- [infra/README.md](/Users/jfrank/Projects/Modular%20portal/infra/README.md)
- [infra/docs/service-model.md](/Users/jfrank/Projects/Modular%20portal/infra/docs/service-model.md)
- [infra/terraform/environments/staging/README.md](/Users/jfrank/Projects/Modular%20portal/infra/terraform/environments/staging/README.md)
- [infra/terraform/environments/production/README.md](/Users/jfrank/Projects/Modular%20portal/infra/terraform/environments/production/README.md)
- [packages/server/README.backups.md](/Users/jfrank/Projects/Modular%20portal/packages/server/README.backups.md)
