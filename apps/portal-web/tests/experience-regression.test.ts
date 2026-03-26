import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { manifest as brokerManifest } from '../../../plugins/broker/src/index';
import { manifest as enrollmentManifest } from '../../../plugins/enrollment/src/index';
import { manifest as memberManifest } from '../../../plugins/member/src/index';
import { manifest as providerManifest } from '../../../plugins/provider/src/index';
import type { PlatformFeatureFlag, PluginManifest } from '@payer-portal/plugin-sdk';

import { buildPortalNavigation } from '../lib/navigation';
import type { PortalSessionUser } from '../lib/portal-session';

type RegressionAudience = 'member' | 'employer' | 'broker' | 'provider';

const regressionPlugins: PluginManifest[] = [
  memberManifest,
  providerManifest,
  brokerManifest,
  enrollmentManifest
];

function createFeatureFlags(): PlatformFeatureFlag[] {
  return regressionPlugins.map((plugin) => ({
    id: `flag-${plugin.id}`,
    key: `plugins.${plugin.id}.enabled`,
    enabled: true,
    tenantId: null
  }));
}

function createUser(audience: RegressionAudience): PortalSessionUser {
  const tenantId = `tenant-${audience}`;

  const tenantBrandingConfigByAudience: Record<RegressionAudience, Record<string, unknown>> = {
    member: {
      purchasedModules: [
        'member_home',
        'member_benefits',
        'member_claims',
        'member_id_card',
        'member_providers',
        'member_authorizations',
        'member_messages',
        'member_documents',
        'member_care_cost_estimator',
        'member_support'
      ]
    },
    employer: {
      purchasedModules: ['billing_enrollment']
    },
    broker: {
      purchasedModules: []
    },
    provider: {
      purchasedModules: ['provider_operations']
    }
  };

  const roleConfigByAudience: Record<
    RegressionAudience,
    { permissions: string[]; roles: string[] }
  > = {
    member: {
      roles: ['member'],
      permissions: ['member.view']
    },
    employer: {
      roles: ['employer_group_admin'],
      permissions: ['member.view', 'tenant.view', 'billing_enrollment.view']
    },
    broker: {
      roles: ['broker'],
      permissions: ['tenant.view', 'billing_enrollment.view']
    },
    provider: {
      roles: ['clinic_manager'],
      permissions: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view',
        'provider.patients.view',
        'provider.admin.manage'
      ]
    }
  };

  const roleConfig = roleConfigByAudience[audience];

  return {
    id: `user-${audience}`,
    email: `${audience}@example.com`,
    firstName: audience[0].toUpperCase() + audience.slice(1),
    lastName: 'Regression',
    landingContext: audience,
    tenant: {
      id: tenantId,
      name: `${audience[0].toUpperCase() + audience.slice(1)} Tenant`,
      brandingConfig: tenantBrandingConfigByAudience[audience]
    },
    roles: roleConfig.roles,
    permissions: roleConfig.permissions,
    session: {
      personaType: roleConfig.roles[0] ?? audience,
      type: 'end_user',
      tenantId,
      roles: roleConfig.roles,
      permissions: roleConfig.permissions,
      activeOrganizationUnit:
        audience === 'provider'
          ? {
              id: 'provider-regression-ou',
              name: 'Regression Clinic',
              type: 'LOCATION'
            }
          : null,
      availableOrganizationUnits:
        audience === 'provider'
          ? [
              {
                id: 'provider-regression-ou',
                name: 'Regression Clinic',
                type: 'LOCATION'
              }
            ]
          : []
    }
  };
}

function normalizeNavigation(
  navigation: ReturnType<typeof buildPortalNavigation>
) {
  return navigation.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({
      label: item.label,
      href: item.href
    }))
  }));
}

async function readGoldenSnapshot() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFilePath);
  const raw = await readFile(
    path.join(currentDirectory, 'experience-regression.golden.json'),
    'utf8'
  );

  return JSON.parse(raw) as Record<RegressionAudience, ReturnType<typeof normalizeNavigation>>;
}

test('navigation baseline stays stable across member, employer, broker, and provider experiences', async () => {
  const goldenSnapshot = await readGoldenSnapshot();
  const featureFlags = createFeatureFlags();

  for (const audience of ['member', 'employer', 'broker', 'provider'] as const) {
    const navigation = normalizeNavigation(
      buildPortalNavigation(createUser(audience), regressionPlugins, featureFlags, {
        audience
      })
    );

    assert.deepEqual(navigation, goldenSnapshot[audience], `${audience} navigation changed`);
  }
});
