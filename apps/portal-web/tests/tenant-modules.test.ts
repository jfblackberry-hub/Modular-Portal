import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import type { PortalSessionUser } from '../lib/portal-session';
import {
  isKnownTenantPortalModuleId,
  isTenantModuleEnabled,
  isTenantModuleEnabledForUser
} from '../lib/tenant-modules';

const originalWarn = console.warn;

afterEach(() => {
  console.warn = originalWarn;
});

function createMemberUser(
  overrides: Partial<PortalSessionUser> & {
    tenant?: Partial<PortalSessionUser['tenant']>;
  } = {}
): PortalSessionUser {
  const { tenant: tenantOverrides, ...rest } = overrides;
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
      brandingConfig: {
        purchasedModules: ['member_home', 'member_claims']
      },
      ...tenantOverrides
    },
    roles: ['member'],
    permissions: ['member.view'],
    ...rest
  };
}

test('valid tenant with enabled module passes', () => {
  console.warn = () => {
    assert.fail('unexpected console.warn');
  };

  const user = createMemberUser();
  assert.equal(isTenantModuleEnabledForUser(user, 'member_home'), true);
  assert.equal(isTenantModuleEnabledForUser(user, 'member_claims'), true);

  assert.equal(
    isTenantModuleEnabled(user.tenant.brandingConfig, 'member_home', {
      tenantId: user.tenant.id
    }),
    true
  );
});

test('valid tenant without licensed module fails', () => {
  console.warn = () => {
    assert.fail('unexpected console.warn');
  };

  const user = createMemberUser();
  assert.equal(isTenantModuleEnabledForUser(user, 'member_billing'), false);
});

test('missing tenant id fails and emits structured security log', () => {
  const warnings: string[] = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  const user = createMemberUser({
    tenant: { id: '   ', name: 'Bad', brandingConfig: { purchasedModules: ['member_home'] } }
  });

  assert.equal(isTenantModuleEnabledForUser(user, 'member_home'), false);
  assert.equal(warnings.length, 1);
  const payload = JSON.parse(warnings[0] ?? '{}') as { reason?: string; security?: string };
  assert.equal(payload.security, 'tenant_module_gate');
  assert.equal(payload.reason, 'missing_tenant_id');
});

test('missing purchased modules list fails and logs', () => {
  const warnings: string[] = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  const user = createMemberUser({
    tenant: {
      id: 'tenant-1',
      name: 'Acme',
      brandingConfig: {}
    }
  });

  assert.equal(isTenantModuleEnabledForUser(user, 'member_home'), false);
  assert.equal(warnings.length, 1);
  const payload = JSON.parse(warnings[0] ?? '{}') as { reason?: string };
  assert.equal(payload.reason, 'missing_or_invalid_purchased_modules');
});

test('null purchasedModules fails', () => {
  const warnings: string[] = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  const user = createMemberUser({
    tenant: {
      id: 'tenant-1',
      name: 'Acme',
      brandingConfig: { purchasedModules: null as unknown as string[] }
    }
  });

  assert.equal(isTenantModuleEnabledForUser(user, 'member_home'), false);
  assert.equal(warnings.length, 1);
});

test('malformed module id fails and logs', () => {
  const warnings: string[] = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  const user = createMemberUser();
  assert.equal(
    isTenantModuleEnabledForUser(
      user,
      'not_a_real_module' as Parameters<typeof isTenantModuleEnabledForUser>[1]
    ),
    false
  );
  assert.equal(warnings.length, 1);
  const payload = JSON.parse(warnings[0] ?? '{}') as { reason?: string };
  assert.equal(payload.reason, 'invalid_module_id');
});

test('isKnownTenantPortalModuleId rejects unknown strings', () => {
  assert.equal(isKnownTenantPortalModuleId('member_home'), true);
  assert.equal(isKnownTenantPortalModuleId('totally_fake'), false);
});

test('provider-class tenant without purchasedModules defaults provider_operations on', () => {
  console.warn = () => {
    assert.fail('unexpected console.warn');
  };

  assert.equal(
    isTenantModuleEnabled(
      {},
      'provider_operations',
      { tenantId: 'clinic-1', tenantTypeCode: 'CLINIC' }
    ),
    true
  );

  assert.equal(
    isTenantModuleEnabled(
      { purchasedModules: [] },
      'provider_dashboard',
      { tenantId: 'clinic-1', tenantTypeCode: 'HOSPITAL' }
    ),
    true
  );
});

test('provider-class tenant with explicit non-provider purchasedModules does not default provider_operations', () => {
  console.warn = () => {
    assert.fail('unexpected console.warn');
  };

  assert.equal(
    isTenantModuleEnabled(
      { purchasedModules: ['member_home'] },
      'provider_operations',
      { tenantId: 'clinic-1', tenantTypeCode: 'CLINIC' }
    ),
    false
  );
});

test('payer tenant still requires purchasedModules for provider_operations', () => {
  const warnings: string[] = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };

  assert.equal(
    isTenantModuleEnabled(
      {},
      'provider_operations',
      { tenantId: 'payer-1', tenantTypeCode: 'PAYER' }
    ),
    false
  );
  assert.equal(warnings.length, 1);
});
