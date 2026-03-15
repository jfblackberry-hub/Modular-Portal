export type BillingEnrollmentVariant =
  | 'commercial'
  | 'medicare'
  | 'medicaid'
  | 'employer_group';

export type BillingEnrollmentRole =
  | 'member'
  | 'employer_group_admin'
  | 'broker'
  | 'internal_operations'
  | 'internal_admin'
  | 'tenant_admin'
  | 'platform_admin'
  | 'platform-admin';

export type BillingEnrollmentFeatureFlags = {
  enrollmentEnabled: boolean;
  paymentsEnabled: boolean;
  noticesEnabled: boolean;
  supportEnabled: boolean;
  brokerAssistEnabled: boolean;
};

export type BillingEnrollmentPaymentOptions = {
  allowCard: boolean;
  allowBankAccount: boolean;
  allowPaperCheck: boolean;
  allowEmployerInvoice: boolean;
};

export type BillingEnrollmentAutopayOptions = {
  enabled: boolean;
  allowCardAutopay: boolean;
  allowBankAutopay: boolean;
};

export type BillingEnrollmentDocumentRequirements = {
  requireIdentityProof: boolean;
  requireIncomeProof: boolean;
  requireResidencyProof: boolean;
  requireDependentVerification: boolean;
};

export type BillingEnrollmentSupportContacts = {
  enrollmentPhone: string;
  enrollmentEmail: string;
  billingPhone: string;
  billingEmail: string;
  helpCenterUrl: string;
};

export type BillingEnrollmentRenewalMessaging = {
  headline: string;
  body: string;
  ctaLabel: string;
};

export type BillingEnrollmentRolePolicy = {
  prefix: string;
  allowedRoles: BillingEnrollmentRole[];
};

export type BillingEnrollmentModuleConfig = {
  variant: BillingEnrollmentVariant;
  featureFlags: BillingEnrollmentFeatureFlags;
  paymentOptions: BillingEnrollmentPaymentOptions;
  autopay: BillingEnrollmentAutopayOptions;
  documentRequirements: BillingEnrollmentDocumentRequirements;
  supportContactContent: BillingEnrollmentSupportContacts;
  renewalMessaging: BillingEnrollmentRenewalMessaging;
  rolePolicies: BillingEnrollmentRolePolicy[];
};

const defaultRolePolicies: BillingEnrollmentRolePolicy[] = [
  {
    prefix: '/dashboard/billing-enrollment/payments',
    allowedRoles: [
      'member',
      'employer_group_admin',
      'internal_operations',
      'internal_admin',
      'tenant_admin',
      'platform_admin',
      'platform-admin'
    ]
  },
  {
    prefix: '/dashboard/billing-enrollment',
    allowedRoles: [
      'member',
      'employer_group_admin',
      'broker',
      'internal_operations',
      'internal_admin',
      'tenant_admin',
      'platform_admin',
      'platform-admin'
    ]
  }
];

export const billingEnrollmentVariantConfig: Record<BillingEnrollmentVariant, BillingEnrollmentModuleConfig> = {
  commercial: {
    variant: 'commercial',
    featureFlags: {
      enrollmentEnabled: true,
      paymentsEnabled: true,
      noticesEnabled: true,
      supportEnabled: true,
      brokerAssistEnabled: false
    },
    paymentOptions: {
      allowCard: true,
      allowBankAccount: true,
      allowPaperCheck: false,
      allowEmployerInvoice: false
    },
    autopay: {
      enabled: true,
      allowCardAutopay: true,
      allowBankAutopay: true
    },
    documentRequirements: {
      requireIdentityProof: true,
      requireIncomeProof: true,
      requireResidencyProof: true,
      requireDependentVerification: true
    },
    supportContactContent: {
      enrollmentPhone: '1-800-555-0100',
      enrollmentEmail: 'enrollment-support@example.org',
      billingPhone: '1-800-555-0101',
      billingEmail: 'billing-support@example.org',
      helpCenterUrl: '/dashboard/billing-enrollment/support'
    },
    renewalMessaging: {
      headline: 'Renew your coverage before your current term ends',
      body: 'Review plan options, confirm household details, and submit your renewal.',
      ctaLabel: 'Start Renewal'
    },
    rolePolicies: defaultRolePolicies
  },
  medicare: {
    variant: 'medicare',
    featureFlags: {
      enrollmentEnabled: true,
      paymentsEnabled: true,
      noticesEnabled: true,
      supportEnabled: true,
      brokerAssistEnabled: true
    },
    paymentOptions: {
      allowCard: true,
      allowBankAccount: true,
      allowPaperCheck: true,
      allowEmployerInvoice: false
    },
    autopay: {
      enabled: true,
      allowCardAutopay: true,
      allowBankAutopay: true
    },
    documentRequirements: {
      requireIdentityProof: true,
      requireIncomeProof: false,
      requireResidencyProof: true,
      requireDependentVerification: false
    },
    supportContactContent: {
      enrollmentPhone: '1-800-555-0140',
      enrollmentEmail: 'medicare-enrollment@example.org',
      billingPhone: '1-800-555-0141',
      billingEmail: 'medicare-billing@example.org',
      helpCenterUrl: '/dashboard/billing-enrollment/support'
    },
    renewalMessaging: {
      headline: 'Annual Medicare enrollment is open',
      body: 'Review plan updates and submit your annual election before your deadline.',
      ctaLabel: 'Review Medicare Renewal'
    },
    rolePolicies: defaultRolePolicies
  },
  medicaid: {
    variant: 'medicaid',
    featureFlags: {
      enrollmentEnabled: true,
      paymentsEnabled: false,
      noticesEnabled: true,
      supportEnabled: true,
      brokerAssistEnabled: true
    },
    paymentOptions: {
      allowCard: false,
      allowBankAccount: false,
      allowPaperCheck: false,
      allowEmployerInvoice: false
    },
    autopay: {
      enabled: false,
      allowCardAutopay: false,
      allowBankAutopay: false
    },
    documentRequirements: {
      requireIdentityProof: true,
      requireIncomeProof: true,
      requireResidencyProof: true,
      requireDependentVerification: true
    },
    supportContactContent: {
      enrollmentPhone: '1-800-555-0150',
      enrollmentEmail: 'medicaid-enrollment@example.org',
      billingPhone: '1-800-555-0151',
      billingEmail: 'medicaid-billing@example.org',
      helpCenterUrl: '/dashboard/billing-enrollment/support'
    },
    renewalMessaging: {
      headline: 'Complete your Medicaid renewal',
      body: 'Submit eligibility documents and household updates before your due date.',
      ctaLabel: 'Continue Renewal'
    },
    rolePolicies: defaultRolePolicies
  },
  employer_group: {
    variant: 'employer_group',
    featureFlags: {
      enrollmentEnabled: true,
      paymentsEnabled: true,
      noticesEnabled: true,
      supportEnabled: true,
      brokerAssistEnabled: true
    },
    paymentOptions: {
      allowCard: true,
      allowBankAccount: true,
      allowPaperCheck: true,
      allowEmployerInvoice: true
    },
    autopay: {
      enabled: true,
      allowCardAutopay: true,
      allowBankAutopay: true
    },
    documentRequirements: {
      requireIdentityProof: true,
      requireIncomeProof: false,
      requireResidencyProof: false,
      requireDependentVerification: true
    },
    supportContactContent: {
      enrollmentPhone: '1-800-555-0160',
      enrollmentEmail: 'group-enrollment@example.org',
      billingPhone: '1-800-555-0161',
      billingEmail: 'group-billing@example.org',
      helpCenterUrl: '/dashboard/billing-enrollment/support'
    },
    renewalMessaging: {
      headline: 'Employer group renewal is due soon',
      body: 'Review roster updates, contribution setup, and renewal timelines.',
      ctaLabel: 'Open Group Renewal'
    },
    rolePolicies: defaultRolePolicies
  }
};

export function getBillingEnrollmentVariantConfig(variant: BillingEnrollmentVariant) {
  return billingEnrollmentVariantConfig[variant];
}
