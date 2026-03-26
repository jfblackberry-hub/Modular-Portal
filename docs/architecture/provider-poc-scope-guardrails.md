# Provider POC Scope Guardrails

The initial Provider POC is intentionally deterministic and operationally narrow.

## Explicit exclusions

The current Provider POC does **not** include:

- an AI Copilot Experience
- an AI Copilot Capability
- AI-required core Provider Operations behavior
- agentic workflow execution

## Current implementation boundary

- Provider remains a Tenant Type, not a special AI surface.
- Provider Operations remains a single tenant-scoped capability.
- Widget visibility remains persona-scoped.
- Capability enablement remains tenant-scoped.
- Core dashboard behavior, navigation, and operational data do not require AI services or agent-style orchestration.

## Runtime/config guardrails

The Provider Experience now rejects tenant configuration that attempts to enable:

- `provider_ai_copilot`
- `provider_ai_assistant`
- `provider_agentic_workflows`
- nested configuration flags such as `aiCopilotEnabled`, `aiAssistantEnabled`, `agenticWorkflowsEnabled`, or `requiresAiForCoreOperations`

## Future-ready notes

Future AI support remains possible, but only as an explicit later extension:

- a separate optional Provider AI capability
- explicit tenant enablement
- explicit persona and policy controls
- no redesign of the Tenant model is required
