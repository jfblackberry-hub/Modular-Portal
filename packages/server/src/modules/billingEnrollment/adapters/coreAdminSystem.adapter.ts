import type { RegisteredIntegrationAdapter } from '../../../integrations/integration.js';

export const billingEnrollmentCoreAdminAdapter: RegisteredIntegrationAdapter = {
  key: 'billing-enrollment-core-admin',
  description: 'Placeholder adapter for enrollment and account transactions in the core admin system.',
  capabilities: {
    authentication: true,
    eventTrigger: true,
    healthCheck: true,
    rest: true,
    scheduled: true,
    sync: true
  },
  async validateConfig(config) {
    return config;
  },
  async healthCheck() {
    return {
      ok: true,
      message: 'Core admin placeholder adapter reachable.'
    };
  },
  async sync() {
    return {
      ok: true,
      message: 'Core admin placeholder sync completed.',
      recordsProcessed: 0
    };
  }
};
