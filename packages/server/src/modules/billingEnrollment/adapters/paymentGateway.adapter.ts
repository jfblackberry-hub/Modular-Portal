import type { RegisteredIntegrationAdapter } from '../../../integrations/integration.js';

export const billingEnrollmentPaymentGatewayAdapter: RegisteredIntegrationAdapter = {
  key: 'billing-enrollment-payment-gateway',
  description: 'Placeholder payment gateway integration for premium collection orchestration.',
  capabilities: {
    authentication: true,
    healthCheck: true,
    rest: true,
    retries: true,
    scheduled: false,
    sync: true
  },
  async validateConfig(config) {
    return config;
  },
  async healthCheck() {
    return {
      ok: true,
      message: 'Payment gateway placeholder adapter reachable.'
    };
  },
  async sync() {
    return {
      ok: true,
      message: 'Payment gateway placeholder sync completed.',
      recordsProcessed: 0
    };
  }
};
