const DEFAULT_CLINIC_NAME = 'Riverside Health Group';
const DEFAULT_CLINIC_LOGO_SRC = '/assets/logos/riverside-health-group.svg';
const DEFAULT_PROVIDER_NAME = 'Dr. Lee';

function getStringValue(config: Record<string, unknown> | undefined, key: string) {
  const value = config?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getStringValueFromKeys(config: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = getStringValue(config, key);
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function resolveProviderClinicName(options?: {
  tenantBrandingConfig?: Record<string, unknown>;
  practiceName?: string;
}) {
  return (
    getStringValueFromKeys(options?.tenantBrandingConfig, [
      'providerClinicName',
      'providerPracticeName',
      'providerOrganizationName',
      'clinicName',
      'practiceName'
    ]) ??
    options?.practiceName ??
    DEFAULT_CLINIC_NAME
  );
}

export function resolveProviderClinicLogoSrc(options?: {
  tenantBrandingConfig?: Record<string, unknown>;
  fallbackLogoSrc?: string;
}) {
  return (
    getStringValueFromKeys(options?.tenantBrandingConfig, [
      'providerClinicLogoUrl',
      'providerPracticeLogoUrl',
      'providerOrganizationLogoUrl',
      'clinicLogoUrl',
      'practiceLogoUrl'
    ]) ??
    options?.fallbackLogoSrc ??
    DEFAULT_CLINIC_LOGO_SRC
  );
}

export function resolveProviderGreetingName(options?: {
  firstName?: string;
  lastName?: string;
  configuredProviderName?: string;
  fallbackName?: string;
}) {
  if (options?.configuredProviderName?.trim()) {
    const normalized = options.configuredProviderName.trim();
    if (/^dr\./i.test(normalized)) {
      return normalized;
    }

    const strippedCredentials = normalized.split(',')[0]?.trim() ?? normalized;
    const nameParts = strippedCredentials.split(/\s+/).filter(Boolean);
    const lastName = nameParts[nameParts.length - 1];

    if (lastName) {
      return `Dr. ${lastName}`;
    }
  }

  if (options?.lastName?.trim()) {
    return `Dr. ${options.lastName.trim()}`;
  }

  if (options?.firstName?.trim()) {
    return `Dr. ${options.firstName.trim()}`;
  }

  return options?.fallbackName ?? DEFAULT_PROVIDER_NAME;
}

export const defaultProviderHeroBranding = {
  clinicName: DEFAULT_CLINIC_NAME,
  clinicLogoSrc: DEFAULT_CLINIC_LOGO_SRC,
  providerName: DEFAULT_PROVIDER_NAME
};
