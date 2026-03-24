function encodeCacheSegment(value: string | null | undefined) {
  const normalized = value?.trim() || 'none';
  return encodeURIComponent(normalized);
}

export function buildTenantCacheKey(input: {
  tenantId: string;
  resource: string;
  parts?: Array<string | null | undefined>;
}) {
  const segments = [
    'tenant',
    input.tenantId,
    input.resource,
    ...(input.parts ?? [])
  ].map(encodeCacheSegment);

  return segments.join(':');
}

export function buildPlatformCacheKey(input: {
  resource: string;
  parts?: Array<string | null | undefined>;
}) {
  return buildTenantCacheKey({
    tenantId: 'platform',
    resource: input.resource,
    parts: input.parts
  });
}
