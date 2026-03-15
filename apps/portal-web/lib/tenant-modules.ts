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

type BrandingConfig = Record<string, unknown> | undefined;

function parsePurchasedModules(brandingConfig: BrandingConfig) {
  const purchasedModules = brandingConfig?.purchasedModules;

  if (!Array.isArray(purchasedModules)) {
    return null;
  }

  return new Set(
    purchasedModules.filter((moduleId): moduleId is TenantPortalModuleId => typeof moduleId === 'string')
  );
}

export function isTenantModuleEnabled(
  brandingConfig: BrandingConfig,
  moduleId: TenantPortalModuleId
) {
  const purchasedModules = parsePurchasedModules(brandingConfig);

  if (!purchasedModules) {
    return true;
  }

  return purchasedModules.has(moduleId);
}

export function isTenantModuleEnabledForUser(
  user: PortalSessionUser,
  moduleId: TenantPortalModuleId
) {
  return isTenantModuleEnabled(user.tenant.brandingConfig, moduleId);
}
