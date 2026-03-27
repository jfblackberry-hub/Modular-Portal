'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../../../components/section-card';
import { fetchAdminJsonCached } from '../../../../lib/admin-client-data';
import { config, getAdminAuthHeaders } from '../../../../lib/api-auth';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type: 'PAYER' | 'EMPLOYER' | 'BROKER' | 'MEMBER' | 'PROVIDER';
  healthStatus: 'HEALTHY' | 'PROVISIONING' | 'SUSPENDED';
  brandingConfig: Record<string, unknown>;
  quotaMembers: number | null;
  quotaStorageGb: number | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type OrganizationUnit = {
  id: string;
  tenantId: string;
  parentId: string | null;
  type: 'ENTERPRISE' | 'REGION' | 'LOCATION' | 'DEPARTMENT' | 'TEAM';
  name: string;
  metadata?: {
    activeFlag?: boolean | null;
    company?: string | null;
    address?: {
      streetAddress?: string | null;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
    } | null;
    locationId?: string | null;
    phone?: string | null;
    notes?: string | null;
    region?: string | null;
    servicesOffered?: string[];
  } | null;
  createdAt: string;
  updatedAt: string;
};

type OfficeLocationFormState = {
  activeFlag: boolean;
  city: string;
  company: string;
  locationId: string;
  name: string;
  notes: string;
  phone: string;
  region: string;
  servicesOffered: string;
  state: string;
  streetAddress: string;
  zip: string;
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
    type: 'PAYER' | 'EMPLOYER' | 'BROKER' | 'MEMBER' | 'PROVIDER';
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

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('healthy') || normalized === 'active' || normalized === 'configured') {
    return 'admin-badge admin-badge--success';
  }

  if (normalized.includes('warning') || normalized.includes('provision') || normalized.includes('%')) {
    return 'admin-badge admin-badge--warning';
  }

  if (normalized.includes('critical') || normalized.includes('inactive') || normalized.includes('suspended')) {
    return 'admin-badge admin-badge--danger';
  }

  return 'admin-badge admin-badge--neutral';
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

async function fetchTenantSettings(tenantId: string) {
  return fetchAdminJsonCached<SettingsPayload>(
    `${config.apiBaseUrl}/api/tenant-admin/settings?tenant_id=${tenantId}`,
    {
      headers: getAdminAuthHeaders(),
      ttlMs: 20_000
    }
  );
}

async function fetchTenantAuditEvents(tenantId: string, pageSize = 8) {
  const payload = await fetchAdminJsonCached<AuditResponse>(
    `${config.apiBaseUrl}/platform-admin/audit/events?tenant_id=${tenantId}&page_size=${pageSize}`,
    {
      headers: getAdminAuthHeaders(),
      ttlMs: 20_000
    }
  );

  return payload.items;
}

async function fetchTenantEnrichment(tenantId: string) {
  const [settingsPayload, auditEvents, organizationUnits] = await Promise.all([
    fetchTenantSettings(tenantId),
    fetchTenantAuditEvents(tenantId),
    fetchAdminJsonCached<OrganizationUnit[]>(
      `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/organization-units`,
      {
        headers: getAdminAuthHeaders(),
        ttlMs: 20_000
      }
    )
  ]);

  return {
    settings: settingsPayload,
    auditEvents,
    organizationUnits
  };
}

function buildOrganizationUnitDepthMap(organizationUnits: OrganizationUnit[]) {
  const unitsById = new Map(organizationUnits.map((unit) => [unit.id, unit]));
  const depthMap = new Map<string, number>();

  function resolveDepth(unit: OrganizationUnit): number {
    const cached = depthMap.get(unit.id);
    if (cached !== undefined) {
      return cached;
    }

    if (!unit.parentId) {
      depthMap.set(unit.id, 0);
      return 0;
    }

    const parent = unitsById.get(unit.parentId);
    const depth = parent ? resolveDepth(parent) + 1 : 0;
    depthMap.set(unit.id, depth);
    return depth;
  }

  for (const unit of organizationUnits) {
    resolveDepth(unit);
  }

  return depthMap;
}

function sortOrganizationUnits(organizationUnits: OrganizationUnit[]) {
  const childrenByParentId = new Map<string | null, OrganizationUnit[]>();

  for (const unit of organizationUnits) {
    const siblings = childrenByParentId.get(unit.parentId) ?? [];
    siblings.push(unit);
    childrenByParentId.set(unit.parentId, siblings);
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort((left, right) => left.name.localeCompare(right.name));
  }

  const ordered: OrganizationUnit[] = [];

  function visit(parentId: string | null) {
    const children = childrenByParentId.get(parentId) ?? [];

    for (const child of children) {
      ordered.push(child);
      visit(child.id);
    }
  }

  visit(null);

  return ordered;
}

function createOfficeLocationFormState(unit: OrganizationUnit): OfficeLocationFormState {
  return {
    name: unit.name,
    locationId: unit.metadata?.locationId ?? '',
    company: unit.metadata?.company ?? '',
    streetAddress: unit.metadata?.address?.streetAddress ?? '',
    city: unit.metadata?.address?.city ?? '',
    state: unit.metadata?.address?.state ?? '',
    zip: unit.metadata?.address?.zip ?? '',
    phone: unit.metadata?.phone ?? '',
    notes: unit.metadata?.notes ?? '',
    region: unit.metadata?.region ?? '',
    servicesOffered: unit.metadata?.servicesOffered?.join(', ') ?? '',
    activeFlag: unit.metadata?.activeFlag ?? true
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
        const summaries = await fetchAdminJsonCached<TenantListRow[]>(
          `${config.apiBaseUrl}/platform-admin/tenant-summaries`,
          {
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000
          }
        );

        if (!isMounted) {
          return;
        }

        setRows(summaries);
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
        <p className="admin-notice admin-notice--danger">
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
          <div className="admin-table-shell overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="admin-table-head border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                <tr>
                  <th className="px-3 py-3">Tenant Name</th>
                  <th className="px-3 py-3">Type</th>
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
                  <tr key={row.tenant.id} className="admin-table-row">
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
                    <td className="px-3 py-4 text-admin-text">{row.tenant.type}</td>
                    <td className="px-3 py-4">
                        <span className={getStatusTone(row.tenant.healthStatus)}>
                          {row.tenant.healthStatus}
                        </span>
                    </td>
                    <td className="px-3 py-4 text-admin-text">{row.users}</td>
                    <td className="px-3 py-4">
                        <span className={getStatusTone(row.connectivity)}>
                          {row.connectivity}
                        </span>
                    </td>
                    <td className="px-3 py-4 text-admin-text">{row.configuration}</td>
                    <td className="px-3 py-4 text-admin-text">{row.alerts}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/platform/tenants/${row.tenant.id}`}
                          className="admin-button admin-button--secondary text-xs uppercase tracking-[0.18em]"
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
  const [organizationUnits, setOrganizationUnits] = useState<OrganizationUnit[]>(
    []
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isArchivingTenant, setIsArchivingTenant] = useState(false);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [officeLocationFile, setOfficeLocationFile] = useState<File | null>(null);
  const [isImportingOfficeLocations, setIsImportingOfficeLocations] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [officeLocationForm, setOfficeLocationForm] = useState<OfficeLocationFormState | null>(null);
  const [isSavingOfficeLocation, setIsSavingOfficeLocation] = useState(false);

  async function loadDetailState() {
    const [tenantPayload, enrichment] = await Promise.all([
      fetchAdminJsonCached<Tenant>(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}`, {
        headers: getAdminAuthHeaders(),
        ttlMs: 20_000
      }),
      fetchTenantEnrichment(tenantId)
    ]);

    setTenant(tenantPayload);
    setSettings(enrichment.settings);
    setEvents(enrichment.auditEvents);
    setOrganizationUnits(enrichment.organizationUnits);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        const [tenantPayload, enrichment] = await Promise.all([
          fetchAdminJsonCached<Tenant>(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}`, {
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000
          }),
          fetchTenantEnrichment(tenantId)
        ]);

        if (!isMounted) {
          return;
        }

        setTenant(tenantPayload);
        setSettings(enrichment.settings);
        setEvents(enrichment.auditEvents);
        setOrganizationUnits(enrichment.organizationUnits);
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

  async function handleArchiveTenant() {
    if (!tenant) {
      setError('Tenant detail unavailable.');
      return;
    }

    setError('');
    setSuccess('');
    setIsArchivingTenant(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenant.id}/archive`,
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

      await loadDetailState();
      setSuccess('Tenant archived. It is now ready for decom.');
    } catch {
      setError('Unable to archive tenant.');
    } finally {
      setIsArchivingTenant(false);
    }
  }

  async function handleDecomTenant() {
    if (!tenant) {
      setError('Tenant detail unavailable.');
      return;
    }

    const confirmed = window.confirm(
      `Decom ${tenant.name}? This will delete the tenant from this environment after archive prerequisites are met.`
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');
    setIsDeletingTenant(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenant.id}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to decom tenant.');
        return;
      }

      window.location.assign('/admin/platform/tenants');
    } catch {
      setError('Unable to decom tenant.');
    } finally {
      setIsDeletingTenant(false);
    }
  }

  async function handleImportOfficeLocations() {
    if (!tenant) {
      setError('Tenant detail unavailable.');
      return;
    }

    if (!officeLocationFile) {
      setError('Choose a CSV, pipe-delimited, tab-delimited, or semicolon-delimited file first.');
      return;
    }

    setError('');
    setSuccess('');
    setIsImportingOfficeLocations(true);

    try {
      const formData = new FormData();
      formData.append('file', officeLocationFile);

      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenant.id}/office-locations/import`,
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
        setError(payload?.message ?? 'Unable to import office locations.');
        return;
      }

      const payload = (await response.json()) as {
        createdCount: number;
        updatedCount: number;
      };

      await loadDetailState();
      setOfficeLocationFile(null);
      setSuccess(
        `Office locations imported. ${payload.createdCount} created and ${payload.updatedCount} updated.`
      );
    } catch {
      setError('Unable to import office locations.');
    } finally {
      setIsImportingOfficeLocations(false);
    }
  }

  function handleBeginEditOfficeLocation(unit: OrganizationUnit) {
    setEditingLocationId(unit.id);
    setOfficeLocationForm(createOfficeLocationFormState(unit));
    setError('');
    setSuccess('');
  }

  function handleCancelEditOfficeLocation() {
    setEditingLocationId(null);
    setOfficeLocationForm(null);
  }

  async function handleSaveOfficeLocation(unitId: string) {
    if (!tenant || !officeLocationForm) {
      setError('Office location detail unavailable.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSavingOfficeLocation(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenant.id}/organization-units/${unitId}`,
        {
          method: 'PATCH',
          headers: {
            ...getAdminAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: officeLocationForm.name,
            locationId: officeLocationForm.locationId || null,
            company: officeLocationForm.company || null,
            streetAddress: officeLocationForm.streetAddress || null,
            city: officeLocationForm.city || null,
            state: officeLocationForm.state || null,
            zip: officeLocationForm.zip || null,
            phone: officeLocationForm.phone || null,
            notes: officeLocationForm.notes || null,
            region: officeLocationForm.region || null,
            servicesOffered: officeLocationForm.servicesOffered
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            activeFlag: officeLocationForm.activeFlag
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? 'Unable to save office location.');
        return;
      }

      await loadDetailState();
      setEditingLocationId(null);
      setOfficeLocationForm(null);
      setSuccess('Office location updated.');
    } catch {
      setError('Unable to save office location.');
    } finally {
      setIsSavingOfficeLocation(false);
    }
  }

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
  const orderedOrganizationUnits = sortOrganizationUnits(organizationUnits);
  const organizationUnitDepthMap = buildOrganizationUnitDepthMap(
    orderedOrganizationUnits
  );

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
          className="admin-button admin-button--secondary text-sm"
        >
          Back to tenants
        </Link>
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

      {isLoading ? (
        <p className="text-sm text-admin-muted">Loading tenant workspace...</p>
      ) : !tenant || !settings ? (
        <p className="text-sm text-admin-muted">Tenant detail unavailable.</p>
      ) : (
        <div className="grid gap-6">
          <SectionCard
            title="Lifecycle Actions"
            description="Archive inactive tenants, then decom them cleanly from the platform."
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleArchiveTenant()}
                disabled={
                  isArchivingTenant ||
                  tenant.status !== 'INACTIVE' ||
                  Boolean(tenant.isArchived)
                }
                className="admin-button text-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: 'rgba(251, 191, 36, 0.28)',
                  background: 'rgba(251, 191, 36, 0.14)',
                  color: '#fcd34d'
                }}
              >
                {isArchivingTenant
                  ? 'Archiving tenant...'
                  : tenant.isArchived
                    ? 'Tenant archived'
                    : 'Archive tenant'}
              </button>
              <button
                type="button"
                onClick={() => void handleDecomTenant()}
                disabled={
                  isDeletingTenant ||
                  tenant.status !== 'INACTIVE' ||
                  !tenant.isArchived
                }
                className="admin-button text-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
                  color: '#fff'
                }}
              >
                {isDeletingTenant ? 'Decomissioning tenant...' : 'Decom tenant'}
              </button>
              <p className="text-sm text-admin-muted">
                Set tenant status to <span className="font-medium text-admin-text">Inactive</span> before archiving. Decom unlocks after archive.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Tenant Profile"
            description="Core tenant identity, lifecycle, and platform limits."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Status', value: tenant.status },
                { label: 'Tenant Type', value: tenant.type },
                { label: 'Health', value: tenant.healthStatus },
                { label: 'Member Limit', value: tenant.quotaMembers ? String(tenant.quotaMembers) : 'Uncapped' },
                {
                  label: 'Storage Limit',
                  value: tenant.quotaStorageGb ? `${tenant.quotaStorageGb} GB` : 'Uncapped'
                }
              ].map((item) => (
                <div key={item.label} className="admin-panel-muted">
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
            title="Organization Structure"
            description="Canonical tenant organization hierarchy used for provider and operating-structure testing."
          >
            <div className="space-y-4">
              {tenant.type === 'PROVIDER' ? (
                <div className="rounded-3xl border border-admin-border bg-white/60 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent">
                        Office Location Import
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-admin-text">
                        Load provider office locations from a delimited file
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-admin-muted">
                        Accepts CSV, pipe-delimited, tab-delimited, and semicolon-delimited files. Expected columns include company, location name, street address, city, state, zip, phone, and notes. Imported offices are added as LOCATION units beneath the tenant&apos;s established Provider hierarchy.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 xl:max-w-xl">
                      <input
                        type="file"
                        accept=".csv,.txt,.psv,.tsv"
                        onChange={(event) =>
                          setOfficeLocationFile(event.target.files?.[0] ?? null)
                        }
                        className="rounded-2xl border border-admin-border bg-admin-surface px-4 py-3 text-sm text-admin-text"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleImportOfficeLocations()}
                          disabled={isImportingOfficeLocations || !officeLocationFile}
                          className="admin-button text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isImportingOfficeLocations
                            ? 'Importing locations...'
                            : 'Import office locations'}
                        </button>
                        <p className="text-xs leading-5 text-admin-muted">
                          Use a header row. Existing locations with the same name under the import parent will have their details refreshed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {orderedOrganizationUnits.length === 0 ? (
                <p className="text-sm text-admin-muted">
                  No organization units are configured for this tenant yet.
                </p>
              ) : (
                <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="admin-panel-muted">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                      Total Units
                    </p>
                    <p className="mt-3 text-base font-semibold text-admin-text">
                      {orderedOrganizationUnits.length}
                    </p>
                  </div>
                  <div className="admin-panel-muted">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                      Root Nodes
                    </p>
                    <p className="mt-3 text-base font-semibold text-admin-text">
                      {orderedOrganizationUnits.filter((unit) => !unit.parentId).length}
                    </p>
                  </div>
                  <div className="admin-panel-muted">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                      Types Present
                    </p>
                    <p className="mt-3 text-base font-semibold text-admin-text">
                      {Array.from(
                        new Set(orderedOrganizationUnits.map((unit) => unit.type))
                      ).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="admin-table-shell overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="admin-table-head border-b border-admin-border text-xs uppercase tracking-[0.18em] text-admin-muted">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Parent</th>
                        <th className="px-4 py-3">Location Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedOrganizationUnits.map((unit) => {
                        const depth = organizationUnitDepthMap.get(unit.id) ?? 0;
                        const parent = orderedOrganizationUnits.find(
                          (candidate) => candidate.id === unit.parentId
                        );

                        return (
                          <tr key={unit.id} className="admin-table-row">
                            <td className="px-4 py-4 text-admin-text">
                              <div
                                className="flex items-center gap-3"
                                style={{ paddingLeft: `${depth * 20}px` }}
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-admin-accent/70" />
                                <div>
                                  <p className="font-medium">{unit.name}</p>
                                  <p className="mt-1 text-xs text-admin-muted">
                                    {depth === 0 ? 'Root unit' : `Level ${depth + 1}`}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="admin-badge admin-badge--neutral">
                                {unit.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-admin-text">
                              {parent?.name ?? 'None'}
                            </td>
                            <td className="px-4 py-4 text-admin-text">
                              {unit.type === 'LOCATION' ? (
                                editingLocationId === unit.id && officeLocationForm ? (
                                  <div className="space-y-3 rounded-2xl border border-admin-border bg-admin-surface/70 p-3">
                                    <div className="grid gap-2 md:grid-cols-2">
                                      <input value={officeLocationForm.name} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, name: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="Location name" />
                                      <input value={officeLocationForm.locationId} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, locationId: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="Location ID" />
                                      <input value={officeLocationForm.company} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, company: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="Company" />
                                      <input value={officeLocationForm.region} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, region: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="Region" />
                                      <input value={officeLocationForm.streetAddress} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, streetAddress: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text md:col-span-2" placeholder="Street address" />
                                      <input value={officeLocationForm.city} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, city: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="City" />
                                      <input value={officeLocationForm.state} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, state: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="State" />
                                      <input value={officeLocationForm.zip} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, zip: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="ZIP" />
                                      <input value={officeLocationForm.phone} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, phone: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text" placeholder="Phone" />
                                      <input value={officeLocationForm.servicesOffered} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, servicesOffered: event.target.value } : current)} className="rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text md:col-span-2" placeholder="Services offered (comma separated)" />
                                      <textarea value={officeLocationForm.notes} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, notes: event.target.value } : current)} className="min-h-20 rounded-xl border border-admin-border bg-white px-3 py-2 text-xs text-admin-text md:col-span-2" placeholder="Notes" />
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-admin-text">
                                      <input type="checkbox" checked={officeLocationForm.activeFlag} onChange={(event) => setOfficeLocationForm((current) => current ? { ...current, activeFlag: event.target.checked } : current)} />
                                      Active location
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => void handleSaveOfficeLocation(unit.id)} disabled={isSavingOfficeLocation} className="admin-button text-xs disabled:cursor-not-allowed disabled:opacity-60">
                                        {isSavingOfficeLocation ? 'Saving...' : 'Save location'}
                                      </button>
                                      <button type="button" onClick={handleCancelEditOfficeLocation} className="admin-button admin-button--secondary text-xs">
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1 text-xs leading-5 text-admin-muted">
                                    {(() => {
                                      const metadata = unit.metadata ?? {};
                                      const address = metadata.address ?? {};

                                      return (
                                        <>
                                    {metadata.locationId ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Location ID:</span>{' '}
                                        {metadata.locationId}
                                      </p>
                                    ) : null}
                                    {metadata.company ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Company:</span>{' '}
                                        {metadata.company}
                                      </p>
                                    ) : null}
                                    {metadata.region ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Region:</span>{' '}
                                        {metadata.region}
                                      </p>
                                    ) : null}
                                    {metadata.servicesOffered?.length ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Services:</span>{' '}
                                        {metadata.servicesOffered.join(', ')}
                                      </p>
                                    ) : null}
                                    {typeof metadata.activeFlag === 'boolean' ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Status:</span>{' '}
                                        {metadata.activeFlag ? 'Active' : 'Inactive'}
                                      </p>
                                    ) : null}
                                    {address.streetAddress ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Address:</span>{' '}
                                        {[
                                          address.streetAddress,
                                          address.city,
                                          address.state,
                                          address.zip
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </p>
                                    ) : null}
                                    {metadata.phone ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Phone:</span>{' '}
                                        {metadata.phone}
                                      </p>
                                    ) : null}
                                    {metadata.notes ? (
                                      <p>
                                        <span className="font-semibold text-admin-text">Notes:</span>{' '}
                                        {metadata.notes}
                                      </p>
                                    ) : null}
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleBeginEditOfficeLocation(unit)}
                                        className="text-xs font-semibold uppercase tracking-[0.14em] text-admin-accent"
                                      >
                                        Edit location
                                      </button>
                                    </div>
                                    {!metadata.company &&
                                    !address.streetAddress &&
                                    !metadata.phone &&
                                    !metadata.notes &&
                                    !metadata.locationId &&
                                    !metadata.region &&
                                    !metadata.servicesOffered?.length ? (
                                      <span className="text-admin-muted">No imported details</span>
                                    ) : null}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )
                              ) : (
                                <span className="text-admin-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
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
                  className="admin-link-tile"
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
                  className="admin-panel-muted"
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
                href={`/admin/tenant/configuration?tenantId=${tenant.id}`}
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
                className="admin-link-tile"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Member Modules</p>
                <p className="mt-2 text-2xl font-semibold text-admin-text">{memberModuleCount}</p>
              </Link>
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}&moduleScope=provider`}
                className="admin-link-tile"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Provider Modules</p>
                <p className="mt-2 text-2xl font-semibold text-admin-text">{providerModuleCount}</p>
              </Link>
              <Link
                href={`/admin/platform/tenants/configuration?tenantId=${tenant.id}&moduleScope=all`}
                className="admin-link-tile"
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
                      className="admin-panel-muted"
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
                      className="admin-panel-muted"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-admin-text">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 text-sm text-admin-muted">{user.email}</p>
                        </div>
                        <span className={user.isActive ? 'admin-badge admin-badge--success' : 'admin-badge admin-badge--neutral'}>
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
              <Link href={`/admin/platform/operations/jobs?tenantId=${tenant.id}`} className="admin-link-tile text-sm font-medium">
                Tenant jobs
              </Link>
              <Link href={buildTenantLogHref(tenant.id)} className="admin-link-tile text-sm font-medium">
                Tenant logs
              </Link>
              <Link href={`/admin/platform/audit?tenantId=${tenant.id}`} className="admin-link-tile text-sm font-medium">
                Tenant audit
              </Link>
              <Link href="/admin/platform/tenants/configuration" className="admin-link-tile text-sm font-medium">
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
                        className="admin-link-tile"
                      >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-admin-text">{event.eventType}</p>
                              <p className="mt-1 text-sm text-admin-muted">
                                {event.resourceType}
                                {event.resourceId ? ` • ${event.resourceId}` : ''}
                              </p>
                            </div>
                            <span className="admin-badge admin-badge--danger">
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
                      <p className="admin-panel-muted text-sm text-admin-muted">
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
                        className="admin-link-tile"
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
                            className={
                              alertKeywords.some((keyword) => event.eventType.toLowerCase().includes(keyword))
                                ? 'admin-badge admin-badge--warning'
                                : 'admin-badge admin-badge--info'
                            }
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
