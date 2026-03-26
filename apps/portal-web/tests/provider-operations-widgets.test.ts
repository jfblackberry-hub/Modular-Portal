import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  resolveProviderOperationsDashboardData
} from '../lib/provider-operations-data';
import type { PortalSessionUser } from '../lib/portal-session';

function createProviderUser(
  overrides: Partial<PortalSessionUser> = {}
): PortalSessionUser {
  return {
    id: 'provider-user-1',
    email: 'provider@example.com',
    firstName: 'Jordan',
    lastName: 'Lee',
    landingContext: 'provider',
    tenant: {
      id: 'tenant-provider',
      name: 'NorthStar Medical Group',
      brandingConfig: {}
    },
    roles: ['clinic_manager'],
    permissions: ['tenant.view', 'provider.view'],
    session: {
      personaType: 'clinic_manager',
      type: 'end_user',
      tenantId: 'tenant-provider',
      roles: ['clinic_manager'],
      permissions: ['tenant.view', 'provider.view'],
      activeOrganizationUnit: {
        id: 'ou-flint',
        name: 'Flint Clinic',
        type: 'LOCATION'
      },
      availableOrganizationUnits: [
        {
          id: 'ou-flint',
          name: 'Flint Clinic',
          type: 'LOCATION'
        },
        {
          id: 'ou-lansing',
          name: 'Lansing Clinic',
          type: 'LOCATION'
        }
      ]
    },
    ...overrides
  };
}

test('leadership personas receive the full provider operations widget set with roll-up on approved widgets', async () => {
  const dashboard = await resolveProviderOperationsDashboardData({
    config: {} as never,
    user: createProviderUser()
  });

  assert.deepEqual(
    dashboard.widgets.map((widget) => widget.id),
    ['scheduling', 'authorizations', 'claims', 'billing', 'utilization']
  );
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
});

test('standard provider personas only see their mapped widgets and stay organization-unit scoped', async () => {
  const dashboard = await resolveProviderOperationsDashboardData({
    config: {} as never,
    user: createProviderUser({
      roles: ['eligibility_coordinator'],
      permissions: [
        'tenant.view',
        'provider.view',
        'provider.authorizations.view'
      ],
      session: {
        personaType: 'eligibility_coordinator',
        type: 'end_user',
        tenantId: 'tenant-provider',
        roles: ['eligibility_coordinator'],
        permissions: [
          'tenant.view',
          'provider.view',
          'provider.authorizations.view'
        ],
        activeOrganizationUnit: {
          id: 'ou-flint',
          name: 'Flint Clinic',
          type: 'LOCATION'
        },
        availableOrganizationUnits: [
          {
            id: 'ou-flint',
            name: 'Flint Clinic',
            type: 'LOCATION'
          },
          {
            id: 'ou-lansing',
            name: 'Lansing Clinic',
            type: 'LOCATION'
          }
        ]
      }
    })
  });

  assert.deepEqual(
    dashboard.widgets.map((widget) => widget.id),
    ['scheduling', 'authorizations', 'utilization']
  );
  assert.deepEqual(
    dashboard.widgets.map((widget) => widget.scope.mode),
    ['organization_unit', 'organization_unit', 'organization_unit']
  );
});

test('tenant-specific persona mappings can override the default widget composition model', async () => {
  const tenantBrandingConfig = {
    providerDemoData: {
      providerOperations: {
        personaWidgetMappings: [
          {
            persona: 'provider_support',
            widgets: ['scheduling', 'billing'],
            rollupWidgets: ['billing']
          }
        ]
      }
    }
  } as const;
  const dashboard = await resolveProviderOperationsDashboardData({
    config: {} as never,
    user: createProviderUser({
      roles: ['provider_support'],
      tenant: {
        id: 'tenant-provider',
        name: 'NorthStar Medical Group',
        brandingConfig: tenantBrandingConfig
      },
      session: {
        personaType: 'provider_support',
        type: 'end_user',
        tenantId: 'tenant-provider',
        roles: ['provider_support'],
        permissions: ['tenant.view', 'provider.view'],
        activeOrganizationUnit: {
          id: 'ou-flint',
          name: 'Flint Clinic',
          type: 'LOCATION'
        },
        availableOrganizationUnits: [
          {
            id: 'ou-flint',
            name: 'Flint Clinic',
            type: 'LOCATION'
          },
          {
            id: 'ou-lansing',
            name: 'Lansing Clinic',
            type: 'LOCATION'
          }
        ]
      }
    })
  });

  assert.deepEqual(
    dashboard.widgets.map((widget) => [widget.id, widget.scope.mode]),
    [
      ['scheduling', 'organization_unit'],
      ['billing', 'rollup']
    ]
  );
});
