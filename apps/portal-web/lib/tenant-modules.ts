import type { PortalSessionUser } from './portal-session';

export type TenantPortalModuleId =
  | 'member_home'
  | 'member_benefits'
  | 'member_claims'
  | 'member_id_card'
  | 'member_providers'
  | 'member_authorizations'
  | 'member_messages'
  | 'member_documents'
  | 'member_billing'
  | 'member_care_cost_estimator'
  | 'member_support'
  | 'billing_enrollment'
  | 'provider_operations'
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

const KNOWN_TENANT_PORTAL_MODULE_IDS = new Set<string>([
  'member_home',
  'member_benefits',
  'member_claims',
  'member_id_card',
  'member_providers',
  'member_authorizations',
  'member_messages',
  'member_documents',
  'member_billing',
  'member_care_cost_estimator',
  'member_support',
  'billing_enrollment',
  'provider_operations',
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
]);

export function isKnownTenantPortalModuleId(
  value: string
): value is TenantPortalModuleId {
  return KNOWN_TENANT_PORTAL_MODULE_IDS.has(value);
}

type BrandingConfig = Record<string, unknown> | undefined;

const LEGACY_PROVIDER_OPERATION_MODULES: TenantPortalModuleId[] = [
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

type TenantModuleDenialLog = {
  level: 'warn';
  security: 'tenant_module_gate';
  message: 'tenant_module_access_denied';
  reason:
    | 'invalid_module_id'
    | 'missing_tenant_id'
    | 'missing_or_invalid_purchased_modules';
  moduleId?: string;
  tenantId?: string | null;
};

function logTenantModuleContextDenial(entry: Omit<TenantModuleDenialLog, 'level' | 'security' | 'message'>) {
  const payload: TenantModuleDenialLog = {
    level: 'warn',
    security: 'tenant_module_gate',
    message: 'tenant_module_access_denied',
    ...entry
  };
  console.warn(JSON.stringify(payload));
}

function parsePurchasedModules(brandingConfig: BrandingConfig): Set<TenantPortalModuleId> | null {
  const purchasedModules = brandingConfig?.purchasedModules;

  if (!Array.isArray(purchasedModules)) {
    return null;
  }

  const known = purchasedModules.filter(
    (moduleId): moduleId is TenantPortalModuleId =>
      typeof moduleId === 'string' && isKnownTenantPortalModuleId(moduleId)
  );

  return new Set(known);
}

export type TenantModuleGateContext = {
  tenantId?: string | null;
};

export function isTenantModuleEnabled(
  brandingConfig: BrandingConfig,
  moduleId: TenantPortalModuleId,
  context?: TenantModuleGateContext
) {
  const tenantId = context?.tenantId;

  if (typeof moduleId !== 'string' || !isKnownTenantPortalModuleId(moduleId)) {
    logTenantModuleContextDenial({
      reason: 'invalid_module_id',
      moduleId: String(moduleId),
      tenantId
    });
    return false;
  }

  const purchasedModules = parsePurchasedModules(brandingConfig);

  if (!purchasedModules) {
    logTenantModuleContextDenial({
      reason: 'missing_or_invalid_purchased_modules',
      moduleId,
      tenantId
    });
    return false;
  }

  if (moduleId === 'provider_operations') {
    return (
      purchasedModules.has('provider_operations') ||
      LEGACY_PROVIDER_OPERATION_MODULES.some((providerModuleId) =>
        purchasedModules.has(providerModuleId)
      )
    );
  }

  if (
    LEGACY_PROVIDER_OPERATION_MODULES.includes(moduleId) &&
    purchasedModules.has('provider_operations')
  ) {
    return true;
  }

  return purchasedModules.has(moduleId);
}

export function isTenantModuleEnabledForUser(
  user: PortalSessionUser,
  moduleId: TenantPortalModuleId
) {
  if (typeof moduleId !== 'string' || !isKnownTenantPortalModuleId(moduleId)) {
    logTenantModuleContextDenial({
      reason: 'invalid_module_id',
      moduleId: String(moduleId),
      tenantId: user?.tenant?.id ?? null
    });
    return false;
  }

  const tenantId = user?.tenant?.id?.trim();
  if (!tenantId) {
    logTenantModuleContextDenial({
      reason: 'missing_tenant_id',
      moduleId,
      tenantId: user?.tenant?.id ?? null
    });
    return false;
  }

  return isTenantModuleEnabled(user.tenant.brandingConfig, moduleId, {
    tenantId
  });
}
