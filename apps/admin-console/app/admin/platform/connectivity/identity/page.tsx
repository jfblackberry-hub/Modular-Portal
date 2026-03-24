import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';

export default function AdminPlatformIdentityPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="SSO / identity"
        description="Identity-provider and admin authentication workspace for platform operators."
        highlights={[
          'Prepared route for SSO, identity provider status, and authentication posture.',
          'Completes the role-aware platform Connectivity section.',
          'Suitable for future provider configuration and sign-in diagnostics.'
        ]}
        nextSteps={[
          'Expose active identity providers and certificate expiry status.',
          'Add admin login success and failure trends.',
          'Provide drill-downs into session controls and access reviews.'
        ]}
      />
    </PlatformAdminGate>
  );
}
