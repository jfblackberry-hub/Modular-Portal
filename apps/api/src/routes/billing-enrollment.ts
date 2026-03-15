import {
  addDependentExperienceRecord,
  comparePlans,
  completeEnrollment,
  createEnrollmentDraft,
  generateCorrespondenceNotice,
  getBillingEnrollmentModuleConfigForTenant,
  getBillingCurrentBalance,
  getBillingExperienceSnapshot,
  getCorrespondenceNoticeDetail,
  getDependentsExperience,
  getDocumentCenterExperience,
  getDocumentRequirementHooks,
  getEnrollmentStatusTracker,
  getBillingEnrollmentWorkspaceSnapshot,
  getDelinquencyAndGracePeriod,
  getInvoiceDetail,
  getNextPremiumInvoice,
  getReconciliationStatusHooks,
  getSupportCenterExperience,
  getShopPlans,
  listPaymentHistory,
  listCorrespondenceCenter,
  listPaymentMethods,
  listPremiumInvoices,
  listStatementsAndTaxDocuments,
  markCorrespondenceNoticeRead,
  makeBillingPayment,
  manageHouseholdDependents,
  removeDependentExperienceRecord,
  renewCoverage,
  savePaymentMethodToken,
  reportLifeEvent,
  saveEnrollmentStep,
  startEnrollmentOrchestration,
  submitEnrollment,
  uploadRequiredDocumentHook,
  uploadDocumentForDocumentCenter,
  submitLifeEventWorkflow,
  submitPremiumPayment,
  updateDependentExperienceRecord,
  updateAutopayEnrollment,
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

  if (error instanceof Error) {
    return reply.status(400).send({ message: error.message });
  }

  return reply.status(503).send({
    message: 'Billing & Enrollment module is unavailable.'
  });
}

export async function billingEnrollmentRoutes(app: FastifyInstance) {
  app.get('/api/v1/billing-enrollment/module-config', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertBillingEnrollmentAccess(currentUser);

      return await getBillingEnrollmentModuleConfigForTenant(currentUser.tenantId);
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

        return await getDependentsExperience(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            householdId: request.query.householdId ?? 'hh-8843'
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

        return await removeDependentExperienceRecord(
          {
            tenantId: currentUser.tenantId,
            actorUserId: currentUser.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']
          },
          {
            dependentId: request.params.dependentId,
            householdId: request.query.householdId ?? 'hh-8843'
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
