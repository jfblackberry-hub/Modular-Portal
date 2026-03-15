import type { FastifyInstance } from 'fastify';

import { handlePrometheusMetrics } from '@payer-portal/server';

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics', async (request, reply) => {
    const originHeader = request.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

    if (origin) {
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Vary', 'Origin');
    } else {
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    }

    reply.hijack();
    handlePrometheusMetrics(request.raw, reply.raw);
  });
}
