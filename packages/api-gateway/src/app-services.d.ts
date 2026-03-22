declare module '../../../apps/api/dist/services/current-user-service.js' {
  export class AuthenticationError extends Error {}
  export class AuthorizationError extends Error {}

  export type CurrentUser = {
    id: string;
    tenantId: string;
    email: string;
    roles: string[];
    permissions: string[];
    accessibleTenantIds: string[];
    tenantAdminTenantIds: string[];
  };

  export function getCurrentUserFromHeaders(headers: HeadersInit): Promise<CurrentUser>;
  export function resolveTenantScope(
    user: CurrentUser,
    requestedTenantId?: string | null
  ): string;
  export function assertPlatformAdmin(user: CurrentUser): void;
  export function assertTenantAdmin(user: CurrentUser): void;
}

declare module '../../../apps/api/dist/services/auth-service.js' {
  export function login(
    input: { email: string; password: string },
    context?: { ipAddress?: string; userAgent?: string | string[] | undefined }
  ): Promise<
    | {
        token: string;
        user: {
          id: string;
          email: string;
          tenant: { id: string };
          roles: string[];
          permissions: string[];
        };
      }
    | null
  >;
}

declare module '../../../apps/api/dist/services/document-service.js' {
  import type { MultipartFile } from '@fastify/multipart';

  export class DocumentFileNotFoundError extends Error {}

  export function listDocuments(input: { userId: string }): Promise<unknown>;
  export function downloadDocument(input: {
    documentId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string | string[] | undefined;
  }): Promise<{
    document: {
      filename: string;
      mimeType: string;
    };
    fileBuffer: Buffer;
  }>;
  export function uploadDocument(input: {
    file: MultipartFile;
    userId: string;
    status?: string;
    tags?: unknown;
    ipAddress?: string;
    userAgent?: string | string[] | undefined;
  }): Promise<unknown>;
}

declare module '../../../apps/api/dist/services/role-service.js' {
  export function listUsers(): Promise<unknown>;
  export function createUser(
    input: {
      tenantId?: string;
      email: string;
      firstName: string;
      lastName: string;
      isActive?: boolean;
    },
    context?: {
      actorUserId?: string | null;
      ipAddress?: string;
      userAgent?: string | string[] | undefined;
    }
  ): Promise<unknown>;
  export function updateUser(
    userId: string,
    input: {
      tenantId?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    }
  ): Promise<unknown>;
  export function deleteUser(userId: string): Promise<unknown>;
  export function assignRoleToUser(userId: string, roleId: string): Promise<unknown>;
}

declare module '../../../apps/api/dist/services/search-service.js' {
  export function searchTenantData(input: {
    query: string;
    userId: string;
  }): Promise<unknown>;
}

declare module '../../../apps/api/dist/services/tenant-service.js' {
  export function listTenants(): Promise<unknown>;
  export function getTenantById(id: string): Promise<unknown>;
  export function createTenant(
    input: {
      name: string;
      slug: string;
      status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
      brandingConfig: Record<string, unknown>;
    },
    context?: {
      actorUserId?: string | null;
      ipAddress?: string;
      userAgent?: string | string[] | undefined;
    }
  ): Promise<unknown>;
}
