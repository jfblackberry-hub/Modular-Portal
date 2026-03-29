import { randomBytes, scryptSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { seedTestProviderTenant } from './provider-tenant-seed.js';

const prisma = new PrismaClient();
const DEFAULT_DEMO_PASSWORD = 'demo12345';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function syncTenantTypeDefinitions() {
  await Promise.all(
    [
      ['PAYER', 'PAYER', 'Payer'],
      ['CLINIC', 'CLINIC', 'Clinic'],
      ['PHYSICIAN_GROUP', 'PHYSICIAN_GROUP', 'Physician Group'],
      ['HOSPITAL', 'HOSPITAL', 'Hospital'],
      ['PROVIDER', 'PROVIDER', 'Provider (Legacy)']
    ].map(([code, enumValue, name]) =>
      prisma.tenantTypeDefinition.upsert({
        where: { code },
        update: {
          enumValue: enumValue as
            | 'PAYER'
            | 'CLINIC'
            | 'PHYSICIAN_GROUP'
            | 'HOSPITAL'
            | 'PROVIDER',
          name
        },
        create: {
          code,
          enumValue: enumValue as
            | 'PAYER'
            | 'CLINIC'
            | 'PHYSICIAN_GROUP'
            | 'HOSPITAL'
            | 'PROVIDER',
          name
        }
      })
    )
  );
}

async function syncUserTenantMemberships() {
  const users = await prisma.user.findMany({
    where: {
      tenantId: {
        not: null
      }
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  await Promise.all(
    users.flatMap((user) => {
      if (!user.tenantId) {
        return [];
      }

      return [
        prisma.userTenantMembership.upsert({
          where: {
            userId_tenantId: {
              userId: user.id,
              tenantId: user.tenantId
            }
          },
          update: {
            isDefault: true,
            isTenantAdmin: user.roles.some(({ role }) => role.code === 'tenant_admin')
          },
          create: {
            userId: user.id,
            tenantId: user.tenantId,
            isDefault: true,
            isTenantAdmin: user.roles.some(({ role }) => role.code === 'tenant_admin')
          }
        }),
        prisma.userTenantMembership.updateMany({
          where: {
            userId: user.id,
            tenantId: {
              not: user.tenantId
            }
          },
          data: {
            isDefault: false
          }
        })
      ];
    })
  );
}
const apiStorageDir = path.resolve(process.cwd(), '../../storage');

const mockPortalDocuments = [
  {
    filename: 'member-id-card-2026.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Member ID Card 2026',
      documentType: 'id-card'
    }
  },
  {
    filename: 'eob-claim-c100245.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Explanation of Benefits - Claim C-100245',
      documentType: 'explanation-of-benefits',
      claimNumber: 'C-100245',
      claimDate: '2026-02-20',
      totalAmount: 428.55,
      claimStatus: 'approved'
    }
  },
  {
    filename: 'eob-claim-c100246.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Explanation of Benefits - Claim C-100246',
      documentType: 'explanation-of-benefits',
      claimNumber: 'C-100246',
      claimDate: '2026-02-26',
      totalAmount: 182.14,
      claimStatus: 'pending review'
    }
  },
  {
    filename: 'eob-claim-c100247.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Explanation of Benefits - Claim C-100247',
      documentType: 'explanation-of-benefits',
      claimNumber: 'C-100247',
      claimDate: '2026-03-01',
      totalAmount: 76.22,
      claimStatus: 'processing'
    }
  },
  {
    filename: 'eob-claim-c100248.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Explanation of Benefits - Claim C-100248',
      documentType: 'explanation-of-benefits',
      claimNumber: 'C-100248',
      claimDate: '2026-03-03',
      totalAmount: 915.48,
      claimStatus: 'approved'
    }
  },
  {
    filename: 'eob-claim-c100249.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Explanation of Benefits - Claim C-100249',
      documentType: 'explanation-of-benefits',
      claimNumber: 'C-100249',
      claimDate: '2026-03-07',
      totalAmount: 54.91,
      claimStatus: 'denied'
    }
  },
  {
    filename: 'premium-bill-april-2026.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'April 2026 Premium Statement',
      documentType: 'billing-statement'
    }
  },
  {
    filename: 'preventive-care-guide-2026.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Preventive Care Guide',
      documentType: 'care-guide'
    }
  },
  {
    filename: 'specialist-referral-letter.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Specialist Referral Letter',
      documentType: 'member-letter'
    }
  },
  {
    filename: 'care-management-outreach.txt',
    mimeType: 'text/plain',
    status: 'AVAILABLE',
    tags: {
      title: 'Care Management Outreach',
      documentType: 'care-management-note'
    }
  },
  {
    filename: 'rx-benefits-overview.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Pharmacy Benefits Overview',
      documentType: 'benefits-overview'
    }
  },
  {
    filename: 'wellness-reward-notice.pdf',
    mimeType: 'application/pdf',
    status: 'AVAILABLE',
    tags: {
      title: 'Wellness Reward Notice',
      documentType: 'program-notice'
    }
  }
] as const;

async function writeMockDocument(storageKey: string, filename: string) {
  const outputPath = path.join(apiStorageDir, storageKey);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `Mock portal document for ${filename}\nGenerated by Prisma seed for local member portal previews.\n`
  );
}

async function main() {
  await syncTenantTypeDefinitions();
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'blue-horizon-health' },
    update: {
      status: 'ACTIVE',
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      brandingConfig: {
        primaryColor: '#0f6cbd',
        secondaryColor: '#ffffff',
        logoUrl: '/logos/blue-horizon-health.svg'
      }
    },
    create: {
      name: 'Blue Horizon Health',
      slug: 'blue-horizon-health',
      status: 'ACTIVE',
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      brandingConfig: {
        primaryColor: '#0f6cbd',
        secondaryColor: '#ffffff',
        logoUrl: '/logos/blue-horizon-health.svg'
      }
    }
  });

  const permissionSeeds = [
    {
      code: 'admin.manage',
      name: 'Manage Admin',
      description: 'Allows access to administrative configuration workflows.'
    },
    {
      code: 'tenant.view',
      name: 'View Tenants',
      description: 'Allows viewing tenant records.'
    },
    {
      code: 'member.view',
      name: 'View Member Portal',
      description: 'Allows access to member-facing portal experiences.'
    },
    {
      code: 'user.manage',
      name: 'Manage Users',
      description: 'Allows creating and updating user records.'
    }
  ];

  await prisma.tenantBranding.upsert({
    where: {
      tenantId: tenant.id
    },
    update: {
      displayName: 'Blue Horizon Health',
      primaryColor: '#0f6cbd',
      secondaryColor: '#ffffff',
      logoUrl: '/logos/blue-horizon-health.svg',
      faviconUrl: '/logos/blue-horizon-health-favicon.ico'
    },
    create: {
      tenantId: tenant.id,
      displayName: 'Blue Horizon Health',
      primaryColor: '#0f6cbd',
      secondaryColor: '#ffffff',
      logoUrl: '/logos/blue-horizon-health.svg',
      faviconUrl: '/logos/blue-horizon-health-favicon.ico'
    }
  });

  for (const permission of permissionSeeds) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: permission
    });
  }

  const platformAdminRole = await prisma.role.upsert({
    where: { code: 'platform_admin' },
    update: {
      isPlatformRole: true,
      name: 'Platform Admin',
      description: 'Administrative role with cross-tenant platform access.'
    },
    create: {
      code: 'platform_admin',
      isPlatformRole: true,
      name: 'Platform Admin',
      description: 'Administrative role with cross-tenant platform access.'
    }
  });

  const tenantAdminRole = await prisma.role.upsert({
    where: { code: 'tenant_admin' },
    update: {
      appliesToAllTenantTypes: true,
      name: 'Tenant Admin',
      description: 'Administrative role restricted to a single tenant scope.'
    },
    create: {
      code: 'tenant_admin',
      appliesToAllTenantTypes: true,
      name: 'Tenant Admin',
      description: 'Administrative role restricted to a single tenant scope.'
    }
  });

  const memberRole = await prisma.role.upsert({
    where: { code: 'member' },
    update: {
      tenantTypeCode: 'PAYER',
      name: 'Member',
      description: 'Default member-facing access role.'
    },
    create: {
      code: 'member',
      tenantTypeCode: 'PAYER',
      name: 'Member',
      description: 'Default member-facing access role.'
    }
  });

  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: permissionSeeds.map((permission) => permission.code)
      }
    }
  });

  for (const permission of permissions) {
    for (const roleId of [platformAdminRole.id, tenantAdminRole.id]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id
        }
      });
    }
  }

  const memberPermission = permissions.find(
    (permission) => permission.code === 'member.view'
  );

  if (memberPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: memberRole.id,
          permissionId: memberPermission.id
        }
      },
      update: {},
      create: {
        roleId: memberRole.id,
        permissionId: memberPermission.id
      }
    });
  }

  const portalUser = await prisma.user.upsert({
    where: { email: DEFAULT_MEMBER_LOGIN },
    update: {
      tenantId: tenant.id,
      firstName: 'Maria',
      lastName: 'Lopez',
      isActive: true,
      status: 'ACTIVE'
    },
    create: {
      tenantId: tenant.id,
      email: DEFAULT_MEMBER_LOGIN,
      firstName: 'Maria',
      lastName: 'Lopez',
      isActive: true,
      status: 'ACTIVE'
    }
  });

  const platformAdminUser = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {
      tenantId: null,
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
      status: 'ACTIVE'
    },
    create: {
      tenantId: null,
      email: 'admin',
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
      status: 'ACTIVE'
    }
  });

  for (const user of [portalUser, platformAdminUser]) {
    await prisma.userCredential.upsert({
      where: { userId: user.id },
      update: {
        passwordHash: hashPassword(DEFAULT_DEMO_PASSWORD),
        mustResetPassword: false,
        passwordSetAt: new Date()
      },
      create: {
        userId: user.id,
        passwordHash: hashPassword(DEFAULT_DEMO_PASSWORD),
        mustResetPassword: false,
        passwordSetAt: new Date()
      }
    });
  }

  await prisma.userRole.deleteMany({
    where: {
      userId: {
        in: [portalUser.id, platformAdminUser.id]
      }
    }
  });

  await prisma.userRole.createMany({
    data: [
      {
        userId: portalUser.id,
        roleId: memberRole.id,
        tenantId: tenant.id
      },
      {
        userId: platformAdminUser.id,
        roleId: platformAdminRole.id,
        tenantId: null
      }
    ]
  });

  await prisma.userTenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: portalUser.id,
        tenantId: tenant.id
      }
    },
    update: {
      isDefault: true,
      status: 'ACTIVE',
      activatedAt: new Date()
    },
    create: {
      userId: portalUser.id,
      tenantId: tenant.id,
      isDefault: true,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  const legacyTenantAdminUser = await prisma.user.findUnique({
    where: {
      email: 'tenant'
    }
  });

  if (legacyTenantAdminUser) {
    await prisma.user.update({
      where: {
        id: legacyTenantAdminUser.id
      },
      data: {
        tenantId: null,
        isActive: false,
        status: 'DISABLED'
      }
    });

    await prisma.userCredential.deleteMany({
      where: {
        userId: legacyTenantAdminUser.id
      }
    });

    await prisma.userRole.deleteMany({
      where: {
        userId: legacyTenantAdminUser.id
      }
    });

    await prisma.userTenantMembership.deleteMany({
      where: {
        userId: legacyTenantAdminUser.id
      }
    });

    await prisma.userOrganizationUnitAssignment.deleteMany({
      where: {
        userId: legacyTenantAdminUser.id
      }
    });
  }

  await prisma.document.deleteMany({
    where: {
      tenantId: tenant.id,
      storageKey: {
        startsWith: 'documents/blue-horizon-health/'
      }
    }
  });

  for (const [index, document] of mockPortalDocuments.entries()) {
    const storageKey = `documents/blue-horizon-health/${String(index + 1).padStart(2, '0')}-${document.filename}`;
    await writeMockDocument(storageKey, document.filename);

    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        uploadedByUserId: portalUser.id,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: 1024 + index * 37,
        storageKey,
        tags: document.tags,
        status: document.status
      }
    });
  }

  await prisma.notification.deleteMany({
    where: {
      tenantId: tenant.id,
      template: {
        startsWith: 'portal-'
      }
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'EMAIL',
        template: 'portal-welcome-email',
        subject: 'Welcome to Blue Horizon Health',
        body: 'Your portal access is ready. Sign in to review benefits and documents.',
        status: 'SENT',
        sentAt: new Date()
      },
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'IN_APP',
        template: 'portal-document-alert',
        subject: 'New member document available',
        body: 'A new member document is available in your portal.',
        status: 'PENDING'
      },
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'IN_APP',
        template: 'portal-benefits-message',
        subject: 'Benefits summary for specialist visit',
        body: 'Your plan covers specialist visits with a $50 copay when you stay in network.',
        status: 'DELIVERED',
        sentAt: new Date('2026-03-08T09:00:00.000Z')
      },
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'IN_APP',
        template: 'portal-claim-confirmation',
        subject: 'Claim receipt confirmation',
        body: 'We received your supporting documents and will notify you when review is complete.',
        status: 'DELIVERED',
        sentAt: new Date('2026-03-09T15:30:00.000Z')
      },
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'EMAIL',
        template: 'portal-payment-reminder',
        subject: 'Premium payment due soon',
        body: 'Your April premium payment is due on April 1, 2026.',
        status: 'QUEUED'
      },
      {
        tenantId: tenant.id,
        userId: portalUser.id,
        channel: 'IN_APP',
        template: 'portal-wellness-reminder',
        subject: 'Schedule your annual wellness visit',
        body: 'A preventive visit is recommended before June 30 to stay current on care.',
        status: 'DELIVERED',
        sentAt: new Date('2026-03-11T11:15:00.000Z')
      }
    ]
  });

  await prisma.connectorConfig.deleteMany({
    where: {
      tenantId: tenant.id,
      adapterKey: {
        in: ['eligibility-feed', 'claims-feed']
      }
    }
  });

  await prisma.connectorConfig.createMany({
    data: [
      {
        tenantId: tenant.id,
        adapterKey: 'local-file',
        name: 'Primary Eligibility Import',
        status: 'ACTIVE',
        config: {
          directoryPath: '../server/.fixtures/connectors/eligibility'
        },
        lastSyncAt: new Date(),
        lastHealthCheckAt: new Date()
      },
      {
        tenantId: tenant.id,
        adapterKey: 'local-file',
        name: 'Claims Import Connector',
        status: 'DISABLED',
        config: {
          directoryPath: '../server/.fixtures/connectors/claims'
        }
      }
    ]
  });

  await prisma.job.deleteMany({
    where: {
      OR: [
        {
          tenantId: tenant.id,
          type: {
            in: ['seed.notification.send', 'seed.document.process', 'seed.search.index', 'authorization.review']
          }
        },
        {
          tenantId: null,
          type: 'seed.global.maintenance'
        }
      ]
    }
  });

  await prisma.job.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'seed.notification.send',
        payload: {
          channel: 'email',
          recipientId: portalUser.id,
          templateKey: 'welcome'
        },
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3
      },
      {
        tenantId: tenant.id,
        type: 'seed.document.process',
        payload: {
          documentId: 'sample-member-id-card'
        },
        status: 'RUNNING',
        attempts: 1,
        maxAttempts: 3
      },
      {
        tenantId: tenant.id,
        type: 'seed.search.index',
        payload: {
          entityType: 'document',
          entityId: 'sample-member-id-card'
        },
        status: 'FAILED',
        attempts: 3,
        maxAttempts: 3,
        lastError: 'Search service unavailable'
      },
      {
        tenantId: tenant.id,
        type: 'authorization.review',
        payload: {
          service: 'MRI lower back',
          statusLabel: 'Pending review',
          detail: 'Clinical documentation received and under nurse review.'
        },
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3,
        runAt: new Date('2026-03-10T12:00:00.000Z')
      },
      {
        tenantId: tenant.id,
        type: 'authorization.review',
        payload: {
          service: 'Physical therapy',
          statusLabel: 'Approved',
          detail: 'Approved for 12 visits through May 31, 2026.'
        },
        status: 'SUCCEEDED',
        attempts: 1,
        maxAttempts: 3,
        runAt: new Date('2026-02-26T09:00:00.000Z')
      },
      {
        tenantId: tenant.id,
        type: 'authorization.review',
        payload: {
          service: 'Cardiology consultation',
          statusLabel: 'Pending review',
          detail: 'Waiting on specialist notes from referring provider.'
        },
        status: 'RUNNING',
        attempts: 1,
        maxAttempts: 3,
        runAt: new Date('2026-03-12T08:30:00.000Z')
      },
      {
        tenantId: tenant.id,
        type: 'authorization.review',
        payload: {
          service: 'Home sleep study',
          statusLabel: 'Denied',
          detail: 'Additional medical necessity documentation required.'
        },
        status: 'FAILED',
        attempts: 2,
        maxAttempts: 3,
        lastError: 'Missing supporting documentation',
        runAt: new Date('2026-03-05T14:00:00.000Z')
      },
      {
        tenantId: null,
        type: 'seed.global.maintenance',
        payload: {
          scope: 'global'
        },
        status: 'SUCCEEDED',
        attempts: 1,
        maxAttempts: 1
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        actorUserId: platformAdminUser.id,
        action: 'auth.login.success',
        entityType: 'User',
        entityId: platformAdminUser.id,
        metadata: {
          channel: 'admin-console',
          outcome: 'SUCCESS'
        },
        ipAddress: '192.168.10.24',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'
      },
      {
        tenantId: tenant.id,
        actorUserId: portalUser.id,
        action: 'document.uploaded',
        entityType: 'Document',
        entityId: 'sample-member-id-card',
        metadata: {
          category: 'member-document',
          filename: 'member-id-card.pdf'
        },
        ipAddress: '192.168.10.24',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'
      },
      {
        tenantId: tenant.id,
        actorUserId: null,
        action: 'connector.sync.completed',
        entityType: 'Connector',
        entityId: 'eligibility-feed',
        metadata: {
          recordsProcessed: 42,
          status: 'COMPLETED'
        },
        ipAddress: '10.0.0.15',
        userAgent: 'scheduler/1.0'
      }
    ]
  });

  await prisma.featureFlag.upsert({
    where: {
      key_tenantId: {
        key: 'admin-console-enabled',
        tenantId: tenant.id
      }
    },
    update: {
      tenantId: tenant.id,
      name: 'Admin Console Enabled',
      description: 'Enables the administrative console for pilot tenants.',
      enabled: true
    },
    create: {
      tenantId: tenant.id,
      key: 'admin-console-enabled',
      name: 'Admin Console Enabled',
      description: 'Enables the administrative console for pilot tenants.',
      enabled: true
    }
  });

  const memberPluginFlag = await prisma.featureFlag.findFirst({
    where: {
      key: 'plugins.member.enabled',
      tenantId: null
    }
  });

  if (memberPluginFlag) {
    await prisma.featureFlag.update({
      where: {
        id: memberPluginFlag.id
      },
      data: {
        name: 'Member Plugin Enabled',
        description: 'Enables the member plugin in the portal shell.',
        enabled: true
      }
    });
  } else {
    await prisma.featureFlag.create({
      data: {
        key: 'plugins.member.enabled',
        name: 'Member Plugin Enabled',
        description: 'Enables the member plugin in the portal shell.',
        enabled: true
      }
    });
  }

  await seedTestProviderTenant(prisma);
  await syncUserTenantMemberships();
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
const DEFAULT_MEMBER_LOGIN = 'maria';
