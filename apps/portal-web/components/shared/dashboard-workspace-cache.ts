'use client';

import { buildTenantCacheKey } from '@payer-portal/config/cache-keys';

const workspaceResponseMemoryCache = new Map<string, unknown>();
const workspaceInflightRequestCache = new Map<string, Promise<unknown>>();

function buildStorageKey(cacheKey: string) {
  return buildTenantCacheKey({
    tenantId: 'session',
    resource: 'dashboard-workspace-cache',
    parts: [cacheKey]
  });
}

export function readCachedWorkspaceResponse<T>(cacheKey: string) {
  if (workspaceResponseMemoryCache.has(cacheKey)) {
    return workspaceResponseMemoryCache.get(cacheKey) as T;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(buildStorageKey(cacheKey));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as T;
    workspaceResponseMemoryCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    window.sessionStorage.removeItem(buildStorageKey(cacheKey));
    return null;
  }
}

export function writeCachedWorkspaceResponse<T>(cacheKey: string, value: T) {
  workspaceResponseMemoryCache.set(cacheKey, value);

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(buildStorageKey(cacheKey), JSON.stringify(value));
}

export function clearCachedWorkspaceResponse(cacheKey: string) {
  workspaceResponseMemoryCache.delete(cacheKey);

  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(buildStorageKey(cacheKey));
}

export function getInflightWorkspaceRequest<T>(cacheKey: string) {
  return (workspaceInflightRequestCache.get(cacheKey) as Promise<T> | undefined) ?? null;
}

export function setInflightWorkspaceRequest<T>(
  cacheKey: string,
  request: Promise<T>
) {
  workspaceInflightRequestCache.set(cacheKey, request as Promise<unknown>);
}

export function clearInflightWorkspaceRequest(cacheKey: string) {
  workspaceInflightRequestCache.delete(cacheKey);
}
