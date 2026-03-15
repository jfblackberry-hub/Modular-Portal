# Billing & Enrollment Domain Model Summary

## Enrollment Domain

- ApplicantProfile
- SubscriberProfile
- DependentProfile
- HouseholdProfile
- PlanSelectionCandidate
- EffectiveDateSelection
- QualifyingLifeEventInput
- EnrollmentStatusTracker
- DocumentRequirementHook

## Billing Domain

- BillingAccount
- PremiumInvoice
- PremiumInvoiceLine
- Payment
- PaymentMethodToken
- AutopayEnrollment
- DelinquencyStatus
- GracePeriod
- RefundOrReversal
- BillingStatement
- ReconciliationStatusHook

## Workspace/Operational Models

- EnrollmentCase
- PlanCatalogItem
- EligibilityRuleSummary
- InvoiceSummary
- PaymentSummary
- DocumentRequirement
- RenewalWorkflow
- CorrespondenceNotice

## Supporting Experiences Models

- DependentRecord (experience model)
- RequestedDocumentRecord
- UploadedDocumentRecord
- CorrespondenceNoticeRecord
- Support center topic/FAQ/case/contact records

## Tenant Module Config Models

- BillingEnrollmentModuleConfig
- BillingEnrollmentModuleVariant (`commercial`, `medicare`, `medicaid`, `employer_group`)
- Feature flags, payment options, autopay options, document requirements
- Support contact content and renewal messaging
