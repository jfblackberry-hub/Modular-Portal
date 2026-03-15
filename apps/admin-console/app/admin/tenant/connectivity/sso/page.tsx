import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';

export default function AdminTenantSsoPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tenant"
      title="SSO"
      description="Tenant identity and single sign-on workspace."
      highlights={[
        'Prepared route for tenant-level SSO configuration and visibility.',
        'Keeps identity concerns separate from general tenant connectivity.',
        'Supports future provider setup and certificate health views.'
      ]}
      nextSteps={[
        'Add tenant identity provider status and config summary.',
        'Track recent login issues and provisioning failures.',
        'Link SSO events into tenant audit history.'
      ]}
    />
  );
}
