import { apiRoutes } from './contracts.js';

export const openApiSpecification = {
  openapi: '3.1.0',
  info: {
    title: 'Payer Portal Member API',
    version: '0.1.0',
    description:
      'Local development API contracts backed by canonical healthcare fixtures.'
  },
  paths: {
    [apiRoutes.me]: {
      get: {
        summary: 'Get the current member context',
        responses: {
          '200': {
            description: 'Current member profile and permissions'
          }
        }
      }
    },
    [apiRoutes.memberProfile]: {
      get: {
        summary: 'Get the current member profile',
        responses: {
          '200': {
            description: 'Canonical member profile'
          }
        }
      }
    },
    [apiRoutes.memberCoverage]: {
      get: {
        summary: 'Get current member coverage',
        responses: {
          '200': {
            description: 'Coverage list for the current member'
          }
        }
      }
    },
    [apiRoutes.memberClaims]: {
      get: {
        summary: 'Get current member claims',
        responses: {
          '200': {
            description: 'Claim list for the current member'
          }
        }
      }
    },
    [apiRoutes.memberDocuments]: {
      get: {
        summary: 'Get current member documents',
        responses: {
          '200': {
            description: 'Document list for the current member'
          }
        }
      }
    },
    [apiRoutes.memberMessages]: {
      get: {
        summary: 'Get current member messages',
        responses: {
          '200': {
            description: 'Secure message list for the current member'
          }
        }
      }
    },
    [apiRoutes.memberAuthorizations]: {
      get: {
        summary: 'Get current member authorizations',
        responses: {
          '200': {
            description: 'Prior authorization list for the current member'
          }
        }
      }
    }
  }
} as const;

export const openApiSpecificationJson = JSON.stringify(
  openApiSpecification,
  null,
  2
);
