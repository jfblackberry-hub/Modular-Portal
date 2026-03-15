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
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          {description}
        </p>
      </div>

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
    </div>
  );
}
