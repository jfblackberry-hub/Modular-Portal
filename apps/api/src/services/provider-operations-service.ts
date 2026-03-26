import type {
  ConnectorConfig,
  Prisma
} from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsScopedMetric,
  ProviderOperationsSourceContract,
  ProviderOperationsSourceType,
  ProviderOperationsWidgetContract,
  ProviderOperationsWidgetId
} from '@payer-portal/api-contracts';

import type { CurrentUser } from './current-user-service';

export const PROVIDER_OPERATIONS_SOURCE_ENTRY_KEYS = {
  GOOGLE_CLOUD_WAREHOUSE: 'google-cloud-provider-operations-warehouse',
  CLEARINGHOUSE_ENVIRONMENT: 'clearinghouse-provider-operations',
  CENTRAL_REACH: 'centralreach-provider-operations'
} as const;

const SOURCE_ENTRY_KEY_TO_TYPE: Record<string, ProviderOperationsSourceType> = {
  [PROVIDER_OPERATIONS_SOURCE_ENTRY_KEYS.GOOGLE_CLOUD_WAREHOUSE]:
    'google_cloud_warehouse',
  [PROVIDER_OPERATIONS_SOURCE_ENTRY_KEYS.CLEARINGHOUSE_ENVIRONMENT]:
    'clearinghouse_environment',
  [PROVIDER_OPERATIONS_SOURCE_ENTRY_KEYS.CENTRAL_REACH]: 'central_reach'
};

const DEFAULT_WIDGET_METADATA: Record<
  ProviderOperationsWidgetId,
  {
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
    rollupPersonas: string[];
  }
> = {
  scheduling: {
    title: 'Scheduling',
    description: 'Daily scheduling pressure, intake readiness, and front-desk flow.',
    href: '/provider/dashboard',
    ctaLabel: 'Review scheduling priorities',
    rollupPersonas: []
  },
  authorizations: {
    title: 'Authorizations',
    description: 'Clinical review and prior-authorization work queues.',
    href: '/provider/authorizations',
    ctaLabel: 'Open authorization work',
    rollupPersonas: []
  },
  claims: {
    title: 'Claims',
    description: 'Claims follow-up, adjudication exceptions, and aging risks.',
    href: '/provider/claims',
    ctaLabel: 'Open claims follow-up',
    rollupPersonas: ['clinic_manager', 'tenant_admin']
  },
  billing: {
    title: 'Billing',
    description: 'Payment posting, remittance exceptions, and reconciliation progress.',
    href: '/provider/payments',
    ctaLabel: 'Open billing and payments',
    rollupPersonas: ['clinic_manager', 'tenant_admin']
  },
  utilization: {
    title: 'Utilization',
    description: 'Throughput, queue balance, and operational efficiency signals.',
    href: '/provider/dashboard',
    ctaLabel: 'Review utilization signals',
    rollupPersonas: ['clinic_manager', 'tenant_admin']
  }
};

type ProviderOperationsSourceConnector = Pick<
  ConnectorConfig,
  'id' | 'tenantId' | 'name' | 'adapterKey' | 'config'
>;

function asRecord(value: Prisma.JsonValue | Prisma.InputJsonValue | unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function inferSourceType(config: Record<string, unknown>): ProviderOperationsSourceType | null {
  const explicitSourceType =
    typeof config.providerOperationsSourceType === 'string'
      ? config.providerOperationsSourceType
      : typeof asRecord(config.providerOperationsSource)?.sourceType === 'string'
        ? (asRecord(config.providerOperationsSource)?.sourceType as string)
        : null;

  if (
    explicitSourceType === 'google_cloud_warehouse' ||
    explicitSourceType === 'clearinghouse_environment' ||
    explicitSourceType === 'central_reach'
  ) {
    return explicitSourceType;
  }

  const catalog = asRecord(config.catalog);
  const entryKey = typeof catalog?.entryKey === 'string' ? catalog.entryKey : '';
  return SOURCE_ENTRY_KEY_TO_TYPE[entryKey] ?? null;
}

function isScopedMetricArray(value: unknown): value is ProviderOperationsScopedMetric[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        !Array.isArray(entry) &&
        (typeof (entry as Record<string, unknown>).organizationUnitId === 'string' ||
          (entry as Record<string, unknown>).organizationUnitId === null) &&
        typeof (entry as Record<string, unknown>).label === 'string' &&
        typeof (entry as Record<string, unknown>).summary === 'string' &&
        typeof (entry as Record<string, unknown>).detail === 'string' &&
        isStringArray((entry as Record<string, unknown>).highlights)
    )
  );
}

function parseProviderOperationsSourceContract(
  connector: ProviderOperationsSourceConnector
): ProviderOperationsSourceContract | null {
  const config = asRecord(connector.config);

  if (!config) {
    return null;
  }

  const sourceType = inferSourceType(config);
  const dataset = asRecord(config.providerOperationsDataset);

  if (!sourceType || !dataset) {
    return null;
  }

  const generatedAt =
    typeof dataset.generatedAt === 'string'
      ? dataset.generatedAt
      : new Date().toISOString();

  if (sourceType === 'google_cloud_warehouse') {
    return {
      sourceType,
      warehouseDataset:
        typeof dataset.warehouseDataset === 'string'
          ? dataset.warehouseDataset
          : 'provider_operations',
      generatedAt,
      tenantId: connector.tenantId,
      scheduling: isScopedMetricArray(dataset.scheduling) ? dataset.scheduling : [],
      utilization: isScopedMetricArray(dataset.utilization) ? dataset.utilization : []
    };
  }

  if (sourceType === 'clearinghouse_environment') {
    return {
      sourceType,
      environment:
        dataset.environment === 'production' ||
        dataset.environment === 'staging' ||
        dataset.environment === 'sandbox'
          ? dataset.environment
          : 'sandbox',
      generatedAt,
      tenantId: connector.tenantId,
      authorizations: isScopedMetricArray(dataset.authorizations)
        ? dataset.authorizations
        : [],
      claims: isScopedMetricArray(dataset.claims) ? dataset.claims : [],
      billing: isScopedMetricArray(dataset.billing) ? dataset.billing : []
    };
  }

  return {
    sourceType,
    generatedAt,
    tenantId: connector.tenantId,
    scheduling: isScopedMetricArray(dataset.scheduling) ? dataset.scheduling : [],
    utilization: isScopedMetricArray(dataset.utilization) ? dataset.utilization : []
  };
}

function collectWidgetMetrics(
  source: ProviderOperationsSourceContract,
  widgetId: ProviderOperationsWidgetId
) {
  if (source.sourceType === 'google_cloud_warehouse') {
    if (widgetId === 'scheduling') {
      return source.scheduling;
    }

    if (widgetId === 'utilization') {
      return source.utilization;
    }
  }

  if (source.sourceType === 'clearinghouse_environment') {
    if (widgetId === 'authorizations') {
      return source.authorizations;
    }

    if (widgetId === 'claims') {
      return source.claims;
    }

    if (widgetId === 'billing') {
      return source.billing;
    }
  }

  if (source.sourceType === 'central_reach') {
    if (widgetId === 'scheduling') {
      return source.scheduling;
    }

    if (widgetId === 'utilization') {
      return source.utilization;
    }
  }

  return [];
}

function resolveMetricForScope(input: {
  metrics: ProviderOperationsScopedMetric[];
  activeOrganizationUnitId: string | null;
  rollupAuthorized: boolean;
}) {
  if (input.metrics.length === 0) {
    return null;
  }

  if (input.rollupAuthorized) {
    const rollupMetrics = input.metrics.filter(
      (metric) => metric.organizationUnitId === null
    );

    if (rollupMetrics.length > 0) {
      return rollupMetrics[0] ?? null;
    }

    const highlights = input.metrics.flatMap((metric) => metric.highlights).slice(0, 4);

    return {
      organizationUnitId: null,
      label: input.metrics[0]?.label ?? 'Roll-up',
      summary: input.metrics[0]?.summary ?? '',
      detail: input.metrics.map((metric) => metric.detail).join(' '),
      highlights
    } satisfies ProviderOperationsScopedMetric;
  }

  const scopedMetric =
    input.metrics.find(
      (metric) => metric.organizationUnitId === input.activeOrganizationUnitId
    ) ??
    input.metrics.find((metric) => metric.organizationUnitId === null) ??
    input.metrics[0];

  return scopedMetric ?? null;
}

function buildWidgetContract(input: {
  currentUser: Pick<
    CurrentUser,
    'tenantId' | 'activeOrganizationUnitId' | 'activePersonaCode'
  > & { accessibleOrganizationUnitIds: string[] };
  widgetId: ProviderOperationsWidgetId;
  sources: ProviderOperationsSourceContract[];
}): ProviderOperationsWidgetContract | null {
  const metadata = DEFAULT_WIDGET_METADATA[input.widgetId];
  const rollupAuthorized = metadata.rollupPersonas.includes(
    input.currentUser.activePersonaCode ?? ''
  );

  const contributions = input.sources
    .map((source) => ({
      sourceType: source.sourceType,
      metric: resolveMetricForScope({
        metrics: collectWidgetMetrics(source, input.widgetId),
        activeOrganizationUnitId: input.currentUser.activeOrganizationUnitId ?? null,
        rollupAuthorized
      })
    }))
    .filter(
      (
        contribution
      ): contribution is { sourceType: ProviderOperationsSourceType; metric: ProviderOperationsScopedMetric } =>
        contribution.metric !== null
    );

  if (contributions.length === 0) {
    return null;
  }

  const primary = contributions[0];
  const additionalHighlights = contributions
    .slice(1)
    .flatMap((contribution) => contribution.metric.highlights);

  return {
    id: input.widgetId,
    title: metadata.title,
    description: metadata.description,
    summary: primary.metric.summary,
    detail: primary.metric.detail,
    highlights: [...primary.metric.highlights, ...additionalHighlights].slice(0, 5),
    tone: primary.metric.tone ?? 'default',
    href: metadata.href,
    ctaLabel: metadata.ctaLabel,
    scope: {
      mode: rollupAuthorized ? 'rollup' : 'organization_unit',
      tenantId: input.currentUser.tenantId,
      activeOrganizationUnitId: input.currentUser.activeOrganizationUnitId ?? null,
      accessibleOrganizationUnitIds: input.currentUser.accessibleOrganizationUnitIds,
      rollupAuthorized
    },
    sourceTypes: contributions.map((contribution) => contribution.sourceType)
  };
}

export async function listProviderOperationsSourceConnectorsForTenant(
  tenantId: string
) {
  const connectors = await prisma.connectorConfig.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return connectors.filter((connector) => {
    const config = asRecord(connector.config);
    return Boolean(config && inferSourceType(config));
  });
}

export function resolveProviderOperationsDashboardFromSourceConnectors(input: {
  currentUser: Pick<
    CurrentUser,
    'tenantId' | 'activeOrganizationUnitId' | 'activePersonaCode'
  > & { accessibleOrganizationUnitIds: string[] };
  connectors: ProviderOperationsSourceConnector[];
}): ProviderOperationsDashboardContract {
  const foreignConnector = input.connectors.find(
    (connector) => connector.tenantId !== input.currentUser.tenantId
  );

  if (foreignConnector) {
    throw new Error('Provider Operations connectors must stay within the authenticated tenant scope.');
  }

  const sources = input.connectors
    .map((connector) => parseProviderOperationsSourceContract(connector))
    .filter((source): source is ProviderOperationsSourceContract => source !== null);

  const widgets = (
    [
      'scheduling',
      'authorizations',
      'claims',
      'billing',
      'utilization'
    ] as ProviderOperationsWidgetId[]
  )
    .map((widgetId) =>
      buildWidgetContract({
        currentUser: input.currentUser,
        widgetId,
        sources
      })
    )
    .filter((widget): widget is ProviderOperationsWidgetContract => widget !== null);

  return {
    source: 'platform_provider_operations_data_layer',
    personaCode: input.currentUser.activePersonaCode ?? 'provider_user',
    tenantId: input.currentUser.tenantId,
    activeOrganizationUnitId: input.currentUser.activeOrganizationUnitId ?? null,
    widgets,
    generatedAt: new Date().toISOString()
  };
}
