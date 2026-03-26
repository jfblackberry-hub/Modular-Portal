import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  resolveProviderOperationsDashboardFromSourceConnectors
} from '../src/services/provider-operations-service.js';

const CURRENT_USER = {
  tenantId: 'tenant-alpha',
  activeOrganizationUnitId: 'ou-flint',
  activePersonaCode: 'clinic_manager',
  accessibleOrganizationUnitIds: ['ou-flint', 'ou-lansing']
};

test('provider operations source connectors normalize into a tenant-scoped dashboard contract', () => {
  const dashboard = resolveProviderOperationsDashboardFromSourceConnectors({
    currentUser: CURRENT_USER,
    connectors: [
      {
        id: 'connector-warehouse',
        tenantId: 'tenant-alpha',
        name: 'Google Warehouse',
        adapterKey: 'rest-api',
        config: {
          providerOperationsSource: {
            sourceType: 'google_cloud_warehouse'
          },
          providerOperationsDataset: {
            warehouseDataset: 'provider_ops.daily',
            scheduling: [
              {
                organizationUnitId: 'ou-flint',
                label: 'Scheduling',
                summary: '28 visits scheduled',
                detail: 'Flint scheduling activity',
                highlights: ['6 same-day requests'],
                tone: 'info'
              }
            ],
            utilization: [
              {
                organizationUnitId: null,
                label: 'Utilization',
                summary: '87% utilization target attainment',
                detail: 'Roll-up utilization view',
                highlights: ['Eligibility response times improved 8%'],
                tone: 'default'
              }
            ]
          }
        }
      },
      {
        id: 'connector-clearinghouse',
        tenantId: 'tenant-alpha',
        name: 'Clearinghouse',
        adapterKey: 'rest-api',
        config: {
          providerOperationsSource: {
            sourceType: 'clearinghouse_environment'
          },
          providerOperationsDataset: {
            environment: 'sandbox',
            authorizations: [
              {
                organizationUnitId: 'ou-flint',
                label: 'Authorizations',
                summary: '11 authorizations in flight',
                detail: 'Flint auth queue',
                highlights: ['3 requests need clinical attachments today'],
                tone: 'warning'
              }
            ],
            claims: [
              {
                organizationUnitId: null,
                label: 'Claims',
                summary: '19 claims require follow-up',
                detail: 'Roll-up claims queue',
                highlights: ['5 claims approach timely filing thresholds'],
                tone: 'danger'
              }
            ],
            billing: [
              {
                organizationUnitId: null,
                label: 'Billing',
                summary: '$84,220 posted today',
                detail: 'Roll-up billing view',
                highlights: ['2 EFT batches pending reconciliation'],
                tone: 'success'
              }
            ]
          }
        }
      },
      {
        id: 'connector-centralreach',
        tenantId: 'tenant-alpha',
        name: 'CentralReach',
        adapterKey: 'rest-api',
        config: {
          providerOperationsSource: {
            sourceType: 'central_reach'
          },
          providerOperationsDataset: {
            scheduling: [
              {
                organizationUnitId: 'ou-flint',
                label: 'Scheduling',
                summary: '28 visits scheduled',
                detail: 'CentralReach schedule view',
                highlights: ['2 provider templates need schedule adjustment'],
                tone: 'info'
              }
            ]
          }
        }
      }
    ]
  });

  assert.equal(dashboard.tenantId, 'tenant-alpha');
  assert.equal(dashboard.personaCode, 'clinic_manager');
  assert.deepEqual(
    dashboard.widgets.map((widget) => [widget.id, widget.scope.mode]),
    [
      ['scheduling', 'organization_unit'],
      ['authorizations', 'organization_unit'],
      ['claims', 'rollup'],
      ['billing', 'rollup'],
      ['utilization', 'rollup']
    ]
  );
  assert.deepEqual(
    dashboard.widgets.find((widget) => widget.id === 'scheduling')?.sourceTypes,
    ['google_cloud_warehouse', 'central_reach']
  );
});

test('standard personas stay organization-unit scoped even when roll-up source data exists', () => {
  const dashboard = resolveProviderOperationsDashboardFromSourceConnectors({
    currentUser: {
      ...CURRENT_USER,
      activePersonaCode: 'provider_support'
    },
    connectors: [
      {
        id: 'connector-clearinghouse',
        tenantId: 'tenant-alpha',
        name: 'Clearinghouse',
        adapterKey: 'rest-api',
        config: {
          providerOperationsSource: {
            sourceType: 'clearinghouse_environment'
          },
          providerOperationsDataset: {
            claims: [
              {
                organizationUnitId: null,
                label: 'Claims',
                summary: '19 claims require follow-up',
                detail: 'Roll-up claims queue',
                highlights: ['5 claims approach timely filing thresholds'],
                tone: 'danger'
              },
              {
                organizationUnitId: 'ou-flint',
                label: 'Claims',
                summary: '7 claims require follow-up',
                detail: 'Flint-only claims queue',
                highlights: ['2 claims need resubmission'],
                tone: 'danger'
              }
            ],
            billing: [
              {
                organizationUnitId: 'ou-flint',
                label: 'Billing',
                summary: '$18,400 posted today',
                detail: 'Flint billing view',
                highlights: ['1 EFT batch pending reconciliation'],
                tone: 'success'
              }
            ],
            authorizations: []
          }
        }
      }
    ]
  });

  assert.deepEqual(
    dashboard.widgets.map((widget) => [widget.id, widget.scope.mode, widget.summary]),
    [
      ['claims', 'organization_unit', '7 claims require follow-up'],
      ['billing', 'organization_unit', '$18,400 posted today']
    ]
  );
});

test('foreign-tenant connectors are rejected before normalized contracts are delivered', () => {
  assert.throws(
    () =>
      resolveProviderOperationsDashboardFromSourceConnectors({
        currentUser: CURRENT_USER,
        connectors: [
          {
            id: 'connector-foreign',
            tenantId: 'tenant-beta',
            name: 'Foreign Source',
            adapterKey: 'rest-api',
            config: {
              providerOperationsSource: {
                sourceType: 'google_cloud_warehouse'
              },
              providerOperationsDataset: {
                scheduling: []
              }
            }
          }
        ]
      }),
    /authenticated tenant scope/i
  );
});
