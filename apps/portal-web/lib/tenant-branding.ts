import { loadTenantTheme } from '../theme/loadTenantTheme';
import {
  getTenantImageOverrides,
  type TenantImageOverrides
} from './portal-image-registry';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3002';
const DEFAULT_PRIMARY_COLOR = '#2A6FA8';
const DEFAULT_SECONDARY_COLOR = '#EAF4FB';

export interface TenantBranding {
  faviconUrl?: string;
  fontFamily: string;
  heroImageUrl?: string;
  primaryColor: string;
  primarySoftColor: string;
  secondaryColor: string;
  secondarySoftColor: string;
  badgeLabel: string;
  displayName: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  welcomeText?: string;
  supportLabel: string;
  imageOverrides?: TenantImageOverrides;
}

type TenantContext = {
  brandingConfig?: Record<string, unknown>;
  id: string;
  name: string;
};

type BrandingApiResponse = {
  tenantId?: string;
  displayName?: string;
  heroImageUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  imageOverrides?: Record<string, unknown> | null;
  updatedAt?: string | null;
};

function getStringValue(
  config: Record<string, unknown> | undefined,
  key: string
) {
  const value = config?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function createAccentSoft(accent: string) {
  if (accent.startsWith('#') && accent.length === 7) {
    const red = parseInt(accent.slice(1, 3), 16);
    const green = parseInt(accent.slice(3, 5), 16);
    const blue = parseInt(accent.slice(5, 7), 16);

    return `rgba(${red}, ${green}, ${blue}, 0.18)`;
  }

  return 'rgba(56, 189, 248, 0.18)';
}

function withCacheBuster(url: string | null | undefined, version: string | null | undefined) {
  if (!url) {
    return undefined;
  }

  if (!version) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function buildBranding(
  tenant: TenantContext,
  brandingOverride?: BrandingApiResponse
) {
  const tenantTheme = loadTenantTheme({
    tenantId: tenant.id,
    brandingConfig: tenant.brandingConfig
  });

  const primaryColor =
    brandingOverride?.primaryColor ??
    getStringValue(tenant.brandingConfig, 'primaryColor') ??
    tenantTheme.primaryColor ??
    DEFAULT_PRIMARY_COLOR;
  const secondaryColor =
    brandingOverride?.secondaryColor ??
    getStringValue(tenant.brandingConfig, 'secondaryColor') ??
    tenantTheme.secondaryColor ??
    DEFAULT_SECONDARY_COLOR;

  return {
    faviconUrl: withCacheBuster(
      brandingOverride?.faviconUrl ??
        getStringValue(tenant.brandingConfig, 'faviconUrl'),
      brandingOverride?.updatedAt
    ),
    heroImageUrl:
      brandingOverride?.heroImageUrl ??
      getStringValue(tenant.brandingConfig, 'heroImageUrl') ??
      getStringValue(tenant.brandingConfig, 'heroImage') ??
      tenantTheme.heroImage,
    fontFamily:
      getStringValue(tenant.brandingConfig, 'font') ?? tenantTheme.font,
    primaryColor,
    primarySoftColor: createAccentSoft(primaryColor),
    secondaryColor,
    secondarySoftColor: createAccentSoft(secondaryColor),
    badgeLabel:
      getStringValue(tenant.brandingConfig, 'badgeLabel') ?? 'Tenant',
    displayName:
      brandingOverride?.displayName ??
      getStringValue(tenant.brandingConfig, 'displayName') ??
      tenant.name,
    logoUrl: withCacheBuster(
      brandingOverride?.logoUrl ??
        getStringValue(tenant.brandingConfig, 'logoUrl') ??
        getStringValue(tenant.brandingConfig, 'logo') ??
        tenantTheme.logo,
      brandingOverride?.updatedAt
    ),
    supportEmail: getStringValue(tenant.brandingConfig, 'supportEmail'),
    supportPhone: getStringValue(tenant.brandingConfig, 'supportPhone'),
    welcomeText: getStringValue(tenant.brandingConfig, 'welcomeText'),
    supportLabel:
      getStringValue(tenant.brandingConfig, 'supportLabel') ??
      'Member support available Monday through Friday',
    imageOverrides: {
      ...getTenantImageOverrides(tenant.brandingConfig),
      ...(brandingOverride?.imageOverrides
        ? getTenantImageOverrides(brandingOverride.imageOverrides)
        : {})
    }
  };
}

export async function getTenantBranding(
  tenant: TenantContext,
  userId?: string
) {
  try {
    if (userId) {
      const response = await fetch(`${apiBaseUrl}/api/branding`, {
        cache: 'no-store',
        headers: {
          'x-user-id': userId
        }
      });

      if (response.ok) {
        const latestBranding = (await response.json()) as BrandingApiResponse;
        if (
          latestBranding.tenantId &&
          latestBranding.tenantId !== tenant.id
        ) {
          return buildBranding(tenant);
        }

        return buildBranding(tenant, latestBranding);
      }
    }
  } catch {
    // Fall back to the session payload when the API is unavailable.
  }

  return buildBranding(tenant);
}
