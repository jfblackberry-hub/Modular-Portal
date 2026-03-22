'use client';

import { AdminActionWorkspace, AdminEmptyState, AdminPageLayout } from './admin-ui';
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
  const actions = [
    {
      key: 'current-scope',
      label: 'Current scope',
      description: 'Current route readiness and intent.',
      loader: async () => ({
        default: function CurrentScopePanel({
          highlights
        }: {
          highlights: string[];
          nextSteps: string[];
        }) {
          return (
            <SectionCard title="Current scope" description="Prepared routing target for the new admin shell.">
              <ul className="space-y-2 text-sm text-admin-muted">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          );
        }
      }),
      props: { highlights, nextSteps }
    },
    {
      key: 'next-steps',
      label: 'Next steps',
      description: 'Recommended follow-on implementation work.',
      loader: async () => ({
        default: function NextStepsPanel({
          nextSteps
        }: {
          highlights: string[];
          nextSteps: string[];
        }) {
          return (
            <SectionCard title="Next build steps" description="Recommended follow-on work for this workspace.">
              <ul className="space-y-2 text-sm text-admin-muted">
                {nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          );
        }
      }),
      props: { highlights, nextSteps }
    }
  ];

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
      <AdminActionWorkspace
        actions={actions}
        persistKey={`admin-placeholder-${title}`}
        emptyStateTitle="Select a workspace panel"
        emptyStateDescription="Load the current route scope or recommended next steps without leaving the page."
      />
    </AdminPageLayout>
  );
}
