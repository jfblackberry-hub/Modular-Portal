'use client';

import { useEffect, useMemo, useState } from 'react';

import { SectionCard } from './section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../lib/api-auth';

type Scope = 'platform' | 'tenant';

type AuditEvent = {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  metadata?: unknown;
  timestamp: string;
};

type AuditResponse = {
  items: AuditEvent[];
};

type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenant: {
    id: string;
    name: string;
  };
};

type PlatformTenant = {
  id: string;
  name: string;
};

type TenantSettingsPayload = {
  tenant: {
    id: string;
    name: string;
  };
  users: UserRecord[];
};

type PlatformAuditRow = {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  tenantId: string;
  tenant: string;
  action: string;
  resourceType: string;
  resourceId: string;
  target: string;
  result: string;
};

function toResult(eventType: string) {
  const normalized = eventType.toLowerCase();

  if (normalized.includes('success') || normalized.includes('succeeded')) {
    return 'Success';
  }

  if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('denied')) {
    return 'Failure';
  }

  if (normalized.includes('warning') || normalized.includes('degraded')) {
    return 'Warning';
  }

  return 'Completed';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getResultTone(result: string) {
  switch (result) {
    case 'Success':
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Warning':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-rose-100 text-rose-700';
  }
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function AuditLogPage({
  scope,
  initialTenantId = 'ALL',
  initialEventType = '',
  initialResourceType = '',
  initialResourceId = ''
}: {
  scope: Scope;
  initialTenantId?: string;
  initialEventType?: string;
  initialResourceType?: string;
  initialResourceId?: string;
}) {
  const [rows, setRows] = useState<PlatformAuditRow[]>([]);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [actorQuery, setActorQuery] = useState('');
  const [eventTypeQuery, setEventTypeQuery] = useState(initialEventType);
  const [resourceTypeQuery, setResourceTypeQuery] = useState(initialResourceType);
  const [resourceIdQuery, setResourceIdQuery] = useState(initialResourceId);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tenantFilter, setTenantFilter] = useState(
    scope === 'platform' && initialTenantId ? initialTenantId : 'ALL'
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditLog() {
      setIsLoading(true);

      try {
        if (scope === 'platform') {
          const usersResponse = await fetch(`${apiBaseUrl}/platform-admin/users`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          });
          const tenantsResponse = await fetch(`${apiBaseUrl}/platform-admin/tenants`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          });

          if (!usersResponse.ok || !tenantsResponse.ok) {
            throw new Error('Unable to load audit context.');
          }

          const [usersPayload, tenantsPayload] = (await Promise.all([
            usersResponse.json(),
            tenantsResponse.json()
          ])) as [UserRecord[], PlatformTenant[]];
          setTenants(tenantsPayload);

          const query = new URLSearchParams({
            page_size: '100'
          });
          if (tenantFilter !== 'ALL') {
            query.set('tenant_id', tenantFilter);
          }

          if (dateFrom) {
            query.set('date_from', new Date(`${dateFrom}T00:00:00.000Z`).toISOString());
          }

          if (dateTo) {
            query.set('date_to', new Date(`${dateTo}T23:59:59.999Z`).toISOString());
          }

          const auditResponse = await fetch(
            `${apiBaseUrl}/platform-admin/audit/events?${query.toString()}`,
            {
              cache: 'no-store',
              headers: getAdminAuthHeaders()
            }
          );

          if (!auditResponse.ok) {
            throw new Error('Unable to load platform audit log.');
          }

          const auditPayload = (await auditResponse.json()) as AuditResponse;

          const userMap = new Map(
            usersPayload.map((user) => [
              user.id,
              {
                actor: `${user.firstName} ${user.lastName}`,
                role: user.roles[0] ?? 'Unassigned'
              }
            ])
          );
          const tenantMap = new Map(tenantsPayload.map((tenant) => [tenant.id, tenant.name]));

          const nextRows = auditPayload.items.map((item) => {
            const actor = item.userId ? userMap.get(item.userId)?.actor ?? item.userId : 'System';
            const role = item.userId ? userMap.get(item.userId)?.role ?? 'Unknown' : 'System';

            return {
              id: item.id,
              timestamp: item.timestamp,
              actor,
              role,
              tenantId: item.tenantId,
              tenant: tenantMap.get(item.tenantId) ?? item.tenantId,
              action: item.eventType,
              resourceType: item.resourceType,
              resourceId: item.resourceId ?? '',
              target: `${item.resourceType}${item.resourceId ? ` • ${item.resourceId}` : ''}`,
              result: toResult(item.eventType)
            };
          });

          if (!isMounted) {
            return;
          }

          setRows(nextRows);
        } else {
          const settingsResponse = await fetch(`${apiBaseUrl}/api/tenant-admin/settings`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          });

          if (!settingsResponse.ok) {
            throw new Error('Unable to load tenant audit context.');
          }

          const settingsPayload = (await settingsResponse.json()) as TenantSettingsPayload;
          const query = new URLSearchParams({
            page_size: '100'
          });

          if (dateFrom) {
            query.set('date_from', new Date(`${dateFrom}T00:00:00.000Z`).toISOString());
          }

          if (dateTo) {
            query.set('date_to', new Date(`${dateTo}T23:59:59.999Z`).toISOString());
          }

          const auditResponse = await fetch(`${apiBaseUrl}/audit/events?${query.toString()}`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          });

          if (!auditResponse.ok) {
            throw new Error('Unable to load tenant audit log.');
          }

          const auditPayload = (await auditResponse.json()) as AuditResponse;
          const userMap = new Map(
            settingsPayload.users.map((user) => [
              user.id,
              {
                actor: `${user.firstName} ${user.lastName}`,
                role: user.roles[0] ?? 'Unassigned'
              }
            ])
          );

          const nextRows = auditPayload.items.map((item) => ({
            id: item.id,
            timestamp: item.timestamp,
            actor: item.userId ? userMap.get(item.userId)?.actor ?? item.userId : 'System',
            role: item.userId ? userMap.get(item.userId)?.role ?? 'Unknown' : 'System',
            tenantId: item.tenantId,
            tenant: settingsPayload.tenant.name,
            action: item.eventType,
            resourceType: item.resourceType,
            resourceId: item.resourceId ?? '',
            target: `${item.resourceType}${item.resourceId ? ` • ${item.resourceId}` : ''}`,
            result: toResult(item.eventType)
          }));

          if (!isMounted) {
            return;
          }

          setRows(nextRows);
        }

        setError('');
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setRows([]);
        setError(nextError instanceof Error ? nextError.message : 'Unable to load audit log.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLog();

    return () => {
      isMounted = false;
    };
  }, [scope, dateFrom, dateTo, tenantFilter]);

  const filteredRows = useMemo(() => {
    const actor = actorQuery.trim().toLowerCase();
    const eventType = eventTypeQuery.trim().toLowerCase();
    const resourceType = resourceTypeQuery.trim().toLowerCase();
    const resourceId = resourceIdQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesActor =
        !actor ||
        row.actor.toLowerCase().includes(actor) ||
        row.role.toLowerCase().includes(actor);
      const matchesEventType = !eventType || row.action.toLowerCase().includes(eventType);
      const matchesResourceType = !resourceType || row.resourceType.toLowerCase().includes(resourceType);
      const matchesResourceId = !resourceId || row.resourceId.toLowerCase().includes(resourceId);

      return matchesActor && matchesEventType && matchesResourceType && matchesResourceId;
    });
  }, [actorQuery, eventTypeQuery, resourceTypeQuery, resourceIdQuery, rows]);

  function handleExport() {
    const csvLines = [
      ['Timestamp', 'Actor', 'Role', 'Tenant', 'Action', 'Target', 'Result']
        .map(csvEscape)
        .join(','),
      ...filteredRows.map((row) =>
        [
          row.timestamp,
          row.actor,
          row.role,
          row.tenant,
          row.action,
          row.target,
          row.result
        ]
          .map(csvEscape)
          .join(',')
      )
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${scope}-audit-log.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            {scope === 'platform' ? 'Platform' : 'Tenant'}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Audit Log
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Review administrative activity with filtering, date search, and CSV export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
        >
          Export
        </button>
      </div>

      <SectionCard
        title="Filters"
        description="Search by actor, event/resource context, and time window."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-admin-text">Actor search</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={actorQuery}
              onChange={(event) => setActorQuery(event.target.value)}
              placeholder="Search actor or role"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Event type</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={eventTypeQuery}
              onChange={(event) => setEventTypeQuery(event.target.value)}
              placeholder="authorization.updated"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Resource type</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={resourceTypeQuery}
              onChange={(event) => setResourceTypeQuery(event.target.value)}
              placeholder="claim"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Resource id</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={resourceIdQuery}
              onChange={(event) => setResourceIdQuery(event.target.value)}
              placeholder="CLM-100245"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Date from</span>
            <input
              type="date"
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Date to</span>
            <input
              type="date"
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          {scope === 'platform' ? (
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Tenant</span>
              <select
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
              >
                <option value="ALL">All tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </SectionCard>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="Audit events"
        description="Event history across the selected administrative scope."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading audit log...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-admin-muted">No audit events match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                <tr>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Actor</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Tenant</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-admin-border/70">
                    <td className="px-3 py-4 text-admin-muted">{formatDate(row.timestamp)}</td>
                    <td className="px-3 py-4 font-medium text-admin-text">{row.actor}</td>
                    <td className="px-3 py-4 text-admin-text">{row.role}</td>
                    <td className="px-3 py-4 text-admin-text">{row.tenant}</td>
                    <td className="px-3 py-4 text-admin-text">{row.action}</td>
                    <td className="px-3 py-4 text-admin-muted">{row.target}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getResultTone(row.result)}`}>
                        {row.result}
                      </span>
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
