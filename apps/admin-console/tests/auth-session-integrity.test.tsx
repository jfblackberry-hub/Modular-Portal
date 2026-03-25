import assert from 'node:assert/strict';
import { test } from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import AdminPersonaWorkspacePage from '../app/admin/workspace/[sessionId]/page';
import { isReturnToPortalRequest } from '../lib/admin-login-query';

test('admin login ignores legacy query-param bootstrap inputs', () => {
  const params = new URLSearchParams({
    admin_user_id: 'admin',
    admin_email: 'admin@example.com',
    redirect: '/admin/platform/health'
  });

  assert.equal(isReturnToPortalRequest(params), false);
});

test('admin workspace route no longer embeds portal composition', async () => {
  const page = await AdminPersonaWorkspacePage({
    params: Promise.resolve({ sessionId: 'missing-session' })
  });
  const markup = renderToStaticMarkup(page);

  assert.match(markup, /Embedded admin workspaces are retired/i);
  assert.match(markup, /Open session controls/i);
  assert.doesNotMatch(markup, /iframe/i);
});
