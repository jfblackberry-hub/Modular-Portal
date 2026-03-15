import { PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default function BrokerPluginPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plugin"
        title="Broker plugin workspace"
        description="Placeholder broker plugin route using the modernized light portal system."
      />
      <SurfaceCard title="Plugin route" description="Broker module placeholder">
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          This route remains isolated behind plugin contracts and now matches the main portal aesthetic.
        </p>
      </SurfaceCard>
    </div>
  );
}
