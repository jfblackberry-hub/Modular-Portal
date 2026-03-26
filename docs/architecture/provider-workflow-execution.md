# Provider Workflow Execution

Provider user actions that trigger system work must flow through the centralized workflow layer.

## Enforced pattern

1. Provider UI surfaces declare an action intent only.
2. Portal routes proxy the request to the API using the authenticated session tenant context.
3. API workflow routes resolve tenant and Organization Unit scope from the session, not from client-supplied tenant identifiers.
4. The workflow service persists a `ProviderWorkflowExecution` record before any execution occurs.
5. The workflow service enqueues `provider.workflow.execute` for background execution.
6. Audit logs are written for both initiation and disposition.
7. Workflow telemetry is emitted through `workflow.started` and `workflow.completed`.

## Guardrails

- Widgets do not call external systems directly.
- Widgets do not execute provider actions directly.
- Tenant scope is fixed by authenticated session context.
- Active Organization Unit scope is fixed by authenticated session context and cannot be switched mid-session.
- Persona and active Organization Unit are recorded on the workflow execution record for traceability.

## Extension points

- Approval routing can be introduced before job execution by adding review-state transitions on `ProviderWorkflowExecution`.
- Rules evaluation can enrich or reject submissions before job enqueue.
- Automation can subscribe to workflow completion events without changing widget code.
