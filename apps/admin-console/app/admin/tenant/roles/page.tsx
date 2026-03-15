import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';

export default function AdminTenantRolesPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Tenant"
      title="Roles"
      description="Tenant-scoped role review and assignment workspace."
      highlights={[
        'Prepared route for tenant role management under User Administration.',
        'Keeps tenant user listing and role policy views distinct.',
        'Designed for future role assignment and permission review flows.'
      ]}
      nextSteps={[
        'Add tenant role summaries and effective permission views.',
        'Support assigning and reviewing tenant-admin-authorized roles.',
        'Surface recent access changes and related audit events.'
      ]}
    />
  );
}
