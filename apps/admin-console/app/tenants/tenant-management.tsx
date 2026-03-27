'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { config, getAdminAuthHeaders } from '../../lib/api-auth';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type:
    | 'PAYER'
    | 'CLINIC'
    | 'PHYSICIAN_GROUP'
    | 'HOSPITAL';
  healthStatus: 'HEALTHY' | 'PROVISIONING' | 'SUSPENDED';
  brandingConfig: Record<string, unknown>;
  quotaMembers: number | null;
  quotaStorageGb: number | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt: string;
};

type TenantDetailForm = {
  status: Tenant['status'];
  quotaMembers: string;
  quotaStorageGb: string;
};

type LogoUploadState = {
  [tenantId: string]: File | null;
};

const emptyTenantDetailForm: TenantDetailForm = {
  status: 'ONBOARDING',
  quotaMembers: '',
  quotaStorageGb: ''
};

function getHealthTone(healthStatus: Tenant['healthStatus']) {
  switch (healthStatus) {
    case 'HEALTHY':
      return {
        dot: 'bg-emerald-500',
        badge: 'admin-badge admin-badge--success'
      };
    case 'PROVISIONING':
      return {
        dot: 'bg-amber-500',
        badge: 'admin-badge admin-badge--warning'
      };
    default:
      return {
        dot: 'bg-rose-500',
        badge: 'admin-badge admin-badge--danger'
      };
  }
}

function getStatusTone(status: Tenant['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'admin-badge admin-badge--info';
    case 'ONBOARDING':
      return 'admin-badge admin-badge--warning';
    default:
      return 'admin-badge admin-badge--neutral';
  }
}

function buildTenantDetailForm(tenant: Tenant): TenantDetailForm {
  return {
    status: tenant.status,
    quotaMembers:
      typeof tenant.quotaMembers === 'number' ? String(tenant.quotaMembers) : '',
    quotaStorageGb:
      typeof tenant.quotaStorageGb === 'number' ? String(tenant.quotaStorageGb) : ''
  };
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [tenantDetailForm, setTenantDetailForm] =
    useState<TenantDetailForm>(emptyTenantDetailForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [isArchivingTenant, setIsArchivingTenant] = useState(false);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [uploadingTenantId, setUploadingTenantId] = useState('');
  const [logoFiles, setLogoFiles] = useState<LogoUploadState>({});

  const selectedTenant =
    tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const healthyCount = tenants.filter(
    (tenant) => tenant.healthStatus === 'HEALTHY'
  ).length;
  const provisioningCount = tenants.filter(
    (tenant) => tenant.healthStatus === 'PROVISIONING'
  ).length;
  const suspendedCount = tenants.filter(
    (tenant) => tenant.healthStatus === 'SUSPENDED'
  ).length;

  const loadTenants = useCallback(async function loadTenants(preferredTenantId?: string) {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants`, {
        cache: 'no-store',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to load tenants.');
        setTenants([]);
        return;
      }

      const payload = (await response.json()) as Tenant[];
      setTenants(payload);

      const nextSelectedTenant =
        payload.find((tenant) => tenant.id === preferredTenantId) ??
        payload.find((tenant) => tenant.id === selectedTenantId) ??
        null;

      if (nextSelectedTenant) {
        setSelectedTenantId(nextSelectedTenant.id);
        setTenantDetailForm(buildTenantDetailForm(nextSelectedTenant));
      } else {
        setSelectedTenantId('');
        setTenantDetailForm(emptyTenantDetailForm);
      }
    } catch {
      setError('API unavailable. Start the local API and try again.');
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  function handleTenantSelect(tenant: Tenant) {
    setSelectedTenantId(tenant.id);
    setTenantDetailForm(buildTenantDetailForm(tenant));
    setError('');
    setSuccess('');
  }

  async function handleSaveTenantDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenant) {
      setError('Select a tenant before saving details.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSavingTenant(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${selectedTenant.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            status: tenantDetailForm.status,
            quotaMembers: tenantDetailForm.quotaMembers
              ? Number.parseInt(tenantDetailForm.quotaMembers, 10)
              : null,
            quotaStorageGb: tenantDetailForm.quotaStorageGb
              ? Number.parseInt(tenantDetailForm.quotaStorageGb, 10)
              : null
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to save tenant details.');
        return;
      }

      setSuccess('Tenant details saved.');
      await loadTenants(selectedTenant.id);
    } catch {
      setError('Unable to save tenant details.');
    } finally {
      setIsSavingTenant(false);
    }
  }

  async function handleLogoUpload(tenantId: string) {
    const file = logoFiles[tenantId];

    if (!file) {
      setError('Select a logo file before uploading.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingTenantId(tenantId);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/logo`,
        {
          method: 'POST',
          headers: getAdminAuthHeaders(),
          body: formData
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to upload tenant logo.');
        return;
      }

      setLogoFiles((current) => ({
        ...current,
        [tenantId]: null
      }));
      setSuccess('Tenant logo uploaded.');
      await loadTenants(tenantId);
    } catch {
      setError('Logo upload failed. Start the local API and try again.');
    } finally {
      setUploadingTenantId('');
    }
  }

  async function handleArchiveTenant() {
    if (!selectedTenant) {
      setError('Select a tenant before archiving.');
      return;
    }

    setError('');
    setSuccess('');
    setIsArchivingTenant(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${selectedTenant.id}/archive`,
        {
          method: 'POST',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to archive tenant.');
        return;
      }

      setSuccess('Tenant archived. It can now be deleted.');
      await loadTenants(selectedTenant.id);
    } catch {
      setError('Unable to archive tenant.');
    } finally {
      setIsArchivingTenant(false);
    }
  }

  async function handleDeleteTenant() {
    if (!selectedTenant) {
      setError('Select a tenant before deleting.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedTenant.name}? This removes the tenant and its tenant-scoped data from this environment immediately.`
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');
    setIsDeletingTenant(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${selectedTenant.id}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to delete tenant.');
        return;
      }

      setSuccess('Tenant deleted.');
      await loadTenants();
    } catch {
      setError('Unable to delete tenant.');
    } finally {
      setIsDeletingTenant(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SectionCard title={String(tenants.length)} description="Tenant directory">
          <p className="text-sm text-admin-muted">
            Compact operator view of every tenant on the platform.
          </p>
        </SectionCard>
        <SectionCard title="Healthy" description="Healthy tenants">
          <p className="text-sm text-admin-muted">
            {healthyCount} tenants are currently in a healthy operating state.
          </p>
        </SectionCard>
        <SectionCard title="Provisioning" description="Tenants in setup">
          <p className="text-sm text-admin-muted">
            {provisioningCount} tenants are still onboarding or provisioning.
          </p>
        </SectionCard>
        <SectionCard title="Suspended" description="Attention needed">
          <p className="text-sm text-admin-muted">
            {suspendedCount} tenants are currently suspended or unhealthy.
          </p>
        </SectionCard>
      </div>

      {error ? (
        <p className="admin-notice admin-notice--danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="admin-notice admin-notice--success">
          {success}
        </p>
      ) : null}

      <div>
        <SectionCard
          title="Tenant health overview"
          description="This is the primary operations view. Review tenant health first, then open a tenant to manage lifecycle, quotas, and branding."
        >
          <div className="space-y-6">
            {isLoading ? (
              <p className="text-sm text-admin-muted">Loading tenants...</p>
            ) : tenants.length === 0 ? (
              <p className="text-sm text-admin-muted">
                No tenants found yet. Create one to populate the dashboard.
              </p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {tenants.map((tenant) => {
                  const healthTone = getHealthTone(tenant.healthStatus);
                  const statusTone = getStatusTone(tenant.status);
                  const isSelected = tenant.id === selectedTenantId;

                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => handleTenantSelect(tenant)}
                      aria-pressed={isSelected}
                      className={`rounded-3xl border p-5 text-left transition ${
                        isSelected
                          ? 'admin-panel border-admin-accent shadow-sm'
                          : 'admin-panel-muted hover:border-admin-accent/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-3.5 w-3.5 rounded-full ${healthTone.dot}`}
                            />
                            <p className="truncate text-base font-semibold text-admin-text">
                              {tenant.name}
                            </p>
                          </div>
                          <p className="mt-2 font-mono text-xs text-admin-muted">
                            {tenant.slug}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="admin-badge admin-badge--neutral">
                            {tenant.type}
                          </span>
                          <span
                            className={healthTone.badge}
                          >
                            {tenant.healthStatus}
                          </span>
                          <span
                            className={statusTone}
                          >
                            {tenant.status}
                          </span>
                          {tenant.isArchived ? (
                            <span className="admin-badge admin-badge--warning">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="admin-panel px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-muted">
                            Members
                          </p>
                          <p className="mt-2 text-sm font-semibold text-admin-text">
                            {tenant.quotaMembers ?? 'Uncapped'}
                          </p>
                        </div>
                        <div className="admin-panel px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-muted">
                            Storage
                          </p>
                          <p className="mt-2 text-sm font-semibold text-admin-text">
                            {tenant.quotaStorageGb ? `${tenant.quotaStorageGb} GB` : 'Uncapped'}
                          </p>
                        </div>
                        <div className="admin-panel px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-muted">
                            Created
                          </p>
                          <p className="mt-2 text-sm font-semibold text-admin-text">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm font-medium text-admin-accent">
                        Open tenant details
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {selectedTenant ? (
        <SectionCard
          title={selectedTenant.name}
          description="Detailed tenant workspace opened from the health overview."
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-admin-muted">
                Adjust lifecycle, quotas, and branding for the selected tenant.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTenantId('');
                  setTenantDetailForm(emptyTenantDetailForm);
                }}
                className="admin-button admin-button--secondary text-sm"
              >
                Close detail view
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.6fr))]">
              <div className="admin-panel-muted p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                      Selected tenant
                    </p>
                    <p className="mt-2 truncate text-lg font-semibold text-admin-text">
                      {selectedTenant.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-admin-muted">
                      {selectedTenant.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="admin-badge admin-badge--neutral">
                      {selectedTenant.type}
                    </span>
                    <span
                      className={getHealthTone(selectedTenant.healthStatus).badge}
                    >
                      {selectedTenant.healthStatus}
                    </span>
                    <span
                      className={getStatusTone(selectedTenant.status)}
                    >
                      {selectedTenant.status}
                    </span>
                    {selectedTenant.isArchived ? (
                      <span className="admin-badge admin-badge--warning">
                        Archived
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="admin-panel-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Created
                </p>
                <p className="mt-2 text-sm font-semibold text-admin-text">
                  {new Date(selectedTenant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="admin-panel-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Member limit
                </p>
                <p className="mt-2 text-sm font-semibold text-admin-text">
                  {selectedTenant.quotaMembers ?? 'Uncapped'}
                </p>
              </div>
              <div className="admin-panel-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Storage limit
                </p>
                <p className="mt-2 text-sm font-semibold text-admin-text">
                  {selectedTenant.quotaStorageGb ?? 'Uncapped'}
                  {selectedTenant.quotaStorageGb ? ' GB' : ''}
                </p>
              </div>
              <div className="admin-panel-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Archived
                </p>
                <p className="mt-2 text-sm font-semibold text-admin-text">
                  {selectedTenant.archivedAt
                    ? new Date(selectedTenant.archivedAt).toLocaleDateString()
                    : 'Not archived'}
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSaveTenantDetails}>
              <div className="grid gap-6 xl:grid-cols-[minmax(320px,1.08fr)_minmax(320px,0.92fr)]">
                <div className="space-y-6">
                  <div className="admin-panel-muted rounded-3xl p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-admin-text">
                          Lifecycle and quotas
                        </p>
                        <p className="mt-1 text-sm text-admin-muted">
                          Set tenant status and manage member and storage limits
                          holistically.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingTenant}
                        className="admin-button admin-button--primary w-full text-sm lg:w-auto"
                      >
                        {isSavingTenant ? 'Saving tenant...' : 'Save tenant details'}
                      </button>
                    </div>

                    <div className="mt-6 space-y-5">
                      <label className="block">
                        <span className="text-sm font-medium text-admin-text">
                          Tenant status
                        </span>
                        <select
                          className="admin-input mt-2"
                          value={tenantDetailForm.status}
                          onChange={(event) =>
                            setTenantDetailForm((current) => ({
                              ...current,
                              status: event.target.value as Tenant['status']
                            }))
                          }
                        >
                          <option value="ONBOARDING">Onboarding</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </label>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium text-admin-text">
                            Member quota
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="admin-input mt-2"
                            value={tenantDetailForm.quotaMembers}
                            onChange={(event) =>
                              setTenantDetailForm((current) => ({
                                ...current,
                                quotaMembers: event.target.value
                              }))
                            }
                            placeholder="500"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-admin-text">
                            Storage quota (GB)
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="admin-input mt-2"
                            value={tenantDetailForm.quotaStorageGb}
                            onChange={(event) =>
                              setTenantDetailForm((current) => ({
                                ...current,
                                quotaStorageGb: event.target.value
                              }))
                            }
                            placeholder="25"
                          />
                        </label>
                      </div>

                      <div className="admin-panel p-4">
                        <p className="text-sm font-medium text-admin-text">
                          Quota policy
                        </p>
                        <p className="mt-1 text-sm text-admin-muted">
                          Leave either field empty to remove that cap. Values are
                          stored as full tenant limits.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="admin-panel-muted rounded-3xl p-5">
                    <p className="text-base font-semibold text-admin-text">
                      Tenant lifecycle
                    </p>
                    <p className="mt-1 text-sm text-admin-muted">
                      The temporary admin flow is: set inactive, archive, then delete.
                    </p>
                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTenantDetailForm((current) => ({
                            ...current,
                            status: 'INACTIVE'
                          }))
                        }
                        disabled={selectedTenant.status === 'INACTIVE'}
                        className="admin-button admin-button--secondary w-full text-sm"
                      >
                        {selectedTenant.status === 'INACTIVE'
                          ? 'Tenant already inactive'
                          : 'Mark tenant inactive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleArchiveTenant()}
                        disabled={
                          isArchivingTenant ||
                          selectedTenant.status !== 'INACTIVE' ||
                          Boolean(selectedTenant.isArchived)
                        }
                        className="admin-button w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: 'rgba(251, 191, 36, 0.28)',
                          background: 'rgba(251, 191, 36, 0.14)',
                          color: '#fcd34d'
                        }}
                      >
                        {isArchivingTenant
                          ? 'Archiving tenant...'
                          : selectedTenant.isArchived
                            ? 'Tenant archived'
                            : 'Archive tenant'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTenant()}
                        disabled={
                          isDeletingTenant ||
                          selectedTenant.status !== 'INACTIVE' ||
                          !selectedTenant.isArchived
                        }
                        className="admin-button w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
                          color: '#fff'
                        }}
                      >
                        {isDeletingTenant ? 'Deleting tenant...' : 'Delete tenant'}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-admin-muted">
                      Deletion only unlocks after the tenant is inactive and archived.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="admin-panel-muted rounded-3xl p-5">
                    <p className="text-base font-semibold text-admin-text">
                      Tenant logo
                    </p>
                    <p className="mt-1 text-sm text-admin-muted">
                      Upload a logo used by the member portal and tenant-branded
                      surfaces.
                    </p>
                    <div className="admin-panel mt-5 border border-dashed p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setLogoFiles((current) => ({
                              ...current,
                              [selectedTenant.id]: event.target.files?.[0] ?? null
                            }))
                          }
                          className="max-w-full text-sm text-admin-text"
                        />
                        <button
                          type="button"
                          onClick={() => void handleLogoUpload(selectedTenant.id)}
                          disabled={uploadingTenantId === selectedTenant.id}
                          className="admin-button admin-button--primary shrink-0 text-sm"
                        >
                          {uploadingTenantId === selectedTenant.id
                            ? 'Uploading logo...'
                            : 'Upload logo'}
                        </button>
                      </div>

                      {typeof selectedTenant.brandingConfig.logoUrl === 'string' ? (
                        <div className="admin-panel-muted mt-4 flex items-center gap-4 p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic tenant branding URLs are runtime-configured and not suitable for next/image without broad remote allowlists */}
                          <img
                            src={`${config.serviceEndpoints.portal}${selectedTenant.brandingConfig.logoUrl}`}
                            alt={`${selectedTenant.name} logo`}
                            className="h-16 w-16 rounded-xl border border-admin-border bg-[rgba(255,255,255,0.08)] object-contain p-2"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-admin-text">
                              Current logo
                            </p>
                            <p className="mt-1 break-all text-sm text-admin-muted">
                              {selectedTenant.brandingConfig.logoUrl}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-panel-muted rounded-3xl p-5">
                <p className="text-base font-semibold text-admin-text">
                  Branding config snapshot
                </p>
                <p className="mt-1 text-sm text-admin-muted">
                  Current branding configuration stored for this tenant.
                </p>
                <pre className="admin-panel mt-4 max-h-[360px] overflow-auto p-4 text-xs text-admin-muted">
                  {JSON.stringify(selectedTenant.brandingConfig, null, 2)}
                </pre>
              </div>
            </form>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
