import type { FastifyInstance } from 'fastify';

import { searchTenantData } from '../services/search-service';

type SearchQuery = {
  q?: string;
};

function getUserIdHeader(headers: Record<string, unknown>) {
  const userIdHeader = headers['x-user-id'];

  return typeof userIdHeader === 'string'
    ? userIdHeader
    : Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : '';
}

export async function searchRoutes(app: FastifyInstance) {
  app.get<{ Querystring: SearchQuery }>('/api/search', async (request, reply) => {
    const userId = getUserIdHeader(request.headers);

    if (!userId) {
      return reply.status(401).send({
        message: 'Authenticated user required. Provide x-user-id header.'
      });
    }

    try {
      return await searchTenantData({
        query: request.query.q ?? '',
        userId
      });
    } catch (error) {
      if (error instanceof Error) {
        const status =
          error.message === 'Authenticated user not found' ? 401 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });
}
