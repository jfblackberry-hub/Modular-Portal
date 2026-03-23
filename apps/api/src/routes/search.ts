import type { FastifyInstance } from 'fastify';

import {
  AuthenticationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';
import { searchTenantData } from '../services/search-service';

type SearchQuery = {
  q?: string;
};

export async function searchRoutes(app: FastifyInstance) {
  app.get<{ Querystring: SearchQuery }>('/api/search', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      return await searchTenantData({
        query: request.query.q ?? '',
        userId: currentUser.id
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        request.log.warn(
          { event: 'search.route.access_denied', path: request.url, reason: error.message },
          'Search route access denied'
        );
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof Error) {
        const status =
          error.message === 'Authenticated user not found' ? 401 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations.'
      });
    }
  });
}
