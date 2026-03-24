'use client';

import { useEffect, useState } from 'react';

import { apiBaseUrl } from '../lib/api-auth';
import { SectionCard } from './section-card';

type HealthPayload = {
  status: string;
  checks: Record<
    string,
    {
      status: string;
      latencyMs?: number;
    }
  >;
};

export function PlatformMetricsPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [metrics, setMetrics] = useState('');
  const [healthError, setHealthError] = useState('');
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    async function loadMetrics() {
      setHealthError('');
      setMetricsError('');

      try {
        const [healthResult, metricsResult] = await Promise.allSettled([
          fetch(`${apiBaseUrl}/health`, { cache: 'no-store' }),
          fetch(`${apiBaseUrl}/metrics`, { cache: 'no-store' })
        ]);

        if (healthResult.status === 'fulfilled') {
          if (healthResult.value.ok) {
            const healthPayload = (await healthResult.value.json()) as HealthPayload;
            setHealth(healthPayload);
          } else {
            setHealth(null);
            setHealthError('Unable to load platform health checks.');
          }
        } else {
          setHealth(null);
          setHealthError('Unable to load platform health checks.');
        }

        if (metricsResult.status === 'fulfilled') {
          if (metricsResult.value.ok) {
            const metricsPayload = await metricsResult.value.text();
            setMetrics(metricsPayload);
          } else {
            setMetrics('');
            setMetricsError('Unable to load raw metrics.');
          }
        } else {
          setMetrics('');
          setMetricsError('Unable to load raw metrics.');
        }
      } catch {
        setHealth(null);
        setMetrics('');
        setHealthError('Unable to load platform health checks.');
        setMetricsError('Unable to load raw metrics.');
      }
    }

    void loadMetrics();
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title="Platform health"
        description="Live health checks for core services used by the multi-tenant platform."
      >
        {healthError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {healthError}
          </p>
        ) : null}
        {health ? (
          <div className="space-y-3">
            {Object.entries(health.checks).map(([key, check]) => (
              <div
                key={key}
                className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold capitalize text-admin-text">
                    {key}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-accent">
                    {check.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-admin-muted">
                  {typeof check.latencyMs === 'number'
                    ? `${check.latencyMs} ms`
                    : 'No latency recorded'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-admin-muted">Loading health status...</p>
        )}
      </SectionCard>

      <SectionCard
        title="Raw metrics"
        description="Prometheus-formatted platform metrics for operator diagnostics."
      >
        {metricsError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {metricsError}
          </p>
        ) : null}
        {metrics ? (
          <pre className="max-h-[34rem] overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-admin-muted">
            {metrics}
          </pre>
        ) : (
          <p className="text-sm text-admin-muted">Loading raw metrics...</p>
        )}
      </SectionCard>
    </div>
  );
}
