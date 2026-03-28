import { getAdminDestination } from './admin-redirect';
import type { PortalSessionUser } from './portal-session';
import { config } from './server-runtime';

type AdminSessionHandoffResult = {
  handoffUrl: string;
  redirectPath: string;
  sessionHandoff: true;
};

export function requiresAdminSessionHandoff(
  user: Pick<PortalSessionUser, 'landingContext' | 'roles' | 'session'>
) {
  return (
    user.session?.type === 'platform_admin' ||
    user.session?.type === 'tenant_admin' ||
    getAdminDestination(user) !== null
  );
}

export async function createAdminSessionHandoff(input: {
  accessToken: string;
  user: Pick<PortalSessionUser, 'landingContext' | 'roles' | 'session'>;
}) {
  const redirectPath = getAdminDestination(input.user) ?? '/admin';
  const response = await fetch(
    `${config.serviceEndpoints.admin}/api/auth/session/handoff/init`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redirectPath
      }),
      cache: 'no-store'
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        artifact?: string;
        message?: string;
        redirectPath?: string;
      }
    | null;

  if (!response.ok || !payload?.artifact) {
    throw new Error(
      payload?.message ?? 'Unable to establish a secure admin session handoff.'
    );
  }

  const handoffUrl = new URL('/login', config.serviceEndpoints.admin);
  handoffUrl.searchParams.set('artifact', payload.artifact);
  handoffUrl.searchParams.set('redirectPath', payload.redirectPath ?? redirectPath);

  return {
    handoffUrl: handoffUrl.toString(),
    redirectPath: payload.redirectPath ?? redirectPath,
    sessionHandoff: true
  } satisfies AdminSessionHandoffResult;
}
