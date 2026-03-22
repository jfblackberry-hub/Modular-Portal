'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="admin-page-header admin-surface">
      <div className="admin-page-header__content">
        <div className="admin-page-header__copy">
          {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
          <h1 className="admin-page-header__title">{title}</h1>
          {subtitle ? <p className="admin-page-header__description">{subtitle}</p> : null}
        </div>
        {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}

type AdminPageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageLayout({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children
}: AdminPageLayoutProps) {
  return (
    <div className="admin-page-layout">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} actions={actions} />
      {meta ? <div className="admin-page-layout__meta">{meta}</div> : null}
      <div className="admin-page-layout__body">{children}</div>
    </div>
  );
}

type AdminActionBarProps = {
  children: ReactNode;
};

export function AdminActionBar({ children }: AdminActionBarProps) {
  return <div className="admin-action-bar admin-surface">{children}</div>;
}

type AdminStatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function AdminStatCard({ label, value, detail }: AdminStatCardProps) {
  return (
    <article className="admin-stat-card admin-surface">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {detail ? <p className="admin-stat-card__detail">{detail}</p> : null}
    </article>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminEmptyState({ title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state admin-surface">
      <div className="admin-empty-state__icon" aria-hidden="true">
        •
      </div>
      <h3 className="admin-empty-state__title">{title}</h3>
      <p className="admin-empty-state__description">{description}</p>
      {action ? <div className="admin-empty-state__action">{action}</div> : null}
    </div>
  );
}

type AdminInfoStateProps = {
  title: string;
  description: string;
};

export function AdminLoadingState({
  title = 'Loading workspace',
  description = 'Fetching the latest administrative data.'
}: Partial<AdminInfoStateProps>) {
  return (
    <div className="admin-info-state admin-surface">
      <div className="admin-info-state__pulse" aria-hidden="true" />
      <div>
        <h3 className="admin-info-state__title">{title}</h3>
        <p className="admin-info-state__description">{description}</p>
      </div>
    </div>
  );
}

export function AdminErrorState({ title, description }: AdminInfoStateProps) {
  return (
    <div className="admin-error-state admin-surface">
      <h3 className="admin-info-state__title">{title}</h3>
      <p className="admin-info-state__description">{description}</p>
    </div>
  );
}

type WorkspaceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type AdminActionWorkspaceDefinition<TProps extends object> = {
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

function resolveLoadedComponent<TProps extends object>(
  loaded: ComponentType<TProps> | { default: ComponentType<TProps> }
) {
  return 'default' in loaded ? loaded.default : loaded;
}

function AdminActionWorkspaceSkeleton({ label }: { label: string }) {
  return (
    <section className="admin-surface p-6" role="status" aria-live="polite">
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-48 rounded-full bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-slate-200" />
      </div>
      <p className="sr-only">Loading {label}</p>
    </section>
  );
}

export function AdminActionWorkspace<TProps extends object>({
  actions,
  emptyStateDescription = 'Choose a workspace action to load focused content without leaving the page.',
  emptyStateTitle = 'Choose a workspace action',
  persistKey,
  sectionTitle = 'Action workspace'
}: {
  actions: AdminActionWorkspaceDefinition<TProps>[];
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  persistKey?: string;
  sectionTitle?: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [workspaceState, setWorkspaceState] = useState<Record<string, WorkspaceRecord<TProps>>>(
    () =>
      Object.fromEntries(
        actions.map((action) => [
          action.key,
          {
            status: 'idle'
          } satisfies WorkspaceRecord<TProps>
        ])
      )
  );
  const pendingRequestRef = useRef<Record<string, number>>({});

  const actionsByKey = useMemo(
    () => Object.fromEntries(actions.map((action) => [action.key, action])),
    [actions]
  );

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

    if (activeKey) {
      window.sessionStorage.setItem(persistKey, activeKey);
    }
  }, [activeKey, persistKey]);

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
    <section className="space-y-4" aria-label={sectionTitle}>
      <div className="admin-action-workspace admin-surface">
        <div className="admin-action-workspace__actions">
          {actions.map((action) => {
            const isActive = activeKey === action.key;

            return (
              <button
                key={action.key}
                type="button"
                aria-pressed={isActive}
                aria-controls={`admin-workspace-panel-${action.key}`}
                onClick={() => setActiveKey(action.key)}
                className={`admin-button ${isActive ? 'admin-button--primary' : 'admin-button--secondary'}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>

        {!activeAction ? (
          <div className="admin-action-workspace__empty">
            <h2 className="admin-action-workspace__empty-title">{emptyStateTitle}</h2>
            <p className="admin-action-workspace__empty-description">{emptyStateDescription}</p>
          </div>
        ) : null}
      </div>

      {activeAction && activeState?.status === 'loading' ? (
        <div id={`admin-workspace-panel-${activeAction.key}`}>
          <AdminActionWorkspaceSkeleton label={activeAction.label} />
        </div>
      ) : null}

      {activeAction && activeState?.status === 'error' ? (
        <section id={`admin-workspace-panel-${activeAction.key}`} className="admin-surface p-6">
          <h2 className="text-lg font-semibold text-admin-text">{activeAction.label} is unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-admin-muted">{activeState.error}</p>
          <button type="button" onClick={() => retryWorkspace(activeAction.key)} className="admin-button admin-button--primary mt-4">
            Retry workspace
          </button>
        </section>
      ) : null}

      {actions.map((action) => {
        const state = workspaceState[action.key];

        if (activeKey !== action.key || state?.status !== 'loaded' || !state.Component) {
          return null;
        }

        const LoadedComponent = state.Component;

        return (
          <div key={action.key} id={`admin-workspace-panel-${action.key}`}>
            <LoadedComponent {...action.props} />
          </div>
        );
      })}
    </section>
  );
}
