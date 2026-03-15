import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';

export default function AdminPlatformTenantConfigurationPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="Tenant configuration"
        description="Cross-tenant configuration governance workspace for platform administrators."
        highlights={[
          'Prepared route for reviewing tenant-level branding, notification, and integration baselines.',
          'Keeps tenant management and tenant configuration as separate navigable destinations.',
          'Useful landing page for future cross-tenant configuration drift detection.'
        ]}
        nextSteps={[
          'Add tenant-by-tenant configuration summaries and search.',
          'Highlight drift from platform defaults and policy baselines.',
          'Link into tenant-specific configuration drill-downs.'
        ]}
      />
    </PlatformAdminGate>
  );
}
