import type { IncomingHttpHeaders } from 'node:http';

import type { FastifyInstance } from 'fastify';

import {
  DocumentFileNotFoundError,
  downloadDocument,
  listDocuments,
  uploadDocument
} from '../services/document-service';

function parseTags(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

function getUserIdFromHeaders(headers: IncomingHttpHeaders) {
  const userIdHeader = headers['x-user-id'];

  return typeof userIdHeader === 'string'
    ? userIdHeader
    : Array.isArray(userIdHeader)
      ? userIdHeader[0]
      : '';
}

export async function documentRoutes(app: FastifyInstance) {
  app.get('/api/documents', async (request, reply) => {
    const userId = getUserIdFromHeaders(request.headers);

    if (!userId) {
      return reply.status(401).send({
        message: 'Authenticated user required. Provide x-user-id header.'
      });
    }

    try {
      return await listDocuments({ userId });
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message === 'Authenticated user not found' ? 401 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.get<{ Params: { id: string } }>(
    '/api/documents/:id/download',
    async (request, reply) => {
      const userId = getUserIdFromHeaders(request.headers);

      if (!userId) {
        return reply.status(401).send({
          message: 'Authenticated user required. Provide x-user-id header.'
        });
      }

      try {
        const result = await downloadDocument({
          documentId: request.params.id,
          userId,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });

        return reply
          .header('Content-Type', result.document.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${result.document.filename}"`
          )
          .send(result.fileBuffer);
      } catch (error) {
        if (
          error instanceof DocumentFileNotFoundError ||
          (error instanceof Error && error.message === 'Document not found')
        ) {
          return reply.status(404).send({
            message: 'Document not found.'
          });
        }

        if (error instanceof Error) {
          const status = error.message === 'Authenticated user not found' ? 401 : 400;
          return reply.status(status).send({ message: error.message });
        }

        return reply.status(503).send({
          message:
            'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
        });
      }
    }
  );

  app.post('/api/documents/upload', async (request, reply) => {
    const userId = getUserIdFromHeaders(request.headers);

    if (!userId) {
      return reply.status(401).send({
        message: 'Authenticated user required. Provide x-user-id header.'
      });
    }

    try {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          message: 'File is required.'
        });
      }

      const statusField = file.fields.status;
      const tagsField = file.fields.tags;

      const document = await uploadDocument({
        file,
        userId,
        status:
          statusField && 'value' in statusField && typeof statusField.value === 'string'
            ? statusField.value
            : undefined,
        tags:
          tagsField && 'value' in tagsField && typeof tagsField.value === 'string'
            ? parseTags(tagsField.value)
            : undefined,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return reply.status(201).send(document);
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message === 'Authenticated user not found' ? 401 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });
}
