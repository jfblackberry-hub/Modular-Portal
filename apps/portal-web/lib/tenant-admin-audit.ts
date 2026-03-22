import 'server-only';

import { getPortalSessionAccessToken } from './portal-session';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export type TenantAdminAuditEventRecord = {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
};

type TenantAdminAuditResponse = {
  items: Array<{
    id: string;
    tenantId: string;
    userId: string | null;
    eventType: string;
    resourceType: string;
    resourceId: string | null;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: string;
  }>;
};

export async function getTenantAdminAuditEvents() {
  const accessToken = await getPortalSessionAccessToken();

  if (!accessToken) {
    return [] as TenantAdminAuditEventRecord[];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/audit/events?page=1&page_size=50`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return [] as TenantAdminAuditEventRecord[];
    }

    const payload = (await response.json()) as TenantAdminAuditResponse;

    return payload.items;
  } catch {
    return [] as TenantAdminAuditEventRecord[];
  }
}
