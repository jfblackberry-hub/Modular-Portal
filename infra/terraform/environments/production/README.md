# Production Environment Placeholder

Planned composition:

- autoscaled `portal-web`
- autoscaled `admin-console`
- autoscaled `api`
- at least 1 `job-worker`
- RDS PostgreSQL
- EventBridge scheduled ECS task for backup configuration
- object storage for documents, logos, and backup artifacts
