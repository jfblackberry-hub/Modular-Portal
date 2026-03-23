# System Architecture Overview

This diagram shows the current high-level architecture for the Modular Portal monorepo as implemented today: separate web runtimes for member-facing and admin experiences, a shared application API, a plugin-driven portal shell, shared server modules, background jobs, and tenant-scoped data/storage.

## Executive-Level Diagram

```mermaid
flowchart TB
    users["Users
    Members, Employers, Brokers, Providers, Admins"] --> experience["Digital Experience Layer
    Member portal and admin console"]

    experience --> platform["Core Platform
    Authentication, business workflows,
    tenant configuration, APIs"]

    platform --> extensions["Extension Layer
    Plugins, connectors, partner integrations"]
    platform --> data["Data and Content Layer
    Operational data, documents, branding assets, backups"]
    platform --> operations["Operations Layer
    Background jobs, monitoring, audit, reporting"]

    external["External Systems
    Vendor platforms, partner APIs,
    future AWS-managed services"] <--> extensions
```

## System Diagram

```mermaid
flowchart TB
    endUsers["End Users
    Members, Employers, Brokers, Providers"] --> portal["Portal Web
    Next.js app
    apps/portal-web"]
    admins["Admins
    Tenant Admins, Platform Admins"] --> admin["Admin Console
    Next.js app
    apps/admin-console"]

    portal -->|Server-side + browser API calls| api["Application API
    Node/TypeScript runtime
    apps/api"]
    admin -->|Control-plane API calls| api

    subgraph portalShell["Portal Experience Layer"]
        portal
        plugins["Plugin Manifests
        member, provider, broker,
        billing-enrollment"]
        branding["Tenant Branding +
        Runtime Navigation"]
    end

    portal -.feature flags + plugin manifests.-> plugins
    portal -.tenant-aware UX.-> branding

    subgraph appCore["Application Core"]
        api
        shared["Shared Server Modules
        audit, connectors, notifications,
        tenant settings, billing enrollment,
        storage, integrations"]
        events["Event Bus
        persisted deliveries"]
        jobs["Job Queue
        persisted jobs"]
    end

    api --> shared
    shared --> events
    shared --> jobs

    worker["Job Worker
    background processing only
    packages/server"] -->|polls + executes| jobs
    worker --> shared

    subgraph dataPlane["Persistence and Assets"]
        postgres["Postgres
        tenant-scoped operational data,
        jobs, events, audit, config"]
        storage["Storage Service
        local adapter today,
        S3-ready abstraction"]
        publicAssets["Public Tenant Assets
        logos, branding media"]
        backups["Encrypted Backup Artifacts"]
        externalCatalog["External Portal Catalog DB
        MySQL placeholder integration"]
    end

    api --> postgres
    shared --> postgres
    worker --> postgres
    api --> storage
    shared --> storage
    storage --> publicAssets
    storage --> backups
    api -.optional external source.-> externalCatalog

    subgraph controlPlane["Control and Extension Points"]
        featureFlags["Feature Flags
        enable/disable plugins per tenant"]
        connectors["Connector Config +
        Integration Adapters
        REST, SFTP, Webhook"]
        contracts["Shared Packages
        config, canonical model,
        API contracts, utilities"]
    end

    admin -->|manage| featureFlags
    admin -->|manage| connectors
    featureFlags --> postgres
    connectors --> shared
    api --> contracts
    portal --> contracts
    admin --> contracts
    worker --> contracts

    observability["Observability
    structured logs, correlation IDs,
    metrics, OpenTelemetry baseline"] -.cross-cutting.-> api
    observability -.cross-cutting.-> worker
```

## Component Summary

- `apps/portal-web`: member and channel-facing portal shell, with navigation and experiences assembled from plugin manifests and tenant feature flags.
- `apps/admin-console`: tenant-admin and platform-admin control plane for configuration, operations, cataloging, and feature enablement.
- `apps/api`: the main authenticated application API and orchestration layer used by both web apps.
- `packages/server`: shared domain and infrastructure modules for jobs, events, integrations, storage, backups, auditing, notifications, and billing/enrollment services.
- `plugins/*`: modular route and navigation manifests that let the portal surface tenant-enabled capabilities without hard-coding every workspace into the shell.
- `Postgres`: primary system of record for tenant-scoped platform data, operational records, queue state, and audit history.
- `Storage`: abstraction for documents, public tenant assets, and encrypted backups; local storage is active today and S3 is the target-compatible path.
- `job-worker`: the only long-running process that executes queued background work.

## Architectural Characteristics

- Modular monolith at the codebase level, with runtime separation between web apps, API, and worker.
- Plugin-driven portal composition controlled by feature flags and tenant context.
- Shared server-domain layer reused by API and worker rather than splitting into many microservices.
- Tenant-aware data, branding, and admin operations designed around a multitenant platform model.
- Event- and job-backed async processing for integrations, notifications, and backups.
- AWS-ready deployment direction without requiring Kubernetes.

## When To Use Which Diagram

- Use the executive-level diagram for stakeholder decks, roadmap conversations, and high-level architecture reviews.
- Use the system diagram for engineering discussions about runtime boundaries, extension points, and operational responsibilities.
