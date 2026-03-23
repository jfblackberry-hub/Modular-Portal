import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import {
  assignRoleToUser,
  createRole,
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  removeRoleFromUser,
  updateUser
} from '../services/role-service';

type CreateRoleBody = {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
};

type AssignRoleBody = {
  roleId: string;
};

type CreateUserBody = {
  tenantId?: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

type UpdateUserBody = {
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

export async function roleRoutes(app: FastifyInstance) {
  app.get('/platform-admin/roles', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listRoles();
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
  });

  app.post<{ Body: CreateRoleBody }>('/platform-admin/roles', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const role = await createRole(request.body);
      return reply.status(201).send(role);
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
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.post<{ Params: { userId: string }; Body: AssignRoleBody }>(
    '/platform-admin/users/:userId/roles',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const assignment = await assignRoleToUser(
          request.params.userId,
          request.body.roleId
        );
        return reply.status(201).send(assignment);
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
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.delete<{ Params: { userId: string; roleId: string } }>(
    '/platform-admin/users/:userId/roles/:roleId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const result = await removeRoleFromUser(
          request.params.userId,
          request.params.roleId
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
          const status = error.message === 'User not found' || error.message === 'Role not found' || error.message === 'Role assignment not found'
            ? 404
            : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.get('/platform-admin/users', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listUsers();
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
  });

  app.post<{ Body: CreateUserBody }>('/platform-admin/users', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const user = await createUser(request.body, {
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
      return reply.status(201).send(user);
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
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });

  app.patch<{ Params: { userId: string }; Body: UpdateUserBody }>(
    '/platform-admin/users/:userId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const user = await updateUser(request.params.userId, request.body);
        return reply.send(user);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations.'
        });
      }
    }
  );

  app.delete<{ Params: { userId: string } }>(
    '/platform-admin/users/:userId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const deletedUser = await deleteUser(request.params.userId);
        return reply.send(deletedUser);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return reply.status(401).send({ message: error.message });
        }

        if (error instanceof AuthorizationError) {
          return reply.status(403).send({ message: error.message });
        }

        if (error instanceof Error) {
          const status = error.message === 'User not found' ? 404 : 400;
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
