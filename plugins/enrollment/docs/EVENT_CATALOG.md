# Billing & Enrollment Event Catalog

Published through shared event bus (`publishInBackground`).

## Enrollment Lifecycle

- `enrollment.created`
- `enrollment.updated`
- `enrollment.submitted`
- `enrollment.completed`

## Workflow / Orchestration

- `workflow.started`

## Notifications and Messaging

- `notification.requested`

## Documents

- `document.uploaded`

## Integrations

- `integration.requested`

## Typical payload domains

- enrollment IDs, household IDs, step/status transitions
- document IDs and uploader metadata
- payment/integration correlation references
- notification template/channel/recipient data
