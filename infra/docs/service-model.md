# Service Model

## `portal-web`

- Serves end-user and preview web routes
- Calls `api` for authenticated data
- Does not execute background jobs

## `admin-console`

- Serves platform-admin and tenant-admin control plane routes
- Calls `api` for authenticated data and mutations
- Does not execute background jobs

## `api`

- Owns synchronous application business APIs
- Enqueues background jobs
- Does not execute job polling loops

## `job-worker`

- Polls the shared job queue
- Executes `backup.run`, `notification.send`, `connector.sync`, and other async work
- May be reused as the image for one-shot scheduled tasks with a command override
