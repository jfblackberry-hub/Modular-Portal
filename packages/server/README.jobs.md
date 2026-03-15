# Jobs Layer

The jobs layer provides a simple PostgreSQL-backed queue for background work that should not block API requests.

## What It Is For

Use jobs for asynchronous work such as:

- notifications
- connector syncs
- document processing
- search indexing
- webhook delivery
- scheduled follow-up tasks

## How To Start The Worker

Run:

```bash
pnpm --filter @payer-portal/server worker:jobs
```

The worker polls for the next eligible `PENDING` job where `runAt <= now`, executes the registered handler, and updates the job status.

## How To Enqueue A Test Job

Run the local API and post to:

```bash
curl -X POST http://127.0.0.1:3002/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "notification.send",
    "tenantId": null,
    "payload": {
      "channel": "email",
      "recipientId": "test-user",
      "templateKey": "manual-test"
    }
  }'
```

## Current Registered Job Types

- `backup.run`
- `notification.send`
- `connector.sync`
- `document.process`
- `search.index`

`backup.run` creates encrypted backup artifacts plus `manifest.json` and `verification.json` logs under the configured backup directory.

## Retry Behavior

- jobs start as `PENDING`
- a worker marks a job `RUNNING` and increments `attempts`
- on success, the job becomes `SUCCEEDED`
- on failure:
  - if `attempts < maxAttempts`, the job returns to `PENDING`
  - `runAt` is delayed using backoff: `attempts * 60 seconds`
  - `lastError` is stored
  - once attempts are exhausted, the job becomes `FAILED`

Manual retry is available through `POST /api/jobs/:id/retry`, which resets a failed job back to `PENDING`.
