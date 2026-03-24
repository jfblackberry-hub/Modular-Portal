import {
  config,
  getTenantScopedAdminAuthHeaders
} from './api-auth';

type PersonaSessionAuditEventInput = {
  action:
    | 'persona.session.opened'
    | 'persona.session.focused'
    | 'persona.session.closed';
  sessionId: string;
  tenantId: string;
  personaType: string;
  userId: string;
};

export async function recordPersonaSessionAuditEvent(
  input: PersonaSessionAuditEventInput
) {
  const response = await fetch(`${config.apiBaseUrl}/platform-admin/persona-sessions/events`, {
    method: 'POST',
    headers: {
      ...getTenantScopedAdminAuthHeaders(input.tenantId),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | {
          message?: string;
        }
      | null;

    throw new Error(
      payload?.message ?? 'Unable to record persona session audit event.'
    );
  }
}
