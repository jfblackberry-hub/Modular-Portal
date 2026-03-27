'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { config, getAdminAuthHeaders } from '../lib/api-auth';
import { useAdminTenantContext } from './admin-tenant-context-provider';
import {
  AdminActionBar,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageLayout,
  AdminStatCard
} from './admin-ui';
import { SectionCard } from './section-card';

type TenantTypeCode = 'PAYER' | 'CLINIC' | 'PHYSICIAN_GROUP' | 'HOSPITAL';

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type: TenantTypeCode;
  templateId?: string | null;
  quotaUsers?: number | null;
  quotaMembers?: number | null;
  quotaStorageGb?: number | null;
  createdAt?: string;
};

type TenantTypeTemplateGroup = {
  id: string;
  tenantTypeCode: TenantTypeCode;
  label: string;
  templates: TenantTemplate[];
};

type TenantTemplate = {
  id: string;
  code: string;
  name: string;
  tenantTypeCode: TenantTypeCode;
  description: string | null;
  defaultOrganizationUnitStructure: string[];
  defaultCapabilities: string[];
  defaultExperiences: string[];
  config?: Record<string, unknown>;
};

type Capability = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  configSchema: Record<string, unknown> | null;
};

type TenantExperienceCapability = {
  id: string;
  capabilityId: string;
  enabled: boolean;
  displayOrder: number;
  config: Record<string, unknown> | null;
  capability: Capability;
};

type TenantExperience = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: string;
  layout: Record<string, unknown> | null;
  capabilityConfigs: TenantExperienceCapability[];
};

type TenantCapabilityMatrix = {
  tenant: {
    id: string;
    name: string;
    tenantTypeCode: TenantTypeCode;
  };
  capabilities: Capability[];
  experiences: TenantExperience[];
};

type TenantSettingsPayload = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    type: TenantTypeCode;
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
  integrations: Array<{
    id: string;
    name: string;
    adapterKey: string;
    status: string;
    lastSyncAt: string | null;
    lastHealthCheckAt: string | null;
  }>;
  webhooks: Array<{
    id: string;
    name: string;
    adapterKey: string;
    status: string;
    lastSyncAt: string | null;
    lastHealthCheckAt: string | null;
  }>;
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    roles: string[];
    permissions: string[];
  }>;
};

function joinList(values: string[]) {
  return values.join(', ');
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function prettyTenantType(tenantType: string) {
  return tenantType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function prettyDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'No recent activity';
}

function prettyScope(value: string) {
  return value.replace(/_/g, ' ');
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('active') || normalized.includes('healthy') || normalized.includes('enabled')) {
    return 'admin-badge admin-badge--success';
  }

  if (normalized.includes('warning') || normalized.includes('onboarding') || normalized.includes('pending')) {
    return 'admin-badge admin-badge--warning';
  }

  if (normalized.includes('inactive') || normalized.includes('error') || normalized.includes('disabled')) {
    return 'admin-badge admin-badge--danger';
  }

  return 'admin-badge admin-badge--neutral';
}

async function parseJsonError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? fallback;
}

function usePlatformAdminData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(url, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error(await parseJsonError(response, 'Unable to load control plane data.'));
        }

        const payload = (await response.json()) as T;

        if (!mounted) {
          return;
        }

        setData(payload);
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        setData(null);
        setError(
          nextError instanceof Error ? nextError.message : 'Unable to load control plane data.'
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, isLoading, error, setData, setError, setIsLoading };
}

export function TenantTemplateManagementWorkspace() {
  const {
    data: tenantTypes,
    isLoading,
    error,
    setData
  } = usePlatformAdminData<TenantTypeTemplateGroup[]>(
    `${config.apiBaseUrl}/platform-admin/tenant-types`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    tenantTypeCode: 'CLINIC' as TenantTypeCode,
    description: '',
    defaultOrganizationUnitStructure: 'Practice, Clinic, Staff',
    defaultCapabilities: 'scheduling, billing, eligibility',
    defaultExperiences: 'provider_portal'
  });

  async function refresh() {
    const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenant-types`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await parseJsonError(response, 'Unable to refresh tenant templates.'));
    }

    setData((await response.json()) as TenantTypeTemplateGroup[]);
  }

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenant-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          ...form,
          defaultOrganizationUnitStructure: splitList(form.defaultOrganizationUnitStructure),
          defaultCapabilities: splitList(form.defaultCapabilities),
          defaultExperiences: splitList(form.defaultExperiences)
        })
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response, 'Unable to create tenant template.'));
      }

      await refresh();
      setForm({
        code: '',
        name: '',
        tenantTypeCode: form.tenantTypeCode,
        description: '',
        defaultOrganizationUnitStructure: 'Practice, Clinic, Staff',
        defaultCapabilities: 'scheduling, billing, eligibility',
        defaultExperiences: 'provider_portal'
      });
    } catch (nextError) {
      setSubmitError(
        nextError instanceof Error ? nextError.message : 'Unable to create tenant template.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPageLayout
      eyebrow="Tenants"
      title="Tenant Types"
      description="Manage editable tenant templates and type-specific defaults that drive fast tenant setup without embedding business rules in the UI."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Create tenant template"
          description="Templates define default Organization Units, Experiences, and Capabilities for a Tenant Type."
        >
          <form className="space-y-4" onSubmit={handleCreateTemplate}>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Tenant Type</span>
              <select
                className="admin-input mt-2"
                value={form.tenantTypeCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tenantTypeCode: event.target.value as TenantTypeCode
                  }))
                }
              >
                <option value="PAYER">Payer</option>
                <option value="CLINIC">Clinic</option>
                <option value="PHYSICIAN_GROUP">Physician Group</option>
                <option value="HOSPITAL">Hospital</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Template name</span>
              <input
                className="admin-input mt-2"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Clinic ABA Operations"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Template code</span>
              <input
                className="admin-input mt-2"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="clinic-aba"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Description</span>
              <textarea
                className="admin-input mt-2 min-h-[6rem]"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Operational default for an ABA clinic control plane."
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Default OU Structure</span>
              <input
                className="admin-input mt-2"
                value={form.defaultOrganizationUnitStructure}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultOrganizationUnitStructure: event.target.value
                  }))
                }
                placeholder="Practice, Clinic, Staff"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Default Capabilities</span>
              <input
                className="admin-input mt-2"
                value={form.defaultCapabilities}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultCapabilities: event.target.value }))
                }
                placeholder="scheduling, billing, eligibility"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Default Experiences</span>
              <input
                className="admin-input mt-2"
                value={form.defaultExperiences}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultExperiences: event.target.value }))
                }
                placeholder="provider_portal"
              />
            </label>

            {submitError ? <p className="admin-notice admin-notice--danger">{submitError}</p> : null}

            <button type="submit" disabled={isSubmitting} className="admin-button admin-button--primary">
              {isSubmitting ? 'Saving template...' : 'Save template'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Tenant Type library"
          description="Editable defaults for each supported Tenant Type under the Averra Platform."
        >
          {isLoading ? (
            <AdminLoadingState />
          ) : error ? (
            <AdminErrorState title="Unable to load tenant templates" description={error} />
          ) : (
            <div className="space-y-5">
              {(tenantTypes ?? []).map((group) => (
                <article key={group.tenantTypeCode} className="admin-subsection">
                  <div className="admin-subsection__header">
                    <div>
                      <h3 className="admin-subsection__title">{group.label}</h3>
                      <p className="admin-subsection__description">
                        {group.templates.length} template{group.templates.length === 1 ? '' : 's'} available
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {group.templates.map((template) => (
                      <div key={template.id} className="admin-list-row">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-admin-text">{template.name}</h4>
                            <span className="admin-badge admin-badge--neutral">{template.code}</span>
                          </div>
                          <p className="text-sm text-admin-muted">
                            {template.description || 'No description provided.'}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-admin-muted">
                            <span>OU: {joinList(template.defaultOrganizationUnitStructure)}</span>
                            <span>Capabilities: {joinList(template.defaultCapabilities)}</span>
                            <span>Experiences: {joinList(template.defaultExperiences)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AdminPageLayout>
  );
}

export function CapabilityRegistryWorkspace({ embedded = false }: { embedded?: boolean }) {
  const {
    data: capabilities,
    isLoading,
    error,
    setData
  } = usePlatformAdminData<Capability[]>(`${config.apiBaseUrl}/platform-admin/capabilities`);
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'operations',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function refresh() {
    const response = await fetch(`${config.apiBaseUrl}/platform-admin/capabilities`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await parseJsonError(response, 'Unable to refresh capabilities.'));
    }

    setData((await response.json()) as Capability[]);
  }

  async function handleCreateCapability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/capabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          ...form,
          configSchema: {}
        })
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response, 'Unable to create capability.'));
      }

      await refresh();
      setForm({
        id: '',
        name: '',
        category: form.category,
        description: ''
      });
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : 'Unable to create capability.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Register capability"
          description="Capabilities are global definitions. Tenant-specific behavior is driven by assignment and config, not hardcoded UI logic."
        >
          <form className="space-y-4" onSubmit={handleCreateCapability}>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Capability ID</span>
              <input
                className="admin-input mt-2"
                value={form.id}
                onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                placeholder="scheduling"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Display name</span>
              <input
                className="admin-input mt-2"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Scheduling"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Category</span>
              <input
                className="admin-input mt-2"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="operations"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Description</span>
              <textarea
                className="admin-input mt-2 min-h-[6rem]"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Explain what this capability enables."
              />
            </label>
            {submitError ? <p className="admin-notice admin-notice--danger">{submitError}</p> : null}
            <button type="submit" disabled={isSubmitting} className="admin-button admin-button--primary">
              {isSubmitting ? 'Saving capability...' : 'Save capability'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Global capability registry"
          description="Every tenant-facing function should resolve from this registry instead of being hardcoded into admin UI flows."
        >
          {isLoading ? (
            <AdminLoadingState />
          ) : error ? (
            <AdminErrorState title="Unable to load capabilities" description={error} />
          ) : (
            <div className="space-y-3">
              {(capabilities ?? []).map((capability) => (
                <div key={capability.id} className="admin-list-row">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-admin-text">{capability.name}</h3>
                      <span className="admin-badge admin-badge--neutral">{capability.id}</span>
                      <span className="admin-badge admin-badge--neutral">{capability.category}</span>
                    </div>
                    <p className="text-sm text-admin-muted">
                      {capability.description || 'No description provided.'}
                    </p>
                    <p className="text-xs text-admin-muted">
                      Scope: {prettyScope(
                        String((capability.configSchema as { scope?: string } | null)?.scope ?? 'platform_capability_registry')
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <AdminPageLayout
      eyebrow="Shared Services"
      title="Capability Registry"
      description="Manage the global Capability Registry used by tenant Experiences, assignment UIs, and metadata-driven rendering across the Platform."
    >
      {content}
    </AdminPageLayout>
  );
}

export function CreateTenantWorkspace() {
  const {
    data: tenantTypes,
    isLoading,
    error
  } = usePlatformAdminData<TenantTypeTemplateGroup[]>(
    `${config.apiBaseUrl}/platform-admin/tenant-types`
  );
  const [selectedTenantType, setSelectedTenantType] = useState<TenantTypeCode>('PAYER');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ONBOARDING' | 'INACTIVE'>('ONBOARDING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdTenant, setCreatedTenant] = useState<TenantSummary | null>(null);

  const templates = useMemo(
    () =>
      tenantTypes?.find((group) => group.tenantTypeCode === selectedTenantType)?.templates ?? [],
    [selectedTenantType, tenantTypes]
  );

  useEffect(() => {
    if (templates.length > 0 && !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0]?.id ?? '');
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!slug && name) {
      setSlug(
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  }, [name, slug]);

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setCreatedTenant(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          name,
          slug,
          status,
          type: selectedTenantType,
          templateId: selectedTemplateId || null,
          metadata: {
            create_flow: 'template_based_control_plane'
          },
          brandingConfig: {
            displayName: displayName || name
          }
        })
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response, 'Unable to create tenant.'));
      }

      const payload = (await response.json()) as TenantSummary;
      setCreatedTenant(payload);
      window.location.assign(`/admin/tenants/${payload.id}/organization`);
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : 'Unable to create tenant.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPageLayout
      eyebrow="Tenants"
      title="Create Tenant"
      description="Create a tenant quickly from a template. Defaults come from metadata-driven tenant templates and can be configured after creation."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Template-based tenant creation"
          description="Provisioning wizard removed. Select Tenant Type, select template, enter tenant identity, and create the tenant."
        >
          {isLoading ? (
            <AdminLoadingState />
          ) : error ? (
            <AdminErrorState title="Unable to load tenant templates" description={error} />
          ) : (
            <form className="space-y-4" onSubmit={handleCreateTenant}>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant Type</span>
                <select
                  className="admin-input mt-2"
                  value={selectedTenantType}
                  onChange={(event) => setSelectedTenantType(event.target.value as TenantTypeCode)}
                >
                  <option value="PAYER">Payer</option>
                  <option value="CLINIC">Clinic</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="PHYSICIAN_GROUP">Physician Group</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Template</span>
                <select
                  className="admin-input mt-2"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  required
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant Name</span>
                <input
                  className="admin-input mt-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example ABA Clinic"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Slug</span>
                <input
                  className="admin-input mt-2"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="example-aba-clinic"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Display Name</span>
                <input
                  className="admin-input mt-2"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Example ABA Clinic"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Status</span>
                <select
                  className="admin-input mt-2"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'ONBOARDING' | 'INACTIVE')}
                >
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              {submitError ? <p className="admin-notice admin-notice--danger">{submitError}</p> : null}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={isSubmitting} className="admin-button admin-button--primary">
                  {isSubmitting ? 'Creating tenant...' : 'Create tenant'}
                </button>
                <Link href="/admin/tenants/types" className="admin-button admin-button--secondary">
                  Manage templates
                </Link>
              </div>
            </form>
          )}
        </SectionCard>

        <SectionCard
          title="Creation rules"
          description="The control plane now keeps tenant creation intentionally minimal and metadata-driven."
        >
          <div className="space-y-4 text-sm text-admin-muted">
            <p>Templates apply defaults only. They do not lock the tenant into a permanent capability or Experience set.</p>
            <p>Post-create configuration happens in the tenant-scoped Organization Structure, Experiences, Capabilities, Data & Integrations, and Limits & Usage pages.</p>
            <p>Every control-plane config object includes tenant scope metadata so platform and tenant context stay separated.</p>
            {createdTenant ? (
              <p className="admin-notice admin-notice--success">
                Tenant created: {createdTenant.name}
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </AdminPageLayout>
  );
}

export function TenantExperienceBuilderWorkspace({ tenantId }: { tenantId: string }) {
  const {
    selectedTenant
  } = useAdminTenantContext();
  const {
    data: experiences,
    isLoading,
    error,
    setData
  } = usePlatformAdminData<TenantExperience[]>(
    `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/experiences`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    layoutMode: 'workspace'
  });

  async function refresh() {
    const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/experiences`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await parseJsonError(response, 'Unable to refresh tenant experiences.'));
    }

    setData((await response.json()) as TenantExperience[]);
  }

  async function handleCreateExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/experiences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          key: form.key,
          name: form.name,
          description: form.description || null,
          layout: {
            tenant_id: tenantId,
            tenant_type: selectedTenant?.type ?? null,
            scope: 'tenant_experience',
            layout_mode: form.layoutMode
          }
        })
      });

      if (!response.ok) {
        throw new Error(await parseJsonError(response, 'Unable to save tenant experience.'));
      }

      await refresh();
      setForm({
        key: '',
        name: '',
        description: '',
        layoutMode: 'workspace'
      });
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : 'Unable to save tenant experience.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Experiences"
      description="Configure tenant-scoped Experiences and compose them from reusable Capabilities without embedding tenant logic into the admin interface."
    >
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title="Add tenant Experience"
          description="Create or update tenant-scoped Experiences. Capabilities are attached separately so the Experience layer stays composable."
        >
          <form className="space-y-4" onSubmit={handleCreateExperience}>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Experience key</span>
              <input
                className="admin-input mt-2"
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                placeholder="provider_portal"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Display name</span>
              <input
                className="admin-input mt-2"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Provider Portal"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Description</span>
              <textarea
                className="admin-input mt-2 min-h-[6rem]"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Central operational workspace for office staff."
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Layout mode</span>
              <select
                className="admin-input mt-2"
                value={form.layoutMode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, layoutMode: event.target.value }))
                }
              >
                <option value="workspace">Workspace</option>
                <option value="dashboard">Dashboard</option>
                <option value="notion-builder">Builder Canvas</option>
              </select>
            </label>
            {submitError ? <p className="admin-notice admin-notice--danger">{submitError}</p> : null}
            <button type="submit" disabled={isSubmitting} className="admin-button admin-button--primary">
              {isSubmitting ? 'Saving experience...' : 'Save experience'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Tenant Experience library"
          description="Experience objects belong to the current tenant only and should never inherit from a different tenant context."
        >
          {isLoading ? (
            <AdminLoadingState />
          ) : error ? (
            <AdminErrorState title="Unable to load tenant experiences" description={error} />
          ) : (experiences?.length ?? 0) === 0 ? (
            <AdminEmptyState
              title="No Experiences configured"
              description="Create the first Experience for this tenant, then assign Capabilities in the next workspace."
            />
          ) : (
            <div className="space-y-3">
              {experiences?.map((experience) => (
                <div key={experience.id} className="admin-list-row">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-admin-text">{experience.name}</h3>
                      <span className="admin-badge admin-badge--neutral">{experience.key}</span>
                      <span className="admin-badge admin-badge--neutral">{prettyScope(experience.scope)}</span>
                    </div>
                    <p className="text-sm text-admin-muted">
                      {experience.description || 'No description provided.'}
                    </p>
                    <p className="text-xs text-admin-muted">
                      {experience.capabilityConfigs.length} capability assignment
                      {experience.capabilityConfigs.length === 1 ? '' : 's'}
                    </p>
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

export function TenantCapabilitiesWorkspace({ tenantId }: { tenantId: string }) {
  const {
    data: matrix,
    isLoading,
    error,
    setData
  } = usePlatformAdminData<TenantCapabilityMatrix>(
    `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/capabilities`
  );
  const [selectedExperienceId, setSelectedExperienceId] = useState('');
  const [draft, setDraft] = useState<Record<string, { enabled: boolean; displayOrder: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (matrix?.experiences?.length && !matrix.experiences.some((item) => item.id === selectedExperienceId)) {
      setSelectedExperienceId(matrix.experiences[0]?.id ?? '');
    }
  }, [matrix, selectedExperienceId]);

  useEffect(() => {
    const selectedExperience = matrix?.experiences.find((item) => item.id === selectedExperienceId);
    if (!selectedExperience) {
      setDraft({});
      return;
    }

    const nextDraft = Object.fromEntries(
      matrix!.capabilities.map((capability, index) => {
        const match = selectedExperience.capabilityConfigs.find(
          (configItem) => configItem.capabilityId === capability.id
        );

        return [
          capability.id,
          {
            enabled: match?.enabled ?? false,
            displayOrder: match?.displayOrder ?? index
          }
        ];
      })
    );

    setDraft(nextDraft);
  }, [matrix, selectedExperienceId]);

  async function refresh() {
    const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/capabilities`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await parseJsonError(response, 'Unable to refresh tenant capabilities.'));
    }

    setData((await response.json()) as TenantCapabilityMatrix);
  }

  async function handleSave() {
    if (!selectedExperienceId || !matrix) {
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/experiences/${selectedExperienceId}/capabilities`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            capabilities: matrix.capabilities.map((capability, index) => ({
              capabilityId: capability.id,
              enabled: draft[capability.id]?.enabled ?? false,
              displayOrder: draft[capability.id]?.displayOrder ?? index,
              config: {
                tenant_id: tenantId,
                tenant_type: matrix.tenant.tenantTypeCode,
                scope: 'tenant_capability'
              }
            }))
          })
        }
      );

      if (!response.ok) {
        throw new Error(await parseJsonError(response, 'Unable to save capability assignments.'));
      }

      await refresh();
      setSaveSuccess('Capability assignments saved.');
    } catch (nextError) {
      setSaveError(
        nextError instanceof Error ? nextError.message : 'Unable to save capability assignments.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selectedExperience = matrix?.experiences.find((item) => item.id === selectedExperienceId) ?? null;

  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Capabilities"
      description="Assign global Capabilities to tenant Experiences and keep capability configuration tenant-scoped, metadata-driven, and reorderable."
      actions={
        <button type="button" onClick={handleSave} disabled={isSaving || !selectedExperience} className="admin-button admin-button--primary">
          {isSaving ? 'Saving...' : 'Save assignments'}
        </button>
      }
    >
      {isLoading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminErrorState title="Unable to load tenant capabilities" description={error} />
      ) : !matrix ? (
        <AdminEmptyState title="No tenant capability matrix" description="This tenant has not been configured yet." />
      ) : (
        <div className="space-y-6">
          <AdminActionBar>
            <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_repeat(3,minmax(0,1fr))]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Experience</span>
                <select
                  className="admin-input mt-2"
                  value={selectedExperienceId}
                  onChange={(event) => setSelectedExperienceId(event.target.value)}
                >
                  {matrix.experiences.map((experience) => (
                    <option key={experience.id} value={experience.id}>
                      {experience.name}
                    </option>
                  ))}
                </select>
              </label>
              <AdminStatCard label="Tenant" value={matrix.tenant.name} detail={prettyTenantType(matrix.tenant.tenantTypeCode)} />
              <AdminStatCard label="Registry capabilities" value={String(matrix.capabilities.length)} detail="Global definitions" />
              <AdminStatCard label="Experiences" value={String(matrix.experiences.length)} detail="Tenant-scoped surfaces" />
            </div>
          </AdminActionBar>

          {saveError ? <p className="admin-notice admin-notice--danger">{saveError}</p> : null}
          {saveSuccess ? <p className="admin-notice admin-notice--success">{saveSuccess}</p> : null}

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              title="Capability assignment"
              description="Toggle Capabilities on or off for the selected Experience. Display order controls render order for metadata-driven Experience composition."
            >
              <div className="space-y-3">
                {matrix.capabilities.map((capability, index) => (
                  <div key={capability.id} className="admin-list-row">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-admin-text">{capability.name}</h3>
                          <span className="admin-badge admin-badge--neutral">{capability.id}</span>
                          <span className="admin-badge admin-badge--neutral">{capability.category}</span>
                        </div>
                        <p className="text-sm text-admin-muted">
                          {capability.description || 'No description provided.'}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium text-admin-text">
                        <input
                          type="checkbox"
                          checked={draft[capability.id]?.enabled ?? false}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              [capability.id]: {
                                enabled: event.target.checked,
                                displayOrder: current[capability.id]?.displayOrder ?? index
                              }
                            }))
                          }
                        />
                        Enabled
                      </label>
                      <label className="block">
                        <span className="sr-only">Display order</span>
                        <input
                          type="number"
                          className="admin-input"
                          value={draft[capability.id]?.displayOrder ?? index}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              [capability.id]: {
                                enabled: current[capability.id]?.enabled ?? false,
                                displayOrder: Number(event.target.value) || 0
                              }
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Selected Experience"
              description="Assignment context for the current tenant-scoped Experience."
            >
              {selectedExperience ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-admin-text">{selectedExperience.name}</h3>
                    <p className="mt-1 text-sm text-admin-muted">
                      {selectedExperience.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="admin-badge admin-badge--neutral">{selectedExperience.key}</span>
                    <span className="admin-badge admin-badge--neutral">{prettyScope(selectedExperience.scope)}</span>
                    <span className="admin-badge admin-badge--neutral">
                      {selectedExperience.capabilityConfigs.length} assigned
                    </span>
                  </div>
                  <p className="text-sm text-admin-muted">
                    Use this page as the composable Experience Builder layer. Capabilities remain globally defined, but configuration is saved at tenant scope.
                  </p>
                </div>
              ) : (
                <AdminEmptyState title="No Experience selected" description="Select an Experience to manage its Capabilities." />
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

function useTenantSettings(tenantId: string) {
  return usePlatformAdminData<TenantSettingsPayload>(
    `${config.apiBaseUrl}/api/tenant-admin/settings?tenant_id=${tenantId}`
  );
}

export function TenantUsersPersonasWorkspace({ tenantId }: { tenantId: string }) {
  const { data, isLoading, error } = useTenantSettings(tenantId);

  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Users & Personas"
      description="Tenant-scoped administrative users, persona-aligned roles, and assignment visibility for the selected tenant."
    >
      {isLoading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminErrorState title="Unable to load tenant users" description={error} />
      ) : !data ? (
        <AdminEmptyState title="No tenant users found" description="This tenant does not have visible user assignments yet." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <AdminStatCard label="Users" value={String(data.users.length)} detail="Tenant-scoped identities" />
            <AdminStatCard label="Active" value={String(data.users.filter((user) => user.isActive).length)} detail="Currently enabled" />
            <AdminStatCard label="Persona coverage" value={String(new Set(data.users.flatMap((user) => user.roles)).size)} detail="Distinct roles/personas" />
          </div>

          <SectionCard
            title="User directory"
            description="Seeded and manually created users share the same tenant-scoped identity model and should authenticate the same way."
          >
            <div className="admin-table-shell overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Roles / Personas</th>
                    <th className="px-3 py-3">Permissions</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id} className="admin-table-row">
                      <td className="px-3 py-4">
                        <div>
                          <div className="font-medium text-admin-text">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-admin-muted">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-admin-text">{joinList(user.roles)}</td>
                      <td className="px-3 py-4 text-admin-muted">{joinList(user.permissions)}</td>
                      <td className="px-3 py-4">
                        <span className={getStatusTone(user.isActive ? 'active' : 'inactive')}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </AdminPageLayout>
  );
}

export function TenantDataIntegrationsWorkspace({ tenantId }: { tenantId: string }) {
  const { data, isLoading, error } = useTenantSettings(tenantId);

  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Data & Integrations"
      description="Tenant-scoped data exchange, integration posture, and operational connectors for the selected tenant."
    >
      {isLoading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminErrorState title="Unable to load tenant integrations" description={error} />
      ) : !data ? (
        <AdminEmptyState title="No integration data available" description="The tenant integration profile could not be loaded." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Integrations"
            description="Tenant-level integrations and webhooks remain isolated to the selected tenant."
          >
            <div className="space-y-3">
              {[...data.integrations, ...data.webhooks].map((connector) => (
                <div key={connector.id} className="admin-list-row">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-admin-text">{connector.name}</h3>
                        <span className="admin-badge admin-badge--neutral">{connector.adapterKey}</span>
                      </div>
                      <p className="text-sm text-admin-muted">
                        Last sync: {prettyDate(connector.lastSyncAt)} • Last health check: {prettyDate(connector.lastHealthCheckAt)}
                      </p>
                    </div>
                    <span className={getStatusTone(connector.status)}>{connector.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Workspace notes"
            description="This screen is tenant-scoped by design and should never mix connector or data context from another tenant."
          >
            <ul className="space-y-3 text-sm text-admin-muted">
              <li>Scope: tenant-specific data sources and operational integrations</li>
              <li>Branding: inherited from the current tenant only</li>
              <li>Identity: tenant-scoped access and configuration only</li>
            </ul>
          </SectionCard>
        </div>
      )}
    </AdminPageLayout>
  );
}

export function TenantLimitsUsageWorkspace({ tenantId }: { tenantId: string }) {
  const { data, isLoading, error } = usePlatformAdminData<TenantSummary>(
    `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}`
  );

  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Limits & Usage"
      description="Usage posture, quota context, and tenant-level defaults tied to the current tenant only."
    >
      {isLoading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminErrorState title="Unable to load limits and usage" description={error} />
      ) : !data ? (
        <AdminEmptyState title="No tenant data found" description="Unable to load tenant quota details." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <AdminStatCard label="Status" value={data.status} detail={prettyTenantType(data.type)} />
            <AdminStatCard label="User limit" value={String(data.quotaUsers ?? '—')} detail="Configured quota" />
            <AdminStatCard label="Member / Patient limit" value={String(data.quotaMembers ?? '—')} detail="Configured quota" />
            <AdminStatCard label="Storage (GB)" value={String(data.quotaStorageGb ?? '—')} detail="Configured quota" />
          </div>
          <SectionCard
            title="Tenant posture"
            description="Templates and quotas shape the starting point, but all final tenant configuration remains editable after creation."
          >
            <div className="space-y-3 text-sm text-admin-muted">
              <p>Tenant name: <span className="font-medium text-admin-text">{data.name}</span></p>
              <p>Tenant type: <span className="font-medium text-admin-text">{prettyTenantType(data.type)}</span></p>
              <p>Template id: <span className="font-medium text-admin-text">{data.templateId ?? 'No template attached'}</span></p>
              <p>Created: <span className="font-medium text-admin-text">{prettyDate(data.createdAt)}</span></p>
            </div>
          </SectionCard>
        </div>
      )}
    </AdminPageLayout>
  );
}
