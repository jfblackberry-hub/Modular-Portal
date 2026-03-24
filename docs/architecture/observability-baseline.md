# Observability Baseline

## Goals

- Preserve local developer visibility
- Provide AWS-ready operational signals
- Keep admin and end-user traffic observable without mixing their UI concerns

## Current Baseline

- Structured JSON logs for API and worker flows
- Correlation IDs propagated via `x-correlation-id`
- Prometheus-compatible metrics endpoint exposed by the API
- OpenTelemetry metrics SDK embedded in the shared server package

## Recommended AWS Setup

### Logs

- Primary sink: CloudWatch Logs
- Format: JSON lines
- Required fields:
  - `timestamp`
  - `level`
  - `service`
  - `correlationId`
  - `message`
  - request metadata when available

### Metrics

- In-app instrumentation: OpenTelemetry metrics
- Export shape today: Prometheus endpoint
- AWS recommendation:
  - keep OpenTelemetry instrumentation as the source of truth
  - use CloudWatch for dashboards and alarms
  - keep Prometheus support for local diagnostics and optional managed scraping

### Alarms

- API 5xx rate
- API latency p95
- job-worker failure count
- queue backlog age / oldest pending job
- auth/login failure spikes
- storage health degraded

### Dashboards

- Service overview
  - request volume
  - error rate
  - latency p50/p95
- Worker overview
  - jobs processed
  - failures
  - retries
  - oldest pending job
- Dependency overview
  - database readiness
  - storage health
  - connector activity

## Why CloudWatch + OpenTelemetry

- CloudWatch aligns best with ECS/Fargate operations, alarms, dashboards, and log retention.
- OpenTelemetry keeps instrumentation vendor-neutral.
- Prometheus is still useful, but should be secondary in AWS unless the platform later adopts managed Prometheus/Grafana at scale.
