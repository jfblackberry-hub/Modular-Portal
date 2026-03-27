import { randomUUID } from 'node:crypto';

import { CORE_TENANT_TYPES, type CoreTenantType } from '@payer-portal/shared-types';
import { Prisma, normalizeOrganizationUnitType, prisma } from '@payer-portal/database';
import { logAdminAction } from '@payer-portal/server';

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

type TenantTemplateInput = {
  code: string;
  name: string;
  tenantTypeCode: CoreTenantType;
  description?: string | null;
  defaultOrganizationUnitStructure: string[];
  defaultCapabilities: string[];
  defaultExperiences: string[];
};

type CapabilityInput = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  configSchema?: Record<string, unknown>;
};

type TenantExperienceInput = {
  key: string;
  name: string;
  description?: string | null;
  layout?: Record<string, unknown>;
};

type TenantCapabilityAssignmentInput = {
  capabilityId: string;
  enabled: boolean;
  displayOrder: number;
  config?: Record<string, unknown>;
};

const DEFAULT_CAPABILITIES: CapabilityInput[] = [
  { id: 'scheduling', name: 'Scheduling', category: 'operations', description: 'Schedule and manage visits, sessions, and resource assignments.' },
  { id: 'billing', name: 'Billing', category: 'revenue', description: 'Manage billing workflows and downstream payment follow-up.' },
  { id: 'eligibility', name: 'Eligibility', category: 'operations', description: 'Verify coverage and visit readiness before service delivery.' },
  { id: 'authorizations', name: 'Authorizations', category: 'operations', description: 'Track authorizations, expiration risk, and follow-up work.' },
  { id: 'claims', name: 'Claims & Billing', category: 'revenue', description: 'Manage claims, denials, and resubmission workflows.' },
  { id: 'patients', name: 'Patients', category: 'clinical-operations', description: 'Browse patient-level operational and financial context.' },
  { id: 'documents', name: 'Documents', category: 'content', description: 'Store and manage tenant-scoped operational documents.' },
  { id: 'messages', name: 'Messages', category: 'communications', description: 'Support tenant-scoped communication workflows.' },
  { id: 'utilization', name: 'Utilization', category: 'operations', description: 'Measure staffing utilization and capacity alignment.' },
  { id: 'reporting', name: 'Reporting', category: 'analytics', description: 'Run centralized operational and business reporting.' }
];

const DEFAULT_TEMPLATES: TenantTemplateInput[] = [
  {
    code: 'payer-standard',
    name: 'Payer Standard',
    tenantTypeCode: 'PAYER',
    description: 'Standard payer tenant template with payer experiences and governance-ready defaults.',
    defaultOrganizationUnitStructure: ['Payer Enterprise'],
    defaultCapabilities: ['eligibility', 'authorizations', 'claims', 'documents', 'messages', 'reporting'],
    defaultExperiences: ['member_portal', 'provider_portal', 'employer_portal', 'broker_portal']
  },
  {
    code: 'clinic-aba',
    name: 'Clinic ABA Operations',
    tenantTypeCode: 'CLINIC',
    description: 'ABA clinic control-plane default for centralized operations, scheduling, and revenue workflows.',
    defaultOrganizationUnitStructure: ['Practice', 'Clinic', 'Staff'],
    defaultCapabilities: ['scheduling', 'billing', 'eligibility', 'authorizations', 'claims', 'patients', 'documents', 'messages', 'utilization', 'reporting'],
    defaultExperiences: ['provider_portal']
  },
  {
    code: 'physician-group-standard',
    name: 'Physician Group Standard',
    tenantTypeCode: 'PHYSICIAN_GROUP',
    description: 'Provider-class default for physician groups with site and staff-aligned structure.',
    defaultOrganizationUnitStructure: ['Practice', 'Clinic/Site', 'Staff'],
    defaultCapabilities: ['scheduling', 'billing', 'eligibility', 'authorizations', 'claims', 'patients', 'documents', 'messages', 'utilization', 'reporting'],
    defaultExperiences: ['provider_portal']
  },
  {
    code: 'hospital-standard',
    name: 'Hospital Standard',
    tenantTypeCode: 'HOSPITAL',
    description: 'Provider-class default for hospitals with service line and facility-aligned structure.',
    defaultOrganizationUnitStructure: ['Practice/Service Line', 'Facility/Site', 'Staff'],
    defaultCapabilities: ['scheduling', 'billing', 'eligibility', 'authorizations', 'claims', 'patients', 'documents', 'messages', 'utilization', 'reporting'],
    defaultExperiences: ['provider_portal']
  }
];

function normalizeText(value: string, fieldName: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function slugifyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCaseFromKey(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildScopedConfig(input: {
  tenantId: string | null;
  tenantTypeCode: string | null;
  scope: string;
  data?: Record<string, unknown>;
}) {
  return {
    tenant_id: input.tenantId,
    tenant_type: input.tenantTypeCode,
    scope: input.scope,
    ...(input.data ?? {})
  } satisfies Prisma.InputJsonObject;
}

function mapOrganizationUnitType(label: string, index: number) {
  const normalized = label.trim().toLowerCase();

  if (index === 0) {
    return 'ENTERPRISE';
  }

  if (normalized.includes('service')) {
    return 'DEPARTMENT';
  }

  if (
    normalized.includes('clinic') ||
    normalized.includes('site') ||
    normalized.includes('facility') ||
    normalized.includes('location')
  ) {
    return 'LOCATION';
  }

  if (normalized.includes('staff') || normalized.includes('team')) {
    return 'TEAM';
  }

  return index === 1 ? 'LOCATION' : 'TEAM';
}

export async function syncAdminControlPlaneDefaults() {
  await Promise.all(
    DEFAULT_CAPABILITIES.map((capability) =>
      prisma.capabilityRegistryEntry.upsert({
        where: { id: capability.id },
        update: {
          name: capability.name,
          category: capability.category,
          description: capability.description ?? null,
          configSchema: buildScopedConfig({
            tenantId: null,
            tenantTypeCode: null,
            scope: 'platform_capability_registry',
            data: capability.configSchema ?? {}
          })
        },
        create: {
          id: capability.id,
          name: capability.name,
          category: capability.category,
          description: capability.description ?? null,
          configSchema: buildScopedConfig({
            tenantId: null,
            tenantTypeCode: null,
            scope: 'platform_capability_registry',
            data: capability.configSchema ?? {}
          })
        }
      })
    )
  );

  await Promise.all(
    DEFAULT_TEMPLATES.map((template) =>
      prisma.tenantTemplate.upsert({
        where: { code: template.code },
        update: {
          name: template.name,
          tenantTypeCode: template.tenantTypeCode,
          description: template.description ?? null,
          defaultOrganizationUnitStructure: template.defaultOrganizationUnitStructure,
          defaultCapabilities: template.defaultCapabilities,
          defaultExperiences: template.defaultExperiences,
          config: buildScopedConfig({
            tenantId: null,
            tenantTypeCode: template.tenantTypeCode,
            scope: 'platform_tenant_template',
            data: {
              editable: true
            }
          })
        },
        create: {
          id: randomUUID(),
          code: template.code,
          name: template.name,
          tenantTypeCode: template.tenantTypeCode,
          description: template.description ?? null,
          defaultOrganizationUnitStructure: template.defaultOrganizationUnitStructure,
          defaultCapabilities: template.defaultCapabilities,
          defaultExperiences: template.defaultExperiences,
          config: buildScopedConfig({
            tenantId: null,
            tenantTypeCode: template.tenantTypeCode,
            scope: 'platform_tenant_template',
            data: {
              editable: true
            }
          })
        }
      })
    )
  );
}

export async function listTenantTypesWithTemplates() {
  await syncAdminControlPlaneDefaults();

  const templates = await prisma.tenantTemplate.findMany({
    orderBy: [{ tenantTypeCode: 'asc' }, { name: 'asc' }]
  });

  return CORE_TENANT_TYPES.map((tenantTypeCode) => ({
    id: tenantTypeCode.toLowerCase(),
    tenantTypeCode,
    label: titleCaseFromKey(tenantTypeCode),
    templates: templates
      .filter((template) => template.tenantTypeCode === tenantTypeCode)
      .map((template) => ({
        id: template.id,
        code: template.code,
        name: template.name,
        description: template.description,
        defaultOrganizationUnitStructure: template.defaultOrganizationUnitStructure,
        defaultCapabilities: template.defaultCapabilities,
        defaultExperiences: template.defaultExperiences,
        config: template.config
      }))
  }));
}

export async function listTenantTemplates() {
  await syncAdminControlPlaneDefaults();

  return prisma.tenantTemplate.findMany({
    orderBy: [{ tenantTypeCode: 'asc' }, { name: 'asc' }]
  });
}

export async function createTenantTemplate(input: TenantTemplateInput, context: AuditContext = {}) {
  await syncAdminControlPlaneDefaults();

  const template = await prisma.tenantTemplate.create({
    data: {
      code: slugifyKey(normalizeText(input.code, 'Template code')),
      name: normalizeText(input.name, 'Template name'),
      tenantTypeCode: input.tenantTypeCode,
      description: normalizeOptionalText(input.description),
      defaultOrganizationUnitStructure: input.defaultOrganizationUnitStructure,
      defaultCapabilities: input.defaultCapabilities,
      defaultExperiences: input.defaultExperiences,
      config: buildScopedConfig({
        tenantId: null,
        tenantTypeCode: input.tenantTypeCode,
        scope: 'platform_tenant_template',
        data: { editable: true }
      })
    }
  });

  await logAdminAction({
    tenantId: PLATFORM_TENANT_ID,
    actorUserId: context.actorUserId ?? null,
    action: 'tenant_template.created',
    resourceType: 'tenant_template',
    resourceId: template.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return template;
}

const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export async function updateTenantTemplate(
  id: string,
  input: Partial<TenantTemplateInput>,
  context: AuditContext = {}
) {
  const template = await prisma.tenantTemplate.findUnique({ where: { id } });

  if (!template) {
    throw new Error('Tenant template not found.');
  }

  const updated = await prisma.tenantTemplate.update({
    where: { id },
    data: {
      ...(input.code ? { code: slugifyKey(normalizeText(input.code, 'Template code')) } : {}),
      ...(input.name ? { name: normalizeText(input.name, 'Template name') } : {}),
      ...(input.tenantTypeCode ? { tenantTypeCode: input.tenantTypeCode } : {}),
      ...(input.description !== undefined ? { description: normalizeOptionalText(input.description) } : {}),
      ...(input.defaultOrganizationUnitStructure ? { defaultOrganizationUnitStructure: input.defaultOrganizationUnitStructure } : {}),
      ...(input.defaultCapabilities ? { defaultCapabilities: input.defaultCapabilities } : {}),
      ...(input.defaultExperiences ? { defaultExperiences: input.defaultExperiences } : {})
    }
  });

  await logAdminAction({
    tenantId: PLATFORM_TENANT_ID,
    actorUserId: context.actorUserId ?? null,
    action: 'tenant_template.updated',
    resourceType: 'tenant_template',
    resourceId: updated.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return updated;
}

export async function listCapabilities() {
  await syncAdminControlPlaneDefaults();

  return prisma.capabilityRegistryEntry.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });
}

export async function createCapability(input: CapabilityInput, context: AuditContext = {}) {
  const capability = await prisma.capabilityRegistryEntry.create({
    data: {
      id: slugifyKey(normalizeText(input.id, 'Capability id')),
      name: normalizeText(input.name, 'Capability name'),
      category: normalizeText(input.category, 'Capability category'),
      description: normalizeOptionalText(input.description),
      configSchema: buildScopedConfig({
        tenantId: null,
        tenantTypeCode: null,
        scope: 'platform_capability_registry',
        data: input.configSchema ?? {}
      })
    }
  });

  await logAdminAction({
    tenantId: PLATFORM_TENANT_ID,
    actorUserId: context.actorUserId ?? null,
    action: 'capability.created',
    resourceType: 'capability',
    resourceId: capability.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return capability;
}

export async function updateCapability(
  id: string,
  input: Partial<CapabilityInput>,
  context: AuditContext = {}
) {
  const capability = await prisma.capabilityRegistryEntry.findUnique({ where: { id } });

  if (!capability) {
    throw new Error('Capability not found.');
  }

  const updated = await prisma.capabilityRegistryEntry.update({
    where: { id },
    data: {
      ...(input.name ? { name: normalizeText(input.name, 'Capability name') } : {}),
      ...(input.category ? { category: normalizeText(input.category, 'Capability category') } : {}),
      ...(input.description !== undefined ? { description: normalizeOptionalText(input.description) } : {}),
      ...(input.configSchema
        ? {
            configSchema: buildScopedConfig({
              tenantId: null,
              tenantTypeCode: null,
              scope: 'platform_capability_registry',
              data: input.configSchema
            })
          }
        : {})
    }
  });

  await logAdminAction({
    tenantId: PLATFORM_TENANT_ID,
    actorUserId: context.actorUserId ?? null,
    action: 'capability.updated',
    resourceType: 'capability',
    resourceId: updated.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return updated;
}

export async function applyTenantTemplateDefaults(input: {
  tenantId: string;
  tenantTypeCode: CoreTenantType;
  templateId: string;
  client?: Prisma.TransactionClient;
}) {
  const client = input.client ?? prisma;

  const template = await client.tenantTemplate.findUnique({
    where: { id: input.templateId }
  });

  if (!template) {
    throw new Error('Tenant template not found.');
  }

  const organizationUnitStructure = Array.isArray(template.defaultOrganizationUnitStructure)
    ? (template.defaultOrganizationUnitStructure as string[])
    : [];
  const experiences = Array.isArray(template.defaultExperiences)
    ? (template.defaultExperiences as string[])
    : [];
  const capabilities = Array.isArray(template.defaultCapabilities)
    ? (template.defaultCapabilities as string[])
    : [];

  let parentId: string | null = null;

  for (const [index, label] of organizationUnitStructure.entries()) {
    const normalizedLabel = normalizeText(label, 'Organization Unit label');
    const createdOrganizationUnit: { id: string } = await client.organizationUnit.create({
      data: {
        tenantId: input.tenantId,
        parentId,
        name: normalizedLabel,
        type: normalizeOrganizationUnitType(mapOrganizationUnitType(normalizedLabel, index))
      }
    });

    parentId = createdOrganizationUnit.id;
  }

  for (const [experienceIndex, experienceKey] of experiences.entries()) {
    const key = slugifyKey(experienceKey);
    const experience = await client.tenantExperience.create({
      data: {
        tenantId: input.tenantId,
        tenantTypeCode: input.tenantTypeCode,
        key,
        name: titleCaseFromKey(key),
        scope: 'tenant_experience',
        layout: buildScopedConfig({
          tenantId: input.tenantId,
          tenantTypeCode: input.tenantTypeCode,
          scope: 'tenant_experience',
          data: {
            display_order: experienceIndex,
            layout_mode: 'workspace'
          }
        })
      }
    });

    for (const [capabilityIndex, capabilityId] of capabilities.entries()) {
      await client.tenantCapabilityConfig.create({
        data: {
          tenantId: input.tenantId,
          tenantTypeCode: input.tenantTypeCode,
          experienceId: experience.id,
          capabilityId,
          enabled: true,
          scope: 'tenant_capability',
          displayOrder: capabilityIndex,
          config: buildScopedConfig({
            tenantId: input.tenantId,
            tenantTypeCode: input.tenantTypeCode,
            scope: 'tenant_capability',
            data: {
              experience_key: key
            }
          })
        }
      });
    }
  }
}

export async function listTenantExperiences(tenantId: string) {
  await syncAdminControlPlaneDefaults();

  return prisma.tenantExperience.findMany({
    where: { tenantId },
    include: {
      capabilityConfigs: {
        include: {
          capability: true
        },
        orderBy: [{ displayOrder: 'asc' }, { capabilityId: 'asc' }]
      }
    },
    orderBy: [{ createdAt: 'asc' }]
  });
}

export async function upsertTenantExperience(
  tenantId: string,
  input: TenantExperienceInput,
  context: AuditContext = {}
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!tenant) {
    throw new Error('Tenant not found.');
  }

  const key = slugifyKey(normalizeText(input.key, 'Experience key'));

  const experience = await prisma.tenantExperience.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key
      }
    },
    update: {
      name: normalizeText(input.name, 'Experience name'),
      description: normalizeOptionalText(input.description),
      layout: buildScopedConfig({
        tenantId,
        tenantTypeCode: tenant.tenantTypeCode,
        scope: 'tenant_experience',
        data: input.layout ?? {}
      })
    },
    create: {
      tenantId,
      tenantTypeCode: tenant.tenantTypeCode,
      key,
      name: normalizeText(input.name, 'Experience name'),
      description: normalizeOptionalText(input.description),
      scope: 'tenant_experience',
      layout: buildScopedConfig({
        tenantId,
        tenantTypeCode: tenant.tenantTypeCode,
        scope: 'tenant_experience',
        data: input.layout ?? {}
      })
    }
  });

  await logAdminAction({
    tenantId,
    actorUserId: context.actorUserId ?? null,
    action: 'tenant_experience.updated',
    resourceType: 'tenant_experience',
    resourceId: experience.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return experience;
}

export async function saveTenantExperienceCapabilities(
  tenantId: string,
  experienceId: string,
  input: TenantCapabilityAssignmentInput[],
  context: AuditContext = {}
) {
  const experience = await prisma.tenantExperience.findFirst({
    where: {
      id: experienceId,
      tenantId
    }
  });

  if (!experience) {
    throw new Error('Tenant experience not found.');
  }

  const capabilityIds = input.map((item) => item.capabilityId);
  const capabilities = await prisma.capabilityRegistryEntry.findMany({
    where: {
      id: {
        in: capabilityIds
      }
    }
  });

  if (capabilities.length !== capabilityIds.length) {
    throw new Error('One or more capability ids are invalid.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenantCapabilityConfig.deleteMany({
      where: {
        tenantId,
        experienceId,
        capabilityId: {
          notIn: capabilityIds
        }
      }
    });

    for (const item of input) {
      await tx.tenantCapabilityConfig.upsert({
        where: {
          tenantId_experienceId_capabilityId: {
            tenantId,
            experienceId,
            capabilityId: item.capabilityId
          }
        },
        update: {
          enabled: item.enabled,
          displayOrder: item.displayOrder,
          config: buildScopedConfig({
            tenantId,
            tenantTypeCode: experience.tenantTypeCode,
            scope: 'tenant_capability',
            data: item.config ?? {}
          })
        },
        create: {
          tenantId,
          tenantTypeCode: experience.tenantTypeCode,
          experienceId,
          capabilityId: item.capabilityId,
          enabled: item.enabled,
          displayOrder: item.displayOrder,
          scope: 'tenant_capability',
          config: buildScopedConfig({
            tenantId,
            tenantTypeCode: experience.tenantTypeCode,
            scope: 'tenant_capability',
            data: item.config ?? {}
          })
        }
      });
    }
  });

  await logAdminAction({
    tenantId,
    actorUserId: context.actorUserId ?? null,
    action: 'tenant_capability_config.updated',
    resourceType: 'tenant_experience',
    resourceId: experienceId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      capabilityCount: input.length
    }
  });

  return listTenantExperiences(tenantId);
}

export async function listTenantCapabilityMatrix(tenantId: string) {
  const [tenant, capabilities, experiences] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    listCapabilities(),
    listTenantExperiences(tenantId)
  ]);

  if (!tenant) {
    throw new Error('Tenant not found.');
  }

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      tenantTypeCode: tenant.tenantTypeCode
    },
    capabilities,
    experiences
  };
}
