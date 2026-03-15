export type BillingEnrollmentContext = {
  tenantId: string;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type EnrollmentCaseStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_VERIFICATION'
  | 'READY_FOR_BILLING'
  | 'COMPLETED';

export type InvoiceStatus = 'OPEN' | 'PAST_DUE' | 'PAID' | 'VOID';
export type PaymentStatus = 'QUEUED' | 'PROCESSING' | 'SETTLED' | 'FAILED';
export type NoticeStatus = 'QUEUED' | 'SENT' | 'FAILED';

export interface PlanCatalogItem {
  id: string;
  code: string;
  name: string;
  metalTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  monthlyPremium: number;
}

export interface EligibilityRuleSummary {
  id: string;
  name: string;
  appliesTo: string;
  outcome: 'ALLOW' | 'REVIEW' | 'DENY';
}

export interface EnrollmentCase {
  id: string;
  householdId: string;
  status: EnrollmentCaseStatus;
  selectedPlanId: string;
  effectiveDate: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  id: string;
  period: string;
  amountDue: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface PaymentSummary {
  id: string;
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  submittedAt: string;
}

export interface DocumentRequirement {
  id: string;
  title: string;
  requiredFor: string;
  status: 'MISSING' | 'RECEIVED' | 'VERIFIED';
}

export interface RenewalWorkflow {
  id: string;
  type: 'RENEWAL' | 'LIFE_EVENT';
  status: 'OPEN' | 'IN_REVIEW' | 'COMPLETED';
  dueDate: string;
}

export interface CorrespondenceNotice {
  id: string;
  templateKey: string;
  channel: 'EMAIL' | 'MAIL' | 'SMS' | 'IN_APP';
  status: NoticeStatus;
  createdAt: string;
}

export interface BillingEnrollmentWorkspaceSnapshot {
  enrollmentCases: EnrollmentCase[];
  planCatalog: PlanCatalogItem[];
  eligibilityRules: EligibilityRuleSummary[];
  invoices: InvoiceSummary[];
  payments: PaymentSummary[];
  documentRequirements: DocumentRequirement[];
  renewalsAndLifeEvents: RenewalWorkflow[];
  notices: CorrespondenceNotice[];
}
