import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import type { FastifyRequest } from 'fastify';

import {
  BoundedRateLimiter,
  buildApiGatewayRateLimitKey,
  getApiGatewayRateLimitEnvConfig,
  getGatewayRateLimiter,
  resetGatewayRateLimiterForTests
} from '../src/rate-limit-store.js';

function mockRequest(partial: Record<string, unknown>): FastifyRequest {
  return partial as unknown as FastifyRequest;
}

afterEach(() => {
  delete process.env.API_GATEWAY_RATE_LIMIT_MAX;
  delete process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS;
  delete process.env.API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS;
});

test('BoundedRateLimiter allows requests under threshold', () => {
  const limiter = new BoundedRateLimiter();
  const now = 1_000_000;
  const windowMs = 60_000;
  const max = 5;
  const cap = 100;

  for (let i = 0; i < max; i += 1) {
    const d = limiter.check('k1', max, windowMs, cap, now);
    assert.equal(d.allowed, true);
  }
});

test('BoundedRateLimiter rejects when over threshold until window resets', () => {
  const limiter = new BoundedRateLimiter();
  const t0 = 2_000_000;
  const windowMs = 60_000;
  const max = 3;
  const cap = 100;

  assert.equal(limiter.check('route-a', max, windowMs, cap, t0).allowed, true);
  assert.equal(limiter.check('route-a', max, windowMs, cap, t0).allowed, true);
  assert.equal(limiter.check('route-a', max, windowMs, cap, t0).allowed, true);

  const blocked = limiter.check('route-a', max, windowMs, cap, t0);
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) {
    assert.ok(blocked.retryAfterSec >= 1);
  }

  const tAfter = t0 + windowMs + 1;
  const again = limiter.check('route-a', max, windowMs, cap, tAfter);
  assert.equal(again.allowed, true);
});

test('BoundedRateLimiter evicts LRU when at capacity (high-cardinality abuse simulation)', () => {
  const limiter = new BoundedRateLimiter();
  const now = 5_000_000;
  const windowMs = 120_000;
  const max = 10;
  const cap = 5;

  for (let i = 0; i < cap; i += 1) {
    limiter.check(`attacker-${i}`, max, windowMs, cap, now);
  }

  assert.equal(limiter.getTrackedKeyCountForTests(), cap);

  limiter.check('attacker-new', max, windowMs, cap, now);
  assert.equal(limiter.getTrackedKeyCountForTests(), cap);

  const lostKey = 'attacker-0';
  assert.equal(limiter.getTrackedKeyCountForTests(), cap);
  const fresh = limiter.check(lostKey, max, windowMs, cap, now);
  assert.equal(fresh.allowed, true);
});

test('BoundedRateLimiter drops expired buckets before LRU when evicting', () => {
  const limiter = new BoundedRateLimiter();
  const windowMs = 1_000;
  const max = 1;
  const cap = 2;
  const t0 = 10_000_000;

  limiter.check('a', max, windowMs, cap, t0);
  limiter.check('b', max, windowMs, cap, t0);
  assert.equal(limiter.getTrackedKeyCountForTests(), 2);

  const t1 = t0 + windowMs + 1;
  limiter.check('c', max, windowMs, cap, t1);

  assert.equal(limiter.getTrackedKeyCountForTests(), 2);
  const forA = limiter.check('a', max, windowMs, cap, t1);
  assert.equal(forA.allowed, true);
});

test('buildApiGatewayRateLimitKey uses route pattern and hashes identity', () => {
  const req = mockRequest({
    method: 'GET',
    url: '/api/v1/documents?foo=1',
    routeOptions: { url: '/api/v1/documents' },
    ip: '203.0.113.50'
  });

  const key = buildApiGatewayRateLimitKey(req);
  assert.match(key, /^GET:\/api\/v1\/documents:[A-Za-z0-9_-]{16}$/);
});

test('buildApiGatewayRateLimitKey strips query when no route pattern', () => {
  const req = mockRequest({
    method: 'POST',
    url: '/api/v1/auth/login?x=' + 'q'.repeat(500),
    ip: '10.0.0.1'
  });

  const key = buildApiGatewayRateLimitKey(req);
  assert.ok(!key.includes('?'));
  assert.ok(key.startsWith('POST:'));
});

test('getApiGatewayRateLimitEnvConfig treats invalid env as defaults', () => {
  process.env.API_GATEWAY_RATE_LIMIT_MAX = 'not-a-number';
  process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS = '-5';
  process.env.API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS = 'NaN';

  const c = getApiGatewayRateLimitEnvConfig();
  assert.equal(c.max, 100);
  assert.equal(c.windowMs, 60_000);
  assert.equal(c.maxTrackedKeys, 50_000);
});

test('shared gateway rate limiter remains bounded under many unique keys', () => {
  resetGatewayRateLimiterForTests();
  const limiter = getGatewayRateLimiter();
  const max = 1;
  const windowMs = 60_000;
  const cap = 100;
  const t0 = 20_000_000;

  for (let i = 0; i < 5000; i += 1) {
    limiter.check(`synth-${i}`, max, windowMs, cap, t0);
  }

  assert.ok(limiter.getTrackedKeyCountForTests() <= cap);
  resetGatewayRateLimiterForTests();
});
