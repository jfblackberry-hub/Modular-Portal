import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsWidgetId
} from '@payer-portal/api-contracts';

import type { ProviderPortalConfig } from '../config/providerPortalConfig';
import type { PortalSessionUser } from './portal-session';
import { buildProviderOperationsDashboardModel } from './provider-command-center-mock-data';

type ProviderOperationsPersonaWidgetMapping = {
  persona: string;
  widgets: ProviderOperationsWidgetId[];
  rollupWidgets?: ProviderOperationsWidgetId[];
};

type ProviderOperationsSourceSnapshot = {
  personaWidgetMappings?: ProviderOperationsPersonaWidgetMapping[];
};

type ProviderOperationsDataContext = {
  config: ProviderPortalConfig;
  user: PortalSessionUser;
  now?: Date;
};

const DEFAULT_PROVIDER_OPERATIONS_PERSONA_MAPPINGS: ProviderOperationsPersonaWidgetMapping[] = [
  {
    persona: 'clinic_manager',
    widgets: ['scheduling', 'authorizations', 'claims', 'billing', 'utilization'],
    rollupWidgets: ['claims', 'billing', 'utilization']
  },
  {
    persona: 'tenant_admin',
    widgets: ['scheduling', 'authorizations', 'claims', 'billing', 'utilization'],
    rollupWidgets: ['claims', 'billing', 'utilization']
  },
  {
    persona: 'authorization_specialist',
    widgets: ['scheduling', 'authorizations', 'utilization']
  },
  {
    persona: 'billing_specialist',
    widgets: ['claims', 'billing', 'utilization']
  },
  {
    persona: 'eligibility_coordinator',
    widgets: ['scheduling', 'authorizations', 'utilization']
  },
  {
    persona: 'provider_support',
    widgets: ['scheduling', 'claims', 'billing']
  }
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((entry): entry is string => typeof entry === 'string');
  return strings.length === value.length ? strings : undefined;
}

function isProviderOperationsWidgetId(value: string): value is ProviderOperationsWidgetId {
  return ['scheduling', 'authorizations', 'claims', 'billing', 'utilization'].includes(value);
}

function resolvePersonaMappings(brandingConfig?: Record<string, unknown>) {
  const providerDemoData = asRecord(brandingConfig?.providerDemoData);
  const providerOperations = asRecord(providerDemoData?.providerOperations);
  const rawMappings = Array.isArray(providerOperations?.personaWidgetMappings)
    ? providerOperations.personaWidgetMappings
    : [];
  const personaWidgetMappings = rawMappings
    .map((entry) => {
      const record = asRecord(entry);

      if (!record || typeof record.persona !== 'string') {
        return null;
      }

      const widgets = asStringArray(record.widgets)?.filter(isProviderOperationsWidgetId);
      const rollupWidgets = asStringArray(record.rollupWidgets)?.filter(
        isProviderOperationsWidgetId
      );

      if (!widgets || widgets.length === 0) {
        return null;
      }

      return {
        persona: record.persona,
        widgets,
        ...(rollupWidgets && rollupWidgets.length > 0 ? { rollupWidgets } : {})
      } satisfies ProviderOperationsPersonaWidgetMapping;
    })
    .filter((entry): entry is ProviderOperationsPersonaWidgetMapping => entry !== null);

  return {
    personaWidgetMappings:
      personaWidgetMappings.length > 0
        ? personaWidgetMappings
        : DEFAULT_PROVIDER_OPERATIONS_PERSONA_MAPPINGS
  } satisfies ProviderOperationsSourceSnapshot;
}

export function resolveProviderOperationsPersonaProfile(
  personaType: string,
  snapshot?: ProviderOperationsSourceSnapshot
) {
  const mappings = snapshot?.personaWidgetMappings ?? DEFAULT_PROVIDER_OPERATIONS_PERSONA_MAPPINGS;

  return (
    mappings.find((mapping) => mapping.persona === personaType) ?? {
      persona: personaType,
      widgets: ['scheduling', 'utilization'] as ProviderOperationsWidgetId[],
      rollupWidgets: [] as ProviderOperationsWidgetId[]
    }
  );
}

function canUseRollup(user: PortalSessionUser, snapshot: ProviderOperationsSourceSnapshot) {
  if (user.session.availableOrganizationUnits.length < 2) {
    return false;
  }

  const profile = resolveProviderOperationsPersonaProfile(
    user.session.personaType,
    snapshot
  );

  return (profile.rollupWidgets ?? []).length > 0;
}

function enforceProviderOperationsScope(user: PortalSessionUser) {
  if (user.landingContext !== 'provider') {
    throw new Error('Provider Operations data layer requires a provider session context.');
  }

  if (
    user.session.availableOrganizationUnits.length > 1 &&
    user.session.activeOrganizationUnit === null
  ) {
    throw new Error(
      'Provider Operations data layer requires an active Organization Unit when multiple assignments exist.'
    );
  }
}

export async function resolveProviderOperationsDashboardData(
  context: ProviderOperationsDataContext
): Promise<ProviderOperationsDashboardContract> {
  enforceProviderOperationsScope(context.user);

  const snapshot = resolvePersonaMappings(context.user.tenant.brandingConfig);
  const profile = resolveProviderOperationsPersonaProfile(
    context.user.session.personaType,
    snapshot
  );
  const rollupAuthorized = canUseRollup(context.user, snapshot);
  const dashboard = buildProviderOperationsDashboardModel({
    user: context.user,
    rollupAuthorized,
    now: context.now
  });

  const allowedWidgetIds = new Set(profile.widgets);

  return {
    ...dashboard,
    widgets: dashboard.widgets.filter((widget) => allowedWidgetIds.has(widget.id))
  };
}
