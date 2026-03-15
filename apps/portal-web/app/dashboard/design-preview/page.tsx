import {
  PageHeader,
  ProgressMeter,
  QuickActionCard,
  StatCard,
  StatusBadge,
  SurfaceCard
} from '../../../components/portal-ui';

export default function DesignPreviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Design preview"
        title="Healthcare portal visual system"
        description="Reference page showing the updated token layer, cards, actions, statuses, and progress patterns."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <QuickActionCard
          href="/dashboard/id-card"
          label="View ID card"
          description="Core payer action styling"
          icon="🪪"
        />
        <StatCard
          label="New messages"
          value="2"
          detail="Example summary card"
          tone="success"
        />
        <ProgressMeter
          label="Deductible progress"
          current={800}
          total={2000}
          helper="Example progress visualization"
        />
      </div>

      <SurfaceCard
        title="Status badges"
        description="Soft tints and accessible text contrast for healthcare workflows."
      >
        <div className="flex flex-wrap gap-3">
          <StatusBadge label="Approved" />
          <StatusBadge label="Pending review" />
          <StatusBadge label="Denied" />
          <StatusBadge label="Processing" />
        </div>
      </SurfaceCard>
    </div>
  );
}
