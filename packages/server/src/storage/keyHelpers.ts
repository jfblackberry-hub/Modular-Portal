import path from 'node:path';

export function sanitizeStorageKeySegment(value: string) {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');

  if (!normalized) {
    throw new Error('Storage key segment is required');
  }

  return normalized.replace(/[^a-zA-Z0-9._/-]+/g, '-');
}

export function sanitizeStorageFileName(fileName: string) {
  const normalized = path.basename(fileName).trim();

  if (!normalized) {
    throw new Error('Filename is required');
  }

  return normalized.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function joinStorageKey(...segments: Array<string | null | undefined>) {
  return segments
    .filter((segment): segment is string => Boolean(segment && segment.trim()))
    .map((segment) => sanitizeStorageKeySegment(segment))
    .join('/');
}

export function buildTenantLogoStorageKey(input: {
  fileName: string;
  tenantId: string;
}) {
  return joinStorageKey('tenant', input.tenantId, 'logos', input.fileName);
}

export function buildTenantDocumentStorageKey(input: {
  documentId: string;
  fileName: string;
  tenantId: string;
}) {
  return joinStorageKey(
    'tenant',
    input.tenantId,
    'documents',
    `${sanitizeStorageKeySegment(input.documentId)}-${sanitizeStorageFileName(input.fileName)}`
  );
}

export function buildBackupArtifactStorageKey(input: {
  backupId: string;
  createdAt: string;
  fileName: string;
}) {
  return joinStorageKey(
    'platform',
    'backups',
    input.createdAt.slice(0, 10),
    input.backupId,
    input.fileName
  );
}

export function assertTenantStorageKey(storageKey: string, tenantId: string) {
  const normalizedStorageKey = sanitizeStorageKeySegment(storageKey);
  const normalizedTenantId = sanitizeStorageKeySegment(tenantId);
  const tenantPrefix = `tenant/${normalizedTenantId}/`;

  if (
    normalizedStorageKey.startsWith(tenantPrefix) ||
    normalizedStorageKey.startsWith('platform/')
  ) {
    return normalizedStorageKey;
  }

  throw new Error('Storage key does not match the authenticated tenant scope.');
}
