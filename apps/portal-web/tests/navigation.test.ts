import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
  PlatformFeatureFlag,
  PluginManifest
} from '@payer-portal/plugin-sdk';

import {
  manifest as providerManifest,
  PROVIDER_POC_SCOPE_EXCLUSIONS
} from '../../../plugins/provider/src/index';
import { buildPortalNavigation } from '../lib/navigation';
import type { PortalSessionUser } from '../lib/portal-session';

function createUser(overrides: Partial<PortalSessionUser> = {}): PortalSessionUser {
  return {
    id: 'user-1',
    email: 'member@example.com',
    firstName: 'Alex',
    lastName: 'Taylor',
    session: {
      personaType: 'member',
      type: 'end_user',
      tenantId: 'tenant-1',
      roles: ['member'],
      permissions: ['member.view'],
      activeOrganizationUnit: null,
      availableOrganizationUnits: []
    },
    landingContext: 'member',
    tenant: {
      id: 'tenant-1',
      name: 'Acme Health',
      brandingConfig: {}
    },
    roles: ['member'],
    permissions: ['member.view'],
    ...overrides
  };
}

const enabledPluginFlags: PlatformFeatureFlag[] = [
  {
    id: 'flag-plugin-test',
    key: 'plugins.test.enabled',
    enabled: true,
    tenantId: null
  }
];

test('capability flag removal drops the navigation entry automatically', () => {
  const plugin: PluginManifest = {
    id: 'test',
    name: 'Test Plugin',
    version: '0.1.0',
    capabilities: [
      {
        id: 'claims',
        label: 'Claims',
        description: 'Claims workspace',
        audiences: ['member'],
        featureFlagKeys: ['capabilities.claims.enabled'],
        routes: [{ path: '/dashboard/claims', label: 'Claims' }],
        navigation: [
          {
            label: 'Claims',
            href: '/dashboard/claims',
            description: 'Claims workspace'
          }
        ],
        sectionTitle: 'Member portal'
      }
    ]
  };

  const navigation = buildPortalNavigation(
    createUser(),
    [plugin],
    enabledPluginFlags,
    { audience: 'member' }
  );

  assert.equal(navigation.length, 0);
});

test('tenant licensing removes navigation entries for unlicensed capabilities', () => {
  const plugin: PluginManifest = {
    id: 'test',
    name: 'Test Plugin',
    version: '0.1.0',
    capabilities: [
      {
        id: 'documents',
        label: 'Documents',
        description: 'Documents workspace',
        audiences: ['member'],
        moduleKeys: ['member_documents'],
        routes: [{ path: '/dashboard/documents', label: 'Documents' }],
        navigation: [
          {
            label: 'Documents',
            href: '/dashboard/documents',
            description: 'Documents workspace'
          }
        ],
        sectionTitle: 'Member portal'
      }
    ]
  };

  const navigation = buildPortalNavigation(
    createUser({
      tenant: {
        id: 'tenant-1',
        name: 'Acme Health',
        brandingConfig: {
          purchasedModules: ['member_home']
        }
      }
    }),
    [plugin],
    enabledPluginFlags,
    { audience: 'member' }
  );

  assert.equal(navigation.length, 0);
});

test('audience-specific capabilities only appear for the requested portal experience', () => {
  const plugin: PluginManifest = {
    id: 'test',
    name: 'Test Plugin',
    version: '0.1.0',
    capabilities: [
      {
        id: 'employer_billing',
        label: 'Billing',
        description: 'Employer billing',
        audiences: ['employer'],
        routes: [{ path: '/employer/billing', label: 'Billing' }],
        navigation: [
          {
            label: 'Billing',
            href: '/employer/billing',
            description: 'Employer billing'
          }
        ],
        sectionTitle: 'Employer portal'
      },
      {
        id: 'member_claims',
        label: 'Claims',
        description: 'Member claims',
        audiences: ['member'],
        routes: [{ path: '/dashboard/claims', label: 'Claims' }],
        navigation: [
          {
            label: 'Claims',
            href: '/dashboard/claims',
            description: 'Member claims'
          }
        ],
        sectionTitle: 'Member portal'
      }
    ]
  };

  const navigation = buildPortalNavigation(
    createUser({
      landingContext: 'employer',
      roles: ['employer_group_admin'],
      permissions: [],
      session: {
        personaType: 'employer_group_admin',
        type: 'end_user',
        tenantId: 'tenant-1',
        roles: ['employer_group_admin'],
        permissions: [],
        activeOrganizationUnit: null,
        availableOrganizationUnits: []
      }
    }),
    [plugin],
    enabledPluginFlags,
    { audience: 'employer' }
  );

  assert.deepEqual(
    navigation.map((section) => section.title),
    ['Employer portal']
  );
  assert.deepEqual(
    navigation[0]?.items.map((item) => item.label),
    ['Billing']
  );
});

test('provider tenant navigation is composed from plugin flags, permissions, and licensed modules', () => {
  assert.equal(providerManifest.capabilities.length, 2);
  assert.equal(providerManifest.capabilities[0]?.id, 'provider_operations');
  assert.equal(providerManifest.capabilities[1]?.id, 'provider_reporting');

  const tenantId = 'tenant-provider';
  const navigation = buildPortalNavigation(
    createUser({
      landingContext: 'provider',
      roles: ['clinic_manager'],
      permissions: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      tenant: {
        id: tenantId,
        name: 'NorthStar Medical Group',
        brandingConfig: {
          purchasedModules: ['provider_operations']
        }
      },
      session: {
        personaType: 'clinic_manager',
        type: 'end_user',
        tenantId,
        roles: ['clinic_manager'],
        permissions: [
          'tenant.view',
          'provider.view',
          'provider.eligibility.view',
          'provider.authorizations.view',
          'provider.claims.view',
          'provider.documents.view',
          'provider.messages.view',
          'provider.support.view'
        ],
        activeOrganizationUnit: {
          id: 'provider-ou-1',
          name: 'Flint Clinic',
          type: 'LOCATION'
        },
        availableOrganizationUnits: [
          {
            id: 'provider-ou-1',
            name: 'Flint Clinic',
            type: 'LOCATION'
          }
        ]
      }
    }),
    [providerManifest],
    [
      {
        id: 'flag-provider-plugin',
        key: 'plugins.provider.enabled',
        enabled: true,
        tenantId
      }
    ],
    { audience: 'provider' }
  );

  assert.deepEqual(
    navigation.map((section) => ({
      title: section.title,
      items: section.items.map((item) => item.label)
    })),
    [
      {
        title: 'Provider Operations',
        items: [
          'Dashboard',
          'Scheduling',
          'Authorizations',
          'Utilization',
          'Reporting',
          'Eligibility',
          'Claims & Billing',
          'Documents',
          'Messages'
        ]
      }
    ]
  );
});

test('restricted provider users only see provider capabilities they are authorized for', () => {
  const tenantId = 'tenant-provider';
  const navigation = buildPortalNavigation(
    createUser({
      landingContext: 'provider',
      roles: ['eligibility_coordinator'],
      permissions: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      tenant: {
        id: tenantId,
        name: 'NorthStar Medical Group',
        brandingConfig: {
          purchasedModules: ['provider_operations']
        }
      },
      session: {
        personaType: 'eligibility_coordinator',
        type: 'end_user',
        tenantId,
        roles: ['eligibility_coordinator'],
        permissions: [
          'tenant.view',
          'provider.view',
          'provider.eligibility.view',
          'provider.messages.view',
          'provider.support.view'
        ],
        activeOrganizationUnit: {
          id: 'provider-ou-2',
          name: 'Lansing Clinic',
          type: 'LOCATION'
        },
        availableOrganizationUnits: [
          {
            id: 'provider-ou-2',
            name: 'Lansing Clinic',
            type: 'LOCATION'
          }
        ]
      }
    }),
    [providerManifest],
    [
      {
        id: 'flag-provider-plugin',
        key: 'plugins.provider.enabled',
        enabled: true,
        tenantId
      }
    ],
    { audience: 'provider' }
  );

  assert.deepEqual(
    navigation.map((section) => ({
      title: section.title,
      items: section.items.map((item) => item.label)
    })),
    [
      {
        title: 'Provider Operations',
        items: ['Dashboard', 'Scheduling', 'Utilization', 'Reporting', 'Eligibility', 'Messages']
      }
    ]
  );
});

test('provider end-user navigation does not leak admin-console routes', () => {
  const tenantId = 'tenant-provider';
  const navigation = buildPortalNavigation(
    createUser({
      landingContext: 'provider',
      roles: ['clinic_manager'],
      permissions: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      tenant: {
        id: tenantId,
        name: 'NorthStar Medical Group',
        brandingConfig: {
          purchasedModules: ['provider_operations']
        }
      },
      session: {
        personaType: 'clinic_manager',
        type: 'end_user',
        tenantId,
        roles: ['clinic_manager'],
        permissions: [
          'tenant.view',
          'provider.view',
          'provider.eligibility.view',
          'provider.authorizations.view',
          'provider.claims.view',
          'provider.documents.view',
          'provider.messages.view',
          'provider.support.view'
        ],
        activeOrganizationUnit: {
          id: 'provider-ou-3',
          name: 'Downtown Clinic',
          type: 'LOCATION'
        },
        availableOrganizationUnits: [
          {
            id: 'provider-ou-3',
            name: 'Downtown Clinic',
            type: 'LOCATION'
          }
        ]
      }
    }),
    [providerManifest],
    [
      {
        id: 'flag-provider-plugin',
        key: 'plugins.provider.enabled',
        enabled: true,
        tenantId
      }
    ],
    { audience: 'provider' }
  );

  assert.equal(
    navigation.some((section) =>
      section.items.some((item) => item.href.startsWith('/admin/'))
    ),
    false
  );
});

test('provider poc registration explicitly excludes ai copilot and agentic workflow scope', () => {
  assert.deepEqual(providerManifest.currentScopeExclusions, [
    ...PROVIDER_POC_SCOPE_EXCLUSIONS
  ]);
  assert.deepEqual(providerManifest.capabilities[0]?.currentScopeExclusions, [
    ...PROVIDER_POC_SCOPE_EXCLUSIONS
  ]);
  assert.equal(
    providerManifest.capabilities.some(
      (capability) =>
        capability.id === 'provider_ai_copilot' ||
        capability.id === 'provider_agentic_workflows'
    ),
    false
  );
  assert.equal(
    providerManifest.capabilities.some((capability) =>
      capability.moduleKeys?.some(
        (moduleKey) =>
          moduleKey === 'provider_ai_copilot' ||
          moduleKey === 'provider_agentic_workflows'
      )
    ),
    false
  );
});
