import { apiRoutes, openApiSpecification } from '@payer-portal/api-contracts';
import { prisma } from '@payer-portal/database';
import { readFile } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

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

export async function memberRoutes(app: FastifyInstance) {
  app.get(apiRoutes.me, async (_, reply) => {
    const user = await getDefaultMemberUser();

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    return {
      member: {
        id: user.id,
        sourceSystem: 'local-portal-db',
        sourceRecordId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        dob: '1989-06-15',
        memberNumber: 'M00012345',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      permissions:
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        ) || mockPermissions
    };
  });

  app.get(apiRoutes.memberProfile, async (_, reply) => {
    const user = await getDefaultMemberUser();

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    return {
      id: user.id,
      sourceSystem: 'local-portal-db',
      sourceRecordId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      dob: '1989-06-15',
      memberNumber: 'M00012345',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  });

  app.get(apiRoutes.memberCoverage, async (_, reply) => {
    const user = await getDefaultMemberUser();

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

  app.get(apiRoutes.memberClaims, async (_, reply) => {
    const user = await getDefaultMemberUser();

    if (!user) {
      return reply.status(503).send({
        message: 'Seeded portal user not found. Run the database seed.'
      });
    }

    const claimDocuments = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        tags: {
          path: ['claimNumber'],
          not: undefined
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      items: claimDocuments.map((document) => {
        const tags = getDocumentTags(document.tags);

        return {
          id: document.id,
          sourceSystem: 'local-portal-db',
          sourceRecordId: document.id,
          memberId: user.id,
          coverageId: `coverage-${user.tenantId}`,
          claimNumber: getString(tags.claimNumber) ?? `CLM-${document.id.slice(0, 8)}`,
          claimDate: getString(tags.claimDate) ?? document.createdAt.toISOString(),
          status: getString(tags.claimStatus) ?? 'processing',
          totalAmount: getNumber(tags.totalAmount) ?? 0,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString()
        };
      })
    };
  });

  app.get(apiRoutes.memberDocuments, async (_, reply) => {
    const user = await getDefaultMemberUser();

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

  app.get(apiRoutes.memberMessages, async (_, reply) => {
    const user = await getDefaultMemberUser();

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

  app.get(apiRoutes.memberAuthorizations, async (_, reply) => {
    const user = await getDefaultMemberUser();

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
      const user = await getDefaultMemberUser();

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
