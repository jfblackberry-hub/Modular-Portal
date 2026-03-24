import { loadTenantTheme } from '../theme/loadTenantTheme';
import { buildPortalApiHeaders } from './api-request';
import type { PortalExperience } from './portal-experience';
import {
  getTenantImageOverrides,
  type TenantImageOverrides
} from './portal-image-registry';
import { getPortalSessionAccessToken } from './portal-session';
import { config } from './server-runtime';
const DEFAULT_PRIMARY_COLOR = '#2A6FA8';
const DEFAULT_SECONDARY_COLOR = '#EAF4FB';
const DEFAULT_PAYER_BRANDING = {
  displayName: 'Blue Horizon Health',
  logoUrl: '/tenant-assets/4716c016-3f09-4707-8591-47457441663a-logo.svg',
  primaryColor: '#2A6FA8',
  secondaryColor: '#EAF4FB'
};

export interface TenantBranding {
  customCss?: string;
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
  experience: PortalExperience;
  payerDisplayName?: string;
  payerLogoUrl?: string;
  employerGroupName?: string;
  employerGroupLogoUrl?: string;
  planName?: string;
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
  customCss?: string | null;
  employerGroupName?: string | null;
  employerGroupLogoUrl?: string | null;
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

function getStringValueFromKeys(
  config: Record<string, unknown> | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = getStringValue(config, key);
    if (value) {
      return value;
    }
  }

  return undefined;
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
  brandingOverride?: BrandingApiResponse,
  options: {
    experience: PortalExperience;
  } = {
    experience: 'member'
  }
) {
  const tenantTheme = loadTenantTheme({
    tenantId: tenant.id,
    brandingConfig: tenant.brandingConfig
  });
  const config = tenant.brandingConfig;
  const experience = options.experience;

  const basePrimaryColor =
    brandingOverride?.primaryColor ??
    getStringValue(config, 'primaryColor') ??
    tenantTheme.primaryColor ??
    DEFAULT_PRIMARY_COLOR;
  const baseSecondaryColor =
    brandingOverride?.secondaryColor ??
    getStringValue(config, 'secondaryColor') ??
    tenantTheme.secondaryColor ??
    DEFAULT_SECONDARY_COLOR;

  const memberPayerDisplayName =
    getStringValueFromKeys(config, [
      'memberPayerDisplayName',
      'memberPortalDisplayName',
      'payerDisplayName',
      'payerName',
      'healthPlanName'
    ]) ?? DEFAULT_PAYER_BRANDING.displayName;
  const memberPayerLogoUrl =
    getStringValueFromKeys(config, [
      'memberPayerLogoUrl',
      'memberPortalLogoUrl',
      'payerLogoUrl',
      'healthPlanLogoUrl'
    ]) ?? DEFAULT_PAYER_BRANDING.logoUrl;
  const memberPayerPrimaryColor =
    getStringValueFromKeys(config, ['memberPayerPrimaryColor', 'payerPrimaryColor']) ??
    DEFAULT_PAYER_BRANDING.primaryColor;
  const memberPayerSecondaryColor =
    getStringValueFromKeys(config, ['memberPayerSecondaryColor', 'payerSecondaryColor']) ??
    DEFAULT_PAYER_BRANDING.secondaryColor;

  const employerGroupName =
    getStringValueFromKeys(config, [
      'employerGroupName',
      'employerName',
      'groupName'
    ]) ??
    (typeof brandingOverride?.employerGroupName === 'string'
      ? brandingOverride.employerGroupName
      : undefined) ??
    tenant.name;
  const employerGroupLogoUrl = getStringValueFromKeys(config, [
    'employerGroupLogoUrl',
    'employerLogoUrl',
    'groupLogoUrl'
  ]) ??
    (typeof brandingOverride?.employerGroupLogoUrl === 'string'
      ? brandingOverride.employerGroupLogoUrl
      : undefined);
  const brokerAgencyName =
    getStringValueFromKeys(config, [
      'brokerAgencyName',
      'agencyName',
      'brokerDisplayName'
    ]) ?? 'Northbridge Benefits Group';
  const brokerAgencyLogoUrl =
    getStringValueFromKeys(config, [
      'brokerAgencyLogoUrl',
      'agencyLogoUrl',
      'brokerLogoUrl'
    ]) ?? employerGroupLogoUrl;
  const planName = getStringValueFromKeys(config, ['memberPlanName', 'planName']);

  const primaryColor = experience === 'member' ? memberPayerPrimaryColor : basePrimaryColor;
  const secondaryColor =
    experience === 'member' ? memberPayerSecondaryColor : baseSecondaryColor;
  const displayName =
    experience === 'member'
      ? memberPayerDisplayName
      : experience === 'employer'
        ? employerGroupName
      : experience === 'broker'
        ? brokerAgencyName
      : experience === 'provider'
        ? getStringValueFromKeys(config, ['providerNetworkName', 'networkName']) ??
          brandingOverride?.displayName ??
          getStringValue(config, 'displayName') ??
          tenant.name
        : brandingOverride?.displayName ??
          getStringValue(config, 'displayName') ??
          tenant.name;
  const logoUrl =
    experience === 'member'
      ? withCacheBuster(memberPayerLogoUrl, brandingOverride?.updatedAt)
      : experience === 'employer'
        ? withCacheBuster(
            employerGroupLogoUrl ??
              brandingOverride?.logoUrl ??
              getStringValue(config, 'logoUrl') ??
              getStringValue(config, 'logo') ??
              tenantTheme.logo,
            brandingOverride?.updatedAt
          )
      : experience === 'broker'
        ? withCacheBuster(
            brokerAgencyLogoUrl ??
              brandingOverride?.logoUrl ??
              getStringValue(config, 'logoUrl') ??
              getStringValue(config, 'logo') ??
              tenantTheme.logo,
            brandingOverride?.updatedAt
          )
      : withCacheBuster(
          brandingOverride?.logoUrl ??
            getStringValue(config, 'logoUrl') ??
            getStringValue(config, 'logo') ??
            tenantTheme.logo,
          brandingOverride?.updatedAt
        );

  return {
    faviconUrl: withCacheBuster(
      brandingOverride?.faviconUrl ?? getStringValue(config, 'faviconUrl'),
      brandingOverride?.updatedAt
    ),
    customCss:
      (typeof brandingOverride?.customCss === 'string' ? brandingOverride.customCss : undefined) ??
      getStringValue(config, 'customCss'),
    heroImageUrl:
      brandingOverride?.heroImageUrl ??
      getStringValue(config, 'heroImageUrl') ??
      getStringValue(config, 'heroImage') ??
      tenantTheme.heroImage,
    fontFamily: getStringValue(config, 'font') ?? tenantTheme.font,
    primaryColor,
    primarySoftColor: createAccentSoft(primaryColor),
    secondaryColor,
    secondarySoftColor: createAccentSoft(secondaryColor),
    badgeLabel:
      experience === 'member'
        ? 'Health Plan'
        : getStringValue(config, 'badgeLabel') ?? 'Tenant',
    displayName,
    logoUrl,
    supportEmail: getStringValue(config, 'supportEmail'),
    supportPhone: getStringValue(config, 'supportPhone'),
    welcomeText: getStringValue(config, 'welcomeText'),
    supportLabel:
      getStringValue(config, 'supportLabel') ??
      'Member support available Monday through Friday',
    imageOverrides: {
      ...getTenantImageOverrides(config),
      ...(brandingOverride?.imageOverrides
        ? getTenantImageOverrides(brandingOverride.imageOverrides)
        : {})
    },
    experience,
    payerDisplayName: memberPayerDisplayName,
    payerLogoUrl: withCacheBuster(memberPayerLogoUrl, brandingOverride?.updatedAt),
    employerGroupName,
    employerGroupLogoUrl: withCacheBuster(
      employerGroupLogoUrl,
      brandingOverride?.updatedAt
    ),
    planName
  };
}

export async function getTenantBranding(
  tenant: TenantContext,
  accessToken?: string,
  options: {
    experience: PortalExperience;
  } = {
    experience: 'member'
  }
) {
  try {
    const sessionAccessToken = await getPortalSessionAccessToken();
    const resolvedAccessToken = sessionAccessToken ?? accessToken;

    if (resolvedAccessToken) {
      const response = await fetch(`${config.apiBaseUrl}/api/branding`, {
        cache: 'no-store',
        headers: await buildPortalApiHeaders({}, {
          accessToken: resolvedAccessToken,
          tenantId: tenant.id
        })
      });

      if (response.ok) {
        const latestBranding = (await response.json()) as BrandingApiResponse;
        if (
          latestBranding.tenantId &&
          latestBranding.tenantId !== tenant.id
        ) {
          return buildBranding(tenant, undefined, options);
        }

        return buildBranding(tenant, latestBranding, options);
      }
    }
  } catch {
    // Fall back to the session payload when the API is unavailable.
  }

  return buildBranding(tenant, undefined, options);
}
