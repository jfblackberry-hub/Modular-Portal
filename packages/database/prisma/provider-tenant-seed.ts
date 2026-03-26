import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, scryptSync } from 'node:crypto';
import path from 'node:path';

import type { PrismaClient } from '@prisma/client';

const apiStorageDir = path.resolve(process.cwd(), '../../storage');
const DEFAULT_PROVIDER_PASSWORD = 'demo12345';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function syncTenantTypeDefinitions(prisma: PrismaClient) {
  await Promise.all(
    [
      ['PAYER', 'PAYER', 'Payer'],
      ['PROVIDER', 'PROVIDER', 'Provider'],
      ['EMPLOYER', 'EMPLOYER', 'Employer'],
      ['BROKER', 'BROKER', 'Broker'],
      ['MEMBER', 'MEMBER', 'Member']
    ].map(([code, enumValue, name]) =>
      prisma.tenantTypeDefinition.upsert({
        where: { code },
        update: {
          enumValue: enumValue as 'PAYER' | 'PROVIDER' | 'EMPLOYER' | 'BROKER' | 'MEMBER',
          name
        },
        create: {
          code,
          enumValue: enumValue as 'PAYER' | 'PROVIDER' | 'EMPLOYER' | 'BROKER' | 'MEMBER',
          name
        }
      })
    )
  );
}

async function writeProviderMockDocument(storageKey: string, title: string) {
  const outputPath = path.join(apiStorageDir, storageKey);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `Synthetic provider document for NorthStar Medical Group\nTitle: ${title}\nGenerated for provider tenant POC testing.\n`
  );
}

export const TEST_PROVIDER_TENANT = {
  name: 'NorthStar Medical Group',
  slug: 'northstar-medical-group',
  type: 'PROVIDER' as const,
  status: 'ACTIVE' as const,
  branding: {
    displayName: 'NorthStar Medical Group',
    primaryColor: '#0f766e',
    secondaryColor: '#f8fafc',
    logoUrl: '/logos/northstar-medical-group.svg',
    faviconUrl: '/logos/northstar-medical-group-favicon.ico'
  },
  purchasedModules: [
    'provider_operations'
  ] as const,
  organizationUnits: {
    enterprise: 'NorthStar Medical Group',
    region: 'Southeast Region',
    locations: {
      flint: 'Flint Clinic',
      lansing: 'Lansing Clinic'
    },
    departments: {
      primaryCare: 'Primary Care',
      cardiology: 'Cardiology',
      revenueCycle: 'Revenue Cycle'
    }
  },
  contacts: {
    supportEmail: 'support@northstarmedical.local',
    adminEmail: 'tenant-admin@northstarmedical.local',
    providerEmail: 'dr.lee@northstarmedical.local'
  },
  sampleLoginUsers: {
    physician: {
      label: 'Provider tenant Physician',
      email: 'dr.lee@northstarmedical.local'
    },
    staff: {
      label: 'Provider tenant Staff',
      email: 'support.user@northstarmedical.local'
    }
  },
  providerDemoData: {
    displayName: 'NorthStar Medical Group Provider Portal',
    providerContext: {
      practiceName: 'NorthStar Medical Group',
      providerName: 'Jordan Lee, MD',
      npi: '1881234567',
      tin: '38-7654321',
      locations: [
        { id: 'flint-clinic', label: 'Flint Clinic' },
        { id: 'lansing-clinic', label: 'Lansing Clinic' }
      ],
      selectedLocationId: 'flint-clinic'
    },
    providerOperations: {
      personaWidgetMappings: [
        {
          persona: 'clinic_manager',
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
      ],
      widgetData: {
        scheduling: {
          summary: '28 visits scheduled today',
          detail: 'Operational scheduling workload anchored to the signed-in organization unit.',
          highlights: [
            '6 same-day appointment requests awaiting slot confirmation',
            '4 pre-visit eligibility checks must clear before noon',
            '2 provider templates need overbook approval'
          ],
          tone: 'info',
          href: '/provider/dashboard',
          ctaLabel: 'Review scheduling priorities'
        },
        authorizations: {
          summary: '11 authorization requests in flight',
          detail: 'Track clinical attachments, pending determinations, and follow-up deadlines.',
          highlights: [
            '3 requests need updated chart notes today',
            '2 determinations are due before 3 PM ET',
            '1 denial is staged for appeal review'
          ],
          tone: 'warning',
          href: '/provider/authorizations',
          ctaLabel: 'Open authorizations queue'
        },
        claims: {
          summary: '19 claims need follow-up',
          detail: 'Monitor claim edits, adjudication exceptions, and denial risk across the queue.',
          highlights: [
            '5 claims approach timely filing thresholds',
            '3 corrected claims are waiting on coding review',
            '2 denials need supporting documentation'
          ],
          tone: 'danger',
          href: '/provider/claims',
          ctaLabel: 'Open claims follow-up'
        },
        billing: {
          summary: '$84,220 posted today',
          detail: 'Billing and remittance progress for the current operational cycle.',
          highlights: [
            '8 remits posted since the morning batch',
            '2 EFT files remain unreconciled',
            '1 payment variance needs revenue-cycle escalation'
          ],
          tone: 'success',
          href: '/provider/payments',
          ctaLabel: 'Open billing and payments'
        },
        utilization: {
          summary: '87% utilization target attainment',
          detail: 'Leadership signal for queue balance, throughput, and exception volume.',
          highlights: [
            'Eligibility response times improved 8% today',
            'Authorization backlog is holding steady vs yesterday',
            'Claims closure rate is trending ahead of goal'
          ],
          tone: 'default',
          href: '/provider/dashboard',
          ctaLabel: 'Review utilization'
        }
      }
    },
    messagesModule: {
      inbox: [
        {
          id: 'northstar-msg-auth-1',
          subject: 'Additional records needed for PA-NSMG-1042',
          preview: 'Cardiology request needs the latest echo and progress note.',
          body: 'Please upload the latest echocardiogram and cardiology progress note for PA-NSMG-1042 before 4:00 PM ET so review can continue without delay.',
          category: 'Authorization Updates',
          date: '2026-03-21',
          unread: true,
          actionRequired: true,
          priority: 'High'
        },
        {
          id: 'northstar-msg-claims-1',
          subject: 'Claim CLM-NSMG-8841 paid with adjustment',
          preview: 'ERA is available and one line was reduced for modifier validation.',
          body: 'Claim CLM-NSMG-8841 was paid. Please review the ERA adjustment on line 2 related to modifier validation and determine whether follow-up is needed.',
          category: 'Claims / Payment Notices',
          date: '2026-03-20',
          unread: true,
          actionRequired: true,
          priority: 'Medium'
        },
        {
          id: 'northstar-msg-eligibility-1',
          subject: 'Eligibility inquiry spike detected at Flint Clinic',
          preview: 'Front desk activity increased this morning due to new patient intake.',
          body: 'Eligibility inquiries are running 18% above baseline at Flint Clinic this morning. Use the quick eligibility workflow for same-day verification.',
          category: 'Operational Updates',
          date: '2026-03-20',
          unread: false,
          actionRequired: false,
          priority: 'Low'
        }
      ],
      announcements: [
        {
          id: 'northstar-ann-1',
          title: 'NorthStar weekly operations note',
          message: 'Revenue cycle review is scheduled for Friday at 2:30 PM ET. Bring aged claims questions and denial trends.',
          type: 'info',
          date: '2026-03-21'
        }
      ]
    },
    providerResources: [
      {
        id: 'northstar-provider-manual',
        category: 'Manuals',
        title: 'NorthStar Provider Operations Playbook',
        type: 'Manual',
        description: 'NorthStar-specific intake, auth escalation, billing, and support guidance for practice teams.',
        tags: ['northstar', 'operations', 'provider'],
        lineOfBusinessApplicability: ['Medical'],
        lastUpdated: '2026-03-18',
        linkTarget: '/provider/documents',
        linkType: 'internal'
      },
      {
        id: 'northstar-claims-grid',
        category: 'Claims Resources',
        title: 'Claims Edits and Resubmission Grid',
        type: 'Reference',
        description: 'Common claim edit patterns for NorthStar primary care and cardiology billing teams.',
        tags: ['claims', 'edits', 'resubmission'],
        lineOfBusinessApplicability: ['Medical'],
        lastUpdated: '2026-03-19',
        linkTarget: '/provider/claims',
        linkType: 'internal'
      }
    ],
    supportModule: {
      quickLinks: [
        {
          id: 'northstar-rep-phone',
          label: 'Provider Ops',
          value: '1-800-555-0114',
          href: '/provider/support'
        },
        {
          id: 'northstar-rep-email',
          label: 'Escalations',
          value: 'provider-ops@northstarmedical.local',
          href: '/provider/support'
        }
      ]
    },
    demoData: {
      eligibilityResults: [
        {
          member: 'Elena Vasquez',
          memberId: 'NS-100482',
          plan: 'Blue Horizon PPO Plus',
          status: 'Active'
        },
        {
          member: 'Marcus Hill',
          memberId: 'NS-100511',
          plan: 'Blue Horizon HMO Select',
          status: 'Pending Review'
        }
      ],
      trackedAuthorizations: [
        {
          status: 'More Info Needed',
          submittedDate: '2026-03-20',
          referenceNumber: 'PA-NSMG-1042',
          patient: 'Elena Vasquez',
          service: 'Cardiac stress echo',
          decision: 'Upload prior diagnostic imaging',
          nextAction: 'Attach echo and office notes'
        },
        {
          status: 'Submitted',
          submittedDate: '2026-03-19',
          referenceNumber: 'PA-NSMG-1036',
          patient: 'Marcus Hill',
          service: 'Lumbar MRI',
          decision: 'Pending clinical review',
          nextAction: 'Monitor payer response'
        }
      ],
      referrals: [
        {
          reference: 'RF-NS-2207',
          patient: 'Elena Vasquez',
          specialty: 'Cardiology',
          status: 'In Review',
          submittedDate: '2026-03-20'
        },
        {
          reference: 'RF-NS-2198',
          patient: 'Marcus Hill',
          specialty: 'Physical Medicine',
          status: 'Approved',
          submittedDate: '2026-03-18'
        }
      ],
      claimsRows: [
        {
          claimNumber: 'CLM-NSMG-8841',
          patient: 'Elena Vasquez',
          memberId: 'NS-100482',
          serviceDate: '2026-03-16',
          billedAmount: '$1,480.00',
          allowedAmount: '$1,120.00',
          paidAmount: '$920.00',
          status: 'Paid',
          billingProvider: 'NorthStar Medical Group - Flint Clinic',
          renderingProvider: 'Jordan Lee, MD'
        },
        {
          claimNumber: 'CLM-NSMG-8817',
          patient: 'Marcus Hill',
          memberId: 'NS-100511',
          serviceDate: '2026-03-14',
          billedAmount: '$640.00',
          allowedAmount: '$0.00',
          paidAmount: '$0.00',
          status: 'More Info Needed',
          billingProvider: 'NorthStar Medical Group - Lansing Clinic',
          renderingProvider: 'Avery Patel, MD'
        }
      ],
      paymentRows: [
        {
          remitId: 'REM-NS-4410',
          paymentDate: '2026-03-20',
          paymentAmount: '$39,420.00',
          method: 'EFT',
          eftEra: 'ERA linked / EFT linked',
          status: 'Posted'
        },
        {
          remitId: 'REM-NS-4394',
          paymentDate: '2026-03-18',
          paymentAmount: '$12,805.00',
          method: 'Check',
          eftEra: 'ERA linked / Check remittance',
          status: 'Pending'
        }
      ],
      dashboardMetrics: [
        {
          label: 'Eligibility Checks Today',
          value: '27',
          trend: '9 from Flint, 18 from Lansing',
          trendTone: 'positive'
        },
        {
          label: 'Pending Authorizations',
          value: '6',
          trend: '2 need attachments today',
          trendTone: 'negative'
        },
        {
          label: 'Claims Requiring Follow-Up',
          value: '8',
          trend: '3 over 14 days old',
          trendTone: 'negative'
        },
        {
          label: 'Payments Posted Today',
          value: '3',
          trend: '$39,420 total',
          trendTone: 'positive'
        }
      ],
      dashboardAuthorizationQueue: [
        {
          authId: 'PA-NSMG-1042',
          patientName: 'Elena Vasquez',
          date: '2026-03-20',
          status: 'Needs Info',
          nextAction: 'Upload clinical attachments'
        },
        {
          authId: 'PA-NSMG-1036',
          patientName: 'Marcus Hill',
          date: '2026-03-19',
          status: 'Pending',
          nextAction: 'Watch clinical review SLA'
        }
      ],
      dashboardClaimsQueue: [
        {
          claimId: 'CLM-NSMG-8817',
          patientName: 'Marcus Hill',
          date: '2026-03-14',
          status: 'Needs Info',
          nextAction: 'Send operative note and modifier detail'
        },
        {
          claimId: 'CLM-NSMG-8788',
          patientName: 'Naomi Foster',
          date: '2026-03-11',
          status: 'Follow Up Required',
          nextAction: 'Review denial and appeal window'
        }
      ],
      dashboardAlerts: [
        {
          id: 'northstar-alert-auth',
          type: 'warning',
          message: 'Two cardiology requests need documentation before noon to avoid review delay.',
          status: 'Action Required',
          date: '2026-03-21'
        },
        {
          id: 'northstar-alert-payments',
          type: 'success',
          message: 'ERA files for the latest EFT batch are now available for billing reconciliation.',
          status: 'Posted',
          date: '2026-03-20'
        }
      ],
      dashboardNotices: [
        {
          id: 'northstar-notice-1',
          title: 'System Notice',
          message: 'Eligibility service latency may rise during the nightly member sync between 10:00 PM and 11:00 PM ET.',
          date: '2026-03-21'
        }
      ],
      dashboardResources: [
        {
          label: 'Auth Attachment Checklist',
          href: '/provider/documents',
          description: 'NorthStar documentation checklist for prior auth review'
        },
        {
          label: 'Revenue Cycle Escalation Guide',
          href: '/provider/support',
          description: 'Claims and payment escalation contacts'
        }
      ]
    }
  },
  users: {
    tenantAdmin: {
      email: 'tenant-admin@northstarmedical.local',
      firstName: 'Taylor',
      lastName: 'Morgan',
      roleCode: 'tenant_admin',
      roleName: 'Tenant Admin',
      permissionCodes: [
        'tenant.view',
        'user.manage',
        'provider.view',
        'provider.eligibility.view',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      isTenantAdmin: true
    },
    clinicManager: {
      email: 'dr.lee@northstarmedical.local',
      firstName: 'Jordan',
      lastName: 'Lee',
      roleCode: 'clinic_manager',
      roleName: 'Clinic Manager',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.authorizations.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      isTenantAdmin: false
    },
    authorizationSpecialist: {
      email: 'authorizations@northstarmedical.local',
      firstName: 'Avery',
      lastName: 'Patel',
      roleCode: 'authorization_specialist',
      roleName: 'Authorization Specialist',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.authorizations.view',
        'provider.documents.view',
        'provider.messages.view'
      ],
      isTenantAdmin: false
    },
    billingSpecialist: {
      email: 'billing@northstarmedical.local',
      firstName: 'Casey',
      lastName: 'Nguyen',
      roleCode: 'billing_specialist',
      roleName: 'Billing Specialist',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.claims.view',
        'provider.documents.view',
        'provider.messages.view'
      ],
      isTenantAdmin: false
    },
    eligibilityCoordinator: {
      email: 'eligibility@northstarmedical.local',
      firstName: 'Morgan',
      lastName: 'Reed',
      roleCode: 'eligibility_coordinator',
      roleName: 'Eligibility Coordinator',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.eligibility.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      isTenantAdmin: false
    },
    providerSupport: {
      email: 'support.user@northstarmedical.local',
      firstName: 'Riley',
      lastName: 'Brooks',
      roleCode: 'provider_support',
      roleName: 'Provider Support User',
      permissionCodes: [
        'tenant.view',
        'provider.view',
        'provider.documents.view',
        'provider.messages.view',
        'provider.support.view'
      ],
      isTenantAdmin: false
    }
  }
};

export async function seedTestProviderTenant(prisma: PrismaClient) {
  await syncTenantTypeDefinitions(prisma);
  const tenant = await prisma.tenant.upsert({
    where: {
      slug: TEST_PROVIDER_TENANT.slug
    },
    update: {
      name: TEST_PROVIDER_TENANT.name,
      status: TEST_PROVIDER_TENANT.status,
      type: TEST_PROVIDER_TENANT.type,
      tenantTypeCode: TEST_PROVIDER_TENANT.type,
      isActive: true,
      brandingConfig: {
        displayName: TEST_PROVIDER_TENANT.branding.displayName,
        primaryColor: TEST_PROVIDER_TENANT.branding.primaryColor,
        secondaryColor: TEST_PROVIDER_TENANT.branding.secondaryColor,
        logoUrl: TEST_PROVIDER_TENANT.branding.logoUrl,
        faviconUrl: TEST_PROVIDER_TENANT.branding.faviconUrl,
        organizationKind: 'medical_group',
        providerOrganizationType: 'multi_specialty',
        supportEmail: TEST_PROVIDER_TENANT.contacts.supportEmail,
        purchasedModules: [...TEST_PROVIDER_TENANT.purchasedModules],
        providerDemoData: TEST_PROVIDER_TENANT.providerDemoData
      }
    },
    create: {
      name: TEST_PROVIDER_TENANT.name,
      slug: TEST_PROVIDER_TENANT.slug,
      status: TEST_PROVIDER_TENANT.status,
      type: TEST_PROVIDER_TENANT.type,
      tenantTypeCode: TEST_PROVIDER_TENANT.type,
      isActive: true,
      brandingConfig: {
        displayName: TEST_PROVIDER_TENANT.branding.displayName,
        primaryColor: TEST_PROVIDER_TENANT.branding.primaryColor,
        secondaryColor: TEST_PROVIDER_TENANT.branding.secondaryColor,
        logoUrl: TEST_PROVIDER_TENANT.branding.logoUrl,
        faviconUrl: TEST_PROVIDER_TENANT.branding.faviconUrl,
        organizationKind: 'medical_group',
        providerOrganizationType: 'multi_specialty',
        supportEmail: TEST_PROVIDER_TENANT.contacts.supportEmail,
        purchasedModules: [...TEST_PROVIDER_TENANT.purchasedModules],
        providerDemoData: TEST_PROVIDER_TENANT.providerDemoData
      }
    }
  });

  await prisma.tenantBranding.upsert({
    where: {
      tenantId: tenant.id
    },
    update: TEST_PROVIDER_TENANT.branding,
    create: {
      tenantId: tenant.id,
      ...TEST_PROVIDER_TENANT.branding
    }
  });

  const permissions = await Promise.all(
    [
      {
        code: 'tenant.view',
        name: 'View Tenants',
        description: 'Allows viewing tenant-scoped records.'
      },
      {
        code: 'user.manage',
        name: 'Manage Users',
        description: 'Allows creating and updating user records.'
      },
      {
        code: 'provider.view',
        name: 'View Provider Portal',
        description: 'Allows access to provider-facing portal experiences.'
      },
      {
        code: 'provider.eligibility.view',
        name: 'View Provider Eligibility',
        description: 'Allows access to provider eligibility workflows.'
      },
      {
        code: 'provider.authorizations.view',
        name: 'View Provider Authorizations',
        description: 'Allows access to provider authorization workflows.'
      },
      {
        code: 'provider.claims.view',
        name: 'View Provider Claims',
        description: 'Allows access to provider claims and payments workflows.'
      },
      {
        code: 'provider.documents.view',
        name: 'View Provider Documents',
        description: 'Allows access to provider documents and resources.'
      },
      {
        code: 'provider.messages.view',
        name: 'View Provider Messages',
        description: 'Allows access to provider messages and notices.'
      },
      {
        code: 'provider.support.view',
        name: 'View Provider Support',
        description: 'Allows access to provider support resources.'
      },
      {
        code: 'provider.patients.view',
        name: 'View Provider Patients',
        description: 'Allows access to provider patient roster workflows.'
      },
      {
        code: 'provider.admin.manage',
        name: 'Manage Provider Administration',
        description: 'Allows access to provider administration workflows.'
      }
    ].map((permission) =>
      prisma.permission.upsert({
        where: {
          code: permission.code
        },
        update: {
          name: permission.name,
          description: permission.description
        },
        create: permission
      })
    )
  );

  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));
  const seededUsers = {} as Record<string, Awaited<ReturnType<typeof prisma.user.upsert>>>;

  for (const [key, seedUser] of Object.entries(TEST_PROVIDER_TENANT.users)) {
    const role = await prisma.role.upsert({
      where: {
        code: seedUser.roleCode
      },
      update: {
        tenantTypeCode:
          seedUser.roleCode === 'tenant_admin' ? null : TEST_PROVIDER_TENANT.type,
        appliesToAllTenantTypes: seedUser.roleCode === 'tenant_admin',
        name: seedUser.roleName,
        description: `${seedUser.roleName} role for seeded provider tenant operations.`
      },
      create: {
        code: seedUser.roleCode,
        tenantTypeCode:
          seedUser.roleCode === 'tenant_admin' ? null : TEST_PROVIDER_TENANT.type,
        appliesToAllTenantTypes: seedUser.roleCode === 'tenant_admin',
        name: seedUser.roleName,
        description: `${seedUser.roleName} role for seeded provider tenant operations.`
      }
    });

    for (const permissionCode of seedUser.permissionCodes) {
      const permission = permissionByCode.get(permissionCode);

      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }

    const user = await prisma.user.upsert({
      where: {
        email: seedUser.email
      },
      update: {
        tenantId: tenant.id,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        isActive: true,
        status: 'ACTIVE'
      },
      create: {
        tenantId: tenant.id,
        email: seedUser.email,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        isActive: true,
        status: 'ACTIVE'
      }
    });

    await prisma.userCredential.upsert({
      where: { userId: user.id },
      update: {
        passwordHash: hashPassword(DEFAULT_PROVIDER_PASSWORD),
        mustResetPassword: false,
        passwordSetAt: new Date()
      },
      create: {
        userId: user.id,
        passwordHash: hashPassword(DEFAULT_PROVIDER_PASSWORD),
        mustResetPassword: false,
        passwordSetAt: new Date()
      }
    });

    await prisma.userRole.deleteMany({
      where: {
        userId: user.id,
        roleId: role.id,
        tenantId: tenant.id
      }
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        tenantId: tenant.id
      }
    });

    await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id
        }
      },
      update: {
        isDefault: true,
        isTenantAdmin: seedUser.isTenantAdmin,
        status: 'ACTIVE',
        activatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        isDefault: true,
        isTenantAdmin: seedUser.isTenantAdmin,
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    });

    seededUsers[key] = user;
  }

  await prisma.organizationUnit.deleteMany({
    where: {
      tenantId: tenant.id
    }
  });

  const enterprise = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: null,
      type: 'ENTERPRISE',
      name: TEST_PROVIDER_TENANT.organizationUnits.enterprise
    }
  });

  const region = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: enterprise.id,
      type: 'REGION',
      name: TEST_PROVIDER_TENANT.organizationUnits.region
    }
  });

  const flintClinic = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: region.id,
      type: 'LOCATION',
      name: TEST_PROVIDER_TENANT.organizationUnits.locations.flint
    }
  });

  const lansingClinic = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: region.id,
      type: 'LOCATION',
      name: TEST_PROVIDER_TENANT.organizationUnits.locations.lansing
    }
  });

  const flintPrimaryCare = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: flintClinic.id,
      type: 'DEPARTMENT',
      name: TEST_PROVIDER_TENANT.organizationUnits.departments.primaryCare
    }
  });

  const flintCardiology = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: flintClinic.id,
      type: 'DEPARTMENT',
      name: TEST_PROVIDER_TENANT.organizationUnits.departments.cardiology
    }
  });

  const lansingRevenueCycle = await prisma.organizationUnit.create({
    data: {
      tenantId: tenant.id,
      parentId: lansingClinic.id,
      type: 'DEPARTMENT',
      name: TEST_PROVIDER_TENANT.organizationUnits.departments.revenueCycle
    }
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
      description: 'Enables the administrative console for seeded test tenants.',
      enabled: true
    },
    create: {
      tenantId: tenant.id,
      key: 'admin-console-enabled',
      name: 'Admin Console Enabled',
      description: 'Enables the administrative console for seeded test tenants.',
      enabled: true
    }
  });

  const documentOwner = seededUsers.clinicManager ?? seededUsers.tenantAdmin;

  await prisma.document.deleteMany({
    where: {
      tenantId: tenant.id,
      storageKey: {
        startsWith: 'documents/northstar-medical-group/'
      }
    }
  });

  const providerDocuments = [
    {
      filename: 'northstar-auth-attachment-checklist.pdf',
      mimeType: 'application/pdf',
      storageKey: 'documents/northstar-medical-group/01-auth-attachment-checklist.pdf',
      tags: {
        title: 'Authorization Attachment Checklist',
        documentType: 'provider-resource'
      }
    },
    {
      filename: 'northstar-claims-edit-grid.pdf',
      mimeType: 'application/pdf',
      storageKey: 'documents/northstar-medical-group/02-claims-edit-grid.pdf',
      tags: {
        title: 'Claims Edit and Resubmission Grid',
        documentType: 'claims-resource'
      }
    },
    {
      filename: 'northstar-remittance-summary.txt',
      mimeType: 'text/plain',
      storageKey: 'documents/northstar-medical-group/03-remittance-summary.txt',
      tags: {
        title: 'Weekly Remittance Summary',
        documentType: 'payment-resource'
      }
    }
  ];

  for (const document of providerDocuments) {
    await writeProviderMockDocument(document.storageKey, String(document.tags.title));
    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        uploadedByUserId: documentOwner.id,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: 2048,
        storageKey: document.storageKey,
        tags: document.tags,
        status: 'AVAILABLE'
      }
    });
  }

  await prisma.notification.deleteMany({
    where: {
      tenantId: tenant.id,
      template: {
        in: [
          'provider-auth-followup',
          'provider-claim-followup',
          'provider-support-update'
        ]
      }
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: seededUsers.authorizationSpecialist.id,
        channel: 'IN_APP',
        template: 'provider-auth-followup',
        subject: 'Authorization follow-up required',
        body: 'PA-NSMG-1042 requires clinical attachments before review can continue.',
        status: 'DELIVERED',
        sentAt: new Date('2026-03-21T13:15:00.000Z')
      },
      {
        tenantId: tenant.id,
        userId: seededUsers.billingSpecialist.id,
        channel: 'IN_APP',
        template: 'provider-claim-followup',
        subject: 'Claim follow-up required',
        body: 'Claim CLM-NSMG-8817 needs operative note and modifier detail.',
        status: 'DELIVERED',
        sentAt: new Date('2026-03-20T15:40:00.000Z')
      },
      {
        tenantId: tenant.id,
        userId: seededUsers.providerSupport.id,
        channel: 'EMAIL',
        template: 'provider-support-update',
        subject: 'Support escalation update',
        body: 'Revenue cycle escalation guidance has been updated for NorthStar clinic teams.',
        status: 'SENT',
        sentAt: new Date('2026-03-20T10:10:00.000Z')
      }
    ]
  });

  await prisma.connectorConfig.deleteMany({
    where: {
      tenantId: tenant.id,
      adapterKey: {
        in: ['northstar-eligibility-feed', 'northstar-claims-feed']
      }
    }
  });

  await prisma.connectorConfig.createMany({
    data: [
      {
        tenantId: tenant.id,
        adapterKey: 'northstar-eligibility-feed',
        name: 'NorthStar Eligibility Feed',
        status: 'ACTIVE',
        config: {
          endpoint: 'https://synthetic.provider.local/eligibility',
          mode: 'synthetic-demo'
        },
        lastSyncAt: new Date('2026-03-21T11:00:00.000Z'),
        lastHealthCheckAt: new Date('2026-03-21T11:00:00.000Z')
      },
      {
        tenantId: tenant.id,
        adapterKey: 'northstar-claims-feed',
        name: 'NorthStar Claims Work Queue',
        status: 'ACTIVE',
        config: {
          endpoint: 'https://synthetic.provider.local/claims',
          mode: 'synthetic-demo'
        },
        lastSyncAt: new Date('2026-03-21T11:15:00.000Z'),
        lastHealthCheckAt: new Date('2026-03-21T11:15:00.000Z')
      }
    ]
  });

  await prisma.job.deleteMany({
    where: {
      tenantId: tenant.id,
      type: {
        in: ['provider.authorization.review', 'provider.claim.followup', 'provider.support.case']
      }
    }
  });

  await prisma.job.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'provider.authorization.review',
        payload: {
          referenceNumber: 'PA-NSMG-1042',
          patient: 'Elena Vasquez',
          status: 'Needs Info'
        },
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3
      },
      {
        tenantId: tenant.id,
        type: 'provider.claim.followup',
        payload: {
          claimNumber: 'CLM-NSMG-8817',
          patient: 'Marcus Hill',
          status: 'Needs Info'
        },
        status: 'RUNNING',
        attempts: 1,
        maxAttempts: 3
      },
      {
        tenantId: tenant.id,
        type: 'provider.support.case',
        payload: {
          caseNumber: 'SUP-NS-20260321',
          topic: 'ERA reconciliation',
          status: 'Open'
        },
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3
      }
    ]
  });

  await prisma.featureFlag.upsert({
    where: {
      key_tenantId: {
        key: 'plugins.provider.enabled',
        tenantId: tenant.id
      }
    },
    update: {
      tenantId: tenant.id,
      key: 'plugins.provider.enabled',
      name: 'Provider Plugin Enabled',
      description: 'Enables provider capability composition for the seeded provider tenant.',
      enabled: true
    },
    create: {
      tenantId: tenant.id,
      key: 'plugins.provider.enabled',
      name: 'Provider Plugin Enabled',
      description: 'Enables provider capability composition for the seeded provider tenant.',
      enabled: true
    }
  });

  return {
    tenant,
    users: {
      ...seededUsers
    },
    organizationUnits: {
      enterprise,
      region,
      flintClinic,
      lansingClinic,
      flintPrimaryCare,
      flintCardiology,
      lansingRevenueCycle
    }
  };
}
