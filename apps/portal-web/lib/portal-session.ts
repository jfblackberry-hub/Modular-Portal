import { cookies } from 'next/headers';

import {
  getPortalSessionCookieNames,
  readPortalSessionEnvelopeFromCookie
} from './portal-session-cookie';

export interface PortalTenant {
  id: string;
  name: string;
  tenantTypeCode?: string;
  brandingConfig?: Record<string, unknown>;
}

export interface PortalOrganizationUnit {
  id: string;
  name: string;
  type: string;
}

export type PortalSessionType = 'tenant_admin' | 'end_user' | 'platform_admin';

export type PortalSessionScope =
  | {
      personaType: 'platform_admin';
      type: 'platform_admin';
      tenantId: null;
      roles: string[];
      permissions: string[];
      activeOrganizationUnit: null;
      availableOrganizationUnits: [];
    }
  | {
      personaType: string;
      type: 'tenant_admin' | 'end_user';
      tenantId: string;
      roles: string[];
      permissions: string[];
      activeOrganizationUnit: PortalOrganizationUnit | null;
      availableOrganizationUnits: PortalOrganizationUnit[];
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
  let sessionEnvelope = null;

  for (const cookieName of getPortalSessionCookieNames()) {
    const rawSession = cookieStore.get(cookieName)?.value;
    sessionEnvelope = await readPortalSessionEnvelopeFromCookie(rawSession);

    if (sessionEnvelope) {
      break;
    }
  }

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
