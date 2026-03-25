'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { config, getAdminAuthHeaders } from '../lib/api-auth';
import { AdminPageLayout } from './admin-ui';
import { SectionCard } from './section-card';

type PreviewMode = 'READ_ONLY' | 'FUNCTIONAL';
type PortalType = 'member' | 'provider' | 'broker' | 'employer';

type PersonaCandidate = {
  userId: string;
  label: string;
  portalType: PortalType;
  persona: string;
  tenantId: string;
};

type TenantCatalog = {
  id: string;
  name: string;
  personas: PersonaCandidate[];
};

type CatalogPayload = {
  tenants: TenantCatalog[];
};

type PreviewSessionRecord = {
  sessionId: string;
  tenantId: string;
  tenantName: string;
  portalType: PortalType;
  persona: string;
  mode: PreviewMode;
  createdAt: string;
  expiresAt: string;
  launchUrl: string;
};

export function PreviewSessionControl() {
  const [catalog, setCatalog] = useState<CatalogPayload>({ tenants: [] });
  const [sessions, setSessions] = useState<PreviewSessionRecord[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [portalType, setPortalType] = useState<PortalType>('member');
  const [persona, setPersona] = useState('');
  const [mode, setMode] = useState<PreviewMode>('READ_ONLY');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [catalogResponse, sessionsResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/platform-admin/preview-sessions/catalog`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        }),
        fetch(`${config.apiBaseUrl}/platform-admin/preview-sessions`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        })
      ]);

      if (!catalogResponse.ok || !sessionsResponse.ok) {
        throw new Error('Unable to load preview session controls.');
      }

      const [catalogPayload, sessionsPayload] = (await Promise.all([
        catalogResponse.json(),
        sessionsResponse.json()
      ])) as [CatalogPayload, PreviewSessionRecord[]];

      setCatalog(catalogPayload);
      setSessions(sessionsPayload);
      setTenantId((current) => current || catalogPayload.tenants[0]?.id || '');
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load preview session controls.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedTenant = useMemo(
    () => catalog.tenants.find((tenant) => tenant.id === tenantId) ?? null,
    [catalog.tenants, tenantId]
  );

  const portalOptions = useMemo(() => {
    const values = new Set(
      (selectedTenant?.personas ?? []).map((candidate) => candidate.portalType)
    );
    return Array.from(values);
  }, [selectedTenant]);

  const personaOptions = useMemo(
    () =>
      (selectedTenant?.personas ?? []).filter(
        (candidate) => candidate.portalType === portalType
      ),
    [portalType, selectedTenant]
  );

  useEffect(() => {
    if (!portalOptions.includes(portalType)) {
      setPortalType((portalOptions[0] as PortalType | undefined) ?? 'member');
    }
  }, [portalOptions, portalType]);

  useEffect(() => {
    if (!personaOptions.some((candidate) => candidate.persona === persona)) {
      setPersona(personaOptions[0]?.persona ?? '');
    }
  }, [persona, personaOptions]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/preview-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          tenantId,
          portalType,
          persona,
          mode
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to create preview session.');
      }

      setSuccess('Preview session created. Open it in a separate portal window.');
      await loadData();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to create preview session.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEndSession(sessionId: string) {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/preview-sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to end preview session.');
      }

      setSuccess('Preview session ended.');
      await loadData();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to end preview session.'
      );
    }
  }

  return (
    <AdminPageLayout
      eyebrow="Platform"
      title="Session controls"
      description="Create and revoke isolated preview sessions without embedding portal composition inside the admin console."
    >
      <div className="space-y-6">
        <SectionCard
          title="Create preview session"
          description="Session actions stay in the control plane. Portal rendering happens only in the separate portal surface."
        >
          <form className="space-y-4" onSubmit={handleCreate}>
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            >
              {catalog.tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={portalType}
              onChange={(event) => setPortalType(event.target.value as PortalType)}
            >
              {portalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
            >
              {personaOptions.map((candidate) => (
                <option key={candidate.persona} value={candidate.persona}>
                  {candidate.label}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={mode}
              onChange={(event) => setMode(event.target.value as PreviewMode)}
            >
              <option value="READ_ONLY">Read only</option>
              <option value="FUNCTIONAL">Functional</option>
            </select>
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
              disabled={isSubmitting || isLoading || !tenantId || !persona}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating session...' : 'Create preview session'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Active sessions"
          description="Open preview links in a separate portal window. The admin console does not embed portal navigation or shells."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading preview sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-admin-muted">No preview sessions active.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <article
                  key={session.sessionId}
                  className="rounded-2xl border border-admin-border bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-admin-text">
                        {session.tenantName} · {session.portalType}
                      </h2>
                      <p className="mt-1 text-sm text-admin-muted">
                        Persona {session.persona} · {session.mode}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-admin-muted">
                        Expires {new Date(session.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={session.launchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
                      >
                        Open portal
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleEndSession(session.sessionId)}
                        className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300"
                      >
                        End session
                      </button>
                    </div>
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
