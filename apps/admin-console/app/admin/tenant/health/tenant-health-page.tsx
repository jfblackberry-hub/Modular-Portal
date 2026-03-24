'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminPageLayout, AdminStatCard } from '../../../../components/admin-ui';
import { SectionCard } from '../../../../components/section-card';
import { fetchAdminJsonCached } from '../../../../lib/admin-client-data';
import { config, getAdminAuthHeaders } from '../../../../lib/api-auth';

type Branding = {
  tenantId: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

type NotificationSettings = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  digestEnabled: boolean;
  replyToEmail: string | null;
  senderName: string | null;
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
  branding: Branding;
  notificationSettings: NotificationSettings;
  integrations: Connector[];
  webhooks: Connector[];
  roles: Array<{ id: string; code: string; name: string }>;
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

type ChecklistItem = {
  label: string;
  complete: boolean;
  detail: string;
};

type CatalogMetadata = {
  entryKey: string;
  label: string;
  vendor: string;
  category: string;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'No activity recorded';
  }

  return new Date(value).toLocaleString();
}

function getConnectionStatus(connectors: Connector[]) {
  if (connectors.length === 0) {
    return 'Not configured';
  }

  const inactiveConnectors = connectors.filter(
    (connector) => connector.status.toUpperCase() !== 'ACTIVE'
  );

  if (inactiveConnectors.length === 0) {
    return 'Healthy';
  }

  if (inactiveConnectors.length < connectors.length) {
    return 'Warning';
  }

  return 'Critical';
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('healthy') || normalized.includes('active')) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized.includes('warning')) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function getCatalogMetadata(config: Record<string, unknown>) {
  const catalogCandidate = config.catalog;
  if (
    typeof catalogCandidate !== 'object' ||
    catalogCandidate === null ||
    Array.isArray(catalogCandidate)
  ) {
    return null;
  }

  const catalog = catalogCandidate as Record<string, unknown>;
  const entryKey = typeof catalog.entryKey === 'string' ? catalog.entryKey.trim() : '';
  if (!entryKey) {
    return null;
  }

  return {
    entryKey,
    label: typeof catalog.label === 'string' ? catalog.label : entryKey,
    vendor: typeof catalog.vendor === 'string' ? catalog.vendor : 'Unknown',
    category: typeof catalog.category === 'string' ? catalog.category : 'Unclassified'
  } satisfies CatalogMetadata;
}

function buildChecklist(settings: SettingsPayload): ChecklistItem[] {
  const hasDisplayName = Boolean(settings.branding.displayName?.trim());
  const hasBrandColors =
    Boolean(settings.branding.primaryColor?.trim()) &&
    Boolean(settings.branding.secondaryColor?.trim());
  const notificationsConfigured =
    settings.notificationSettings.emailEnabled ||
    settings.notificationSettings.inAppEnabled ||
    settings.notificationSettings.digestEnabled;
  const replyToConfigured = Boolean(settings.notificationSettings.replyToEmail?.trim());
  const hasConnections = settings.integrations.length > 0;
  const hasActiveUsers = settings.users.some((user) => user.isActive);

  return [
    {
      label: 'Brand display name',
      complete: hasDisplayName,
      detail: hasDisplayName ? settings.branding.displayName : 'Set a tenant-facing display name.'
    },
    {
      label: 'Brand theme colors',
      complete: hasBrandColors,
      detail: hasBrandColors ? 'Primary and secondary colors are configured.' : 'Complete brand color setup.'
    },
    {
      label: 'Notification channels',
      complete: notificationsConfigured,
      detail: notificationsConfigured ? 'At least one notification channel is enabled.' : 'Enable email, in-app, or digest notifications.'
    },
    {
      label: 'Reply-to routing',
      complete: replyToConfigured,
      detail: replyToConfigured ? settings.notificationSettings.replyToEmail ?? '' : 'Add a reply-to address for tenant notifications.'
    },
    {
      label: 'Connectivity setup',
      complete: hasConnections,
      detail: hasConnections ? `${settings.integrations.length} integration(s) configured.` : 'Add at least one tenant connection.'
    },
    {
      label: 'Active tenant users',
      complete: hasActiveUsers,
      detail: hasActiveUsers ? `${settings.users.filter((user) => user.isActive).length} active user(s).` : 'Invite or activate tenant users.'
    }
  ];
}

function buildAlerts(settings: SettingsPayload, auditEvents: AuditEvent[]) {
  const alerts: string[] = [];

  if (settings.tenant.status !== 'ACTIVE') {
    alerts.push(
      settings.tenant.status === 'ONBOARDING'
        ? 'Tenant setup is still in onboarding.'
        : 'Tenant is inactive and requires attention.'
    );
  }

  if (settings.integrations.some((connector) => connector.status.toUpperCase() !== 'ACTIVE')) {
    alerts.push('One or more tenant connections are not active.');
  }

  const checklist = buildChecklist(settings);
  if (checklist.some((item) => !item.complete)) {
    alerts.push('Configuration checklist is incomplete.');
  }

  if (
    auditEvents.some((event) =>
      ['fail', 'error', 'denied', 'timeout', 'warning'].some((keyword) =>
        event.eventType.toLowerCase().includes(keyword)
      )
    )
  ) {
    alerts.push('Recent activity includes warning or failure signals.');
  }

  return alerts;
}

export function TenantHealthPage() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTenantHealth() {
      try {
        const [settingsPayload, auditPayload] = await Promise.all([
          fetchAdminJsonCached<SettingsPayload>(`${config.apiBaseUrl}/api/tenant-admin/settings`, {
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000
          }),
          fetchAdminJsonCached<AuditResponse>(`${config.apiBaseUrl}/audit/events?page_size=8`, {
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000
          })
        ]);

        if (!isMounted) {
          return;
        }

        setSettings(settingsPayload);
        setEvents(auditPayload.items);
        setError('');
        setLastUpdated(new Date().toISOString());
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load tenant health overview.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTenantHealth();
    const intervalId = window.setInterval(() => {
      void loadTenantHealth();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const checklist = settings ? buildChecklist(settings) : [];
  const alerts = settings ? buildAlerts(settings, events) : [];
  const activeUsers = settings?.users.filter((user) => user.isActive).length ?? 0;
  const connectionStatus = settings ? getConnectionStatus(settings.integrations) : '--';
  const appliedApis = settings
    ? settings.integrations
        .map((connector) => ({
          connector,
          catalog: getCatalogMetadata(connector.config)
        }))
        .filter(
          (
            item
          ): item is {
            connector: Connector;
            catalog: CatalogMetadata;
          } => Boolean(item.catalog)
        )
    : [];
  const configurationCompleteness = checklist.length
    ? `${Math.round((checklist.filter((item) => item.complete).length / checklist.length) * 100)}%`
    : '--';
  const summaryItems = settings
    ? [
        {
          label: 'Payer',
          value: settings.branding.displayName || settings.tenant.name
        },
        {
          label: 'Employer Group',
          value: settings.tenant.name
        },
        { label: 'Status', value: settings.tenant.status },
        { label: 'Scope Key', value: settings.tenant.slug },
        { label: 'Integrations', value: String(settings.integrations.length) }
      ]
    : [];

  return (
    <AdminPageLayout
      eyebrow="Tenant Dashboard"
      title="Tenant Health"
      description="Tenant readiness, connectivity posture, and active configuration quality."
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Users', value: isLoading ? '--' : String(activeUsers) },
          { label: 'Connection Status', value: connectionStatus },
          { label: 'Configuration Completeness', value: configurationCompleteness },
          { label: 'Open Alerts', value: isLoading ? '--' : String(alerts.length) }
        ].map((kpi) => (
          <AdminStatCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <SectionCard
        title="API / Connectivity"
        description="Visible status for tenant integrations, webhooks, and API-dependent connectivity from the health landing page."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading API and connectivity status...</p>
        ) : !settings ? (
          <p className="text-sm text-admin-muted">No API or connectivity details available.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  Overall Status
                </p>
                <div className="mt-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(connectionStatus)}`}>
                    {connectionStatus}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  Active Integrations
                </p>
                <p className="mt-3 text-2xl font-semibold text-admin-text">
                  {settings.integrations.filter((connector) => connector.status.toUpperCase() === 'ACTIVE').length}
                </p>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                  Catalog APIs
                </p>
                <p className="mt-3 text-2xl font-semibold text-admin-text">
                  {appliedApis.length}
                </p>
              </div>
            </div>

            {appliedApis.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-admin-text">Applied API templates</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-admin-muted">
                    Shared catalog deployments
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {appliedApis.slice(0, 6).map(({ connector, catalog }) => (
                    <article
                      key={connector.id}
                      className="rounded-2xl border border-admin-border bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-admin-text">{catalog.label}</p>
                          <p className="mt-1 text-sm text-admin-muted">
                            {catalog.vendor} · {catalog.category}
                          </p>
                          <p className="mt-2 text-sm text-admin-muted">{connector.name}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(connector.status)}`}
                        >
                          {connector.status}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-admin-muted md:grid-cols-2">
                        <p>Last sync: {formatTimestamp(connector.lastSyncAt)}</p>
                        <p>Health check: {formatTimestamp(connector.lastHealthCheckAt)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              {(settings.integrations.length > 0 ? settings.integrations.slice(0, 4) : settings.webhooks.slice(0, 4)).map((connector) => (
                <article
                  key={connector.id}
                  className="rounded-2xl border border-admin-border bg-white px-4 py-4"
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
                    <p>Health check: {formatTimestamp(connector.lastHealthCheckAt)}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/tenant/connectivity"
                className="admin-button admin-button--primary"
              >
                Open connectivity workspace
              </Link>
              <Link
                href="/admin/tenant/connectivity/sso"
                className="admin-button admin-button--secondary"
              >
                Review SSO
              </Link>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Tenant summary"
          description="Core tenant identity and operational snapshot."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading tenant summary...</p>
          ) : !settings ? (
            <p className="text-sm text-admin-muted">No tenant summary available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base font-semibold text-admin-text">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Tenant connectivity status"
          description="Current tenant integration and webhook posture."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading connectivity status...</p>
          ) : !settings ? (
            <p className="text-sm text-admin-muted">No connectivity details available.</p>
          ) : settings.integrations.length === 0 ? (
            <p className="text-sm text-admin-muted">No tenant connections configured yet.</p>
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
                      <p className="mt-1 text-sm text-admin-muted">
                        {connector.adapterKey}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        connector.status.toUpperCase() === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {connector.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-admin-muted md:grid-cols-2">
                    <p>Last sync: {formatTimestamp(connector.lastSyncAt)}</p>
                    <p>Health check: {formatTimestamp(connector.lastHealthCheckAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent user activity"
          description="Latest tenant-scoped administrative and user-related events."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading recent activity...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-admin-muted">No recent user activity available.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
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
                    User: {event.userId ?? 'System'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Configuration checklist"
          description="Core tenant setup items that affect readiness and health."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading configuration checklist...</p>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-admin-muted">No checklist data available.</p>
          ) : (
            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-admin-text">{item.label}</p>
                      <p className="mt-1 text-sm text-admin-muted">{item.detail}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        item.complete
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.complete ? 'Complete' : 'Needs work'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AdminPageLayout>
  );
}
