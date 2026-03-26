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
    refreshIntervalSeconds: 30,
    alertsCount: 5,
    organizationUnits: [
      {
        id: 'ou-1',
        name: 'Grand Rapids Clinic',
        type: 'LOCATION',
        isActive: true
      }
    ],
    quickActions: [
      {
        id: 'eligibility_check',
        label: 'Start Eligibility Check',
        description: 'Verify coverage before a session starts slipping.',
        href: '/provider/dashboard?detail=scheduling&filter=eligibility_missing'
      }
    ],
    attentionItems: [
      {
        id: 'sessions_at_risk',
        label: 'Sessions at risk today',
        count: 2,
        urgency: 'critical',
        summary: 'Two sessions need intervention.',
        detail: 'Therapist and auth issues need review now.',
        href: '/provider/dashboard?detail=scheduling&filter=at_risk',
        preview: ['Noah Bennett: Trigger eligibility check']
      }
    ],
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
    scheduling: {
      metrics: [],
      sessions: []
    },
    authorizations: {
      metrics: [],
      authorizations: []
    },
    utilization: {
      metrics: [],
      therapists: []
    },
    claims: {
      metrics: [],
      claims: [],
      pipeline: [],
      denialReasons: [],
      dollarAmountAtRisk: 0
    },
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
