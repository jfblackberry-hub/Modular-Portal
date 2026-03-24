'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { config, getAdminAuthHeaders } from '../lib/api-auth';
import { useAdminSession } from './admin-session-provider';
import { AdminPageLayout } from './admin-ui';
import { SectionCard } from './section-card';

type PreviewMode = 'READ_ONLY' | 'FUNCTIONAL';
type PortalType = 'member' | 'provider' | 'broker' | 'employer';
type WorkspaceView = 'tabs' | 'split' | 'grid';

type PersonaCandidate = {
  userId: string;
  label: string;
  portalType: PortalType;
  persona: string;
  roleCode: string;
  tenantId: string;
};

type TenantCatalog = {
  id: string;
  name: string;
  slug: string;
  personas: PersonaCandidate[];
};

type CatalogPayload = {
  tenants: TenantCatalog[];
};

type PreviewSessionRecord = {
  sessionId: string;
  adminUserId: string;
  adminUserEmail: string;
  tenantId: string;
  tenantName: string;
  subTenantId?: string | null;
  portalType: PortalType;
  persona: string;
  mode: PreviewMode;
  createdAt: string;
  expiresAt: string;
  launchUrl: string;
  targetUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

function isPreviewSessionRecord(
  value: PreviewSessionRecord | { message?: string } | null
): value is PreviewSessionRecord {
  return Boolean(value && 'sessionId' in value);
}

function labelPortalType(value: PortalType) {
  switch (value) {
    case 'provider':
      return 'Provider';
    case 'broker':
      return 'Broker';
    case 'employer':
      return 'Employer';
    case 'member':
    default:
      return 'Member';
  }
}

function resolvePreviewFrameUrl(launchUrl: string) {
  const resolved = new URL(launchUrl, config.serviceEndpoints.portal);
  const portalOrigin = new URL(config.serviceEndpoints.portal).origin;

  if (resolved.origin !== portalOrigin || !resolved.pathname.startsWith('/preview/')) {
    throw new Error('Preview launch URL must remain inside the isolated portal preview surface.');
  }

  return resolved.toString();
}

export function PreviewSessionWorkspace() {
  useAdminSession();
  const [catalog, setCatalog] = useState<CatalogPayload>({ tenants: [] });
  const [sessions, setSessions] = useState<PreviewSessionRecord[]>([]);
  const [view, setView] = useState<WorkspaceView>('tabs');
  const [activeSessionId, setActiveSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [portalType, setPortalType] = useState<PortalType>('member');
  const [persona, setPersona] = useState('');
  const [mode, setMode] = useState<PreviewMode>('READ_ONLY');
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({});
  const [draggingSessionId, setDraggingSessionId] = useState('');
  const sessionsRef = useRef<PreviewSessionRecord[]>([]);

  const loadWorkspace = useCallback(async function loadWorkspace() {
    setLoading(true);
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
        throw new Error('Unable to load the preview session workspace.');
      }

      const [catalogPayload, sessionsPayload] = (await Promise.all([
        catalogResponse.json(),
        sessionsResponse.json()
      ])) as [CatalogPayload, PreviewSessionRecord[]];

      setCatalog(catalogPayload);
      setSessions(sessionsPayload);
      setTenantId((current) => current || catalogPayload.tenants[0]?.id || '');
      setActiveSessionId((current) => current || sessionsPayload[0]?.sessionId || '');
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load the preview session workspace.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

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
    if (!personaOptions.some((option) => option.persona === persona)) {
      setPersona(personaOptions[0]?.persona ?? '');
    }
  }, [persona, personaOptions]);

  const duplicateSession = useCallback(async function duplicateSession(sessionId: string) {
    const response = await fetch(
      `${config.apiBaseUrl}/platform-admin/preview-sessions/${sessionId}/duplicate`,
      {
        method: 'POST',
        headers: getAdminAuthHeaders()
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | PreviewSessionRecord
      | { message?: string }
      | null;

    if (!response.ok || !isPreviewSessionRecord(payload)) {
      setError(
        payload && 'message' in payload
          ? payload.message ?? 'Unable to duplicate preview session.'
          : 'Unable to duplicate preview session.'
      );
      return;
    }

    setSessions((current) => [payload, ...current]);
    setActiveSessionId(payload.sessionId);
  }, []);

  const endSession = useCallback(async function endSession(sessionId: string) {
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
      setError(payload?.message ?? 'Unable to end preview session.');
      return;
    }

    const nextSessions = sessionsRef.current.filter((item) => item.sessionId !== sessionId);
    setSessions(nextSessions);
    setActiveSessionId((current) =>
      current === sessionId ? nextSessions[0]?.sessionId ?? '' : current
    );
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as
        | {
            type?: string;
            sessionId?: string;
            action?: 'end' | 'refresh' | 'duplicate' | 'popout';
          }
        | undefined;

      if (!data || data.type !== 'admin-preview:action' || !data.sessionId || !data.action) {
        return;
      }

      if (data.action === 'refresh') {
        setReloadKeys((current) => ({
          ...current,
          [data.sessionId!]: (current[data.sessionId!] ?? 0) + 1
        }));
        return;
      }

      if (data.action === 'popout') {
        const targetSession = sessionsRef.current.find((session) => session.sessionId === data.sessionId);
        if (targetSession) {
          window.open(resolvePreviewFrameUrl(targetSession.launchUrl), '_blank', 'noopener,noreferrer');
        }
        return;
      }

      if (data.action === 'duplicate') {
        void duplicateSession(data.sessionId);
        return;
      }

      if (data.action === 'end') {
        void endSession(data.sessionId);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [duplicateSession, endSession]);

  async function createSession() {
    setSubmitting(true);
    setError('');

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

      const payload = (await response.json().catch(() => null)) as
        | PreviewSessionRecord
        | { message?: string }
        | null;

      if (!response.ok || !isPreviewSessionRecord(payload)) {
        throw new Error(
          payload && 'message' in payload
            ? payload.message ?? 'Unable to create preview session.'
            : 'Unable to create preview session.'
        );
      }

      setSessions((current) => [payload, ...current]);
      setActiveSessionId(payload.sessionId);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to create preview session.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function moveSession(fromId: string, toId: string) {
    if (!fromId || !toId || fromId === toId) {
      return;
    }

    setSessions((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.sessionId === fromId);
      const toIndex = next.findIndex((item) => item.sessionId === toId);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  const visibleSessions =
    view === 'tabs'
      ? sessions.filter((item) => item.sessionId === activeSessionId)
      : view === 'split'
        ? sessions.slice(0, 2)
        : sessions.slice(0, 4);

  return (
    <AdminPageLayout
      eyebrow="Platform"
      title="Session Workspace"
      description="Launch multiple isolated tenant persona sessions without letting tenant theming or script execution bleed into the admin control plane."
      actions={
        <div className="rounded-full border border-admin-border bg-white px-4 py-3 text-sm text-admin-muted">
          {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
        </div>
      }
    >
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="Create preview session"
        description="Choose a tenant, persona, portal, and mode. Each session launches in an isolated iframe container with its own opaque preview handoff."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto]">
          <select className="admin-input" value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
            <option value="">Select tenant</option>
            {catalog.tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <select className="admin-input" value={portalType} onChange={(event) => setPortalType(event.target.value as PortalType)}>
            {portalOptions.map((option) => (
              <option key={option} value={option}>
                {labelPortalType(option)}
              </option>
            ))}
          </select>
          <select className="admin-input" value={persona} onChange={(event) => setPersona(event.target.value)}>
            <option value="">Select persona</option>
            {personaOptions.map((option) => (
              <option key={`${option.userId}-${option.persona}`} value={option.persona}>
                {option.label} · {option.persona}
              </option>
            ))}
          </select>
          <select className="admin-input" value={mode} onChange={(event) => setMode(event.target.value as PreviewMode)}>
            <option value="READ_ONLY">Read only</option>
            <option value="FUNCTIONAL">Functional</option>
          </select>
          <button
            type="button"
            onClick={() => void createSession()}
            disabled={submitting || !tenantId || !persona}
            className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creating...' : 'Launch session'}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Workspace layout"
        description="Switch between tabbed, split, and grid layouts. Inactive tabbed sessions stay suspended until you activate them again."
        action={
          <div className="flex flex-wrap gap-2">
            {(['tabs', 'split', 'grid'] as WorkspaceView[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`admin-button ${view === option ? 'admin-button--primary' : 'admin-button--secondary'}`}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-admin-muted">Loading preview session workspace...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-admin-muted">No preview sessions are active yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {sessions.map((previewSession) => (
                <button
                  key={previewSession.sessionId}
                  type="button"
                  draggable
                  onDragStart={() => setDraggingSessionId(previewSession.sessionId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    moveSession(draggingSessionId, previewSession.sessionId);
                    setDraggingSessionId('');
                  }}
                  onClick={() => setActiveSessionId(previewSession.sessionId)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeSessionId === previewSession.sessionId
                      ? 'border-admin-accent bg-blue-50 text-admin-text'
                      : 'border-admin-border bg-white text-admin-text'
                  }`}
                >
                  {previewSession.tenantName} · {labelPortalType(previewSession.portalType)} · {previewSession.persona}
                </button>
              ))}
            </div>

            <div
              className={`grid gap-4 ${
                view === 'tabs' ? 'grid-cols-1' : view === 'split' ? 'lg:grid-cols-2' : 'xl:grid-cols-2'
              }`}
            >
              {visibleSessions.map((previewSession) => (
                <article key={`${previewSession.sessionId}-${reloadKeys[previewSession.sessionId] ?? 0}`} className="overflow-hidden rounded-[1.5rem] border border-admin-border bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-admin-border bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                        {previewSession.tenantName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-admin-text">
                        {labelPortalType(previewSession.portalType)} · {previewSession.persona} · {previewSession.mode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="admin-button admin-button--secondary" onClick={() => setReloadKeys((current) => ({ ...current, [previewSession.sessionId]: (current[previewSession.sessionId] ?? 0) + 1 }))}>
                        Refresh
                      </button>
                      <button type="button" className="admin-button admin-button--secondary" onClick={() => void duplicateSession(previewSession.sessionId)}>
                        Duplicate
                      </button>
                      <button type="button" className="admin-button admin-button--secondary" onClick={() => void endSession(previewSession.sessionId)}>
                        End
                      </button>
                    </div>
                  </div>

                  <iframe
                    title={`${previewSession.tenantName} ${previewSession.portalType} preview`}
                    src={resolvePreviewFrameUrl(previewSession.launchUrl)}
                    className="h-[48rem] w-full border-0 bg-white"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
                  />
                </article>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </AdminPageLayout>
  );
}
