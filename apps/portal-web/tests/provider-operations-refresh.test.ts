import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';

import {
  mergeProviderOperationsDashboard,
  PROVIDER_OPERATIONS_STREAM_STALE_AFTER_MS,
  shouldUseProviderOperationsPollingFallback
} from '../lib/provider-operations-live';

function createDashboard(
  overrides: Partial<ProviderOperationsDashboardContract> = {}
): ProviderOperationsDashboardContract {
  return {
    source: 'platform_provider_operations_data_layer',
    personaCode: 'clinic_manager',
    tenantId: 'tenant-1',
    activeOrganizationUnitId: 'ou-1',
    generatedAt: '2026-03-26T12:00:00.000Z',
    widgets: [
      {
        id: 'scheduling',
        title: 'Scheduling',
        description: 'Scheduling queue',
        summary: '28 visits scheduled',
        detail: 'Scoped to active org unit',
        highlights: ['6 same-day requests'],
        tone: 'info',
        href: '/provider/dashboard',
        ctaLabel: 'Review scheduling priorities',
        scope: {
          mode: 'organization_unit',
          tenantId: 'tenant-1',
          activeOrganizationUnitId: 'ou-1',
          accessibleOrganizationUnitIds: ['ou-1'],
          rollupAuthorized: false
        },
        sourceTypes: ['google_cloud_warehouse']
      },
      {
        id: 'claims',
        title: 'Claims',
        description: 'Claims queue',
        summary: '19 claims require follow-up',
        detail: 'Roll-up claims queue',
        highlights: ['5 claims approach timely filing thresholds'],
        tone: 'danger',
        href: '/provider/claims',
        ctaLabel: 'Open claims follow-up',
        scope: {
          mode: 'rollup',
          tenantId: 'tenant-1',
          activeOrganizationUnitId: 'ou-1',
          accessibleOrganizationUnitIds: ['ou-1', 'ou-2'],
          rollupAuthorized: true
        },
        sourceTypes: ['clearinghouse_environment']
      }
    ],
    ...overrides
  };
}

test('incremental dashboard merge preserves unchanged widgets while updating changed ones', () => {
  const previous = createDashboard();
  const incoming = createDashboard({
    generatedAt: '2026-03-26T12:00:10.000Z',
    widgets: [
      previous.widgets[0]!,
      {
        ...previous.widgets[1]!,
        summary: '17 claims require follow-up'
      }
    ]
  });

  const merged = mergeProviderOperationsDashboard(previous, incoming);

  assert.equal(merged.widgets[0], previous.widgets[0]);
  assert.notEqual(merged.widgets[1], previous.widgets[1]);
  assert.equal(merged.widgets[1]?.summary, '17 claims require follow-up');
});

test('stream-supported dashboards stay on push refresh while the stream is fresh', () => {
  assert.equal(
    shouldUseProviderOperationsPollingFallback({
      lastStreamMessageAt: Date.now(),
      now: Date.now() + 5_000,
      streamSupported: true,
      streamState: 'open'
    }),
    false
  );
});

test('degraded or stale stream health triggers automatic polling fallback', () => {
  assert.equal(
    shouldUseProviderOperationsPollingFallback({
      lastStreamMessageAt: Date.now() - PROVIDER_OPERATIONS_STREAM_STALE_AFTER_MS - 1_000,
      now: Date.now(),
      streamSupported: true,
      streamState: 'open'
    }),
    true
  );

  assert.equal(
    shouldUseProviderOperationsPollingFallback({
      lastStreamMessageAt: null,
      now: Date.now(),
      streamSupported: true,
      streamState: 'degraded'
    }),
    true
  );
});
