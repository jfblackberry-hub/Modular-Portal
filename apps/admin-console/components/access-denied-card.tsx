import Link from 'next/link';

import { SectionCard } from './section-card';

type AccessDeniedCardProps = {
  title?: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
};

export function AccessDeniedCard({
  title = 'Access denied',
  description = 'This area is restricted to platform administrators.',
  href = '/admin/tenant/health',
  hrefLabel = 'Go to tenant workspace'
}: AccessDeniedCardProps) {
  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-admin-muted">
          Tenant admins can manage resources inside their assigned tenant only.
        </p>
        <Link
          href={href}
          className="inline-flex rounded-full bg-admin-accent px-4 py-2 text-sm font-semibold text-white"
        >
          {hrefLabel}
        </Link>
      </div>
    </SectionCard>
  );
}
