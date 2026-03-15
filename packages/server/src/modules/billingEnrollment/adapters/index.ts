import { getIntegrationAdapter, registerIntegrationAdapter } from '../../../integrations/registry.js';
import { billingEnrollmentCoreAdminAdapter } from './coreAdminSystem.adapter.js';
import { billingEnrollmentCrmCaseManagementAdapter } from './crmCaseManagement.adapter.js';
import { billingEnrollmentDocumentRepositoryAdapter } from './documentRepository.adapter.js';
import { billingEnrollmentPaymentGatewayAdapter } from './paymentGateway.adapter.js';

export const billingEnrollmentAdapters = [
  billingEnrollmentCoreAdminAdapter,
  billingEnrollmentPaymentGatewayAdapter,
  billingEnrollmentDocumentRepositoryAdapter,
  billingEnrollmentCrmCaseManagementAdapter
];

export function registerBillingEnrollmentAdapters() {
  for (const adapter of billingEnrollmentAdapters) {
    if (!getIntegrationAdapter(adapter.key)) {
      registerIntegrationAdapter(adapter);
    }
  }

  return billingEnrollmentAdapters;
}
