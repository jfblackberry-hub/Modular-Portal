import { PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default function MemberPluginPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plugin"
        title="Member plugin workspace"
        description="Placeholder route for the member plugin using the updated healthcare portal visual language."
      />
      <SurfaceCard title="Plugin route" description="Discovered from the plugin manifest">
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          This route remains available through the plugin framework and now uses the same light-mode member portal styling.
        </p>
      </SurfaceCard>
    </div>
  );
}
