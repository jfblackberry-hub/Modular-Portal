import Link from 'next/link';

import { PlatformAdminGate } from '../../components/platform-admin-gate';
import { SectionCard } from '../../components/section-card';

const platformRoutes = [
  {
    href: '/platform/tenants',
    title: 'Tenants',
    description: 'Manage tenant provisioning, lifecycle, health, and quota controls.'
  },
  {
    href: '/platform/users',
    title: 'Users',
    description: 'View and manage users across all tenants in the shared platform.'
  },
  {
    href: '/platform/audit',
    title: 'Audit',
    description: 'Review platform-wide audit events across all tenant activity.'
  },
  {
    href: '/platform/metrics',
    title: 'Metrics',
    description: 'Inspect service health and raw system metrics for platform operations.'
  },
  {
    href: '/platform/settings',
    title: 'Settings',
    description: 'Maintain shared platform operator defaults and operating policies.'
  }
];

export default function PlatformDashboardPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Multi-tenant platform operations
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Dedicated workspace for platform operators to manage tenants, users,
            platform-wide audit activity, system health, and shared settings.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platformRoutes.map((route) => (
            <SectionCard
              key={route.href}
              title={route.title}
              description={route.description}
            >
              <Link
                href={route.href}
                className="inline-flex rounded-full bg-admin-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Open
              </Link>
            </SectionCard>
          ))}
        </div>
      </div>
    </PlatformAdminGate>
  );
}
