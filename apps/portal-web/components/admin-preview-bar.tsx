'use client';

import { useEffect, useMemo, useState } from 'react';

import styles from './admin-preview-bar.module.css';

type PreviewSessionMeta = {
  id: string;
  portalType: 'member' | 'provider' | 'broker' | 'employer' | 'tenant_admin';
  persona: string;
  mode: 'READ_ONLY' | 'FUNCTIONAL';
  adminUserEmail: string;
  createdAt: string;
  expiresAt: string;
};

export function AdminPreviewBar({
  previewSession,
  tenantName
}: {
  previewSession: PreviewSessionMeta;
  tenantName: string;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [sessionState, setSessionState] = useState<{
    currentRoute?: string | null;
    currentRouteUpdatedAt?: string | null;
    routeHistory?: Array<{
      route: string;
      occurredAt: string;
      type: string;
      detail?: string;
    }>;
  } | null>(null);

  function postAction(action: 'end' | 'refresh' | 'duplicate' | 'popout') {
    window.parent?.postMessage(
      {
        type: 'admin-preview:action',
        sessionId: previewSession.id,
        action
      },
      '*'
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        const response = await fetch('/api/admin-preview/state', {
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          currentRoute?: string | null;
          currentRouteUpdatedAt?: string | null;
          routeHistory?: Array<{
            route: string;
            occurredAt: string;
            type: string;
            detail?: string;
          }>;
        };

        if (!cancelled) {
          setSessionState(payload);
        }
      } catch {
        // Best-effort inspector data only.
      }
    }

    void loadState();
    const intervalId = window.setInterval(loadState, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const remainingLabel = useMemo(() => {
    const remainingMs = Math.max(0, new Date(previewSession.expiresAt).getTime() - now);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [now, previewSession.expiresAt]);

  const environmentLabel =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'Local'
      : 'Preview';

  return (
    <div className={styles.shell} data-inspector-open={inspectorOpen ? 'true' : 'false'}>
      <div className={styles.inner}>
        <div className={styles.meta}>
          <span className={styles.label}>Admin Preview</span>
          <span className={styles.pill}>Tenant: {tenantName}</span>
          <span className={styles.pill}>Portal: {previewSession.portalType}</span>
          <span className={styles.pill}>Persona: {previewSession.persona}</span>
          <span className={styles.pill}>Mode: {previewSession.mode}</span>
          <span className={styles.pill}>Env: {environmentLabel}</span>
          <span className={styles.pill}>Timer: {remainingLabel}</span>
          <span className={styles.pill}>
            Started: {new Date(previewSession.createdAt).toLocaleTimeString()}
          </span>
          <span className={styles.pill}>Admin: {previewSession.adminUserEmail}</span>
          {sessionState?.currentRoute ? (
            <span className={styles.pill}>Route: {sessionState.currentRoute}</span>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => postAction('end')}>
            End Session
          </button>
          <button type="button" className={styles.action} onClick={() => postAction('refresh')}>
            Refresh
          </button>
          <button type="button" className={styles.action} onClick={() => postAction('duplicate')}>
            Duplicate
          </button>
          <button type="button" className={styles.action} onClick={() => postAction('popout')}>
            Pop-out
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => setInspectorOpen((current) => !current)}
          >
            Inspector
          </button>
        </div>
      </div>

      {inspectorOpen ? (
        <div className={styles.inspector}>
          <div className={styles.inspectorSection}>
            <p className={styles.inspectorTitle}>Current Route</p>
            <p className={styles.inspectorValue}>
              {sessionState?.currentRoute ?? 'Waiting for session navigation data'}
            </p>
            <p className={styles.inspectorHint}>
              Last update:{' '}
              {sessionState?.currentRouteUpdatedAt
                ? new Date(sessionState.currentRouteUpdatedAt).toLocaleTimeString()
                : 'Not recorded yet'}
            </p>
          </div>

          <div className={styles.inspectorSection}>
            <p className={styles.inspectorTitle}>Recent History</p>
            <div className={styles.history}>
              {(sessionState?.routeHistory ?? []).slice(-6).reverse().map((entry) => (
                <div key={`${entry.occurredAt}-${entry.route}-${entry.type}`} className={styles.historyItem}>
                  <p className={styles.historyRoute}>{entry.route}</p>
                  <p className={styles.historyMeta}>
                    {entry.type} • {new Date(entry.occurredAt).toLocaleTimeString()}
                  </p>
                  {entry.detail ? <p className={styles.historyDetail}>{entry.detail}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
