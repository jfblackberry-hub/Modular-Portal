import {
  isProviderClassTenantType,
  normalizeTenantTypeForArchitecture
} from '@payer-portal/shared-types';

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

function isProviderOperationsModuleId(moduleId: TenantPortalModuleId): boolean {
  return (
    moduleId === 'provider_operations' ||
    LEGACY_PROVIDER_OPERATION_MODULES.includes(moduleId)
  );
}

/**
 * When purchasedModules is unset, empty, or only unknown strings, provider-class tenants
 * still need the provider portal (middleware gates /provider/* on provider_operations).
 */
function shouldDefaultProviderOperationsFromBranding(brandingConfig: BrandingConfig): boolean {
  const raw = brandingConfig?.purchasedModules;

  if (!Array.isArray(raw)) {
    return true;
  }

  if (raw.length === 0) {
    return true;
  }

  const knownCount = raw.filter(
    (moduleId): moduleId is TenantPortalModuleId =>
      typeof moduleId === 'string' && isKnownTenantPortalModuleId(moduleId)
  ).length;

  return knownCount === 0;
}

export type TenantModuleGateContext = {
  tenantId?: string | null;
  tenantTypeCode?: string | null;
};

export function isTenantModuleEnabled(
  brandingConfig: BrandingConfig,
  moduleId: TenantPortalModuleId,
  context?: TenantModuleGateContext
) {
  const tenantId = context?.tenantId;
  const tenantTypeCode = context?.tenantTypeCode;

  if (typeof moduleId !== 'string' || !isKnownTenantPortalModuleId(moduleId)) {
    logTenantModuleContextDenial({
      reason: 'invalid_module_id',
      moduleId: String(moduleId),
      tenantId
    });
    return false;
  }

  const normalizedTenantType = normalizeTenantTypeForArchitecture(tenantTypeCode);
  if (
    normalizedTenantType &&
    isProviderClassTenantType(normalizedTenantType) &&
    isProviderOperationsModuleId(moduleId) &&
    shouldDefaultProviderOperationsFromBranding(brandingConfig)
  ) {
    return true;
  }

  const purchasedModules = parsePurchasedModules(brandingConfig);

  if (!purchasedModules) {
    // If the purchasedModules key is simply absent, the tenant has no module restrictions — allow.
    // Only deny when the key is explicitly present but invalid/empty (misconfigured restriction).
    if (brandingConfig == null || !('purchasedModules' in brandingConfig)) {
      return true;
    }
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
    tenantId,
    tenantTypeCode: user.tenant.tenantTypeCode ?? null
  });
}
