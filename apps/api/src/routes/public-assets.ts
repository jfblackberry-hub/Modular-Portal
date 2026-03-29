import path from 'node:path';

import type { FastifyInstance } from 'fastify';

import { getPublicAssetStorageService } from '@payer-portal/server';

function getContentType(assetPath: string) {
  switch (path.extname(assetPath).toLowerCase()) {
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

export async function publicAssetRoutes(app: FastifyInstance) {
  app.get<{ Params: { '*': string } }>('/tenant-assets/*', async (request, reply) => {
    const assetPath = request.params['*']?.trim();

    if (!assetPath) {
      return reply.status(404).send({ message: 'Asset not found.' });
    }

    try {
      const asset = await getPublicAssetStorageService().get(assetPath);

      reply.header('cache-control', 'public, max-age=300');
      return reply.type(getContentType(assetPath)).send(asset);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return reply.status(404).send({ message: 'Asset not found.' });
      }

      return reply.status(500).send({
        message:
          error instanceof Error ? error.message : 'Unable to load public asset.'
      });
    }
  });
}
