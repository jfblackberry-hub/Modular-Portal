import { PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default function ProviderPluginPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plugin"
        title="Provider plugin workspace"
        description="Placeholder provider plugin route aligned to the new payer portal UI."
      />
      <SurfaceCard title="Plugin route" description="Provider module placeholder">
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          The provider plugin remains feature-flag driven and uses the shared shell styling.
        </p>
      </SurfaceCard>
    </div>
  );
}
