import type { FastifyInstance } from 'fastify';

import {
  getHealthStatus,
  getLiveStatus,
  getReadinessStatus
} from '../services/health-service';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health/live', async () => getLiveStatus());

  app.get('/health/ready', async (_request, reply) => {
    const result = await getReadinessStatus();

    return reply.status(result.ready ? 200 : 503).send(result.response);
  });

  app.get('/health', async (_request, reply) => {
    const result = await getHealthStatus();

    return reply.status(result.ready ? 200 : 503).send(result.response);
  });
}
