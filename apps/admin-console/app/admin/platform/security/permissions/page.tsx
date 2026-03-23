import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';

export default function AdminPlatformPermissionsPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="Permission matrix"
        description="Role-to-permission coverage workspace for platform security review."
        highlights={[
          'Prepared route for viewing permission boundaries beyond role editing.',
          'Pairs naturally with role management while staying in the Security section.',
          'Useful for future least-privilege and compliance reviews.'
        ]}
        nextSteps={[
          'Render a matrix of roles against effective permissions.',
          'Highlight overly broad access and missing controls.',
          'Add export and audit-review actions.'
        ]}
      />
    </PlatformAdminGate>
  );
}
