import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canonicalizeAdminPath,
  isRetiredAdminAliasPath
} from '../lib/admin-route-aliases';

test('canonical admin routes remain canonical', () => {
  assert.equal(
    canonicalizeAdminPath('/admin/platform/health'),
    '/admin/platform/health'
  );
  assert.equal(
    canonicalizeAdminPath('/admin/tenant/health'),
    '/admin/tenant/health'
  );
});

test('legacy admin aliases are retired and no longer resolve to live admin routes', () => {
  assert.equal(isRetiredAdminAliasPath('/platform-admin/users'), true);
  assert.equal(isRetiredAdminAliasPath('/platform/tenants/create'), true);
  assert.equal(isRetiredAdminAliasPath('/tenant-admin/documents'), true);
  assert.equal(
    canonicalizeAdminPath('/platform-admin/users'),
    null
  );
  assert.equal(
    canonicalizeAdminPath('/platform/tenants/create'),
    null
  );
  assert.equal(
    canonicalizeAdminPath('/tenant-admin/documents'),
    null
  );
  assert.equal(
    canonicalizeAdminPath('/tenant-admin'),
    null
  );
});
