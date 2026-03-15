import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { AuditLogPage } from '../../../../components/audit-log-page';

export default async function AdminPlatformAuditPage({
  searchParams
}: {
  searchParams: Promise<{
    tenantId?: string;
    tenant_id?: string;
    eventType?: string;
    resourceType?: string;
    resourceId?: string;
  }>;
}) {
  const params = await searchParams;
  const initialTenantId = params.tenantId ?? params.tenant_id ?? 'ALL';
  const initialEventType = params.eventType ?? '';
  const initialResourceType = params.resourceType ?? '';
  const initialResourceId = params.resourceId ?? '';

  return (
    <PlatformAdminGate>
      <AuditLogPage
        scope="platform"
        initialTenantId={initialTenantId}
        initialEventType={initialEventType}
        initialResourceType={initialResourceType}
        initialResourceId={initialResourceId}
      />
    </PlatformAdminGate>
  );
}
