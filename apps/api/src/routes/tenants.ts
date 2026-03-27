import type { FastifyInstance } from 'fastify';
import type { TenantType } from '@payer-portal/database';
import type { CoreTenantType } from '@payer-portal/shared-types';

import { uploadBrandingLogoForTenant } from '../services/branding-service';
import {
  createCapability,
  createTenantTemplate,
  listCapabilities,
  listTenantCapabilityMatrix,
  listTenantExperiences,
  listTenantTemplates,
  listTenantTypesWithTemplates,
  saveTenantExperienceCapabilities,
  upsertTenantExperience,
  updateCapability,
  updateTenantTemplate
} from '../services/admin-control-plane-service';
import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  archiveTenant,
  createTenant,
  deleteTenant,
  getTenantById,
  importTenantOfficeLocations,
  listTenantOrganizationUnits,
  listTenants,
  updateTenantOfficeLocation,
  updateTenant
} from '../services/tenant-service';

type TenantBody = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type: TenantType;
  templateId?: string | null;
  metadata?: Record<string, unknown>;
  brandingConfig: Record<string, unknown>;
};

type TenantUpdateBody = {
  status?: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type?: TenantType;
  quotaUsers?: number;
  quotaMembers?: number;
  quotaStorageGb?: number;
};

type OfficeLocationUpdateBody = {
  activeFlag?: boolean | null;
  city?: string | null;
  company?: string | null;
  locationId?: string | null;
  name?: string;
  notes?: string | null;
  phone?: string | null;
  region?: string | null;
  servicesOffered?: string[];
  state?: string | null;
  streetAddress?: string | null;
  zip?: string | null;
};

type TenantTemplateBody = {
  code: string;
  name: string;
  tenantTypeCode: CoreTenantType;
  description?: string | null;
  defaultOrganizationUnitStructure: string[];
  defaultCapabilities: string[];
  defaultExperiences: string[];
};

type CapabilityBody = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  configSchema?: Record<string, unknown>;
};

type TenantExperienceBody = {
  key: string;
  name: string;
  description?: string | null;
  layout?: Record<string, unknown>;
};

type TenantExperienceCapabilitiesBody = {
  capabilities: Array<{
    capabilityId: string;
    enabled: boolean;
    displayOrder: number;
    config?: Record<string, unknown>;
  }>;
};

export async function tenantRoutes(app: FastifyInstance) {
  app.get('/platform-admin/tenant-types', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listTenantTypesWithTemplates();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message: 'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.get('/platform-admin/tenant-templates', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listTenantTemplates();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message: 'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: TenantTemplateBody }>(
    '/platform-admin/tenant-templates',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const template = await createTenantTemplate(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(template);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: Partial<TenantTemplateBody> }>(
    '/platform-admin/tenant-templates/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await updateTenantTemplate(request.params.id, request.body ?? {}, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get('/platform-admin/capabilities', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listCapabilities();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message: 'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: CapabilityBody }>(
    '/platform-admin/capabilities',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const capability = await createCapability(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(capability);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: Partial<CapabilityBody> }>(
    '/platform-admin/capabilities/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await updateCapability(request.params.id, request.body ?? {}, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get('/platform-admin/tenants', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listTenants();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message: 'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Body: TenantBody }>(
    '/platform-admin/tenants',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await createTenant(request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
        return reply.status(201).send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          return reply.status(400).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await getTenantById(request.params.id);

        if (!tenant) {
          return reply.status(404).send({
            message: 'Tenant not found'
          });
        }

        return tenant;
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/experiences',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await listTenantExperiences(request.params.id);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.post<{ Params: { id: string }; Body: TenantExperienceBody }>(
    '/platform-admin/tenants/:id/experiences',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const experience = await upsertTenantExperience(request.params.id, request.body, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(experience);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string; experienceId: string }; Body: TenantExperienceBody }>(
    '/platform-admin/tenants/:id/experiences/:experienceId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const experience = await upsertTenantExperience(request.params.id, {
          ...request.body,
          key: request.body.key || request.params.experienceId,
          name: request.body.name || request.params.experienceId
        }, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.send(experience);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.put<{ Params: { id: string; experienceId: string }; Body: TenantExperienceCapabilitiesBody }>(
    '/platform-admin/tenants/:id/experiences/:experienceId/capabilities',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await saveTenantExperienceCapabilities(
          request.params.id,
          request.params.experienceId,
          request.body.capabilities ?? [],
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/capabilities',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        return await listTenantCapabilityMatrix(request.params.id);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message: 'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: TenantUpdateBody }>(
    '/platform-admin/tenants/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await updateTenant(
          request.params.id,
          request.body ?? {},
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/organization-units',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const organizationUnits = await listTenantOrganizationUnits(
          request.params.id
        );

        return reply.send(organizationUnits);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/office-locations/import',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: 'A delimited office location file is required.'
          });
        }

        const result = await importTenantOfficeLocations(request.params.id, file, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.patch<{ Params: { id: string; organizationUnitId: string }; Body: OfficeLocationUpdateBody }>(
    '/platform-admin/tenants/:id/organization-units/:organizationUnitId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const result = await updateTenantOfficeLocation(
          request.params.id,
          request.params.organizationUnitId,
          request.body,
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );

        return reply.send(result);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message.includes('not found') ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/archive',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const tenant = await archiveTenant(request.params.id, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const result = await deleteTenant(request.params.id, {
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    '/platform-admin/tenants/:id/logo',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            message: 'Logo file is required'
          });
        }

        const tenant = await uploadBrandingLogoForTenant(
          request.params.id,
          file,
          {
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          }
        );
        return reply.status(201).send(tenant);
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof AuthenticationError) {
            return reply.status(401).send({ message: error.message });
          }

          if (error instanceof AuthorizationError) {
            return reply.status(403).send({ message: error.message });
          }

          const status = error.message === 'Tenant not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );
}
