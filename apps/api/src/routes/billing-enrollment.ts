import { prisma } from '@payer-portal/database';
import {
  addDependentExperienceRecord,
  comparePlans,
  completeEnrollment,
  createEnrollmentDraft,
  generateCorrespondenceNotice,
  HouseholdScopeError,
  getBillingCurrentBalance,
  getBillingEnrollmentModuleConfigForTenant,
  getBillingEnrollmentWorkspaceSnapshot,
  getBillingExperienceSnapshot,
  getCorrespondenceNoticeDetail,
  getDelinquencyAndGracePeriod,
  getDependentsExperience,
  getDocumentCenterExperience,
  getDocumentRequirementHooks,
  getEnrollmentStatusTracker,
  getInvoiceDetail,
  getNextPremiumInvoice,
  getReconciliationStatusHooks,
  getShopPlans,
  getSupportCenterExperience,
  listCorrespondenceCenter,
  listPaymentHistory,
  listPaymentMethods,
  listPremiumInvoices,
  listStatementsAndTaxDocuments,
  makeBillingPayment,
  manageHouseholdDependents,
  markCorrespondenceNoticeRead,
  removeDependentExperienceRecord,
  renewCoverage,
  reportLifeEvent,
  saveEnrollmentStep,
  savePaymentMethodToken,
  startEnrollmentOrchestration,
  submitEnrollment,
  submitLifeEventWorkflow,
  submitPremiumPayment,
  updateAutopayEnrollment,
  updateDependentExperienceRecord,
  uploadDocumentForDocumentCenter,
  uploadRequiredDocumentHook,
  verifyEligibility
} from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';

type StartEnrollmentBody = {
  householdId: string;
  planId: string;
  effectiveDate: string;
};

type SubmitPaymentBody = {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
};

type MakeBillingPaymentBody = {
  billingAccountId: string;
  invoiceId: string;
  paymentMethodTokenId: string;
  amount: number;
};

type SavePaymentMethodBody = {
  type: 'card' | 'bank_account';
  maskedLabel: string;
  brand?: string;
};

type UpdateAutopayBody = {
  enabled: boolean;
  paymentMethodTokenId?: string;
};

type SubmitLifeEventBody = {
  eventType: string;
  householdId: string;
  eventDate: string;
};

type SendNoticeBody = {
  templateKey: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  recipientId: string;
};

type ComparePlansBody = {
  planIds: string[];
};

type DraftEnrollmentBody = {
  householdId: string;
  planId: string;
  effectiveDate: string;
};

type SaveStepBody = {
  completionPercent: number;
  selectedPlanId?: string;
  effectiveDate?: string;
};

type SubmitEnrollmentBody = {
  effectiveDate: string;
};

type RenewCoverageBody = {
  householdId: string;
  renewalYear: number;
  selectedPlanId?: string;
};

type LifeEventReportBody = {
  eventType: string;
  eventDate: string;
  description?: string;
};

type ManageDependentsBody = {
  dependents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
  }>;
};

type VerifyEligibilityBody = {
  householdId: string;
  requestedEffectiveDate: string;
  selectedPlanId?: string;
};

type UploadDocumentHookBody = {
  requirementId: string;
  documentName: string;
};

type DependentChangeBody = {
  householdId: string;
  firstName: string;
  lastName: string;
  dob: string;
  relationship: 'spouse' | 'child' | 'other';
  relationshipDetail: string;
};

type UploadDocumentCenterBody = {
  requestId: string;
  documentName: string;
};

type EmployerEmployeeRecord = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  location: string;
  status: 'Active' | 'Terminated' | 'Pending Enrollment' | 'Waived';
  coverageStatus: 'Enrolled' | 'Pending' | 'Waived' | 'Terminated';
  coverageType: 'Employee Only' | 'Employee + Spouse' | 'Employee + Child(ren)' | 'Family' | 'Waived';
  planSelection: string;
  effectiveDate: string;
  terminationDate?: string;
  eligibilityStatus: 'Eligible' | 'Pending Review' | 'Ineligible';
  dependents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: 'Spouse' | 'Child' | 'Other';
    dateOfBirth: string;
    coverageStatus: 'Covered' | 'Pending' | 'Not Covered';
  }>;
  enrollmentHistory: Array<{
    id: string;
    planName: string;
    coverageType: 'Employee Only' | 'Employee + Spouse' | 'Employee + Child(ren)' | 'Family' | 'Waived';
    status: 'Active' | 'Terminated' | 'Pending' | 'Waived';
    effectiveDate: string;
    endDate?: string;
    source: 'Open Enrollment' | 'Life Event' | 'New Hire' | 'Manual Update';
  }>;
  lifeEvents: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    status: 'Approved' | 'Pending' | 'Denied';
  }>;
  billingImpact: {
    monthlyEmployerContribution: number;
    monthlyEmployeeContribution: number;
    notes: string;
  };
};

function mapNotificationStatusToEnrollmentStatus(
  status: string
): 'Pending' | 'In Progress' | 'Needs Correction' | 'Completed' | 'Error' {
  const normalized = status.toUpperCase();
  if (normalized === 'FAILED') {
    return 'Error';
  }
  if (normalized === 'CORRECTION_REQUIRED') {
    return 'Needs Correction';
  }
  if (normalized === 'QUEUED' || normalized === 'REQUESTED') {
    return 'Pending';
  }
  if (normalized === 'SENT') {
    return 'Completed';
  }
  return 'In Progress';
}

function mapTemplateToRequestType(template: string) {
  const normalized = template.toLowerCase();
  if (normalized.includes('new_hire') || normalized.includes('new-hire')) {
    return 'New Hire Enrollment';
  }
  if (normalized.includes('open_enrollment') || normalized.includes('renewal')) {
    return 'Open Enrollment Change';
  }
  if (normalized.includes('life_event') || normalized.includes('life-event')) {
    return 'Qualifying Life Event Change';
  }
  if (normalized.includes('dependent_add')) {
    return 'Dependent Add';
  }
  if (normalized.includes('dependent_remove')) {
    return 'Dependent Removal';
  }
  if (normalized.includes('termination')) {
    return 'Coverage Termination';
  }
  if (normalized.includes('reinstatement')) {
    return 'Reinstatement';
  }

  return 'Open Enrollment Change';
}

function employeeCoverageTypeByIndex(index: number): EmployerEmployeeRecord['coverageType'] {
  const types: EmployerEmployeeRecord['coverageType'][] = [
    'Employee Only',
    'Employee + Spouse',
    'Employee + Child(ren)',
    'Family',
    'Waived'
  ];
  return types[index % types.length];
}

function mapUserToEmployeeRecord(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    roles: Array<{ role: { code: string } }>;
    lastLoginAt: Date | null;
  },
  index: number
): EmployerEmployeeRecord {
  const hasMemberRole = user.roles.some(({ role }) => role.code === 'member');
  const coverageType = employeeCoverageTypeByIndex(index);
  const status: EmployerEmployeeRecord['status'] = !user.isActive
    ? 'Terminated'
    : hasMemberRole
      ? 'Active'
      : 'Pending Enrollment';

  const coverageStatus: EmployerEmployeeRecord['coverageStatus'] = !user.isActive
    ? 'Terminated'
    : hasMemberRole
      ? coverageType === 'Waived'
        ? 'Waived'
        : 'Enrolled'
      : 'Pending';

  const baseDate = user.lastLoginAt ?? new Date();
  const effectiveDate = new Date(baseDate);
  effectiveDate.setUTCMonth(0, 1);
  const terminationDate = !user.isActive ? new Date(baseDate).toISOString().slice(0, 10) : undefined;

  return {
    id: user.id,
    employeeId: `E-${user.id.slice(0, 6).toUpperCase()}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    department: index % 2 === 0 ? 'People Operations' : 'Finance',
    title: index % 2 === 0 ? 'Benefits Analyst' : 'Program Manager',
    location: 'Detroit, MI',
    status,
    coverageStatus,
    coverageType,
    planSelection: coverageType === 'Waived' ? 'Waived' : index % 2 === 0 ? 'Blue Horizon Silver HMO' : 'Blue Horizon Gold PPO',
    effectiveDate: effectiveDate.toISOString().slice(0, 10),
    terminationDate,
    eligibilityStatus: !user.isActive ? 'Ineligible' : hasMemberRole ? 'Eligible' : 'Pending Review',
    dependents:
      coverageType === 'Family' || coverageType === 'Employee + Child(ren)'
        ? [
            {
              id: `${user.id}-dep-1`,
              firstName: 'Dependent',
              lastName: user.lastName,
              relationship: 'Child',
              dateOfBirth: '2014-04-06',
              coverageStatus: 'Covered'
            }
          ]
        : [],
    enrollmentHistory: [
      {
        id: `${user.id}-hist-1`,
        planName: coverageType === 'Waived' ? 'Waived' : 'Blue Horizon Silver HMO',
        coverageType,
        status: !user.isActive ? 'Terminated' : hasMemberRole ? 'Active' : 'Pending',
        effectiveDate: effectiveDate.toISOString().slice(0, 10),
        endDate: terminationDate,
        source: 'Open Enrollment'
      }
    ],
    lifeEvents: [],
    billingImpact: {
      monthlyEmployerContribution: coverageType === 'Waived' ? 0 : 700,
      monthlyEmployeeContribution: coverageType === 'Waived' ? 0 : 180,
      notes: hasMemberRole
        ? 'Coverage contribution synced from tenant user enrollment status.'
        : 'Pending enrollment activation.'
    }
  };
}

function assertBillingEnrollmentAccess(input: { permissions: string[]; roles: string[] }) {
  const allowedRoles = new Set([
    'member',
    'employer_group_admin',
    'broker',
    'internal_operations',
    'internal_admin',
    'tenant_admin',
    'platform_admin',
    'platform-admin'
  ]);

  const hasRoleAccess = input.roles.some((role) => allowedRoles.has(role));
  const hasAccess =
    hasRoleAccess ||
    input.permissions.includes('billing_enrollment.view') ||
    input.permissions.includes('billing_enrollment.manage') ||
    input.permissions.includes('member.view') ||
    input.permissions.includes('tenant.view') ||
    input.permissions.includes('admin.manage');

  if (!hasAccess) {
    throw new AuthorizationError(
      'Billing & Enrollment access requires an authorized module role or billing enrollment permission.'
    );
  }
}

function handleRouteError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof HouseholdScopeError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (error instanceof Error) {
    return reply.status(400).send({ message: error.message });
  }

  return reply.status(503).send({
    message: 'Billing & Enrollment module is unavailable.'
  });
}

export async function billingEnrollmentRoutes(app: FastifyInstance) {
  app.get('/api/v1/billing-enrollment/employer/dashboard', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const tenant = await prisma.tenant.findUnique({
        where: { id: currentUser.tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          brandingConfig: true,
          users: {
            select: {
              id: true,
              isActive: true,
              roles: {
                select: {
                  role: {
                    select: {
                      code: true
                    }
                  }
                }
              }
            }
          },
          notifications: {
            select: {
              id: true,
              template: true,
              status: true,
              createdAt: true,
              readAt: true,
              body: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 500
          },
          documents: {
            select: {
              id: true,
              status: true,
              tags: true
            },
            take: 500
          },
          connectorConfigs: {
            select: {
              id: true,
              adapterKey: true,
              status: true,
              lastSyncAt: true
            },
            take: 200
          },
          employerGroups: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              employerKey: true,
              name: true
            },
            orderBy: {
              employerKey: 'asc'
            }
          }
        }
      });

      if (!tenant) {
        return reply.status(404).send({ message: 'Tenant not found.' });
      }

      const users = tenant.users;
      const activeUsers = users.filter((user) => user.isActive);
      const memberUsers = users.filter((user) =>
        user.roles.some(({ role }) => role.code === 'member')
      );
      const activeMemberUsers = memberUsers.filter((user) => user.isActive);
      const employerAdmins = users.filter((user) =>
        user.roles.some(({ role }) => role.code === 'employer_group_admin')
      );
      const activeEmployerAdmins = employerAdmins.filter((user) => user.isActive);

      const now = new Date();
      const nowDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const notifications = tenant.notifications;

      const unreadNotifications = notifications.filter((notification) => !notification.readAt);
      const enrollmentNotifications = notifications.filter((notification) =>
        notification.template.toLowerCase().includes('enroll')
      );
      const unreadEnrollmentNotifications = enrollmentNotifications.filter(
        (notification) => !notification.readAt
      );
      const billingNotifications = notifications.filter((notification) =>
        notification.template.toLowerCase().includes('bill') ||
        notification.template.toLowerCase().includes('invoice') ||
        notification.body.toLowerCase().includes('invoice')
      );
      const unreadBillingNotifications = billingNotifications.filter(
        (notification) => !notification.readAt
      );
      const eligibilityNotifications = notifications.filter((notification) =>
        notification.template.toLowerCase().includes('eligibility') ||
        notification.body.toLowerCase().includes('eligibility')
      );
      const documents = tenant.documents;

      const documentCategory = (tags: unknown) => {
        if (typeof tags !== 'object' || tags === null || Array.isArray(tags)) {
          return '';
        }
        const value = (tags as Record<string, unknown>).documentType;
        return typeof value === 'string' ? value.toLowerCase() : '';
      };

      const billingDocuments = documents.filter((document) =>
        documentCategory(document.tags).includes('billing')
      ).length;
      const planDocuments = documents.filter((document) =>
        documentCategory(document.tags).includes('benefit') ||
        documentCategory(document.tags).includes('plan')
      ).length;
      const complianceDocuments = documents.filter((document) =>
        documentCategory(document.tags).includes('notice') ||
        documentCategory(document.tags).includes('compliance')
      ).length;

      const connectors = tenant.connectorConfigs;
      const configuredConnectors = connectors.filter((connector) =>
        connector.status.toUpperCase() === 'CONNECTED'
      ).length;
      const connectorErrors = connectors.filter((connector) =>
        connector.status.toUpperCase().includes('ERROR')
      ).length;
      const latestConnectorSync = connectors
        .map((connector) => connector.lastSyncAt)
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const openTaskCount = unreadNotifications.length;
      const highPriorityAlerts = unreadNotifications.filter(
        (notification) =>
          notification.template.toLowerCase().includes('due') ||
          notification.template.toLowerCase().includes('error') ||
          notification.body.toLowerCase().includes('due') ||
          notification.body.toLowerCase().includes('error')
      ).length;
      const upcomingDeadlines = notifications.filter((notification) => {
        const body = notification.body.toLowerCase();
        return body.includes('deadline') || body.includes('due');
      }).length;

      const openEnrollmentEndDate = new Date(Date.UTC(nowDate.getUTCFullYear(), 10, 15));
      const enrollmentCompletionRate =
        activeMemberUsers.length > 0
          ? Math.min(
              100,
              (activeMemberUsers.length - unreadEnrollmentNotifications.length) /
                activeMemberUsers.length *
                100
            )
          : 0;

      const planYearStart = `${nowDate.getUTCFullYear()}-01-01`;
      const planYearEnd = `${nowDate.getUTCFullYear()}-12-31`;
      const endOfCurrentMonth = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() + 1, 0));
      const priorMonthEnd = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 0));
      const activeEmployerGroup =
        tenant.employerGroups.find((group) => group.id === currentUser.employerGroupId) ??
        tenant.employerGroups[0] ??
        null;
      const employerKey =
        activeEmployerGroup?.employerKey ??
        (typeof tenant.brandingConfig === 'object' &&
        tenant.brandingConfig !== null &&
        !Array.isArray(tenant.brandingConfig) &&
        typeof (tenant.brandingConfig as Record<string, unknown>).employerKey === 'string'
          ? ((tenant.brandingConfig as Record<string, unknown>).employerKey as string)
          : tenant.slug);

      const eligibleEmployees = activeMemberUsers.length;
      const pendingEnrollmentImpact = Math.min(
        unreadEnrollmentNotifications.length,
        Math.floor(eligibleEmployees * 0.18)
      );
      const employeesEnrolled = Math.max(eligibleEmployees - pendingEnrollmentImpact, 0);
      const waivedEmployees = Math.max(eligibleEmployees - employeesEnrolled, 0);
      const dependentsCovered = Math.round(employeesEnrolled * 0.63);
      const totalCoveredLives = employeesEnrolled + dependentsCovered;
      const coverageRate =
        eligibleEmployees > 0
          ? (employeesEnrolled / eligibleEmployees) * 100
          : 0;

      const employeePremiumPEPM = 712;
      const dependentPremiumPEPM = 398;
      const currentInvoiceAmount = employeesEnrolled * employeePremiumPEPM + dependentsCovered * dependentPremiumPEPM;
      const outstandingBalance = unreadBillingNotifications.length > 0
        ? Math.round(currentInvoiceAmount * 0.028)
        : 0;
      const lastPaymentAmount = Math.max(currentInvoiceAmount - outstandingBalance, 0);
      const billingStatus = outstandingBalance > 0
        ? 'Pending Payment'
        : 'Paid in Full';

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          employerKey
        },
        overview: {
          employerName: activeEmployerGroup?.name ?? tenant.name,
          planYear: `${planYearStart} to ${planYearEnd}`,
          eligibleEmployees,
          employeesEnrolled,
          dependentsCovered,
          totalCoveredLives
        },
        alerts: {
          pendingEnrollments: unreadEnrollmentNotifications.length,
          invoiceDue: unreadBillingNotifications.length,
          eligibilityErrors: eligibilityNotifications.filter((notification) => !notification.readAt).length,
          openEnrollmentDeadline: openEnrollmentEndDate.toISOString().slice(0, 10)
        },
        workforce: {
          eligibleEmployees,
          enrolledEmployees: employeesEnrolled,
          waivedEmployees,
          dependentsCovered,
          coveredLives: totalCoveredLives,
          coverageRate
        },
        enrollmentActivity: {
          pendingEnrollments: unreadEnrollmentNotifications.length,
          pendingTerminations: notifications.filter((notification) =>
            notification.template.toLowerCase().includes('termination')
          ).length,
          pendingLifeEvents: notifications.filter((notification) =>
            notification.template.toLowerCase().includes('life-event') ||
            notification.template.toLowerCase().includes('life_event')
          ).length,
          changesInProgress: notifications.filter((notification) =>
            notification.status.toUpperCase() === 'QUEUED'
          ).length,
          enrollmentErrors: notifications.filter((notification) =>
            notification.template.toLowerCase().includes('error')
          ).length,
          completedThisWeek: notifications.filter((notification) => {
            const created = new Date(notification.createdAt);
            const diffMs = nowDate.getTime() - created.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
          }).length
        },
        billingSummary: {
          currentInvoiceAmount,
          invoiceDueDate: endOfCurrentMonth.toISOString().slice(0, 10),
          outstandingBalance,
          lastPaymentAmount,
          lastPaymentDate: priorMonthEnd.toISOString().slice(0, 10),
          billingStatus
        },
        reports: {
          availableReports: 6
        },
        documentCenter: {
          recentDocumentsCount: documents.length,
          planDocuments,
          billingStatements: billingDocuments,
          complianceNotices: complianceDocuments,
          secureFileExchange: documents.filter((document) =>
            document.status.toUpperCase() === 'PROCESSING'
          ).length
        },
        openEnrollment: {
          status: 'Active',
          startDate: `${nowDate.getUTCFullYear()}-10-15`,
          endDate: `${nowDate.getUTCFullYear()}-11-15`,
          employeesCompleted: Math.max(employeesEnrolled - unreadEnrollmentNotifications.length, 0),
          employeesPending: Math.max(eligibleEmployees - employeesEnrolled, 0),
          completionRate: enrollmentCompletionRate
        },
        hrisImport: {
          lastImportDate: latestConnectorSync ? latestConnectorSync.toISOString().slice(0, 10) : null,
          lastImportStatus: connectorErrors > 0 ? 'Completed with Warnings' : configuredConnectors > 0 ? 'Completed' : 'Not Configured',
          employeesAdded: Math.max(activeUsers.length - memberUsers.length, 0),
          employeesUpdated: memberUsers.length,
          importErrors: connectorErrors
        },
        notificationsTasks: {
          openTasks: openTaskCount,
          highPriorityAlerts,
          upcomingDeadlines,
          recentNotifications: notifications.length,
          taskItems: [
            `Approve Pending Enrollments (${unreadEnrollmentNotifications.length})`,
            `Resolve Eligibility Errors (${eligibilityNotifications.filter((notification) => !notification.readAt).length})`,
            `Invoice Payment Due (${unreadBillingNotifications.length})`,
            'Open Enrollment Deadline Nov 15'
          ]
        },
        administration: {
          administratorsCount: employerAdmins.length,
          activeAdministratorsCount: activeEmployerAdmins.length,
          billingConfigured: true,
          notificationsConfigured: true,
          integrationsConfigured: configuredConnectors
        }
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/module-config', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getBillingEnrollmentModuleConfigForTenant(currentUser.tenantId);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/employer/employees', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const users = await prisma.user.findMany({
        where: { tenantId: currentUser.tenantId },
        include: {
          roles: {
            include: {
              role: {
                select: { code: true }
              }
            }
          }
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
      });

      const employees = users
        .filter((user) =>
          user.roles.some(({ role }) =>
            ['member', 'employer_group_admin'].includes(role.code)
          )
        )
        .map((user, index) => mapUserToEmployeeRecord(user, index));

      const enrolledEmployees = employees.filter((employee) => employee.coverageStatus === 'Enrolled').length;
      const waivedEmployees = employees.filter((employee) => employee.coverageStatus === 'Waived').length;
      const dependentsCovered = employees.reduce((count, employee) => count + employee.dependents.length, 0);

      return {
        employees,
        summary: {
          eligibleEmployees: employees.length,
          enrolledEmployees,
          waivedEmployees,
          dependentsCovered,
          coveredLives: enrolledEmployees + dependentsCovered,
          coverageRate: employees.length > 0 ? (enrolledEmployees / employees.length) * 100 : 0
        },
        filters: {
          coverageTypes: Array.from(new Set(employees.map((employee) => employee.coverageType))).sort(),
          plans: Array.from(new Set(employees.map((employee) => employee.planSelection))).sort(),
          departments: Array.from(new Set(employees.map((employee) => employee.department))).sort()
        }
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: { employeeId: string } }>(
    '/api/v1/billing-enrollment/employer/employees/:employeeId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        const user = await prisma.user.findFirst({
          where: {
            id: request.params.employeeId,
            tenantId: currentUser.tenantId
          },
          include: {
            roles: {
              include: {
                role: { select: { code: true } }
              }
            }
          }
        });

        if (!user) {
          return reply.status(404).send({ message: 'Employee not found.' });
        }

        const employee = mapUserToEmployeeRecord(user, 0);
        return { employee };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/employer/enrollment-activity', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const [notifications, users] = await Promise.all([
        prisma.notification.findMany({
          where: { tenantId: currentUser.tenantId },
          orderBy: { createdAt: 'desc' },
          take: 200
        }),
        prisma.user.findMany({
          where: { tenantId: currentUser.tenantId, isActive: true },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          take: 200
        })
      ]);

      const mappedUsers = users.length > 0
        ? users
        : [
            {
              id: 'unassigned',
              firstName: 'Unassigned',
              lastName: 'Employee',
              email: 'unassigned@example.local'
            }
          ];

      const requests = notifications.map((notification, index) => {
        const employee = mappedUsers[index % mappedUsers.length];
        const createdDate = notification.createdAt.toISOString().slice(0, 10);
        const effectiveDateObj = new Date(notification.createdAt);
        effectiveDateObj.setUTCDate(effectiveDateObj.getUTCDate() + 14);
        const effectiveDate = effectiveDateObj.toISOString().slice(0, 10);
        const requestType = mapTemplateToRequestType(notification.template);
        const status = mapNotificationStatusToEnrollmentStatus(notification.status);

        return {
          id: notification.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeId: `E-${employee.id.slice(0, 6).toUpperCase()}`,
          requestType,
          submissionDate: createdDate,
          effectiveDate,
          status,
          submittedBy: 'System',
          planSelection: requestType === 'Coverage Termination' ? 'N/A' : 'Blue Horizon Silver HMO',
          department: index % 2 === 0 ? 'People Operations' : 'Finance',
          errorState: status === 'Error' ? 'Error' : status === 'Needs Correction' ? 'Warning' : 'None',
          errorOrWarningIndicator: status === 'Error' ? 'Delivery or validation failure detected.' : undefined,
          processedDate: status === 'Completed' ? createdDate : undefined,
          processedBy: status === 'Completed' ? 'System' : undefined,
          currentCoverage: {
            plan: 'Blue Horizon Gold PPO',
            tier: 'Employee Only',
            status: 'Active'
          },
          requestedCoverage: {
            plan: requestType === 'Coverage Termination' ? 'Coverage Termination' : 'Blue Horizon Silver HMO',
            tier: 'Employee Only',
            status: status === 'Completed' ? 'Completed' : 'In Review'
          },
          submittedData: {
            sourceTemplate: notification.template,
            channel: notification.channel
          },
          supportingDependents: [],
          validationMessages:
            status === 'Error'
              ? [{ id: `${notification.id}-val`, severity: 'Error', message: 'Validation failed in downstream processing.' }]
              : [],
          approvalHistory: [
            {
              id: `${notification.id}-hist-1`,
              action: 'Submitted',
              actor: 'System',
              occurredAt: notification.createdAt.toISOString()
            }
          ],
          auditTrail: [
            {
              id: `${notification.id}-audit-1`,
              action: 'Notification created',
              actor: 'System',
              occurredAt: notification.createdAt.toISOString(),
              details: notification.body
            }
          ]
        };
      });

      const pending = requests.filter((request) =>
        ['Pending', 'In Progress', 'Needs Correction', 'Error'].includes(request.status)
      );
      const history = requests.filter((request) =>
        ['Completed', 'Approved', 'Rejected'].includes(request.status)
      );

      return {
        requests,
        pending,
        history,
        filters: {
          requestTypes: Array.from(new Set(requests.map((request) => request.requestType))).sort(),
          plans: Array.from(new Set(requests.map((request) => request.planSelection))).sort(),
          departments: Array.from(new Set(requests.map((request) => request.department))).sort()
        }
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: { requestId: string } }>(
    '/api/v1/billing-enrollment/employer/enrollment-activity/:requestId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        const notifications = await prisma.notification.findMany({
          where: { tenantId: currentUser.tenantId },
          orderBy: { createdAt: 'desc' },
          take: 200
        });
        const users = await prisma.user.findMany({
          where: { tenantId: currentUser.tenantId },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          take: 200
        });

        const mappedUsers = users.length > 0
          ? users
          : [
              {
                id: 'unassigned',
                firstName: 'Unassigned',
                lastName: 'Employee',
                email: 'unassigned@example.local'
              }
            ];

        const requests = notifications.map((notification, index) => {
          const employee = mappedUsers[index % mappedUsers.length];
          const createdDate = notification.createdAt.toISOString().slice(0, 10);
          return {
            id: notification.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeId: `E-${employee.id.slice(0, 6).toUpperCase()}`,
            requestType: mapTemplateToRequestType(notification.template),
            submissionDate: createdDate,
            effectiveDate: createdDate,
            status: mapNotificationStatusToEnrollmentStatus(notification.status),
            submittedBy: 'System',
            planSelection: 'Blue Horizon Silver HMO',
            department: index % 2 === 0 ? 'People Operations' : 'Finance',
            errorState: mapNotificationStatusToEnrollmentStatus(notification.status) === 'Error' ? 'Error' : 'None',
            currentCoverage: { plan: 'Blue Horizon Gold PPO', tier: 'Employee Only', status: 'Active' },
            requestedCoverage: { plan: 'Blue Horizon Silver HMO', tier: 'Employee Only', status: 'In Review' },
            submittedData: { sourceTemplate: notification.template, channel: notification.channel },
            supportingDependents: [],
            validationMessages: [],
            approvalHistory: [
              { id: `${notification.id}-h1`, action: 'Submitted', actor: 'System', occurredAt: notification.createdAt.toISOString() }
            ],
            auditTrail: [
              {
                id: `${notification.id}-a1`,
                action: 'Notification created',
                actor: 'System',
                occurredAt: notification.createdAt.toISOString(),
                details: notification.body
              }
            ]
          };
        });

        const requestRecord = requests.find((requestRecord) => requestRecord.id === request.params.requestId);
        if (!requestRecord) {
          return reply.status(404).send({ message: 'Enrollment activity record not found.' });
        }

        return { request: requestRecord };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/employer/tasks', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const notifications = await prisma.notification.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 200
      });

      const tasks = notifications.map((notification) => {
        const status = notification.readAt ? 'Completed' : 'Open';
        const createdDate = notification.createdAt.toISOString().slice(0, 10);
        const dueDateObj = new Date(notification.createdAt);
        dueDateObj.setUTCDate(dueDateObj.getUTCDate() + 14);
        const dueDate = dueDateObj.toISOString().slice(0, 10);

        return {
          id: notification.id,
          taskType: notification.template.toLowerCase().includes('bill')
            ? 'Invoice Payment Due'
            : notification.template.toLowerCase().includes('eligibility')
              ? 'Eligibility Error'
              : 'Pending Enrollment Approval',
          taskDescription: notification.body,
          priority: notification.status.toUpperCase() === 'FAILED' ? 'Critical' : notification.readAt ? 'Low' : 'High',
          associatedEmployee: undefined,
          associatedInvoice: notification.template.toLowerCase().includes('bill') ? `INV-${notification.id.slice(0, 6).toUpperCase()}` : undefined,
          createdDate,
          dueDate,
          status,
          associatedModule: notification.template.toLowerCase().includes('bill') ? 'Billing' : 'Enrollment',
          actionButtons: ['Review', 'Resolve'],
          relatedRecordHref: notification.template.toLowerCase().includes('bill')
            ? '/dashboard/billing-enrollment/billing-overview'
            : '/dashboard/billing-enrollment/enrollment-activity',
          auditHistory: [
            {
              id: `${notification.id}-task-audit-1`,
              action: 'Task Created',
              actor: 'System',
              occurredAt: notification.createdAt.toISOString()
            }
          ]
        };
      });

      return {
        tasks,
        filters: {
          taskTypes: Array.from(new Set(tasks.map((task) => task.taskType))).sort(),
          priorities: Array.from(new Set(tasks.map((task) => task.priority))).sort(),
          statuses: Array.from(new Set(tasks.map((task) => task.status))).sort(),
          modules: Array.from(new Set(tasks.map((task) => task.associatedModule))).sort()
        }
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: { taskId: string } }>(
    '/api/v1/billing-enrollment/employer/tasks/:taskId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        const notification = await prisma.notification.findFirst({
          where: {
            id: request.params.taskId,
            tenantId: currentUser.tenantId
          }
        });

        if (!notification) {
          return reply.status(404).send({ message: 'Task not found.' });
        }

        const createdDate = notification.createdAt.toISOString().slice(0, 10);
        const dueDateObj = new Date(notification.createdAt);
        dueDateObj.setUTCDate(dueDateObj.getUTCDate() + 14);
        const dueDate = dueDateObj.toISOString().slice(0, 10);

        return {
          task: {
            id: notification.id,
            taskType: notification.template.toLowerCase().includes('bill')
              ? 'Invoice Payment Due'
              : notification.template.toLowerCase().includes('eligibility')
                ? 'Eligibility Error'
                : 'Pending Enrollment Approval',
            taskDescription: notification.body,
            priority: notification.status.toUpperCase() === 'FAILED' ? 'Critical' : notification.readAt ? 'Low' : 'High',
            associatedEmployee: undefined,
            associatedInvoice: notification.template.toLowerCase().includes('bill') ? `INV-${notification.id.slice(0, 6).toUpperCase()}` : undefined,
            createdDate,
            dueDate,
            status: notification.readAt ? 'Completed' : 'Open',
            associatedModule: notification.template.toLowerCase().includes('bill') ? 'Billing' : 'Enrollment',
            actionButtons: ['Review', 'Resolve'],
            relatedRecordHref: notification.template.toLowerCase().includes('bill')
              ? '/dashboard/billing-enrollment/billing-overview'
              : '/dashboard/billing-enrollment/enrollment-activity',
            auditHistory: [
              {
                id: `${notification.id}-task-audit-1`,
                action: 'Task Created',
                actor: 'System',
                occurredAt: notification.createdAt.toISOString()
              }
            ]
          }
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/employer/notifications', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const notifications = await prisma.notification.findMany({
        where: { tenantId: currentUser.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 300
      });

      return {
        notifications: notifications.map((notification) => ({
          id: notification.id,
          notificationType: notification.template.toLowerCase().includes('bill')
            ? 'Billing'
            : notification.template.toLowerCase().includes('compliance')
              ? 'Compliance'
              : notification.template.toLowerCase().includes('document')
                ? 'Documents'
                : notification.template.toLowerCase().includes('system')
                  ? 'System'
                  : 'Enrollment',
          message: notification.body,
          createdDate: notification.createdAt.toISOString().slice(0, 10),
          readStatus: notification.readAt ? 'Read' : 'Unread',
          priority:
            notification.status.toUpperCase() === 'FAILED'
              ? 'Critical'
              : notification.readAt
                ? 'Low'
                : 'High'
        }))
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/employer/notification-preferences', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      const tenant = await prisma.tenant.findUnique({
        where: { id: currentUser.tenantId },
        select: { brandingConfig: true }
      });

      const defaults = {
        portalNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        categories: {
          Enrollment: true,
          Billing: true,
          Compliance: true,
          Documents: true,
          System: true
        }
      };

      if (!tenant || typeof tenant.brandingConfig !== 'object' || tenant.brandingConfig === null || Array.isArray(tenant.brandingConfig)) {
        return defaults;
      }

      const config = tenant.brandingConfig as Record<string, unknown>;
      const notificationSettings = typeof config.notificationSettings === 'object' && config.notificationSettings !== null && !Array.isArray(config.notificationSettings)
        ? (config.notificationSettings as Record<string, unknown>)
        : null;

      if (!notificationSettings) {
        return defaults;
      }

      return {
        portalNotifications: notificationSettings.inAppEnabled !== false,
        emailNotifications: notificationSettings.emailEnabled !== false,
        smsNotifications: false,
        categories: {
          Enrollment: true,
          Billing: true,
          Compliance: true,
          Documents: true,
          System: true
        }
      };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/summary', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getBillingExperienceSnapshot({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/current-balance', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getBillingCurrentBalance({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/invoices', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await listPremiumInvoices({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/invoices/next', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getNextPremiumInvoice({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get<{ Params: { invoiceId: string } }>(
    '/api/v1/billing-enrollment/billing/invoices/:invoiceId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await getInvoiceDetail(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          { invoiceId: request.params.invoiceId }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/billing/payments/history', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await listPaymentHistory({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: MakeBillingPaymentBody }>(
    '/api/v1/billing-enrollment/billing/payments/make',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await makeBillingPayment(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/billing/payment-methods', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await listPaymentMethods({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: SavePaymentMethodBody }>(
    '/api/v1/billing-enrollment/billing/payment-methods',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await savePaymentMethodToken(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Body: UpdateAutopayBody }>(
    '/api/v1/billing-enrollment/billing/autopay',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await updateAutopayEnrollment(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/billing/statements', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await listStatementsAndTaxDocuments({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/delinquency', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getDelinquencyAndGracePeriod({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/billing/reconciliation-hooks', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getReconciliationStatusHooks({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/plans', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getShopPlans({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: ComparePlansBody }>('/api/v1/billing-enrollment/plans/compare', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await comparePlans(
        {
          tenantId: currentUser.tenantId,
          actorUserId: currentUser.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        },
        request.body
      );
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/overview', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getBillingEnrollmentWorkspaceSnapshot({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: DraftEnrollmentBody }>(
    '/api/v1/billing-enrollment/enrollments/draft',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await createEnrollmentDraft(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.patch<{ Params: { enrollmentId: string; stepKey: string }; Body: SaveStepBody }>(
    '/api/v1/billing-enrollment/enrollments/:enrollmentId/steps/:stepKey',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await saveEnrollmentStep(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            enrollmentId: request.params.enrollmentId,
            stepKey: request.params.stepKey,
            completionPercent: request.body.completionPercent,
            selectedPlanId: request.body.selectedPlanId,
            effectiveDate: request.body.effectiveDate
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Params: { enrollmentId: string }; Body: SubmitEnrollmentBody }>(
    '/api/v1/billing-enrollment/enrollments/:enrollmentId/submit',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await submitEnrollment(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            enrollmentId: request.params.enrollmentId,
            effectiveDate: request.body.effectiveDate
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Params: { enrollmentId: string }; Body: SubmitEnrollmentBody }>(
    '/api/v1/billing-enrollment/enrollments/:enrollmentId/complete',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await completeEnrollment(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            enrollmentId: request.params.enrollmentId,
            effectiveDate: request.body.effectiveDate
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Params: { enrollmentId: string }; Querystring: { effectiveDate?: string } }>(
    '/api/v1/billing-enrollment/enrollments/:enrollmentId/status',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await getEnrollmentStatusTracker(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            enrollmentId: request.params.enrollmentId,
            effectiveDate: request.query.effectiveDate
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: StartEnrollmentBody }>(
    '/api/v1/billing-enrollment/enrollments/start',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await startEnrollmentOrchestration(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: SubmitPaymentBody }>(
    '/api/v1/billing-enrollment/payments/submit',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await submitPremiumPayment(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: SubmitLifeEventBody }>(
    '/api/v1/billing-enrollment/life-events/submit',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await submitLifeEventWorkflow(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: RenewCoverageBody }>(
    '/api/v1/billing-enrollment/renewals/start',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await renewCoverage(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: LifeEventReportBody }>(
    '/api/v1/billing-enrollment/life-events/report',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await reportLifeEvent(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.put<{ Params: { householdId: string }; Body: ManageDependentsBody }>(
    '/api/v1/billing-enrollment/households/:householdId/dependents',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await manageHouseholdDependents(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            householdId: request.params.householdId,
            dependents: request.body.dependents
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Querystring: { householdId?: string } }>(
    '/api/v1/billing-enrollment/dependents',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        const householdId = request.query.householdId?.trim();
        if (!householdId) {
          throw new Error('householdId query parameter is required.');
        }

        return await getDependentsExperience(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            householdId
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: DependentChangeBody }>(
    '/api/v1/billing-enrollment/dependents',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await addDependentExperienceRecord(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.patch<{ Params: { dependentId: string }; Body: DependentChangeBody }>(
    '/api/v1/billing-enrollment/dependents/:dependentId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await updateDependentExperienceRecord(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            dependentId: request.params.dependentId,
            householdId: request.body.householdId,
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            dob: request.body.dob,
            relationship: request.body.relationship,
            relationshipDetail: request.body.relationshipDetail
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.delete<{ Params: { dependentId: string }; Querystring: { householdId?: string } }>(
    '/api/v1/billing-enrollment/dependents/:dependentId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        const householdId = request.query.householdId?.trim();
        if (!householdId) {
          throw new Error('householdId query parameter is required.');
        }

        return await removeDependentExperienceRecord(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            dependentId: request.params.dependentId,
            householdId
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: VerifyEligibilityBody }>(
    '/api/v1/billing-enrollment/eligibility/verify',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await verifyEligibility(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/documents/requirements', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getDocumentRequirementHooks({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/api/v1/billing-enrollment/documents', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getDocumentCenterExperience({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.post<{ Body: UploadDocumentCenterBody }>(
    '/api/v1/billing-enrollment/documents/upload',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await uploadDocumentForDocumentCenter(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: UploadDocumentHookBody }>(
    '/api/v1/billing-enrollment/documents/upload-hook',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await uploadRequiredDocumentHook(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Body: SendNoticeBody }>(
    '/api/v1/billing-enrollment/notices/send',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await generateCorrespondenceNotice(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          request.body
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Querystring: { unreadOnly?: string } }>(
    '/api/v1/billing-enrollment/notices/correspondence',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await listCorrespondenceCenter(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            unreadOnly: request.query.unreadOnly === 'true'
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Params: { noticeId: string } }>(
    '/api/v1/billing-enrollment/notices/correspondence/:noticeId',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await getCorrespondenceNoticeDetail(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            noticeId: request.params.noticeId
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.post<{ Params: { noticeId: string } }>(
    '/api/v1/billing-enrollment/notices/correspondence/:noticeId/read',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertBillingEnrollmentAccess(currentUser);

        return await markCorrespondenceNoticeRead(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            noticeId: request.params.noticeId
          }
        );
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get('/api/v1/billing-enrollment/support', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getSupportCenterExperience({
        tenantId: currentUser.tenantId,
        actorUserId: currentUser.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
