import assert from 'node:assert/strict';
import { test } from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AdminPersonaWorkspace } from '../components/admin-platform/admin-persona-workspace';
import { isReturnToPortalRequest } from '../lib/admin-login-query';

test('admin login ignores legacy query-param bootstrap inputs', () => {
  const params = new URLSearchParams({
    admin_user_id: 'admin',
    admin_email: 'admin@example.com',
    redirect: '/admin/platform/health'
  });

  assert.equal(isReturnToPortalRequest(params), false);
});

test('admin persona workspace fails closed when session state is missing', () => {
  const markup = renderToStaticMarkup(
    <AdminPersonaWorkspace
      sessionId="missing-session"
      tenantId=""
      personaType="tenant_admin"
      userId=""
    />
  );

  assert.match(markup, /Session Unavailable/i);
  assert.doesNotMatch(markup, /unknown-tenant/i);
  assert.doesNotMatch(markup, /unknown-user/i);
});
