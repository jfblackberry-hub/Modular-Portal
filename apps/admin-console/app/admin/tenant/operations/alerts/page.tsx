import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';

export default function AdminTenantAlertsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tenant"
      title="Alerts"
      description="Tenant-specific alert monitoring and response workspace."
      highlights={[
        'Prepared route for operational alerts that matter to tenant admins.',
        'Completes the tenant Operations section in the new role-based menu.',
        'Designed for future acknowledgement and ownership workflows.'
      ]}
      nextSteps={[
        'Show tenant-impacting alerts by severity and subsystem.',
        'Track status, assignee, and acknowledgement state.',
        'Connect alert details to jobs, connectivity, and audit activity.'
      ]}
    />
  );
}
