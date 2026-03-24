import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminPlatformAuditOverviewPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="Audit overview"
        description="High-level audit summary workspace for platform operators."
        highlights={[
          'Prepared route for cross-tenant audit summaries and trend views.',
          'Supports the Overview section without exposing the full audit log immediately.',
          'Can grow into rollups by actor, resource, and event family.'
        ]}
        nextSteps={[
          'Add KPI cards for event volume, privileged actions, and failure spikes.',
          'Summarize notable tenant and platform changes over time.',
          'Link directly into detailed audit log filters.'
        ]}
      />
    </PlatformAdminGate>
  );
}
