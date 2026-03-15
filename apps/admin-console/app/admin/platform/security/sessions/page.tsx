import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';

export default function AdminPlatformSessionsPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="Session management"
        description="Admin session visibility and control workspace for platform operators."
        highlights={[
          'Prepared route for active admin sessions and sign-in governance.',
          'Completes the Security section in the platform menu.',
          'Suitable for future session revocation and policy enforcement tools.'
        ]}
        nextSteps={[
          'List active admin sessions and recent sign-in activity.',
          'Add forced sign-out and anomaly review actions.',
          'Link session events to identity and audit pages.'
        ]}
      />
    </PlatformAdminGate>
  );
}
