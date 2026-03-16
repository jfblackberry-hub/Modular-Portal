import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

export function registerPlugins(app: FastifyInstance) {
  // Shared Fastify plugins will be registered here as the API grows.
  void app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  void app.register(multipart);
}
