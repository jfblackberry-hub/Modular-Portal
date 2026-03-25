import assert from 'node:assert/strict';
import { test } from 'node:test';

import { manifest as providerManifest } from '../../../plugins/provider/src/index';
import type {
  PlatformFeatureFlag,
  PluginManifest
} from '@payer-portal/plugin-sdk';

import { buildPortalNavigation } from '../lib/navigation';
import type { PortalSessionUser } from '../lib/portal-session';

function createUser(overrides: Partial<PortalSessionUser> = {}): PortalSessionUser {
  return {
    id: 'user-1',
    email: 'member@example.com',
    firstName: 'Alex',
    lastName: 'Taylor',
    session: {
      personaType: 'end_user',
      type: 'end_user',
      tenantId: 'tenant-1',
      roles: ['member'],
      permissions: ['member.view']
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
        personaType: 'end_user',
        type: 'end_user',
        tenantId: 'tenant-1',
        roles: ['employer_group_admin'],
        permissions: []
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
          purchasedModules: [
            'provider_dashboard',
            'provider_eligibility',
            'provider_authorizations',
            'provider_claims',
            'provider_payments',
            'provider_documents',
            'provider_messages',
            'provider_support'
          ]
        }
      },
      session: {
        personaType: 'end_user',
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
        title: 'Provider Services',
        items: [
          'Dashboard',
          'Eligibility',
          'Authorizations',
          'Claims & Payments',
          'Documents',
          'Messages',
          'Support'
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
          purchasedModules: [
            'provider_dashboard',
            'provider_eligibility',
            'provider_authorizations',
            'provider_claims',
            'provider_payments',
            'provider_documents',
            'provider_messages',
            'provider_support'
          ]
        }
      },
      session: {
        personaType: 'end_user',
        type: 'end_user',
        tenantId,
        roles: ['eligibility_coordinator'],
        permissions: [
          'tenant.view',
          'provider.view',
          'provider.eligibility.view',
          'provider.messages.view',
          'provider.support.view'
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
        title: 'Provider Services',
        items: ['Dashboard', 'Eligibility', 'Messages', 'Support']
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
          purchasedModules: [
            'provider_dashboard',
            'provider_eligibility',
            'provider_authorizations',
            'provider_claims',
            'provider_payments',
            'provider_documents',
            'provider_messages',
            'provider_support'
          ]
        }
      },
      session: {
        personaType: 'end_user',
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
