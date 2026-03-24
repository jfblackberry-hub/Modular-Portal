import 'server-only';

import { buildPortalApiHeaders } from './api-request';
import { config } from './server-runtime';

export type SearchDocumentResult = {
  id: string;
  filename: string;
  mimeType: string;
  status: string;
  createdAt: string | Date;
};

export type SearchUserResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string | Date;
};

export type SearchTenantResult = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string | Date;
};

export type PlatformSearchResponse = {
  query: string;
  results: {
    documents: SearchDocumentResult[];
    users: SearchUserResult[];
    tenants: SearchTenantResult[];
  };
};

export async function searchPlatformContent(accessToken: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  try {
    const response = await fetch(
      `${config.apiBaseUrl}/api/search?q=${encodeURIComponent(normalizedQuery)}`,
      {
        cache: 'no-store',
        headers: await buildPortalApiHeaders({}, { accessToken })
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PlatformSearchResponse;
  } catch {
    return null;
  }
}

export function buildDocumentResultHref(searchBasePath: string, documentId: string) {
  const searchParams = new URLSearchParams({ documentId });
  const sectionBasePath = searchBasePath.startsWith('/member')
    ? '/member/documents'
    : '/dashboard';

  return `${sectionBasePath}?${searchParams.toString()}`;
}

export function buildUserResultHref(userId: string) {
  const searchParams = new URLSearchParams({ userId });
  return `${config.serviceEndpoints.admin}/users?${searchParams.toString()}`;
}

export function buildTenantResultHref(tenantId: string) {
  const searchParams = new URLSearchParams({ tenantId });
  return `${config.serviceEndpoints.admin}/tenants?${searchParams.toString()}`;
}
