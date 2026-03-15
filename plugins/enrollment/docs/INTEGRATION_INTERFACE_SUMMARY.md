# Integration Interface Summary

Billing & Enrollment reuses shared platform integration contracts and adapters.

## Shared platform services used

- Authentication / SSO context
- Tenant context and branding
- Notification service
- Document storage service
- Audit logging service
- Search and event bus
- Adapter framework

## Billing & Enrollment adapter layer

Located in `packages/server/src/modules/billingEnrollment/adapters`:

- `coreAdminSystem.adapter.ts`
- `paymentGateway.adapter.ts`
- `documentRepository.adapter.ts`
- `crmCaseManagement.adapter.ts`

## Payment abstraction

- Interface: `PaymentGatewayAdapter`
- Mock implementation: `MockPaymentGatewayAdapter`
- Designed for future gateway swap without refactoring service workflows

## Integration-ready boundaries

- Correspondence and notice handoff to notification service
- Document upload hooks aligned to document repository integration
- Support center placeholders aligned to CRM/case integration
- Billing reconciliation hooks aligned to gateway/ledger/bank-feed flows
