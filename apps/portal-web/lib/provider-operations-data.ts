import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsWidgetContract,
  ProviderOperationsWidgetId,
  ProviderOperationsWidgetTone
} from '@payer-portal/api-contracts';

import type { ProviderPortalConfig } from '../config/providerPortalConfig';
import type { PortalSessionUser } from './portal-session';

type ProviderOperationsWidgetData = {
  summary: string;
  detail: string;
  highlights: string[];
  tone: ProviderOperationsWidgetTone;
  href?: string;
  ctaLabel?: string;
};

type ProviderOperationsPersonaWidgetMapping = {
  persona: string;
  widgets: ProviderOperationsWidgetId[];
  rollupWidgets?: ProviderOperationsWidgetId[];
};

type ProviderOperationsTenantConfig = {
  personaWidgetMappings?: ProviderOperationsPersonaWidgetMapping[];
  widgetData?: Partial<Record<ProviderOperationsWidgetId, Partial<ProviderOperationsWidgetData>>>;
};

type ProviderOperationsSourceSnapshot = {
  widgetData?: Partial<Record<ProviderOperationsWidgetId, Partial<ProviderOperationsWidgetData>>>;
  personaWidgetMappings?: ProviderOperationsPersonaWidgetMapping[];
};

type ProviderOperationsDataContext = {
  config: ProviderPortalConfig;
  user: PortalSessionUser;
};

type ProviderOperationsDataSource = {
  loadSnapshot: (
    context: ProviderOperationsDataContext
  ) => Promise<ProviderOperationsSourceSnapshot>;
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

const DEFAULT_WIDGET_DATA: Record<ProviderOperationsWidgetId, ProviderOperationsWidgetData> = {
  scheduling: {
    summary: '28 visits scheduled',
    detail: 'Front-desk and clinic scheduling activity for the active organization unit.',
    highlights: [
      '6 same-day appointment requests',
      '4 patients awaiting pre-visit verification',
      '2 provider templates need schedule adjustment'
    ],
    tone: 'info',
    href: '/provider/dashboard',
    ctaLabel: 'Review schedule priorities'
  },
  authorizations: {
    summary: '11 authorizations in flight',
    detail: 'Clinical review, attachments, and payer follow-up for current utilization work.',
    highlights: [
      '3 requests need clinical attachments today',
      '2 determinations expected before 3 PM',
      '1 denial needs appeal prep'
    ],
    tone: 'warning',
    href: '/provider/authorizations',
    ctaLabel: 'Open authorization work'
  },
  claims: {
    summary: '19 claims require follow-up',
    detail: 'Claims aging and adjudication exceptions for the current operations queue.',
    highlights: [
      '5 claims approach timely filing thresholds',
      '3 claims await corrected billing edits',
      '2 ERA adjustments need reconciliation'
    ],
    tone: 'danger',
    href: '/provider/claims',
    ctaLabel: 'Open claims follow-up'
  },
  billing: {
    summary: '$84,220 posted today',
    detail: 'Billing and payment performance across current remittance and reconciliation activity.',
    highlights: [
      '8 remits posted in the last cycle',
      '2 EFT batches pending reconciliation',
      '1 payment exception requires support escalation'
    ],
    tone: 'success',
    href: '/provider/payments',
    ctaLabel: 'Open billing and payments'
  },
  utilization: {
    summary: '87% utilization target attainment',
    detail: 'Operational throughput, queue balance, and exception rates for provider operations.',
    highlights: [
      'Eligibility response time trending 8% faster',
      'Authorization backlog stable vs yesterday',
      'Claims closure rate improved across the current queue'
    ],
    tone: 'default',
    href: '/provider/dashboard',
    ctaLabel: 'Review utilization signals'
  }
};

const WIDGET_LABELS: Record<
  ProviderOperationsWidgetId,
  { title: string; description: string; supportsRollup: boolean }
> = {
  scheduling: {
    title: 'Scheduling',
    description: 'Daily scheduling pressure, intake readiness, and front-desk flow.',
    supportsRollup: false
  },
  authorizations: {
    title: 'Authorizations',
    description: 'Clinical review and prior-authorization work queues.',
    supportsRollup: false
  },
  claims: {
    title: 'Claims',
    description: 'Claims follow-up, adjudication exceptions, and aging risks.',
    supportsRollup: true
  },
  billing: {
    title: 'Billing',
    description: 'Payment posting, remittance exceptions, and reconciliation progress.',
    supportsRollup: true
  },
  utilization: {
    title: 'Utilization',
    description: 'Throughput, queue balance, and operational efficiency signals.',
    supportsRollup: true
  }
};

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

function readProviderOperationsTenantConfig(
  brandingConfig?: Record<string, unknown>
): ProviderOperationsTenantConfig {
  const providerDemoData = asRecord(brandingConfig?.providerDemoData);
  const providerOperations = asRecord(providerDemoData?.providerOperations);

  if (!providerOperations) {
    return {};
  }

  const rawMappings = Array.isArray(providerOperations.personaWidgetMappings)
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

  const rawWidgetData = asRecord(providerOperations.widgetData);
  const widgetData = rawWidgetData
    ? Object.fromEntries(
        Object.entries(rawWidgetData)
          .filter(([key]) => isProviderOperationsWidgetId(key))
          .map(([key, value]) => [key, asRecord(value) ?? {}])
      )
    : undefined;

  return {
    ...(personaWidgetMappings.length > 0 ? { personaWidgetMappings } : {}),
    ...(widgetData ? { widgetData } : {})
  };
}

function createTenantConfigDataSource(): ProviderOperationsDataSource {
  return {
    async loadSnapshot({ user }) {
      const tenantConfig = readProviderOperationsTenantConfig(user.tenant.brandingConfig);

      return {
        widgetData: tenantConfig.widgetData,
        personaWidgetMappings: tenantConfig.personaWidgetMappings
      };
    }
  };
}

function resolvePersonaMappings(
  snapshot: ProviderOperationsSourceSnapshot
) {
  return snapshot.personaWidgetMappings ?? DEFAULT_PROVIDER_OPERATIONS_PERSONA_MAPPINGS;
}

export function resolveProviderOperationsPersonaProfile(
  personaType: string,
  snapshot?: ProviderOperationsSourceSnapshot
) {
  const mappings = resolvePersonaMappings(snapshot ?? {});

  return (
    mappings.find((mapping) => mapping.persona === personaType) ?? {
      persona: personaType,
      widgets: ['scheduling', 'utilization'] as ProviderOperationsWidgetId[],
      rollupWidgets: [] as ProviderOperationsWidgetId[]
    }
  );
}

function resolveWidgetData(
  widgetId: ProviderOperationsWidgetId,
  snapshot: ProviderOperationsSourceSnapshot
) {
  const widgetData = snapshot.widgetData?.[widgetId] ?? {};

  return {
    ...DEFAULT_WIDGET_DATA[widgetId],
    ...(typeof widgetData.summary === 'string' ? { summary: widgetData.summary } : {}),
    ...(typeof widgetData.detail === 'string' ? { detail: widgetData.detail } : {}),
    ...(Array.isArray(widgetData.highlights)
      ? {
          highlights: widgetData.highlights.filter(
            (entry): entry is string => typeof entry === 'string'
          )
        }
      : {}),
    ...(typeof widgetData.tone === 'string'
      ? { tone: widgetData.tone as ProviderOperationsWidgetTone }
      : {}),
    ...(typeof widgetData.href === 'string' ? { href: widgetData.href } : {}),
    ...(typeof widgetData.ctaLabel === 'string'
      ? { ctaLabel: widgetData.ctaLabel }
      : {})
  } satisfies ProviderOperationsWidgetData;
}

function canUseRollup(
  widgetId: ProviderOperationsWidgetId,
  user: PortalSessionUser,
  snapshot: ProviderOperationsSourceSnapshot
) {
  if (user.session.availableOrganizationUnits.length < 2) {
    return false;
  }

  const widgetMeta = WIDGET_LABELS[widgetId];
  if (!widgetMeta.supportsRollup) {
    return false;
  }

  const profile = resolveProviderOperationsPersonaProfile(
    user.session.personaType,
    snapshot
  );

  return (profile.rollupWidgets ?? []).includes(widgetId);
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

  const dataSource = createTenantConfigDataSource();
  const snapshot = await dataSource.loadSnapshot(context);
  const personaProfile = resolveProviderOperationsPersonaProfile(
    context.user.session.personaType,
    snapshot
  );

  const widgets = personaProfile.widgets.map((widgetId) => {
    const widgetMeta = WIDGET_LABELS[widgetId];
    const rollupAuthorized = canUseRollup(widgetId, context.user, snapshot);

    return {
      id: widgetId,
      title: widgetMeta.title,
      description: widgetMeta.description,
      ...resolveWidgetData(widgetId, snapshot),
      scope: {
        mode: rollupAuthorized ? 'rollup' : 'organization_unit',
        tenantId: context.user.tenant.id,
        activeOrganizationUnitId: context.user.session.activeOrganizationUnit?.id ?? null,
        accessibleOrganizationUnitIds: context.user.session.availableOrganizationUnits.map(
          (organizationUnit) => organizationUnit.id
        ),
        rollupAuthorized
      },
      sourceTypes: []
    } satisfies ProviderOperationsWidgetContract;
  });

  return {
    source: 'platform_provider_operations_data_layer',
    personaCode: context.user.session.personaType,
    tenantId: context.user.tenant.id,
    activeOrganizationUnitId: context.user.session.activeOrganizationUnit?.id ?? null,
    widgets,
    generatedAt: new Date().toISOString()
  };
}
