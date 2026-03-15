import { prisma } from '@payer-portal/database';

type SearchInput = {
  query: string;
  userId: string;
};

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

async function getAuthenticatedUser(userId: string) {
  const normalizedUserId = normalizeRequired(userId, 'User');

  const user = await prisma.user.findUnique({
    where: { id: normalizedUserId },
    include: {
      tenant: true
    }
  });

  if (!user) {
    throw new Error('Authenticated user not found');
  }

  return user;
}

export async function searchTenantData(input: SearchInput) {
  const user = await getAuthenticatedUser(input.userId);
  const query = normalizeRequired(input.query, 'query');

  const [documents, users, tenants] = await Promise.all([
    prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          {
            filename: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            mimeType: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            status: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    prisma.tenant.findMany({
      where: {
        id: user.tenantId,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            slug: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
  ]);

  return {
    query,
    results: {
      documents: documents.map((document) => ({
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        status: document.status,
        createdAt: document.createdAt
      })),
      users: users.map((matchedUser) => ({
        id: matchedUser.id,
        email: matchedUser.email,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        isActive: matchedUser.isActive,
        createdAt: matchedUser.createdAt
      })),
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        createdAt: tenant.createdAt
      }))
    }
  };
}
