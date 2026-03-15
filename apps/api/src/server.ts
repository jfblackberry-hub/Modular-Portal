import Fastify from 'fastify';
import {
  initializeMonitoring,
  registerBillingEnrollmentAdapters,
  registerIntegrationEventSubscriptions,
  recordApiRequest,
  registerJobEventSubscriptions
} from '@payer-portal/server';

import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';

export function buildServer() {
  initializeMonitoring();
  registerJobEventSubscriptions();
  registerIntegrationEventSubscriptions();
  registerBillingEnrollmentAdapters();

  const app = Fastify({
    logger: true
  });

  app.addHook('onRequest', async (request) => {
    request.headers['x-request-start-ms'] = String(Date.now());
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = Number(request.headers['x-request-start-ms'] ?? Date.now());
    const route = request.routeOptions.url || request.url;

    recordApiRequest({
      durationMs: Date.now() - startedAt,
      method: request.method,
      route,
      statusCode: reply.statusCode
    });
  });

  registerPlugins(app);
  registerRoutes(app);

  return app;
}

async function start() {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3002);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (process.env.PAYER_PORTAL_API_AUTOSTART !== 'false') {
  void start();
}
