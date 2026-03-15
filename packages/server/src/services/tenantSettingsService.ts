import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { logAuditEvent } from './auditService.js';

export type TenantNotificationSettings = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  digestEnabled: boolean;
  replyToEmail: string | null;
  senderName: string | null;
};

export type TenantPurchasedModule =
  | 'member_home'
  | 'member_benefits'
  | 'member_claims'
  | 'member_id_card'
  | 'member_providers'
  | 'member_authorizations'
  | 'member_messages'
  | 'member_documents'
  | 'member_billing'
  | 'member_support'
  | 'billing_enrollment'
  | 'provider_dashboard'
  | 'provider_eligibility'
  | 'provider_authorizations'
  | 'provider_claims'
  | 'provider_payments'
  | 'provider_patients'
  | 'provider_documents'
  | 'provider_messages'
  | 'provider_support'
  | 'provider_admin';

export type BillingEnrollmentModuleVariant =
  | 'commercial'
  | 'medicare'
  | 'medicaid'
  | 'employer_group';

export type BillingEnrollmentModuleConfig = {
  variant: BillingEnrollmentModuleVariant;
  featureFlags: {
    enrollmentEnabled: boolean;
    paymentsEnabled: boolean;
    noticesEnabled: boolean;
    supportEnabled: boolean;
    brokerAssistEnabled: boolean;
  };
  paymentOptions: {
    allowCard: boolean;
    allowBankAccount: boolean;
    allowPaperCheck: boolean;
    allowEmployerInvoice: boolean;
  };
  autopay: {
    enabled: boolean;
    allowCardAutopay: boolean;
    allowBankAutopay: boolean;
  };
  documentRequirements: {
    requireIdentityProof: boolean;
    requireIncomeProof: boolean;
    requireResidencyProof: boolean;
    requireDependentVerification: boolean;
  };
  supportContactContent: {
    enrollmentPhone: string;
    enrollmentEmail: string;
    billingPhone: string;
    billingEmail: string;
    helpCenterUrl: string;
  };
  renewalMessaging: {
    headline: string;
    body: string;
    ctaLabel: string;
  };
};

export type BillingEnrollmentModuleConfigUpdateInput = {
  variant?: BillingEnrollmentModuleVariant;
  featureFlags?: Partial<BillingEnrollmentModuleConfig['featureFlags']>;
  paymentOptions?: Partial<BillingEnrollmentModuleConfig['paymentOptions']>;
  autopay?: Partial<BillingEnrollmentModuleConfig['autopay']>;
  documentRequirements?: Partial<BillingEnrollmentModuleConfig['documentRequirements']>;
  supportContactContent?: Partial<BillingEnrollmentModuleConfig['supportContactContent']>;
  renewalMessaging?: Partial<BillingEnrollmentModuleConfig['renewalMessaging']>;
};

type UpdateTenantNotificationSettingsInput = Partial<TenantNotificationSettings>;
type UpdateTenantPurchasedModulesInput = string[];
type UpdateBillingEnrollmentModuleConfigInput = BillingEnrollmentModuleConfigUpdateInput;

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const DEFAULT_TENANT_NOTIFICATION_SETTINGS: TenantNotificationSettings = {
  emailEnabled: true,
  inAppEnabled: true,
  digestEnabled: false,
  replyToEmail: null,
  senderName: null
};

const DEFAULT_TENANT_PURCHASED_MODULES: TenantPurchasedModule[] = [
  'member_home',
  'member_benefits',
  'member_claims',
  'member_id_card',
  'member_providers',
  'member_authorizations',
  'member_messages',
  'member_documents',
  'member_billing',
  'member_support',
  'billing_enrollment',
  'provider_dashboard',
  'provider_eligibility',
  'provider_authorizations',
  'provider_claims',
  'provider_payments',
  'provider_patients',
  'provider_documents',
  'provider_messages',
  'provider_support',
  'provider_admin'
];

const DEFAULT_BILLING_ENROLLMENT_MODULE_CONFIG: BillingEnrollmentModuleConfig = {
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
  }
};

const purchasedModuleSet = new Set<TenantPurchasedModule>(DEFAULT_TENANT_PURCHASED_MODULES);

function isRecord(value: Prisma.JsonValue | null | undefined): value is Record<string, Prisma.JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalEmail(value: string | null | undefined, fieldName: string) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalized)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }

  return normalized.toLowerCase();
}

function normalizeNotificationSettings(
  input: Record<string, Prisma.JsonValue> | null | undefined
): TenantNotificationSettings {
  return {
    emailEnabled:
      typeof input?.emailEnabled === 'boolean'
        ? input.emailEnabled
        : DEFAULT_TENANT_NOTIFICATION_SETTINGS.emailEnabled,
    inAppEnabled:
      typeof input?.inAppEnabled === 'boolean'
        ? input.inAppEnabled
        : DEFAULT_TENANT_NOTIFICATION_SETTINGS.inAppEnabled,
    digestEnabled:
      typeof input?.digestEnabled === 'boolean'
        ? input.digestEnabled
        : DEFAULT_TENANT_NOTIFICATION_SETTINGS.digestEnabled,
    replyToEmail:
      typeof input?.replyToEmail === 'string'
        ? normalizeOptionalEmail(input.replyToEmail, 'replyToEmail')
        : DEFAULT_TENANT_NOTIFICATION_SETTINGS.replyToEmail,
    senderName:
      typeof input?.senderName === 'string'
        ? normalizeOptionalString(input.senderName)
        : DEFAULT_TENANT_NOTIFICATION_SETTINGS.senderName
  };
}

function normalizePurchasedModules(input: Prisma.JsonValue | null | undefined): TenantPurchasedModule[] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_TENANT_PURCHASED_MODULES];
  }

  const modules = Array.from(
    new Set(
      input.filter((value): value is TenantPurchasedModule => typeof value === 'string' && purchasedModuleSet.has(value as TenantPurchasedModule))
    )
  );

  if (modules.length === 0) {
    return [...DEFAULT_TENANT_PURCHASED_MODULES];
  }

  return modules;
}

function getTenantBrandingConfigRecord(brandingConfig: Prisma.JsonValue) {
  return isRecord(brandingConfig) ? brandingConfig : {};
}

export function getDefaultTenantNotificationSettings() {
  return { ...DEFAULT_TENANT_NOTIFICATION_SETTINGS };
}

export function getDefaultTenantPurchasedModules() {
  return [...DEFAULT_TENANT_PURCHASED_MODULES];
}

export function getDefaultBillingEnrollmentModuleConfig() {
  return structuredClone(DEFAULT_BILLING_ENROLLMENT_MODULE_CONFIG);
}

function normalizeBillingEnrollmentVariant(
  value: unknown
): BillingEnrollmentModuleVariant {
  if (
    value === 'commercial' ||
    value === 'medicare' ||
    value === 'medicaid' ||
    value === 'employer_group'
  ) {
    return value;
  }

  return DEFAULT_BILLING_ENROLLMENT_MODULE_CONFIG.variant;
}

function normalizeBillingEnrollmentModuleConfig(
  input: Record<string, Prisma.JsonValue> | null | undefined
): BillingEnrollmentModuleConfig {
  const defaultConfig = DEFAULT_BILLING_ENROLLMENT_MODULE_CONFIG;
  const featureFlags = isRecord(input?.featureFlags) ? input.featureFlags : {};
  const paymentOptions = isRecord(input?.paymentOptions) ? input.paymentOptions : {};
  const autopay = isRecord(input?.autopay) ? input.autopay : {};
  const documentRequirements = isRecord(input?.documentRequirements) ? input.documentRequirements : {};
  const supportContactContent = isRecord(input?.supportContactContent) ? input.supportContactContent : {};
  const renewalMessaging = isRecord(input?.renewalMessaging) ? input.renewalMessaging : {};

  return {
    variant: normalizeBillingEnrollmentVariant(input?.variant),
    featureFlags: {
      enrollmentEnabled:
        typeof featureFlags.enrollmentEnabled === 'boolean'
          ? featureFlags.enrollmentEnabled
          : defaultConfig.featureFlags.enrollmentEnabled,
      paymentsEnabled:
        typeof featureFlags.paymentsEnabled === 'boolean'
          ? featureFlags.paymentsEnabled
          : defaultConfig.featureFlags.paymentsEnabled,
      noticesEnabled:
        typeof featureFlags.noticesEnabled === 'boolean'
          ? featureFlags.noticesEnabled
          : defaultConfig.featureFlags.noticesEnabled,
      supportEnabled:
        typeof featureFlags.supportEnabled === 'boolean'
          ? featureFlags.supportEnabled
          : defaultConfig.featureFlags.supportEnabled,
      brokerAssistEnabled:
        typeof featureFlags.brokerAssistEnabled === 'boolean'
          ? featureFlags.brokerAssistEnabled
          : defaultConfig.featureFlags.brokerAssistEnabled
    },
    paymentOptions: {
      allowCard:
        typeof paymentOptions.allowCard === 'boolean'
          ? paymentOptions.allowCard
          : defaultConfig.paymentOptions.allowCard,
      allowBankAccount:
        typeof paymentOptions.allowBankAccount === 'boolean'
          ? paymentOptions.allowBankAccount
          : defaultConfig.paymentOptions.allowBankAccount,
      allowPaperCheck:
        typeof paymentOptions.allowPaperCheck === 'boolean'
          ? paymentOptions.allowPaperCheck
          : defaultConfig.paymentOptions.allowPaperCheck,
      allowEmployerInvoice:
        typeof paymentOptions.allowEmployerInvoice === 'boolean'
          ? paymentOptions.allowEmployerInvoice
          : defaultConfig.paymentOptions.allowEmployerInvoice
    },
    autopay: {
      enabled:
        typeof autopay.enabled === 'boolean'
          ? autopay.enabled
          : defaultConfig.autopay.enabled,
      allowCardAutopay:
        typeof autopay.allowCardAutopay === 'boolean'
          ? autopay.allowCardAutopay
          : defaultConfig.autopay.allowCardAutopay,
      allowBankAutopay:
        typeof autopay.allowBankAutopay === 'boolean'
          ? autopay.allowBankAutopay
          : defaultConfig.autopay.allowBankAutopay
    },
    documentRequirements: {
      requireIdentityProof:
        typeof documentRequirements.requireIdentityProof === 'boolean'
          ? documentRequirements.requireIdentityProof
          : defaultConfig.documentRequirements.requireIdentityProof,
      requireIncomeProof:
        typeof documentRequirements.requireIncomeProof === 'boolean'
          ? documentRequirements.requireIncomeProof
          : defaultConfig.documentRequirements.requireIncomeProof,
      requireResidencyProof:
        typeof documentRequirements.requireResidencyProof === 'boolean'
          ? documentRequirements.requireResidencyProof
          : defaultConfig.documentRequirements.requireResidencyProof,
      requireDependentVerification:
        typeof documentRequirements.requireDependentVerification === 'boolean'
          ? documentRequirements.requireDependentVerification
          : defaultConfig.documentRequirements.requireDependentVerification
    },
    supportContactContent: {
      enrollmentPhone:
        typeof supportContactContent.enrollmentPhone === 'string'
          ? supportContactContent.enrollmentPhone
          : defaultConfig.supportContactContent.enrollmentPhone,
      enrollmentEmail:
        typeof supportContactContent.enrollmentEmail === 'string'
          ? supportContactContent.enrollmentEmail
          : defaultConfig.supportContactContent.enrollmentEmail,
      billingPhone:
        typeof supportContactContent.billingPhone === 'string'
          ? supportContactContent.billingPhone
          : defaultConfig.supportContactContent.billingPhone,
      billingEmail:
        typeof supportContactContent.billingEmail === 'string'
          ? supportContactContent.billingEmail
          : defaultConfig.supportContactContent.billingEmail,
      helpCenterUrl:
        typeof supportContactContent.helpCenterUrl === 'string'
          ? supportContactContent.helpCenterUrl
          : defaultConfig.supportContactContent.helpCenterUrl
    },
    renewalMessaging: {
      headline:
        typeof renewalMessaging.headline === 'string'
          ? renewalMessaging.headline
          : defaultConfig.renewalMessaging.headline,
      body:
        typeof renewalMessaging.body === 'string'
          ? renewalMessaging.body
          : defaultConfig.renewalMessaging.body,
      ctaLabel:
        typeof renewalMessaging.ctaLabel === 'string'
          ? renewalMessaging.ctaLabel
          : defaultConfig.renewalMessaging.ctaLabel
    }
  };
}

export async function getNotificationSettingsForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      brandingConfig: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);
  const notificationSettings = isRecord(brandingConfig.notificationSettings)
    ? brandingConfig.notificationSettings
    : null;

  return normalizeNotificationSettings(notificationSettings);
}

export async function updateNotificationSettingsForTenant(
  tenantId: string,
  input: UpdateTenantNotificationSettingsInput,
  context: AuditContext = {}
) {
  const updatedSettings = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        brandingConfig: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);
    const currentSettings = normalizeNotificationSettings(
      isRecord(brandingConfig.notificationSettings)
        ? brandingConfig.notificationSettings
        : null
    );

    const nextSettings: TenantNotificationSettings = {
      emailEnabled: input.emailEnabled ?? currentSettings.emailEnabled,
      inAppEnabled: input.inAppEnabled ?? currentSettings.inAppEnabled,
      digestEnabled: input.digestEnabled ?? currentSettings.digestEnabled,
      replyToEmail:
        input.replyToEmail !== undefined
          ? normalizeOptionalEmail(input.replyToEmail, 'replyToEmail')
          : currentSettings.replyToEmail,
      senderName:
        input.senderName !== undefined
          ? normalizeOptionalString(input.senderName)
          : currentSettings.senderName
    };

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: {
          ...brandingConfig,
          notificationSettings: nextSettings
        } satisfies Prisma.InputJsonValue
      }
    });

    await logAuditEvent({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.notification-settings.updated',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
      metadata: nextSettings
    });

    return nextSettings;
  });

  return updatedSettings;
}

export async function getPurchasedModulesForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      brandingConfig: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);

  return normalizePurchasedModules(brandingConfig.purchasedModules ?? null);
}

export async function updatePurchasedModulesForTenant(
  tenantId: string,
  input: UpdateTenantPurchasedModulesInput,
  context: AuditContext = {}
) {
  const nextModules = normalizePurchasedModules(input);

  const updatedModules = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        brandingConfig: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: {
          ...brandingConfig,
          purchasedModules: nextModules
        } satisfies Prisma.InputJsonValue
      }
    });

    await logAuditEvent({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.purchased-modules.updated',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
      metadata: {
        purchasedModules: nextModules
      }
    });

    return nextModules;
  });

  return updatedModules;
}

export async function getBillingEnrollmentModuleConfigForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      brandingConfig: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);
  const moduleConfig = isRecord(brandingConfig.billingEnrollmentModuleConfig)
    ? brandingConfig.billingEnrollmentModuleConfig
    : null;

  return normalizeBillingEnrollmentModuleConfig(moduleConfig);
}

export async function updateBillingEnrollmentModuleConfigForTenant(
  tenantId: string,
  input: UpdateBillingEnrollmentModuleConfigInput,
  context: AuditContext = {}
) {
  const updatedModuleConfig = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        brandingConfig: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const brandingConfig = getTenantBrandingConfigRecord(tenant.brandingConfig);
    const currentConfig = normalizeBillingEnrollmentModuleConfig(
      isRecord(brandingConfig.billingEnrollmentModuleConfig)
        ? brandingConfig.billingEnrollmentModuleConfig
        : null
    );

    const nextConfig = normalizeBillingEnrollmentModuleConfig({
      ...currentConfig,
      ...input,
      featureFlags: {
        ...currentConfig.featureFlags,
        ...(input.featureFlags ?? {})
      },
      paymentOptions: {
        ...currentConfig.paymentOptions,
        ...(input.paymentOptions ?? {})
      },
      autopay: {
        ...currentConfig.autopay,
        ...(input.autopay ?? {})
      },
      documentRequirements: {
        ...currentConfig.documentRequirements,
        ...(input.documentRequirements ?? {})
      },
      supportContactContent: {
        ...currentConfig.supportContactContent,
        ...(input.supportContactContent ?? {})
      },
      renewalMessaging: {
        ...currentConfig.renewalMessaging,
        ...(input.renewalMessaging ?? {})
      }
    } as unknown as Record<string, Prisma.JsonValue>);

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: {
          ...brandingConfig,
          billingEnrollmentModuleConfig: nextConfig
        } satisfies Prisma.InputJsonValue
      }
    });

    await logAuditEvent({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.billing-enrollment-module-config.updated',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
      metadata: nextConfig as unknown as Prisma.InputJsonValue
    });

    return nextConfig;
  });

  return updatedModuleConfig;
}
