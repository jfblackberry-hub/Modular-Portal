import 'server-only';

import { buildPortalApiHeaders } from './api-request';
import { config } from './server-runtime';

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
  const headers = await buildPortalApiHeaders();

  if (!headers.get('authorization')) {
    return [] as TenantAdminAuditEventRecord[];
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/audit/events?page=1&page_size=50`, {
      headers,
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
