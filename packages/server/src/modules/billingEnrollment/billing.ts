export type BillingAccount = {
  id: string;
  tenantId: string;
  accountNumber: string;
  currentBalance: number;
  currency: 'USD';
  status: 'active' | 'delinquent' | 'suspended';
};

export type PremiumInvoiceLine = {
  id: string;
  description: string;
  amount: number;
  category: 'premium' | 'adjustment' | 'fee' | 'credit';
};

export type PremiumInvoice = {
  id: string;
  billingAccountId: string;
  issuedDate: string;
  dueDate: string;
  effectiveDate: string;
  amountDue: number;
  status: 'issued' | 'due' | 'paid' | 'posted' | 'past_due';
  lines: PremiumInvoiceLine[];
};

export type Payment = {
  id: string;
  invoiceId: string;
  billingAccountId: string;
  amount: number;
  initiatedAt: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'posted';
  methodLabel: string;
};

export type PaymentMethodToken = {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  maskedLabel: string;
  defaultMethod: boolean;
  expiresAt?: string;
};

export type AutopayEnrollment = {
  id: string;
  billingAccountId: string;
  enabled: boolean;
  paymentMethodTokenId?: string;
  nextRunDate?: string;
};

export type DelinquencyStatus = {
  isDelinquent: boolean;
  daysPastDue: number;
  level: 'none' | 'warning' | 'critical';
};

export type GracePeriod = {
  active: boolean;
  startDate?: string;
  endDate?: string;
};

export type RefundOrReversal = {
  id: string;
  paymentId: string;
  type: 'refund' | 'reversal';
  amount: number;
  reason: string;
  createdAt: string;
};

export type BillingStatement = {
  id: string;
  title: string;
  kind: 'statement' | 'tax_document';
  period: string;
  downloadable: boolean;
  downloadHref: string;
};

export type ReconciliationStatusHook = {
  id: string;
  paymentId: string;
  status: 'pending' | 'matched' | 'exception';
  source: 'gateway' | 'ledger' | 'bank_feed';
  updatedAt: string;
};
