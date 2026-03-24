'use client';

import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react';

type WorkspaceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type PortalActionWorkspaceDefinition<TProps extends object> = {
  key: string;
  label: string;
  description: string;
  loader: () => Promise<ComponentType<TProps> | { default: ComponentType<TProps> }>;
  props: TProps;
};

type WorkspaceRecord<TProps extends object> = {
  Component?: ComponentType<TProps>;
  error?: string;
  status: WorkspaceStatus;
};

const workspaceStateCache = new Map<string, unknown>();

function resolveLoadedComponent<TProps extends object>(
  loaded: ComponentType<TProps> | { default: ComponentType<TProps> }
) {
  return 'default' in loaded ? loaded.default : loaded;
}

function ActionWorkspaceSkeleton({ label }: { label: string }) {
  return (
    <section
      className="portal-card p-6"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${label} workspace`}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-72 rounded-3xl bg-slate-200" />
      </div>
    </section>
  );
}

export function PortalActionWorkspace<TProps extends object>({
  actions,
  actionRowClassName,
  emptyStateDescription = 'Select a workspace tab to load a focused area without leaving the dashboard.',
  emptyStateTitle = 'Choose a workspace',
  homeActionLabel,
  persistKey,
  sessionCacheKey,
  showEmptyStateWhenInactive = true,
  sectionTitle = 'Workspaces',
  tabListLabel = 'Workspace tabs'
}: {
  actions: PortalActionWorkspaceDefinition<TProps>[];
  actionRowClassName?: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  homeActionLabel?: string;
  persistKey?: string;
  sessionCacheKey?: string;
  showEmptyStateWhenInactive?: boolean;
  sectionTitle?: string;
  tabListLabel?: string;
}) {
  const initialWorkspaceState = useMemo(
    () =>
      Object.fromEntries(
        actions.map((action) => [
          action.key,
          {
            status: 'idle'
          } satisfies WorkspaceRecord<TProps>
        ])
      ),
    [actions]
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<Record<string, WorkspaceRecord<TProps>>>(() => {
    if (sessionCacheKey) {
      const cachedState = workspaceStateCache.get(sessionCacheKey);

      if (cachedState && typeof cachedState === 'object') {
        return {
          ...initialWorkspaceState,
          ...(cachedState as Record<string, WorkspaceRecord<TProps>>)
        };
      }
    }

    return initialWorkspaceState;
  });
  const pendingRequestRef = useRef<Record<string, number>>({});

  const actionsByKey = useMemo(
    () => Object.fromEntries(actions.map((action) => [action.key, action])),
    [actions]
  );

  useEffect(() => {
    setWorkspaceState((current) => {
      const nextState = Object.fromEntries(
        actions.map((action) => [
          action.key,
          current[action.key] ?? {
            status: 'idle'
          }
        ])
      ) as Record<string, WorkspaceRecord<TProps>>;

      if (sessionCacheKey) {
        workspaceStateCache.set(sessionCacheKey, nextState);
      }

      return nextState;
    });
  }, [actions, sessionCacheKey]);

  useEffect(() => {
    if (!persistKey || typeof window === 'undefined') {
      return;
    }

    const storedValue = window.sessionStorage.getItem(persistKey);

    if (storedValue && actionsByKey[storedValue]) {
      setActiveKey(storedValue);
    }
  }, [actionsByKey, persistKey]);

  useEffect(() => {
    if (!persistKey || typeof window === 'undefined') {
      return;
    }

    if (!activeKey) {
      window.sessionStorage.removeItem(persistKey);
      return;
    }

    window.sessionStorage.setItem(persistKey, activeKey);
  }, [activeKey, persistKey]);

  useEffect(() => {
    if (!sessionCacheKey) {
      return;
    }

    workspaceStateCache.set(sessionCacheKey, workspaceState);
  }, [sessionCacheKey, workspaceState]);

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    const action = actionsByKey[activeKey];
    const currentState = workspaceState[activeKey];

    if (!action || currentState?.status === 'loaded' || currentState?.status === 'loading') {
      return;
    }

    const requestId = (pendingRequestRef.current[activeKey] ?? 0) + 1;
    pendingRequestRef.current[activeKey] = requestId;

    setWorkspaceState((current) => ({
      ...current,
      [activeKey]: {
        ...current[activeKey],
        error: undefined,
        status: 'loading'
      }
    }));

    void action
      .loader()
      .then((loaded) => {
        if (pendingRequestRef.current[activeKey] !== requestId) {
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          [activeKey]: {
            Component: resolveLoadedComponent(loaded),
            error: undefined,
            status: 'loaded'
          }
        }));
      })
      .catch(() => {
        if (pendingRequestRef.current[activeKey] !== requestId) {
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          [activeKey]: {
            ...current[activeKey],
            error: 'Unable to load this workspace right now.',
            status: 'error'
          }
        }));
      });
  }, [actionsByKey, activeKey, workspaceState]);

  const activeAction = activeKey ? actionsByKey[activeKey] : null;
  const activeState = activeKey ? workspaceState[activeKey] : null;

  function retryWorkspace(key: string) {
    setWorkspaceState((current) => ({
      ...current,
      [key]: {
        ...current[key],
        status: 'idle'
      }
    }));
    setActiveKey(key);
  }

  return (
    <section className="space-y-3" aria-label={sectionTitle}>
      <div className="portal-card p-4">
        <div className="space-y-3">
          {homeActionLabel ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                role="tab"
                aria-pressed={activeKey === null}
                aria-selected={activeKey === null}
                aria-controls="workspace-panel-home"
                id="workspace-tab-home"
                onClick={() => setActiveKey(null)}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  activeKey === null
                    ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-color)] text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] hover:brightness-110'
                    : 'border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]'
                }`}
              >
                {homeActionLabel}
              </button>
            </div>
          ) : null}

          {homeActionLabel ? (
            <div className="border-t border-[var(--border-subtle)]" />
          ) : null}

          <div
            role="tablist"
            aria-label={tabListLabel}
            className={actionRowClassName ?? 'flex flex-wrap gap-3'}
          >
            {actions.map((action) => {
              const isActive = activeKey === action.key;

              return (
                <button
                  key={action.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`workspace-panel-${action.key}`}
                  id={`workspace-tab-${action.key}`}
                  onClick={() => setActiveKey(action.key)}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-color)] text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] hover:brightness-110'
                      : 'border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]'
                  }`}
                >
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!activeAction && showEmptyStateWhenInactive ? (
        <section
          id="workspace-panel-home"
          role="tabpanel"
          aria-labelledby={homeActionLabel ? 'workspace-tab-home' : undefined}
          className="portal-card p-6 text-center"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{emptyStateTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {emptyStateDescription}
          </p>
        </section>
      ) : null}

      {activeAction && activeState?.status === 'loading' ? (
        <div id={`workspace-panel-${activeAction.key}`}>
          <ActionWorkspaceSkeleton label={activeAction.label} />
        </div>
      ) : null}

      {activeAction && activeState?.status === 'error' ? (
        <section
          id={`workspace-panel-${activeAction.key}`}
          className="portal-card p-6"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {activeAction.label} is unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {activeState.error}
          </p>
          <button
            type="button"
            onClick={() => retryWorkspace(activeAction.key)}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
          >
            Retry workspace
          </button>
        </section>
      ) : null}

      {actions.map((action) => {
        const state = workspaceState[action.key];

        if (state?.status !== 'loaded' || !state.Component) {
          return null;
        }

        const WorkspaceComponent = state.Component;
        const isActive = activeKey === action.key;

        return (
          <div
            key={action.key}
            id={`workspace-panel-${action.key}`}
            role="tabpanel"
            aria-labelledby={`workspace-tab-${action.key}`}
            hidden={!isActive}
            aria-hidden={!isActive}
          >
            <section className="space-y-3">
              <div className="portal-card px-6 py-5">
                <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">
                  {action.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {action.description}
                </p>
              </div>
              <WorkspaceComponent {...action.props} />
            </section>
          </div>
        );
      })}
    </section>
  );
}
