'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState, StatusBadge } from '../portal-ui';
import { EmployerDashboardWorkspaceSection } from './EmployerDashboardWorkspaceSection';

type DashboardMode = 'live' | 'mock' | 'empty' | 'error';

type EmployerOverview = {
  employerName: string;
  planYear: string;
  eligibleEmployees: number;
  employeesEnrolled: number;
  dependentsCovered: number;
};

type AlertsSummary = {
  pendingEnrollments: number;
  invoiceDue: number;
  eligibilityErrors: number;
  openEnrollmentDeadline: string;
};

type EmployerDashboardData = {
  overview: EmployerOverview;
  alerts: AlertsSummary;
  workforce: {
    eligibleEmployees: number;
    enrolledEmployees: number;
    waivedEmployees: number;
    dependentsCovered: number;
    coveredLives: number;
    coverageRate: number;
  };
  enrollmentActivity: {
    pendingEnrollments: number;
    pendingTerminations: number;
    pendingLifeEvents: number;
    changesInProgress: number;
    enrollmentErrors: number;
    completedThisWeek: number;
  };
  billingSummary: {
    currentInvoiceAmount: number;
    invoiceDueDate: string | null;
    outstandingBalance: number;
    lastPaymentAmount: number;
    lastPaymentDate: string | null;
    billingStatus: string;
  };
  documentCenter: {
    recentDocumentsCount: number;
    planDocuments: number;
    billingStatements: number;
    complianceNotices: number;
    secureFileExchange: number;
  };
  openEnrollment: {
    status: string;
    startDate: string | null;
    endDate: string | null;
    employeesCompleted: number;
    employeesPending: number;
    completionRate: number;
  };
  hrisImport: {
    lastImportDate: string | null;
    lastImportStatus: string;
    employeesAdded: number;
    employeesUpdated: number;
    importErrors: number;
  };
  notificationsTasks: {
    openTasks: number;
    highPriorityAlerts: number;
    upcomingDeadlines: number;
    recentNotifications: number;
    taskItems: string[];
  };
  administration: {
    administratorsCount: number;
    activeAdministratorsCount: number;
    billingConfigured: boolean;
    notificationsConfigured: boolean;
    integrationsConfigured: number;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function createEmployerFallbackData(
  employerName: string
): EmployerDashboardData {
  return {
    overview: {
      employerName,
      planYear: 'Jan 1 2026 - Dec 31 2026',
      eligibleEmployees: 512,
      employeesEnrolled: 423,
      dependentsCovered: 612
    },
    alerts: {
      pendingEnrollments: 3,
      invoiceDue: 1,
      eligibilityErrors: 2,
      openEnrollmentDeadline: 'May 15, 2026'
    },
    workforce: {
      eligibleEmployees: 512,
      enrolledEmployees: 423,
      waivedEmployees: 89,
      dependentsCovered: 612,
      coveredLives: 1035,
      coverageRate: 82.6
    },
    enrollmentActivity: {
      pendingEnrollments: 3,
      pendingTerminations: 1,
      pendingLifeEvents: 2,
      changesInProgress: 4,
      enrollmentErrors: 1,
      completedThisWeek: 12
    },
    billingSummary: {
      currentInvoiceAmount: 214832,
      invoiceDueDate: '2026-03-30',
      outstandingBalance: 5922,
      lastPaymentAmount: 208910,
      lastPaymentDate: '2026-02-28',
      billingStatus: 'Pending Payment'
    },
    documentCenter: {
      recentDocumentsCount: 5,
      planDocuments: 2,
      billingStatements: 1,
      complianceNotices: 1,
      secureFileExchange: 1
    },
    openEnrollment: {
      status: 'Active',
      startDate: '2026-10-15',
      endDate: '2026-11-15',
      employeesCompleted: 312,
      employeesPending: 111,
      completionRate: 73.7
    },
    hrisImport: {
      lastImportDate: '2026-03-14',
      lastImportStatus: 'Completed with Warnings',
      employeesAdded: 12,
      employeesUpdated: 4,
      importErrors: 2
    },
    notificationsTasks: {
      openTasks: 4,
      highPriorityAlerts: 1,
      upcomingDeadlines: 2,
      recentNotifications: 6,
      taskItems: [
        'Approve Pending Enrollments (3)',
        'Resolve Eligibility Errors (2)',
        'Invoice Payment Due Mar 30',
        'Open Enrollment Deadline Nov 15'
      ]
    },
    administration: {
      administratorsCount: 4,
      activeAdministratorsCount: 3,
      billingConfigured: true,
      notificationsConfigured: true,
      integrationsConfigured: 1
    }
  };
}

export function createEmployerCommandCenterInitialState({
  employerName,
  mode
}: {
  employerName: string;
  mode: DashboardMode;
}) {
  if (mode === 'live' || mode === 'empty') {
    return {
      data: null,
      isLoading: mode === 'live'
    } satisfies {
      data: EmployerDashboardData | null;
      isLoading: boolean;
    };
  }

  return {
    data: createEmployerFallbackData(employerName),
    isLoading: false
  } satisfies {
    data: EmployerDashboardData | null;
    isLoading: boolean;
  };
}

function LoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="portal-card animate-pulse p-6">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-4 h-3 w-44 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-36 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-40 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function EmployerCommandCenterDashboard({
  employerName,
  workspaceSessionKey,
  mode = 'live'
}: {
  employerName: string;
  workspaceSessionKey: string;
  mode?: DashboardMode;
}) {
  const initialState = useMemo(
    () => createEmployerCommandCenterInitialState({ employerName, mode }),
    [employerName, mode]
  );
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [error, setError] = useState('');
  const [data, setData] = useState<EmployerDashboardData | null>(initialState.data);

  const loadData = useCallback(async () => {
    if (mode === 'mock') {
      setData(createEmployerFallbackData(employerName));
      setError('');
      setIsLoading(false);
      return;
    }

    if (mode === 'empty') {
      setData(null);
      setError('');
      setIsLoading(false);
      return;
    }

    if (mode === 'error') {
      setData(createEmployerFallbackData(employerName));
      setError('Unable to load employer command center data right now.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/billing-enrollment/employer-dashboard', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Unable to load employer command center data right now.');
      }

      const payload = (await response.json()) as EmployerDashboardData;
      setData(payload);
    } catch (nextError) {
      setData(createEmployerFallbackData(employerName));
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load employer command center data right now.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [employerName, mode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dashboard = data ?? createEmployerFallbackData(employerName);
  const workforceSummary = dashboard.workforce;
  const billingSummary = dashboard.billingSummary;
  const enrollmentActivitySummary = dashboard.enrollmentActivity;
  const documentSummary = dashboard.documentCenter;
  const openEnrollmentSummary = dashboard.openEnrollment;
  const latestImportSummary = dashboard.hrisImport;
  const notificationsTaskSummary = dashboard.notificationsTasks;
  const administrationSummary = dashboard.administration;

  return (
    <div className="space-y-5" aria-busy={isLoading}>
      <section className="portal-card p-6 sm:p-8">
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Employer Command Center
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Manage your employee population, enrollment activity, and billing operations from a single administrative workspace.
        </p>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workspaces</h2>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Lazy Tabs</p>
        </div>
        <div className="mt-4">
          <EmployerDashboardWorkspaceSection sessionScopeKey={workspaceSessionKey} />
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workforce Coverage</h2>
          <StatusBadge label={`${workforceSummary.coverageRate.toFixed(1)}% Coverage`} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Total Eligible Employees</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.eligibleEmployees.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Total Enrolled Employees</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.enrolledEmployees.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Total Waived Employees</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.waivedEmployees.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Total Dependents Covered</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.dependentsCovered.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Total Covered Lives</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.coveredLives.toLocaleString()}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Coverage Rate</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {workforceSummary.coverageRate.toFixed(1)}%
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/employees"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Employees
          </Link>
          <Link
            href="/dashboard/billing-enrollment/enrollment/start"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Add Employee
          </Link>
          <Link
            href="/dashboard/billing-enrollment/employees/export"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Export Census
          </Link>
          <Link
            href="/dashboard/billing-enrollment/enrollment/household"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Manage Dependents
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enrollment Activity</h2>
          <StatusBadge label={`${enrollmentActivitySummary.pendingEnrollments} Pending`} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Pending Enrollments</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.pendingEnrollments}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Pending Terminations</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.pendingTerminations}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Pending Life Events</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.pendingLifeEvents}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Enrollment Changes in Progress</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.changesInProgress}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Enrollment Errors</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.enrollmentErrors}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Recently Completed Enrollments</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {enrollmentActivitySummary.completedThisWeek}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/enrollment-activity"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Review Pending Enrollments
          </Link>
          <Link
            href="/dashboard/billing-enrollment/enrollment/start"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Submit Enrollment Change
          </Link>
          <Link
            href="/dashboard/billing-enrollment/renewals/life-event"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Process Life Event
          </Link>
          <Link
            href="/dashboard/billing-enrollment/enrollment-activity/history"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Enrollment History
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Billing Summary</h2>
          <StatusBadge label={billingSummary.billingStatus} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Current Invoice Amount</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCurrency(billingSummary.currentInvoiceAmount)}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Invoice Due Date</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatDateLabel(billingSummary.invoiceDueDate)}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Outstanding Balance</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCurrency(billingSummary.outstandingBalance)}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-2">
            <dt className="text-[var(--text-secondary)]">Last Payment Amount</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCurrency(billingSummary.lastPaymentAmount)} on{' '}
              {formatDateLabel(billingSummary.lastPaymentDate)}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Billing Status</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {billingSummary.billingStatus}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/billing-overview"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Invoice
          </Link>
          <Link
            href="/dashboard/billing-enrollment/billing-payments"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Pay Invoice
          </Link>
          <Link
            href="/dashboard/billing-enrollment/billing-invoices/history"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Billing History
          </Link>
          <Link
            href="/dashboard/billing-enrollment/billing-export/pdf"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Download Statement
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reports &amp; Analytics</h2>
          <StatusBadge label="Tenant Scoped" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Employee Census Report', href: '/dashboard/billing-enrollment/reports' },
            { label: 'Enrollment Summary', href: '/dashboard/billing-enrollment/reports' },
            { label: 'Coverage Distribution', href: '/dashboard/billing-enrollment/reports/analytics' },
            { label: 'Billing Summary', href: '/dashboard/billing-enrollment/reports' },
            { label: 'Dependent Coverage Report', href: '/dashboard/billing-enrollment/reports' },
            { label: 'Eligibility Audit Report', href: '/dashboard/billing-enrollment/reports' }
          ].map((reportLink) => (
            <Link
              key={reportLink.label}
              href={reportLink.href}
              className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
            >
              {reportLink.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/reports"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Run Report
          </Link>
          <Link
            href="/dashboard/billing-enrollment/reports/export/employee-census?format=csv"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Export Data
          </Link>
          <Link
            href="/dashboard/billing-enrollment/reports/analytics"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Analytics
          </Link>
          <Link
            href="/dashboard/billing-enrollment/reports/schedule"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Schedule Report
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Document Center</h2>
          <StatusBadge label={`${documentSummary.recentDocumentsCount} Recent`} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Recent Documents</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{documentSummary.recentDocumentsCount}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Plan Documents</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{documentSummary.planDocuments}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Billing Statements</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{documentSummary.billingStatements}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Compliance Notices</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{documentSummary.complianceNotices}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-2">
            <dt className="text-[var(--text-secondary)]">Secure Messages / File Exchange</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{documentSummary.secureFileExchange}</dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/document-center"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Documents
          </Link>
          <Link
            href="/dashboard/billing-enrollment/document-center"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Upload Document
          </Link>
          <Link
            href="/dashboard/billing-enrollment/document-center/download/category/Billing%20Documents"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Download Statements
          </Link>
          <Link
            href="/dashboard/billing-enrollment/document-center"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Send Secure File
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Open Enrollment</h2>
          <StatusBadge
            label={
              openEnrollmentSummary.status === 'No Active Enrollment'
                ? 'No Active Enrollment'
                : `${openEnrollmentSummary.completionRate.toFixed(1)}% Complete`
            }
          />
        </div>
        {openEnrollmentSummary.status === 'No Active Enrollment' ? (
          <div className="mt-4">
            <EmptyState
              title="No open enrollment active"
              description="Open enrollment metrics and completion progress will appear when a cycle is configured."
            />
          </div>
        ) : (
          <>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <dt className="text-[var(--text-secondary)]">Start Date</dt>
                <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {formatDateLabel(openEnrollmentSummary.startDate)}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <dt className="text-[var(--text-secondary)]">End Date</dt>
                <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {formatDateLabel(openEnrollmentSummary.endDate)}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <dt className="text-[var(--text-secondary)]">Completed</dt>
                <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {openEnrollmentSummary.employeesCompleted}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <dt className="text-[var(--text-secondary)]">Pending</dt>
                <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {openEnrollmentSummary.employeesPending}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-2">
                <dt className="text-[var(--text-secondary)]">Completion Rate</dt>
                <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                  {openEnrollmentSummary.completionRate.toFixed(1)}%
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/dashboard/billing-enrollment/open-enrollment"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
              >
                View Enrollment Progress
              </Link>
              <Link
                href="/dashboard/billing-enrollment/open-enrollment#reminder-notifications"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
              >
                Send Reminder Notifications
              </Link>
              <Link
                href="/dashboard/billing-enrollment/open-enrollment/report/csv"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
              >
                Download Enrollment Report
              </Link>
              <Link
                href="/dashboard/billing-enrollment/open-enrollment#enrollment-progress-table"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
              >
                Review Enrollment Elections
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">HRIS &amp; Census Import</h2>
          <StatusBadge label={latestImportSummary.lastImportStatus} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Last Census Import Date</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatDateLabel(latestImportSummary.lastImportDate)}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Employees Added</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {latestImportSummary.employeesAdded}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Employees Updated</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {latestImportSummary.employeesUpdated}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Import Errors</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {latestImportSummary.importErrors}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-2">
            <dt className="text-[var(--text-secondary)]">Last Import Status</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {latestImportSummary.lastImportStatus}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/census-import"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Upload Census File
          </Link>
          <Link
            href="/dashboard/billing-enrollment/census-import/history"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Import History
          </Link>
          <Link
            href="/dashboard/billing-enrollment/census-import/errors"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Resolve Import Errors
          </Link>
          <Link
            href="/dashboard/billing-enrollment/census-import/integrations"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Configure HRIS Integration
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications &amp; Tasks</h2>
          <StatusBadge label={`${notificationsTaskSummary.openTasks} Open Tasks`} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Open Tasks</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{notificationsTaskSummary.openTasks}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">High Priority Alerts</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{notificationsTaskSummary.highPriorityAlerts}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Upcoming Deadlines</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{notificationsTaskSummary.upcomingDeadlines}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <dt className="text-[var(--text-secondary)]">Recent Notifications</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{notificationsTaskSummary.recentNotifications}</dd>
          </div>
        </dl>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {notificationsTaskSummary.taskItems.map((item) => (
            <li key={item} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/billing-enrollment/tasks"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Tasks
          </Link>
          <Link
            href="/dashboard/billing-enrollment/notifications"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            View Notifications
          </Link>
          <Link
            href="/dashboard/billing-enrollment/tasks"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Mark Tasks Complete
          </Link>
          <Link
            href="/dashboard/billing-enrollment/notifications/settings"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Manage Notification Settings
          </Link>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Administration</h2>
          <StatusBadge label={`${administrationSummary.activeAdministratorsCount} Active Admins`} />
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-[var(--text-secondary)]">Administrators</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{administrationSummary.administratorsCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-[var(--text-secondary)]">Billing Preferences</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {administrationSummary.billingConfigured ? 'Configured' : 'Missing Billing Contact'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-[var(--text-secondary)]">Notification Settings</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {administrationSummary.notificationsConfigured ? 'Configured' : 'Disabled'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-[var(--text-secondary)]">Integration Settings</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{administrationSummary.integrationsConfigured}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/dashboard/billing-enrollment/administration/profile"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Employer Profile
          </Link>
          <Link
            href="/dashboard/billing-enrollment/administration/users"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Manage Administrators
          </Link>
          <Link
            href="/dashboard/billing-enrollment/administration/billing-preferences"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Billing Preferences
          </Link>
          <Link
            href="/dashboard/billing-enrollment/administration/notification-settings"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Notification Settings
          </Link>
          <Link
            href="/dashboard/billing-enrollment/administration/integrations"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
          >
            Integration Settings
          </Link>
        </div>
      </section>

      {error ? (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
          role="status"
          aria-live="polite"
        >
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <LoadingState />
      ) : !data ? (
        <EmptyState
          title="No employer data available"
          description="Employer overview and operational alerts will appear once enrollment and billing records are available."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="portal-card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employer Overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Employer</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{data.overview.employerName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Plan Year</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{data.overview.planYear}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Eligible Employees</dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {data.overview.eligibleEmployees.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Employees Enrolled</dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {data.overview.employeesEnrolled.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Dependents Covered</dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {data.overview.dependentsCovered.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
                <dt className="text-[var(--text-secondary)]">Total Covered Lives</dt>
                <dd className="text-base font-semibold text-[var(--text-primary)]">
                  {(data.overview.employeesEnrolled + data.overview.dependentsCovered).toLocaleString()}
                </dd>
              </div>
            </dl>
          </article>

          <article className="portal-card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alerts &amp; Tasks</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Action Required</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Pending Enrollments</span>
                <StatusBadge label={`${data.alerts.pendingEnrollments}`} />
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Invoice Due</span>
                <StatusBadge label={`${data.alerts.invoiceDue}`} />
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Eligibility Errors</span>
                <StatusBadge label={`${data.alerts.eligibilityErrors}`} />
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Open Enrollment Deadline</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{data.alerts.openEnrollmentDeadline}</p>
              </li>
            </ul>
          </article>
        </section>
      )}
    </div>
  );
}
