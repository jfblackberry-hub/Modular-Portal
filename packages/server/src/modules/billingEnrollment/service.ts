import { randomUUID } from 'node:crypto';

import type { Prisma } from '@payer-portal/database';

import { publishInBackground } from '../../events/eventBus.js';
import { logAuditEvent } from '../../services/auditService.js';
import type {
  AutopayEnrollment,
  BillingAccount,
  BillingStatement,
  DelinquencyStatus,
  GracePeriod,
  Payment,
  PaymentMethodToken,
  PremiumInvoice,
  ReconciliationStatusHook,
  RefundOrReversal
} from './billing.js';
import type {
  ApplicantProfile,
  DependentProfile,
  DocumentRequirementHook,
  EnrollmentStatusTracker,
  HouseholdProfile,
  PlanSelectionCandidate,
  QualifyingLifeEventInput
} from './domain.js';
import { MockPaymentGatewayAdapter } from './paymentGateway.js';
import type {
  BillingEnrollmentContext,
  BillingEnrollmentWorkspaceSnapshot,
  CorrespondenceNotice,
  DocumentRequirement,
  EnrollmentCase,
  InvoiceSummary,
  PaymentSummary,
  PlanCatalogItem,
  RenewalWorkflow
} from './types.js';
import { runEnrollmentValidations } from './validation.js';

function nowIso() {
  return new Date().toISOString();
}

function toPlanCandidate(plan: PlanCatalogItem): PlanSelectionCandidate {
  return {
    planId: plan.id,
    planName: plan.name,
    badge:
      plan.code === 'BRONZE-HDH'
        ? 'lowest_premium'
        : plan.code === 'GOLD-PPO'
          ? 'most_popular'
          : 'best_value',
    benefits: {
      premium: plan.monthlyPremium,
      deductible: plan.code === 'GOLD-PPO' ? 1500 : plan.code === 'SILVER-HMO' ? 3000 : 5500,
      outOfPocketMax: plan.code === 'GOLD-PPO' ? 7800 : plan.code === 'SILVER-HMO' ? 8600 : 9200,
      pcpSummary: '$25 PCP',
      specialistSummary: '$50 Specialist',
      pharmacySummary: '$10 / $35 / $70 tiers',
      networkFitSummary: plan.code === 'GOLD-PPO' ? 'Broad PPO network' : 'High-value regional network'
    }
  };
}

function buildPlanCatalog(): PlanCatalogItem[] {
  return [
    { id: 'plan-gold-ppo', code: 'GOLD-PPO', name: 'Gold PPO', metalTier: 'Gold', monthlyPremium: 412.33 },
    { id: 'plan-silver-hmo', code: 'SILVER-HMO', name: 'Silver HMO', metalTier: 'Silver', monthlyPremium: 338.91 },
    { id: 'plan-bronze-hdhp', code: 'BRONZE-HDH', name: 'Bronze HDHP', metalTier: 'Bronze', monthlyPremium: 279.42 }
  ];
}

function buildEnrollmentCases(): EnrollmentCase[] {
  return [
    {
      id: 'enr-10021',
      householdId: 'hh-8843',
      status: 'IN_PROGRESS',
      selectedPlanId: 'plan-gold-ppo',
      effectiveDate: '2026-04-01',
      updatedAt: nowIso()
    }
  ];
}

function buildInvoices(): InvoiceSummary[] {
  return [
    { id: 'inv-2026-04', period: 'Apr 2026', amountDue: 412.33, dueDate: '2026-04-01', status: 'OPEN' },
    { id: 'inv-2026-03', period: 'Mar 2026', amountDue: 412.33, dueDate: '2026-03-01', status: 'PAID' }
  ];
}

function buildPayments(): PaymentSummary[] {
  return [
    { id: 'pay-90211', invoiceId: 'inv-2026-03', amount: 412.33, status: 'SETTLED', submittedAt: '2026-02-25T18:04:00.000Z' }
  ];
}

function buildDocumentRequirements(): DocumentRequirement[] {
  return [
    { id: 'docreq-income', title: 'Income verification', requiredFor: 'Special enrollment period', status: 'MISSING' },
    { id: 'docreq-residency', title: 'Residency verification', requiredFor: 'Household eligibility', status: 'RECEIVED' }
  ];
}

function buildDocumentRequirementHooks(): DocumentRequirementHook[] {
  return [
    { id: 'hook-income', title: 'Income verification', requiredFor: 'Enrollment submission', status: 'missing' },
    { id: 'hook-id', title: 'Government-issued ID', requiredFor: 'Identity verification', status: 'received' }
  ];
}

function buildRenewals(): RenewalWorkflow[] {
  return [
    { id: 'rnl-2201', type: 'RENEWAL', status: 'OPEN', dueDate: '2026-10-31' },
    { id: 'life-901', type: 'LIFE_EVENT', status: 'IN_REVIEW', dueDate: '2026-03-30' }
  ];
}

function buildNotices(): CorrespondenceNotice[] {
  return [
    { id: 'notice-3001', templateKey: 'renewal-reminder', channel: 'EMAIL', status: 'SENT', createdAt: nowIso() },
    { id: 'notice-3002', templateKey: 'payment-due-reminder', channel: 'IN_APP', status: 'QUEUED', createdAt: nowIso() }
  ];
}

function buildHouseholdProfile(): HouseholdProfile {
  const subscriber = {
    id: 'sub-1001',
    firstName: 'Alex',
    lastName: 'Taylor',
    memberId: 'M1001001'
  };
  const dependents: DependentProfile[] = [
    { id: 'dep-2001', firstName: 'Jamie', lastName: 'Taylor', dob: '2015-06-01', relationship: 'child' }
  ];
  const applicants: ApplicantProfile[] = [
    { id: 'app-1', firstName: 'Alex', lastName: 'Taylor', dob: '1987-04-12', relationship: 'subscriber' },
    { id: 'app-2', firstName: 'Jamie', lastName: 'Taylor', dob: '2015-06-01', relationship: 'child' }
  ];
  return {
    id: 'hh-8843',
    subscriber,
    dependents,
    applicants
  };
}

function buildEnrollmentStatusTracker(enrollmentId: string, effectiveDate: string): EnrollmentStatusTracker {
  return {
    enrollmentId,
    overallStatus: 'pending',
    effectiveDate,
    pendingReason: 'Waiting for required document verification.',
    steps: [
      { key: 'shop_plans', label: 'Shop Plans', status: 'completed', helpText: 'Review premium and network fit.' },
      { key: 'household', label: 'Household', status: 'completed', helpText: 'Confirm subscriber and dependent details.' },
      { key: 'eligibility', label: 'Verify Eligibility', status: 'in_progress', helpText: 'Resolve any pending eligibility checks.' },
      { key: 'documents', label: 'Upload Documents', status: 'pending', helpText: 'Upload missing required documents.' },
      { key: 'submit', label: 'Submit Enrollment', status: 'not_started', helpText: 'Submit once all requirements are complete.' }
    ]
  };
}

async function recordAction(
  context: BillingEnrollmentContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  await logAuditEvent({
    tenantId: context.tenantId,
    actorUserId: context.actorUserId ?? null,
    action,
    entityType,
    entityId,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: metadata as Prisma.InputJsonValue
  });
}

export async function getBillingEnrollmentWorkspaceSnapshot(
  context: BillingEnrollmentContext
): Promise<BillingEnrollmentWorkspaceSnapshot> {
  await recordAction(
    context,
    'billing_enrollment.workspace.viewed',
    'billing_enrollment.workspace',
    'workspace',
    { module: 'billing-enrollment' }
  );

  return {
    enrollmentCases: buildEnrollmentCases(),
    planCatalog: buildPlanCatalog(),
    eligibilityRules: [
      { id: 'rule-household-size', name: 'Household size rule', appliesTo: 'All applicants', outcome: 'ALLOW' },
      { id: 'rule-special-period', name: 'Special period qualifier', appliesTo: 'Life-event changes', outcome: 'REVIEW' }
    ],
    invoices: buildInvoices(),
    payments: buildPayments(),
    documentRequirements: buildDocumentRequirements(),
    renewalsAndLifeEvents: buildRenewals(),
    notices: buildNotices()
  };
}

export async function getShopPlans(context: BillingEnrollmentContext) {
  const plans = buildPlanCatalog().map(toPlanCandidate);

  await recordAction(
    context,
    'billing_enrollment.plans.viewed',
    'billing_enrollment.plan_catalog',
    'default',
    { planCount: plans.length }
  );

  return { items: plans };
}

export async function comparePlans(context: BillingEnrollmentContext, input: { planIds: string[] }) {
  const planMap = new Map(buildPlanCatalog().map((plan) => [plan.id, toPlanCandidate(plan)]));
  const items = input.planIds.map((id) => planMap.get(id)).filter(Boolean);

  await recordAction(
    context,
    'billing_enrollment.plans.compared',
    'billing_enrollment.plan_catalog',
    'compare',
    { planIds: input.planIds }
  );

  return { items };
}

export async function createEnrollmentDraft(
  context: BillingEnrollmentContext,
  input: { householdId: string; planId: string; effectiveDate: string }
) {
  const enrollmentId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.enrollment.created',
    'billing_enrollment.enrollment',
    enrollmentId,
    input
  );

  publishInBackground('enrollment.created', {
    id: randomUUID(),
    type: 'enrollment.created',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      enrollmentId,
      householdId: input.householdId,
      effectiveDate: input.effectiveDate,
      status: 'draft'
    }
  });

  return {
    enrollmentId,
    status: 'draft',
    effectiveDate: input.effectiveDate,
    saveAndResumeToken: `resume-${enrollmentId}`
  };
}

export async function saveEnrollmentStep(
  context: BillingEnrollmentContext,
  input: {
    enrollmentId: string;
    stepKey: string;
    completionPercent: number;
    selectedPlanId?: string;
    effectiveDate?: string;
  }
) {
  const household = buildHouseholdProfile();
  const selectedPlan = buildPlanCatalog().map(toPlanCandidate).find((plan) => plan.planId === input.selectedPlanId);
  const validationIssues = runEnrollmentValidations({
    household,
    selectedPlan,
    requestedEffectiveDate: input.effectiveDate
  });

  await recordAction(
    context,
    'billing_enrollment.enrollment.updated',
    'billing_enrollment.enrollment',
    input.enrollmentId,
    {
      stepKey: input.stepKey,
      completionPercent: input.completionPercent,
      validationIssueCount: validationIssues.length
    }
  );

  publishInBackground('enrollment.updated', {
    id: randomUUID(),
    type: 'enrollment.updated',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      enrollmentId: input.enrollmentId,
      stepKey: input.stepKey,
      status: validationIssues.some((issue) => issue.severity === 'error') ? 'needs_info' : 'in_progress',
      completionPercent: input.completionPercent
    }
  });

  return {
    enrollmentId: input.enrollmentId,
    stepKey: input.stepKey,
    validationIssues,
    savedAt: nowIso(),
    resumable: true
  };
}

export async function submitEnrollment(
  context: BillingEnrollmentContext,
  input: { enrollmentId: string; effectiveDate: string }
) {
  await recordAction(
    context,
    'billing_enrollment.enrollment.submitted',
    'billing_enrollment.enrollment',
    input.enrollmentId,
    input
  );

  publishInBackground('enrollment.submitted', {
    id: randomUUID(),
    type: 'enrollment.submitted',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      enrollmentId: input.enrollmentId,
      submittedAt: nowIso(),
      status: 'pending'
    }
  });

  return {
    enrollmentId: input.enrollmentId,
    status: 'pending',
    effectiveDate: input.effectiveDate,
    pendingStatus: 'Pending verification'
  };
}

export async function completeEnrollment(
  context: BillingEnrollmentContext,
  input: { enrollmentId: string; effectiveDate: string }
) {
  await recordAction(
    context,
    'billing_enrollment.enrollment.completed',
    'billing_enrollment.enrollment',
    input.enrollmentId,
    input
  );

  publishInBackground('enrollment.completed', {
    id: randomUUID(),
    type: 'enrollment.completed',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      enrollmentId: input.enrollmentId,
      completedAt: nowIso(),
      status: 'completed'
    }
  });

  return {
    enrollmentId: input.enrollmentId,
    status: 'completed',
    effectiveDate: input.effectiveDate
  };
}

export async function getEnrollmentStatusTracker(
  context: BillingEnrollmentContext,
  input: { enrollmentId: string; effectiveDate?: string }
) {
  await recordAction(
    context,
    'billing_enrollment.status.viewed',
    'billing_enrollment.status_tracker',
    input.enrollmentId
  );

  return buildEnrollmentStatusTracker(input.enrollmentId, input.effectiveDate ?? '2026-04-01');
}

export async function renewCoverage(
  context: BillingEnrollmentContext,
  input: { householdId: string; renewalYear: number; selectedPlanId?: string }
) {
  const workflowId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.renewal.started',
    'billing_enrollment.renewal',
    workflowId,
    input
  );

  publishInBackground('workflow.started', {
    id: randomUUID(),
    type: 'workflow.started',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      workflowId,
      workflowType: 'billing-enrollment.renewal',
      initiatedByUserId: context.actorUserId ?? null,
      input
    }
  });

  return {
    workflowId,
    status: 'IN_REVIEW'
  };
}

export async function reportLifeEvent(context: BillingEnrollmentContext, input: QualifyingLifeEventInput) {
  const eventId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.life_event.reported',
    'billing_enrollment.life_event',
    eventId,
    input as unknown as Record<string, unknown>
  );

  return {
    lifeEventId: eventId,
    status: 'PENDING_VERIFICATION'
  };
}

export async function manageHouseholdDependents(
  context: BillingEnrollmentContext,
  input: { householdId: string; dependents: DependentProfile[] }
) {
  await recordAction(
    context,
    'billing_enrollment.household.updated',
    'billing_enrollment.household',
    input.householdId,
    {
      dependentCount: input.dependents.length
    }
  );

  return {
    householdId: input.householdId,
    dependents: input.dependents,
    updatedAt: nowIso()
  };
}

export async function verifyEligibility(
  context: BillingEnrollmentContext,
  input: { householdId: string; requestedEffectiveDate: string; selectedPlanId?: string }
) {
  const household = buildHouseholdProfile();
  const selectedPlan = buildPlanCatalog().map(toPlanCandidate).find((plan) => plan.planId === input.selectedPlanId);
  const validationIssues = runEnrollmentValidations({
    household,
    selectedPlan,
    requestedEffectiveDate: input.requestedEffectiveDate
  });

  await recordAction(
    context,
    'billing_enrollment.eligibility.verified',
    'billing_enrollment.eligibility',
    input.householdId,
    {
      issueCount: validationIssues.length
    }
  );

  return {
    householdId: input.householdId,
    status: validationIssues.some((issue) => issue.severity === 'error') ? 'REVIEW' : 'ALLOW',
    issues: validationIssues
  };
}

export async function getDocumentRequirementHooks(context: BillingEnrollmentContext) {
  const hooks = buildDocumentRequirementHooks();

  await recordAction(
    context,
    'billing_enrollment.documents.requirements.viewed',
    'billing_enrollment.documents',
    'requirements'
  );

  return hooks;
}

export async function uploadRequiredDocumentHook(
  context: BillingEnrollmentContext,
  input: { requirementId: string; documentName: string }
) {
  await recordAction(
    context,
    'billing_enrollment.documents.uploaded',
    'billing_enrollment.documents',
    input.requirementId,
    input
  );

  publishInBackground('document.uploaded', {
    id: randomUUID(),
    type: 'document.uploaded',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      documentId: randomUUID(),
      fileName: input.documentName,
      contentType: 'application/pdf',
      uploadedByUserId: context.actorUserId ?? null
    }
  });

  return {
    requirementId: input.requirementId,
    status: 'RECEIVED'
  };
}

export async function startEnrollmentOrchestration(
  context: BillingEnrollmentContext,
  input: { householdId: string; planId: string; effectiveDate: string }
) {
  const workflowId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.enrollment.started',
    'billing_enrollment.enrollment',
    workflowId,
    input
  );

  publishInBackground('workflow.started', {
    id: randomUUID(),
    type: 'workflow.started',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      workflowId,
      workflowType: 'billing-enrollment.enrollment-orchestration',
      initiatedByUserId: context.actorUserId ?? null,
      input
    }
  });

  return { workflowId, status: 'IN_PROGRESS' as const };
}

export async function submitPremiumPayment(
  context: BillingEnrollmentContext,
  input: { invoiceId: string; amount: number; paymentMethod: string }
) {
  const paymentId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.payment.submitted',
    'billing_enrollment.payment',
    paymentId,
    input
  );

  publishInBackground('integration.requested', {
    id: randomUUID(),
    type: 'integration.requested',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      integrationId: paymentId,
      integrationKey: 'billing-enrollment.payment-gateway',
      requestedByUserId: context.actorUserId ?? null
    }
  });

  return { paymentId, status: 'PROCESSING' as const };
}

export async function submitLifeEventWorkflow(
  context: BillingEnrollmentContext,
  input: { eventType: string; householdId: string; eventDate: string }
) {
  const workflowId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.life_event.submitted',
    'billing_enrollment.life_event',
    workflowId,
    input
  );

  publishInBackground('workflow.started', {
    id: randomUUID(),
    type: 'workflow.started',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      workflowId,
      workflowType: 'billing-enrollment.life-event',
      initiatedByUserId: context.actorUserId ?? null,
      input
    }
  });

  return { workflowId, status: 'IN_REVIEW' as const };
}

export async function generateCorrespondenceNotice(
  context: BillingEnrollmentContext,
  input: { templateKey: string; channel: 'email' | 'sms' | 'push' | 'in_app'; recipientId: string }
) {
  const noticeId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.notice.requested',
    'billing_enrollment.notice',
    noticeId,
    input
  );

  publishInBackground('notification.requested', {
    id: randomUUID(),
    type: 'notification.requested',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      notificationId: noticeId,
      channel: input.channel,
      recipientId: input.recipientId,
      templateKey: input.templateKey
    }
  });

  return { noticeId, status: 'QUEUED' as const };
}

function buildBillingAccount(tenantId: string): BillingAccount {
  return {
    id: 'billacct-1001',
    tenantId,
    accountNumber: 'BA-104422',
    currentBalance: 412.33,
    currency: 'USD',
    status: 'active'
  };
}

function buildPremiumInvoices(): PremiumInvoice[] {
  return [
    {
      id: 'inv-2026-04',
      billingAccountId: 'billacct-1001',
      issuedDate: '2026-03-10',
      dueDate: '2026-04-01',
      effectiveDate: '2026-04-01',
      amountDue: 412.33,
      status: 'due',
      lines: [
        { id: 'line-1', description: 'Monthly premium', amount: 398.0, category: 'premium' },
        { id: 'line-2', description: 'Regulatory fee', amount: 14.33, category: 'fee' }
      ]
    },
    {
      id: 'inv-2026-03',
      billingAccountId: 'billacct-1001',
      issuedDate: '2026-02-10',
      dueDate: '2026-03-01',
      effectiveDate: '2026-03-01',
      amountDue: 412.33,
      status: 'posted',
      lines: [{ id: 'line-3', description: 'Monthly premium', amount: 412.33, category: 'premium' }]
    }
  ];
}

function buildPaymentMethods(): PaymentMethodToken[] {
  return [
    { id: 'pm-card-1', type: 'card', brand: 'Visa', maskedLabel: 'Visa ending 2048', defaultMethod: true, expiresAt: '2028-04' },
    { id: 'pm-bank-1', type: 'bank_account', maskedLabel: 'Bank account ending 2901', defaultMethod: false }
  ];
}

function buildPaymentHistory(): Payment[] {
  return [
    { id: 'pay-1', invoiceId: 'inv-2026-03', billingAccountId: 'billacct-1001', amount: 412.33, initiatedAt: '2026-02-25T18:04:00.000Z', status: 'posted', methodLabel: 'Visa ending 2048' },
    { id: 'pay-2', invoiceId: 'inv-2026-02', billingAccountId: 'billacct-1001', amount: 412.33, initiatedAt: '2026-01-25T18:04:00.000Z', status: 'succeeded', methodLabel: 'Visa ending 2048' }
  ];
}

function buildAutopay(): AutopayEnrollment {
  return {
    id: 'autopay-1',
    billingAccountId: 'billacct-1001',
    enabled: true,
    paymentMethodTokenId: 'pm-card-1',
    nextRunDate: '2026-04-01'
  };
}

function buildDelinquency(): DelinquencyStatus {
  return {
    isDelinquent: false,
    daysPastDue: 0,
    level: 'none'
  };
}

function buildGracePeriod(): GracePeriod {
  return {
    active: false
  };
}

function buildRefundsAndReversals(): RefundOrReversal[] {
  return [
    {
      id: 'rr-1',
      paymentId: 'pay-1',
      type: 'refund',
      amount: 24.11,
      reason: 'Premium adjustment credit',
      createdAt: '2026-03-04T10:10:00.000Z'
    }
  ];
}

function buildStatements(): BillingStatement[] {
  return [
    {
      id: 'stmt-2026-03',
      title: 'March 2026 Billing Statement',
      kind: 'statement',
      period: 'Mar 2026',
      downloadable: true,
      downloadHref: '/dashboard/billing-enrollment/payments/statements'
    },
    {
      id: 'tax-1095-2025',
      title: 'Form 1095-A (2025)',
      kind: 'tax_document',
      period: 'Tax Year 2025',
      downloadable: true,
      downloadHref: '/dashboard/billing-enrollment/payments/statements'
    }
  ];
}

function buildReconciliationHooks(): ReconciliationStatusHook[] {
  return [
    {
      id: 'recon-1',
      paymentId: 'pay-1',
      status: 'matched',
      source: 'gateway',
      updatedAt: nowIso()
    },
    {
      id: 'recon-2',
      paymentId: 'pay-2',
      status: 'pending',
      source: 'ledger',
      updatedAt: nowIso()
    }
  ];
}

async function publishBillingNotification(
  context: BillingEnrollmentContext,
  templateKey:
    | 'billing.payment.due'
    | 'billing.payment.received'
    | 'billing.payment.failed'
    | 'billing.grace_period.started'
    | 'billing.grace_period.ending',
  recipientId: string
) {
  publishInBackground('notification.requested', {
    id: randomUUID(),
    type: 'notification.requested',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      notificationId: randomUUID(),
      channel: 'in_app',
      recipientId,
      templateKey
    }
  });
}

export async function getBillingExperienceSnapshot(context: BillingEnrollmentContext) {
  const billingAccount = buildBillingAccount(context.tenantId);
  const invoices = buildPremiumInvoices();
  const nextInvoice = invoices[0];
  const paymentHistory = buildPaymentHistory();
  const paymentMethods = buildPaymentMethods();
  const autopay = buildAutopay();
  const delinquency = buildDelinquency();
  const gracePeriod = buildGracePeriod();
  const statements = buildStatements();

  await recordAction(
    context,
    'billing_enrollment.billing.snapshot.viewed',
    'billing_enrollment.billing',
    billingAccount.id
  );

  await publishBillingNotification(
    context,
    'billing.payment.due',
    context.actorUserId ?? 'system-user'
  );

  return {
    billingAccount,
    currentBalance: billingAccount.currentBalance,
    nextInvoice,
    paymentHistory,
    paymentMethods,
    autopay,
    delinquency,
    gracePeriod,
    statements,
    refundsAndReversals: buildRefundsAndReversals()
  };
}

export async function getBillingCurrentBalance(context: BillingEnrollmentContext) {
  const billingAccount = buildBillingAccount(context.tenantId);

  await recordAction(
    context,
    'billing_enrollment.billing.current_balance.viewed',
    'billing_enrollment.billing_account',
    billingAccount.id
  );

  return {
    billingAccountId: billingAccount.id,
    accountNumber: billingAccount.accountNumber,
    currentBalance: billingAccount.currentBalance,
    currency: billingAccount.currency,
    status: billingAccount.status
  };
}

export async function getNextPremiumInvoice(context: BillingEnrollmentContext) {
  const [nextInvoice] = buildPremiumInvoices();

  await recordAction(
    context,
    'billing_enrollment.billing.next_invoice.viewed',
    'billing_enrollment.invoice',
    nextInvoice.id
  );

  await publishBillingNotification(context, 'billing.payment.due', context.actorUserId ?? 'system-user');

  return nextInvoice;
}

export async function listPremiumInvoices(context: BillingEnrollmentContext) {
  const invoices = buildPremiumInvoices();

  await recordAction(
    context,
    'billing_enrollment.billing.invoices.viewed',
    'billing_enrollment.invoice',
    'list'
  );

  return invoices;
}

export async function getInvoiceDetail(
  context: BillingEnrollmentContext,
  input: { invoiceId: string }
) {
  const invoice = buildPremiumInvoices().find((item) => item.id === input.invoiceId) ?? buildPremiumInvoices()[0];
  const timeline = [
    { label: 'Invoice issued', date: invoice.issuedDate, status: 'completed' },
    { label: 'Invoice due', date: invoice.dueDate, status: invoice.status === 'posted' ? 'completed' : 'pending' },
    { label: 'Payment paid', date: '2026-03-01', status: invoice.status === 'posted' ? 'completed' : 'pending' },
    { label: 'Payment posted', date: '2026-03-03', status: invoice.status === 'posted' ? 'completed' : 'pending' }
  ];

  await recordAction(
    context,
    'billing_enrollment.billing.invoice.viewed',
    'billing_enrollment.invoice',
    input.invoiceId
  );

  return { invoice, timeline };
}

export async function listPaymentHistory(context: BillingEnrollmentContext) {
  await recordAction(
    context,
    'billing_enrollment.billing.payments.viewed',
    'billing_enrollment.payment',
    'history'
  );

  return buildPaymentHistory();
}

export async function makeBillingPayment(
  context: BillingEnrollmentContext,
  input: { billingAccountId: string; invoiceId: string; paymentMethodTokenId: string; amount: number }
) {
  const gateway = new MockPaymentGatewayAdapter();
  const gatewayResult = await gateway.charge(input);
  const paymentId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.billing.payment.submitted',
    'billing_enrollment.payment',
    paymentId,
    {
      invoiceId: input.invoiceId,
      amount: input.amount,
      gatewayStatus: gatewayResult.status
    }
  );

  await publishBillingNotification(
    context,
    gatewayResult.status === 'succeeded' ? 'billing.payment.received' : 'billing.payment.failed',
    context.actorUserId ?? 'system-user'
  );

  return {
    paymentId,
    status: gatewayResult.status,
    message: gatewayResult.message,
    gatewayReferenceId: gatewayResult.gatewayReferenceId
  };
}

export async function listPaymentMethods(context: BillingEnrollmentContext) {
  await recordAction(
    context,
    'billing_enrollment.billing.payment_methods.viewed',
    'billing_enrollment.payment_method',
    'list'
  );

  return buildPaymentMethods();
}

export async function savePaymentMethodToken(
  context: BillingEnrollmentContext,
  input: { type: 'card' | 'bank_account'; maskedLabel: string; brand?: string }
) {
  const tokenId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.billing.payment_method.saved',
    'billing_enrollment.payment_method',
    tokenId,
    input
  );

  return {
    id: tokenId,
    type: input.type,
    maskedLabel: input.maskedLabel,
    brand: input.brand,
    defaultMethod: false
  };
}

export async function updateAutopayEnrollment(
  context: BillingEnrollmentContext,
  input: { enabled: boolean; paymentMethodTokenId?: string }
) {
  await recordAction(
    context,
    'billing_enrollment.billing.autopay.updated',
    'billing_enrollment.autopay',
    'autopay-1',
    input
  );

  if (input.enabled) {
    await publishBillingNotification(
      context,
      'billing.payment.due',
      context.actorUserId ?? 'system-user'
    );
  }

  return {
    id: 'autopay-1',
    billingAccountId: 'billacct-1001',
    enabled: input.enabled,
    paymentMethodTokenId: input.paymentMethodTokenId ?? 'pm-card-1',
    nextRunDate: input.enabled ? '2026-04-01' : undefined
  };
}

export async function listStatementsAndTaxDocuments(context: BillingEnrollmentContext) {
  await recordAction(
    context,
    'billing_enrollment.billing.statements.viewed',
    'billing_enrollment.statement',
    'list'
  );

  return buildStatements();
}

export async function getDelinquencyAndGracePeriod(context: BillingEnrollmentContext) {
  const delinquency = buildDelinquency();
  const gracePeriod = buildGracePeriod();

  await recordAction(
    context,
    'billing_enrollment.billing.delinquency.viewed',
    'billing_enrollment.delinquency',
    'status'
  );

  if (gracePeriod.active) {
    await publishBillingNotification(
      context,
      'billing.grace_period.started',
      context.actorUserId ?? 'system-user'
    );
  } else {
    await publishBillingNotification(
      context,
      'billing.grace_period.ending',
      context.actorUserId ?? 'system-user'
    );
  }

  return { delinquency, gracePeriod };
}

export async function getReconciliationStatusHooks(context: BillingEnrollmentContext) {
  await recordAction(
    context,
    'billing_enrollment.billing.reconciliation.viewed',
    'billing_enrollment.reconciliation',
    'hooks'
  );

  return buildReconciliationHooks();
}

type DependentEligibilityIndicator = 'verified' | 'pending' | 'needs_info';

type DependentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  relationship: 'spouse' | 'child' | 'other';
  relationshipDetail: string;
  eligibilityIndicator: DependentEligibilityIndicator;
};

type RequestedDocumentRecord = {
  id: string;
  title: string;
  requiredFor: string;
  dueDate: string;
  status: 'required' | 'uploaded' | 'accepted' | 'rejected' | 'expired';
};

type UploadedDocumentRecord = {
  id: string;
  title: string;
  uploadedAt: string;
  expiresAt?: string;
  status: 'uploaded' | 'accepted' | 'rejected' | 'expired';
};

type CorrespondenceNoticeRecord = {
  id: string;
  category: 'enrollment' | 'billing' | 'document' | 'support';
  title: string;
  summary: string;
  body: string;
  createdAt: string;
  readAt?: string;
  hasDownload: boolean;
};

function buildDependentsForExperience(): DependentRecord[] {
  return [
    {
      id: 'dep-2001',
      firstName: 'Jamie',
      lastName: 'Taylor',
      dob: '2015-06-01',
      relationship: 'child',
      relationshipDetail: 'Biological child',
      eligibilityIndicator: 'verified'
    },
    {
      id: 'dep-2003',
      firstName: 'Casey',
      lastName: 'Taylor',
      dob: '2019-11-12',
      relationship: 'child',
      relationshipDetail: 'Step child',
      eligibilityIndicator: 'pending'
    },
    {
      id: 'dep-2004',
      firstName: 'Morgan',
      lastName: 'Taylor',
      dob: '1988-08-19',
      relationship: 'spouse',
      relationshipDetail: 'Spouse',
      eligibilityIndicator: 'needs_info'
    }
  ];
}

function buildRequestedDocumentsForExperience(): RequestedDocumentRecord[] {
  return [
    {
      id: 'req-1',
      title: 'Proof of household income',
      requiredFor: 'Eligibility verification',
      dueDate: '2026-03-20',
      status: 'required'
    },
    {
      id: 'req-2',
      title: 'Residency verification',
      requiredFor: 'Enrollment completion',
      dueDate: '2026-03-22',
      status: 'uploaded'
    },
    {
      id: 'req-3',
      title: 'Dependent birth certificate',
      requiredFor: 'Dependent validation',
      dueDate: '2026-03-18',
      status: 'rejected'
    },
    {
      id: 'req-4',
      title: 'Primary subscriber ID',
      requiredFor: 'Identity verification',
      dueDate: '2026-03-10',
      status: 'expired'
    }
  ];
}

function buildUploadedDocumentsForExperience(): UploadedDocumentRecord[] {
  return [
    {
      id: 'upl-1001',
      title: 'Income Verification - PDF',
      uploadedAt: '2026-03-14T12:11:00.000Z',
      status: 'uploaded'
    },
    {
      id: 'upl-1002',
      title: 'Residency Statement - PDF',
      uploadedAt: '2026-03-12T08:22:00.000Z',
      status: 'accepted'
    },
    {
      id: 'upl-1003',
      title: 'Dependent Document - JPG',
      uploadedAt: '2026-03-11T09:40:00.000Z',
      status: 'rejected'
    }
  ];
}

function buildCorrespondenceNotices(): CorrespondenceNoticeRecord[] {
  return [
    {
      id: 'ntc-1001',
      category: 'billing',
      title: 'Premium Payment Due',
      summary: 'Your monthly premium is due soon.',
      body: 'Your April premium is due on April 1, 2026. Please submit payment or confirm autopay details.',
      createdAt: '2026-03-14T08:12:00.000Z',
      hasDownload: true
    },
    {
      id: 'ntc-1002',
      category: 'enrollment',
      title: 'Enrollment Verification Needed',
      summary: 'Additional information is required.',
      body: 'Please upload updated household documentation to complete enrollment verification.',
      createdAt: '2026-03-13T14:50:00.000Z',
      hasDownload: false,
      readAt: '2026-03-14T15:00:00.000Z'
    },
    {
      id: 'ntc-1003',
      category: 'document',
      title: 'Document Accepted',
      summary: 'One of your submitted documents has been accepted.',
      body: 'Residency verification has been accepted and no further action is required for this item.',
      createdAt: '2026-03-12T11:00:00.000Z',
      hasDownload: true
    }
  ];
}

export async function getDependentsExperience(
  context: BillingEnrollmentContext,
  input: { householdId: string }
) {
  const baseDependents = buildDependentsForExperience();

  await recordAction(
    context,
    'billing_enrollment.dependents.viewed',
    'billing_enrollment.dependents',
    input.householdId
  );

  return {
    householdId: input.householdId,
    dependents: baseDependents,
    indicators: {
      verified: baseDependents.filter((item) => item.eligibilityIndicator === 'verified').length,
      pending: baseDependents.filter((item) => item.eligibilityIndicator === 'pending').length,
      needsInfo: baseDependents.filter((item) => item.eligibilityIndicator === 'needs_info').length
    }
  };
}

export async function addDependentExperienceRecord(
  context: BillingEnrollmentContext,
  input: {
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  }
) {
  const dependentId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.dependent.added',
    'billing_enrollment.dependent',
    dependentId,
    input
  );

  return {
    id: dependentId,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    relationship: input.relationship,
    relationshipDetail: input.relationshipDetail,
    eligibilityIndicator: 'pending' as const
  };
}

export async function updateDependentExperienceRecord(
  context: BillingEnrollmentContext,
  input: {
    dependentId: string;
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  }
) {
  await recordAction(
    context,
    'billing_enrollment.dependent.updated',
    'billing_enrollment.dependent',
    input.dependentId,
    input
  );

  return {
    id: input.dependentId,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    relationship: input.relationship,
    relationshipDetail: input.relationshipDetail,
    eligibilityIndicator: 'pending' as const
  };
}

export async function removeDependentExperienceRecord(
  context: BillingEnrollmentContext,
  input: { householdId: string; dependentId: string }
) {
  await recordAction(
    context,
    'billing_enrollment.dependent.removed',
    'billing_enrollment.dependent',
    input.dependentId,
    input
  );

  return { dependentId: input.dependentId, removed: true };
}

export async function getDocumentCenterExperience(context: BillingEnrollmentContext) {
  const requested = buildRequestedDocumentsForExperience();
  const uploaded = buildUploadedDocumentsForExperience();

  await recordAction(
    context,
    'billing_enrollment.documents.center.viewed',
    'billing_enrollment.documents',
    'center'
  );

  return {
    requestedDocuments: requested,
    uploadedDocuments: uploaded
  };
}

export async function uploadDocumentForDocumentCenter(
  context: BillingEnrollmentContext,
  input: { requestId: string; documentName: string }
) {
  const uploadedId = randomUUID();

  await recordAction(
    context,
    'billing_enrollment.documents.uploaded',
    'billing_enrollment.documents',
    uploadedId,
    input
  );

  publishInBackground('document.uploaded', {
    id: randomUUID(),
    type: 'document.uploaded',
    tenantId: context.tenantId,
    correlationId: randomUUID(),
    timestamp: new Date(),
    payload: {
      documentId: uploadedId,
      fileName: input.documentName,
      contentType: 'application/pdf',
      uploadedByUserId: context.actorUserId ?? null
    }
  });

  return {
    id: uploadedId,
    title: input.documentName,
    uploadedAt: nowIso(),
    status: 'uploaded' as const,
    linkedRequestId: input.requestId
  };
}

export async function listCorrespondenceCenter(
  context: BillingEnrollmentContext,
  input?: { unreadOnly?: boolean }
) {
  const notices = buildCorrespondenceNotices();
  const filtered = input?.unreadOnly ? notices.filter((notice) => !notice.readAt) : notices;

  await recordAction(
    context,
    'billing_enrollment.notices.center.viewed',
    'billing_enrollment.notice',
    'list',
    { unreadOnly: Boolean(input?.unreadOnly) }
  );

  return {
    notices: filtered.map((notice) => ({
      id: notice.id,
      category: notice.category,
      title: notice.title,
      summary: notice.summary,
      createdAt: notice.createdAt,
      isRead: Boolean(notice.readAt),
      hasDownload: notice.hasDownload
    })),
    unreadCount: notices.filter((notice) => !notice.readAt).length,
    integrationTargets: {
      notificationService: 'shared-notification-service',
      crmService: 'shared-crm-case-service',
      documentService: 'shared-document-repository'
    }
  };
}

export async function getCorrespondenceNoticeDetail(
  context: BillingEnrollmentContext,
  input: { noticeId: string }
) {
  const notice = buildCorrespondenceNotices().find((item) => item.id === input.noticeId) ?? buildCorrespondenceNotices()[0];

  await recordAction(
    context,
    'billing_enrollment.notice.viewed',
    'billing_enrollment.notice',
    notice.id
  );

  return {
    id: notice.id,
    category: notice.category,
    title: notice.title,
    body: notice.body,
    createdAt: notice.createdAt,
    isRead: Boolean(notice.readAt),
    download: notice.hasDownload
      ? {
          title: `${notice.title}.pdf`,
          href: '/dashboard/billing-enrollment/notices'
        }
      : null
  };
}

export async function markCorrespondenceNoticeRead(
  context: BillingEnrollmentContext,
  input: { noticeId: string }
) {
  await recordAction(
    context,
    'billing_enrollment.notice.read',
    'billing_enrollment.notice',
    input.noticeId
  );

  return {
    noticeId: input.noticeId,
    isRead: true,
    readAt: nowIso()
  };
}

export async function getSupportCenterExperience(context: BillingEnrollmentContext) {
  await recordAction(
    context,
    'billing_enrollment.support.viewed',
    'billing_enrollment.support',
    'center'
  );

  return {
    helpTopics: [
      {
        id: 'topic-enrollment',
        title: 'Enrollment help',
        description: 'Guidance for enrollment steps, dependents, and effective dates.'
      },
      {
        id: 'topic-billing',
        title: 'Billing help',
        description: 'Premium invoices, payments, autopay setup, and statements.'
      },
      {
        id: 'topic-documents',
        title: 'Document requirements',
        description: 'Requested document status and upload best practices.'
      }
    ],
    faq: [
      { id: 'faq-1', question: 'When is my payment due?', answer: 'Premium payments are due on the first of each month.' },
      { id: 'faq-2', question: 'How long does document review take?', answer: 'Most document reviews complete within 1-2 business days.' }
    ],
    secureMessage: {
      available: false,
      status: 'placeholder',
      integrationTarget: 'shared-crm-case-service'
    },
    caseStatus: [
      { id: 'case-100', title: 'Enrollment verification case', status: 'In Review', updatedAt: '2026-03-14T15:00:00.000Z' },
      { id: 'case-101', title: 'Billing question', status: 'Awaiting Member Response', updatedAt: '2026-03-13T10:10:00.000Z' }
    ],
    contactCards: [
      {
        id: 'contact-enrollment',
        team: 'Enrollment Support',
        phone: '1-800-555-0100',
        email: 'enrollment-support@example.org',
        hours: 'Mon-Fri, 8:00 AM - 6:00 PM'
      },
      {
        id: 'contact-billing',
        team: 'Billing Support',
        phone: '1-800-555-0101',
        email: 'billing-support@example.org',
        hours: 'Mon-Fri, 8:00 AM - 6:00 PM'
      }
    ],
    integrationTargets: {
      notifications: 'shared-notification-service',
      crm: 'shared-crm-case-service',
      documents: 'shared-document-repository'
    }
  };
}
