'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { config, getAdminAuthHeaders } from '../../lib/api-auth';

type TenantStatus = 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
type TenantType = 'PAYER' | 'EMPLOYER' | 'BROKER' | 'MEMBER' | 'PROVIDER';
type ModuleAudience = 'Member portal' | 'Provider portal' | 'Billing & Enrollment';
type BillingVariant = 'commercial' | 'medicare' | 'medicaid' | 'employer_group';
type StepId = 'basics' | 'modules' | 'connectivity' | 'accounts' | 'defaults' | 'review';

type RoleRecord = {
  id: string;
  code: string;
  name: string;
};

type ModuleOption = {
  id: string;
  label: string;
  audience: ModuleAudience;
};

type ConnectorDraft = {
  id: string;
  adapterKey: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED' | 'ERROR';
  config: string;
};

type EmployerGroupDraft = {
  id: string;
  employerKey: string;
  employerGroupName: string;
  employerGroupLogoUrl: string;
};

type AccountDraft = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleCode: string;
  isActive: boolean;
};

type LogoUploadState = {
  [scopeId: string]: File | null;
};

type CreatedTenant = {
  id: string;
  name: string;
  slug: string;
};

const moduleCatalog: ModuleOption[] = [
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
  { id: 'billing_enrollment', label: 'Billing & Enrollment', audience: 'Billing & Enrollment' },
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

const steps: Array<{ id: StepId; label: string; description: string }> = [
  { id: 'basics', label: 'Basics', description: 'Identity, branding, and tenant status.' },
  { id: 'modules', label: 'Modules & Limits', description: 'Products, quotas, and employer groups.' },
  { id: 'connectivity', label: 'Connectivity', description: 'APIs, adapters, and endpoint setup.' },
  { id: 'accounts', label: 'Accounts', description: 'Broker, provider, employer, and admin access.' },
  { id: 'defaults', label: 'Defaults', description: 'Notifications and default operating behaviors.' },
  { id: 'review', label: 'Review', description: 'Provision and apply the full configuration plan.' }
];

const defaultModules = [
  'member_home',
  'member_benefits',
  'member_claims',
  'member_id_card',
  'member_providers',
  'member_support',
  'billing_enrollment',
  'provider_dashboard',
  'provider_documents',
  'provider_support'
];

const defaultConnectorConfig = `{
  "baseUrl": "https://api.partner.example.com",
  "path": "/eligibility",
  "method": "GET",
  "authType": "bearer"
}`;

const defaultCssSnippet = `:root {
  --tenant-primary-color: #0f6cbd;
  --tenant-secondary-color: #ffffff;
}`;

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createConnectorDraft(): ConnectorDraft {
  return {
    id: createId('connector'),
    adapterKey: 'rest-api',
    name: 'Eligibility API',
    status: 'ACTIVE',
    config: defaultConnectorConfig
  };
}

function createEmployerGroupDraft(): EmployerGroupDraft {
  return {
    id: createId('employer-group'),
    employerKey: '',
    employerGroupName: '',
    employerGroupLogoUrl: ''
  };
}

function createAccountDraft(roleCode = 'tenant_admin'): AccountDraft {
  return {
    id: createId('account'),
    firstName: '',
    lastName: '',
    email: '',
    roleCode,
    isActive: true
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatModuleAudience(audience: ModuleAudience) {
  return audience;
}

async function parseResponseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? fallback;
}

export function CreateTenantPanel() {
  const [currentStep, setCurrentStep] = useState<StepId>('basics');
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<TenantStatus>('ONBOARDING');
  const [tenantType, setTenantType] = useState<TenantType>('PAYER');
  const [displayName, setDisplayName] = useState('Example Health Plan');
  const [primaryColor, setPrimaryColor] = useState('#0f6cbd');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('/logos/example.svg');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [employerGroupLogoFiles, setEmployerGroupLogoFiles] =
    useState<LogoUploadState>({});
  const [customCss, setCustomCss] = useState(defaultCssSnippet);
  const [brokerAgencyName, setBrokerAgencyName] = useState('Northbridge Benefits Group');
  const [selectedModules, setSelectedModules] = useState<string[]>(defaultModules);
  const [quotaUsers, setQuotaUsers] = useState('250');
  const [quotaMembers, setQuotaMembers] = useState('25000');
  const [quotaStorageGb, setQuotaStorageGb] = useState('50');
  const [employerGroups, setEmployerGroups] = useState<EmployerGroupDraft[]>([
    {
      id: createId('employer-group'),
      employerKey: 'EMP-001',
      employerGroupName: 'Northstar Manufacturing',
      employerGroupLogoUrl: '/tenant-assets/northstar-logo.svg'
    }
  ]);
  const [connectors, setConnectors] = useState<ConnectorDraft[]>([createConnectorDraft()]);
  const [accounts, setAccounts] = useState<AccountDraft[]>([
    {
      id: createId('account'),
      firstName: 'Tenant',
      lastName: 'Admin',
      email: 'tenant.admin@new-tenant.local',
      roleCode: 'tenant_admin',
      isActive: true
    },
    {
      id: createId('account'),
      firstName: 'William',
      lastName: 'Schultz',
      email: 'broker@new-tenant.local',
      roleCode: 'broker',
      isActive: true
    },
    {
      id: createId('account'),
      firstName: 'Dr.',
      lastName: 'Lee',
      email: 'provider@new-tenant.local',
      roleCode: 'provider',
      isActive: true
    },
    {
      id: createId('account'),
      firstName: 'Employer',
      lastName: 'Admin',
      email: 'employer@new-tenant.local',
      roleCode: 'employer_group_admin',
      isActive: true
    }
  ]);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState('support@examplehealthplan.com');
  const [senderName, setSenderName] = useState('Example Health Plan');
  const [billingVariant, setBillingVariant] = useState<BillingVariant>('commercial');
  const [enrollmentEnabled, setEnrollmentEnabled] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [noticesEnabled, setNoticesEnabled] = useState(true);
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [brokerAssistEnabled, setBrokerAssistEnabled] = useState(true);
  const [allowCard, setAllowCard] = useState(true);
  const [allowBankAccount, setAllowBankAccount] = useState(true);
  const [allowPaperCheck, setAllowPaperCheck] = useState(false);
  const [allowEmployerInvoice, setAllowEmployerInvoice] = useState(false);
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [allowCardAutopay, setAllowCardAutopay] = useState(true);
  const [allowBankAutopay, setAllowBankAutopay] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<CreatedTenant | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        const response = await fetch(`${config.apiBaseUrl}/platform-admin/roles`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error(await parseResponseError(response, 'Unable to load role definitions.'));
        }

        const payload = (await response.json()) as RoleRecord[];

        if (!isMounted) {
          return;
        }

        setRoles(payload);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : 'Unable to load roles.');
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    }

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!name.trim()) {
      return;
    }

    if (!slug.trim()) {
      setSlug(slugify(name));
    }
  }, [name, slug]);

  const moduleGroups = useMemo(
    () =>
      ['Member portal', 'Provider portal', 'Billing & Enrollment'].map((audience) => ({
        audience: audience as ModuleAudience,
        modules: moduleCatalog.filter((moduleItem) => moduleItem.audience === audience)
      })),
    []
  );

  const roleIdByCode = useMemo(
    () => new Map(roles.map((role) => [role.code, role.id])),
    [roles]
  );

  const stepIndex = steps.findIndex((step) => step.id === currentStep);

  function updateConnector(id: string, field: keyof ConnectorDraft, value: string) {
    setConnectors((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function updateEmployerGroup(id: string, field: keyof EmployerGroupDraft, value: string) {
    setEmployerGroups((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function updateAccount(
    id: string,
    field: keyof AccountDraft,
    value: string | boolean
  ) {
    setAccounts((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function goToNextStep() {
    const nextStep = steps[stepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  }

  function goToPreviousStep() {
    const previousStep = steps[stepIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  }

  function toggleModule(moduleId: string) {
    setSelectedModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId]
    );
  }

  async function handleProvisionTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setCreatedTenant(null);
    setActivityLog([]);
    setIsSubmitting(true);

    try {
      const trimmedName = name.trim();
      const normalizedSlug = slugify(slug);

      if (!trimmedName || !normalizedSlug) {
        throw new Error('Tenant name and slug are required.');
      }

      const activeEmployerGroups = employerGroups.filter(
        (group) => group.employerKey.trim() && group.employerGroupName.trim()
      );
      const primaryEmployerGroup = activeEmployerGroups[0];

      const createResponse = await fetch(`${config.apiBaseUrl}/platform-admin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          name: trimmedName,
          slug: normalizedSlug,
          status,
          type: tenantType,
          brandingConfig: {
            displayName: displayName.trim() || trimmedName,
            primaryColor: primaryColor.trim(),
            secondaryColor: secondaryColor.trim(),
            ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
            ...(faviconUrl.trim() ? { faviconUrl: faviconUrl.trim() } : {}),
            ...(customCss.trim() ? { customCss: customCss.trim() } : {}),
            ...(brokerAgencyName.trim()
              ? { brokerAgencyName: brokerAgencyName.trim() }
              : {}),
            ...(primaryEmployerGroup?.employerGroupName.trim()
              ? { employerGroupName: primaryEmployerGroup.employerGroupName.trim() }
              : {}),
            ...(primaryEmployerGroup?.employerGroupLogoUrl.trim()
              ? { employerGroupLogoUrl: primaryEmployerGroup.employerGroupLogoUrl.trim() }
              : {}),
            ...(primaryEmployerGroup?.employerKey.trim()
              ? { employerKey: primaryEmployerGroup.employerKey.trim() }
              : {}),
            platformQuota: {
              ...(quotaUsers.trim() ? { users: Number.parseInt(quotaUsers, 10) } : {}),
              ...(quotaMembers.trim() ? { members: Number.parseInt(quotaMembers, 10) } : {}),
              ...(quotaStorageGb.trim() ? { storageGb: Number.parseInt(quotaStorageGb, 10) } : {})
            }
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(await parseResponseError(createResponse, 'Unable to create tenant.'));
      }

      const tenantPayload = (await createResponse.json()) as CreatedTenant & { id: string };
      const tenantId = tenantPayload.id;
      const tenantQuery = `?tenant_id=${encodeURIComponent(tenantId)}`;
      setActivityLog((current) => [...current, `Created tenant record for ${tenantPayload.name}.`]);

      const quotaResponse = await fetch(`${config.apiBaseUrl}/platform-admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          status,
          ...(quotaUsers.trim() ? { quotaUsers: Number.parseInt(quotaUsers, 10) } : {}),
          ...(quotaMembers.trim() ? { quotaMembers: Number.parseInt(quotaMembers, 10) } : {}),
          ...(quotaStorageGb.trim() ? { quotaStorageGb: Number.parseInt(quotaStorageGb, 10) } : {})
        })
      });

      if (!quotaResponse.ok) {
        throw new Error(await parseResponseError(quotaResponse, 'Unable to save tenant quotas.'));
      }
      setActivityLog((current) => [...current, 'Applied tenant size and user limits.']);

      const brandingResponse = await fetch(`${config.apiBaseUrl}/api/tenant-admin/branding${tenantQuery}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          displayName: displayName.trim() || trimmedName,
          primaryColor: primaryColor.trim(),
          secondaryColor: secondaryColor.trim(),
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          customCss: customCss.trim() || null
        })
      });

      if (!brandingResponse.ok) {
        throw new Error(await parseResponseError(brandingResponse, 'Unable to save tenant branding.'));
      }
      setActivityLog((current) => [...current, 'Saved branding and portal theme defaults.']);

      if (selectedLogoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', selectedLogoFile);

        const logoUploadResponse = await fetch(
          `${config.apiBaseUrl}/platform-admin/tenants/${tenantId}/logo`,
          {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: logoFormData
          }
        );

        if (!logoUploadResponse.ok) {
          throw new Error(
            await parseResponseError(logoUploadResponse, 'Unable to upload tenant logo.')
          );
        }

        setActivityLog((current) => [...current, 'Uploaded tenant logo asset.']);
      }

      const modulesResponse = await fetch(
        `${config.apiBaseUrl}/api/tenant-admin/purchased-modules${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            modules: selectedModules
          })
        }
      );

      if (!modulesResponse.ok) {
        throw new Error(await parseResponseError(modulesResponse, 'Unable to save modules.'));
      }
      setActivityLog((current) => [...current, 'Enabled the selected portal modules.']);

      const notificationResponse = await fetch(
        `${config.apiBaseUrl}/api/tenant-admin/notification-settings${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            emailEnabled,
            inAppEnabled,
            digestEnabled,
            replyToEmail: replyToEmail.trim() || null,
            senderName: senderName.trim() || null
          })
        }
      );

      if (!notificationResponse.ok) {
        throw new Error(
          await parseResponseError(notificationResponse, 'Unable to save notification defaults.')
        );
      }
      setActivityLog((current) => [...current, 'Saved notification behaviors and sender defaults.']);

      const billingResponse = await fetch(
        `${config.apiBaseUrl}/api/tenant-admin/billing-enrollment-module-config${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            variant: billingVariant,
            featureFlags: {
              enrollmentEnabled,
              paymentsEnabled,
              noticesEnabled,
              supportEnabled,
              brokerAssistEnabled
            },
            paymentOptions: {
              allowCard,
              allowBankAccount,
              allowPaperCheck,
              allowEmployerInvoice
            },
            autopay: {
              enabled: autopayEnabled,
              allowCardAutopay,
              allowBankAutopay
            }
          })
        }
      );

      if (!billingResponse.ok) {
        throw new Error(
          await parseResponseError(billingResponse, 'Unable to save module defaults.')
        );
      }
      setActivityLog((current) => [...current, 'Applied billing and enrollment default behaviors.']);

      for (const employerGroup of activeEmployerGroups) {
        const employerQuery = `${tenantQuery}&employer_key=${encodeURIComponent(
          employerGroup.employerKey.trim()
        )}`;
        const employerResponse = await fetch(
          `${config.apiBaseUrl}/api/tenant-admin/employer-group-branding${employerQuery}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAdminAuthHeaders()
            },
            body: JSON.stringify({
              employerGroupName: employerGroup.employerGroupName.trim(),
              employerGroupLogoUrl: employerGroup.employerGroupLogoUrl.trim() || null
            })
          }
        );

        if (!employerResponse.ok) {
          throw new Error(
            await parseResponseError(
              employerResponse,
              `Unable to save employer group ${employerGroup.employerGroupName}.`
            )
          );
        }

        const employerGroupLogoFile = employerGroupLogoFiles[employerGroup.id];

        if (employerGroupLogoFile) {
          const employerLogoFormData = new FormData();
          employerLogoFormData.append('file', employerGroupLogoFile);

          const employerLogoResponse = await fetch(
            `${config.apiBaseUrl}/api/tenant-admin/employer-group-branding/logo${employerQuery}`,
            {
              method: 'POST',
              headers: getAdminAuthHeaders(),
              body: employerLogoFormData
            }
          );

          if (!employerLogoResponse.ok) {
            throw new Error(
              await parseResponseError(
                employerLogoResponse,
                `Unable to upload employer group logo for ${employerGroup.employerGroupName}.`
              )
            );
          }
        }
      }

      if (activeEmployerGroups.length > 0) {
        setActivityLog((current) => [
          ...current,
          `Configured ${activeEmployerGroups.length} employer group defaults.`
        ]);
      }

      const activeConnectors = connectors.filter(
        (connector) => connector.name.trim() && connector.config.trim()
      );
      for (const connector of activeConnectors) {
        const parsedConfig = JSON.parse(connector.config) as Record<string, unknown>;
        const connectorResponse = await fetch(
          `${config.apiBaseUrl}/api/connectors${tenantQuery}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAdminAuthHeaders()
            },
            body: JSON.stringify({
              adapterKey: connector.adapterKey,
              name: connector.name.trim(),
              status: connector.status,
              config: parsedConfig
            })
          }
        );

        if (!connectorResponse.ok) {
          throw new Error(
            await parseResponseError(
              connectorResponse,
              `Unable to create connector ${connector.name}.`
            )
          );
        }
      }

      if (activeConnectors.length > 0) {
        setActivityLog((current) => [
          ...current,
          `Configured ${activeConnectors.length} APIs and connector endpoints.`
        ]);
      }

      const activeAccounts = accounts.filter(
        (account) =>
          account.email.trim() &&
          account.firstName.trim() &&
          account.lastName.trim() &&
          account.roleCode.trim()
      );
      for (const account of activeAccounts) {
        const roleId = roleIdByCode.get(account.roleCode);

        if (!roleId) {
          throw new Error(`Missing role definition for ${account.roleCode}.`);
        }

        const userResponse = await fetch(`${config.apiBaseUrl}/api/tenant-admin/users${tenantQuery}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            email: account.email.trim(),
            firstName: account.firstName.trim(),
            lastName: account.lastName.trim(),
            isActive: account.isActive
          })
        });

        if (!userResponse.ok) {
          throw new Error(
            await parseResponseError(
              userResponse,
              `Unable to create account ${account.email}.`
            )
          );
        }

        const createdUser = (await userResponse.json()) as { id: string };
        const roleResponse = await fetch(
          `${config.apiBaseUrl}/api/tenant-admin/users/${createdUser.id}/roles${tenantQuery}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAdminAuthHeaders()
            },
            body: JSON.stringify({
              roleId
            })
          }
        );

        if (!roleResponse.ok) {
          throw new Error(
            await parseResponseError(
              roleResponse,
              `Unable to assign ${account.roleCode} to ${account.email}.`
            )
          );
        }
      }

      if (activeAccounts.length > 0) {
        setActivityLog((current) => [
          ...current,
          `Provisioned ${activeAccounts.length} broker, provider, employer, and admin accounts.`
        ]);
      }

      setCreatedTenant(tenantPayload);
      setSuccess(
        `Provisioning complete. ${tenantPayload.name} is ready for tenant-level review and operational testing.`
      );
      setCurrentStep('review');
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Unable to complete tenant provisioning.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleProvisionTenant}>
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
          <p>{success}</p>
          {createdTenant ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/admin/platform/tenants/${createdTenant.id}`}
                className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Open tenant workspace
              </Link>
              <Link
                href={`/admin/tenant/configuration?tenantId=${createdTenant.id}`}
                className="rounded-full border border-emerald-300 bg-white px-4 py-2 font-semibold text-emerald-700"
              >
                Review tenant configuration
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <SectionCard
        title="Tenant configuration wizard"
        description="Walk through modules, limits, connectivity, employer groups, accounts, and default behaviors so new tenants are provisioned consistently."
      >
        <div className="grid gap-3 xl:grid-cols-6">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isComplete = index < stepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  isCurrent
                    ? 'border-admin-accent bg-admin-accent text-white'
                    : isComplete
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-admin-border bg-white text-admin-text hover:border-admin-accent'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold">{step.label}</p>
                <p className={`mt-1 text-xs ${isCurrent ? 'text-white/80' : 'text-admin-muted'}`}>
                  {step.description}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {currentStep === 'basics' ? (
        <SectionCard
          title="Tenant basics"
          description="Start with the tenant identity, branding baseline, and global admin-facing defaults."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Blue Horizon Health"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant slug</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="blue-horizon-health"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant status</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TenantStatus)}
                >
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant type</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={tenantType}
                  onChange={(event) => setTenantType(event.target.value as TenantType)}
                >
                  <option value="PAYER">Payer</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="BROKER">Broker</option>
                  <option value="MEMBER">Member</option>
                  <option value="PROVIDER">Provider</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Display name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Blue Horizon Health"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Broker agency name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={brokerAgencyName}
                  onChange={(event) => setBrokerAgencyName(event.target.value)}
                  placeholder="Northbridge Benefits Group"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-admin-text">Primary color</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    placeholder="#0f6cbd"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-admin-text">Secondary color</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={secondaryColor}
                    onChange={(event) => setSecondaryColor(event.target.value)}
                    placeholder="#ffffff"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Logo upload</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="mt-2 block w-full text-sm text-admin-text file:mr-4 file:rounded-full file:border-0 file:bg-admin-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  onChange={(event) => setSelectedLogoFile(event.target.files?.[0] ?? null)}
                />
                {selectedLogoFile ? (
                  <p className="mt-2 text-xs text-admin-muted">
                    Selected file: {selectedLogoFile.name}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Logo URL override</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="/tenant-assets/tenant-logo.svg"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Favicon URL</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={faviconUrl}
                  onChange={(event) => setFaviconUrl(event.target.value)}
                  placeholder="/tenant-assets/tenant-favicon.ico"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Custom portal CSS</span>
                <textarea
                  className="mt-2 min-h-56 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={customCss}
                  onChange={(event) => setCustomCss(event.target.value)}
                />
              </label>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 'modules' ? (
        <SectionCard
          title="Modules, limits, and employer scope"
          description="Choose which portal modules the tenant can use and define the default operational limits."
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              {moduleGroups.map((group) => (
                <div key={group.audience} className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-admin-text">
                    {formatModuleAudience(group.audience)}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {group.modules.map((moduleItem) => (
                      <label
                        key={moduleItem.id}
                        className="flex items-start gap-3 rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(moduleItem.id)}
                          onChange={() => toggleModule(moduleItem.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">{moduleItem.label}</p>
                          <p className="mt-1 text-xs text-admin-muted">{moduleItem.id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-admin-text">Limits</p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">User limit</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={quotaUsers}
                      onChange={(event) => setQuotaUsers(event.target.value)}
                      placeholder="250"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Member limit</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={quotaMembers}
                      onChange={(event) => setQuotaMembers(event.target.value)}
                      placeholder="25000"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Storage limit (GB)</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={quotaStorageGb}
                      onChange={(event) => setQuotaStorageGb(event.target.value)}
                      placeholder="50"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-admin-text">Employer groups</p>
                  <button
                    type="button"
                    onClick={() => setEmployerGroups((current) => [...current, createEmployerGroupDraft()])}
                    className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-semibold text-admin-text"
                  >
                    Add employer group
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {employerGroups.map((group, index) => (
                    <div key={group.id} className="rounded-2xl border border-admin-border bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-admin-text">Employer group {index + 1}</p>
                        {employerGroups.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEmployerGroups((current) => current.filter((item) => item.id !== group.id))
                            }
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-4 grid gap-3">
                        <input
                          className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={group.employerKey}
                          onChange={(event) =>
                            updateEmployerGroup(group.id, 'employerKey', event.target.value)
                          }
                          placeholder="EMP-001"
                        />
                        <input
                          className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={group.employerGroupName}
                          onChange={(event) =>
                            updateEmployerGroup(group.id, 'employerGroupName', event.target.value)
                          }
                          placeholder="Northstar Manufacturing"
                        />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="w-full text-sm text-admin-text file:mr-4 file:rounded-full file:border-0 file:bg-admin-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                          onChange={(event) =>
                            setEmployerGroupLogoFiles((current) => ({
                              ...current,
                              [group.id]: event.target.files?.[0] ?? null
                            }))
                          }
                        />
                        {employerGroupLogoFiles[group.id] ? (
                          <p className="text-xs text-admin-muted">
                            Selected logo: {employerGroupLogoFiles[group.id]?.name}
                          </p>
                        ) : null}
                        <input
                          className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={group.employerGroupLogoUrl}
                          onChange={(event) =>
                            updateEmployerGroup(group.id, 'employerGroupLogoUrl', event.target.value)
                          }
                          placeholder="/tenant-assets/northstar-logo.svg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 'connectivity' ? (
        <SectionCard
          title="Connectivity and endpoint configuration"
          description="Define initial API integrations, endpoints, webhook subscribers, or adapter-based connections."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-admin-muted">
                Each connector is provisioned as part of the tenant setup and can be tuned later in tenant configuration.
              </p>
              <button
                type="button"
                onClick={() => setConnectors((current) => [...current, createConnectorDraft()])}
                className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text"
              >
                Add connector
              </button>
            </div>

            {connectors.map((connector, index) => (
              <div key={connector.id} className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-admin-text">Connector {index + 1}</p>
                  {connectors.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setConnectors((current) => current.filter((item) => item.id !== connector.id))
                      }
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_0.95fr_0.5fr]">
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={connector.name}
                    onChange={(event) => updateConnector(connector.id, 'name', event.target.value)}
                    placeholder="Eligibility API"
                  />
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={connector.adapterKey}
                    onChange={(event) =>
                      updateConnector(connector.id, 'adapterKey', event.target.value)
                    }
                    placeholder="rest-api"
                  />
                  <select
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={connector.status}
                    onChange={(event) => updateConnector(connector.id, 'status', event.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
                <textarea
                  className="mt-4 min-h-48 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={connector.config}
                  onChange={(event) => updateConnector(connector.id, 'config', event.target.value)}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 'accounts' ? (
        <SectionCard
          title="Initial operational accounts"
          description="Provision the broker, provider, employer, and tenant admin accounts that need to exist on day one."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-admin-muted">
                Roles come from platform RBAC definitions and are assigned automatically during provisioning.
              </p>
              <button
                type="button"
                onClick={() => setAccounts((current) => [...current, createAccountDraft()])}
                className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text"
              >
                Add account
              </button>
            </div>

            {accounts.map((account, index) => (
              <div key={account.id} className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-admin-text">Account {index + 1}</p>
                  {accounts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAccounts((current) => current.filter((item) => item.id !== account.id))
                      }
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={account.firstName}
                    onChange={(event) => updateAccount(account.id, 'firstName', event.target.value)}
                    placeholder="William"
                  />
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={account.lastName}
                    onChange={(event) => updateAccount(account.id, 'lastName', event.target.value)}
                    placeholder="Schultz"
                  />
                  <input
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent xl:col-span-2"
                    value={account.email}
                    onChange={(event) => updateAccount(account.id, 'email', event.target.value)}
                    placeholder="broker@new-tenant.local"
                  />
                  <select
                    className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={account.roleCode}
                    onChange={(event) => updateAccount(account.id, 'roleCode', event.target.value)}
                    disabled={isLoadingRoles}
                  >
                    {(roles.length > 0
                      ? roles
                      : [
                          { id: 'tenant_admin', code: 'tenant_admin', name: 'Tenant Admin' },
                          { id: 'broker', code: 'broker', name: 'Broker' },
                          { id: 'provider', code: 'provider', name: 'Provider' },
                          {
                            id: 'employer_group_admin',
                            code: 'employer_group_admin',
                            name: 'Employer Group Admin'
                          }
                        ]
                    ).map((role) => (
                      <option key={role.code} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-3 rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text">
                    <input
                      type="checkbox"
                      checked={account.isActive}
                      onChange={(event) => updateAccount(account.id, 'isActive', event.target.checked)}
                    />
                    Active at provisioning
                  </label>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 'defaults' ? (
        <SectionCard
          title="Default behaviors"
          description="Set the initial communication, billing, and enrollment behaviors for the tenant before handoff."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-admin-border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-admin-text">Notification defaults</p>
              <label className="flex items-center gap-3 text-sm text-admin-text">
                <input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} />
                Email notifications enabled
              </label>
              <label className="flex items-center gap-3 text-sm text-admin-text">
                <input type="checkbox" checked={inAppEnabled} onChange={(event) => setInAppEnabled(event.target.checked)} />
                In-app notifications enabled
              </label>
              <label className="flex items-center gap-3 text-sm text-admin-text">
                <input type="checkbox" checked={digestEnabled} onChange={(event) => setDigestEnabled(event.target.checked)} />
                Digest notifications enabled
              </label>
              <input
                className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={replyToEmail}
                onChange={(event) => setReplyToEmail(event.target.value)}
                placeholder="support@tenant.com"
              />
              <input
                className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                placeholder="Tenant Sender Name"
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-admin-border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-admin-text">Billing & enrollment defaults</p>
              <select
                className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={billingVariant}
                onChange={(event) => setBillingVariant(event.target.value as BillingVariant)}
              >
                <option value="commercial">Commercial</option>
                <option value="medicare">Medicare</option>
                <option value="medicaid">Medicaid</option>
                <option value="employer_group">Employer Group</option>
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={enrollmentEnabled} onChange={(event) => setEnrollmentEnabled(event.target.checked)} />
                  Enrollment enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={paymentsEnabled} onChange={(event) => setPaymentsEnabled(event.target.checked)} />
                  Payments enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={noticesEnabled} onChange={(event) => setNoticesEnabled(event.target.checked)} />
                  Notices enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={supportEnabled} onChange={(event) => setSupportEnabled(event.target.checked)} />
                  Support enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text md:col-span-2">
                  <input type="checkbox" checked={brokerAssistEnabled} onChange={(event) => setBrokerAssistEnabled(event.target.checked)} />
                  Broker assist enabled
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowCard} onChange={(event) => setAllowCard(event.target.checked)} />
                  Card payments
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowBankAccount} onChange={(event) => setAllowBankAccount(event.target.checked)} />
                  Bank account payments
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowPaperCheck} onChange={(event) => setAllowPaperCheck(event.target.checked)} />
                  Paper check
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowEmployerInvoice} onChange={(event) => setAllowEmployerInvoice(event.target.checked)} />
                  Employer invoice
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text md:col-span-2">
                  <input type="checkbox" checked={autopayEnabled} onChange={(event) => setAutopayEnabled(event.target.checked)} />
                  Autopay enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowCardAutopay} onChange={(event) => setAllowCardAutopay(event.target.checked)} />
                  Card autopay
                </label>
                <label className="flex items-center gap-3 text-sm text-admin-text">
                  <input type="checkbox" checked={allowBankAutopay} onChange={(event) => setAllowBankAutopay(event.target.checked)} />
                  Bank autopay
                </label>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {currentStep === 'review' ? (
        <SectionCard
          title="Review provisioning plan"
          description="Confirm the tenant setup package before provisioning it across the admin APIs."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Tenant</p>
                <p className="mt-2 text-base font-semibold text-admin-text">{displayName || name || 'Untitled tenant'}</p>
                <p className="mt-1 text-sm text-admin-muted">Slug: {slug || 'not set'}</p>
                <p className="mt-1 text-sm text-admin-muted">Status: {status}</p>
                <p className="mt-1 text-sm text-admin-muted">Type: {tenantType}</p>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Configuration scope</p>
                <p className="mt-2 text-sm text-admin-text">{selectedModules.length} modules selected</p>
                <p className="mt-1 text-sm text-admin-text">{employerGroups.filter((group) => group.employerKey.trim() && group.employerGroupName.trim()).length} employer groups configured</p>
                <p className="mt-1 text-sm text-admin-text">{connectors.filter((connector) => connector.name.trim()).length} connectors defined</p>
                <p className="mt-1 text-sm text-admin-text">{accounts.filter((account) => account.email.trim()).length} initial accounts queued</p>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Limits</p>
                <p className="mt-2 text-sm text-admin-text">Users: {quotaUsers || 'Uncapped'}</p>
                <p className="mt-1 text-sm text-admin-text">Members: {quotaMembers || 'Uncapped'}</p>
                <p className="mt-1 text-sm text-admin-text">Storage: {quotaStorageGb ? `${quotaStorageGb} GB` : 'Uncapped'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-admin-border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">Provisioning activity</p>
              {activityLog.length === 0 ? (
                <p className="mt-3 text-sm text-admin-muted">
                  Start provisioning to generate a step-by-step execution log.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {activityLog.map((item) => (
                    <div key={item} className="rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-admin-muted">
          {isSubmitting
            ? 'Provisioning tenant configuration...'
            : `Step ${stepIndex + 1} of ${steps.length}`}
        </div>

        <div className="flex flex-wrap gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="rounded-full border border-admin-border bg-white px-5 py-3 text-sm font-semibold text-admin-text"
            >
              Back
            </button>
          ) : null}

          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Provisioning tenant...' : 'Provision tenant configuration'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
