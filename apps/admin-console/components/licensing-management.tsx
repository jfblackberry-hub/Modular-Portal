'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { apiBaseUrl, config, getAdminAuthHeaders, getStoredAdminUserId } from '../lib/api-auth';
import { SectionCard } from './section-card';

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

type TenantOption = {
  id: string;
  name: string;
  slug?: string;
};

type SettingsPayload = {
  tenant: {
    id: string;
    name: string;
  };
  purchasedModules: TenantPurchasedModule[];
};

const moduleCatalog: Array<{
  id: TenantPurchasedModule;
  label: string;
  audience: 'Member portal' | 'Clinic portal' | 'Billing & Enrollment';
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
  { id: 'billing_enrollment', label: 'Billing & Enrollment', audience: 'Billing & Enrollment' },
  { id: 'provider_dashboard', label: 'Dashboard', audience: 'Clinic portal' },
  { id: 'provider_eligibility', label: 'Eligibility', audience: 'Clinic portal' },
  { id: 'provider_authorizations', label: 'Authorizations', audience: 'Clinic portal' },
  { id: 'provider_claims', label: 'Claims', audience: 'Clinic portal' },
  { id: 'provider_payments', label: 'Payments', audience: 'Clinic portal' },
  { id: 'provider_patients', label: 'Patients', audience: 'Clinic portal' },
  { id: 'provider_documents', label: 'Documents', audience: 'Clinic portal' },
  { id: 'provider_messages', label: 'Messages', audience: 'Clinic portal' },
  { id: 'provider_support', label: 'Support', audience: 'Clinic portal' },
  { id: 'provider_admin', label: 'Admin', audience: 'Clinic portal' }
];

export function LicensingManagement({
  scope
}: {
  scope: 'platform' | 'tenant';
}) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedTenantName, setSelectedTenantName] = useState('');
  const [purchasedModules, setPurchasedModules] = useState<TenantPurchasedModule[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tenantQuery = useMemo(() => {
    if (!selectedTenantId) {
      return '';
    }

    return `?tenant_id=${encodeURIComponent(selectedTenantId)}`;
  }, [selectedTenantId]);

  useEffect(() => {
    let isMounted = true;

    async function loadTenantOptions() {
      if (scope === 'tenant') {
        return;
      }

      try {
        const response = await fetch(`${config.apiBaseUrl}/platform-admin/tenants`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as TenantOption[];

        if (!isMounted) {
          return;
        }

        setTenants(payload);
        setSelectedTenantId((current) => current || payload[0]?.id || '');
      } catch {
        if (!isMounted) {
          return;
        }

        setTenants([]);
      }
    }

    void loadTenantOptions();

    return () => {
      isMounted = false;
    };
  }, [scope]);

  useEffect(() => {
    let isMounted = true;

    async function loadLicensing() {
      if (scope === 'platform' && !selectedTenantId) {
        setIsLoading(false);
        return;
      }

      if (scope === 'tenant' && !getStoredAdminUserId()) {
        setError('Sign in with a tenant admin account to manage licensing.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/tenant-admin/settings${tenantQuery}`,
          {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          }
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(payload?.message ?? 'Unable to load tenant licensing.');
        }

        const payload = (await response.json()) as SettingsPayload;

        if (!isMounted) {
          return;
        }

        setSelectedTenantName(payload.tenant.name);
        setSelectedTenantId((current) => current || payload.tenant.id);
        setPurchasedModules(payload.purchasedModules);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setPurchasedModules([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load tenant licensing.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLicensing();

    return () => {
      isMounted = false;
    };
  }, [scope, selectedTenantId, tenantQuery]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/purchased-modules${tenantQuery}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({ modules: purchasedModules })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to save tenant licensing.');
      }

      setSuccess('Licensing changes saved.');
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to save tenant licensing.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SectionCard
          title={selectedTenantName || 'Tenant scope'}
          description="Target tenant"
        >
          <p className="text-sm text-admin-muted">
            Licensing is enforced through tenant module entitlements only.
          </p>
        </SectionCard>
        <SectionCard
          title={String(purchasedModules.length)}
          description="Enabled modules"
        >
          <p className="text-sm text-admin-muted">
            Disabling a module removes the dependent portal capability path.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Licensing controls"
        description="Manage tenant module entitlements through API-backed control-plane actions."
      >
        <form className="space-y-6" onSubmit={handleSave}>
          {scope === 'platform' ? (
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Tenant</span>
              <select
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading licensing state...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(['Member portal', 'Provider portal', 'Billing & Enrollment'] as const).map(
                (audience) => (
                  <div
                    key={audience}
                    className="rounded-2xl border border-admin-border bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-admin-text">{audience}</p>
                    <div className="mt-3 space-y-2">
                      {moduleCatalog
                        .filter((moduleItem) => moduleItem.audience === audience)
                        .map((moduleItem) => (
                          <label
                            key={moduleItem.id}
                            className="flex items-center gap-2 text-sm text-admin-text"
                          >
                            <input
                              type="checkbox"
                              checked={purchasedModules.includes(moduleItem.id)}
                              onChange={(event) =>
                                setPurchasedModules((current) =>
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
                )
              )}
            </div>
          )}

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

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving licensing...' : 'Save licensing'}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
