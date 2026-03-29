import crypto from 'node:crypto';

import type { FastifyRequest } from 'fastify';

/**
 * API Gateway rate limiting — instance-local, bounded memory.
 *
 * Environment (see also packages/api-gateway/RATE_LIMITING.md):
 * - API_GATEWAY_RATE_LIMIT_MAX — max requests per window per key; 0 disables limiting
 * - API_GATEWAY_RATE_LIMIT_WINDOW_MS — window length in ms; 0 disables
 * - API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS — hard cap on distinct client+route buckets (LRU eviction)
 *
 * Distributed / multi-instance: each process tracks its own counters. For a shared limit across
 * replicas, follow up with Redis (or similar) keyed by the same logical key shape.
 */

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

type Bucket = {
  count: number;
  resetAt: number;
};

function readNonNegativeInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }

  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }

  return Math.trunc(n);
}

export function getApiGatewayRateLimitEnvConfig() {
  return {
    max: readNonNegativeInt('API_GATEWAY_RATE_LIMIT_MAX', 100),
    windowMs: readNonNegativeInt('API_GATEWAY_RATE_LIMIT_WINDOW_MS', 60_000),
    maxTrackedKeys: readNonNegativeInt('API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS', 50_000)
  };
}

function stableShortFingerprint(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('base64url').slice(0, 16);
}

function routeTemplateOrPath(request: FastifyRequest): string {
  const pattern = request.routeOptions?.url;
  if (pattern) {
    return pattern.length > 256 ? pattern.slice(0, 256) : pattern;
  }

  const raw = request.url ?? '/';
  const q = raw.indexOf('?');
  const path = q === -1 ? raw : raw.slice(0, q);
  const trimmed = path.length > 256 ? path.slice(0, 256) : path;
  return trimmed || '/';
}

export function buildApiGatewayRateLimitKey(request: FastifyRequest): string {
  const method = request.method;
  const route = routeTemplateOrPath(request);
  const identityRaw = request.gatewayAuth?.currentUser?.id ?? request.ip ?? 'unknown';
  const identity = stableShortFingerprint(String(identityRaw));
  return `${method}:${route}:${identity}`;
}

export class BoundedRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  resetForTests() {
    this.buckets.clear();
  }

  getTrackedKeyCountForTests() {
    return this.buckets.size;
  }

  check(
    key: string,
    max: number,
    windowMs: number,
    maxTrackedKeys: number,
    nowMs: number
  ): RateLimitDecision {
    const cap = Math.max(1, maxTrackedKeys);

    let bucket = this.buckets.get(key);
    if (bucket && bucket.resetAt <= nowMs) {
      this.buckets.delete(key);
      bucket = undefined;
    }

    if (!bucket) {
      while (this.buckets.size >= cap && !this.buckets.has(key)) {
        this.evictOneBucket(nowMs);
      }

      this.buckets.set(key, {
        count: 1,
        resetAt: nowMs + windowMs
      });
      this.touch(key);
      return { allowed: true };
    }

    if (bucket.count >= max) {
      this.touch(key);
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - nowMs) / 1000))
      };
    }

    bucket.count += 1;
    this.touch(key);
    return { allowed: true };
  }

  private touch(key: string) {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      return;
    }

    this.buckets.delete(key);
    this.buckets.set(key, bucket);
  }

  /**
   * Prefer evicting expired buckets; otherwise drop least-recently-used (Map insertion order).
   */
  private evictOneBucket(nowMs: number) {
    for (const [k, v] of this.buckets) {
      if (v.resetAt <= nowMs) {
        this.buckets.delete(k);
        return;
      }
    }

    const oldest = this.buckets.keys().next().value;
    if (oldest !== undefined) {
      this.buckets.delete(oldest);
    }
  }
}

const gatewayRateLimiter = new BoundedRateLimiter();

export function getGatewayRateLimiter() {
  return gatewayRateLimiter;
}

export function resetGatewayRateLimiterForTests() {
  gatewayRateLimiter.resetForTests();
}
