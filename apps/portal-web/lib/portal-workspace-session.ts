import type { PortalSessionUser } from './portal-session';

function normalizeIdentityPart(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

export function buildPortalWorkspaceSessionKey({
  portal,
  user
}: {
  portal: 'member' | 'provider' | 'employer' | 'broker';
  user:
    | Pick<
        PortalSessionUser,
        'id' | 'tenant' | 'session' | 'previewSession' | 'landingContext'
      >
    | null
    | undefined;
}) {
  const userId = normalizeIdentityPart(user?.id, 'anonymous-user');
  const tenantId = normalizeIdentityPart(
    user?.session.type === 'platform_admin'
      ? user?.tenant?.id
      : user?.session.tenantId ?? user?.tenant?.id,
    'unknown-tenant'
  );
  const sessionType = normalizeIdentityPart(user?.session.type, 'anonymous-session');
  const personaType = normalizeIdentityPart(user?.session.personaType, sessionType);
  const landingContext = normalizeIdentityPart(user?.landingContext, portal);
  const previewSessionId = normalizeIdentityPart(
    user?.previewSession?.id,
    'primary-session'
  );
  const previewPortalType = normalizeIdentityPart(
    user?.previewSession?.portalType,
    'primary-portal'
  );
  const previewPersona = normalizeIdentityPart(
    user?.previewSession?.persona,
    personaType
  );
  const previewMode = normalizeIdentityPart(
    user?.previewSession?.mode,
    'primary-mode'
  );

  return `${portal}:${tenantId}:${sessionType}:${personaType}:${landingContext}:${previewPortalType}:${previewPersona}:${previewMode}:${previewSessionId}:${userId}`;
}
