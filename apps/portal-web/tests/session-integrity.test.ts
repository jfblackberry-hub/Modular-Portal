import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAdminConsoleBoundaryUrl,
  canonicalizePortalAdminBoundaryPath,
  isDeprecatedPortalAdminPath
} from '../lib/admin-boundary';
import { buildAdminHandoffUrl } from '../lib/admin-redirect';
import { buildPortalWorkspaceSessionKey } from '../lib/portal-workspace-session';

test('platform-admin portal users are routed to the platform admin health landing in the admin console', () => {
  const url = buildAdminHandoffUrl({
    roles: ['platform_admin'],
    landingContext: 'platform_admin'
  });

  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/admin/overview/health');
  assert.equal(parsed.search, '');
});

test('tenant-admin portal users are routed into the admin console login shell only', () => {
  const url = buildAdminHandoffUrl({
    roles: ['tenant_admin'],
    landingContext: 'tenant_admin'
  });

  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, '/login');
  assert.equal(parsed.search, '');
});

test('deprecated portal tenant-admin paths are retired and do not resolve to admin control-plane routes', () => {
  assert.equal(isDeprecatedPortalAdminPath('/tenant-admin/users'), true);
  assert.equal(
    canonicalizePortalAdminBoundaryPath('/tenant-admin/users?tenantId=tenant-1'),
    '/login'
  );
  assert.match(
    buildAdminConsoleBoundaryUrl('/tenant-admin/integrations?tenantId=tenant-1'),
    /\/login$/
  );
  assert.match(
    buildAdminConsoleBoundaryUrl('/admin/tenant/connectivity?tenantId=tenant-1'),
    /\/admin\/tenant\/connectivity\?tenantId=tenant-1$/
  );
});

test('portal workspace keys include preview session identity to avoid collisions', () => {
  const sharedUser = {
    id: 'user-1',
    tenant: {
      id: 'tenant-1',
      name: 'Tenant One'
    },
    session: {
      type: 'end_user' as const,
      personaType: 'member' as const,
      tenantId: 'tenant-1',
      roles: ['member'],
      permissions: ['member.view'],
      activeOrganizationUnit: null,
      availableOrganizationUnits: []
    }
  };

  const primaryKey = buildPortalWorkspaceSessionKey({
    portal: 'member',
    user: sharedUser
  });
  const previewOneKey = buildPortalWorkspaceSessionKey({
    portal: 'member',
    user: {
      ...sharedUser,
      previewSession: {
        id: 'preview-1',
        portalType: 'member',
        persona: 'member',
        mode: 'READ_ONLY',
        adminUserEmail: 'admin@example.com',
        createdAt: '2026-03-22T00:00:00.000Z',
        expiresAt: '2026-03-22T00:01:00.000Z',
        homePath: '/preview/preview-1'
      }
    }
  });
  const previewTwoKey = buildPortalWorkspaceSessionKey({
    portal: 'member',
    user: {
      ...sharedUser,
      previewSession: {
        id: 'preview-2',
        portalType: 'member',
        persona: 'member',
        mode: 'READ_ONLY',
        adminUserEmail: 'admin@example.com',
        createdAt: '2026-03-22T00:00:00.000Z',
        expiresAt: '2026-03-22T00:01:00.000Z',
        homePath: '/preview/preview-2'
      }
    }
  });

  assert.notEqual(primaryKey, previewOneKey);
  assert.notEqual(previewOneKey, previewTwoKey);
  assert.match(previewOneKey, /preview-1/);
  assert.match(previewTwoKey, /preview-2/);
});

test('portal workspace keys include landing and preview persona context for concurrent sessions', () => {
  const baseUser = {
    id: 'user-1',
    tenant: {
      id: 'tenant-1',
      name: 'Tenant One'
    },
    session: {
      type: 'end_user' as const,
      personaType: 'member' as const,
      tenantId: 'tenant-1',
      roles: ['member'],
      permissions: ['member.view'],
      activeOrganizationUnit: null,
      availableOrganizationUnits: []
    },
    landingContext: 'member' as const
  };

  const memberPreviewKey = buildPortalWorkspaceSessionKey({
    portal: 'member',
    user: {
      ...baseUser,
      previewSession: {
        id: 'preview-shared',
        portalType: 'member',
        persona: 'member',
        mode: 'READ_ONLY',
        adminUserEmail: 'admin@example.com',
        createdAt: '2026-03-22T00:00:00.000Z',
        expiresAt: '2026-03-22T00:01:00.000Z',
        homePath: '/preview/member'
      }
    }
  });
  const employerPreviewKey = buildPortalWorkspaceSessionKey({
    portal: 'employer',
    user: {
      ...baseUser,
      landingContext: 'employer',
      previewSession: {
        id: 'preview-shared',
        portalType: 'employer',
        persona: 'employer_admin',
        mode: 'FUNCTIONAL',
        adminUserEmail: 'admin@example.com',
        createdAt: '2026-03-22T00:00:00.000Z',
        expiresAt: '2026-03-22T00:01:00.000Z',
        homePath: '/preview/employer'
      }
    }
  });

  assert.notEqual(memberPreviewKey, employerPreviewKey);
  assert.match(memberPreviewKey, /member:member:READ_ONLY:preview-shared:user-1$/);
  assert.match(
    employerPreviewKey,
    /employer:employer:employer_admin:FUNCTIONAL:preview-shared:user-1$/
  );
});
