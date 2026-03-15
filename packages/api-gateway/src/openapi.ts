export function getOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Payer Portal API Gateway',
      version: '1.0.0',
      description:
        'Gateway API for portal UI and external clients with JWT auth, tenant scoping, validation, and versioned routes.'
    },
    servers: [
      {
        url: '/api/v1'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        TenantHeader: {
          name: 'x-tenant-id',
          in: 'header',
          required: false,
          schema: {
            type: 'string'
          },
          description:
            'Optional tenant override. Platform admins may scope requests to another tenant.'
        }
      }
    },
    paths: {
      '/auth/login': {
        post: {
          summary: 'Authenticate a user and issue a gateway JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Authenticated user with bearer token'
            }
          }
        }
      },
      '/users': {
        get: {
          summary: 'List platform users',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User list' } }
        },
        post: {
          summary: 'Create a platform user',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Created user' } }
        }
      },
      '/documents': {
        get: {
          summary: 'List tenant documents',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { '200': { description: 'Document list' } }
        },
        post: {
          summary: 'Upload a tenant document',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { '201': { description: 'Uploaded document' } }
        }
      },
      '/documents/{id}/download': {
        get: {
          summary: 'Download a tenant document',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Document file' } }
        }
      },
      '/notifications': {
        get: {
          summary: 'List notifications for the current user',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { '200': { description: 'Notification list' } }
        },
        post: {
          summary: 'Create a notification',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { '201': { description: 'Created notification' } }
        }
      },
      '/notifications/{id}/read': {
        patch: {
          summary: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Updated notification' } }
        }
      },
      '/tenants': {
        get: {
          summary: 'List tenants',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Tenant list' } }
        },
        post: {
          summary: 'Create a tenant',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Created tenant' } }
        }
      },
      '/tenants/{id}': {
        get: {
          summary: 'Get tenant by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Tenant details' } }
        }
      },
      '/search': {
        get: {
          summary: 'Search tenant-scoped entities',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            {
              name: 'q',
              in: 'query',
              required: false,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Search results' } }
        }
      }
    }
  } as const;
}
