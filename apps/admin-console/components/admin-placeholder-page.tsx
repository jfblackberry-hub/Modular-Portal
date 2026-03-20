import { AdminEmptyState, AdminPageLayout } from './admin-ui';
import { SectionCard } from './section-card';

type AdminPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  nextSteps: string[];
};

export function AdminPlaceholderPage({
  eyebrow,
  title,
  description,
  highlights,
  nextSteps
}: AdminPlaceholderPageProps) {
  return (
    <AdminPageLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      meta={
        <AdminEmptyState
          title="This admin area is not fully built yet"
          description="The route exists and is navigable, but the production workflow, persistence, and operational controls are still incomplete."
        />
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Current scope" description="Prepared routing target for the new admin shell.">
          <ul className="space-y-2 text-sm text-admin-muted">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Next build steps" description="Recommended follow-on work for this workspace.">
          <ul className="space-y-2 text-sm text-admin-muted">
            {nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AdminPageLayout>
  );
}
