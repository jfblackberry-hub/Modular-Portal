'use client';

import { useEffect, useState } from 'react';

import { SectionCard } from './section-card';
import { fetchAdminJsonCached } from '../lib/admin-client-data';
import { apiBaseUrl, getAdminAuthHeaders } from '../lib/api-auth';

type Scope = 'platform' | 'tenant';

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

type HealthPayload = {
  status: string;
  timestamp: string;
  checks: Record<
    string,
    {
      status: 'fail' | 'not_configured' | 'pass';
      latencyMs?: number;
      error?: string;
      details?: Record<string, unknown>;
    }
  >;
};

type TenantSettingsPayload = {
  tenant: {
    id: string;
    name: string;
  };
  integrations: Connector[];
  webhooks: Connector[];
};

type AuditEvent = {
  id: string;
  tenantId: string;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: string;
};

type AuditResponse = {
  items: AuditEvent[];
};

type ConnectivityRow = {
  connection: string;
  scope: string;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Not Configured';
  lastSuccess: string | null;
  lastFailure: string | null;
  errorCount: number;
};

const failureKeywords = ['fail', 'error', 'timeout', 'denied'];

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'None recorded';
}

function getConnectionFamily(connector: Connector) {
  const name = `${connector.adapterKey} ${connector.name}`.toLowerCase();

  if (
    name.includes('local-file') ||
    name.includes('edi') ||
    name.includes('eligibility') ||
    name.includes('claims')
  ) {
    return 'EDI';
  }

  if (name.includes('rest-api') || name.includes('api')) {
    return 'External Vendor APIs';
  }

  if (name.includes('webhook')) {
    return 'Event Bus';
  }

  return 'External Vendor APIs';
}

function toStatusLabel(status: string): ConnectivityRow['status'] {
  const normalized = status.toLowerCase();

  if (normalized === 'active' || normalized === 'pass' || normalized === 'ok') {
    return 'Healthy';
  }

  if (normalized === 'not_configured') {
    return 'Not Configured';
  }

  if (normalized === 'disabled' || normalized === 'warning' || normalized === 'degraded') {
    return 'Warning';
  }

  return 'Critical';
}

function getWorstStatus(statuses: ConnectivityRow['status'][]): ConnectivityRow['status'] {
  if (statuses.includes('Critical')) {
    return 'Critical';
  }

  if (statuses.includes('Warning')) {
    return 'Warning';
  }

  if (statuses.includes('Healthy')) {
    return 'Healthy';
  }

  return 'Not Configured';
}

function getStatusTone(status: ConnectivityRow['status']) {
  switch (status) {
    case 'Healthy':
      return 'bg-emerald-100 text-emerald-700';
    case 'Warning':
      return 'bg-amber-100 text-amber-700';
    case 'Critical':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getLatest(values: Array<string | null | undefined>) {
  const filtered = values.filter((value): value is string => Boolean(value));

  if (filtered.length === 0) {
    return null;
  }

  return [...filtered].sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime()
  )[0];
}

function getFailureSignals(events: AuditEvent[], matcher: (event: AuditEvent) => boolean) {
  const matchingEvents = events.filter(matcher);
  const failures = matchingEvents.filter((event) =>
    failureKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
  );

  return {
    lastFailure: failures[0]?.timestamp ?? null,
    errorCount: failures.length
  };
}

function buildTenantRows(
  tenantName: string,
  health: HealthPayload | null,
  connectors: Connector[],
  auditEvents: AuditEvent[]
): ConnectivityRow[] {
  const families = ['EDI', 'API Gateway', 'Event Bus', 'External Vendor APIs'] as const;

  return families.map((family) => {
    let familyConnectors =
      family === 'API Gateway'
        ? connectors.filter((connector) => connector.adapterKey.toLowerCase().includes('rest-api'))
        : connectors.filter((connector) => getConnectionFamily(connector) === family);

    if (family === 'API Gateway' && familyConnectors.length === 0) {
      familyConnectors = connectors.filter((connector) => getConnectionFamily(connector) === 'External Vendor APIs');
    }

    const { lastFailure, errorCount } = getFailureSignals(
      auditEvents,
      (event) =>
        event.resourceType.toLowerCase() === 'connector' &&
        familyConnectors.some((connector) => connector.id === event.resourceId)
    );

    const baseStatus = familyConnectors.length
      ? getWorstStatus(familyConnectors.map((connector) => toStatusLabel(connector.status)))
      : 'Not Configured';

    if (family === 'API Gateway') {
      const apiStatus = health ? toStatusLabel(health.status === 'ok' ? 'ok' : 'degraded') : 'Not Configured';
      return {
        connection: family,
        scope: tenantName,
        status: getWorstStatus([baseStatus, apiStatus]),
        lastSuccess:
          getLatest(familyConnectors.map((connector) => connector.lastSyncAt ?? connector.lastHealthCheckAt)) ??
          (health?.status === 'ok' ? health.timestamp : null),
        lastFailure: lastFailure ?? (health?.status !== 'ok' ? health?.timestamp ?? null : null),
        errorCount: errorCount + (health?.status !== 'ok' ? 1 : 0)
      };
    }

    if (family === 'Event Bus') {
      const redisStatus = health?.checks.redis ? toStatusLabel(health.checks.redis.status) : 'Not Configured';
      return {
        connection: family,
        scope: tenantName,
        status: getWorstStatus([baseStatus, redisStatus]),
        lastSuccess:
          getLatest(familyConnectors.map((connector) => connector.lastSyncAt ?? connector.lastHealthCheckAt)) ??
          (health?.checks.redis?.status === 'pass' ? health.timestamp : null),
        lastFailure:
          lastFailure ?? (health?.checks.redis?.status === 'fail' ? health?.timestamp ?? null : null),
        errorCount: errorCount + (health?.checks.redis?.status === 'fail' ? 1 : 0)
      };
    }

    return {
      connection: family,
      scope: tenantName,
      status: baseStatus,
      lastSuccess: getLatest(
        familyConnectors.map((connector) => connector.lastSyncAt ?? connector.lastHealthCheckAt)
      ),
      lastFailure,
      errorCount
    };
  });
}

export function ConnectivityStatusPage({ scope }: { scope: Scope }) {
  const [rows, setRows] = useState<ConnectivityRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRows() {
      try {
        if (scope === 'platform') {
          const payload = await fetchAdminJsonCached<{
            health: HealthPayload;
            rows: ConnectivityRow[];
          }>(
            `${apiBaseUrl}/platform-admin/connectivity/status`,
            {
              headers: getAdminAuthHeaders(),
              ttlMs: 20_000
            }
          );

          if (!isMounted) {
            return;
          }

          setRows(payload.rows);
        } else {
          const health = await fetchAdminJsonCached<HealthPayload>(`${apiBaseUrl}/health`, {
            ttlMs: 20_000
          });
          const [settingsPayload, auditPayload] = await Promise.all([
            fetchAdminJsonCached<TenantSettingsPayload>(`${apiBaseUrl}/api/tenant-admin/settings`, {
              headers: getAdminAuthHeaders(),
              ttlMs: 20_000
            }),
            fetchAdminJsonCached<AuditResponse>(`${apiBaseUrl}/audit/events?page_size=25`, {
              headers: getAdminAuthHeaders(),
              ttlMs: 20_000
            })
          ]);

          if (!isMounted) {
            return;
          }

          setRows(
            buildTenantRows(
              settingsPayload.tenant.name,
              health,
              settingsPayload.integrations,
              auditPayload.items
            )
          );
        }

        setError('');
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setRows([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load connectivity status.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      isMounted = false;
    };
  }, [scope]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          {scope === 'platform' ? 'Platform' : 'Tenant'}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Connectivity Status
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          Visibility into system integrations, sync health, and connectivity failures.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="Integration status"
        description="Connection posture across core integration families and supporting platform services."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading connectivity status...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-admin-muted">No connectivity data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                <tr>
                  <th className="px-3 py-3">Connection</th>
                  <th className="px-3 py-3">Scope</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last Success</th>
                  <th className="px-3 py-3">Last Failure</th>
                  <th className="px-3 py-3">Error Count</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.connection}-${row.scope}`} className="border-b border-admin-border/70">
                    <td className="px-3 py-4 font-medium text-admin-text">{row.connection}</td>
                    <td className="px-3 py-4 text-admin-text">{row.scope}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-admin-muted">{formatTimestamp(row.lastSuccess)}</td>
                    <td className="px-3 py-4 text-admin-muted">{formatTimestamp(row.lastFailure)}</td>
                    <td className="px-3 py-4 text-admin-text">{row.errorCount}</td>
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
