import { apiRoutes, openApiSpecification } from '@payer-portal/api-contracts';
import { prisma } from '@payer-portal/database';
import { readFile } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';
import type { IncomingHttpHeaders } from 'node:http';
import {
  getCatalogClaims,
  getCatalogMemberProfile,
  getCatalogProviders
} from '../services/portal-catalog-service';

const mockPermissions = ['member.view', 'tenant.view'];
const DEFAULT_MEMBER_EMAIL = 'maria';

function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function getDocumentTags(tags: unknown) {
  return tags && typeof tags === 'object' && !Array.isArray(tags)
    ? (tags as Record<string, unknown>)
    : {};
}

function getPortalCatalogContext(user: {
  tenant: {
    slug: string;
    brandingConfig: unknown;
  };
}) {
  return {
    tenantSlug: user.tenant.slug,
    brandingConfig: user.tenant.brandingConfig
  };
}

async function getDefaultMemberUser() {
  const include = {
    tenant: {
      include: {
        branding: true
      }
    },
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  } as const;

  const defaultMember = await prisma.user.findUnique({
    where: {
      email: DEFAULT_MEMBER_EMAIL
    },
    include
  });

  if (defaultMember) {
    return defaultMember;
  }

  return prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: {
            code: 'member'
          }
        }
      }
    },
    include
  });
}

function getRequestedUserId(headers: IncomingHttpHeaders) {
  const value = headers['x-user-id'];
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? '';
  }

  return typeof value === 'string' ? value.trim() : '';
}

async function getMemberUser(headers: IncomingHttpHeaders) {
  const include = {
    tenant: {
      include: {
        branding: true
      }
    },
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  } as const;

  const requestedUserId = getRequestedUserId(headers);

  if (requestedUserId) {
    const requestedUser = await prisma.user.findUnique({
      where: {
        id: requestedUserId
      },
      include
    });

    if (requestedUser) {
      return requestedUser;
    }
  }

  return getDefaultMemberUser();
}

export async function memberRoutes(app: FastifyInstance) {
  app.get(apiRoutes.me, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const portalCatalogContext = getPortalCatalogContext(user);
    const catalogProfile = await getCatalogMemberProfile(
      portalCatalogContext,
      user.email
    );

    return {
      member: {
        id: user.id,
        sourceSystem: catalogProfile ? 'portal-catalog-sql' : 'local-portal-db',
        sourceRecordId: catalogProfile?.id ?? user.id,
        firstName: catalogProfile?.firstName ?? user.firstName,
        lastName: catalogProfile?.lastName ?? user.lastName,
        dob: catalogProfile?.dob ?? '1989-06-15',
        memberNumber: catalogProfile?.memberNumber ?? 'M00012345',
        createdAt: catalogProfile?.createdAt ?? user.createdAt.toISOString(),
        updatedAt: catalogProfile?.updatedAt ?? user.updatedAt.toISOString()
      },
      permissions:
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        ) || mockPermissions
    };
  });

  app.get(apiRoutes.memberProfile, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const portalCatalogContext = getPortalCatalogContext(user);
    const catalogProfile = await getCatalogMemberProfile(
      portalCatalogContext,
      user.email
    );

    return {
      id: user.id,
      sourceSystem: catalogProfile ? 'portal-catalog-sql' : 'local-portal-db',
      sourceRecordId: catalogProfile?.id ?? user.id,
      firstName: catalogProfile?.firstName ?? user.firstName,
      lastName: catalogProfile?.lastName ?? user.lastName,
      dob: catalogProfile?.dob ?? '1989-06-15',
      memberNumber: catalogProfile?.memberNumber ?? 'M00012345',
      createdAt: catalogProfile?.createdAt ?? user.createdAt.toISOString(),
      updatedAt: catalogProfile?.updatedAt ?? user.updatedAt.toISOString()
    };
  });

  app.get(apiRoutes.memberCoverage, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    return {
      items: [
        {
          id: `coverage-${user.tenantId}`,
          sourceSystem: 'local-portal-db',
          sourceRecordId: user.tenantId,
          memberId: user.id,
          planName: `${user.tenant.name} Gold PPO`,
          effectiveDate: '2026-01-01',
          terminationDate: null,
          createdAt: user.tenant.createdAt.toISOString(),
          updatedAt: user.tenant.updatedAt.toISOString()
        }
      ]
    };
  });

  app.get(apiRoutes.memberClaims, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const portalCatalogContext = getPortalCatalogContext(user);
    const catalogClaims = await getCatalogClaims(portalCatalogContext, user.email);

    if (catalogClaims) {
      return {
        items: catalogClaims.map((claim) => ({
          id: claim.id,
          sourceSystem: 'portal-catalog-sql',
          sourceRecordId: claim.id,
          memberId: user.id,
          coverageId: `coverage-${user.tenantId}`,
          claimNumber: claim.claimNumber,
          claimDate: claim.claimDate,
          status: claim.status,
          totalAmount: claim.totalAmount,
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt
        }))
      };
    }

    const claimDocuments = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      items: claimDocuments
        .map((document) => {
          const tags = getDocumentTags(document.tags);

          return {
            id: document.id,
            sourceSystem: 'local-portal-db',
            sourceRecordId: document.id,
            memberId: user.id,
            coverageId: `coverage-${user.tenantId}`,
            claimNumber:
              getString(tags.claimNumber) ?? `CLM-${document.id.slice(0, 8)}`,
            claimDate: getString(tags.claimDate) ?? document.createdAt.toISOString(),
            status: getString(tags.claimStatus) ?? 'processing',
            totalAmount: getNumber(tags.totalAmount) ?? 0,
            createdAt: document.createdAt.toISOString(),
            updatedAt: document.updatedAt.toISOString()
          };
        })
        .filter((claim) => claim.claimNumber.length > 0)
    };
  });

  app.get('/api/v1/member/providers', async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const portalCatalogContext = getPortalCatalogContext(user);
    const catalogProviders = await getCatalogProviders(portalCatalogContext);

    if (catalogProviders) {
      return {
        items: catalogProviders.map((provider) => ({
          id: provider.id,
          sourceSystem: 'portal-catalog-sql',
          sourceRecordId: provider.id,
          name: provider.name,
          providerNumber: provider.providerNumber,
          npi: provider.providerNumber,
          specialty: provider.specialty,
          status: provider.status
        }))
      };
    }

    const providerUsers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        roles: {
          some: {
            role: {
              code: 'provider'
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      items: providerUsers.map((providerUser) => ({
        id: providerUser.id,
        sourceSystem: 'local-portal-db',
        sourceRecordId: providerUser.id,
        name: `${providerUser.firstName} ${providerUser.lastName}`,
        npi: null,
        specialty: null,
        status: providerUser.isActive ? 'active' : 'inactive'
      }))
    };
  });

  app.get(apiRoutes.memberDocuments, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const documents = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      items: documents.map((document) => {
        const tags = getDocumentTags(document.tags);

        return {
          id: document.id,
          sourceSystem: 'local-portal-db',
          sourceRecordId: document.id,
          memberId: user.id,
          documentType: getString(tags.documentType) ?? 'member-document',
          title: getString(tags.title) ?? document.filename,
          mimeType: document.mimeType,
          url: `/api/v1/member/documents/${document.id}/download`,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString()
        };
      })
    };
  });

  app.get(apiRoutes.memberMessages, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      items: notifications.map((notification) => ({
        id: notification.id,
        subject: notification.subject ?? 'Portal message',
        from: notification.channel === 'EMAIL' ? 'Member services' : 'Secure inbox',
        status: notification.status,
        preview: notification.body,
        channel: notification.channel,
        createdAt: notification.createdAt.toISOString()
      }))
    };
  });

  app.get(apiRoutes.memberAuthorizations, async (request, reply) => {
    const user = await getMemberUser(request.headers);

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const authorizations = await prisma.job.findMany({
      where: {
        tenantId: user.tenantId,
        type: 'authorization.review'
      },
      orderBy: {
        runAt: 'desc'
      }
    });

    return {
      items: authorizations.map((authorization) => {
        const payload = getDocumentTags(authorization.payload);

        return {
          id: authorization.id,
          service: getString(payload.service) ?? 'Authorization request',
          status: getString(payload.statusLabel) ?? authorization.status,
          submittedOn: authorization.runAt.toISOString(),
          type: authorization.type,
          detail: getString(payload.detail)
        };
      })
    };
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/member/documents/:id/download',
    async (request, reply) => {
      const user = await getMemberUser(request.headers);

      if (!user) {
        return reply.status(503).send({
          message: 'Seeded portal user not found. Run the database seed.'
        });
      }

      const document = await prisma.document.findFirst({
        where: {
          id: request.params.id,
          tenantId: user.tenantId
        }
      });

      if (!document) {
        return reply.status(404).send({ message: 'Document not found.' });
      }

      try {
        const buffer = await readFile(document.storageKey, {
          storageDir: 'storage'
        });

        return reply
          .header('Content-Type', document.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${document.filename}"`
          )
          .send(buffer);
      } catch {
        return reply.status(404).send({ message: 'Document file not found.' });
      }
    }
  );

  app.get('/api/v1/openapi.json', async (_, reply) => {
    return reply.send(openApiSpecification);
  });
}
