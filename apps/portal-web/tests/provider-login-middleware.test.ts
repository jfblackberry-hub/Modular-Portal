import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NextRequest } from 'next/server';

import { middleware } from '../middleware';

test('provider login page is redirected behind the demo gate without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/provider-login')
  );

  assert.equal(response?.status, 307);
  assert.equal(response?.headers.get('location'), 'http://localhost:3000/');
});

test('provider auth endpoint is blocked behind the demo gate without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/api/auth/login/provider', {
      method: 'POST'
    })
  );

  assert.equal(response?.status, 403);
});

test('generic demo login remains gated without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/login')
  );

  assert.equal(response?.status, 307);
  assert.equal(response?.headers.get('location'), 'http://localhost:3000/');
});

test('public selector auth routes are blocked behind the demo gate without demo access', async () => {
  const response = await middleware(
    new NextRequest('http://localhost:3000/api/auth/login/catalog')
  );

  assert.equal(response?.status, 403);
});
