# Engineering Architecture Pack

This document is the engineering-focused companion to the executive architecture pack. It goes deeper on:

- runtime boundaries
- trust boundaries
- request paths
- async processing
- storage and data responsibilities
- deployment topology
- migration-relevant deltas between current state and the documented AWS target state

It is intended for engineering, platform, DevOps, security, and architecture review discussions.

## 1. Engineering Summary

- The platform is a modular monolith at the repository level, but it already has meaningful runtime separation across `portal-web`, `admin-console`, `api`, and `job-worker`.
- `api` is the synchronous control point for business operations, policy enforcement, and tenant-scoped data access.
- `job-worker` is the only long-running process that executes queued background work.
- Postgres is both the operational system of record and the persistence layer for jobs, event deliveries, audit data, connector state, and tenant configuration.
- Storage is abstracted behind profile-based services for private documents, public tenant assets, and encrypted backups.
- The AWS target state preserves these boundaries and mainly changes the hosting, storage, scheduling, and observability model.

## 2. Current-State Runtime Topology

```mermaid
flowchart TB
    browser["Browser clients"] --> portal["portal-web
    Next.js app runtime"]
    browser --> admin["admin-console
    Next.js app runtime"]

    portal --> api["api
    Fastify application server"]
    admin --> api

    subgraph shared["Shared domain/infrastructure layer
    packages/server + shared packages"]
        services["Domain services
        audit, notifications, tenant settings,
        billing enrollment, connectors"]
        jobs["Job queue + handlers"]
        events["Event bus + delivery tracking"]
        storage["Storage service abstraction"]
        telemetry["Logging, metrics, audit hooks"]
    end

    api --> services
    api --> jobs
    api --> events
    api --> storage
    api --> telemetry

    worker["job-worker
    queue polling and execution"] --> jobs
    worker --> services
    worker --> events
    worker --> storage
    worker --> telemetry

    services --> postgres["Postgres"]
    jobs --> postgres
    events --> postgres
    api --> postgres
    worker --> postgres

    storage --> localDocs["Local/private storage"]
    storage --> publicAssets["Public tenant assets"]
    storage --> backups["Encrypted backup artifacts"]
```

## 3. Current-State Request And Trust Boundaries

```mermaid
flowchart LR
    subgraph client["Client-controlled boundary"]
        browser["Browser"]
        webState["Cookies, browser storage,
        request headers"]
    end

    subgraph app["Server-trusted boundary"]
        portal["portal-web"]
        admin["admin-console"]
        api["api"]
        policy["Auth, tenant, role,
        permission checks"]
    end

    subgraph data["Protected state"]
        postgres["Postgres"]
        storage["Storage services"]
    end

    browser --> portal
    browser --> admin
    browser --> webState
    portal --> api
    admin --> api
    api --> policy
    policy --> postgres
    api --> storage
```

## 4. Current-State Synchronous Request Path

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as portal-web or admin-console
    participant A as api
    participant P as policy + tenant resolution
    participant DB as Postgres
    participant ST as Storage

    B->>W: Page request / user action
    W->>A: HTTP request with auth context
    A->>P: Resolve token, tenant, preview/session rules
    P-->>A: Authorized or denied
    alt Authorized
        A->>DB: Read / write domain data
        opt Document or asset access
            A->>ST: Load object / URL / metadata
            ST-->>A: Storage result
        end
        A-->>W: Tenant-scoped payload
        W-->>B: Render response
    else Denied
        A-->>W: 401 / 403
        W-->>B: Error / redirect
    end
```

## 5. Current-State API Internal Structure

```mermaid
flowchart TB
    edge["Fastify server hooks
    correlation ID, tenant context,
    access token verification"] --> routes["Route registration
    auth, member, billing-enrollment,
    documents, connectors, jobs,
    audit, admin, metrics, health"]

    routes --> services["Application services
    auth, branding, documents,
    connectors, roles, search,
    preview sessions, tenant admin"]

    services --> shared["Shared server modules
    audit, integrations, notifications,
    storage, billing enrollment"]

    services --> db["Prisma / Postgres"]
    shared --> db
    shared --> storage["Storage abstraction"]
    shared --> queue["Job queue"]
    shared --> events["Event bus"]
```

## 6. Current-State Async, Event, And Job Processing

```mermaid
flowchart LR
    request["User/admin/API-triggered action"] --> domain["Domain service or route"]
    domain --> enqueue["enqueueJob()"]
    domain --> publish["publish()/publishInBackground()"]

    enqueue --> jobTable["Job table in Postgres"]
    publish --> eventTable["Event + delivery tables in Postgres"]

    worker["job-worker"] --> poll["getPendingJob()
    markJobRunning()"]
    poll --> jobTable

    worker --> handlers["Registered job handlers
    backup.run and others"]
    handlers --> domainExec["Domain execution"]
    domainExec --> mark["markJobSucceeded()
    or retry/fail"]
    mark --> jobTable

    eventTable --> subscribers["Event subscribers
    integrations, jobs, telemetry"]
    subscribers --> external["External systems or internal follow-on work"]
```

## 7. Current-State Storage Architecture

```mermaid
flowchart TB
    services["API + shared services"] --> storageFactory["Storage service factory"]

    storageFactory --> defaultProfile["Default profile
    private documents/artifacts"]
    storageFactory --> publicProfile["Public-assets profile
    tenant branding/media"]
    storageFactory --> backupProfile["Backup profile
    encrypted backup payloads"]

    defaultProfile --> localDefault["Local storage directory"]
    publicProfile --> localPublic["Portal public tenant-assets path"]
    backupProfile --> localBackup["Local backups directory"]

    storageFactory -.when STORAGE_PROVIDER=s3.-> s3Profile["S3 adapter path
    config-ready, SDK wiring pending"]
```

## 8. Current-State Security And Identity Notes

```mermaid
flowchart LR
    browser["Browser"] --> portal["portal-web session envelope
    cookie-backed access token"]
    browser --> admin["admin-console browser storage
    auth token + session snapshot"]
    portal --> api["Bearer token to api"]
    admin --> api
    api --> verify["Access token verification
    tenant header resolution
    preview/session restrictions"]
    verify --> authz["Route and service authz
    401/403 audit logging"]
```

Engineering note:

- The repo contains a target security redesign that moves toward a more fully server-trusted session model and stricter tenant isolation. Use [multitenant-security-login-architecture.md](/Users/jfrank/Projects/Modular%20portal/docs/multitenant-security-login-architecture.md) as the reference for that hardening direction.

## 9. Target AWS Runtime Topology

```mermaid
flowchart TB
    users["Browsers / clients"] --> dns["Public DNS + HTTPS"]
    dns --> alb["Application Load Balancer"]

    alb --> portalSvc["ECS/Fargate
    portal-web service"]
    alb --> adminSvc["ECS/Fargate
    admin-console service"]
    alb --> apiSvc["ECS/Fargate
    api service"]

    portalSvc --> apiSvc
    adminSvc --> apiSvc

    workerSvc["ECS/Fargate
    job-worker service"] --> rds["RDS PostgreSQL"]
    apiSvc --> rds

    apiSvc --> obj["Object storage
    documents, public assets, backups"]
    workerSvc --> obj

    sched["EventBridge scheduled rule"] --> oneShot["One-shot ECS task
    backups:configure"]
    oneShot --> rds

    portalSvc --> obs["CloudWatch + OpenTelemetry"]
    adminSvc --> obs
    apiSvc --> obs
    workerSvc --> obs
    oneShot --> obs
```

## 10. Target AWS Request Path

```mermaid
sequenceDiagram
    participant B as Browser
    participant ALB as ALB / edge
    participant WEB as portal-web or admin-console ECS service
    participant API as api ECS service
    participant DB as RDS PostgreSQL
    participant OBJ as Object storage
    participant OBS as Observability

    B->>ALB: HTTPS request
    ALB->>WEB: Route by host/path
    WEB->>API: Internal API request
    API->>API: Auth, tenant, policy, correlation
    API->>DB: Domain read/write
    opt Documents / assets / backups metadata
        API->>OBJ: Object lookup / URL resolution
        OBJ-->>API: Object response
    end
    API-->>WEB: Response payload
    WEB-->>B: Rendered page / result
    WEB-->>OBS: Logs / metrics
    API-->>OBS: Logs / metrics
```

## 11. Target AWS Async And Scheduled Processing

```mermaid
flowchart LR
    api["api service"] --> jobState["Job/event state in RDS"]
    worker["job-worker service"] --> jobState

    worker --> backup["Backup jobs"]
    worker --> notify["Notification jobs"]
    worker --> sync["Connector sync jobs"]

    sync <--> external["External partner systems"]
    backup --> s3["Object storage"]
    notify --> db["RDS audit / job state"]
    worker --> obs["CloudWatch + metrics"]

    eventbridge["EventBridge"] --> task["Scheduled ECS task
    backups:configure"]
    task --> db
    task --> obs
```

## 12. Current-State To AWS Delta Matrix

| Area | Current State | Target AWS State | Engineering Impact |
| --- | --- | --- | --- |
| Web runtimes | locally split app processes and container-ready services | ECS/Fargate services | deployment and scaling change, application boundary stays the same |
| API | Fastify app with shared server modules | ECS/Fargate API service | same app model, cloud runtime hardening |
| Worker | dedicated process polling Postgres-backed queue | ECS/Fargate worker service | same execution model, improved runtime isolation |
| Database | Postgres local/container model | RDS PostgreSQL | managed ops, backups, availability, networking changes |
| File storage | local directories via storage abstraction | object storage via storage abstraction | adapter migration and path/public URL validation |
| Scheduling | shell/manual or local task model | EventBridge-triggered ECS task | externalized scheduling control plane |
| Observability | structured logs + metrics endpoint | CloudWatch + OpenTelemetry baseline | sink/export and alarm/dashboard work |
| Runtime config | env-driven shared config | env/secrets-driven shared config in ECS | secret management and environment parity work |

## 13. Engineering Review Checklist

- Validate that all synchronous business mutations still traverse `api` after migration.
- Keep `job-worker` as the only long-running job executor.
- Preserve tenant-scoped query enforcement and avoid client-trusted tenant identity.
- Confirm storage profile mapping for documents, public assets, and backups.
- Verify backup scheduling remains external to long-running services.
- Ensure staging mirrors production service split closely enough to validate behavior.
- Confirm log correlation and metrics visibility across `portal-web`, `admin-console`, `api`, `job-worker`, and scheduled tasks.

## 14. Recommended Companion Docs

- [system-and-flow-architecture-pack.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/system-and-flow-architecture-pack.md)
- [executive-architecture-deck-outline.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/executive-architecture-deck-outline.md)
- [runtime-config-model.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/runtime-config-model.md)
- [observability-baseline.md](/Users/jfrank/Projects/Modular%20portal/docs/architecture/observability-baseline.md)
- [multitenant-security-login-architecture.md](/Users/jfrank/Projects/Modular%20portal/docs/multitenant-security-login-architecture.md)
