'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

type LoadState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'loaded'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

function WorkspaceSkeleton({ label }: { label: string }) {
  return (
    <section className="portal-card p-6" role="status" aria-live="polite" aria-label={`Loading ${label}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-80 rounded-3xl bg-slate-200" />
      </div>
    </section>
  );
}

export function EmployerWorkspaceDataBoundary<T>({
  endpoint,
  label,
  render
}: {
  endpoint: string;
  label: string;
  render: (data: T) => ReactNode;
}) {
  const [state, setState] = useState<LoadState<T>>({
    status: 'loading',
    data: null,
    error: null
  });

  const load = useCallback(async () => {
    setState({
      status: 'loading',
      data: null,
      error: null
    });

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Unable to load this employer workspace.');
      }

      const payload = (await response.json()) as T;
      setState({
        status: 'loaded',
        data: payload,
        error: null
      });
    } catch (error) {
      setState({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Unable to load this employer workspace.'
      });
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') {
    return <WorkspaceSkeleton label={label} />;
  }

  if (state.status === 'error') {
    return (
      <section className="portal-card p-6" role="alert">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{label} is unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{state.error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
        >
          Retry workspace
        </button>
      </section>
    );
  }

  return <>{render(state.data)}</>;
}
