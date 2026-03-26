type BrandingConfig = Record<string, unknown> | undefined;

export const PROVIDER_POC_EXCLUDED_MODULE_IDS = [
  'provider_ai_copilot',
  'provider_ai_assistant',
  'provider_agentic_workflows'
] as const;

export const PROVIDER_POC_EXCLUDED_CONFIG_KEYS = [
  'aiCopilotEnabled',
  'aiAssistantEnabled',
  'agenticWorkflowsEnabled',
  'requiresAiForCoreOperations'
] as const;

export const PROVIDER_POC_FUTURE_READY_NOTES = [
  'optional AI can be introduced later as a separate provider capability',
  'optional AI can be tenant-enabled later without changing the tenant model',
  'optional automation or approval layers can be added later behind explicit provider features'
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getPurchasedModules(brandingConfig: BrandingConfig) {
  const purchasedModules = brandingConfig?.purchasedModules;

  if (!Array.isArray(purchasedModules)) {
    return [];
  }

  return purchasedModules.filter((value): value is string => typeof value === 'string');
}

function hasExcludedProviderPocConfig(value: unknown): boolean {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  if (
    PROVIDER_POC_EXCLUDED_CONFIG_KEYS.some(
      (key) => record[key] === true
    )
  ) {
    return true;
  }

  return Object.values(record).some((entry) => hasExcludedProviderPocConfig(entry));
}

export function assertProviderPocScopeGuardrails(brandingConfig: BrandingConfig) {
  const purchasedModules = getPurchasedModules(brandingConfig);

  if (
    purchasedModules.some((moduleId) =>
      PROVIDER_POC_EXCLUDED_MODULE_IDS.includes(
        moduleId as (typeof PROVIDER_POC_EXCLUDED_MODULE_IDS)[number]
      )
    )
  ) {
    throw new Error(
      'Provider POC scope violation. AI Copilot, AI assistant, and agentic workflow modules are excluded from the initial Provider Experience.'
    );
  }

  if (hasExcludedProviderPocConfig(brandingConfig)) {
    throw new Error(
      'Provider POC scope violation. AI Copilot, AI-assisted behavior, and agentic workflow configuration are not allowed in the initial Provider Experience.'
    );
  }
}
