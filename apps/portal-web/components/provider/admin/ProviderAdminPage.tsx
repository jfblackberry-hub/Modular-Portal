import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

export function ProviderAdminPage({
  config,
  variant
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
}) {
  const admin = config.adminModule;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.displayName}
        title={variant === 'medical' ? 'Provider Admin and Practice Management' : admin.title}
        description={admin.description}
      />

      {admin.enabledSections.includes('User Access') ? (
        <SurfaceCard title="User Access" description="Role placeholders for practice-level access control.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {admin.userAccessRoles.map((role) => (
              <article key={role.role} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {role.role}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{role.description}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Count placeholder: {role.count}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {admin.enabledSections.includes('Practice Information') ? (
        <SurfaceCard title="Practice Information" description="Core practice profile and contact placeholders.">
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Practice Name</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.practiceName}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">NPI</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.npi}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">TIN</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.tin}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Phone</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.phone}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Address</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.address}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Primary Contact</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.primaryContact}</p>
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Specialty</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{admin.practiceInformation.specialty}</p>
            </article>
          </div>
        </SurfaceCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        {admin.enabledSections.includes('Locations') ? (
          <SurfaceCard title="Locations" description="Office list with hours, address, and active/inactive status.">
            <div className="space-y-3">
              {admin.locations.map((location) => (
                <article key={location.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{location.name}</h3>
                    <StatusBadge label={location.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{location.address}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{location.officeHours}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>
        ) : null}

        {admin.enabledSections.includes('Rendering Providers') ? (
          <SurfaceCard title="Rendering Providers" description="Placeholder roster for rendering provider management.">
            <div className="space-y-3">
              {admin.renderingProviders.map((provider) => (
                <article key={provider.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{provider.name}</h3>
                    <StatusBadge label={provider.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{provider.specialty}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {admin.enabledSections.includes('Notification Preferences') ? (
          <SurfaceCard title="Notification Preferences" description="Channel and topic preferences for practice notifications.">
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Topic</th>
                    <th className="px-4 py-3 font-medium">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.notificationPreferences.map((preference) => (
                    <tr key={preference.id} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 text-[var(--text-primary)]">{preference.channel}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{preference.topic}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={preference.enabled ? 'Enabled' : 'Disabled'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        ) : null}

        {admin.enabledSections.includes('Linked Tax IDs / NPIs') ? (
          <SurfaceCard title="Linked Tax IDs / NPIs" description="Linked identifier placeholders for future enrollment integration.">
            <div className="space-y-3">
              {admin.linkedIdentifiers.map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.type}: {item.value}</p>
                    <StatusBadge label={item.status} />
                  </div>
                </article>
              ))}
            </div>
          </SurfaceCard>
        ) : null}
      </section>
    </div>
  );
}
