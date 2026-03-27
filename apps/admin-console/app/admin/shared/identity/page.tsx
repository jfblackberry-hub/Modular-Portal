import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminSharedIdentityPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Shared Services"
        title="Identity & Access"
        description="Manage platform-wide identity, access models, and administrative policy without mixing tenant-scoped user state into the shared layer."
        highlights={[
          'Platform-wide roles, permissions, and admin security controls live here.',
          'Tenant-scoped user assignment remains in Users & Personas after a tenant is selected.',
          'This page separates identity governance from tenant workflow management.'
        ]}
        nextSteps={[
          'Unify roles, permissions, SSO, and sessions under one shared-service control surface.',
          'Add admin identity provider and session-management panels.',
          'Map tenant-specific handoff actions into the selected tenant context only.'
        ]}
      />
    </PlatformAdminGate>
  );
}
