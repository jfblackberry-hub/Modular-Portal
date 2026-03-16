import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiStorageDir = path.resolve(process.cwd(), '../../apps/api/storage');

const PRIMARY_EMPLOYEE_COUNT = 12300;
const SECONDARY_EMPLOYEE_COUNT = 1850;
const BATCH_SIZE = 1000;

type TenantSeed = {
  name: string;
  slug: string;
  employerKey: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  employeeCount: number;
};

const tenants: TenantSeed[] = [
  {
    name: 'Northstar Manufacturing',
    slug: 'northstar-manufacturing',
    employerKey: 'EMP-0316043829906172-001',
    primaryColor: '#0f6cbd',
    secondaryColor: '#ffffff',
    logoUrl: '/tenant-assets/northstar-logo.svg',
    employeeCount: PRIMARY_EMPLOYEE_COUNT
  },
  {
    name: 'Lakeside Retail Group',
    slug: 'lakeside-retail-group',
    employerKey: 'EMP-0316043829906172-002',
    primaryColor: '#0b7a5b',
    secondaryColor: '#ffffff',
    logoUrl: '/tenant-assets/lakeside-retail-group-logo.svg',
    employeeCount: SECONDARY_EMPLOYEE_COUNT
  }
];

const permissionSeeds = [
  { code: 'admin.manage', name: 'Manage Admin', description: 'Administrative configuration access.' },
  { code: 'tenant.view', name: 'View Tenants', description: 'Tenant-scoped read access.' },
  { code: 'member.view', name: 'View Member Portal', description: 'Member portal access.' },
  { code: 'provider.view', name: 'View Provider Portal', description: 'Provider portal access.' },
  { code: 'user.manage', name: 'Manage Users', description: 'Manage user identities and roles.' },
  { code: 'billing_enrollment.view', name: 'View Billing and Enrollment', description: 'View E&B data.' },
  { code: 'billing_enrollment.manage', name: 'Manage Billing and Enrollment', description: 'Manage E&B operations.' }
] as const;

const roleSeeds: Array<{
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}> = [
  {
    code: 'platform_admin',
    name: 'Platform Admin',
    description: 'Cross-tenant administrative access.',
    permissionCodes: permissionSeeds.map((permission) => permission.code)
  },
  {
    code: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Tenant administration access.',
    permissionCodes: ['tenant.view', 'user.manage', 'member.view', 'provider.view', 'billing_enrollment.view']
  },
  {
    code: 'employer_group_admin',
    name: 'Employer Group Admin',
    description: 'Employer administration for E&B.',
    permissionCodes: ['tenant.view', 'member.view', 'billing_enrollment.view', 'billing_enrollment.manage']
  },
  {
    code: 'broker',
    name: 'Broker',
    description: 'Broker support access.',
    permissionCodes: ['tenant.view', 'billing_enrollment.view']
  },
  {
    code: 'internal_operations',
    name: 'Internal Operations',
    description: 'Internal operations access.',
    permissionCodes: ['tenant.view', 'billing_enrollment.view', 'billing_enrollment.manage', 'user.manage']
  },
  {
    code: 'provider',
    name: 'Provider',
    description: 'Provider portal role.',
    permissionCodes: ['provider.view', 'tenant.view']
  },
  {
    code: 'member',
    name: 'Member',
    description: 'Member portal role.',
    permissionCodes: ['member.view', 'billing_enrollment.view']
  }
];

function chunkArray<T>(input: T[], size = BATCH_SIZE) {
  const chunks: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    chunks.push(input.slice(index, index + size));
  }
  return chunks;
}

async function createManyBatched<T>(rows: T[], writer: (batch: T[]) => Promise<unknown>) {
  for (const batch of chunkArray(rows)) {
    await writer(batch);
  }
}

function tenantBrandingConfig(input: TenantSeed) {
  return {
    displayName: input.name,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    logoUrl: input.logoUrl,
    employerKey: input.employerKey
  };
}

async function writeMockDocument(storageKey: string, filename: string, tenantName: string) {
  const outputPath = path.join(apiStorageDir, storageKey);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `Mock E&B portal document for ${tenantName}\nFilename: ${filename}\n`);
}

async function clearData() {
  await prisma.eventDelivery.deleteMany();
  await prisma.eventRecord.deleteMany();
  await prisma.integrationExecution.deleteMany();
  await prisma.connectorConfig.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.job.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenantBranding.deleteMany();
  await prisma.tenant.deleteMany();
}

async function createAccessModel() {
  await prisma.permission.createMany({ data: permissionSeeds as unknown as Array<Record<string, unknown>> });

  for (const roleSeed of roleSeeds) {
    await prisma.role.create({
      data: {
        code: roleSeed.code,
        name: roleSeed.name,
        description: roleSeed.description
      }
    });
  }

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ select: { id: true, code: true } }),
    prisma.permission.findMany({ select: { id: true, code: true } })
  ]);

  const roleByCode = new Map(roles.map((role) => [role.code, role.id]));
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission.id]));

  const rolePermissions: Array<{ roleId: string; permissionId: string }> = [];
  for (const roleSeed of roleSeeds) {
    const roleId = roleByCode.get(roleSeed.code);
    if (!roleId) {
      continue;
    }
    for (const permissionCode of roleSeed.permissionCodes) {
      const permissionId = permissionByCode.get(permissionCode);
      if (!permissionId) {
        continue;
      }
      rolePermissions.push({ roleId, permissionId });
    }
  }

  await createManyBatched(rolePermissions, (batch) =>
    prisma.rolePermission.createMany({
      data: batch,
      skipDuplicates: true
    })
  );
}

async function createTenants() {
  const created: Array<{
    id: string;
    slug: string;
    name: string;
    employerKey: string;
    employeeCount: number;
  }> = [];

  for (const tenantSeed of tenants) {
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantSeed.name,
        slug: tenantSeed.slug,
        status: 'ACTIVE',
        isActive: true,
        brandingConfig: tenantBrandingConfig(tenantSeed)
      }
    });

    await prisma.tenantBranding.create({
      data: {
        tenantId: tenant.id,
        displayName: tenantSeed.name,
        primaryColor: tenantSeed.primaryColor,
        secondaryColor: tenantSeed.secondaryColor,
        logoUrl: tenantSeed.logoUrl
      }
    });

    created.push({
      id: tenant.id,
      slug: tenantSeed.slug,
      name: tenantSeed.name,
      employerKey: tenantSeed.employerKey,
      employeeCount: tenantSeed.employeeCount
    });
  }

  return created;
}

function generateEmployeeRows(tenantId: string, tenantSlug: string, employeeCount: number) {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Avery', 'Parker', 'Quinn', 'Reese',
    'Skyler', 'Emerson', 'Elliot', 'Hayden', 'Rowan', 'Drew', 'Blake', 'Shawn', 'Kendall', 'Cameron'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Martinez', 'Wilson',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Clark', 'Lewis'
  ];

  return Array.from({ length: employeeCount }).map((_, index) => {
    const seq = index + 1;
    return {
      tenantId,
      email: `emp${String(seq).padStart(5, '0')}@${tenantSlug}.local`,
      firstName: firstNames[index % firstNames.length],
      lastName: lastNames[index % lastNames.length],
      isActive: seq % 23 !== 0,
      lastLoginAt: new Date(Date.now() - (seq % 21) * 24 * 60 * 60 * 1000)
    };
  });
}

async function seedTenantUsers(
  tenantId: string,
  tenantName: string,
  tenantSlug: string,
  employeeCount: number,
  includeSharedLocalAccounts: boolean
) {
  const sharedLocalAccounts = includeSharedLocalAccounts
    ? [
        { email: 'maria', firstName: 'Maria', lastName: 'Lopez', roleCode: 'member' },
        { email: 'provider1', firstName: 'Provider', lastName: 'One', roleCode: 'provider' },
        { email: 'tenant', firstName: 'Tenant', lastName: 'Admin', roleCode: 'tenant_admin' },
        { email: 'admin', firstName: 'Platform', lastName: 'Admin', roleCode: 'platform_admin' },
        { email: 'broker', firstName: 'Broker', lastName: 'User', roleCode: 'broker' },
        { email: 'ops', firstName: 'Internal', lastName: 'Operations', roleCode: 'internal_operations' },
        { email: 'employer', firstName: 'Employer', lastName: 'Admin', roleCode: 'employer_group_admin' }
      ]
    : [];

  const tenantScopedAdmins = [
    {
      email: `employer+${tenantSlug}@local`,
      firstName: tenantName,
      lastName: 'Employer Admin',
      roleCode: 'employer_group_admin',
      isActive: true
    },
    {
      email: `benefits-admin@${tenantSlug}.local`,
      firstName: 'Avery',
      lastName: 'Turner',
      roleCode: 'employer_group_admin',
      isActive: true
    },
    {
      email: `billing-admin@${tenantSlug}.local`,
      firstName: 'Jordan',
      lastName: 'Reed',
      roleCode: 'employer_group_admin',
      isActive: true
    }
  ];

  const baseUsers = [...sharedLocalAccounts, ...tenantScopedAdmins].map((user) => ({
    tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: true,
    lastLoginAt: new Date()
  }));

  await createManyBatched(baseUsers, (batch) =>
    prisma.user.createMany({
      data: batch,
      skipDuplicates: true
    })
  );

  const employeeRows = generateEmployeeRows(tenantId, tenantSlug, employeeCount);
  await createManyBatched(employeeRows, (batch) =>
    prisma.user.createMany({
      data: batch,
      skipDuplicates: true
    })
  );

  const [roles, tenantUsers] = await Promise.all([
    prisma.role.findMany({ select: { id: true, code: true } }),
    prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true }
    })
  ]);

  const roleByCode = new Map(roles.map((role) => [role.code, role.id]));
  const userRoleRows: Array<{ userId: string; roleId: string }> = [];

  for (const user of tenantUsers) {
    let roleCode = 'member';
    if (user.email === 'admin') {
      roleCode = 'platform_admin';
    } else if (user.email === 'tenant') {
      roleCode = 'tenant_admin';
    } else if (user.email === 'provider1') {
      roleCode = 'provider';
    } else if (user.email === 'broker') {
      roleCode = 'broker';
    } else if (user.email === 'ops') {
      roleCode = 'internal_operations';
    } else if (
      user.email === 'employer' ||
      user.email.startsWith('employer+') ||
      user.email.startsWith('benefits-admin@') ||
      user.email.startsWith('billing-admin@')
    ) {
      roleCode = 'employer_group_admin';
    }

    const roleId = roleByCode.get(roleCode);
    if (roleId) {
      userRoleRows.push({ userId: user.id, roleId });
    }
  }

  await createManyBatched(userRoleRows, (batch) =>
    prisma.userRole.createMany({
      data: batch,
      skipDuplicates: true
    })
  );

  return tenantUsers;
}

async function seedTenantDocuments(tenant: { id: string; slug: string; name: string }, uploadedByUserId: string) {
  const documents: Array<{
    tenantId: string;
    uploadedByUserId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    status: string;
    tags: Record<string, unknown>;
  }> = [];

  const year = 2026;
  for (let month = 1; month <= 12; month += 1) {
    const monthLabel = `${year}-${String(month).padStart(2, '0')}`;

    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `plan-guide-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/plan-guide-${monthLabel}.pdf`,
      status: 'AVAILABLE',
      tags: { title: `Plan Guide ${monthLabel}`, documentType: 'plan-guide' }
    });

    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `benefits-summary-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/benefits-summary-${monthLabel}.pdf`,
      status: 'AVAILABLE',
      tags: { title: `Benefits Summary ${monthLabel}`, documentType: 'benefits-overview' }
    });

    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `billing-statement-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/billing-statement-${monthLabel}.pdf`,
      status: 'AVAILABLE',
      tags: { title: `Billing Statement ${monthLabel}`, documentType: 'billing-statement' }
    });

    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `invoice-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/invoice-${monthLabel}.pdf`,
      status: 'AVAILABLE',
      tags: { title: `Monthly Invoice ${monthLabel}`, documentType: 'billing-invoice' }
    });

    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `compliance-notice-${monthLabel}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/compliance-notice-${monthLabel}.pdf`,
      status: 'AVAILABLE',
      tags: { title: `Compliance Notice ${monthLabel}`, documentType: 'compliance-notice' }
    });
  }

  for (let index = 1; index <= 80; index += 1) {
    const seq = String(index).padStart(3, '0');
    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `secure-upload-${seq}.txt`,
      mimeType: 'text/plain',
      sizeBytes: 1024,
      storageKey: `eb-demo/${tenant.slug}/secure-upload-${seq}.txt`,
      status: index % 3 === 0 ? 'PROCESSING' : 'AVAILABLE',
      tags: {
        title: `Secure Upload ${seq}`,
        documentType: 'secure-upload'
      }
    });
  }

  for (let index = 1; index <= 40; index += 1) {
    const seq = String(index).padStart(3, '0');
    documents.push({
      tenantId: tenant.id,
      uploadedByUserId,
      filename: `employer-agreement-${seq}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      storageKey: `eb-demo/${tenant.slug}/employer-agreement-${seq}.pdf`,
      status: 'AVAILABLE',
      tags: {
        title: `Employer Agreement ${seq}`,
        documentType: 'employer-agreement'
      }
    });
  }

  const filesToWrite = documents.slice(0, 60);
  for (const doc of filesToWrite) {
    await writeMockDocument(doc.storageKey, doc.filename, tenant.name);
  }

  await createManyBatched(documents, (batch) => prisma.document.createMany({ data: batch }));
}

async function seedTenantNotifications(tenantId: string, primaryUserId: string) {
  const templates = [
    { template: 'enrollment_pending_review', subject: 'Pending Enrollment', status: 'QUEUED' },
    { template: 'invoice_due', subject: 'Invoice Due', status: 'REQUESTED' },
    { template: 'eligibility_error_detected', subject: 'Eligibility Error', status: 'FAILED' },
    { template: 'open_enrollment_deadline_notice', subject: 'Open Enrollment', status: 'SENT' },
    { template: 'life_event_change_pending', subject: 'Life Event Pending', status: 'QUEUED' },
    { template: 'termination_pending', subject: 'Termination Pending', status: 'REQUESTED' },
    { template: 'enrollment_correction_required', subject: 'Needs Correction', status: 'CORRECTION_REQUIRED' },
    { template: 'billing_posted_confirmation', subject: 'Billing Posted', status: 'SENT' },
    { template: 'document_available_notice', subject: 'Document Available', status: 'SENT' },
    { template: 'system_sync_status', subject: 'System Sync', status: 'SENT' }
  ] as const;

  const rows: Array<{
    tenantId: string;
    userId: string;
    channel: string;
    template: string;
    subject: string;
    body: string;
    status: string;
    sentAt?: Date;
    readAt?: Date;
    createdAt: Date;
  }> = [];

  for (let index = 0; index < 2400; index += 1) {
    const template = templates[index % templates.length];
    const ageHours = index * 4;
    const createdAt = new Date(Date.now() - ageHours * 60 * 60 * 1000);
    const sentAt = template.status === 'SENT' ? new Date(createdAt.getTime() + 20 * 60 * 1000) : undefined;
    const readAt = index % 3 === 0 && sentAt ? new Date(sentAt.getTime() + 40 * 60 * 1000) : undefined;

    rows.push({
      tenantId,
      userId: primaryUserId,
      channel: 'in_app',
      template: template.template,
      subject: template.subject,
      body: `${template.subject} event ${index + 1} requires review or acknowledgment.`,
      status: template.status,
      sentAt,
      readAt,
      createdAt
    });
  }

  await createManyBatched(rows, (batch) => prisma.notification.createMany({ data: batch }));
}

async function seedTenantConnectors(tenantId: string) {
  await prisma.connectorConfig.createMany({
    data: [
      {
        tenantId,
        adapterKey: 'workday',
        name: 'Workday HRIS',
        status: 'CONNECTED',
        config: { syncFrequency: 'daily' },
        lastSyncAt: new Date()
      },
      {
        tenantId,
        adapterKey: 'adp',
        name: 'ADP Payroll',
        status: 'CONNECTED',
        config: { syncFrequency: 'daily' },
        lastSyncAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
      },
      {
        tenantId,
        adapterKey: 'bamboohr',
        name: 'BambooHR',
        status: 'CONNECTED',
        config: { syncFrequency: 'weekly' },
        lastSyncAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        tenantId,
        adapterKey: 'rippling',
        name: 'Rippling',
        status: 'ERROR',
        config: { syncFrequency: 'weekly', message: 'Token renewal required' },
        lastSyncAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        tenantId,
        adapterKey: 'sap_successfactors',
        name: 'SAP SuccessFactors',
        status: 'CONFIGURED',
        config: { syncFrequency: 'manual' },
        lastSyncAt: null
      }
    ]
  });
}

async function seedTenantFlags(tenantId: string) {
  const flags = [
    'billing_enrollment',
    'member_home',
    'member_documents',
    'member_claims',
    'provider_dashboard',
    'provider_documents',
    'provider_support'
  ];

  await prisma.featureFlag.createMany({
    data: flags.map((key) => ({
      tenantId,
      key,
      name: key,
      enabled: true
    }))
  });
}

async function main() {
  await clearData();
  await createAccessModel();
  const seededTenants = await createTenants();

  const summary: Array<{ tenant: string; users: number; employees: number }> = [];

  for (const [index, tenant] of seededTenants.entries()) {
    const users = await seedTenantUsers(
      tenant.id,
      tenant.name,
      tenant.slug,
      tenant.employeeCount,
      index === 0
    );
    const primaryEmployerAdmin = users.find((user) => user.email.startsWith('employer+')) ?? users[0];

    await seedTenantDocuments(tenant, primaryEmployerAdmin.id);
    await seedTenantNotifications(tenant.id, primaryEmployerAdmin.id);
    await seedTenantConnectors(tenant.id);
    await seedTenantFlags(tenant.id);

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: primaryEmployerAdmin.id,
        action: 'seed.eb_demo.ready',
        entityType: 'tenant',
        entityId: tenant.id,
        metadata: {
          employerKey: tenant.employerKey,
          usersSeeded: users.length,
          employeesSeeded: tenant.employeeCount
        }
      }
    });

    summary.push({
      tenant: tenant.name,
      users: users.length,
      employees: tenant.employeeCount
    });
  }

  const platformAdmin = await prisma.user.findUnique({ where: { email: 'admin' } });
  console.log(
    JSON.stringify(
      {
        message: 'EB demo seed complete',
        platformAdminUserId: platformAdmin?.id ?? null,
        summary
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
