import tenantConfigJson from '../../../tenant-config.json';
import { REAL_HEALTH_DEFAULT_IMAGE_REGISTRY } from '../lib/portal-image-registry';

export interface TenantThemeConfig {
  font: string;
  heroImage: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

type TenantConfigFile = {
  default: TenantThemeConfig;
  tenants?: Record<string, Partial<TenantThemeConfig>>;
};

const tenantConfig = tenantConfigJson as TenantConfigFile;

const platformDefaultTheme: TenantThemeConfig = {
  logo: '/tenant-assets/4716c016-3f09-4707-8591-47457441663a-logo.svg',
  primaryColor: '#2F6FED',
  secondaryColor: '#4DA3FF',
  heroImage: REAL_HEALTH_DEFAULT_IMAGE_REGISTRY.memberHero,
  font: "Inter, Aptos, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
};

function getString(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function loadTenantTheme({
  brandingConfig,
  tenantId
}: {
  brandingConfig?: Record<string, unknown>;
  tenantId?: string;
}): TenantThemeConfig {
  const fileDefault = tenantConfig.default ?? platformDefaultTheme;
  const tenantOverride =
    (tenantId ? tenantConfig.tenants?.[tenantId] : undefined) ?? {};

  return {
    logo:
      getString(brandingConfig, 'logoUrl') ??
      getString(brandingConfig, 'logo') ??
      tenantOverride.logo ??
      fileDefault.logo ??
      platformDefaultTheme.logo,
    primaryColor:
      getString(brandingConfig, 'primaryColor') ??
      tenantOverride.primaryColor ??
      fileDefault.primaryColor ??
      platformDefaultTheme.primaryColor,
    secondaryColor:
      getString(brandingConfig, 'secondaryColor') ??
      tenantOverride.secondaryColor ??
      fileDefault.secondaryColor ??
      platformDefaultTheme.secondaryColor,
    heroImage:
      getString(brandingConfig, 'heroImageUrl') ??
      getString(brandingConfig, 'heroImage') ??
      tenantOverride.heroImage ??
      fileDefault.heroImage ??
      platformDefaultTheme.heroImage,
    font:
      getString(brandingConfig, 'font') ??
      tenantOverride.font ??
      fileDefault.font ??
      platformDefaultTheme.font
  };
}

export const defaultTenantTheme = platformDefaultTheme;
