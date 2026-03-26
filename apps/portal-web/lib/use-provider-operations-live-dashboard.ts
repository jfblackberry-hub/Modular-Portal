'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';

import {
  mergeProviderOperationsDashboard,
  PROVIDER_OPERATIONS_POLL_INTERVAL_MS,
  shouldUseProviderOperationsPollingFallback
} from './provider-operations-live';

export function useProviderOperationsLiveDashboard(
  initialDashboard: ProviderOperationsDashboardContract
) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [refreshState, setRefreshState] = useState<'live' | 'fallback'>('live');
  const lastStreamMessageAtRef = useRef<number | null>(null);
  const streamStateRef = useRef<'connecting' | 'open' | 'degraded'>('connecting');

  useEffect(() => {
    let cancelled = false;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;

    async function pollSnapshot() {
      try {
        const response = await fetch('/api/provider-operations/dashboard', {
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const nextDashboard =
          (await response.json()) as ProviderOperationsDashboardContract;

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setDashboard((current) =>
            mergeProviderOperationsDashboard(current, nextDashboard)
          );
          setRefreshState('fallback');
        });
      } catch {
        // Fallback polling should fail quietly and retry on the next interval.
      }
    }

    function ensurePollingFallback() {
      if (pollingTimer) {
        return;
      }

      pollingTimer = setInterval(() => {
        void pollSnapshot();
      }, PROVIDER_OPERATIONS_POLL_INTERVAL_MS);
    }

    if (typeof window !== 'undefined' && typeof window.EventSource === 'function') {
      eventSource = new window.EventSource('/api/provider-operations/dashboard/stream');

      eventSource.addEventListener('dashboard', (event) => {
        const messageEvent = event as MessageEvent<string>;
        const nextDashboard = JSON.parse(
          messageEvent.data
        ) as ProviderOperationsDashboardContract;
        lastStreamMessageAtRef.current = Date.now();
        streamStateRef.current = 'open';

        startTransition(() => {
          setDashboard((current) =>
            mergeProviderOperationsDashboard(current, nextDashboard)
          );
          setRefreshState('live');
        });
      });

      eventSource.addEventListener('heartbeat', () => {
        lastStreamMessageAtRef.current = Date.now();
      });

      eventSource.onerror = () => {
        if (cancelled) {
          return;
        }

        streamStateRef.current = 'degraded';
        startTransition(() => {
          setRefreshState('fallback');
        });
        ensurePollingFallback();
      };
    } else {
      streamStateRef.current = 'degraded';
      ensurePollingFallback();
    }

    const healthTimer = setInterval(() => {
      const shouldFallback = shouldUseProviderOperationsPollingFallback({
        lastStreamMessageAt: lastStreamMessageAtRef.current,
        now: Date.now(),
        streamSupported:
          typeof window !== 'undefined' && typeof window.EventSource === 'function',
        streamState: streamStateRef.current
      });

      if (shouldFallback) {
        streamStateRef.current = 'degraded';
        startTransition(() => {
          setRefreshState('fallback');
        });
        ensurePollingFallback();
      }
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(healthTimer);

      if (pollingTimer) {
        clearInterval(pollingTimer);
      }

      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return {
    dashboard,
    refreshState
  };
}
