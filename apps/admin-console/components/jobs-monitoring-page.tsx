'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiBaseUrl, getAdminAuthHeaders } from '../lib/api-auth';
import { useAdminSession } from './admin-session-provider';
import { AdminPageLayout, AdminStatCard } from './admin-ui';
import { SectionCard } from './section-card';

type Scope = 'platform' | 'tenant';

type JobRecord = {
  id: string;
  type: string;
  tenantId: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAt: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type TenantSettingsPayload = {
  tenant: {
    id: string;
    name: string;
  };
};

const statusOptions = ['ALL', 'PENDING', 'RUNNING', 'FAILED', 'SUCCEEDED'] as const;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function formatTypeLabel(value: string) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getStatusTone(status: string) {
  switch (status.toUpperCase()) {
    case 'SUCCEEDED':
      return 'bg-emerald-100 text-emerald-700';
    case 'RUNNING':
      return 'bg-sky-100 text-sky-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getJobWindowLabel(job: JobRecord) {
  if (job.status === 'RUNNING') {
    return `Started ${formatTimestamp(job.updatedAt)}`;
  }

  if (job.status === 'SUCCEEDED') {
    return `Completed ${formatTimestamp(job.updatedAt)}`;
  }

  return `Scheduled ${formatTimestamp(job.runAt)}`;
}

export function JobsMonitoringPage({
  scope,
  initialTenantId = 'ALL'
}: {
  scope: Scope;
  initialTenantId?: string;
}) {
  const { session } = useAdminSession();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantName, setTenantName] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState(
    scope === 'platform' && initialTenantId ? initialTenantId : 'ALL'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState('');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const availableTypes = useMemo(
    () =>
      Array.from(new Set(jobs.map((job) => job.type))).sort((left, right) =>
        left.localeCompare(right)
      ),
    [jobs]
  );

  const summary = useMemo(() => {
    const pending = jobs.filter((job) => job.status === 'PENDING').length;
    const running = jobs.filter((job) => job.status === 'RUNNING').length;
    const failed = jobs.filter((job) => job.status === 'FAILED').length;
    const succeeded = jobs.filter((job) => job.status === 'SUCCEEDED').length;

    return {
      total: jobs.length,
      active: pending + running,
      failed,
      succeeded
    };
  }, [jobs]);

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      try {
        if (scope === 'platform') {
          const response = await fetch(`${apiBaseUrl}/platform-admin/tenants`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          });

          if (!response.ok) {
            throw new Error('Unable to load tenant context for jobs.');
          }

          const tenantPayload = (await response.json()) as Tenant[];

          if (isMounted) {
            setTenants(tenantPayload);
          }

          return;
        }

        const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Unable to load tenant details for jobs.');
        }

        const settingsPayload = (await response.json()) as TenantSettingsPayload;

        if (isMounted) {
          setTenantName(settingsPayload.tenant.name);
        }
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load job context.'
        );
      }
    }

    void loadContext();

    return () => {
      isMounted = false;
    };
  }, [scope]);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      setIsLoading(true);

      try {
        const query = new URLSearchParams();

        if (statusFilter !== 'ALL') {
          query.set('status', statusFilter);
        }

        if (typeFilter) {
          query.set('type', typeFilter);
        }

        if (scope === 'platform' && tenantFilter !== 'ALL') {
          query.set('tenantId', tenantFilter);
        }

        const jobsPath =
          scope === 'platform'
            ? `${apiBaseUrl}/api/jobs`
            : `${apiBaseUrl}/api/tenant-admin/jobs`;
        const jobsResponse = await fetch(`${jobsPath}?${query.toString()}`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!jobsResponse.ok) {
          throw new Error(
            scope === 'platform'
              ? 'Unable to load platform job activity.'
              : 'Unable to load tenant job activity.'
          );
        }

        const jobsPayload = (await jobsResponse.json()) as JobRecord[];

        if (!isMounted) {
          return;
        }

        setJobs(jobsPayload);

        setError('');
        setLastUpdated(new Date().toISOString());
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setJobs([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load jobs.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, [reloadNonce, scope, statusFilter, tenantFilter, typeFilter]);

  async function retryJob(jobId: string) {
    setRetryingJobId(jobId);

    try {
      const response = await fetch(`${apiBaseUrl}/api/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Unable to retry job.');
      }

      const updatedJob = (await response.json()) as JobRecord;

      setJobs((currentJobs) =>
        currentJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
      );
      setError('');
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Unable to retry job.'
      );
    } finally {
      setRetryingJobId('');
    }
  }

  const tenantMap = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  );

  return (
    <AdminPageLayout
      eyebrow={scope === 'platform' ? 'Platform Operations' : 'Tenant Operations'}
      title={scope === 'platform' ? 'Job monitoring' : 'Job status'}
      description={
        scope === 'platform'
          ? 'Track queue health, identify failed jobs, and retry tenant work without leaving the operations workspace.'
          : `Review scheduled and recent background work for ${tenantName || 'your tenant'} in one place.`
      }
      actions={
        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            setReloadNonce((current) => current + 1);
          }}
          className="admin-button admin-button--secondary"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total jobs" value={String(summary.total)} detail="Current results for the selected filters." />
        <AdminStatCard label="Active work" value={String(summary.active)} detail="Pending and currently running jobs." />
        <AdminStatCard label="Failed jobs" value={String(summary.failed)} detail="Items that need operator attention or retry." />
        <AdminStatCard label="Succeeded" value={String(summary.succeeded)} detail="Jobs that completed successfully." />
      </div>

      <SectionCard
        title="Filters"
        description={
          lastUpdated
            ? `Last updated ${formatTimestamp(lastUpdated)}`
            : 'Refine the queue view by status, type, and tenant.'
        }
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm text-admin-muted">
            <span className="block font-medium text-admin-text">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof statusOptions)[number])
              }
              className="admin-input"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : formatTypeLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-admin-muted">
            <span className="block font-medium text-admin-text">Job type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="admin-input"
            >
              <option value="">All job types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {formatTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          {scope === 'platform' ? (
            <label className="space-y-2 text-sm text-admin-muted">
              <span className="block font-medium text-admin-text">Tenant</span>
              <select
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
                className="admin-input"
              >
                <option value="ALL">All tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="space-y-2 text-sm text-admin-muted">
              <span className="block font-medium text-admin-text">Tenant scope</span>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm text-admin-text">
                {tenantName || session?.tenantId || 'Current tenant'}
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-admin-muted">
            <span className="block font-medium text-admin-text">Retry controls</span>
            <p className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm text-admin-text">
              {scope === 'platform'
                ? 'Platform admins can retry failed jobs directly from the table.'
                : 'Tenant admins can review failures here and escalate retries to platform operations.'}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Queue activity"
        description="Recent background processing across the selected scope."
      >
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-admin-muted">
            No jobs matched the current filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-admin-border text-left text-sm">
              <thead className="text-admin-muted">
                <tr>
                  <th className="px-3 py-3 font-medium">Job</th>
                  <th className="px-3 py-3 font-medium">Scope</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Attempts</th>
                  <th className="px-3 py-3 font-medium">Schedule</th>
                  <th className="px-3 py-3 font-medium">Last error</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {jobs.map((job) => (
                  <tr key={job.id} className="align-top">
                    <td className="px-3 py-4">
                      <div className="font-medium text-admin-text">
                        {formatTypeLabel(job.type)}
                      </div>
                      <div className="mt-1 text-xs text-admin-muted">{job.id}</div>
                    </td>
                    <td className="px-3 py-4 text-admin-text">
                      {job.tenantId
                        ? scope === 'platform'
                          ? tenantMap.get(job.tenantId) ?? job.tenantId
                          : tenantName || 'Current tenant'
                        : 'Platform'}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusTone(job.status)}`}
                      >
                        {formatTypeLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-admin-text">
                      {job.attempts} / {job.maxAttempts}
                    </td>
                    <td className="px-3 py-4 text-admin-text">
                      <div>{getJobWindowLabel(job)}</div>
                      <div className="mt-1 text-xs text-admin-muted">
                        Created {formatTimestamp(job.createdAt)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-admin-muted">
                      {job.lastError ? (
                        <span title={job.lastError}>
                          {job.lastError.length > 120
                            ? `${job.lastError.slice(0, 120)}...`
                            : job.lastError}
                        </span>
                      ) : (
                        'No errors recorded'
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {scope === 'platform' && job.status === 'FAILED' ? (
                        <button
                          type="button"
                          onClick={() => void retryJob(job.id)}
                          disabled={retryingJobId === job.id}
                          className="admin-button admin-button--secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {retryingJobId === job.id ? 'Retrying...' : 'Retry job'}
                        </button>
                      ) : (
                        <span className="text-xs text-admin-muted">
                          {job.status === 'FAILED' ? 'View only' : 'No action'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AdminPageLayout>
  );
}
