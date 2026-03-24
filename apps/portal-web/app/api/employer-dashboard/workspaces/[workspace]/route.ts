import { NextResponse } from 'next/server';

import {
  getEmployerDashboard,
  getEmployerEmployees,
  getEmployerEnrollmentActivity
} from '../../../../../lib/billing-enrollment-api';
import {
  createDashboardSessionCacheKey,
  getCachedDashboardSessionValue
} from '../../../../../lib/dashboard-session-cache';
import { getEmployerBillingDatasetForTenant } from '../../../../../lib/employer-billing-data';
import {
  getDocumentFilterOptions,
  getEmployerDocumentsForTenant,
  getRecentDocumentsForTenant
} from '../../../../../lib/employer-document-center-data';
import {
  getOpenEnrollmentAnalyticsForTenant,
  getOpenEnrollmentCycleForTenant,
  getOpenEnrollmentFilterOptions,
  getOpenEnrollmentRecordsForTenant,
  getOpenEnrollmentSummaryForTenant
} from '../../../../../lib/open-enrollment-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';
import {
  defaultReportFilters,
  groupReportsByCategory
} from '../../../../../lib/reports-analytics-data';

async function getCachedEmployerDashboard(input: {
  tenantId: string;
  userId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'employer-dashboard',
      input.tenantId,
      input.userId,
      'dashboard'
    ]),
    async () => getEmployerDashboard(input.userId).catch(() => null)
  );
}

async function getCachedEmployerEmployees(input: {
  tenantId: string;
  userId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'employer-dashboard',
      input.tenantId,
      input.userId,
      'employees'
    ]),
    async () => getEmployerEmployees(input.userId).catch(() => null)
  );
}

async function getCachedEmployerEnrollmentActivity(input: {
  tenantId: string;
  userId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'employer-dashboard',
      input.tenantId,
      input.userId,
      'enrollment-activity'
    ]),
    async () => getEmployerEnrollmentActivity(input.userId).catch(() => null)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const sessionUser = await getPortalSessionUser();
  const workspace = (await params).workspace;

  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = sessionUser.tenant.id;
  const employerName = sessionUser.tenant.name ?? 'Employer';

  if (workspace === 'group-dashboard') {
    const payload = await getCachedEmployerEmployees({
      tenantId,
      userId: sessionUser.id
    });

    return NextResponse.json({
      coverageTypes: payload?.filters.coverageTypes ?? [],
      departments: payload?.filters.departments ?? [],
      employees: payload?.employees ?? [],
      employerName,
      plans: payload?.filters.plans ?? [],
      summary: payload?.summary ?? {
        eligibleEmployees: 0,
        enrolledEmployees: 0,
        waivedEmployees: 0,
        dependentsCovered: 0,
        coveredLives: 0,
        coverageRate: 0
      }
    });
  }

  if (workspace === 'renewals') {
    const cycle = getOpenEnrollmentCycleForTenant(tenantId);
    const records = getOpenEnrollmentRecordsForTenant(tenantId);
    const summary = getOpenEnrollmentSummaryForTenant(tenantId);
    const analytics = getOpenEnrollmentAnalyticsForTenant(tenantId);
    const filterOptions = getOpenEnrollmentFilterOptions(records);

    return NextResponse.json({
      analytics,
      coverageTiers: filterOptions.coverageTiers,
      cycle,
      departments: filterOptions.departments,
      plans: filterOptions.planSelections,
      records,
      summary
    });
  }

  if (workspace === 'census-support') {
    const payload = await getCachedEmployerEnrollmentActivity({
      tenantId,
      userId: sessionUser.id
    });

    return NextResponse.json({
      departments: payload?.filters.departments ?? [],
      plans: payload?.filters.plans ?? [],
      requestTypes: payload?.filters.requestTypes ?? [],
      requests: payload?.pending ?? []
    });
  }

  if (workspace === 'billing-payments') {
    const dashboard = await getCachedEmployerDashboard({
      tenantId,
      userId: sessionUser.id
    });
    const dataset = getEmployerBillingDatasetForTenant(tenantId, employerName, dashboard?.billingSummary);

    return NextResponse.json({
      dataset
    });
  }

  if (workspace === 'documents-reports') {
    const dashboard = await getCachedEmployerDashboard({
      tenantId,
      userId: sessionUser.id
    });
    const documents = getEmployerDocumentsForTenant(tenantId, dashboard?.documentCenter);
    const recentDocuments = getRecentDocumentsForTenant(tenantId, 5, dashboard?.documentCenter);
    const filters = getDocumentFilterOptions(documents);

    return NextResponse.json({
      categories: filters.categories,
      documents,
      groupedReports: groupReportsByCategory(),
      initialFilters: defaultReportFilters(),
      recentDocuments,
      tenantName: employerName,
      types: filters.types
    });
  }

  return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
}
