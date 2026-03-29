import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ADMIN_POST_LOGIN_REDIRECT,
  parseSafeAdminPostLoginRedirect,
  sanitizeAdminPostLoginRedirect,
  sanitizeSameOriginRelativeRedirect
} from '../lib/safe-admin-redirect';

const PORTAL_HANDOFF = 'https://portal.example.com/api/auth/handoff';

test('parseSafeAdminPostLoginRedirect accepts valid internal admin paths', () => {
  assert.equal(parseSafeAdminPostLoginRedirect('/admin'), '/admin');
  assert.equal(
    parseSafeAdminPostLoginRedirect('/admin/platform/health'),
    '/admin/platform/health'
  );
  assert.equal(
    parseSafeAdminPostLoginRedirect('/admin/tenants/t1/organization?tab=users'),
    '/admin/tenants/t1/organization?tab=users'
  );
  assert.equal(parseSafeAdminPostLoginRedirect('/admin#section'), '/admin#section');
});

test('parseSafeAdminPostLoginRedirect rejects external https URL', () => {
  assert.equal(
    parseSafeAdminPostLoginRedirect('https://evil.com/admin'),
    undefined
  );
});

test('parseSafeAdminPostLoginRedirect rejects protocol-relative URL', () => {
  assert.equal(parseSafeAdminPostLoginRedirect('//evil.com/path'), undefined);
});

test('parseSafeAdminPostLoginRedirect rejects javascript payload', () => {
  assert.equal(
    parseSafeAdminPostLoginRedirect('javascript:alert(1)'),
    undefined
  );
});

test('parseSafeAdminPostLoginRedirect rejects data URL scheme', () => {
  assert.equal(
    parseSafeAdminPostLoginRedirect('data:text/html,<script>'),
    undefined
  );
});

test('parseSafeAdminPostLoginRedirect rejects encoded bypass attempts', () => {
  assert.equal(parseSafeAdminPostLoginRedirect('%2f%2fevil.com'), undefined);
  assert.equal(parseSafeAdminPostLoginRedirect('%252f%252fevil.com'), undefined);
  assert.equal(
    parseSafeAdminPostLoginRedirect('/admin/%2e%2e/login'),
    undefined
  );
});

test('parseSafeAdminPostLoginRedirect rejects empty and null', () => {
  assert.equal(parseSafeAdminPostLoginRedirect(''), undefined);
  assert.equal(parseSafeAdminPostLoginRedirect('   '), undefined);
  assert.equal(parseSafeAdminPostLoginRedirect(null), undefined);
  assert.equal(parseSafeAdminPostLoginRedirect(undefined), undefined);
});

test('sanitizeAdminPostLoginRedirect falls back for invalid input', () => {
  assert.equal(
    sanitizeAdminPostLoginRedirect('https://evil.com'),
    DEFAULT_ADMIN_POST_LOGIN_REDIRECT
  );
  assert.equal(
    sanitizeAdminPostLoginRedirect(undefined),
    DEFAULT_ADMIN_POST_LOGIN_REDIRECT
  );
  assert.equal(
    sanitizeAdminPostLoginRedirect('//evil.com', { fallback: '/admin/overview/health' }),
    '/admin/overview/health'
  );
});

test('sanitizeSameOriginRelativeRedirect keeps paths on handoff origin', () => {
  assert.equal(
    sanitizeSameOriginRelativeRedirect('/dashboard', PORTAL_HANDOFF, '/dashboard'),
    '/dashboard'
  );
  assert.equal(
    sanitizeSameOriginRelativeRedirect(
      '/members/profile',
      PORTAL_HANDOFF,
      '/dashboard'
    ),
    '/members/profile'
  );
});

test('sanitizeSameOriginRelativeRedirect rejects cross-origin targets', () => {
  assert.equal(
    sanitizeSameOriginRelativeRedirect('https://evil.com/x', PORTAL_HANDOFF, '/dashboard'),
    '/dashboard'
  );
  assert.equal(
    sanitizeSameOriginRelativeRedirect('//evil.com/', PORTAL_HANDOFF, '/dashboard'),
    '/dashboard'
  );
});
