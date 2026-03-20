import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { getHealthStatus } from './health-service';

type BrandingConfigRecord = Record<string, unknown>;

const DEFAULT_PRIMARY_COLOR = '#38bdf8';
const DEFAULT_SECONDARY_COLOR = '#ffffff';
const alertKeywords = ['fail', 'error', 'warning', 'warn', 'denied', 'timeout'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readBrandingConfig(brandingConfig: Prisma.JsonValue): BrandingConfigRecord {
  return isRecord(brandingConfig) ? (brandingConfig as BrandingConfigRecord) : {};
}

function readNotificationSettings(brandingConfig: BrandingConfigRecord) {
  const candidate = brandingConfig.notificationSettings;
  return isRecord(candidate) ? candidate : {};
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getConfigurationCompleteness(input: {
  name: string;
  brandingDisplayName: string | null;
  brandingPrimaryColor: string | null;
  brandingSecondaryColor: string | null;
  brandingConfig: BrandingConfigRecord;
  connectorCount: number;
}) {
  const notificationSettings = readNotificationSettings(input.brandingConfig);

  const checks = [
    Boolean((input.brandingDisplayName ?? input.name).trim()),
    Boolean((input.brandingPrimaryColor ?? DEFAULT_PRIMARY_COLOR).trim()),
    Boolean(readString(notificationSettings.replyToEmail).trim()),
    readBoolean(notificationSettings.emailEnabled, true) ||
      readBoolean(notificationSettings.inAppEnabled, true) ||
      readBoolean(notificationSettings.digestEnabled, false),
    input.connectorCount > 0
  ];

  return `${Math.round((checks.filter(Boolean).length / checks.length) * 100)}%`;
}

function getConnectivityLabel(statuses: string[]) {
  if (statuses.length === 0) {
    return 'Not configured';
  }

  const activeCount = statuses.filter((status) => status.toUpperCase() === 'ACTIVE').length;

  if (activeCount === statuses.length) {
    return 'Healthy';
  }

  if (activeCount > 0) {
    return 'Warning';
  }

  return 'Critical';
}

function getStatusAlertCount(status: string) {
  if (status === 'ACTIVE') {
    return 0;
  }

  return status === 'ONBOARDING' ? 1 : 2;
}

function getEndpointLabel(config: Prisma.JsonValue) {
  const record = isRecord(config) ? config : {};
  const baseUrl = readString(record.baseUrl).trim();
  const endpointPath = readString(record.endpointPath).trim();
  const endpointUrl = readString(record.endpoint_url).trim();
  const path = readString(record.path).trim();
  const directoryPath = readString(record.directoryPath).trim();

  if (endpointUrl) {
    return endpointUrl;
  }

  if (baseUrl || endpointPath) {
    return `${baseUrl}${endpointPath}`;
  }

  if (baseUrl || path) {
    return `${baseUrl}${path}`;
  }

  if (directoryPath) {
    return directoryPath;
  }

  return 'Config stored on connector';
}

function getMappingLabel(config: Prisma.JsonValue) {
  const record = isRecord(config) ? config : {};
  const mappingEntries = Object.entries(record).filter(([key]) =>
    ['mapping', 'map', 'transform', 'resource', 'code'].some((token) =>
      key.toLowerCase().includes(token)
    )
  );

  if (mappingEntries.length === 0) {
    return 'No explicit mapping metadata';
  }

  const [key, value] = mappingEntries[0];

  if (typeof value === 'string' && value.trim()) {
    return `${key}: ${value.trim()}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${key}: ${String(value)}`;
  }

  return `${key}: configured`;
}

function getCatalogMetadata(config: Prisma.JsonValue) {
  const record = isRecord(config) ? config : {};
  const catalog = isRecord(record.catalog) ? record.catalog : null;

  if (!catalog) {
    return null;
  }

  const entryKey = readString(catalog.entryKey).trim();
  if (!entryKey) {
    return null;
  }

  return {
    entryKey,
    label: readString(catalog.label).trim() || entryKey,
    vendor: readString(catalog.vendor).trim() || 'Unknown',
    category: readString(catalog.category).trim() || 'Unclassified'
  };
}

export async function getPlatformHealthOverview() {
  const [healthResult, tenants, users, auditLogs] = await Promise.all([
    getHealthStatus(),
    prisma.tenant.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.auditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 12
    })
  ]);

  return {
    health: healthResult.response,
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      healthStatus:
        tenant.status === 'ACTIVE'
          ? 'HEALTHY'
          : tenant.status === 'ONBOARDING'
            ? 'PROVISIONING'
            : 'SUSPENDED',
      brandingConfig: tenant.brandingConfig,
      quotaMembers:
        isRecord(tenant.brandingConfig) &&
        isRecord((tenant.brandingConfig as BrandingConfigRecord).platformQuota) &&
        typeof ((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).members === 'number'
          ? (((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).members as number)
          : null,
      quotaUsers:
        isRecord(tenant.brandingConfig) &&
        isRecord((tenant.brandingConfig as BrandingConfigRecord).platformQuota) &&
        typeof ((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).users === 'number'
          ? (((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).users as number)
          : null,
      quotaStorageGb:
        isRecord(tenant.brandingConfig) &&
        isRecord((tenant.brandingConfig as BrandingConfigRecord).platformQuota) &&
        typeof ((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).storageGb === 'number'
          ? (((tenant.brandingConfig as BrandingConfigRecord).platformQuota as Record<string, unknown>).storageGb as number)
          : null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    })),
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name
      }
    })),
    auditEvents: {
      items: auditLogs.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.actorUserId,
        eventType: item.action,
        resourceType: item.entityType,
        resourceId: item.entityId,
        metadata: item.metadata,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        timestamp: item.createdAt
      }))
    }
  };
}

export async function listPlatformTenantSummaries() {
  const [tenants, activeUserCounts, connectors, auditAlertCounts] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        branding: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.groupBy({
      by: ['tenantId'],
      where: {
        isActive: true
      },
      _count: {
        _all: true
      }
    }),
    prisma.connectorConfig.findMany({
      select: {
        id: true,
        tenantId: true,
        status: true
      }
    }),
    prisma.auditLog.groupBy({
      by: ['tenantId'],
      where: {
        OR: alertKeywords.map((keyword) => ({
          action: {
            contains: keyword,
            mode: 'insensitive'
          }
        }))
      },
      _count: {
        _all: true
      }
    })
  ]);

  const activeUserCountByTenant = new Map(
    activeUserCounts.map((row) => [row.tenantId, row._count._all])
  );
  const connectorsByTenant = new Map<string, Array<{ status: string }>>();
  for (const connector of connectors) {
    const existing = connectorsByTenant.get(connector.tenantId);
    if (existing) {
      existing.push({ status: connector.status });
    } else {
      connectorsByTenant.set(connector.tenantId, [{ status: connector.status }]);
    }
  }
  const auditAlertCountByTenant = new Map(
    auditAlertCounts.map((row) => [row.tenantId, row._count._all])
  );

  return tenants.map((tenant) => {
    const connectorRows = connectorsByTenant.get(tenant.id) ?? [];
    const brandingConfig = readBrandingConfig(tenant.brandingConfig);
    const connectorStatuses = connectorRows.map((connector) => connector.status);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        healthStatus:
          tenant.status === 'ACTIVE'
            ? 'HEALTHY'
            : tenant.status === 'ONBOARDING'
              ? 'PROVISIONING'
              : 'SUSPENDED',
        brandingConfig: tenant.brandingConfig,
        quotaMembers:
          isRecord(brandingConfig.platformQuota) &&
          typeof (brandingConfig.platformQuota as Record<string, unknown>).members === 'number'
            ? ((brandingConfig.platformQuota as Record<string, unknown>).members as number)
            : null,
        quotaUsers:
          isRecord(brandingConfig.platformQuota) &&
          typeof (brandingConfig.platformQuota as Record<string, unknown>).users === 'number'
            ? ((brandingConfig.platformQuota as Record<string, unknown>).users as number)
            : null,
        quotaStorageGb:
          isRecord(brandingConfig.platformQuota) &&
          typeof (brandingConfig.platformQuota as Record<string, unknown>).storageGb === 'number'
            ? ((brandingConfig.platformQuota as Record<string, unknown>).storageGb as number)
            : null,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      },
      users: activeUserCountByTenant.get(tenant.id) ?? 0,
      connectivity: getConnectivityLabel(connectorStatuses),
      configuration: getConfigurationCompleteness({
        name: tenant.name,
        brandingDisplayName: tenant.branding?.displayName ?? tenant.name,
        brandingPrimaryColor: tenant.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        brandingSecondaryColor: tenant.branding?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
        brandingConfig,
        connectorCount: connectorRows.length
      }),
      alerts:
        (auditAlertCountByTenant.get(tenant.id) ?? 0) +
        connectorRows.filter((connector) => connector.status.toUpperCase() !== 'ACTIVE').length +
        getStatusAlertCount(tenant.status)
    };
  });
}

export async function getPlatformAdapterInventory() {
  const [tenants, connectors] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.connectorConfig.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ tenantId: 'asc' }, { createdAt: 'desc' }]
    })
  ]);

  return {
    tenants,
    rows: connectors.map((connector) => {
      const catalog = getCatalogMetadata(connector.config);
      return {
        id: connector.id,
        tenantId: connector.tenantId,
        tenantName: connector.tenant.name,
        name: connector.name,
        adapterKey: connector.adapterKey,
        status: connector.status,
        catalogEntryKey: catalog?.entryKey ?? null,
        catalogLabel: catalog?.label ?? null,
        catalogVendor: catalog?.vendor ?? null,
        catalogCategory: catalog?.category ?? null,
        endpoint: getEndpointLabel(connector.config),
        mapping: getMappingLabel(connector.config),
        lastSyncAt: connector.lastSyncAt ?? connector.lastHealthCheckAt
      };
    })
  };
}

export async function getPlatformConnectivityStatusRows() {
  const [healthResult, connectors, auditLogs] = await Promise.all([
    getHealthStatus(),
    prisma.connectorConfig.findMany({
      select: {
        id: true,
        adapterKey: true,
        name: true,
        status: true,
        lastSyncAt: true,
        lastHealthCheckAt: true
      }
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [{ entityType: 'connector' }, { entityType: 'Connector' }]
      },
      select: {
        entityId: true,
        action: true,
        createdAt: true
      }
    })
  ]);

  const families = [
    {
      label: 'EDI',
      filter: (connector: (typeof connectors)[number]) => {
        const name = `${connector.adapterKey} ${connector.name}`.toLowerCase();
        return (
          name.includes('local-file') ||
          name.includes('edi') ||
          name.includes('eligibility') ||
          name.includes('claims')
        );
      }
    },
    {
      label: 'API Gateway',
      filter: (connector: (typeof connectors)[number]) =>
        connector.adapterKey.toLowerCase().includes('rest-api')
    },
    {
      label: 'Event Bus',
      filter: (connector: (typeof connectors)[number]) =>
        connector.adapterKey.toLowerCase().includes('webhook')
    },
    {
      label: 'External Vendor APIs',
      filter: (connector: (typeof connectors)[number]) => {
        const name = `${connector.adapterKey} ${connector.name}`.toLowerCase();
        return name.includes('rest-api') || name.includes('api');
      }
    }
  ];

  function toStatusLabel(status: string) {
    const normalized = status.toLowerCase();

    if (normalized === 'active' || normalized === 'pass' || normalized === 'ok') {
      return 'Healthy';
    }

    if (normalized === 'not_configured') {
      return 'Not Configured';
    }

    if (normalized === 'disabled' || normalized === 'warning' || normalized === 'degraded') {
      return 'Warning';
    }

    return 'Critical';
  }

  function getWorstStatus(statuses: string[]) {
    if (statuses.includes('Critical')) {
      return 'Critical';
    }

    if (statuses.includes('Warning')) {
      return 'Warning';
    }

    if (statuses.includes('Healthy')) {
      return 'Healthy';
    }

    return 'Not Configured';
  }

  function getLatest(values: Array<Date | null>) {
    const filtered = values.filter((value): value is Date => Boolean(value));

    if (filtered.length === 0) {
      return null;
    }

    return [...filtered].sort((left, right) => right.getTime() - left.getTime())[0];
  }

  const rows = families.map((family) => {
    const familyConnectors = connectors.filter(family.filter);
    const familyConnectorIds = new Set(familyConnectors.map((connector) => connector.id));
    const failures = auditLogs.filter(
      (event) =>
        event.entityId &&
        familyConnectorIds.has(event.entityId) &&
        alertKeywords.some((keyword) => event.action.toLowerCase().includes(keyword))
    );

    return {
      connection: family.label,
      scope: 'Platform',
      status: familyConnectors.length
        ? getWorstStatus(familyConnectors.map((connector) => toStatusLabel(connector.status)))
        : 'Not Configured',
      lastSuccess: getLatest(
        familyConnectors.map((connector) => connector.lastSyncAt ?? connector.lastHealthCheckAt)
      )?.toISOString() ?? null,
      lastFailure: failures[0]?.createdAt.toISOString() ?? null,
      errorCount: failures.length
    };
  });

  return {
    health: healthResult.response,
    rows
  };
}
