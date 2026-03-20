import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { createConnectorForTenant } from './connector-service';

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

type FieldKind = 'text' | 'url' | 'path' | 'number' | 'secret' | 'select';

type CatalogField = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  helpText?: string;
  defaultValue?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
};

type ApiCatalogDefinition = {
  key: string;
  label: string;
  vendor: string;
  category: string;
  adapterKey: 'rest-api' | 'webhook';
  description: string;
  endpointLabel: string;
  mappingLabel: string;
  defaultName: string;
  fields: CatalogField[];
  buildConfig: (input: Record<string, string>) => Prisma.InputJsonValue;
};

type ApplyCatalogApiInput = {
  catalogEntryKey: string;
  tenantId: string;
  name?: string;
  status?: string;
  fieldValues: Record<string, string>;
};

function trimValue(value: string | undefined) {
  return value?.trim() ?? '';
}

function requireField(input: Record<string, string>, key: string, label: string) {
  const value = trimValue(input[key]);
  if (!value) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function optionalField(input: Record<string, string>, key: string) {
  const value = trimValue(input[key]);
  return value || undefined;
}

function buildAuthentication(input: Record<string, string>) {
  const type = trimValue(input.authenticationType || input.authType || 'none').toLowerCase();

  if (type === 'bearer') {
    return {
      type: 'bearer',
      token: requireField(input, 'authToken', 'Bearer token')
    };
  }

  if (type === 'apikey' || type === 'apiKey'.toLowerCase()) {
    return {
      type: 'apiKey',
      headerName: requireField(input, 'apiKeyHeaderName', 'API key header name'),
      value: requireField(input, 'apiKeyValue', 'API key value')
    };
  }

  if (type === 'basic') {
    return {
      type: 'basic',
      username: requireField(input, 'basicUsername', 'Basic auth username'),
      password: requireField(input, 'basicPassword', 'Basic auth password')
    };
  }

  return {
    type: 'none'
  };
}

const apiCatalogDefinitions: ApiCatalogDefinition[] = [
  {
    key: 'epic-fhir',
    label: 'Epic FHIR',
    vendor: 'Epic',
    category: 'Clinical API',
    adapterKey: 'rest-api',
    description:
      'FHIR-based tenant connector template for Epic interoperability endpoints.',
    endpointLabel: 'FHIR R4 endpoint',
    mappingLabel: 'FHIR R4 resources',
    defaultName: 'Epic FHIR API',
    fields: [
      { key: 'baseUrl', label: 'Base URL', kind: 'url', required: true, helpText: 'Epic tenant or sandbox base URL.' },
      { key: 'endpointPath', label: 'Endpoint Path', kind: 'path', required: true, defaultValue: '/fhir/R4/Patient' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        defaultValue: 'GET',
        options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]
      },
      {
        key: 'authenticationType',
        label: 'Authentication',
        kind: 'select',
        defaultValue: 'bearer',
        options: [
          { label: 'Bearer token', value: 'bearer' },
          { label: 'API key', value: 'apiKey' },
          { label: 'Basic auth', value: 'basic' },
          { label: 'None', value: 'none' }
        ]
      },
      { key: 'authToken', label: 'Bearer Token', kind: 'secret' },
      { key: 'apiKeyHeaderName', label: 'API Key Header', kind: 'text', defaultValue: 'x-api-key' },
      { key: 'apiKeyValue', label: 'API Key', kind: 'secret' },
      { key: 'basicUsername', label: 'Basic Username', kind: 'text' },
      { key: 'basicPassword', label: 'Basic Password', kind: 'secret' },
      { key: 'mappingKey', label: 'Mapping Key', kind: 'text', defaultValue: 'fhir-r4-patient' }
    ],
    buildConfig(input) {
      return {
        baseUrl: requireField(input, 'baseUrl', 'Base URL'),
        endpointPath: requireField(input, 'endpointPath', 'Endpoint Path'),
        method: trimValue(input.method || 'GET').toUpperCase(),
        authentication: buildAuthentication(input),
        catalog: {
          entryKey: 'epic-fhir',
          label: 'Epic FHIR',
          vendor: 'Epic',
          category: 'Clinical API'
        },
        mappingKey: optionalField(input, 'mappingKey') ?? 'fhir-r4-patient'
      };
    }
  },
  {
    key: 'athenahealth-claims',
    label: 'athenahealth Claims',
    vendor: 'athenahealth',
    category: 'Claims API',
    adapterKey: 'rest-api',
    description:
      'Claims retrieval template for athenahealth practice management APIs.',
    endpointLabel: 'Claims endpoint',
    mappingLabel: 'Claim status payload',
    defaultName: 'athenahealth Claims API',
    fields: [
      { key: 'baseUrl', label: 'Base URL', kind: 'url', required: true },
      { key: 'endpointPath', label: 'Endpoint Path', kind: 'path', required: true, defaultValue: '/claims/v1/claims' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        defaultValue: 'GET',
        options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]
      },
      {
        key: 'authenticationType',
        label: 'Authentication',
        kind: 'select',
        defaultValue: 'bearer',
        options: [
          { label: 'Bearer token', value: 'bearer' },
          { label: 'API key', value: 'apiKey' },
          { label: 'Basic auth', value: 'basic' }
        ]
      },
      { key: 'authToken', label: 'Bearer Token', kind: 'secret' },
      { key: 'apiKeyHeaderName', label: 'API Key Header', kind: 'text', defaultValue: 'x-api-key' },
      { key: 'apiKeyValue', label: 'API Key', kind: 'secret' },
      { key: 'basicUsername', label: 'Basic Username', kind: 'text' },
      { key: 'basicPassword', label: 'Basic Password', kind: 'secret' },
      { key: 'mappingKey', label: 'Mapping Key', kind: 'text', defaultValue: 'athenahealth-claims' }
    ],
    buildConfig(input) {
      return {
        baseUrl: requireField(input, 'baseUrl', 'Base URL'),
        endpointPath: requireField(input, 'endpointPath', 'Endpoint Path'),
        method: trimValue(input.method || 'GET').toUpperCase(),
        authentication: buildAuthentication(input),
        catalog: {
          entryKey: 'athenahealth-claims',
          label: 'athenahealth Claims',
          vendor: 'athenahealth',
          category: 'Claims API'
        },
        mappingKey: optionalField(input, 'mappingKey') ?? 'athenahealth-claims'
      };
    }
  },
  {
    key: 'availity-eligibility',
    label: 'Availity Eligibility',
    vendor: 'Availity',
    category: 'Eligibility API',
    adapterKey: 'rest-api',
    description:
      'Eligibility verification template for Availity-based payer/provider exchanges.',
    endpointLabel: 'Eligibility endpoint',
    mappingLabel: 'Eligibility response',
    defaultName: 'Availity Eligibility API',
    fields: [
      { key: 'baseUrl', label: 'Base URL', kind: 'url', required: true },
      { key: 'endpointPath', label: 'Endpoint Path', kind: 'path', required: true, defaultValue: '/api/eligibility/v1/coverages' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        defaultValue: 'GET',
        options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]
      },
      {
        key: 'authenticationType',
        label: 'Authentication',
        kind: 'select',
        defaultValue: 'apiKey',
        options: [
          { label: 'API key', value: 'apiKey' },
          { label: 'Bearer token', value: 'bearer' },
          { label: 'Basic auth', value: 'basic' }
        ]
      },
      { key: 'authToken', label: 'Bearer Token', kind: 'secret' },
      { key: 'apiKeyHeaderName', label: 'API Key Header', kind: 'text', defaultValue: 'x-api-key' },
      { key: 'apiKeyValue', label: 'API Key', kind: 'secret' },
      { key: 'basicUsername', label: 'Basic Username', kind: 'text' },
      { key: 'basicPassword', label: 'Basic Password', kind: 'secret' },
      { key: 'mappingKey', label: 'Mapping Key', kind: 'text', defaultValue: 'availity-eligibility' }
    ],
    buildConfig(input) {
      return {
        baseUrl: requireField(input, 'baseUrl', 'Base URL'),
        endpointPath: requireField(input, 'endpointPath', 'Endpoint Path'),
        method: trimValue(input.method || 'GET').toUpperCase(),
        authentication: buildAuthentication(input),
        catalog: {
          entryKey: 'availity-eligibility',
          label: 'Availity Eligibility',
          vendor: 'Availity',
          category: 'Eligibility API'
        },
        mappingKey: optionalField(input, 'mappingKey') ?? 'availity-eligibility'
      };
    }
  },
  {
    key: 'workday-hris',
    label: 'Workday Worker API',
    vendor: 'Workday',
    category: 'HRIS API',
    adapterKey: 'rest-api',
    description:
      'Workforce and eligibility feed template for Workday-backed tenant onboarding.',
    endpointLabel: 'Worker endpoint',
    mappingLabel: 'Employee census feed',
    defaultName: 'Workday Worker API',
    fields: [
      { key: 'baseUrl', label: 'Base URL', kind: 'url', required: true },
      { key: 'endpointPath', label: 'Endpoint Path', kind: 'path', required: true, defaultValue: '/api/workers/v1/workers' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        defaultValue: 'GET',
        options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]
      },
      {
        key: 'authenticationType',
        label: 'Authentication',
        kind: 'select',
        defaultValue: 'basic',
        options: [
          { label: 'Basic auth', value: 'basic' },
          { label: 'Bearer token', value: 'bearer' },
          { label: 'API key', value: 'apiKey' }
        ]
      },
      { key: 'authToken', label: 'Bearer Token', kind: 'secret' },
      { key: 'apiKeyHeaderName', label: 'API Key Header', kind: 'text', defaultValue: 'x-api-key' },
      { key: 'apiKeyValue', label: 'API Key', kind: 'secret' },
      { key: 'basicUsername', label: 'Basic Username', kind: 'text' },
      { key: 'basicPassword', label: 'Basic Password', kind: 'secret' },
      { key: 'mappingKey', label: 'Mapping Key', kind: 'text', defaultValue: 'workday-worker' }
    ],
    buildConfig(input) {
      return {
        baseUrl: requireField(input, 'baseUrl', 'Base URL'),
        endpointPath: requireField(input, 'endpointPath', 'Endpoint Path'),
        method: trimValue(input.method || 'GET').toUpperCase(),
        authentication: buildAuthentication(input),
        catalog: {
          entryKey: 'workday-hris',
          label: 'Workday Worker API',
          vendor: 'Workday',
          category: 'HRIS API'
        },
        mappingKey: optionalField(input, 'mappingKey') ?? 'workday-worker'
      };
    }
  },
  {
    key: 'broker-events-webhook',
    label: 'Broker Events Webhook',
    vendor: 'Generic',
    category: 'Event API',
    adapterKey: 'webhook',
    description:
      'Outbound webhook template for broker-facing event delivery and downstream automation.',
    endpointLabel: 'Webhook endpoint',
    mappingLabel: 'Tenant event payload',
    defaultName: 'Broker Events Webhook',
    fields: [
      { key: 'endpointUrl', label: 'Endpoint URL', kind: 'url', required: true },
      { key: 'eventTypes', label: 'Event Types', kind: 'text', required: true, defaultValue: 'quote.created,enrollment.updated' },
      { key: 'timeout', label: 'Timeout (ms)', kind: 'number', defaultValue: '5000' },
      {
        key: 'authenticationType',
        label: 'Authentication',
        kind: 'select',
        defaultValue: 'bearer',
        options: [
          { label: 'Bearer token', value: 'bearer' },
          { label: 'API key', value: 'apiKey' },
          { label: 'Basic auth', value: 'basic' },
          { label: 'None', value: 'none' }
        ]
      },
      { key: 'authToken', label: 'Bearer Token', kind: 'secret' },
      { key: 'apiKeyHeaderName', label: 'API Key Header', kind: 'text', defaultValue: 'x-api-key' },
      { key: 'apiKeyValue', label: 'API Key', kind: 'secret' },
      { key: 'basicUsername', label: 'Basic Username', kind: 'text' },
      { key: 'basicPassword', label: 'Basic Password', kind: 'secret' }
    ],
    buildConfig(input) {
      return {
        endpoint_url: requireField(input, 'endpointUrl', 'Endpoint URL'),
        event_types: requireField(input, 'eventTypes', 'Event Types')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        timeout: Number.parseInt(trimValue(input.timeout || '5000'), 10) || 5000,
        authentication: buildAuthentication(input),
        catalog: {
          entryKey: 'broker-events-webhook',
          label: 'Broker Events Webhook',
          vendor: 'Generic',
          category: 'Event API'
        }
      };
    }
  }
];

function getCatalogDefinition(catalogEntryKey: string) {
  const definition = apiCatalogDefinitions.find((entry) => entry.key === catalogEntryKey);
  if (!definition) {
    throw new Error('Catalog entry not found');
  }
  return definition;
}

function readCatalogMetadata(config: Prisma.JsonValue) {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return null;
  }

  const record = config as Record<string, unknown>;
  if (
    typeof record.catalog !== 'object' ||
    record.catalog === null ||
    Array.isArray(record.catalog)
  ) {
    return null;
  }

  const catalog = record.catalog as Record<string, unknown>;
  const entryKey = typeof catalog.entryKey === 'string' ? catalog.entryKey.trim() : '';
  if (!entryKey) {
    return null;
  }

  return {
    entryKey,
    label: typeof catalog.label === 'string' ? catalog.label : entryKey,
    vendor: typeof catalog.vendor === 'string' ? catalog.vendor : 'Unknown',
    category: typeof catalog.category === 'string' ? catalog.category : 'Unclassified'
  };
}

export async function listApiCatalogEntries() {
  const connectors = await prisma.connectorConfig.findMany({
    select: {
      tenantId: true,
      config: true
    }
  });

  const usageByEntry = new Map<string, { connectorCount: number; tenantIds: Set<string> }>();

  for (const connector of connectors) {
    const metadata = readCatalogMetadata(connector.config);
    if (!metadata) {
      continue;
    }

    const current = usageByEntry.get(metadata.entryKey) ?? {
      connectorCount: 0,
      tenantIds: new Set<string>()
    };
    current.connectorCount += 1;
    current.tenantIds.add(connector.tenantId);
    usageByEntry.set(metadata.entryKey, current);
  }

  return apiCatalogDefinitions.map((entry) => {
    const usage = usageByEntry.get(entry.key);
    return {
      key: entry.key,
      label: entry.label,
      vendor: entry.vendor,
      category: entry.category,
      adapterKey: entry.adapterKey,
      description: entry.description,
      endpointLabel: entry.endpointLabel,
      mappingLabel: entry.mappingLabel,
      defaultName: entry.defaultName,
      fields: entry.fields,
      usage: {
        connectorCount: usage?.connectorCount ?? 0,
        tenantCount: usage?.tenantIds.size ?? 0
      }
    };
  });
}

export async function applyCatalogEntryToTenant(
  input: ApplyCatalogApiInput,
  context: AuditContext
) {
  const definition = getCatalogDefinition(input.catalogEntryKey);
  const connectorName = trimValue(input.name) || definition.defaultName;
  const status = trimValue(input.status).toUpperCase() || 'ACTIVE';
  const config = definition.buildConfig(input.fieldValues);

  const connector = await createConnectorForTenant(
    input.tenantId,
    {
      adapterKey: definition.adapterKey,
      name: connectorName,
      status,
      config
    },
    context
  );

  return {
    ...connector,
    catalog: {
      entryKey: definition.key,
      label: definition.label,
      vendor: definition.vendor,
      category: definition.category
    }
  };
}
