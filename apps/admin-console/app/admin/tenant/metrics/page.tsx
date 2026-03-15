import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';

export default function AdminTenantMetricsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tenant"
      title="Tenant metrics"
      description="Tenant-scoped metrics workspace for operational and service visibility."
      highlights={[
        'Prepared route for tenant-specific metrics under Overview.',
        'Keeps tenant metrics separate from tenant health as requested.',
        'Supports future KPI cards, trends, and sync summaries.'
      ]}
      nextSteps={[
        'Add tenant traffic, activity, and integration trend views.',
        'Expose service-level metrics relevant to tenant administrators.',
        'Link anomalies to connectivity, jobs, and alerts.'
      ]}
    />
  );
}
