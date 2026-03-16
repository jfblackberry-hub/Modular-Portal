export type PortalImageKey =
  | 'abstractBackground'
  | 'adminHero'
  | 'apiPlatformHero'
  | 'billingEnrollmentHero'
  | 'documentsHero'
  | 'loginHero'
  | 'memberHero'
  | 'mobileAppHero'
  | 'providerHero'
  | 'providerLoginHero'
  | 'supportHero'
  | 'telehealthHero'
  | 'wellnessHero';

export type TenantImageOverrides = Partial<Record<PortalImageKey, string>>;

const REAL_HEALTH_BASE_PATH = '/assets/portal-images/real-health-api';

export const REAL_HEALTH_DEFAULT_IMAGE_REGISTRY: Record<PortalImageKey, string> = {
  abstractBackground: `${REAL_HEALTH_BASE_PATH}/abstract-bg-healthcare-gradient.svg`,
  adminHero: `${REAL_HEALTH_BASE_PATH}/admin-hero-tenant-management.svg`,
  apiPlatformHero: `${REAL_HEALTH_BASE_PATH}/api-platform-hero-digital-health.svg`,
  billingEnrollmentHero: `${REAL_HEALTH_BASE_PATH}/billing-enrollment-hero-payments.svg`,
  documentsHero: `${REAL_HEALTH_BASE_PATH}/documents-hero-secure-upload.svg`,
  loginHero: `${REAL_HEALTH_BASE_PATH}/mobile-app-hero-responsive-care.svg`,
  memberHero: `${REAL_HEALTH_BASE_PATH}/member-portal-hero-family-coverage.svg`,
  mobileAppHero: `${REAL_HEALTH_BASE_PATH}/mobile-app-hero-responsive-care.svg`,
  providerHero: `${REAL_HEALTH_BASE_PATH}/provider-portal-hero-care-team.svg`,
  providerLoginHero: `${REAL_HEALTH_BASE_PATH}/telehealth-hero-virtual-care.svg`,
  supportHero: `${REAL_HEALTH_BASE_PATH}/support-hero-help-center.svg`,
  telehealthHero: `${REAL_HEALTH_BASE_PATH}/telehealth-hero-virtual-care.svg`,
  wellnessHero: `${REAL_HEALTH_BASE_PATH}/wellness-hero-preventive-care.svg`
};

const overrideAliasMap: Partial<Record<string, PortalImageKey>> = {
  adminHeroImage: 'adminHero',
  billingEnrollmentHeroImage: 'billingEnrollmentHero',
  documentsHeroImage: 'documentsHero',
  heroImage: 'memberHero',
  heroImageUrl: 'memberHero',
  loginHeroImage: 'loginHero',
  memberHeroImage: 'memberHero',
  providerHeroImage: 'providerHero',
  providerLoginHeroImage: 'providerLoginHero',
  supportHeroImage: 'supportHero'
};

function normalizeImagePath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `/${trimmed}`;
}

function mapRawOverrides(rawOverrides: Record<string, unknown>) {
  const imageOverrides: TenantImageOverrides = {};

  for (const [rawKey, value] of Object.entries(rawOverrides)) {
    if (typeof value !== 'string') {
      continue;
    }

    const key = (overrideAliasMap[rawKey] ?? rawKey) as PortalImageKey;

    if (!(key in REAL_HEALTH_DEFAULT_IMAGE_REGISTRY)) {
      continue;
    }

    const normalized = normalizeImagePath(value);
    if (!normalized) {
      continue;
    }

    imageOverrides[key] = normalized;
  }

  return imageOverrides;
}

export function getTenantImageOverrides(brandingConfig?: Record<string, unknown>) {
  if (!brandingConfig) {
    return {};
  }

  const imageOverrides: TenantImageOverrides = {};
  const overrideSources = [
    brandingConfig,
    typeof brandingConfig.imageOverrides === 'object' && brandingConfig.imageOverrides
      ? (brandingConfig.imageOverrides as Record<string, unknown>)
      : undefined,
    typeof brandingConfig.portalImageOverrides === 'object' && brandingConfig.portalImageOverrides
      ? (brandingConfig.portalImageOverrides as Record<string, unknown>)
      : undefined
  ];

  for (const source of overrideSources) {
    if (!source) {
      continue;
    }

    Object.assign(imageOverrides, mapRawOverrides(source));
  }

  return imageOverrides;
}

export function getPortalImageSrc(
  key: PortalImageKey,
  options?: {
    fallbackSrc?: string;
    tenantBrandingConfig?: Record<string, unknown>;
    tenantOverrides?: TenantImageOverrides;
  }
) {
  const defaultSrc = REAL_HEALTH_DEFAULT_IMAGE_REGISTRY[key];
  const configOverrides = getTenantImageOverrides(options?.tenantBrandingConfig);
  const overrideSrc = options?.tenantOverrides?.[key] ?? configOverrides[key];

  if (overrideSrc) {
    return overrideSrc;
  }

  if (options?.fallbackSrc) {
    return options.fallbackSrc;
  }

  return defaultSrc;
}
