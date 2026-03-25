import Link from 'next/link';

import { AdminPageLayout } from '../../../../components/admin-ui';
import { SectionCard } from '../../../../components/section-card';

export const dynamic = 'force-dynamic';

export default function AdminTenantConfigurationPage() {
  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Configuration"
      description="Manage branding, notifications, integrations, and operational defaults without mixing governance controls into the same screen."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Experience configuration"
          description="Branding, notification settings, and tenant operational defaults stay here."
        >
          <p className="text-sm text-admin-muted">
            Governance controls such as licensing and roles have been moved into dedicated admin views.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/tenant/licensing"
              className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
            >
              Open licensing
            </Link>
            <Link
              href="/admin/tenant/roles"
              className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
            >
              Open roles
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Control-plane separation"
          description="The admin console now manages governance through dedicated views instead of portal-style combined composition."
        >
          <p className="text-sm text-admin-muted">
            Keep tenant branding and operational settings here, and use the dedicated governance pages for licensing, feature flags, and access policy changes.
          </p>
        </SectionCard>
      </div>
    </AdminPageLayout>
  );
}
