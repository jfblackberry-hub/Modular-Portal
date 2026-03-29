'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminPageLayout, AdminStatCard } from '../../../../components/admin-ui';
import { SectionCard } from '../../../../components/section-card';
import { fetchAdminJsonCached } from '../../../../lib/admin-client-data';
import { config, getAdminAuthHeaders } from '../../../../lib/api-auth';

type HealthPayload = {
  status: string;
  checks: Record<
    string,
    {
      status: string;
      latencyMs?: number;
    }
  >;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  healthStatus: string;
  brandingConfig: Record<string, unknown>;
  quotaMembers: number | null;
  quotaStorageGb: number | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
  };
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

type PlatformHealthOverviewPayload = {
  health: HealthPayload;
  tenants: Tenant[];
  users: User[];
  auditEvents: AuditResponse;
};

type PlatformAlert = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
};

type TenantHealthRow = {
  id: string;
  name: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  activeUsers: number;
  lastSync: string;
  configurationStatus: string;
  openAlerts: number;
};

const failureKeywords = ['fail', 'error', 'warn', 'denied', 'timeout'];

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function normalizeSeverity(value: string): PlatformAlert['severity'] {
  if (value.includes('critical') || value.includes('inactive') || value.includes('down')) {
    return 'critical';
  }

  if (value.includes('warning') || value.includes('degraded') || value.includes('onboarding')) {
    return 'warning';
  }

  return 'info';
}

function getTenantStatus(status: Tenant['status']): TenantHealthRow['status'] {
  if (status === 'ACTIVE') {
    return 'Healthy';
  }

  if (status === 'ONBOARDING') {
    return 'Warning';
  }

  return 'Critical';
}

function getConfigurationStatus(tenant: Tenant) {
  if (tenant.status === 'INACTIVE') {
    return 'Suspended';
  }

  if (tenant.status === 'ONBOARDING') {
    return 'Provisioning';
  }

  const hasBranding = Object.keys(tenant.brandingConfig ?? {}).length > 0;
  return hasBranding ? 'Configured' : 'Needs review';
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'ok' || normalized.includes('healthy') || normalized.includes('active')) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized.includes('warning') || normalized.includes('degraded')) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function buildPlatformAlerts(health: HealthPayload | null, tenants: Tenant[], events: AuditEvent[]) {
  const healthAlerts: PlatformAlert[] = health
    ? Object.entries(health.checks)
        .filter(([, check]) => check.status.toLowerCase() !== 'ok')
        .map(([key, check]) => ({
          id: `health-${key}`,
          title: `${key} health check requires attention`,
          detail:
            typeof check.latencyMs === 'number'
              ? `${check.status} at ${check.latencyMs} ms`
              : `${check.status} without latency detail`,
          severity: normalizeSeverity(check.status.toLowerCase()),
          timestamp: new Date().toISOString()
        }))
    : [];

  const tenantAlerts: PlatformAlert[] = tenants
    .filter((tenant) => tenant.status !== 'ACTIVE')
    .map((tenant) => ({
      id: `tenant-${tenant.id}`,
      title:
        tenant.status === 'INACTIVE'
          ? `${tenant.name} is inactive`
          : `${tenant.name} is still onboarding`,
      detail:
        tenant.status === 'INACTIVE'
          ? 'Tenant requires operator review before returning to service.'
          : 'Provisioning remains in progress and should be monitored.',
      severity: tenant.status === 'INACTIVE' ? 'critical' : 'warning',
      timestamp: tenant.updatedAt
    }));

  const auditAlerts: PlatformAlert[] = events
    .filter((event) =>
      failureKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
    )
    .slice(0, 4)
    .map((event) => ({
      id: `audit-${event.id}`,
      title: event.eventType,
      detail: `${event.resourceType}${event.resourceId ? ` • ${event.resourceId}` : ''}`,
      severity: normalizeSeverity(event.eventType.toLowerCase()),
      timestamp: event.timestamp
    }));

  return [...healthAlerts, ...tenantAlerts, ...auditAlerts]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 6);
}

function buildTenantHealthRows(tenants: Tenant[], users: User[], events: AuditEvent[]): TenantHealthRow[] {
  return tenants.map((tenant) => {
    const tenantUsers = users.filter((user) => user.tenant.id === tenant.id && user.isActive);
    const tenantEvents = events.filter((event) => event.tenantId === tenant.id);
    const alertEvents = tenantEvents.filter((event) =>
      failureKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
    );
    const latestEvent = tenantEvents[0];

    return {
      id: tenant.id,
      name: tenant.name,
      status: getTenantStatus(tenant.status),
      activeUsers: tenantUsers.length,
      lastSync: latestEvent?.timestamp ?? tenant.updatedAt,
      configurationStatus: getConfigurationStatus(tenant),
      openAlerts:
        alertEvents.length + (tenant.status === 'ACTIVE' ? 0 : tenant.status === 'ONBOARDING' ? 1 : 2)
    };
  });
}

export function PlatformHealthPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (isMounted) {
        setError('');
      }

      try {
        const overview = await fetchAdminJsonCached<PlatformHealthOverviewPayload>(
          `${config.apiBaseUrl}/platform-admin/health/overview`,
          {
            cacheContext: { scope: 'platform' },
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000
          }
        );

        if (!isMounted) {
          return;
        }

        setHealth(overview.health);
        setTenants(overview.tenants);
        setUsers(overview.users);
        setEvents(overview.auditEvents.items);
        setLastUpdated(new Date().toISOString());
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load platform health overview.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();
    const intervalId = window.setInterval(() => {
      void loadOverview();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const tenantHealthRows = buildTenantHealthRows(tenants, users, events);
  const platformAlerts = buildPlatformAlerts(health, tenants, events);
  const connectivitySummary = Object.entries(health?.checks ?? {}).map(([key, check]) => ({
    key,
    status: check.status,
    latencyMs: check.latencyMs
  }));

  const kpis = [
    { label: 'Total Tenants', value: String(tenants.length) },
    {
      label: 'Healthy Tenants',
      value: String(tenantHealthRows.filter((tenant) => tenant.status === 'Healthy').length)
    },
    {
      label: 'Warning Tenants',
      value: String(tenantHealthRows.filter((tenant) => tenant.status === 'Warning').length)
    },
    {
      label: 'Critical Tenants',
      value: String(tenantHealthRows.filter((tenant) => tenant.status === 'Critical').length)
    },
    {
      label: 'Active Users',
      value: String(users.filter((user) => user.isActive).length)
    },
    {
      label: 'Failed Connections',
      value: String(
        connectivitySummary.filter((item) => item.status.toLowerCase() !== 'ok').length
      )
    }
  ];

  return (
    <AdminPageLayout
      eyebrow="Platform Dashboard"
      title="Platform Health"
      description="Operational health across all tenants."
      actions={
        <div className="rounded-full border border-admin-border bg-white px-4 py-3 text-sm text-admin-muted">
          {lastUpdated ? `Updated ${formatTimestamp(lastUpdated)}` : 'Loading live data...'}
        </div>
      }
    >

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <AdminStatCard key={kpi.label} label={kpi.label} value={isLoading ? '--' : kpi.value} />
        ))}
      </div>

      <SectionCard
        title="API / Connectivity"
        description="Visible status for shared services, major integrations, and API-dependent platform connectivity."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading API and connectivity status...</p>
        ) : connectivitySummary.length === 0 ? (
          <p className="text-sm text-admin-muted">No API or connectivity checks available.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  API Health
                </p>
                <div className="mt-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(health?.status ?? 'unknown')}`}>
                    {health?.status ?? 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  Connectivity Checks
                </p>
                <p className="mt-3 text-2xl font-semibold text-admin-text">{connectivitySummary.length}</p>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  Attention Needed
                </p>
                <p className="mt-3 text-2xl font-semibold text-admin-text">
                  {connectivitySummary.filter((item) => item.status.toLowerCase() !== 'ok').length}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {connectivitySummary.map((item) => (
                <article
                  key={item.key}
                  className="rounded-2xl border border-admin-border bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold capitalize text-admin-text">{item.key}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-admin-muted">
                    {typeof item.latencyMs === 'number' ? `${item.latencyMs} ms` : 'No latency recorded'}
                  </p>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/operations/connectivity"
                className="admin-button admin-button--primary"
              >
                Open connectivity workspace
              </Link>
              <Link
                href="/admin/developer/adapters"
                className="admin-button admin-button--secondary admin-button--content"
              >
                API / adapter status
              </Link>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title="Tenant health table"
          description="Current platform-wide tenant posture based on status, recent activity, and configuration signals."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading tenant health...</p>
          ) : tenantHealthRows.length === 0 ? (
            <p className="text-sm text-admin-muted">No tenant records available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                  <tr>
                    <th className="px-3 py-3">Tenant Name</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Active Users</th>
                    <th className="px-3 py-3">Last Sync</th>
                    <th className="px-3 py-3">Configuration Status</th>
                    <th className="px-3 py-3">Open Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantHealthRows.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-admin-border/70">
                      <td className="px-3 py-4 font-medium text-admin-text">
                        <Link
                          href={`/admin/tenants/${tenant.id}/organization`}
                          className="text-admin-text underline-offset-4 transition hover:text-admin-accent hover:underline"
                        >
                          {tenant.name}
                        </Link>
                      </td>
                      <td className="px-3 py-4">
                        <Link href={`/admin/tenants/${tenant.id}/organization`}>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              tenant.status === 'Healthy'
                                ? 'bg-emerald-100 text-emerald-700'
                                : tenant.status === 'Warning'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {tenant.status}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-admin-text">
                        <Link
                          href="/admin/shared/identity"
                          className="underline-offset-4 transition hover:text-admin-accent hover:underline"
                        >
                          {tenant.activeUsers}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-admin-muted">{formatTimestamp(tenant.lastSync)}</td>
                      <td className="px-3 py-4 text-admin-muted">
                        <Link
                          href="/admin/tenants/types"
                          className="underline-offset-4 transition hover:text-admin-accent hover:underline"
                        >
                          {tenant.configurationStatus}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-admin-text">
                        <Link
                          href={`/admin/governance/audit?tenantId=${tenant.id}`}
                          className="underline-offset-4 transition hover:text-admin-accent hover:underline"
                        >
                          {tenant.openAlerts}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Platform alerts"
            description="Recent health and operational alerts across shared services and tenants."
          >
            {isLoading ? (
              <p className="text-sm text-admin-muted">Loading alerts...</p>
            ) : platformAlerts.length === 0 ? (
              <p className="text-sm text-admin-muted">No active alerts detected.</p>
            ) : (
              <div className="space-y-3">
                {platformAlerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-2xl border border-admin-border bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-admin-text">{alert.title}</p>
                        <p className="mt-1 text-sm text-admin-muted">{alert.detail}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : alert.severity === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-admin-muted">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/admin/governance/audit"
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
                      >
                        View related logs
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Connectivity summary"
            description="Current status of major platform integrations and service checks."
          >
            {isLoading ? (
              <p className="text-sm text-admin-muted">Loading connectivity summary...</p>
            ) : connectivitySummary.length === 0 ? (
              <p className="text-sm text-admin-muted">No connectivity checks available.</p>
            ) : (
              <div className="space-y-3">
                {connectivitySummary.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold capitalize text-admin-text">
                        {item.key}
                      </p>
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          item.status.toLowerCase() === 'ok'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-admin-muted">
                      {typeof item.latencyMs === 'number'
                        ? `${item.latencyMs} ms`
                        : 'No latency recorded'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent administrative activity"
            description="Latest platform actions recorded in the administrative audit stream."
          >
            {isLoading ? (
              <p className="text-sm text-admin-muted">Loading recent activity...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-admin-muted">No recent administrative activity.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-admin-text">{event.eventType}</p>
                        <p className="mt-1 text-sm text-admin-muted">
                          {event.resourceType}
                          {event.resourceId ? ` • ${event.resourceId}` : ''}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-admin-muted">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-admin-muted">
                      Tenant: {event.tenantId} • User: {event.userId ?? 'System'}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminPageLayout>
  );
}
