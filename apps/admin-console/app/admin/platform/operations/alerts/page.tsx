import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { AdminPlaceholderPage } from '../../../../../components/admin-placeholder-page';

export default function AdminPlatformAlertsPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Platform"
        title="System alerts"
        description="Platform alert triage workspace for operators."
        highlights={[
          'Prepared route for centralized alert monitoring and response.',
          'Completes the Operations menu hierarchy for platform admins.',
          'Designed for future severity views, ownership, and acknowledgement flows.'
        ]}
        nextSteps={[
          'List live alerts grouped by severity and subsystem.',
          'Track acknowledgement, escalation, and resolution status.',
          'Link alerts to jobs, logs, and connector failures.'
        ]}
      />
    </PlatformAdminGate>
  );
}
