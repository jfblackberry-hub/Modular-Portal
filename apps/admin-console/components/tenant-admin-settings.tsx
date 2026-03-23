'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { apiBaseUrl, getAdminAuthHeaders, getStoredAdminUserId } from '../lib/api-auth';
import { portalPublicOrigin } from '../lib/public-runtime';
import { SectionCard } from './section-card';

const portalBaseUrl = portalPublicOrigin;

type Branding = {
  tenantId: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  customCss?: string | null;
  updatedAt?: string | null;
};

type NotificationSettings = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  digestEnabled: boolean;
  replyToEmail: string | null;
  senderName: string | null;
};

type TenantPurchasedModule =
  | 'member_home'
  | 'member_benefits'
  | 'member_claims'
  | 'member_id_card'
  | 'member_providers'
  | 'member_authorizations'
  | 'member_messages'
  | 'member_documents'
  | 'member_billing'
  | 'member_care_cost_estimator'
  | 'member_support'
  | 'billing_enrollment'
  | 'provider_dashboard'
  | 'provider_eligibility'
  | 'provider_authorizations'
  | 'provider_claims'
  | 'provider_payments'
  | 'provider_patients'
  | 'provider_documents'
  | 'provider_messages'
  | 'provider_support'
  | 'provider_admin';

const moduleCatalog: Array<{
  id: TenantPurchasedModule;
  label: string;
  audience: 'Member portal' | 'Provider portal' | 'Billing & Enrollment';
}> = [
  { id: 'member_home', label: 'Home', audience: 'Member portal' },
  { id: 'member_benefits', label: 'Benefits', audience: 'Member portal' },
  { id: 'member_claims', label: 'Claims', audience: 'Member portal' },
  { id: 'member_id_card', label: 'ID Card', audience: 'Member portal' },
  { id: 'member_providers', label: 'Find Care', audience: 'Member portal' },
  { id: 'member_authorizations', label: 'Authorizations', audience: 'Member portal' },
  { id: 'member_messages', label: 'Messages', audience: 'Member portal' },
  { id: 'member_documents', label: 'Documents', audience: 'Member portal' },
  { id: 'member_billing', label: 'Billing', audience: 'Member portal' },
  { id: 'member_care_cost_estimator', label: 'Care Cost Estimator', audience: 'Member portal' },
  { id: 'member_support', label: 'Support', audience: 'Member portal' },
  { id: 'billing_enrollment', label: 'Billing & Enrollment Module', audience: 'Billing & Enrollment' },
  { id: 'provider_dashboard', label: 'Dashboard', audience: 'Provider portal' },
  { id: 'provider_eligibility', label: 'Eligibility', audience: 'Provider portal' },
  { id: 'provider_authorizations', label: 'Authorizations', audience: 'Provider portal' },
  { id: 'provider_claims', label: 'Claims', audience: 'Provider portal' },
  { id: 'provider_payments', label: 'Payments', audience: 'Provider portal' },
  { id: 'provider_patients', label: 'Patients', audience: 'Provider portal' },
  { id: 'provider_documents', label: 'Resources', audience: 'Provider portal' },
  { id: 'provider_messages', label: 'Messages', audience: 'Provider portal' },
  { id: 'provider_support', label: 'Support', audience: 'Provider portal' },
  { id: 'provider_admin', label: 'Admin', audience: 'Provider portal' }
];

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

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
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
    status: string;
  };
  branding: Branding;
  employerGroupBranding: {
    employerKey?: string | null;
    employerGroupName: string | null;
    employerGroupLogoUrl: string | null;
    availableEmployerKeys?: string[];
  };
  notificationSettings: NotificationSettings;
  purchasedModules: TenantPurchasedModule[];
  integrations: Connector[];
  webhooks: Connector[];
  roles: Role[];
  users: User[];
};

function resolveBrandingAssetUrl(assetUrl: string, version?: string | null) {
  const normalized = assetUrl.startsWith('/')
    ? `${portalBaseUrl}${assetUrl}`
    : assetUrl;

  if (!version) {
    return normalized;
  }

  const separator = normalized.includes('?') ? '&' : '?';
  return `${normalized}${separator}v=${encodeURIComponent(version)}`;
}

function resolveBrandingAssetVersion(settings: SettingsPayload | null) {
  return settings?.branding.updatedAt ?? null;
}

function resolveBrandingLogoPreviewUrl(settings: SettingsPayload | null, logoUrl: string) {
  return resolveBrandingAssetUrl(logoUrl, resolveBrandingAssetVersion(settings));
}

function TenantAdminSettingsContent() {
  const searchParams = useSearchParams();
  const queryTenantId = searchParams.get('tenantId') ?? searchParams.get('tenant_id');
  const initialEmployerKey = searchParams.get('employer_key')?.trim() ?? '';
  const [selectedEmployerKey, setSelectedEmployerKey] = useState(initialEmployerKey);

  const tenantAdminQuery = new URLSearchParams();
  if (queryTenantId) {
    tenantAdminQuery.set('tenant_id', queryTenantId);
  }
  if (selectedEmployerKey.trim()) {
    tenantAdminQuery.set('employer_key', selectedEmployerKey.trim());
  }
  const tenantQuery = tenantAdminQuery.size > 0 ? `?${tenantAdminQuery.toString()}` : '';

  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [brandingForm, setBrandingForm] = useState({
    displayName: '',
    primaryColor: '#38bdf8',
    secondaryColor: '#ffffff',
    logoUrl: '',
    faviconUrl: '',
    customCss: ''
  });
  const [employerGroupBrandingForm, setEmployerGroupBrandingForm] = useState({
    employerGroupName: '',
    employerGroupLogoUrl: ''
  });
  const [notificationForm, setNotificationForm] = useState<NotificationSettings>({
    emailEnabled: true,
    inAppEnabled: true,
    digestEnabled: false,
    replyToEmail: '',
    senderName: ''
  });
  const [purchasedModulesForm, setPurchasedModulesForm] = useState<TenantPurchasedModule[]>(
    moduleCatalog.map((moduleItem) => moduleItem.id)
  );
  const [integrationForm, setIntegrationForm] = useState({
    adapterKey: 'rest-api',
    name: '',
    status: 'ACTIVE',
    config: '{\n  "baseUrl": "https://api.example.com",\n  "path": "/sync",\n  "method": "GET"\n}'
  });
  const [webhookForm, setWebhookForm] = useState({
    name: 'Tenant Event Webhook',
    endpointUrl: '',
    bearerToken: '',
    eventTypes: 'user.created,notification.sent',
    timeout: '5000',
    maxAttempts: '3'
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedEmployerGroupLogoFile, setSelectedEmployerGroupLogoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingEmployerGroupBranding, setIsSavingEmployerGroupBranding] = useState(false);
  const [isUploadingEmployerGroupLogo, setIsUploadingEmployerGroupLogo] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPurchasedModules, setIsSavingPurchasedModules] = useState(false);
  const [isCreatingIntegration, setIsCreatingIntegration] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [removingRoleKey, setRemovingRoleKey] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [roleAssignmentSearch, setRoleAssignmentSearch] = useState('');
  const userDirectoryWindowHeight = 'max-h-[36rem]';

  const loadSettings = useCallback(async function loadSettings() {
    if (!getStoredAdminUserId()) {
      setError(
        'Sign in with a tenant admin account to load tenant settings.'
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings${tenantQuery}`, {
        cache: 'no-store',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to load tenant admin settings.');
        setSettings(null);
        return;
      }

      const payload = (await response.json()) as SettingsPayload;
      setSettings(payload);
      if (!selectedEmployerKey && payload.employerGroupBranding.employerKey) {
        setSelectedEmployerKey(payload.employerGroupBranding.employerKey);
      }
      setBrandingForm({
        displayName: payload.branding.displayName,
        primaryColor: payload.branding.primaryColor,
        secondaryColor: payload.branding.secondaryColor,
        logoUrl: payload.branding.logoUrl ?? '',
        faviconUrl: payload.branding.faviconUrl ?? '',
        customCss: payload.branding.customCss ?? ''
      });
      setEmployerGroupBrandingForm({
        employerGroupName: payload.employerGroupBranding.employerGroupName ?? '',
        employerGroupLogoUrl: payload.employerGroupBranding.employerGroupLogoUrl ?? ''
      });
      setNotificationForm({
        ...payload.notificationSettings,
        replyToEmail: payload.notificationSettings.replyToEmail ?? '',
        senderName: payload.notificationSettings.senderName ?? ''
      });
      setPurchasedModulesForm(payload.purchasedModules);
      setSelectedLogoFile(null);
      setSelectedEmployerGroupLogoFile(null);
      setSelectedUserId((current) => current || payload.users[0]?.id || '');
      setSelectedRoleId((current) => current || payload.roles[0]?.id || '');
    } catch {
      setError('Tenant admin API unavailable. Start the local API and try again.');
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployerKey, tenantQuery]);

  async function handleLogoUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedLogoFile) {
      setError('Choose a logo file before uploading.');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedLogoFile);

      const response = await fetch(`${apiBaseUrl}/api/tenant-admin/branding/logo${tenantQuery}`, {
        method: 'POST',
        headers: {
          ...getAdminAuthHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to upload tenant logo.');
        return;
      }

      setSuccess('Tenant logo uploaded.');
      await loadSettings();
    } catch {
      setError('Unable to upload tenant logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleEmployerGroupLogoUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmployerGroupLogoFile) {
      setError('Choose an employer group logo file before uploading.');
      return;
    }

    setIsUploadingEmployerGroupLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedEmployerGroupLogoFile);

      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/employer-group-branding/logo${tenantQuery}`,
        {
          method: 'POST',
          headers: {
            ...getAdminAuthHeaders()
          },
          body: formData
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to upload employer group logo.');
        return;
      }

      setSuccess('Employer group logo uploaded.');
      await loadSettings();
    } catch {
      setError('Unable to upload employer group logo.');
    } finally {
      setIsUploadingEmployerGroupLogo(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleBrandingSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingBranding(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tenant-admin/branding${tenantQuery}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          displayName: brandingForm.displayName,
          primaryColor: brandingForm.primaryColor,
          secondaryColor: brandingForm.secondaryColor,
          logoUrl: brandingForm.logoUrl || null,
          faviconUrl: brandingForm.faviconUrl || null,
          customCss: brandingForm.customCss
        })
      });

      if (!response.ok) {
        const raw = await response.text();
        let message = 'Unable to save branding settings.';

        if (raw) {
          try {
            const payload = JSON.parse(raw) as { message?: string };
            if (payload?.message) {
              message = payload.message;
            } else {
              message = raw;
            }
          } catch {
            message = raw;
          }
        }

        setError(message);
        return;
      }

      setSuccess('Branding settings saved.');
      await loadSettings();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save branding settings.');
    } finally {
      setIsSavingBranding(false);
    }
  }

  async function handleEmployerGroupBrandingSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingEmployerGroupBranding(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/employer-group-branding${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            employerGroupName: employerGroupBrandingForm.employerGroupName || null,
            employerGroupLogoUrl: employerGroupBrandingForm.employerGroupLogoUrl || null
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to save employer group branding settings.');
        return;
      }

      setSuccess('Employer group branding settings saved.');
      await loadSettings();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save employer group branding settings.'
      );
    } finally {
      setIsSavingEmployerGroupBranding(false);
    }
  }

  async function handleNotificationSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingNotifications(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/notification-settings${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            ...notificationForm,
            replyToEmail: notificationForm.replyToEmail || null,
            senderName: notificationForm.senderName || null
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to save notification settings.');
        return;
      }

      setSuccess('Notification settings saved.');
      await loadSettings();
    } catch {
      setError('Unable to save notification settings.');
    } finally {
      setIsSavingNotifications(false);
    }
  }

  async function handleIntegrationCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsCreatingIntegration(true);

    try {
      const config = JSON.parse(integrationForm.config) as Record<string, unknown>;
      const response = await fetch(`${apiBaseUrl}/api/connectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          adapterKey: integrationForm.adapterKey,
          name: integrationForm.name,
          status: integrationForm.status,
          config
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to create integration.');
        return;
      }

      setIntegrationForm((current) => ({
        ...current,
        name: ''
      }));
      setSuccess('Integration saved.');
      await loadSettings();
    } catch {
      setError('Integration config must be valid JSON.');
    } finally {
      setIsCreatingIntegration(false);
    }
  }

  async function handlePurchasedModulesSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSavingPurchasedModules(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/purchased-modules${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            modules: purchasedModulesForm
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to save purchased modules.');
        return;
      }

      setSuccess('Purchased module access saved.');
      await loadSettings();
    } catch {
      setError('Unable to save purchased module settings.');
    } finally {
      setIsSavingPurchasedModules(false);
    }
  }

  async function handleWebhookCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsCreatingWebhook(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/connectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          adapterKey: 'webhook',
          name: webhookForm.name,
          status: 'ACTIVE',
          config: {
            endpoint_url: webhookForm.endpointUrl,
            authentication: webhookForm.bearerToken
              ? {
                  type: 'bearer',
                  token: webhookForm.bearerToken
                }
              : null,
            event_types: webhookForm.eventTypes
              .split(',')
              .map((eventType) => eventType.trim())
              .filter(Boolean),
            retry_policy: {
              max_attempts: Number.parseInt(webhookForm.maxAttempts, 10) || 3
            },
            timeout: Number.parseInt(webhookForm.timeout, 10) || 5000
          }
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to create webhook configuration.');
        return;
      }

      setWebhookForm((current) => ({
        ...current,
        endpointUrl: '',
        bearerToken: ''
      }));
      setSuccess('Webhook configuration saved.');
      await loadSettings();
    } catch {
      setError('Unable to create webhook configuration.');
    } finally {
      setIsCreatingWebhook(false);
    }
  }

  async function handleRoleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsAssigningRole(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/users/${selectedUserId}/roles${tenantQuery}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            roleId: selectedRoleId
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to assign role.');
        return;
      }

      setSuccess('User role assignment saved.');
      await loadSettings();
    } catch {
      setError('Unable to assign role.');
    } finally {
      setIsAssigningRole(false);
    }
  }

  async function handleRoleRemove(userId: string, roleCode: string) {
    setError('');
    setSuccess('');
    const removalKey = `${userId}:${roleCode}`;
    setRemovingRoleKey(removalKey);

    try {
      const role = settings?.roles.find((item) => item.code === roleCode);

      if (!role) {
        setError(`Role ${roleCode} is not available for removal.`);
        return;
      }

      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/users/${userId}/roles/${role.id}${tenantQuery}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to remove role.');
        return;
      }

      setSuccess(`Removed ${roleCode} from user.`);
      await loadSettings();
    } catch {
      setError('Unable to remove role.');
    } finally {
      setRemovingRoleKey('');
    }
  }

  const filteredTenantUsers = useMemo(() => {
    if (!settings) {
      return [];
    }

    const normalizedSearch = userSearch.trim().toLowerCase();

    return settings.users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          user.firstName,
          user.lastName,
          user.email,
          ...user.roles
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        userStatusFilter === 'all' ||
        (userStatusFilter === 'active' ? user.isActive : !user.isActive);
      const matchesRole =
        userRoleFilter === 'all' || user.roles.includes(userRoleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [settings, userRoleFilter, userSearch, userStatusFilter]);
  const filteredRoleAssignmentUsers = useMemo(() => {
    if (!settings) {
      return [];
    }

    const normalizedSearch = roleAssignmentSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return settings.users;
    }

    return settings.users.filter((user) =>
      [user.firstName, user.lastName, user.email].join(' ').toLowerCase().includes(normalizedSearch)
    );
  }, [roleAssignmentSearch, settings]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
          Tenant Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
          Tenant configuration center
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
          Manage branding, notifications, integrations, webhooks, and tenant user
          role assignments for the active tenant scope only.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {isLoading ? (
        <SectionCard
          title="Loading tenant settings"
          description="Waiting for the tenant admin API response."
        >
          <p className="text-sm text-admin-muted">Loading...</p>
        </SectionCard>
      ) : settings ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <SectionCard
              title={settings.branding.displayName || settings.tenant.name}
              description="Healthplan Payer"
            >
              <p className="text-sm text-admin-muted">
                Employer group context:{' '}
                {settings.employerGroupBranding.employerGroupName || settings.tenant.name}
              </p>
            </SectionCard>
            <SectionCard
              title={`${settings.purchasedModules.length}/${moduleCatalog.length}`}
              description="Purchased modules"
            >
              <p className="text-sm text-admin-muted">Enabled for member/provider access</p>
            </SectionCard>
            <SectionCard title={String(settings.integrations.length)} description="Integrations">
              <p className="text-sm text-admin-muted">Configured adapters</p>
            </SectionCard>
            <SectionCard title={String(settings.webhooks.length)} description="Webhooks">
              <p className="text-sm text-admin-muted">External event subscribers</p>
            </SectionCard>
            <SectionCard title={String(settings.users.length)} description="Users">
              <p className="text-sm text-admin-muted">Tenant-scoped user accounts</p>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Branding"
              description="Changes are persisted to tenant branding records and applied dynamically."
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-admin-text">Tenant logo</p>
                  <p className="mt-1 text-sm text-admin-muted">
                    Upload a PNG, JPG, SVG, or WebP file to replace the current tenant logo.
                  </p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-admin-border bg-white">
                      {brandingForm.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveBrandingLogoPreviewUrl(settings, brandingForm.logoUrl)}
                          alt={`${brandingForm.displayName || settings.tenant.name} logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-admin-muted">No logo</span>
                      )}
                    </div>
                    <form className="flex-1 space-y-3" onSubmit={handleLogoUpload}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(event) =>
                          setSelectedLogoFile(event.target.files?.[0] ?? null)
                        }
                        className="block w-full text-sm text-admin-text file:mr-4 file:rounded-full file:border-0 file:bg-admin-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isUploadingLogo}
                          className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isUploadingLogo ? 'Uploading logo...' : 'Upload logo'}
                        </button>
                        {selectedLogoFile ? (
                          <p className="text-sm text-admin-muted">
                            Selected: {selectedLogoFile.name}
                          </p>
                        ) : null}
                      </div>
                    </form>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleBrandingSave}>
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={brandingForm.displayName}
                  onChange={(event) =>
                    setBrandingForm((current) => ({
                      ...current,
                      displayName: event.target.value
                    }))
                  }
                  placeholder="Display name"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={brandingForm.primaryColor}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        primaryColor: event.target.value
                      }))
                    }
                    placeholder="#0f6cbd"
                  />
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={brandingForm.secondaryColor}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        secondaryColor: event.target.value
                      }))
                    }
                    placeholder="#ffffff"
                  />
                </div>
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={brandingForm.logoUrl}
                  onChange={(event) =>
                    setBrandingForm((current) => ({
                      ...current,
                      logoUrl: event.target.value
                    }))
                  }
                  placeholder="/logos/tenant.svg"
                />
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={brandingForm.faviconUrl}
                  onChange={(event) =>
                    setBrandingForm((current) => ({
                      ...current,
                      faviconUrl: event.target.value
                    }))
                  }
                  placeholder="/logos/tenant.ico"
                />
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-admin-text">Custom portal CSS</p>
                    <p className="mt-1 text-sm text-admin-muted">
                      Paste a tenant-specific CSS override here to make it the default design across that tenant's portals.
                    </p>
                  </div>
                  <textarea
                    className="min-h-64 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={brandingForm.customCss}
                    onChange={(event) =>
                      setBrandingForm((current) => ({
                        ...current,
                        customCss: event.target.value
                      }))
                    }
                    placeholder=":root {\n  --tenant-primary-color: #0ea5a4;\n}\n\n.portal-card {\n  border-radius: 24px;\n}"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingBranding}
                  className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingBranding ? 'Saving branding...' : 'Save branding'}
                </button>
                </form>

                <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-admin-text">Employer group branding (E&B)</p>
                  <p className="mt-1 text-sm text-admin-muted">
                    Configure employer-group logo and name used in Billing & Enrollment experiences.
                  </p>
                  <div className="mt-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-admin-muted">
                      Employer Key Scope
                    </label>
                    <select
                      value={selectedEmployerKey}
                      onChange={(event) => {
                        setSelectedEmployerKey(event.target.value);
                        setSelectedEmployerGroupLogoFile(null);
                      }}
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    >
                      <option value="">Default employer scope</option>
                      {(settings.employerGroupBranding.availableEmployerKeys ?? []).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-admin-border bg-white">
                      {employerGroupBrandingForm.employerGroupLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveBrandingLogoPreviewUrl(settings, employerGroupBrandingForm.employerGroupLogoUrl)}
                          alt={`${employerGroupBrandingForm.employerGroupName || settings.tenant.name} employer logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-admin-muted">No logo</span>
                      )}
                    </div>
                    <form className="flex-1 space-y-3" onSubmit={handleEmployerGroupLogoUpload}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={(event) =>
                          setSelectedEmployerGroupLogoFile(event.target.files?.[0] ?? null)
                        }
                        className="block w-full text-sm text-admin-text file:mr-4 file:rounded-full file:border-0 file:bg-admin-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isUploadingEmployerGroupLogo}
                          className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isUploadingEmployerGroupLogo
                            ? 'Uploading employer logo...'
                            : 'Upload employer logo'}
                        </button>
                        {selectedEmployerGroupLogoFile ? (
                          <p className="text-sm text-admin-muted">
                            Selected: {selectedEmployerGroupLogoFile.name}
                          </p>
                        ) : null}
                      </div>
                    </form>
                  </div>

                  <form className="mt-4 space-y-4" onSubmit={handleEmployerGroupBrandingSave}>
                    <input
                      className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={employerGroupBrandingForm.employerGroupName}
                      onChange={(event) =>
                        setEmployerGroupBrandingForm((current) => ({
                          ...current,
                          employerGroupName: event.target.value
                        }))
                      }
                      placeholder="Employer group name"
                    />
                    <input
                      className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={employerGroupBrandingForm.employerGroupLogoUrl}
                      onChange={(event) =>
                        setEmployerGroupBrandingForm((current) => ({
                          ...current,
                          employerGroupLogoUrl: event.target.value
                        }))
                      }
                      placeholder="/tenant-assets/employer-group-logo.png"
                    />
                    <button
                      type="submit"
                      disabled={isSavingEmployerGroupBranding}
                      className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingEmployerGroupBranding
                        ? 'Saving employer branding...'
                        : 'Save employer branding'}
                    </button>
                  </form>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Notification Settings"
              description="Email and in-app delivery settings are read dynamically when notifications are queued or delivered."
            >
              <form className="space-y-4" onSubmit={handleNotificationSave}>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input
                    type="checkbox"
                    checked={notificationForm.emailEnabled}
                    onChange={(event) =>
                      setNotificationForm((current) => ({
                        ...current,
                        emailEnabled: event.target.checked
                      }))
                    }
                  />
                  Enable email notifications
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input
                    type="checkbox"
                    checked={notificationForm.inAppEnabled}
                    onChange={(event) =>
                      setNotificationForm((current) => ({
                        ...current,
                        inAppEnabled: event.target.checked
                      }))
                    }
                  />
                  Enable in-app notifications
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input
                    type="checkbox"
                    checked={notificationForm.digestEnabled}
                    onChange={(event) =>
                      setNotificationForm((current) => ({
                        ...current,
                        digestEnabled: event.target.checked
                      }))
                    }
                  />
                  Enable digest batching
                </label>
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={notificationForm.replyToEmail ?? ''}
                  onChange={(event) =>
                    setNotificationForm((current) => ({
                      ...current,
                      replyToEmail: event.target.value
                    }))
                  }
                  placeholder="reply-to@example.com"
                />
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={notificationForm.senderName ?? ''}
                  onChange={(event) =>
                    setNotificationForm((current) => ({
                      ...current,
                      senderName: event.target.value
                    }))
                  }
                  placeholder="Tenant support desk"
                />
                <button
                  type="submit"
                  disabled={isSavingNotifications}
                  className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingNotifications
                    ? 'Saving settings...'
                    : 'Save notification settings'}
                </button>
              </form>
            </SectionCard>
          </div>

          <SectionCard
            title="Purchased Modules"
            description="Choose which member and provider modules are available for this tenant. Turning a module off removes menu access and blocks direct route access."
          >
            <form className="space-y-4" onSubmit={handlePurchasedModulesSave}>
              <div className="grid gap-4 md:grid-cols-2">
                {(['Member portal', 'Provider portal', 'Billing & Enrollment'] as const).map((audience) => (
                  <div key={audience} className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-admin-text">{audience}</p>
                    <div className="mt-3 space-y-2">
                      {moduleCatalog
                        .filter((moduleItem) => moduleItem.audience === audience)
                        .map((moduleItem) => (
                          <label key={moduleItem.id} className="flex items-center gap-2 text-sm text-admin-text">
                            <input
                              type="checkbox"
                              checked={purchasedModulesForm.includes(moduleItem.id)}
                              onChange={(event) =>
                                setPurchasedModulesForm((current) =>
                                  event.target.checked
                                    ? [...current, moduleItem.id]
                                    : current.filter((item) => item !== moduleItem.id)
                                )
                              }
                            />
                            {moduleItem.label}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={isSavingPurchasedModules}
                className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingPurchasedModules ? 'Saving module access...' : 'Save module access'}
              </button>
            </form>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Integrations"
              description="Create tenant-scoped integration adapters. Configuration is saved directly to connector records."
            >
              <form className="space-y-4" onSubmit={handleIntegrationCreate}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <select
                    className="rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={integrationForm.adapterKey}
                    onChange={(event) =>
                      setIntegrationForm((current) => ({
                        ...current,
                        adapterKey: event.target.value
                      }))
                    }
                  >
                    <option value="rest-api">REST</option>
                    <option value="local-file">File</option>
                    <option value="sftp">SFTP</option>
                  </select>
                  <input
                    className="rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent sm:col-span-2"
                    value={integrationForm.name}
                    onChange={(event) =>
                      setIntegrationForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Claims sync adapter"
                    required
                  />
                </div>
                <textarea
                  className="min-h-52 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={integrationForm.config}
                  onChange={(event) =>
                    setIntegrationForm((current) => ({
                      ...current,
                      config: event.target.value
                    }))
                  }
                />
                <button
                  type="submit"
                  disabled={isCreatingIntegration}
                  className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreatingIntegration ? 'Saving integration...' : 'Create integration'}
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Webhook Configuration"
              description="Subscribe external systems to platform events using the webhook adapter."
            >
              <form className="space-y-4" onSubmit={handleWebhookCreate}>
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={webhookForm.name}
                  onChange={(event) =>
                    setWebhookForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="Webhook name"
                />
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={webhookForm.endpointUrl}
                  onChange={(event) =>
                    setWebhookForm((current) => ({
                      ...current,
                      endpointUrl: event.target.value
                    }))
                  }
                  placeholder="https://partner.example.com/events"
                  required
                />
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={webhookForm.bearerToken}
                  onChange={(event) =>
                    setWebhookForm((current) => ({
                      ...current,
                      bearerToken: event.target.value
                    }))
                  }
                  placeholder="Bearer token"
                />
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={webhookForm.eventTypes}
                  onChange={(event) =>
                    setWebhookForm((current) => ({
                      ...current,
                      eventTypes: event.target.value
                    }))
                  }
                  placeholder="user.created,notification.sent"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={webhookForm.timeout}
                    onChange={(event) =>
                      setWebhookForm((current) => ({
                        ...current,
                        timeout: event.target.value
                      }))
                    }
                    placeholder="5000"
                  />
                  <input
                    className="rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={webhookForm.maxAttempts}
                    onChange={(event) =>
                      setWebhookForm((current) => ({
                        ...current,
                        maxAttempts: event.target.value
                      }))
                    }
                    placeholder="3"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingWebhook}
                  className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreatingWebhook ? 'Saving webhook...' : 'Create webhook'}
                </button>
              </form>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <SectionCard
              title="User Roles"
              description="Assign existing roles to users in the current tenant."
            >
              <form className="space-y-4" onSubmit={handleRoleAssign}>
                <input
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={roleAssignmentSearch}
                  onChange={(event) => setRoleAssignmentSearch(event.target.value)}
                  placeholder="Search users before assigning a role"
                />
                <select
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  required
                >
                  {filteredRoleAssignmentUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs uppercase tracking-[0.18em] text-admin-muted">
                  {filteredRoleAssignmentUsers.length} matching {filteredRoleAssignmentUsers.length === 1 ? 'user' : 'users'} in role assignment list
                </p>
                <select
                  className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  required
                >
                  {settings.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isAssigningRole}
                  className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAssigningRole ? 'Assigning role...' : 'Assign role'}
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {settings.users
                  .find((user) => user.id === selectedUserId)
                  ?.roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => void handleRoleRemove(selectedUserId, role)}
                      disabled={removingRoleKey === `${selectedUserId}:${role}`}
                      className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingRoleKey === `${selectedUserId}:${role}` ? `Removing ${role}...` : `${role} Remove`}
                    </button>
                  )) ?? <span className="text-sm text-admin-muted">No roles assigned</span>}
              </div>
            </SectionCard>

            <SectionCard
              title="Active Configuration"
              description="Current tenant integrations, webhook subscriptions, and user access state."
            >
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-admin-muted">
                    Integrations
                  </h3>
                  <div className="mt-3 space-y-3">
                    {settings.integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
                      >
                        <p className="font-medium text-admin-text">{integration.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-admin-muted">
                          {integration.adapterKey} · {integration.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-admin-muted">
                    Webhooks
                  </h3>
                  <div className="mt-3 space-y-3">
                    {settings.webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
                      >
                        <p className="font-medium text-admin-text">{webhook.name}</p>
                        <pre className="mt-2 overflow-x-auto text-xs text-admin-muted">
                          {JSON.stringify(webhook.config, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-admin-muted">
                    Users
                  </h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.75fr))]">
                    <input
                      className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search users by name, email, or role"
                    />
                    <select
                      className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={userStatusFilter}
                      onChange={(event) =>
                        setUserStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
                      }
                    >
                      <option value="all">All statuses</option>
                      <option value="active">Active only</option>
                      <option value="inactive">Inactive only</option>
                    </select>
                    <select
                      className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={userRoleFilter}
                      onChange={(event) => setUserRoleFilter(event.target.value)}
                    >
                      <option value="all">All roles</option>
                      {settings.roles.map((role) => (
                        <option key={role.id} value={role.code}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.18em] text-admin-muted sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        Showing {filteredTenantUsers.length} matching {filteredTenantUsers.length === 1 ? 'user' : 'users'}
                      </p>
                      <p>Scrollable directory window</p>
                    </div>
                  </div>
                  <div className={`mt-3 ${userDirectoryWindowHeight} space-y-3 overflow-y-auto pr-1 overscroll-contain`}>
                    {filteredTenantUsers.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-admin-border px-4 py-5 text-sm text-admin-muted">
                        No users match the current filters.
                      </p>
                    ) : filteredTenantUsers.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
                      >
                        <p className="font-medium text-admin-text">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-1 text-sm text-admin-muted">{user.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-admin-muted">
                          Roles:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <button
                                key={`${user.id}-${role}`}
                                type="button"
                                onClick={() => void handleRoleRemove(user.id, role)}
                                disabled={removingRoleKey === `${user.id}:${role}`}
                                className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {removingRoleKey === `${user.id}:${role}` ? `Removing ${role}...` : `${role} Remove`}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-admin-muted">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function TenantAdminSettings() {
  return (
    <Suspense fallback={<div className="min-h-[20rem]" aria-hidden="true" />}>
      <TenantAdminSettingsContent />
    </Suspense>
  );
}
