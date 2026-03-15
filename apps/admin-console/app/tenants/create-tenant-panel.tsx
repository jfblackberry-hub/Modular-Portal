'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';

type TenantStatus = 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';

const defaultBrandingConfig = JSON.stringify(
  {
    primaryColor: '#0f6cbd',
    logoUrl: '/logos/example.svg'
  },
  null,
  2
);

export function CreateTenantPanel() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<TenantStatus>('ONBOARDING');
  const [brandingConfig, setBrandingConfig] = useState(defaultBrandingConfig);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const parsedBrandingConfig = JSON.parse(brandingConfig) as Record<
        string,
        unknown
      >;

      const response = await fetch(`${apiBaseUrl}/platform-admin/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          name,
          slug,
          status,
          brandingConfig: parsedBrandingConfig
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to create tenant.');
        return;
      }

      setName('');
      setSlug('');
      setStatus('ONBOARDING');
      setBrandingConfig(defaultBrandingConfig);
      setSuccess('Tenant created. Return to Tenant Health to review the new tenant.');
    } catch {
      setError('Branding config must be valid JSON.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
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

      <SectionCard
        title="Create tenant"
        description="Provision a new tenant record in its own focused workflow instead of crowding the tenant health screen."
      >
        <form className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]" onSubmit={handleCreateTenant}>
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Name</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Health Plan"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Slug</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="acme-health-plan"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Status</span>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating tenant...' : 'Create tenant'}
            </button>
          </div>

          <div className="rounded-3xl border border-admin-border bg-slate-50 p-5">
            <p className="text-base font-semibold text-admin-text">Branding config</p>
            <p className="mt-1 text-sm text-admin-muted">
              Seed the initial tenant theme and logo configuration for the member portal and admin surfaces.
            </p>
            <textarea
              className="mt-4 min-h-72 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 font-mono text-sm text-admin-text outline-none focus:border-admin-accent"
              value={brandingConfig}
              onChange={(event) => setBrandingConfig(event.target.value)}
              required
            />
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
