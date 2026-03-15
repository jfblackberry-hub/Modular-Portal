const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3002';
const adminConsoleBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ?? 'http://localhost:3003';

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

export async function searchPlatformContent(userId: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/search?q=${encodeURIComponent(normalizedQuery)}`,
      {
        cache: 'no-store',
        headers: {
          'x-user-id': userId
        }
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
  return `${adminConsoleBaseUrl}/users?${searchParams.toString()}`;
}

export function buildTenantResultHref(tenantId: string) {
  const searchParams = new URLSearchParams({ tenantId });
  return `${adminConsoleBaseUrl}/tenants?${searchParams.toString()}`;
}
