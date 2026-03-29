import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NextRequest } from 'next/server';

import { middleware } from '../middleware';

test('provider login page remains reachable without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/provider-login')
  );

  assert.equal(response?.status, 200);
});

test('provider auth endpoint remains reachable without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/api/auth/login/provider', {
      method: 'POST'
    })
  );

  assert.equal(response?.status, 200);
});

test('generic login page remains reachable without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/login')
  );

  assert.equal(response?.status, 200);
});

test('public selector auth routes remain reachable without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/api/auth/login/catalog')
  );

  assert.equal(response?.status, 200);
});
