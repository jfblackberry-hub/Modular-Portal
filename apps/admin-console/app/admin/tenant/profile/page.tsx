import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';

export default function AdminTenantProfilePage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tenant"
      title="Tenant profile"
      description="Workspace for tenant identity, profile data, and administrative metadata."
      highlights={[
        'Prepared route for tenant profile details under Tenant Administration.',
        'Separates profile-oriented information from broader configuration controls.',
        'Useful destination for future business metadata and contact ownership.'
      ]}
      nextSteps={[
        'Show tenant name, slug, lifecycle status, and administrative contacts.',
        'Add profile edit actions with audit tracking.',
        'Link to configuration and access-policy controls.'
      ]}
    />
  );
}
