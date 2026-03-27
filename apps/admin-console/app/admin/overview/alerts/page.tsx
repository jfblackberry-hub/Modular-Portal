import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminOverviewAlertsPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Overview"
        title="Alerts"
        description="Centralize cross-platform alerting, escalation, and attention queues without mixing tenant-scoped workflow execution into the platform layer."
        highlights={[
          'Cross-platform alert triage for Platform Health, tenant onboarding risk, and integration failures.',
          'This page stays platform-scoped unless an operator drills into a selected tenant.',
          'Alerts should summarize urgency without duplicating tenant workspaces.'
        ]}
        nextSteps={[
          'Add alert acknowledgement, assignee, and severity filters.',
          'Connect tenant drill-ins to the selected tenant context.',
          'Add alert source adapters from health, integrations, and audit signals.'
        ]}
      />
    </PlatformAdminGate>
  );
}
