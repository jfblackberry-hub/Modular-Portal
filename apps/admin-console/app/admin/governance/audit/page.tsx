import { AuditLogPage } from '../../../../components/audit-log-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminGovernanceAuditPage() {
  return (
    <PlatformAdminGate>
      <AuditLogPage scope="platform" />
    </PlatformAdminGate>
  );
}
