import { cookies } from 'next/headers';

import { PORTAL_USER_COOKIE } from './session-constants';

export interface PortalTenant {
  id: string;
  name: string;
  brandingConfig?: Record<string, unknown>;
}

export interface PortalSessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  landingContext?:
    | 'member'
    | 'provider'
    | 'employer'
    | 'tenant_admin'
    | 'platform_admin';
  tenant: PortalTenant;
  roles: string[];
  permissions: string[];
}

export async function getPortalSessionUser() {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get(PORTAL_USER_COOKIE)?.value;

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(rawUser)) as PortalSessionUser;
  } catch {
    return null;
  }
}
