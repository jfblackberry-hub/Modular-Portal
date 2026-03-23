import { cookies } from 'next/headers';

import { readPortalSessionEnvelopeFromCookie } from './portal-session-cookie';
import { PORTAL_SESSION_COOKIE } from './session-constants';

export interface PortalTenant {
  id: string;
  name: string;
  brandingConfig?: Record<string, unknown>;
}

export type PortalSessionType = 'tenant_admin' | 'end_user' | 'platform_admin';

export type PortalSessionScope =
  | {
      personaType: 'platform_admin';
      type: 'platform_admin';
      tenantId: null;
      roles: string[];
      permissions: string[];
    }
  | {
      personaType: 'tenant_admin' | 'end_user';
      type: 'tenant_admin' | 'end_user';
      tenantId: string;
      roles: string[];
      permissions: string[];
    };

export interface PortalSessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  session: PortalSessionScope;
  landingContext?:
    | 'member'
    | 'provider'
    | 'broker'
    | 'employer'
    | 'tenant_admin'
    | 'platform_admin';
  tenant: PortalTenant;
  roles: string[];
  permissions: string[];
  previewSession?: {
    id: string;
    portalType: 'member' | 'provider' | 'broker' | 'employer' | 'tenant_admin';
    persona: string;
    mode: 'READ_ONLY' | 'FUNCTIONAL';
    adminUserEmail: string;
    createdAt: string;
    expiresAt: string;
    homePath: string;
  };
}

export interface PortalSession {
  accessToken: string;
  user: PortalSessionUser;
}

export async function getPortalSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  const sessionEnvelope = await readPortalSessionEnvelopeFromCookie(rawSession);

  if (!sessionEnvelope) {
    return null;
  }

  return {
    accessToken: sessionEnvelope.accessToken,
    user: sessionEnvelope.user as unknown as PortalSessionUser
  } satisfies PortalSession;
}

export async function getPortalSessionUser() {
  const session = await getPortalSession();
  return session?.user ?? null;
}

export async function getPortalSessionAccessToken() {
  const session = await getPortalSession();
  return session?.accessToken ?? null;
}
