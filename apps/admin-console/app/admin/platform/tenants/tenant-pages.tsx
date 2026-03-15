'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../../../components/section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../../../../lib/api-auth';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  healthStatus: 'HEALTHY' | 'PROVISIONING' | 'SUSPENDED';
  brandingConfig: Record<string, unknown>;
  quotaMembers: number | null;
  quotaStorageGb: number | null;
  createdAt: string;
  updatedAt?: string;
};

type Connector = {
  id: string;
  tenantId: string;
  adapterKey: string;
  name: string;
  status: string;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  lastHealthCheckAt: string | null;
  createdAt: string;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
};

type SettingsPayload = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  };
  branding: {
    displayName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  notificationSettings: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    digestEnabled: boolean;
    replyToEmail: string | null;
    senderName: string | null;
  };
  purchasedModules: string[];
  integrations: Connector[];
  webhooks: Connector[];
  users: User[];
};

type AuditEvent = {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: string;
};

type AuditResponse = {
  items: AuditEvent[];
};

type TenantListRow = {
  tenant: Tenant;
  users: number;
  connectivity: string;
  configuration: string;
  alerts: number;
};

const alertKeywords = ['fail', 'error', 'warning', 'denied', 'timeout'];

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'No recent activity';
  }

  return new Date(value).toLocaleString();
}

function getConnectivityLabel(connectors: Connector[]) {
  if (connectors.length === 0) {
    return 'Not configured';
  }

  const activeCount = connectors.filter(
    (connector) => connector.status.toUpperCase() === 'ACTIVE'
  ).length;

  if (activeCount === connectors.length) {
    return 'Healthy';
  }

  if (activeCount > 0) {
    return 'Warning';
  }

  return 'Critical';
}

function getConfigurationCompleteness(settings: SettingsPayload) {
  const checks = [
    Boolean(settings.branding.displayName?.trim()),
    Boolean(settings.branding.primaryColor?.trim()),
    Boolean(settings.notificationSettings.replyToEmail?.trim()),
    settings.notificationSettings.emailEnabled ||
      settings.notificationSettings.inAppEnabled ||
      settings.notificationSettings.digestEnabled,
    settings.integrations.length > 0
  ];

  return `${Math.round((checks.filter(Boolean).length / checks.length) * 100)}%`;
}

function getAlertCount(tenant: Tenant, settings: SettingsPayload, auditEvents: AuditEvent[]) {
  const auditAlertCount = auditEvents.filter((event) =>
    alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
  ).length;
  const connectorAlertCount = settings.integrations.filter(
    (connector) => connector.status.toUpperCase() !== 'ACTIVE'
  ).length;
  const tenantStatusAlerts = tenant.status === 'ACTIVE' ? 0 : tenant.status === 'ONBOARDING' ? 1 : 2;

  return auditAlertCount + connectorAlertCount + tenantStatusAlerts;
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('healthy') || normalized === 'active' || normalized === 'configured') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized.includes('warning') || normalized.includes('provision') || normalized.includes('%')) {
    return 'bg-amber-100 text-amber-700';
  }

  if (normalized.includes('critical') || normalized.includes('inactive') || normalized.includes('suspended')) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function buildTenantLogHref(tenantId: string, event?: { eventType: string; resourceType: string; resourceId: string | null }) {
  const query = new URLSearchParams({ tenantId });

  if (event) {
    query.set('eventType', event.eventType);
    query.set('resourceType', event.resourceType);
    if (event.resourceId) {
      query.set('resourceId', event.resourceId);
    }
  }

  return `/admin/platform/operations/logs?${query.toString()}`;
}

async function fetchTenantEnrichment(tenantId: string) {
  const [settingsResponse, auditResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/tenant-admin/settings?tenant_id=${tenantId}`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    }),
    fetch(`${apiBaseUrl}/platform-admin/audit/events?tenant_id=${tenantId}&page_size=8`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    })
  ]);

  if (!settingsResponse.ok || !auditResponse.ok) {
    throw new Error('Unable to load tenant details.');
  }

  const [settingsPayload, auditPayload] = (await Promise.all([
    settingsResponse.json(),
    auditResponse.json()
  ])) as [SettingsPayload, AuditResponse];

  return {
    settings: settingsPayload,
    auditEvents: auditPayload.items
  };
}

export function TenantListPage() {
  const [rows, setRows] = useState<TenantListRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTenantRows() {
      try {
        const response = await fetch(`${apiBaseUrl}/platform-admin/tenants`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Unable to load tenant list.');
        }

        const tenants = (await response.json()) as Tenant[];
        const enriched = await Promise.all(
          tenants.map(async (tenant) => {
            const { settings, auditEvents } = await fetchTenantEnrichment(tenant.id);

            return {
              tenant,
              users: settings.users.filter((user) => user.isActive).length,
              connectivity: getConnectivityLabel(settings.integrations),
              configuration: getConfigurationCompleteness(settings),
              alerts: getAlertCount(tenant, settings, auditEvents)
            };
          })
        );

        if (!isMounted) {
          return;
        }

        setRows(enriched);
        setError('');
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setRows([]);
        setError(
          nextError instanceof Error ? nextError.message : 'Unable to load tenant list.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTenantRows();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          Platform
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Tenant List
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          Review tenant status, users, connectivity posture, configuration readiness, and alerts from one platform-wide directory.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="Tenant directory"
        description="Platform-admin view of every tenant and its current operational posture."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading tenant directory...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-admin-muted">No tenants available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                <tr>
                  <th className="px-3 py-3">Tenant Name</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Users</th>
                  <th className="px-3 py-3">Connectivity</th>
                  <th className="px-3 py-3">Configuration</th>
                  <th className="px-3 py-3">Alerts</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.tenant.id} className="border-b border-admin-border/70">
                    <td className="px-3 py-4">
                      <div>
                        <Link
                          href={`/admin/platform/tenants/${row.tenant.id}`}
                          className="font-medium text-admin-text underline-offset-4 transition hover:text-admin-accent hover:underline"
                        >
                          {row.tenant.name}
                        </Link>
                        <p className="mt-1 text-xs text-admin-muted">{row.tenant.slug}</p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(row.tenant.healthStatus)}`}>
                        {row.tenant.healthStatus}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-admin-text">{row.users}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(row.connectivity)}`}>
                        {row.connectivity}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-admin-text">{row.configuration}</td>
                    <td className="px-3 py-4 text-admin-text">{row.alerts}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/platform/tenants/${row.tenant.id}`}
                          className="rounded-full border border-admin-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const [tenantResponse, enrichment] = await Promise.all([
          fetch(`${apiBaseUrl}/platform-admin/tenants/${tenantId}`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          }),
          fetchTenantEnrichment(tenantId)
        ]);

        if (!tenantResponse.ok) {
          throw new Error('Unable to load tenant detail.');
        }

        const tenantPayload = (await tenantResponse.json()) as Tenant;

        if (!isMounted) {
          return;
        }

        setTenant(tenantPayload);
        setSettings(enrichment.settings);
        setEvents(enrichment.auditEvents);
        setError('');
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(
          nextError instanceof Error ? nextError.message : 'Unable to load tenant detail.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const configurationItems =
    tenant && settings
      ? [
          {
            label: 'Display Name',
            value: settings.branding.displayName || tenant.name
          },
          {
            label: 'Theme Colors',
            value: `${settings.branding.primaryColor} / ${settings.branding.secondaryColor}`
          },
          {
            label: 'Reply-To',
            value: settings.notificationSettings.replyToEmail || 'Not configured'
          },
          {
            label: 'Notification Channels',
            value: [
              settings.notificationSettings.emailEnabled ? 'Email' : null,
              settings.notificationSettings.inAppEnabled ? 'In-app' : null,
              settings.notificationSettings.digestEnabled ? 'Digest' : null
            ]
              .filter(Boolean)
              .join(', ') || 'Not configured'
          }
        ]
      : [];

  const purchasedModules = settings?.purchasedModules ?? [];
  const memberModuleCount = purchasedModules.filter((moduleId) =>
    moduleId.startsWith('member_')
  ).length;
  const providerModuleCount = purchasedModules.filter((moduleId) =>
    moduleId.startsWith('provider_')
  ).length;
  const activeUsers = settings?.users.filter((user) => user.isActive).length ?? 0;
  const warningEvents = events.filter((event) =>
    alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            {tenant?.name ?? 'Tenant Detail'}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Platform-admin tenant workspace for profile, configuration, connectivity, users, and alerts.
          </p>
        </div>

        <Link
          href="/admin/platform/tenants"
          className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
        >
          Back to tenants
        </Link>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-admin-muted">Loading tenant workspace...</p>
      ) : !tenant || !settings ? (
        <p className="text-sm text-admin-muted">Tenant detail unavailable.</p>
      ) : (
        <div className="grid gap-6">
          <SectionCard
            title="Tenant Profile"
            description="Core tenant identity, lifecycle, and platform limits."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Status', value: tenant.status },
                { label: 'Health', value: tenant.healthStatus },
                { label: 'Member Limit', value: tenant.quotaMembers ? String(tenant.quotaMembers) : 'Uncapped' },
                {
                  label: 'Storage Limit',
                  value: tenant.quotaStorageGb ? `${tenant.quotaStorageGb} GB` : 'Uncapped'
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base font-semibold text-admin-text">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Operational Stats"
            description="Current user, module, and alert posture for this tenant."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Active Users', value: String(activeUsers), href: '/admin/platform/users' },
                { label: 'Purchased Modules', value: String(purchasedModules.length), href: `/admin/platform/tenants/configuration?tenantId=${tenant.id}` },
                { label: 'Warning Events', value: String(warningEvents), href: `/admin/platform/operations/logs?tenantId=${tenant.id}` },
                { label: 'Integrations', value: String(settings.integrations.length), href: '/admin/platform/connectivity/adapters' }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4 transition hover:border-admin-accent"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base font-semibold text-admin-text">{item.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-admin-accent">
                    Dive in
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Configuration"
            description="Tenant branding and notification posture."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {configurationItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm font-medium text-admin-text">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/admin/tenant/configuration"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
              >
                Open configuration workspace
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Licensing and Modules"
            description="Purchased capabilities and current module access across member and provider experiences."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}&moduleScope=member`}
                className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4 transition hover:border-admin-accent"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Member Modules</p>
                <p className="mt-2 text-2xl font-semibold text-admin-text">{memberModuleCount}</p>
              </Link>
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}&moduleScope=provider`}
                className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4 transition hover:border-admin-accent"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Provider Modules</p>
                <p className="mt-2 text-2xl font-semibold text-admin-text">{providerModuleCount}</p>
              </Link>
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}&moduleScope=all`}
                className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4 transition hover:border-admin-accent"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Total Purchased</p>
                <p className="mt-2 text-2xl font-semibold text-admin-text">{purchasedModules.length}</p>
              </Link>
            </div>
            <div className="mt-4">
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
              >
                Manage licensing and modules
              </Link>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Connectivity"
              description="Current tenant integration health and recent sync posture."
            >
              {settings.integrations.length === 0 ? (
                <p className="text-sm text-admin-muted">No tenant connections configured.</p>
              ) : (
                <div className="space-y-3">
                  {settings.integrations.map((connector) => (
                    <article
                      key={connector.id}
                      className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-admin-text">{connector.name}</p>
                          <p className="mt-1 text-sm text-admin-muted">{connector.adapterKey}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(connector.status)}`}>
                          {connector.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-admin-muted md:grid-cols-2">
                        <p>Last sync: {formatTimestamp(connector.lastSyncAt)}</p>
                        <p>Last health check: {formatTimestamp(connector.lastHealthCheckAt)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/admin/platform/connectivity/adapters"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
                >
                  Open connectivity workspace
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Users"
              description="Tenant users currently assigned to this workspace."
            >
              {settings.users.length === 0 ? (
                <p className="text-sm text-admin-muted">No tenant users available.</p>
              ) : (
                <div className="space-y-3">
                  {settings.users.map((user) => (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-admin-text">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 text-sm text-admin-muted">{user.email}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-admin-muted">
                        Roles: {user.roles.join(', ') || 'No roles assigned'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/admin/platform/users"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
                >
                  Open user management
                </Link>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Quick Links"
            description="Deep links into platform workspaces for this tenant."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link href={`/admin/platform/operations/jobs?tenantId=${tenant.id}`} className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm font-medium text-admin-text transition hover:border-admin-accent">
                Tenant jobs
              </Link>
              <Link href={buildTenantLogHref(tenant.id)} className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm font-medium text-admin-text transition hover:border-admin-accent">
                Tenant logs
              </Link>
              <Link href={`/admin/platform/audit?tenantId=${tenant.id}`} className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm font-medium text-admin-text transition hover:border-admin-accent">
                Tenant audit
              </Link>
              <Link href="/admin/platform/tenants/configuration" className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm font-medium text-admin-text transition hover:border-admin-accent">
                Tenant configuration
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Logs and Alerts"
            description="Tenant alert stream with direct drill-in to full logs."
          >
            {events.length === 0 ? (
              <p className="text-sm text-admin-muted">No recent logs or alerts recorded for this tenant.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Alerts</p>
                  <div className="mt-2 space-y-2">
                    {events
                      .filter((event) =>
                        alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
                      )
                      .slice(0, 5)
                      .map((event) => (
                        <Link
                          key={event.id}
                          href={buildTenantLogHref(tenant.id, event)}
                          className="block rounded-2xl border border-admin-border bg-rose-50/40 px-4 py-3 transition hover:border-admin-accent"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-admin-text">{event.eventType}</p>
                              <p className="mt-1 text-sm text-admin-muted">
                                {event.resourceType}
                                {event.resourceId ? ` • ${event.resourceId}` : ''}
                              </p>
                            </div>
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                              Warning
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-admin-muted">
                            {formatTimestamp(event.timestamp)}
                          </p>
                        </Link>
                      ))}
                    {events.filter((event) =>
                      alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
                    ).length === 0 ? (
                      <p className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm text-admin-muted">
                        No active warning alerts.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Recent Logs</p>
                  <div className="mt-2 space-y-2">
                    {events.slice(0, 6).map((event) => (
                      <Link
                        key={`log-${event.id}`}
                        href={buildTenantLogHref(tenant.id, event)}
                        className="block rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 transition hover:border-admin-accent"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-admin-text">{event.eventType}</p>
                            <p className="mt-1 text-sm text-admin-muted">
                              {event.resourceType}
                              {event.resourceId ? ` • ${event.resourceId}` : ''}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword)) ? 'Alert' : 'Info'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-admin-muted">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Link
                href={buildTenantLogHref(tenant.id)}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
              >
                View all tenant logs
              </Link>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
