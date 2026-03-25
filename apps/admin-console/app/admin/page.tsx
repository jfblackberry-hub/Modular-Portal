import Link from 'next/link';

export default function AdminIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          Control plane
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Admin governance workspace
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          Use dedicated views for licensing, feature flags, and roles. Portal rendering stays outside the admin console.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            href: '/admin/platform/licensing',
            title: 'Licensing',
            description: 'Manage tenant module entitlements and capability availability.'
          },
          {
            href: '/admin/platform/feature-flags',
            title: 'Feature flags',
            description: 'Control platform and tenant-scoped feature activation.'
          },
          {
            href: '/admin/platform/roles',
            title: 'Roles and permissions',
            description: 'Manage RBAC definitions, permission coverage, and assignments.'
          }
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-admin-border bg-white p-6 transition hover:border-admin-accent"
          >
            <h2 className="text-xl font-semibold text-admin-text">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-admin-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
